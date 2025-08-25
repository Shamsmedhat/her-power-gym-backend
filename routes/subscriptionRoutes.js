const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

// Subscription plan CRUD operations
router
  .route('/')
  .get(subscriptionController.getAllSubscriptionPlans)
  .post(subscriptionController.createSubscriptionPlan);

router
  .route('/:id')
  .get(subscriptionController.getSubscriptionPlan)
  .patch(subscriptionController.updateSubscriptionPlan)
  .delete(subscriptionController.deleteSubscriptionPlan);

// Subscription-specific routes
router.route('/main').get(subscriptionController.getMainSubscriptionPlans);

router
  .route('/private')
  .get(subscriptionController.getPrivateSubscriptionPlans);

module.exports = router;
