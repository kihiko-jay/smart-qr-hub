import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { createServer } from 'node:https';
import { readFileSync } from 'node:fs';
import { corsMiddleware, corsPreflight, requestLogger } from "./middleware/corsMiddleware.js";
import cors from "cors";
// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'PORT',
  ...(process.env.NODE_ENV === 'production' ? [
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS'
  ] : [])
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Continuing in development mode with reduced functionality');
    }
  }
});

const PORT = process.env.PORT || 5000;

// Create Express app
const app = express();

// =====================
// SECURITY MIDDLEWARE
// =====================
if (process.env.CODESPACES === 'true') {
  app.set('trust proxy', 1); // Trust Codespaces proxy
}

// Apply middleware
app.options('*', corsPreflight); // Preflight first
app.use(corsMiddleware);
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(requestLogger);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
const allowedOrigins = [
  'https://cuddly-dollop-4rjgj64r5rxh7xvj-5173.app.github.dev', // your frontend
];


// =====================
// ROUTES
// =====================
import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import qrCodeRoutes from "./routes/qrCodeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/campaign", campaignRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/qrCode", qrCodeRoutes);
app.use("/api/admin", adminRoutes);

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "QR Code Generator API",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// =====================
// ERROR HANDLING
// =====================
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  
  const statusCode = err.statusCode || (err.message.includes("CORS") ? 403 : 500);
  const response = {
    error: statusCode === 403 ? "Forbidden" : "Internal Server Error",
    message: err.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  };

  res.status(statusCode).json(response);
});

// =====================
// SERVER INITIALIZATION
// =====================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      retryWrites: true,
      w: "majority"
    });
    
    console.log("✅ MongoDB Connected");

    const startServer = () => {
      if (process.env.NODE_ENV === 'production' && !process.env.CODESPACES) {
        const sslOptions = {
          key: readFileSync(process.env.SSL_KEY_PATH || 'key.pem'),
          cert: readFileSync(process.env.SSL_CERT_PATH || 'cert.pem')
        };
        return createServer(sslOptions, app).listen(PORT, () => {
          console.log(`🚀 Secure server running on port ${PORT}`);
        });
      }
      return app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    };

    startServer();
    
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

connectDB();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});