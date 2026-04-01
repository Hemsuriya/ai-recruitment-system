const candidateService = require("../services/candidateService");
const { sendEmail, getEmailTemplate } = require("../services/emailService");

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