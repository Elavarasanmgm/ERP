const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

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

module.exports = router;
