const validationService = require("../services/surveyValidationService");

exports.validateSurvey = async (req, res) => {
  try {
    const { screening_id } = req.body;

    if (!screening_id) {
      return res.status(400).json({
        success: false,
        message: "screening_id is required"
      });
    }

    const result = await validationService.validateSurvey(screening_id);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Error validating survey:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to validate survey",
      error: error.message
    });
  }
};