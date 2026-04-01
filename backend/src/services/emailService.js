const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error.message);
  } else {
    console.log('✅ SMTP connection established successfully');
  }
});

const sendEmail = async (to, subject, text, html = null) => {
  try {
    if (!to || !subject || !text) {
      throw new Error('Missing required email parameters: to, subject, text');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'AI Candidate Screening'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text.replace(/\n/g, '<br>')}</p>`, // Fallback: convert text to HTML
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    return { 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Email template helper
const getEmailTemplate = (type, data) => {
  const templates = {
    welcome: (name, email) => ({
      subject: 'Welcome to AI Candidate Screening!',
      text: `Hello ${name},\n\nWelcome to AI Candidate Screening Platform!\n\nYour account has been successfully created with email: ${email}\n\nYou can now log in and start your assessment.\n\nBest regards,\nAI Candidate Screening Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p>Your account has been successfully created.</p>
          <p>Email: <strong>${email}</strong></p>
          <p>You can now log in and start your assessment.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Best regards,<br>AI Candidate Screening Team</p>
        </div>
      `
    }),
    candidateInvitation: (name, jobTitle, assessmentLink) => ({
      subject: `Assessment Invitation - ${jobTitle || 'Position'}`,
      text: `Hello ${name},\n\nYou have been invited to complete an assessment for the ${jobTitle || 'position'} role.\n\nClick the link below to start your assessment:\n${assessmentLink}\n\nBest regards,\nHR Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Assessment Invitation</h2>
          <p>Hello ${name},</p>
          <p>You have been invited to complete an assessment for the <strong>${jobTitle || 'position'}</strong> role.</p>
          <p style="margin: 30px 0;">
            <a href="${assessmentLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Assessment</a>
          </p>
          <p style="color: #666; font-size: 12px;">If you cannot click the link, paste this URL in your browser:<br>${assessmentLink}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Best regards,<br>HR Team</p>
        </div>
      `
    }),
    passwordReset: (name, resetLink) => ({
      subject: 'Password Reset Request - AI Candidate Screening',
      text: `Hello ${name},\n\nYou requested a password reset.\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset for your account.</p>
          <p style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </p>
          <p style="color: #d9534f; font-weight: bold;">⚠️ This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 12px;">If you cannot click the link, paste this URL in your browser:<br>${resetLink}</p>
          <p style="color: #666;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Best regards,<br>AI Candidate Screening Team</p>
        </div>
      `
    })
  };

  if (templates[type]) {
    return templates[type](...Object.values(data));
  }
  return null;
};

module.exports = { sendEmail, getEmailTemplate };