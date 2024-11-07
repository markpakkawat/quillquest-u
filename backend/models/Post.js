const mongoose = require('mongoose');

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
    ref: 'Prompt',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }]
}, {
  strictPopulate: false // Allow flexible population
});

// Ensure indexes for better query performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ userId: 1 });
PostSchema.index({ postType: 1 });

module.exports = mongoose.model('Post', PostSchema);