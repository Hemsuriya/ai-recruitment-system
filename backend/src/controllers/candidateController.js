const candidateService = require("../services/candidateService");

exports.createCandidate = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "name and email are required"
      });
    }

    const candidate = await candidateService.createCandidate(req.body);

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
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