import { ChatGroq } from "@langchain/groq";

const evaluateCriteria = {
  introduction: `
    - Clear thesis statement present
    - Sufficient background context
    - Main points clearly outlined
    - Engaging opening
  `,
  bodyParagraph: `
    - Clear topic sentence that directly supports the thesis
    - Strong supporting evidence and examples
    - Thorough analysis explaining the evidence
    - Clear connection back to thesis/main argument
    - Smooth transitions between ideas
    - Proper paragraph structure and organization
  `,
  conclusion: `
    - Effective restatement of thesis
    - Comprehensive summary of main points
    - Meaningful final insights or implications
    - Strong closing statement
    - Clear sense of closure
    - No new arguments introduced
  `
};

// Function to parse thesis statement and extract main points
export const parseThesisPoints = async (thesisContent) => {
  const llm = new ChatGroq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY,
    model: "llama3-70b-8192",
    temperature: 0,
    maxTokens: 2048,
  });

  const systemMessage = {
    role: 'system',
    content: `You are a JSON-only response analyzer. Analyze the thesis statement and extract main points for body paragraphs.

IMPORTANT: Return ONLY a valid JSON object with NO additional text, following this EXACT structure:
{
  "mainPoints": [
    {
      "point": "string",
      "keywords": ["keyword1", "keyword2"],
      "suggestedEvidence": ["evidence1", "evidence2"]
    }
  ]
}

Rules:
1. The response must be ONLY the JSON object
2. All property names must be in double quotes
3. All string values must be in double quotes
4. Arrays can be empty but must be present
5. NO comments or extra text allowed`
  };

  try {
    const response = await llm.invoke([
      systemMessage,
      { role: 'user', content: `Extract main points from this thesis: "${thesisContent}"` }
    ]);

    // Try to extract JSON if there's any extra text
    let jsonStr = response.content;
    if (jsonStr.includes('{')) {
      jsonStr = jsonStr.substring(jsonStr.indexOf('{'), jsonStr.lastIndexOf('}') + 1);
    }

    try {
      const parsedResponse = JSON.parse(jsonStr);
      
      // Validate the response structure
      if (!parsedResponse.mainPoints || !Array.isArray(parsedResponse.mainPoints)) {
        throw new Error('Invalid response structure');
      }

      // Ensure each point has the required fields
      parsedResponse.mainPoints = parsedResponse.mainPoints.map((point, index) => ({
        point: point.point || `Main Point ${index + 1}`,
        keywords: Array.isArray(point.keywords) ? point.keywords : [],
        suggestedEvidence: Array.isArray(point.suggestedEvidence) ? point.suggestedEvidence : []
      }));

      return parsedResponse;
    } catch (parseError) {
      console.error('Failed to parse response:', jsonStr);
      // Return a default structure
      return {
        mainPoints: [
          {
            point: "Main Argument",
            keywords: [],
            suggestedEvidence: []
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error parsing thesis points:', error);
    // Return a default structure instead of throwing
    return {
      mainPoints: [
        {
          point: "Main Argument",
          keywords: [],
          suggestedEvidence: []
        }
      ]
    };
  }
};

// Function to generate new body sections
export const generateBodySections = (mainPoints) => {
  if (!Array.isArray(mainPoints)) {
    throw new Error('Invalid main points structure');
  }
  
  return mainPoints.map((point, index) => ({
    id: `body-${Date.now()}-${index + 1}`,
    title: `Body Paragraph ${index + 1}: ${point.point}`,
    type: 'body',
    percentage: 0,
    keywords: point.keywords,
    suggestedEvidence: point.suggestedEvidence
  }));
};

// Section completeness checker
export const checkSectionCompleteness = async (content, sectionType, previousContent = null) => {
  const llm = new ChatGroq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY,
    model: "llama3-70b-8192",
    temperature: 0,
    maxTokens: 2048,
  });

  // Determine the section type and get appropriate criteria
  let criteria;
  if (sectionType.toLowerCase().includes('introduction')) {
    criteria = evaluateCriteria.introduction;
  } else if (sectionType.toLowerCase().includes('body paragraph')) {
    criteria = evaluateCriteria.bodyParagraph;
  } else if (sectionType.toLowerCase().includes('conclusion')) {
    criteria = evaluateCriteria.conclusion;
  } else {
    throw new Error('Invalid section type');
  }

  const systemMessage = {
    role: 'system',
    content: `You are a JSON-only response analyzer. Evaluate the given ${sectionType} section against specific criteria.

IMPORTANT: Return ONLY a valid JSON object with NO additional text, following this EXACT structure:
{
  "isComplete": false,
  "completionStatus": {
    "met": ["criteria met 1", "criteria met 2"],
    "missing": ["missing criteria 1", "missing criteria 2"]
  },
  "feedbackItems": ["feedback 1", "feedback 2"],
  "suggestedImprovements": ["improvement 1", "improvement 2"]
}

Evaluate against these criteria:
${criteria}

Rules:
1. The response must be ONLY the JSON object
2. All property names must be in double quotes
3. All string values must be in double quotes
4. Arrays can be empty but must be present
5. NO comments or extra text allowed`
  };

  try {
    const response = await llm.invoke([
      systemMessage,
      {
        role: 'user',
        content: previousContent 
          ? `Previous section: "${previousContent}"\nCurrent section: "${content}"`
          : `Analyze this content: "${content}"`
      }
    ]);

    // Try to extract JSON if there's any extra text
    let jsonStr = response.content;
    if (jsonStr.includes('{')) {
      jsonStr = jsonStr.substring(jsonStr.indexOf('{'), jsonStr.lastIndexOf('}') + 1);
    }

    try {
      const parsedResponse = JSON.parse(jsonStr);

      // Validate and normalize the response
      const normalizedResponse = {
        isComplete: false,
        completionStatus: {
          met: Array.isArray(parsedResponse?.completionStatus?.met) 
            ? parsedResponse.completionStatus.met 
            : [],
          missing: Array.isArray(parsedResponse?.completionStatus?.missing) 
            ? parsedResponse.completionStatus.missing 
            : ['Requirements need to be reviewed']
        },
        feedbackItems: Array.isArray(parsedResponse?.feedbackItems) 
          ? parsedResponse.feedbackItems 
          : [],
        suggestedImprovements: Array.isArray(parsedResponse?.suggestedImprovements) 
          ? parsedResponse.suggestedImprovements 
          : []
      };

      // Determine completion status
      normalizedResponse.isComplete = 
        Array.isArray(normalizedResponse.completionStatus.missing) && 
        normalizedResponse.completionStatus.missing.length === 0;

      return normalizedResponse;

    } catch (parseError) {
      console.error('Failed to parse response:', jsonStr);
      // Return a structured response for analysis failure
      return {
        isComplete: false,
        completionStatus: {
          met: [],
          missing: ['Please review the section requirements']
        },
        feedbackItems: ['Analysis could not be completed'],
        suggestedImprovements: ['Please try analyzing the section again']
      };
    }

  } catch (error) {
    console.error('Error during section analysis:', error);
    // Return a fallback response
    return {
      isComplete: false,
      completionStatus: {
        met: [],
        missing: ['Section analysis failed']
      },
      feedbackItems: ['Unable to complete analysis'],
      suggestedImprovements: ['Please try again']
    };
  }
};