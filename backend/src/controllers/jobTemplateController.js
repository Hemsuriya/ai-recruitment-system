const jobTemplateService = require("../services/jobTemplateService");

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await jobTemplateService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTemplateByKey = async (req, res) => {
  try {
    const template = await jobTemplateService.getTemplateByKey(req.params.templateKey);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { template_key, job_title } = req.body;
    if (!template_key || !job_title) {
      return res.status(400).json({
        success: false,
        message: "template_key and job_title are required",
      });
    }
    const template = await jobTemplateService.createTemplate(req.body);
    res.status(201).json({ success: true, message: "Template created successfully", data: template });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, error: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { job_title } = req.body;
    if (!job_title) {
      return res.status(400).json({ success: false, message: "job_title is required" });
    }
    const template = await jobTemplateService.updateTemplate(req.params.templateKey, req.body);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, message: "Template updated successfully", data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.duplicateTemplate = async (req, res) => {
  try {
    const template = await jobTemplateService.duplicateTemplate(req.params.templateKey);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.status(201).json({ success: true, message: "Template duplicated", data: template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const deleted = await jobTemplateService.deleteTemplate(req.params.templateKey);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
