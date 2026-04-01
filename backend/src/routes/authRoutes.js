const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User registration
router.post('/signup', authController.signup);

// User login
router.post('/login', authController.login);

// Forgot password (sends reset email)
router.post('/forgot-password', authController.forgotPassword);

// Reset password (validates token and updates password)
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
