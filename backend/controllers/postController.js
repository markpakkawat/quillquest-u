const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper functions for statistics calculations
const calculateWordCount = (content) => content.split(/\s+/).length;

const calculateTotalErrors = (sections) => {
  return sections.reduce((total, section) => {
    const sectionErrors = Object.values(section.errors || {}).reduce((a, b) => a + b, 0);
    return total + sectionErrors;
  }, 0);
};

const calculateErrorReduction = (currentErrors, previousErrors) => {
  if (!previousErrors) return 0;
  return Math.round(((previousErrors - currentErrors) / previousErrors) * 100);
};

// Existing Controllers
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const posts = await Post.find({ userId });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get user posts' });
  }
};

exports.createPost = async (req, res, next) => {
  const { title, content, postType, prompt, sections, writingMetrics } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's previous post for comparison if it exists
    const previousPost = await Post.findOne({ 
      userId: user._id 
    }).sort({ createdAt: -1 });

    // Calculate initial statistics
    const wordCount = calculateWordCount(content);
    const totalErrors = sections ? calculateTotalErrors(sections) : 0;
    const errorReduction = previousPost ? 
      calculateErrorReduction(totalErrors, previousPost.statistics?.overall?.totalErrors) : 0;

    const newPost = new Post({
      userId: user._id,
      username: user.username,
      title,
      content,
      postType,
      prompt,
      statistics: {
        overall: {
          wordCount,
          completionTime: 0, // Will be updated when post is completed
          totalErrors,
          errorReduction,
          requirementsMet: 0,
          requirementsTotal: 0
        },
        writingMetrics: writingMetrics || {},
        sections: sections?.map(section => ({
          title: section.title,
          errors: section.errors || {},
          requirements: {
            met: section.requirements?.met || [],
            missing: section.requirements?.missing || []
          }
        })) || []
      }
    });

    const savedPost = await newPost.save();

    const io = req.app.get('io');
    io.emit('newPost', savedPost);

    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

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

exports.updatePost = async (req, res, next) => {
  const { content, postType, prompt, sections, writingMetrics } = req.body;
  try {
    let post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to update this post' });
    }

    // Update basic post info
    post.content = content || post.content;
    post.postType = postType || post.postType;
    post.prompt = prompt || post.prompt;

    // Update statistics if provided
    if (sections || writingMetrics) {
      const wordCount = calculateWordCount(content || post.content);
      const totalErrors = sections ? calculateTotalErrors(sections) : post.statistics?.overall?.totalErrors;

      post.statistics = {
        ...post.statistics,
        overall: {
          ...post.statistics?.overall,
          wordCount,
          totalErrors,
          requirementsMet: sections?.reduce((sum, section) => 
            sum + (section.requirements?.met?.length || 0), 0) || post.statistics?.overall?.requirementsMet,
          requirementsTotal: sections?.reduce((sum, section) => 
            sum + ((section.requirements?.met?.length || 0) + 
                   (section.requirements?.missing?.length || 0)), 0) || post.statistics?.overall?.requirementsTotal
        },
        writingMetrics: writingMetrics || post.statistics?.writingMetrics,
        sections: sections?.map(section => ({
          title: section.title,
          errors: section.errors || {},
          requirements: {
            met: section.requirements?.met || [],
            missing: section.requirements?.missing || []
          }
        })) || post.statistics?.sections
      };
    }

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// Existing delete, like, and unlike controllers remain the same
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
    next(error);
  }
};

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

    res.json({ message: 'Post liked', likes: post.likes.length });
  } catch (error) {
    next(error);
  }
};

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

    res.json({ message: 'Post unliked', likes: post.likes.length });
  } catch (error) {
    next(error);
  }
};

// New Statistics Controllers
exports.getPostStats = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these statistics' });
    }

    res.json(post.statistics);
  } catch (error) {
    next(error);
  }
};

exports.updatePostStats = async (req, res, next) => {
  try {
    const { sections, writingMetrics } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update these statistics' });
    }

    // Update statistics
    post.statistics = {
      overall: {
        wordCount: calculateWordCount(post.content),
        completionTime: Date.now() - new Date(post.createdAt).getTime(),
        totalErrors: calculateTotalErrors(sections),
        requirementsMet: sections.reduce((sum, section) => 
          sum + (section.requirements?.met?.length || 0), 0),
        requirementsTotal: sections.reduce((sum, section) => 
          sum + ((section.requirements?.met?.length || 0) + 
                 (section.requirements?.missing?.length || 0)), 0)
      },
      writingMetrics,
      sections: sections.map(section => ({
        title: section.title,
        errors: section.errors || {},
        requirements: {
          met: section.requirements?.met || [],
          missing: section.requirements?.missing || []
        }
      }))
    };

    const updatedPost = await post.save();
    res.json(updatedPost.statistics);
  } catch (error) {
    next(error);
  }
};

module.exports = exports;