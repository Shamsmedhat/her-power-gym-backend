const express = require('express');
const statisticsController = require('../controllers/statisticsController');
const { isSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// All statistics routes are protected and require super-admin role
router.use(isSuperAdmin);

// Get comprehensive statistics
router.route('/').get(statisticsController.getStatistics);

// Get quick statistics overview
router.route('/quick').get(statisticsController.getQuickStats);

module.exports = router;
