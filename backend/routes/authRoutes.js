import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';

dotenv.config();

const router = express.Router();

// Rate Limiting Middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests from this IP, please try again later.",
    code: "TOO_MANY_REQUESTS"
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validate required ENV variables
[
  'JWT_SECRET', 'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER',
  'EMAIL_PASS', 'CLIENT_URL'
].forEach(key => {
  if (!process.env[key]) {
    console.error(`❌ Missing ${key} in .env`);
    process.exit(1);
  }
});

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Helper Functions
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const generateEmailToken = () => crypto.randomBytes(20).toString('hex');

// ---------------- ROUTES ----------------

// @route   POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    let { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required", code: "MISSING_FIELDS" });
    }

    email = email.toLowerCase().trim();
    username = username.trim();
    role = role?.trim().toLowerCase() || 'user';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format", code: "INVALID_EMAIL" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters", code: "WEAK_PASSWORD" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? "Email already registered" : "Username already exists",
        code: "USER_EXISTS"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailToken = generateEmailToken();

    const user = new User({
      username,
      email,
      password: password,
      role,
      emailVerificationToken: emailToken,
      emailVerified: false
    });

    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${emailToken}`;
    await transporter.sendMail({
      from: `"${process.env.EMAIL_SENDER_NAME}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email",
      html: `<p>Click the link below to verify your email:</p><a href="${verifyUrl}">${verifyUrl}</a>`
    });

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: "User registered. Please verify your email.",
      token,
      user: {
        id: user._id,
        username,
        email,
        role,
        emailVerified: user.emailVerified
      },
      code: "REGISTRATION_SUCCESS"
    });

  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Server error", code: "SERVER_ERROR" });
  }
});

// @route   POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required", code: "MISSING_FIELDS" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(401).json({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log("✅ Login successful:", email);
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      code: "LOGIN_SUCCESS"
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error", code: "SERVER_ERROR" });
  }
});

// @route   GET /api/auth/verify-email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required", code: "MISSING_TOKEN" });

    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) return res.status(400).json({ message: "Invalid token", code: "INVALID_TOKEN" });

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully", code: "EMAIL_VERIFIED" });
  } catch (err) {
    console.error("❌ Email verification error:", err);
    res.status(500).json({ message: "Verification failed", code: "SERVER_ERROR" });
  }
});

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(200).json({ message: "Logged out successfully", code: "LOGOUT_SUCCESS" });
});

export default router;
