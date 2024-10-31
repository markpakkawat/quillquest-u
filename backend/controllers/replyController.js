// backend/controllers/replyController.js

const Reply = require('../models/Reply');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification'); // Import Notification model

// @desc    Create a new reply
// @route   POST /api/comments/:commentId/replies
// @access  Private
exports.createReply = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Find the comment to ensure it exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Create a new reply
    const newReply = new Reply({
      commentId,
      userId,
      content,
    });

    const savedReply = await newReply.save();

    // Add the reply to the comment's replies array
    comment.replies.push(savedReply._id);
    await comment.save();

    // Create a notification for the comment's author (if the replier is not the original author)
    if (comment.userId.toString() !== userId.toString()) {
      const truncatedReplyContent = content.length > 20 ? `${content.substring(0, 17)}...` : content;
      const truncatedCommentContent = comment.content.length > 20 ? `${comment.content.substring(0, 17)}...` : comment.content;
      // Use the `post` field from the comment to get the post ID
      const postId = comment.post;
      const notification = new Notification({
        userId: comment.userId,
        message: `${req.user.username} replied "${truncatedReplyContent}" on your comment "${truncatedCommentContent}".`,
        type: 'reply',
        postId: postId,
        commentId: comment._id,
      });
      await notification.save();
    }

    res.status(201).json(savedReply);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all replies for a comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
exports.getRepliesByComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    // Find replies associated with the comment
    const replies = await Reply.find({ commentId }).populate('userId', 'username').sort({ createdAt: 1 });

    res.json(replies);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a reply
// @route   DELETE /api/replies/:replyId
// @access  Private
exports.deleteReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const userId = req.user._id;

    // Find the reply by ID
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Check if the user is the author of the reply
    if (reply.userId.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this reply' });
    }

    // Remove the reply from the database
    await Reply.deleteOne({ _id: replyId });

    // Remove the reply from the comment's replies array
    await Comment.updateOne(
      { _id: reply.commentId },
      { $pull: { replies: replyId } }
    );

    res.json({ message: 'Reply removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a reply
// @route   PUT /api/replies/:replyId
// @access  Private
exports.updateReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Find the reply by ID
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Check if the user is the author of the reply
    if (reply.userId.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this reply' });
    }

    // Update the reply content
    reply.content = content;
    const updatedReply = await reply.save();

    res.status(200).json(updatedReply);
  } catch (error) {
    next(error);
  }
};

// @desc    Like a reply
// @route   PUT /api/replies/:replyId/like
// @access  Private
exports.likeReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const userId = req.user._id;

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (!reply.likes.includes(userId)) {
      reply.likes.push(userId);
      await reply.save();
    }

    res.status(200).json({ likes: reply.likes });
  } catch (error) {
    next(error);
  }
};

// @desc    Unlike a reply
// @route   PUT /api/replies/:replyId/unlike
// @access  Private
exports.unlikeReply = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const userId = req.user._id;

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.likes.includes(userId)) {
      reply.likes = reply.likes.filter((like) => like.toString() !== userId.toString());
      await reply.save();
    }

    res.status(200).json({ likes: reply.likes });
  } catch (error) {
    next(error);
  }
};