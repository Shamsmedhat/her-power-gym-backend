const SubscriptionPlan = require('../models/subscriptionModel');
const Client = require('../models/clientModel');

// Helper function to check user permissions
const checkPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole);
};

// Get all subscription plans (Super Admin, Admin, Coach, Client)
exports.getAllSubscriptionPlans = async (req, res) => {
  try {
    const { role } = req.user;

    if (!checkPermission(role, ['super admin', 'admin', 'coach', 'client'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const { type } = req.query;
    let query = {};

    // Filter by type if provided
    if (type) {
      query.type = type;
    }

    const subscriptionPlans = await SubscriptionPlan.find(query);

    res.status(200).json({
      status: 'success',
      data: {
        subscriptionPlans,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get single subscription plan
exports.getSubscriptionPlan = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (!checkPermission(role, ['super admin', 'admin', 'coach', 'client'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const subscriptionPlan = await SubscriptionPlan.findById(id);

    if (!subscriptionPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription plan not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscriptionPlan,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Create subscription plan (Super Admin, Admin)
exports.createSubscriptionPlan = async (req, res) => {
  try {
    const { role } = req.user;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const newSubscriptionPlan = await SubscriptionPlan.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        subscriptionPlan: newSubscriptionPlan,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Update subscription plan (Super Admin, Admin)
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const updatedSubscriptionPlan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSubscriptionPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription plan not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscriptionPlan: updatedSubscriptionPlan,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Delete subscription plan (Super Admin, Admin)
exports.deleteSubscriptionPlan = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (!checkPermission(role, ['super admin', 'admin'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    // Check if any clients are using this plan
    const clientsUsingPlan = await Client.find({
      $or: [{ 'subscription.plan': id }, { 'privatePlan.plan': id }],
    });

    if (clientsUsingPlan.length > 0) {
      return res.status(400).json({
        status: 'error',
        message:
          'Cannot delete subscription plan. It is currently being used by clients.',
      });
    }

    const subscriptionPlan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!subscriptionPlan) {
      return res.status(404).json({
        status: 'error',
        message: 'Subscription plan not found',
      });
    }

    res.status(204).json({
      status: 'success',
      data: subscriptionPlan,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get main subscription plans only
exports.getMainSubscriptionPlans = async (req, res) => {
  try {
    const { role } = req.user;

    if (!checkPermission(role, ['super admin', 'admin', 'coach', 'client'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const subscriptionPlans = await SubscriptionPlan.find({ type: 'main' });

    res.status(200).json({
      status: 'success',
      data: {
        subscriptionPlans,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};

// Get private subscription plans only
exports.getPrivateSubscriptionPlans = async (req, res) => {
  try {
    const { role } = req.user;

    if (!checkPermission(role, ['super admin', 'admin', 'coach', 'client'])) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.',
      });
    }

    const subscriptionPlans = await SubscriptionPlan.find({ type: 'private' });

    res.status(200).json({
      status: 'success',
      data: {
        subscriptionPlans,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};
