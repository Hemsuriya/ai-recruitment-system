const express = require('express');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

// Test email route
router.post('/test', async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, text' });
  }

  const result = await sendEmail(to, subject, text, html);

  if (result.success) {
    res.json({ message: 'Email sent successfully', messageId: result.messageId });
  } else {
    res.status(500).json({ error: 'Failed to send email', details: result.error });
  }
});

module.exports = router;