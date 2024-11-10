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

export const analyzeWritingStyle = async (text, attempt = 0) => {
  try {
    // Remove old requests outside the window
    const now = Date.now();
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(
      time => now - time < RATE_LIMIT.windowMs
    );

    // Check if we're within rate limits
    if (RATE_LIMIT.requests.length >= RATE_LIMIT.maxRequests) {
      const waitTime = getRetryDelay(attempt);
      console.log(`Rate limit reached, waiting ${waitTime}ms before retry`);
      await delay(waitTime);
      return analyzeWritingStyle(text, attempt + 1);
    }

    // Track this request
    RATE_LIMIT.requests.push(now);

    const llm = new ChatGroq({
      apiKey: process.env.REACT_APP_GROQ_API_KEY,
      model: "llama3-70b-8192",
      temperature: 0,
      maxTokens: 1024,
    });

    const systemMessage = {
      role: 'system',
      content: `Analyze the writing style of the given text and return ONLY a JSON object with the following structure:
{
  "tone": {
    "type": "Formal|Informal|Neutral",
    "confidence": number (0-100),
    "characteristics": ["characteristic1", "characteristic2"]
  },
  "voice": {
    "type": "Active|Passive|Mixed",
    "activeVoicePercentage": number (0-100),
    "passiveVoiceInstances": number
  },
  "clarity": {
    "score": number (0-100),
    "level": "High|Moderate|Low",
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"]
  },
  "complexity": {
    "sentenceStructure": {
      "score": number (0-100),
      "averageLength": number,
      "varietyScore": number (0-100)
    },
    "wordChoice": {
      "complexWordsPercentage": number (0-100),
      "academicVocabularyScore": number (0-100)
    },
    "paragraphCohesion": {
      "score": number (0-100),
      "transitionStrength": "Strong|Moderate|Weak",
      "logicalFlowScore": number (0-100)
    }
  }
}`
    };

    const response = await llm.invoke([
      systemMessage,
      { role: 'user', content: `Analyze this text: "${text}"` }
    ]);

    let jsonStr = response.content;
    if (jsonStr.includes('{')) {
      jsonStr = jsonStr.substring(jsonStr.indexOf('{'), jsonStr.lastIndexOf('}') + 1);
    }

    const analysis = JSON.parse(jsonStr);
    
    // Validate and ensure all expected properties exist
    return {
      tone: {
        type: analysis.tone?.type || "Neutral",
        confidence: analysis.tone?.confidence || 0,
        characteristics: Array.isArray(analysis.tone?.characteristics) 
          ? analysis.tone.characteristics 
          : []
      },
      voice: {
        type: analysis.voice?.type || "Mixed",
        activeVoicePercentage: analysis.voice?.activeVoicePercentage || 0,
        passiveVoiceInstances: analysis.voice?.passiveVoiceInstances || 0
      },
      clarity: {
        score: analysis.clarity?.score || 0,
        level: analysis.clarity?.level || "Moderate",
        strengths: Array.isArray(analysis.clarity?.strengths) 
          ? analysis.clarity.strengths 
          : [],
        improvements: Array.isArray(analysis.clarity?.improvements) 
          ? analysis.clarity.improvements 
          : []
      },
      complexity: {
        sentenceStructure: {
          score: analysis.complexity?.sentenceStructure?.score || 0,
          averageLength: analysis.complexity?.sentenceStructure?.averageLength || 0,
          varietyScore: analysis.complexity?.sentenceStructure?.varietyScore || 0
        },
        wordChoice: {
          complexWordsPercentage: analysis.complexity?.wordChoice?.complexWordsPercentage || 0,
          academicVocabularyScore: analysis.complexity?.wordChoice?.academicVocabularyScore || 0
        },
        paragraphCohesion: {
          score: analysis.complexity?.paragraphCohesion?.score || 0,
          transitionStrength: analysis.complexity?.paragraphCohesion?.transitionStrength || "Moderate",
          logicalFlowScore: analysis.complexity?.paragraphCohesion?.logicalFlowScore || 0
        }
      }
    };

  } catch (error) {
    if (error.response?.status === 429) {
      const waitTime = getRetryDelay(attempt);
      console.warn(`Groq API rate limit reached. Retrying in ${waitTime}ms...`);
      await delay(waitTime);
      return analyzeWritingStyle(text, attempt + 1);
    }
    console.error('Writing analysis error:', error);
    return getDefaultAnalysis();
  }
};

