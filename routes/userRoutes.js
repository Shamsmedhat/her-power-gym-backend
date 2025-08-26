const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { isAdmin } = require('../middleware/authMiddleware');

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

// Admin resets user password
router.route('/:id/password').patch(isAdmin, authController.adminResetPassword);

// Coach-specific routes
router.route('/:id/days-off').patch(userController.updateDaysOff);

router.route('/me/clients').get(userController.getMyClients);

router.route('/me/sessions').get(userController.getMySessions);

module.exports = router;
