// backend/routes/comments.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment
} = require('../controllers/commentController');

// @route   POST /api/posts/:postId/comments
// @desc    Create a new comment
// @access  Private
router.post('/posts/:postId/comments', protect, createComment);

// @route   GET /api/comments/post/:postId
// @desc    Get all comments for a post
// @access  Public
router.get('/posts/:postId/comments', getCommentsByPost);

// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private
router.put('/:commentId', protect, updateComment);

// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
