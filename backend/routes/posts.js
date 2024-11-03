const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  // Existing controllers
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getUserPosts,
  
  // New statistics controllers
  getPostStats,
  updatePostStats
} = require('../controllers/postController');

// Basic Post Routes
//@desc    Get all posts by a specific user
//@route   GET /api/posts/user
//@access  Private
router.get('/user', protect, getUserPosts);

//@desc    Create a new post
//@route   POST /api/posts
//@access  Private
router.post('/', protect, createPost);

//@desc    Get all posts
//@route   GET /api/posts
//@access  Public
router.get('/', getPosts);

//@desc    Get post by ID
//@route   GET /api/posts/:id
//@access  Public
router.get('/:id', getPostById);

//@desc    Update a post
//@route   PUT /api/posts/:id
//@access  Private
router.put('/:id', protect, updatePost);

//@desc    Delete a post
//@route   DELETE /api/posts/:id
//@access  Private
router.delete('/:id', protect, deletePost);

// Like/Unlike Routes
//@desc    Like a post
//@route   PUT /api/posts/:id/like
//@access  Private
router.put('/:id/like', protect, likePost);

//@desc    Unlike a post
//@route   PUT /api/posts/:id/unlike
//@access  Private
router.put('/:id/unlike', protect, unlikePost);

// Statistics Routes
//@desc    Get statistics for a specific post
//@route   GET /api/posts/:id/stats
//@access  Private
router.get('/:id/stats', protect, getPostStats);

//@desc    Update statistics for a specific post
//@route   PUT /api/posts/:id/stats
//@access  Private
router.put('/:id/stats', protect, updatePostStats);

module.exports = router;