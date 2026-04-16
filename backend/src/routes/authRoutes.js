const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/register
 * @desc    User registration
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route   GET /api/auth/users
 * @desc    Get all users for admin management
 * @access  Admin
 */
router.get('/users', authenticateToken, authorizeRole('Admin'), authController.getUsers);

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Update user role and status
 * @access  Admin
 */
router.put('/users/:id', authenticateToken, authorizeRole('Admin'), authController.updateUserRole);

module.exports = router;
