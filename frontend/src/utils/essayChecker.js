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
  if (!jsonString) return [];
  
  // If it's already an object, return it
  if (typeof jsonString === 'object') return jsonString;

  try {
    // First try direct parsing
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (e) {
    try {
      // Extract JSON array pattern
      let cleaned = jsonString;
      
      // If the response contains markdown code blocks, extract the JSON
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleaned = codeBlockMatch[1];
      }

      // Find JSON array pattern if not in code block
      if (!cleaned.trim().startsWith('[')) {
        const arrayMatch = cleaned.match(/\[\s*{[\s\S]*}\s*\]/);
        if (arrayMatch) {
          cleaned = arrayMatch[0];
        }
      }

      // Progressive cleaning steps
      cleaned = cleaned
        // Remove line breaks and extra spaces
        .replace(/\s+/g, ' ')
        // Remove any non-printable characters
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        // Ensure property names are properly quoted
        .replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Standardize quotes
        .replace(/'/g, '"')
        // Fix double quotes around property values
        .replace(/:\s*"([^"]*)"/g, ':"$1"')
        // Fix unquoted values
        .replace(/:\s*([^,}\]]*)/g, (match, value) => {
          // Don't quote numbers or booleans
          if (/^(\-?\d+\.?\d*|true|false|null)$/.test(value.trim())) {
            return `:${value.trim()}`;
          }
          return `:"${value.trim()}"`;
        })
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix escaped quotes
        .replace(/\\"/g, '"')
        .replace(/""/g, '"')
        // Ensure array elements are properly separated
        .replace(/}(\s*){/g, '},{')
        .trim();

      // Final validation and parsing
      if (!cleaned.startsWith('[')) cleaned = `[${cleaned}]`;
      if (!cleaned.endsWith(']')) cleaned = `${cleaned}]`;

      const parsed = JSON.parse(cleaned);
      
      // Validate structure
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (innerError) {
      console.error('JSON parsing failed:', innerError);
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
      await delay(waitTime);
      return checkEssayErrors(content, attempt + 1);
    }

    RATE_LIMIT.requests.push(now);

    const llm = new ChatGroq({
      apiKey: process.env.REACT_APP_GROQ_API_KEY,
      model: "llama3-70b-8192",
      temperature: 0,
      maxTokens: 2048
    });

    const systemMessage = {
      role: 'system',
      content: `You are an essay error detection system. Analyze the text and return ONLY a JSON array containing found errors in this exact format:
[{
  "category": "one of: spelling|punctuation|lexicoSemantic|stylistic|typographical",
  "type": "specific_error_type",
  "message": "Clear explanation of the error",
  "suggestions": ["improvement1", "improvement2"],
  "text": "the problematic text"
}]

Return only the JSON array, no other text or explanation. Ensure all strings use double quotes, not single quotes.`
    };

    const response = await llm.invoke([
      systemMessage,
      { role: 'user', content: `Find errors in this text: "${content}"` }
    ]);

    const errors = cleanAndParseJSON(response.content);
    
    // Validate and categorize errors
    const categorizedErrors = Object.keys(ERROR_CATEGORIES).reduce((acc, category) => {
      acc[category] = errors
        .filter(error => error?.category?.toLowerCase() === category.toLowerCase())
        .map(error => ({
          text: String(error.text || ''),
          message: String(error.message || ''),
          type: String(error.type || ''),
          suggestions: Array.isArray(error.suggestions) ? error.suggestions.map(String) : []
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