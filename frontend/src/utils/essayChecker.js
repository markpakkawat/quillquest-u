import { ChatGroq } from "@langchain/groq";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 10000,
  requests: [],
  retryDelay: 1000
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const getRetryDelay = (attempt) => Math.min(RATE_LIMIT.retryDelay * Math.pow(2, attempt), 32000);

const ERROR_CATEGORIES = {
  spelling: [
    'typing_errors',
    'unrecognizable_typing_errors',
    'inflectional_noun_endings',
    'syntactic',
    'capital_letters',
    'compounds'
  ],
  punctuation: [
    'comma',
    'colon',
    'semicolon',
    'dot',
    'triple_dot',
    'constituents',
    'clauses'
  ],
  lexicoSemantic: [
    'broken_meaningfulness',
    'missing_words',
    'incorrect_possessives',
    'incorrect_lexical_choice'
  ],
  stylistic: [
    'incorrect_register',
    'repeated_expressions',
    'noun_cumulation',
    'passive_usage',
    'word_order',
    'clumsy_expressions',
    'sentence_length'
  ],
  typographical: [
    'local_formatting',
    'document_layout',
    'visualization'
  ]
};

const cleanAndParseJSON = (jsonString) => {
  console.log('Original response:', jsonString);
  let cleaned = '';
  
  try {
    // First try direct parsing
    return JSON.parse(jsonString);
  } catch (e) {
    try {
      // Try to find JSON array in the response
      const match = jsonString.match(/\[\s*{[\s\S]*}\s*\]/);
      if (!match) {
        console.error('No JSON array pattern found in response');
        return [];
      }

      cleaned = match[0];
      console.log('Matched JSON:', cleaned);

      // Step by step cleaning
      const cleaningSteps = [
        // Remove newlines and extra spaces
        [/\s+/g, ' '],
        // Ensure property names are properly quoted
        [/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'],
        // Fix single quotes to double quotes
        [/:\s*'([^']*)'/g, ':"$1"'],
        // Remove trailing commas
        [/,(\s*[}\]])/g, '$1'],
        // Ensure string values are properly quoted
        [/:\s*([^"][^,}\]]*)/g, ':"$1"'],
        // Fix escaped quotes
        [/\\"/g, '"'],
        [/""/g, '"'],
        // Remove any remaining illegal characters
        [/[\x00-\x1F\x7F-\x9F]/g, '']
      ];

      // Apply each cleaning step and log the result
      cleaningSteps.forEach(([regex, replacement], index) => {
        const before = cleaned;
        cleaned = cleaned.replace(regex, replacement);
        if (before !== cleaned) {
          console.log(`Cleaning step ${index + 1}:`, cleaned);
        }
      });

      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        // If still fails, try one more aggressive cleaning
        cleaned = cleaned
          .replace(/[^\[\]{}:,"\w\s.-]/g, '') // Remove any non-JSON characters
          .replace(/"\s+"/g, '" "')          // Fix spaces between strings
          .replace(/\s+/g, ' ')              // Normalize whitespace
          .trim();

        console.log('Final cleaning attempt:', cleaned);
        return JSON.parse(cleaned);
      }
    } catch (innerError) {
      console.error('JSON Cleaning Steps Failed:', innerError);
      console.error('Final attempted JSON:', cleaned);
      return [];
    }
  }
};

export const checkEssayErrors = async (content, attempt = 0) => {
  try {
    // Rate limiting check
    const now = Date.now();
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
      time => now - time < RATE_LIMIT.windowMs
    );

    if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
      const waitTime = getRetryDelay(attempt);
      console.log(`Rate limit reached, waiting ${waitTime}ms before retry`);
      await delay(waitTime);
      return checkEssayErrors(content, attempt + 1);
    }

    // Track this request
    RATE_LIMIT.requests.push(now);

    const llm = new ChatGroq({
      apiKey: process.env.REACT_APP_GROQ_API_KEY,
      model: "llama3-70b-8192",
      temperature: 0,
      maxTokens: 2048,
    });

    const systemMessage = {
      role: 'system',
      content: `You are an essay error detection system. Return ONLY a JSON array of objects with this EXACT structure, nothing else:
[
  {
    "category": "spelling",
    "type": "typing_errors",
    "message": "Error explanation",
    "suggestions": ["suggestion1"],
    "text": "problematic text"
  }
]

Categories must be one of: spelling, punctuation, lexicoSemantic, stylistic, typographical.
Do not include any explanations or text outside the JSON array.
Ensure all property names and string values are in double quotes.
Do not use single quotes.
Do not add trailing commas.

Check for:
1. Spelling: typing mistakes, noun endings, agreement errors, capitalization, compounds
2. Punctuation: commas, colons, semicolons, periods, clause separation
3. Lexico-Semantic: unclear meanings, missing words, possessives, word choice
4. Stylistic: informal language, repetition, passive voice, word order, complexity
5. Typographical: spacing, layout, formatting`
    };

    const userMessage = {
      role: 'user',
      content: `Return ONLY a proper JSON array of errors found in this text: "${content}"`
    };

    const response = await llm.invoke([systemMessage, userMessage]);
    
    // Parse and validate response
    let errors = cleanAndParseJSON(response.content);
    
    if (!Array.isArray(errors)) {
      console.error('AI response is not an array:', errors);
      errors = [];
    }

    // Categorize errors
    const categorizedErrors = Object.keys(ERROR_CATEGORIES).reduce((acc, category) => {
      acc[category] = errors
        .filter(error => error.category === category)
        .map(error => ({
          text: error.text || '',
          message: error.message || '',
          type: error.type || '',
          suggestions: Array.isArray(error.suggestions) ? error.suggestions : []
        }));
      return acc;
    }, {});

    // Ensure all categories exist
    Object.keys(ERROR_CATEGORIES).forEach(category => {
      if (!categorizedErrors[category]) {
        categorizedErrors[category] = [];
      }
    });

    return categorizedErrors;

  } catch (error) {
    if (error.response?.status === 429) {
      const waitTime = getRetryDelay(attempt);
      console.warn(`Rate limit reached. Retrying in ${waitTime}ms...`);
      await delay(waitTime);
      return checkEssayErrors(content, attempt + 1);
    }

    console.error('Error checking essay:', error);
    return Object.keys(ERROR_CATEGORIES).reduce((acc, category) => {
      acc[category] = [];
      return acc;
    }, {});
  }
};