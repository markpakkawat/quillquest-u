// backend/controllers/postController.js

const Post = require('../models/Post');
const Tag = require('../models/Tag'); // If using a separate Tag model
const User = require('../models/User');
const { io } = require('../server'); // To emit events

// @desc    Get all posts by a specific user
// @route   GET /api/posts/user
// @access  Private
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({ userId });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user posts' });
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  const { title, content, postType, prompt } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const newPost = new Post({
      userId: user._id,
      username: user.username,
      title,
      content,
      postType,
      prompt,
    });

    const savedPost = await newPost.save();

    const io = req.app.get('io');
    io.emit('newPost', savedPost);

    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'username')
      .populate('prompt')
      .populate({
        path: 'comments',
        populate: {
          path: 'replies',
        },
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('userId', 'username')
      .populate('prompt')
      .populate({
        path: 'comments',
        populate: {
        path: 'replies',
        },
      });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  const { content, postType, prompt } = req.body;
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }

    post.content = content || post.content;
    post.postType = postType || post.postType;
    post.prompt = prompt || post.prompt;

    const updatedPost = await post.save();

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user is the author
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne(); // Use deleteOne instead of remove

    // Emit a socket event to notify other users about the post deletion
    const io = req.app.get('io');
    io.emit('postDeleted', { postId: req.params.id });

    res.json({ message: 'Post successfully deleted', postId: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already liked the post
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already liked this post' });
    }

    // Add the user's ID to the likes array
    post.likes.push(req.user._id);
    await post.save();

    res.json({ message: 'Post liked', likes: post.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a post
// @route   PUT /api/posts/:id/unlike
// @access  Private
exports.unlikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has not liked the post yet
    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have not liked this post yet' });
    }

    // Remove the user's ID from the likes array
    post.likes = post.likes.filter(userId => userId.toString() !== req.user._id.toString());
    await post.save();

    res.json({ message: 'Post unliked', likes: post.likes.length });
  } catch (error) {
    next(error);
  }
};