export const aggregateStyleAnalyses = (analyses) => {
  if (!Array.isArray(analyses) || analyses.length === 0) return getDefaultAnalysis();

  const validAnalyses = analyses.filter(Boolean);
  if (validAnalyses.length === 0) return getDefaultAnalysis();

  const aggregated = validAnalyses.reduce((acc, style) => {
    if (!style) return acc;

    return {
      tone: {
        formal: acc.tone.formal + (style.tone?.type === 'Formal' ? 1 : 0),
        informal: acc.tone.informal + (style.tone?.type === 'Informal' ? 1 : 0),
        neutral: acc.tone.neutral + (style.tone?.type === 'Neutral' ? 1 : 0),
        characteristics: [...acc.tone.characteristics, ...(style.tone?.characteristics || [])]
      },
      voice: {
        activePercentage: acc.voice.activePercentage + (style.voice?.activeVoicePercentage || 0),
        totalPassiveInstances: acc.voice.totalPassiveInstances + (style.voice?.passiveVoiceInstances || 0)
      },
      clarity: {
        averageScore: acc.clarity.averageScore + (style.clarity?.score || 0),
        strengths: [...acc.clarity.strengths, ...(style.clarity?.strengths || [])],
        improvements: [...acc.clarity.improvements, ...(style.clarity?.improvements || [])]
      },
      complexity: {
        sentenceStructure: {
          averageScore: acc.complexity.sentenceStructure.averageScore + (style.complexity?.sentenceStructure?.score || 0),
          averageLength: acc.complexity.sentenceStructure.averageLength + (style.complexity?.sentenceStructure?.averageLength || 0),
          varietyScore: acc.complexity.sentenceStructure.varietyScore + (style.complexity?.sentenceStructure?.varietyScore || 0)
        },
        wordChoice: {
          complexWords: acc.complexity.wordChoice.complexWords + (style.complexity?.wordChoice?.complexWordsPercentage || 0),
          academicVocabulary: acc.complexity.wordChoice.academicVocabulary + (style.complexity?.wordChoice?.academicVocabularyScore || 0)
        },
        paragraphCohesion: {
          averageScore: acc.complexity.paragraphCohesion.averageScore + (style.complexity?.paragraphCohesion?.score || 0),
          transitionStrengths: [...acc.complexity.paragraphCohesion.transitionStrengths, style.complexity?.paragraphCohesion?.transitionStrength || 'Moderate']
        }
      }
    };
  }, {
    tone: { formal: 0, informal: 0, neutral: 0, characteristics: [] },
    voice: { activePercentage: 0, totalPassiveInstances: 0 },
    clarity: { averageScore: 0, strengths: [], improvements: [] },
    complexity: {
      sentenceStructure: { averageScore: 0, averageLength: 0, varietyScore: 0 },
      wordChoice: { complexWords: 0, academicVocabulary: 0 },
      paragraphCohesion: { averageScore: 0, transitionStrengths: [] }
    }
  });

  const count = validAnalyses.length;

  return {
    tone: {
      type: getDominantTone(aggregated.tone),
      characteristics: [...new Set(aggregated.tone.characteristics)].slice(0, 3)
    },
    voice: {
      type: aggregated.voice.activePercentage > 70 ? 'Active' : 
            aggregated.voice.activePercentage < 30 ? 'Passive' : 'Mixed',
      activeVoicePercentage: Math.round(aggregated.voice.activePercentage / count),
      passiveVoiceInstances: Math.round(aggregated.voice.totalPassiveInstances / count)
    },
    clarity: {
      score: Math.round(aggregated.clarity.averageScore / count),
      level: getClarityLevel(Math.round(aggregated.clarity.averageScore / count)),
      strengths: [...new Set(aggregated.clarity.strengths)].slice(0, 3),
      improvements: [...new Set(aggregated.clarity.improvements)].slice(0, 3)
    },
    complexity: {
      sentenceStructure: {
        score: Math.round(aggregated.complexity.sentenceStructure.averageScore / count),
        averageLength: Math.round(aggregated.complexity.sentenceStructure.averageLength / count),
        varietyScore: Math.round(aggregated.complexity.sentenceStructure.varietyScore / count)
      },
      wordChoice: {
        complexWordsPercentage: Math.round(aggregated.complexity.wordChoice.complexWords / count),
        academicVocabularyScore: Math.round(aggregated.complexity.wordChoice.academicVocabulary / count)
      },
      paragraphCohesion: {
        score: Math.round(aggregated.complexity.paragraphCohesion.averageScore / count),
        transitionStrength: getMostCommonValue(aggregated.complexity.paragraphCohesion.transitionStrengths),
        logicalFlowScore: Math.round(aggregated.complexity.paragraphCohesion.averageScore / count)
      }
    }
  };
};

const getDominantTone = (toneStats) => {
  const { formal, informal, neutral } = toneStats;
  if (formal > informal && formal > neutral) return 'Formal';
  if (informal > formal && informal > neutral) return 'Informal';
  return 'Neutral';
};

const getClarityLevel = (score) => {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Moderate';
  return 'Low';
};

const getMostCommonValue = (array) => {
  if (!array.length) return 'Moderate';
  return array.sort((a, b) =>
    array.filter(v => v === a).length - array.filter(v => v === b).length
  ).pop();
};

export const getDefaultAnalysis = () => ({
  tone: {
    type: "Neutral",
    confidence: 0,
    characteristics: []
  },
  voice: {
    type: "Mixed",
    activeVoicePercentage: 0,
    passiveVoiceInstances: 0
  },
  clarity: {
    score: 0,
    level: "Analyzing...",
    strengths: [],
    improvements: []
  },
  complexity: {
    sentenceStructure: {
      score: 0,
      averageLength: 0,
      varietyScore: 0
    },
    wordChoice: {
      complexWordsPercentage: 0,
      academicVocabularyScore: 0
    },
    paragraphCohesion: {
      score: 0,
      transitionStrength: "Moderate",
      logicalFlowScore: 0
    }
  }
});