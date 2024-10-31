import { ChatGroq } from "@langchain/groq";

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

export const checkEssayErrors = async (content) => {
  try {
    const llm = new ChatGroq({
      apiKey: process.env.REACT_APP_GROQ_API_KEY,
      model: "llama3-70b-8192",
      temperature: 0,
      maxTokens: 2048,
    });

    const systemMessage = {
      role: 'system',
      content: `You are an advanced essay error detection system. Analyze the text and identify ALL errors without any limit, returning them ONLY as a JSON array. Check for these specific error types:

1. Spelling Errors - Look for:
   - Basic typing mistakes (e.g., "teh" instead of "the")
   - Advanced spelling issues (i/y, s/z variations)
   - Incorrect noun endings
   - Agreement errors
   - Capitalization mistakes
   - Compound word errors

2. Punctuation Errors - Check for:
   - Missing or incorrect commas
   - Colon and semicolon misuse
   - Period/dot issues
   - Missing punctuation between clauses
   - Incorrect coordination punctuation

3. Lexico-Semantic Errors - Identify:
   - Phrases that lack clear meaning
   - Missing necessary words
   - Incorrect possessive forms (its/it's)
   - Wrong word choices
   - Semantic contradictions
   - Improper word combinations

4. Stylistic Errors - Look for:
   - Informal language in formal context
   - Word repetition
   - Excessive passive voice
   - Poor word order
   - Overly complex sentences
   - Awkward expressions

5. Typographical Errors - Check:
   - Spacing issues
   - Document structure problems
   - Layout inconsistencies
   - Formatting errors

For EACH error found, create an object:
{
  "category": "exactly one of: spelling, punctuation, lexicoSemantic, stylistic, typographical",
  "type": "specific subcategory from the error type list",
  "message": "clear explanation of the error",
  "suggestions": ["specific correction suggestions"],
  "text": "the exact problematic text"
}

IMPORTANT:
- Return ALL errors found, with no limit per category
- Do not skip any errors
- Include every instance of repeated errors
- Return ONLY the JSON array, with no additional text or explanations
- Check the entire text thoroughly`
    };

    const userMessage = {
      role: 'user',
      content: `Analyze this text for ALL errors and return ONLY a JSON array. Find every single error: "${content}"`
    };

    const aiResponse = await llm.invoke([systemMessage, userMessage]);
    
    // Parse response
    let errors = [];
    const possibleJSON = aiResponse.content.trim();
    
    try {
      errors = JSON.parse(possibleJSON);
    } catch (e) {
      const jsonMatch = possibleJSON.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        try {
          errors = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('Failed to parse extracted JSON:', innerError);
        }
      }
    }

    if (!Array.isArray(errors)) {
      console.error('AI response is not an array:', errors);
      errors = [];
    }

    // Validate and categorize errors - now without limits
    const categorizedErrors = Object.keys(ERROR_CATEGORIES).reduce((acc, category) => {
      acc[category] = errors
        .filter(error => error.category === category)
        .map(error => ({
          ...error,
          suggestions: Array.isArray(error.suggestions) ? 
            error.suggestions : []
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
    console.error('Error checking essay:', error);
    return Object.keys(ERROR_CATEGORIES).reduce((acc, category) => {
      acc[category] = [];
      return acc;
    }, {});
  }
};