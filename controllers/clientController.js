const Client = require('../models/clientModel');
const Session = require('../models/sessionModel');
const User = require('../models/userModel');
const SubscriptionPlan = require('../models/subscriptionModel');
const handleDuplication = require('../lib/helper');

// Helper function to check user permissions
const checkPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

// Helper: generate clientId e.g., CL + last 3 of phone + 2 random digits, ensure unique
async function generateUniqueClientId(phone) {
  const lastThree = (phone || '').replace(/\D/g, '').slice(-3).padStart(3, '0');
  // Try up to 20 times to avoid rare collisions
  for (let i = 0; i < 20; i += 1) {
    const randomTwo = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, '0');
    const candidate = `CL${lastThree}${randomTwo}`;
    const exists = await Client.exists({ clientId: candidate });
    if (!exists) return candidate;
  }
  throw new Error('Failed to generate a unique clientId. Please try again.');
}

// Helper: derive prices from plans for subscription and privatePlan
async function derivePricesAndDefaults(body) {
  const result = { ...body };

  // Main subscription priceAtPurchase from plan
  if (result.subscription && result.subscription.plan) {
    const plan = await SubscriptionPlan.findById(
      result.subscription.plan
    ).lean();
    if (!plan) throw new Error('Invalid subscription plan id');
    result.subscription.priceAtPurchase = plan.price;
    // If durationDays present on plan and dates not provided, caller should still provide start/end dates
  }

  // Private plan: priceAtPurchase and default totalSessions from plan
  if (result.privatePlan && result.privatePlan.plan) {
    const privatePlan = await SubscriptionPlan.findById(
      result.privatePlan.plan
    ).lean();
    if (!privatePlan) throw new Error('Invalid private plan id');
    result.privatePlan.priceAtPurchase = privatePlan.price;
    if (!result.privatePlan.totalSessions && privatePlan.totalSessions) {
      result.privatePlan.totalSessions = privatePlan.totalSessions;
    }
  }

  // Prevent manual overrides if user tried to set prices directly
  // if (result.subscription) delete result.subscription.priceAtPurchase;
  // if (result.privatePlan) delete result.privatePlan.priceAtPurchase;

  return result;
}

// Get all clients (Super Admin, Admin, Coach)
exports.getAllClients = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (!checkPermission(role, ['super-admin', 'admin', 'coach'])) {
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
    const { clientId } = req.params;

    // Check if user is the client (for client access)
    const isClient = await Client.findOne({
      _id: _id,
      // TODO
      $or: [{ 'privatePlan.coach': _id }, { _id: req.user._id }],
    });

    if (!isClient && !checkPermission(role, ['super-admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view your own profile or need admin permissions.',
      });
    }

    const client = await Client.findById(clientId)
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

    if (!checkPermission(role, ['super-admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    // Build payload with derived prices and generated clientId
    const payloadWithPrices = await derivePricesAndDefaults(req.body);

    // Always generate clientId server-side and ensure uniqueness
    const generatedClientId = await generateUniqueClientId(
      payloadWithPrices.phone
    );

    const newClient = await Client.create({
      ...payloadWithPrices,
      clientId: generatedClientId,
    });

    res.status(201).json({
      status: 'success',
      data: {
        client: newClient,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: handleDuplication(error),
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
      $or: [{ 'privatePlan.coach': _id }, { _id: req.user._id }],
    });

    if (!isClient && !checkPermission(role, ['super-admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only update your own profile or need admin permissions.',
      });
    }

    // Prevent clientId manual edits; derive prices if plans changed
    const incoming = { ...req.body };
    if (incoming.clientId) delete incoming.clientId;

    const payloadWithPrices = await derivePricesAndDefaults(incoming);

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      payloadWithPrices,
      {
        new: true,
        runValidators: true,
      }
    ).populate('subscription.plan privatePlan.plan privatePlan.coach');

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

    if (!checkPermission(role, ['super-admin', 'admin'])) {
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
    const { clientId } = req.params;

    // Check if user is the client or their coach
    const isAuthorized = await Client.findOne({
      _id: clientId,
      $or: [{ 'privatePlan.coach': _id }, { _id: req.user._id }],
    });

    if (!isAuthorized && !checkPermission(role, ['super-admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view your own subscription or need admin permissions.',
      });
    }

    const client = await Client.findById(clientId)
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

// TODO fix clientId, no need for now because its unused controllers for now
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

    if (!isAuthorized && !checkPermission(role, ['super-admin', 'admin'])) {
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

// Get coach's clients
exports.getMyClients = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role !== 'coach') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only coaches can access this endpoint.',
      });
    }

    const clients = await Client.find({ 'privatePlan.coach': _id })
      .populate('subscription.plan')
      .populate('privatePlan.plan')
      .select('-__v');

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

// Get client details for coach
exports.getClientDetailsForCoach = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { clientId } = req.params;

    if (role !== 'coach') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only coaches can access this endpoint.',
      });
    }

    // Verify the coach has access to this client
    const client = await Client.findOne({
      _id: clientId,
      'privatePlan.coach': _id,
    })
      .populate('subscription.plan')
      .populate('privatePlan.plan')
      .select('-__v');

    if (!client) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view details of clients assigned to you.',
      });
    }

    // Get client's sessions
    const sessions = await Session.find({ client: clientId })
      .populate('coach', 'name phone')
      .populate('statusChangeHistory.changedBy', 'name role')
      .select('-__v');

    res.status(200).json({
      status: 'success',
      data: {
        client,
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

// Get coach details for clients
exports.getCoachDetailsForClient = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { coachId } = req.params;

    if (role !== 'client') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Only clients can access this endpoint.',
      });
    }

    // Verify the client has access to this coach
    const client = await Client.findOne({
      _id: _id,
      'privatePlan.coach': coachId,
    });

    if (!client) {
      return res.status(403).json({
        status: 'error',
        message:
          'Access denied. You can only view details of coaches assigned to you.',
      });
    }

    const coach = await User.findById(coachId)
      .select('name phone daysOff')
      .select('-__v');

    if (!coach) {
      return res.status(404).json({
        status: 'error',
        message: 'Coach not found.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        coach,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
