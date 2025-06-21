// corsMiddleware.js
import cors from 'cors';

const allowedOrigins = [
  'https://cuddly-dollop-4rjgj64r5rxh7xvj-5173.app.github.dev', // Explicit GitHub Codespaces frontend
  'https://cuddly-dollop-4rjgj64r5rxh7xvj-5000.app.github.dev/', // Explicit GitHub Codespaces backend
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.ADDITIONAL_ALLOWED_ORIGINS?.split(',') || [])
].filter(Boolean);

console.log('✅ Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin in development (e.g., curl, Postman)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⛔ CORS blocked for origin: ${origin}`);
    callback(new Error(`Not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 204
};

export const corsMiddleware = cors(corsOptions);
export const corsPreflight = cors(corsOptions);

export const requestLogger = (req, res, next) => {
  console.log('\n===== Incoming Request =====');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Origin:', req.headers.origin);
  next();
};
