const mongoose = require('mongoose');

const ErrorStatSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true
  },
  sectionType: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  totalErrors: {
    type: Number,
    default: 0
  },
  errorsByCategory: {
    type: Map,
    of: Number,
    default: () => new Map()
  },
  detailedErrors: [mongoose.Schema.Types.Mixed]
}, { 
  strict: false, // Allow flexible error data structure
  _id: false     // Don't create _id for subdocuments
});

const StatisticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  essayId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  errors: [ErrorStatSchema],
  writingMetrics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});



module.exports = mongoose.model('Statistics', StatisticsSchema);