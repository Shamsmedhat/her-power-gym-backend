const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Client = require('../models/clientModel');

// Protect routes - Authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.',
    });
  }
};

// Restrict to certain roles - Authorization
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

// Check if user is client
exports.isClient = async (req, res, next) => {
  try {
    // Check if user has a clientId (indicating they are a client)
    if (!req.user.clientId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. This route is for clients only.',
      });
    }

    // Verify client exists
    const client = await Client.findById(req.user.clientId);
    if (!client) {
      return res.status(403).json({
        status: 'error',
        message: 'Client profile not found.',
      });
    }

    req.client = client;
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Check if user is coach
exports.isCoach = (req, res, next) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. This route is for coaches only.',
    });
  }
  next();
};

// Check if user is admin or super admin
exports.isAdmin = (req, res, next) => {
  if (!['admin', 'super admin'].includes(req.user.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. This route is for administrators only.',
    });
  }
  next();
};

// Check if user is super admin only
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. This route is for super administrators only.',
    });
  }
  next();
};
