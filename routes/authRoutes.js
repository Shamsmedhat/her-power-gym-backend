const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/login-client', authController.loginClient);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password', authController.resetPassword);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.patch('/update-password', authController.updatePassword);
router.post('/register', authController.register);

module.exports = router;
