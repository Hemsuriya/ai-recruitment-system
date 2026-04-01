const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendEmail, getEmailTemplate } = require('../services/emailService');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email, created_at',
      [name, email, hashedPassword]
    );
    
    // Send welcome email
    const template = getEmailTemplate('welcome', { name, email });
    const emailResult = await sendEmail(email, template.subject, template.text, template.html);
    if (!emailResult.success) {
      console.warn(`Welcome email not sent for ${email}: ${emailResult.error}`);
    }
    
    res.status(201).json({ user: result.rows[0], message: 'User registered successfully. Check your email for confirmation.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required.' });
  }
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }
  
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    // Always return success to prevent email enumeration attacks
    if (userRes.rows.length === 0) {
      return res.json({ message: 'If this email exists, a password reset link will be sent.' });
    }
    
    const user = userRes.rows[0];
    const resetToken = uuidv4();
    const resetExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    
    // Store reset token in database
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [resetToken, resetExpiry, user.id]
    );
    
    // Send password reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("RESET LINK:", resetLink);
    const template = getEmailTemplate('passwordReset', { name: user.name, resetLink });
    
    const emailResult = await sendEmail(email, template.subject, template.text, template.html);
    
    if (!emailResult.success) {
      console.error(`Failed to send password reset email to ${email}:`, emailResult.error);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }
    
    res.json({ message: 'If this email exists, a password reset link will be sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Validate input
  if (!token) {
    return res.status(400).json({ message: 'Reset token is required.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // Find user with valid reset token
    const userRes = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1',
      [token]
    );

    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const user = userRes.rows[0];

    // Check if token has expired
    if (new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ message: 'Reset token has expired. Please request a new one.' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    console.log(`✅ Password reset successfully for user: ${user.email}`);
    
    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
