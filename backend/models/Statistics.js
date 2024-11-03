// models/Statistics.js
const mongoose = require('mongoose');

const StatisticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  essayId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  writingMetrics: {
    clarity: {
      score: Number,
      strengths: [String],
      improvements: [String]
    },
    complexity: {
      sentenceStructure: {
        score: Number,
        averageLength: Number
      },
      wordChoice: {
        complexWordsPercentage: Number,
        academicVocabularyScore: Number
      },
      paragraphCohesion: {
        score: Number,
        transitionStrength: String
      }
    },
    tone: {
      type: String,
      characteristics: [String]
    },
    voice: {
      activeVoicePercentage: Number,
      passiveInstances: Number
    }
  },
  errorMetrics: {
    totalErrors: Number,
    categorizedErrors: {
      spelling: Number,
      punctuation: Number,
      lexicoSemantic: Number,
      stylistic: Number,
      typographical: Number
    },
    improvements: [String]
  }
});

module.exports = mongoose.model('Statistics', StatisticsSchema);