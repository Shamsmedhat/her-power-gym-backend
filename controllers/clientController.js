const Client = require('../models/clientModel');
const Session = require('../models/sessionModel');
const User = require('../models/userModel');

// Helper function to check user permissions
const checkPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

// Get all clients (Super Admin, Admin, Coach)
exports.getAllClients = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (!checkPermission(role, ['super admin', 'admin', 'coach'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    let query = {};

    // Coaches can only see their own clients
    if (role === 'coach') {
      query['privatePlan.coach'] = _id;
    }

    const clients = await Client.find(query)
      .populate('subscription.plan')
      .populate('privatePlan.plan')
      .populate('privatePlan.coach', 'name phone');

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

// Get single client
exports.getClient = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { id } = req.params;

    // Check if user is the client (for client access)
    const isClient = await Client.findOne({
      _id: id,
      $or: [
        { 'privatePlan.coach': _id },
        { _id: req.user.clientId }, // Assuming clientId is stored in user model
      ],
    });

    if (!isClient && !checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view your own profile or need admin permissions.',
      });
    }

    const client = await Client.findById(id)
      .populate('subscription.plan')
      .populate('privatePlan.plan')
      .populate('privatePlan.coach', 'name phone daysOff');

    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
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

// Create client (Super Admin, Admin)
exports.createClient = async (req, res) => {
  try {
    const { role } = req.user;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const newClient = await Client.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        client: newClient,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { id } = req.params;

    // Check if user is the client (for client access)
    const isClient = await Client.findOne({
      _id: id,
      $or: [{ 'privatePlan.coach': _id }, { _id: req.user.clientId }],
    });

    if (!isClient && !checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only update your own profile or need admin permissions.',
      });
    }

    const updatedClient = await Client.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('subscription.plan privatePlan.plan privatePlan.coach');

    if (!updatedClient) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        client: updatedClient,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete client (Super Admin, Admin)
exports.deleteClient = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const client = await Client.findByIdAndDelete(id);

    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found',
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

// Get client's subscription details
exports.getMySubscription = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { id } = req.params;

    // Check if user is the client or their coach
    const isAuthorized = await Client.findOne({
      _id: id,
      $or: [{ 'privatePlan.coach': _id }, { _id: req.user.clientId }],
    });

    if (!isAuthorized && !checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view your own subscription or need admin permissions.',
      });
    }

    const client = await Client.findById(id)
      .populate('subscription.plan')
      .populate('privatePlan.plan')
      .populate('privatePlan.coach', 'name phone daysOff');

    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found',
      });
    }

    // Calculate remaining sessions for private plan
    let remainingSessions = 0;
    if (client.privatePlan && client.privatePlan.totalSessions) {
      const completedSessions = await Session.countDocuments({
        client: client._id,
        status: 'completed',
      });
      remainingSessions = client.privatePlan.totalSessions - completedSessions;
    }

    res.status(200).json({
      status: 'success',
      data: {
        client,
        remainingSessions,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get client's sessions
exports.getMySessions = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { id } = req.params;

    // Check if user is the client or their coach
    const isAuthorized = await Client.findOne({
      _id: id,
      $or: [{ 'privatePlan.coach': _id }, { _id: req.user.clientId }],
    });

    if (!isAuthorized && !checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view your own sessions or need admin permissions.',
      });
    }

    const sessions = await Session.find({ client: id })
      .populate('coach', 'name phone')
      .populate('statusChangeHistory.changedBy', 'name role');

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
