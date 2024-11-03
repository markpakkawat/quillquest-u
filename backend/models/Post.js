const mongoose = require('mongoose');

const SectionStatSchema = new mongoose.Schema({
  title: String,
  content: String,
  errors: {
    spelling: Number,
    punctuation: Number,
    lexicoSemantic: Number,
    stylistic: Number,
    typographical: Number
  },
  requirements: {
    met: [String],
    missing: [String]
  },
  statistics: {
    wordCount: Number,
    completionTime: Number,
    clarity: Number,
    complexityScore: Number
  }
});

const WritingMetricsSchema = new mongoose.Schema({
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
});

const PostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  postType: {
    type: String,
    enum: ['discussion', 'advice'],
    required: true
  },
  prompt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prompt'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // New fields for essay statistics
  sections: [SectionStatSchema],
  statistics: {
    overall: {
      wordCount: Number,
      completionTime: Number,
      totalErrors: Number,
      requirementsMet: Number,
      requirementsTotal: Number
    },
    writingMetrics: WritingMetricsSchema,
    improvements: [{
      category: String,
      percentage: Number,
      description: String
    }]
  },
  // Track revision history
  revisions: [{
    date: {
      type: Date,
      default: Date.now
    },
    changes: [{
      type: String,
      description: String,
      improvement: Number
    }]
  }]
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

// Add indexes for better performance
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ 'statistics.overall.wordCount': 1 });
PostSchema.index({ postType: 1 });

// Add methods for statistics calculations
PostSchema.methods.calculateImprovements = function(previousPost) {
  if (!previousPost) return [];
  
  const improvements = [];
  const categories = [
    'clarity',
    'complexity',
    'voice',
    'errors'
  ];

  categories.forEach(category => {
    const oldScore = previousPost.statistics.writingMetrics[category]?.score || 0;
    const newScore = this.statistics.writingMetrics[category]?.score || 0;
    
    if (oldScore > 0) {
      const improvement = ((newScore - oldScore) / oldScore) * 100;
      improvements.push({
        category,
        percentage: Math.round(improvement),
        description: `${improvement > 0 ? 'Improved' : 'Decreased'} ${category} score`
      });
    }
  });

  return improvements;
};

// Add virtual for completion percentage
PostSchema.virtual('completionPercentage').get(function() {
  const stats = this.statistics.overall;
  if (!stats.requirementsTotal) return 0;
  return Math.round((stats.requirementsMet / stats.requirementsTotal) * 100);
});

module.exports = mongoose.model('Post', PostSchema);