const validationService = require("../services/surveyValidationService");

exports.validateSurvey = async (req, res) => {

  try {

    const { screening_id } = req.body;

    const result = await validationService.validateSurvey(screening_id);

    res.json(result);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

};