const express = require('express');
const clientController = require('../controllers/clientController');

const router = express.Router();

// Client CRUD operations
router
  .route('/')
  .get(clientController.getAllClients)
  .post(clientController.createClient);

router
  .route('/:id')
  .get(clientController.getClient)
  .patch(clientController.updateClient)
  .delete(clientController.deleteClient);

// Client-specific routes
router.route('/:id/subscription').get(clientController.getMySubscription);

router.route('/:id/sessions').get(clientController.getMySessions);

// Coach-specific routes
router.route('/coach/my-clients').get(clientController.getMyClients);
router
  .route('/coach/client/:clientId')
  .get(clientController.getClientDetailsForCoach);

// Client-specific routes for coach access
router
  .route('/client/coach/:coachId')
  .get(clientController.getCoachDetailsForClient);

module.exports = router;
