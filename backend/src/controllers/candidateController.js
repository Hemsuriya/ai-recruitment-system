const candidateService = require("../services/candidateService");
const { sendEmail, getEmailTemplate } = require("../services/emailService");
const db = require("../config/db");

exports.createCandidate = async (req, res) => {
  try {
    const { name, email, jobTitle } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "name and email are required"
      });
    }

    const candidate = await candidateService.createCandidate(req.body);

    // Send invitation email
    const assessmentLink = `${process.env.FRONTEND_URL}/assessment/${candidate.id}`;
    console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
    console.log("ASSESSMENT LINK:", assessmentLink);
    const template = getEmailTemplate('candidateInvitation', { name, jobTitle, assessmentLink });
    const emailResult = await sendEmail(email, template.subject, template.text, template.html);
    
    if (!emailResult.success) {
      console.warn(`Invitation email not sent to ${email}: ${emailResult.error}`);
    }

    res.status(201).json({
      success: true,
      message: "Candidate created successfully and invitation email sent",
      data: candidate
    });

  } catch (error) {
    console.error("Error creating candidate:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create candidate",
      error: error.message
    });
  }
};

// Update identity verification status after selfie verification succeeds
exports.updateIdentityVerified = async (req, res) => {
  try {
    const { screening_id, verified } = req.body;

    if (!screening_id) {
      return res.status(400).json({ success: false, message: "screening_id is required" });
    }

    const result = await db.query(
      `UPDATE candidates_v2
       SET identity_verified = $1,
           verification_attempts = verification_attempts + 1,
           last_verification_attempt = CURRENT_TIMESTAMP
       WHERE screening_id = $2
       RETURNING screening_id, identity_verified, verification_attempts`,
      [verified !== false, screening_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating identity verification:", error.message);
    res.status(500).json({ success: false, message: "Failed to update identity verification" });
  }
};