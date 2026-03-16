const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// ✅ Production-ready CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://magdishere.github.io'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests like Postman / mobile apps with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `CORS policy: origin ${origin} not allowed`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // Allow cookies and Authorization headers
    allowedHeaders: ['Content-Type', 'Authorization'], // Explicitly allow token headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow HTTP methods
  })
);

// Handle preflight OPTIONS requests for all routes
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Security middleware
app.use(helmet());

// Mount routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Server is healthy' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});