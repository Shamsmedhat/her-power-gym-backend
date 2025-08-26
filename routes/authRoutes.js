const express = require('express');
const authController = require('../controllers/authController');
const { protect, isSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', authController.test);
router.post('/login', authController.login);
router.post('/login-client', authController.loginClient);

//TODO in future when mail/SMS implemented
router.post(
  '/forgot-password',
  protect,
  isSuperAdmin,
  authController.forgotPassword
);
router.patch(
  '/reset-password',
  protect,
  isSuperAdmin,
  authController.resetPassword
);
// Protected routes

router.use(protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.patch('/update-password', authController.updatePassword);
router.post('/register', authController.register);

module.exports = router;
