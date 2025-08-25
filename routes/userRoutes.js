const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// User CRUD operations
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

// Coach-specific routes
router.route('/:id/days-off').patch(userController.updateDaysOff);

router.route('/me/clients').get(userController.getMyClients);

router.route('/me/sessions').get(userController.getMySessions);

module.exports = router;
