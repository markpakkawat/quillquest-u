// Controller for password reset functionality

const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');

// Controller to handle password reset request
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    // Create a password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Hash the token before storing
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
    // Update user with reset token and expiry
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send reset link to user's email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested to reset your password.

Please click on the following link, or paste this into your browser to complete the process:

${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: message,
    });

    res.status(200).json({ message: 'Password reset link has been sent to your email' });
  } catch (error) {
    console.error('Error during password reset request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Controller to handle password reset using the token
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
  
    try {
      // Hash the received token to compare with the stored hashed token
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
      // Find user by reset token and check expiry
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired password reset token' });
      }
  
      // Hash the new password before saving
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(password, salt);
  
      // Clear reset token and expiry
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Password has been successfully reset' });
    } catch (error) {
      console.error('Error during password reset token submission:', error.message);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

module.exports = {
  requestPasswordReset,
  resetPassword,
};
