// backend/controllers/userController.js

const User = require('../models/User');

// @desc    Get current user's profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId); // From protect middleware
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = req.user; // From protect middleware
    const { username, email, password, avatar, avatarColor } = req.body;

    if (username) user.username = username;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (avatarColor) user.avatarColor = avatarColor;
    if (password) user.password = password; // Will be hashed via pre-save hook

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a user's profile by ID
// @route   GET /api/users/:userId/profile
// @access  Private
exports.getUserProfileById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      username: user.username,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
};

exports.checkEmailAvailability = async (req, res, next) => {
  try {
    const email = req.query.email;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ available: false });
    }
    res.json({ available: true });
  } catch (error) {
    next(error);
  }
};
