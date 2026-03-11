const candidateService = require("../services/candidateService");

exports.createCandidate = async (req, res) => {
  try {
    const candidate = await candidateService.createCandidate(req.body);

    res.status(201).json({
      message: "Candidate created successfully",
      data: candidate
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};