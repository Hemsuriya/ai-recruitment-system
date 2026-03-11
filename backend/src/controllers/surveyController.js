const surveyService = require("../services/surveyService");

exports.getSurveyQuestions = async (req, res) => {
  try {
    const { screening_id } = req.params;
    const questions = await surveyService.getSurveyQuestions(screening_id);
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.submitSurveyAnswers = async (req, res) => {
  try {
    const { screening_id, answers } = req.body;
    if (!screening_id || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: "screening_id and answers array are required" });
    }
    const result = await surveyService.submitSurveyAnswers(screening_id, answers);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};