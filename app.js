const express = require('express');
const morgan = require('morgan');
const {
  protect,
  canAccessClientData,
  isClient,
  isCoachOrAdmin,
} = require('./middleware/authMiddleware');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const userRouter = require('./routes/userRoutes');
const clientRouter = require('./routes/clientRoutes');
const sessionRouter = require('./routes/sessionRoutes');
const subscriptionRouter = require('./routes/subscriptionRoutes');
const authRouter = require('./routes/authRoutes');
const statisticsRouter = require('./routes/statisticsRoutes');

// Variables
const app = express();

// Setup middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// Public routes
app.use('/api/v1/auth', authRouter);

// Protected routes
app.use('/api/v1/users', protect, isCoachOrAdmin, userRouter); // Only coaches and admins
app.use('/api/v1/clients', protect, clientRouter); // All authenticated users, but with specific access control
app.use('/api/v1/sessions', protect, sessionRouter); // All authenticated users
app.use('/api/v1/subscriptions', protect, subscriptionRouter); // All authenticated users
app.use('/api/v1/statistics', protect, statisticsRouter); // Super-admin only

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
