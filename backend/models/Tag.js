// backend/models/Tag.js

const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Tag', TagSchema);
