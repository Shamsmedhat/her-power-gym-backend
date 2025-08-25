const express = require('express');
const sessionController = require('../controllers/sessionController');

const router = express.Router();

// Session CRUD operations
router
  .route('/')
  .get(sessionController.getAllSessions)
  .post(sessionController.createSession);

router
  .route('/:id')
  .get(sessionController.getSession)
  .patch(sessionController.updateSession)
  .delete(sessionController.deleteSession);

// Session-specific routes
router.route('/:id/status').patch(sessionController.updateSessionStatus);

router.route('/client/:clientId').get(sessionController.getSessionsByClient);

module.exports = router;
