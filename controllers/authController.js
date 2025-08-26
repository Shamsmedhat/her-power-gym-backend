const User = require('../models/userModel');
const Client = require('../models/clientModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { handleDuplication } = require('../lib/helper');

// Helper function to create JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Helper function to send token response
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user,
  });
};

exports.test = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: 'Test success',
  });
};

// Register new user (Super Admin, Admin)
exports.register = async (req, res) => {
  try {
    const { role } = req.user;

    if (!['super admin', 'admin'].includes(role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only administrators can register new users.',
      });
    }

    // req.user => is the loggedin user himself
    // req.body => is the user that the loggedin user try to register
    // Only super admin can create admin users
    if (req.body.role === 'admin' && role !== 'super admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only super admin can create admin users.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    req.body.password = hashedPassword;

    const newUser = await User.create(req.body);

    createSendToken(newUser, 201, res);
  } catch (error) {
    console.log();
    res.status(400).json({
      status: 'error',
      message: handleDuplication(error),
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Check if phone and password exist
    if (!phone || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide phone and password.',
      });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ phone }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect phone or password.',
      });
    }

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Login client
exports.loginClient = async (req, res) => {
  try {
    const { phone, clientId } = req.body;

    // Check if phone and clientId exist
    if (!phone || !clientId) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide phone and client ID.',
      });
    }

    // Check if client exists
    const client = await Client.findOne({ phone, clientId });

    if (!client) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid phone or client ID.',
      });
    }

    // Create a temporary user object for client
    const clientUser = {
      _id: client._id,
      name: client.name,
      phone: client.phone,
      role: 'client',
      clientId: client.clientId,
    };

    // Create a special token for client
    const token = jwt.sign(
      { id: client._id, role: 'client', clientId: client._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: clientUser,
        client,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update password (self)
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is incorrect.',
      });
    }

    // If so, update password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Log user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Admin resets another user's password (Admin/Super Admin)
exports.adminResetPassword = async (req, res) => {
  try {
    const { id } = req.params; // target user id
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a newPassword with at least 6 characters.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    // Optional: invalidate other sessions by rotating a passwordChangedAt if you track it
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully by admin.',
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Reset password
//TODO in future when mail/SMS implemented
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired.',
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Forgot password
//TODO in future when mail/SMS implemented
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'There is no user with this phone number.',
      });
    }

    // Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset token via SMS (implement your SMS service here)
    // For now, just return the token
    res.status(200).json({
      status: 'success',
      message: 'Reset token sent to your phone.',
      resetToken, // Remove this in production
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
