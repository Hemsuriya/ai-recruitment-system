const assessmentConfigService = require("../services/assessmentConfigService");

exports.createAssessment = async (req, res) => {
  try {
    const { role_title } = req.body;
    if (!role_title) {
      return res.status(400).json({ success: false, error: "role_title is required" });
    }
    const result = await assessmentConfigService.createAssessment(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllAssessments = async (req, res) => {
  try {
    const filters = {
      status: req.query.status
    };
    const assessments = await assessmentConfigService.getAllAssessments(filters);
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAssessmentById = async (req, res) => {
  try {
    const assessment = await assessmentConfigService.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, error: "Assessment not found" });
    }
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAssessment = async (req, res) => {
  try {
    const assessment = await assessmentConfigService.updateAssessment(req.params.id, req.body);
    if (!assessment) {
      return res.status(404).json({ success: false, error: "Assessment not found" });
    }
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPreScreeningQuestions = async (req, res) => {
  try {
    const questions =
      await assessmentConfigService.getAssessmentPreScreeningQuestions(
        req.params.id
      );
    res.json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePreScreeningQuestions = async (req, res) => {
  try {
    const payload = req.body?.pre_screening_questions;
    if (!Array.isArray(payload)) {
      return res.status(400).json({
        success: false,
        error: "pre_screening_questions must be an array",
      });
    }

    const updated =
      await assessmentConfigService.updateAssessmentPreScreeningQuestions(
        req.params.id,
        payload
      );

    if (!updated) {
      return res.status(404).json({ success: false, error: "Assessment not found" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const deleted = await assessmentConfigService.deleteAssessment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Assessment not found" });
    }
    res.json({ success: true, message: "Assessment archived successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
