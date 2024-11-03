import { ChatGroq } from "@langchain/groq";

export const analyzeWritingStyle = async (text) => {
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
    "passiveVoiceInstances": number,
    "suggestions": ["suggestion1", "suggestion2"]
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
      "academicVocabularyScore": number (0-100),
      "uniqueWordsRatio": number (0-100)
    },
    "paragraphCohesion": {
      "score": number (0-100),
      "transitionStrength": "Strong|Moderate|Weak",
      "logicalFlowScore": number (0-100)
    }
  }
}`
  };

  try {
    const response = await llm.invoke([
      systemMessage,
      { role: 'user', content: `Analyze this text: "${text}"` }
    ]);

    let jsonStr = response.content;
    if (jsonStr.includes('{')) {
      jsonStr = jsonStr.substring(jsonStr.indexOf('{'), jsonStr.lastIndexOf('}') + 1);
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing writing style:', error);
    return null;
  }
};

// Helper functions for aggregating style analyses
export const aggregateStyleAnalyses = (analyses) => {
  if (!analyses.length) return null;

  const aggregated = analyses.reduce((acc, style) => {
    if (!style) return acc;

    return {
      tone: {
        formal: acc.tone.formal + (style.tone.type === 'Formal' ? 1 : 0),
        informal: acc.tone.informal + (style.tone.type === 'Informal' ? 1 : 0),
        neutral: acc.tone.neutral + (style.tone.type === 'Neutral' ? 1 : 0),
        characteristics: [...acc.tone.characteristics, ...style.tone.characteristics]
      },
      voice: {
        activePercentage: acc.voice.activePercentage + style.voice.activeVoicePercentage,
        totalPassiveInstances: acc.voice.totalPassiveInstances + style.voice.passiveVoiceInstances,
        suggestions: [...acc.voice.suggestions, ...style.voice.suggestions]
      },
      clarity: {
        averageScore: acc.clarity.averageScore + style.clarity.score,
        strengths: [...acc.clarity.strengths, ...style.clarity.strengths],
        improvements: [...acc.clarity.improvements, ...style.clarity.improvements]
      },
      complexity: {
        sentenceStructure: {
          averageScore: acc.complexity.sentenceStructure.averageScore + style.complexity.sentenceStructure.score,
          averageLength: acc.complexity.sentenceStructure.averageLength + style.complexity.sentenceStructure.averageLength
        },
        wordChoice: {
          complexWords: acc.complexity.wordChoice.complexWords + style.complexity.wordChoice.complexWordsPercentage,
          academicVocabulary: acc.complexity.wordChoice.academicVocabulary + style.complexity.wordChoice.academicVocabularyScore
        },
        paragraphCohesion: {
          averageScore: acc.complexity.paragraphCohesion.averageScore + style.complexity.paragraphCohesion.score,
          transitionStrengths: [...acc.complexity.paragraphCohesion.transitionStrengths, style.complexity.paragraphCohesion.transitionStrength]
        }
      }
    };
  }, {
    tone: { formal: 0, informal: 0, neutral: 0, characteristics: [] },
    voice: { activePercentage: 0, totalPassiveInstances: 0, suggestions: [] },
    clarity: { averageScore: 0, strengths: [], improvements: [] },
    complexity: {
      sentenceStructure: { averageScore: 0, averageLength: 0 },
      wordChoice: { complexWords: 0, academicVocabulary: 0 },
      paragraphCohesion: { averageScore: 0, transitionStrengths: [] }
    }
  });

  const count = analyses.length;
  return {
    tone: {
      dominant: getDominantTone(aggregated.tone),
      characteristics: [...new Set(aggregated.tone.characteristics)].slice(0, 3)
    },
    voice: {
      activePercentage: Math.round(aggregated.voice.activePercentage / count),
      averagePassiveInstances: Math.round(aggregated.voice.totalPassiveInstances / count),
      commonSuggestions: [...new Set(aggregated.voice.suggestions)].slice(0, 3)
    },
    clarity: {
      score: Math.round(aggregated.clarity.averageScore / count),
      commonStrengths: [...new Set(aggregated.clarity.strengths)].slice(0, 3),
      commonImprovements: [...new Set(aggregated.clarity.improvements)].slice(0, 3)
    },
    complexity: {
      sentenceStructure: {
        score: Math.round(aggregated.complexity.sentenceStructure.averageScore / count),
        averageLength: Math.round(aggregated.complexity.sentenceStructure.averageLength / count)
      },
      wordChoice: {
        complexWordsPercentage: Math.round(aggregated.complexity.wordChoice.complexWords / count),
        academicVocabularyScore: Math.round(aggregated.complexity.wordChoice.academicVocabulary / count)
      },
      paragraphCohesion: {
        score: Math.round(aggregated.complexity.paragraphCohesion.averageScore / count),
        dominantTransitionStrength: getMostCommonValue(aggregated.complexity.paragraphCohesion.transitionStrengths)
      }
    }
  };
};

// Helper functions for tone analysis
const getDominantTone = (toneStats) => {
  const { formal, informal, neutral } = toneStats;
  if (formal > informal && formal > neutral) return 'Formal';
  if (informal > formal && informal > neutral) return 'Informal';
  return 'Neutral';
};

const getMostCommonValue = (array) => {
  return array.sort((a, b) =>
    array.filter(v => v === a).length - array.filter(v => v === b).length
  ).pop();
};