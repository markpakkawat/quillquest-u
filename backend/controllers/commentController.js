// backend/controllers/commentController.js

const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// @desc    Create a new comment
// @route   POST /api/posts/:postId/comments
// @access  Private
exports.createComment = async (req, res, next) => {
  const { content, parentCommentId } = req.body;
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = new Comment({
      post: post._id,
      userId: req.user._id,
      content,
      parentComment: parentCommentId || null
    });

    const savedComment = await newComment.save();

    if (parentCommentId) {
      // Append the reply to the parent comment's replies array
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      parentComment.replies.push(savedComment._id);
      await parentComment.save();
    } else {
      // Add comment to post's comments array
      post.comments.push(savedComment._id);
      await post.save();

      // Create a notification for the post owner
      if (post.userId.toString() !== req.user._id.toString()) {
        const truncatedContent = content.length > 20 ? `${content.substring(0, 17)}...` : content;
        const truncatedPostTitle = post.title.length > 20 ? `${post.title.substring(0, 17)}...` : post.title;
        const notification = new Notification({
          userId: post.userId,
          message: `${req.user.username} commented "${truncatedContent}" on your post "${truncatedPostTitle}".`,
          type: 'comment',
          postId: post._id
        });
        await notification.save();
      }
    }

    res.status(201).json(savedComment);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all comments for a post
// @route   GET /api/posts/:postId/comments
// @access  Public
exports.getCommentsByPost = async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('userId', 'username')
      .populate('replies')
      .sort({ createdAt: 1 }); // Oldest first

    res.json(comments);
  } catch (error) {
    next(error);
  }
};


// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res, next) => {
  const { content } = req.body;
  try {
    let comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is the author
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this comment' });
    }

    comment.content = content || comment.content;

    const updatedComment = await comment.save();

    res.json(updatedComment);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is the author
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    // Remove the comment ID from the associated post's comments array
    await Post.updateOne(
      { _id: comment.postId },
      { $pull: { comments: comment._id } }
    );

    res.json({ message: 'Comment successfully deleted', commentId: req.params.commentId });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a comment
// @route   PUT /api/comments/:id/like
// @access  Private
exports.likeComment = async (req, res, next) => {
  try {
    let comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!comment.likes.includes(req.user._id)) {
      comment.likes.push(req.user._id);
      await comment.save();
    }

    res.json({ likes: comment.likes });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a comment
// @route   PUT /api/comments/:id/unlike
// @access  Private
exports.unlikeComment = async (req, res, next) => {
  try {
    let comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.likes.includes(req.user._id)) {
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
      await comment.save();
    }

    res.json({ likes: comment.likes });
  } catch (error) {
    next(error);
  }
};