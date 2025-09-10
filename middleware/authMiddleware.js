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
        statusCode: 401,
        status: 'error',
        message: 'You are not logged in. Please log in to get access.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let currentUser = null;

    // Check if this is a client token (has role: 'client')
    if (decoded.role === 'client') {
      // Look for client in Client collection
      const client = await Client.findById(decoded.id);
      if (!client) {
        return res.status(401).json({
          statusCode: 401,
          status: 'error',
          message: 'The client belonging to this token no longer exists.',
        });
      }

      // Create a user-like object for consistency
      currentUser = {
        _id: client._id,
        id: client._id,
        name: client.name,
        phone: client.phone,
        role: 'client',
        clientId: client.clientId,
        isClient: true, // Flag to identify client users
      };
    } else {
      // Regular user token - look in User collection
      currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return res.status(401).json({
          statusCode: 401,
          status: 'error',
          message: 'The user belonging to this token no longer exists.',
        });
      }
      currentUser.isClient = false; // Flag to identify regular users
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      statusCode: 401,
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

// Check if user is Client (for client-specific routes)
exports.isClient = (req, res, next) => {
  if (req.user.role !== 'client') {
    return res.status(403).json({
      statusCode: 403,
      status: 'error',
      message: 'Access denied. Client access only.',
    });
  }
  next();
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

// Check if user is Admin or Super Admin
exports.isAdmin = (req, res, next) => {
  if (!['admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({
      statusCode: 403,
      status: 'error',
      message: 'Access denied. Admin role required.',
    });
  }
  next();
};

// Check if user is Super Admin
exports.isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({
      statusCode: 403,
      status: 'error',
      message: 'Access denied. Super admin role required.',
    });
  }
  next();
};

// Check if user is Coach, Admin, or Super Admin
exports.isCoachOrAdmin = (req, res, next) => {
  if (!['coach', 'admin', 'super-admin'].includes(req.user.role)) {
    return res.status(403).json({
      statusCode: 403,
      status: 'error',
      message: 'Access denied. Coach or admin role required.',
    });
  }
  next();
};

// Check if user can access specific client data
exports.canAccessClientData = (req, res, next) => {
  const { clientId } = req.params;

  // Super admin and admin can access any client data
  if (['super-admin', 'admin'].includes(req.user.role)) {
    return next();
  }

  // Coaches can access their assigned clients
  if (req.user.role === 'coach') {
    // You might want to add logic here to check if the coach is assigned to this client
    // For now, allowing all coaches to access all client data
    return next();
  }

  // Clients can only access their own data
  if (req.user.role === 'client') {
    if (
      req.user.clientId !== clientId &&
      req.user._id.toString() !== clientId
    ) {
      return res.status(403).json({
        statusCode: 403,
        status: 'error',
        message: 'Access denied. You can only access your own data.',
      });
    }
    return next();
  }

  return res.status(403).json({
    statusCode: 403,
    status: 'error',
    message: 'Access denied.',
  });
};
