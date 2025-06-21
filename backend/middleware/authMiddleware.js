import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import rateLimit from 'express-rate-limit';

// Enhanced rate limiting
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests, please try again later",
      code: "RATE_LIMITED",
      retryAfter: 15 * 60 // 15 minutes in seconds
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' // Skip during tests
});

// Consolidated authentication middleware
export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token || 
                 req.headers.authorization?.replace('Bearer ', '') || 
                 req.headers['x-access-token'];

    if (!token) {
      return res.status(401).json({ 
        message: "Authentication required",
        code: "AUTH_REQUIRED",
        docs: "https://your-api-docs.com/auth" // Helpful for developers
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -__v');

    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Attach full user object to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);

    const response = {
      code: "AUTH_FAILED",
      message: "Authentication failed"
    };

    if (error.name === 'TokenExpiredError') {
      response.code = "TOKEN_EXPIRED";
      response.message = "Session expired, please login again";
    } else if (error.name === 'JsonWebTokenError') {
      response.code = "INVALID_TOKEN";
      response.message = "Invalid authentication token";
    }

    res.status(401).json(response);
  }
};

// Role-based access control
export const roleCheck = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access restricted to: ${roles.join(', ')}`,
        code: "ACCESS_DENIED",
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    next();
  };
};

// Admin shortcut
export const adminOnly = roleCheck(['admin']);