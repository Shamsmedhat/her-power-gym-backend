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

module.exports = router;
