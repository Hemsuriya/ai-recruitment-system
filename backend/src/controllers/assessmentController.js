const n8nService = require("../services/n8nService");

// GET assessment questions
exports.getAssessmentQuestions = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const data = await n8nService.getAssessmentQuestions(candidateId);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Error fetching assessment questions:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch assessment questions"
    });
  }
};


// UPDATE assessment status
exports.updateAssessmentStatus = async (req, res) => {
  try {

    const { candidateId, status } = req.body;

    const data = await n8nService.updateAssessmentStatus(candidateId, status);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error("Error updating assessment status:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update assessment status"
    });

  }
};


// SUBMIT assessment results
exports.submitAssessmentResults = async (req, res) => {
  try {

    const payload = req.body;

    const data = await n8nService.submitAssessmentResults(payload);

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    console.error("Error submitting assessment results:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to submit assessment results"
    });

  }
};