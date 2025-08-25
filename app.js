const express = require('express');
const morgan = require('morgan');
const { protect } = require('./middleware/authMiddleware');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const userRouter = require('./routes/userRoutes');
const clientRouter = require('./routes/clientRoutes');
const sessionRouter = require('./routes/sessionRoutes');
const subscriptionRouter = require('./routes/subscriptionRoutes');
const authRouter = require('./routes/authRoutes');

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
app.use('/api/v1/users', protect, userRouter);
app.use('/api/v1/clients', protect, clientRouter);
app.use('/api/v1/sessions', protect, sessionRouter);
app.use('/api/v1/subscriptions', protect, subscriptionRouter);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
