const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/login', authController.login);

// Admin routes
router.post('/create-user', verifyToken, authorize(['Admin']), authController.createUser);
router.get('/users', verifyToken, authorize(['Admin']), authController.getAllUsers);
router.post('/assign-role', verifyToken, authorize(['Admin']), authController.assignRole);
router.post('/deactivate-user', verifyToken, authorize(['Admin']), authController.deactivateUser);

module.exports = router;
