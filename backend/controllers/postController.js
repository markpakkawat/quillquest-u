const Post = require('../models/Post');
const Tag = require('../models/Tag');
const User = require('../models/User');
const { io } = require('../server');
const mongoose = require('mongoose');

// @desc    Get all posts by a specific user
// @route   GET /api/posts/user
// @access  Private
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({ userId })
      .populate('userId', 'username profileImage')
      .populate({
        path: 'comments',
        populate: {
          path: 'replies',
        },
      })
      .sort({ createdAt: -1 });

    // Safely populate prompts
    const populatedPosts = await Promise.all(posts.map(async (post) => {
      if (post.prompt) {
        try {
          const populated = await post.populate('prompt');
          return populated;
        } catch (err) {
          console.error(`Failed to populate prompt for post ${post._id}`);
          post.prompt = null;
          return post;
        }
      }
      return post;
    }));

    res.json(populatedPosts);
  } catch (err) {
    console.error('Error in getUserPosts:', err);
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
      prompt: prompt || null,
    });

    const savedPost = await newPost.save();

    // Populate the saved post before emitting
    const populatedPost = await savedPost
      .populate('userId', 'username profileImage');

    if (prompt) {
      try {
        await populatedPost.populate('prompt');
      } catch (err) {
        console.error(`Failed to populate prompt for new post ${savedPost._id}`);
        populatedPost.prompt = null;
      }
    }

    const io = req.app.get('io');
    io.emit('newPost', populatedPost);

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error in createPost:', error);
    next(error);
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res, next) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(500).json({ message: 'Database connection not ready' });
    }

    const posts = await Post.find()
      .populate('userId', 'username profileImage')
      .populate({
        path: 'comments',
        populate: {
          path: 'replies',
        },
      })
      .sort({ createdAt: -1 });

    // Safely populate prompts
    const populatedPosts = await Promise.all(posts.map(async (post) => {
      if (post.prompt) {
        try {
          const populated = await post.populate('prompt');
          return populated;
        } catch (err) {
          console.error(`Failed to populate prompt for post ${post._id}`);
          post.prompt = null;
          return post;
        }
      }
      return post;
    }));

    res.json(populatedPosts);
  } catch (error) {
    console.error('Error in getPosts:', error);
    next(error);
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
exports.getPostById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid post ID format' });
    }

    const post = await Post.findById(req.params.id)
      .populate('userId', 'username profileImage')
      .populate({
        path: 'comments',
        populate: [{
          path: 'userId',
          select: 'username profileImage'
        }, {
          path: 'replies',
          populate: {
            path: 'userId',
            select: 'username profileImage'
          }
        }]
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Safely populate prompt if it exists
    if (post.prompt) {
      try {
        await post.populate('prompt');
      } catch (err) {
        console.error(`Failed to populate prompt for post ${post._id}`);
        post.prompt = null;
      }
    }

    res.json(post);
  } catch (error) {
    console.error('Error in getPostById:', error);
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  const { title, content, postType, prompt } = req.body;
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.postType = postType || post.postType;
    post.prompt = prompt || post.prompt;

    const updatedPost = await post.save();

    // Populate the updated post
    const populatedPost = await updatedPost
      .populate('userId', 'username profileImage')
      .populate({
        path: 'comments',
        populate: {
          path: 'replies',
        },
      });

    if (populatedPost.prompt) {
      try {
        await populatedPost.populate('prompt');
      } catch (err) {
        console.error(`Failed to populate prompt for updated post ${post._id}`);
        populatedPost.prompt = null;
      }
    }

    res.json(populatedPost);
  } catch (error) {
    console.error('Error in updatePost:', error);
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

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    const io = req.app.get('io');
    io.emit('postDeleted', { postId: req.params.id });

    res.json({ message: 'Post successfully deleted', postId: req.params.id });
  } catch (error) {
    console.error('Error in deletePost:', error);
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

    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already liked this post' });
    }

    post.likes.push(req.user._id);
    await post.save();

    const populatedPost = await post.populate('likes', 'username profileImage');
    
    res.json({
      message: 'Post liked',
      likes: populatedPost.likes.length,
      likeDetails: populatedPost.likes
    });
  } catch (error) {
    console.error('Error in likePost:', error);
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

    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have not liked this post yet' });
    }

    post.likes = post.likes.filter(userId => userId.toString() !== req.user._id.toString());
    await post.save();

    const populatedPost = await post.populate('likes', 'username profileImage');

    res.json({
      message: 'Post unliked',
      likes: populatedPost.likes.length,
      likeDetails: populatedPost.likes
    });
  } catch (error) {
    console.error('Error in unlikePost:', error);
    next(error);
  }
};