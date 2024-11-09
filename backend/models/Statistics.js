// models/Statistics.js
const mongoose = require('mongoose');

const StatisticsSchema = new mongoose.Schema({
  overall: {
    wordCount: { type: Number, required: true },
    sentenceCount: { type: Number, required: true },
    paragraphCount: { type: Number, required: true },
    averageWordsPerSentence: { type: Number, required: true },
    totalErrors: { type: Number, default: 0 },
    requirementsMet: { type: Number, required: true },
    requirementsTotal: { type: Number, required: true }
  },
  writingMetrics: {
    clarity: {
      score: { type: Number, required: true, min: 0, max: 100 },
      strengths: [String],
      improvements: [String]
    },
    complexity: {
      sentenceStructure: {
        score: { type: Number, required: true, min: 0 },
        averageLength: { type: Number, required: true }
      },
      wordChoice: {
        complexWordsPercentage: { type: Number, required: true },
        academicVocabularyScore: { type: Number, default: 0 }
      },
      paragraphCohesion: {
        score: { type: Number, required: true },
        transitionStrength: { 
          type: String, 
          enum: ['weak', 'moderate', 'strong'],
          default: 'moderate'
        }
      }
    },
    tone: {
      type: { 
        type: String,
        enum: ['formal', 'informal', 'neutral'],
        default: 'neutral'
      },
      characteristics: [String]
    },
    voice: {
      activeVoicePercentage: { type: Number, default: 0 },
      passiveInstances: { type: Number, default: 0 }
    }
  },
  improvements: [String],
  commonMissingRequirements: [String],
  overallProgress: {
    errorReduction: { type: Number, default: 0 },
    clarityImprovement: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Statistics', StatisticsSchema);