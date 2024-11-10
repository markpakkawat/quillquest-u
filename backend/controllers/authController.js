// backend/controllers/authController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with hashed password
    user = new User({ username, email, password: hashedPassword, isVerified: false });
    await user.save();

    // Generate email verification token
    const emailToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create verification link
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailToken}`;

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS // Your email password or app-specific password
      }
    });

    // Send Verification Email
    const mailOptions = {
      from: 'yourwebsite@example.com',
      to: user.email,
      subject: 'Email Verification',
      html: `<p>Click the link below to verify your email:</p><a href="${verificationUrl}">Verify Email</a>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Error sending verification email' });
      } else {
        console.log('Verification email sent:', info.response);
      }
    });

    // Send response to the client
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatarColor
      }
    });
  } catch (error) {
    next(error);
  }
};
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Invalid or missing token');
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and update verification status
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).send('User not found');

    user.isVerified = true;
    await user.save();
    console.log('User after verification:', user);


    // Generate token after successful verification
    const authToken = generateToken(user);

    res.status(200).json({
      message: 'Email verified successfully',
      token: authToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
    res.status(200).send('Email verified successfully');
  } catch (err) {
    res.status(400).send('Invalid or expired token');
  }
};


// @desc    Login user and return JWT
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with provided email:', email); // Log if no user found
      return res.status(400).json({ message: 'Incorrect email or password.' });
    }
    console.log('User found for login:', user.email); // Log the email of the found user
    // // Check if the user's email is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match for user:', user.email); // Log if password comparison fails
      console.log(user.password);
      console.log(password);
      return res.status(400).json({ message: 'Incorrect email or password.' });
    }
    console.log('Password matches for user:', user.email); // Log if password comparison succeeds
    // Generate token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};
