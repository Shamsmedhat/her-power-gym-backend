const express = require('express');
const {
  canAccessClientData,
  isClient,
  isCoachOrAdmin,
} = require('../middleware/authMiddleware');
const clientController = require('../controllers/clientController');

const router = express.Router();

// Admin/Coach only routes - Client CRUD operations
router
  .route('/')
  .get(isCoachOrAdmin, clientController.getAllClients)
  .post(isCoachOrAdmin, clientController.createClient);

// Routes that require specific client access (clients can only see their own data)
router
  .route('/:clientId')
  .get(canAccessClientData, clientController.getClient)
  .patch(isCoachOrAdmin, clientController.updateClient) // Only admins/coaches can update
  .delete(isCoachOrAdmin, clientController.deleteClient); // Only admins/coaches can delete

// Client-specific routes - clients can only access their own data
router
  .route('/:clientId/subscription')
  .get(canAccessClientData, clientController.getMySubscription);

router
  .route('/:clientId/sessions')
  .get(canAccessClientData, clientController.getMySessions);

// Coach-specific routes - only coaches and admins
router
  .route('/coach/my-clients')
  .get(isCoachOrAdmin, clientController.getMyClients);
router
  .route('/coach/client/:clientId')
  .get(isCoachOrAdmin, clientController.getClientDetailsForCoach);

// Client-specific routes for coach access - clients can access this
router
  .route('/client/coach/:coachId')
  .get(clientController.getCoachDetailsForClient); // All authenticated users can access

module.exports = router;
