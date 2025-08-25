const Session = require('../models/sessionModel');
const Client = require('../models/clientModel');
const User = require('../models/userModel');

// Helper function to check user permissions
const checkPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

// Get all sessions (Super Admin, Admin, Coach)
exports.getAllSessions = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (!checkPermission(role, ['super admin', 'admin', 'coach'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    let query = {};

    // Coaches can only see their own sessions
    if (role === 'coach') {
      query.coach = _id;
    }

    const sessions = await Session.find(query)
      .populate('client', 'name clientId')
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

// Get single session
exports.getSession = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate('client', 'name clientId')
      .populate('coach', 'name phone')
      .populate('statusChangeHistory.changedBy', 'name role');

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    // Check permissions
    const isCoach = session.coach._id.toString() === _id.toString();
    const isClient = session.client._id.toString() === req.user.clientId;
    const isAdmin = checkPermission(role, ['super admin', 'admin']);

    if (!isCoach && !isClient && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view sessions you are involved in or need admin permissions.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        session,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Create session (Super Admin, Admin)
exports.createSession = async (req, res) => {
  try {
    const { role } = req.user;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const newSession = await Session.create(req.body);

    const populatedSession = await Session.findById(newSession._id)
      .populate('client', 'name clientId')
      .populate('coach', 'name phone');

    res.status(201).json({
      status: 'success',
      data: {
        session: populatedSession,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update session
exports.updateSession = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { id } = req.params;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    // Check permissions
    const isCoach = session.coach.toString() === _id.toString();
    const isClient = session.client.toString() === req.user.clientId;
    const isAdmin = checkPermission(role, ['super admin', 'admin']);

    if (!isCoach && !isClient && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only update sessions you are involved in or need admin permissions.',
      });
    }

    // Only allow status updates for coaches and clients
    if (!isAdmin && req.body.status) {
      // Only allow status changes to 'completed' for coaches and clients
      if (req.body.status !== 'completed') {
        return res.status(403).json({
          status: 'error',
          message: 'You can only mark sessions as completed.',
        });
      }
    }

    // Track status changes
    if (req.body.status && req.body.status !== session.status) {
      req.body.statusChangeHistory = [
        ...session.statusChangeHistory,
        {
          status: req.body.status,
          changedBy: _id,
          changedAt: new Date(),
          reason: req.body.reason || 'Status updated',
        },
      ];
    }

    const updatedSession = await Session.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('client', 'name clientId')
      .populate('coach', 'name phone')
      .populate('statusChangeHistory.changedBy', 'name role');

    res.status(200).json({
      status: 'success',
      data: {
        session: updatedSession,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete session (Super Admin, Admin)
exports.deleteSession = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const session = await Session.findByIdAndDelete(id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
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

// Update session status (Coach, Client)
exports.updateSessionStatus = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { id } = req.params;
    const { status, reason } = req.body;

    const session = await Session.findById(id);

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Session not found',
      });
    }

    // Check permissions
    const isCoach = session.coach.toString() === _id.toString();
    const isClient = session.client.toString() === req.user.clientId;

    if (!isCoach && !isClient) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only update sessions you are involved in.',
      });
    }

    // Only allow status changes to 'completed'
    if (status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'You can only mark sessions as completed.',
      });
    }

    // Track status changes
    const statusChange = {
      status: status,
      changedBy: _id,
      changedAt: new Date(),
      reason: reason || `Marked as completed by ${role}`,
    };

    const updatedSession = await Session.findByIdAndUpdate(
      id,
      {
        status: status,
        $push: { statusChangeHistory: statusChange },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('client', 'name clientId')
      .populate('coach', 'name phone')
      .populate('statusChangeHistory.changedBy', 'name role');

    res.status(200).json({
      status: 'success',
      data: {
        session: updatedSession,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get sessions by client
exports.getSessionsByClient = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { clientId } = req.params;

    // Check if user is the client or their coach
    const client = await Client.findById(clientId);

    if (!client) {
      return res.status(404).json({
        status: 'error',
        message: 'Client not found',
      });
    }

    const isCoach =
      client.privatePlan &&
      client.privatePlan.coach.toString() === _id.toString();
    const isClient = client._id.toString() === req.user.clientId;
    const isAdmin = checkPermission(role, ['super admin', 'admin']);

    if (!isCoach && !isClient && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view sessions for clients you are involved with or need admin permissions.',
      });
    }

    const sessions = await Session.find({ client: clientId })
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
