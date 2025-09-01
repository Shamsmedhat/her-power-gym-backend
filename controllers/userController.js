const User = require('../models/userModel');
const Client = require('../models/clientModel');
const Session = require('../models/sessionModel');
const { generateUniqueUserId } = require('../lib/helper');

// Helper function to check user permissions
const checkPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

// Helper: generate userId based on role + last 3 of phone + 2 random digits, ensure unique

// Get all users (Super Admin, Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.user;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const users = await User.find().select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        users,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get single user
exports.getUser = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    // Users can only access their own data, unless they're admin/super admin
    if (
      req.user._id.toString() !== id &&
      !checkPermission(role, ['super admin', 'admin'])
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only view your own profile.',
      });
    }

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

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

// Create user (Super Admin, Admin)
exports.createUser = async (req, res) => {
  try {
    const { role } = req.user;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    // Only super admin can create admin users
    if (req.body.role === 'admin' && role !== 'super admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only super admin can create admin users.',
      });
    }

    // Generate unique userId based on the role being created
    const userId = await generateUniqueUserId(req.body.phone, req.body.role);

    // Create user with generated userId
    const newUser = await User.create({
      ...req.body,
      userId,
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    // Users can only update their own data, unless they're admin/super admin
    if (
      req.user._id.toString() !== id &&
      !checkPermission(role, ['super admin', 'admin'])
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own profile.',
      });
    }

    // Only super admin can change roles
    if (req.body.role && role !== 'super admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only super admin can change user roles.',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete user (Super Admin, Admin)
exports.deleteUser = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    // Prevent self-deletion
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account.',
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get coach's clients (Coach only)
exports.getMyClients = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role !== 'coach') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only coaches can view their clients.',
      });
    }

    const clients = await Client.find({
      'privatePlan.coach': _id,
    }).populate('subscription.plan privatePlan.plan');

    res.status(200).json({
      status: 'success',
      data: {
        clients,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update coach's days off
exports.updateDaysOff = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { id } = req.params;
    const { daysOff } = req.body;

    // Coaches can update their own days off, admins can update any coach's days off
    if (role === 'coach' && _id.toString() !== id) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only update your own days off.',
      });
    }

    if (!checkPermission(role, ['super admin', 'admin', 'coach'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        daysOff,
        $push: {
          daysOffHistory: {
            daysOff,
            changedBy: _id,
            changedAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get coach's sessions
exports.getMySessions = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role !== 'coach') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only coaches can view their sessions.',
      });
    }

    const sessions = await Session.find({ coach: _id })
      .populate('client', 'name clientId')
      .populate('statusChangeHistory.changedBy', 'name');

    res.status(200).json({
      status: 'success',
      data: {
        sessions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
