const { fetchOrCreateJobTemplate } = require("../services/n8nService");
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

exports.listAssessmentTemplates = async (req, res) => {
  try {
    const templates = await jobTemplateService.getAllAssessmentTemplates();

    res.json({
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        template_code: t.template_code,
        template_name: t.template_name,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.autopopulateAssessment = async (req, res) => {
  try {
    const template = await jobTemplateService.getAssessmentTemplateByCode(
      req.params.templateCode
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Assessment template not found",
      });
    }

    const workflowData = await fetchOrCreateJobTemplate({
      jobId: template.template_code,
      jobDescription: template.job_description,
      regenerate: false,
    });

    const skillsRequired = workflowData.required_skills
      ? workflowData.required_skills.split(",").map((s) => s.trim())
      : template.skills
      ? template.skills.split(",").map((s) => s.trim())
      : [];

    const payload = {
      template_code: template.template_code,
      template_name: template.template_name,
      role_title: workflowData.role_title || workflowData.job_title || template.role_title,
      experience_level:
        workflowData.experience_level || template.experience_level || "",
      job_description:
        workflowData.job_description || template.job_description || "",
      skills_required: Array.isArray(workflowData.skills_required)
        ? workflowData.skills_required
        : workflowData.required_skills
        ? workflowData.required_skills.split(",").map((s) => s.trim())
        : template.skills
        ? template.skills.split(",").map((s) => s.trim())
        : [],
      pre_screening_questions: Array.isArray(workflowData.pre_screening_questions)
        ? workflowData.pre_screening_questions
        : workflowData.survey_question_1
        ? [workflowData.survey_question_1]
        : [],
      assessment_options: workflowData.assessment_options || {
        include_ai_questions: true,
        include_coding_round: false,
        include_aptitude_test: false,
        include_ai_video_interview: false,
        include_manual_video_interview: false,
      },
      assessment_summary: workflowData.assessment_summary || {
        role: workflowData.job_title || template.role_title,
        experience: workflowData.experience_level || template.experience_level || "",
        skills: Array.isArray(workflowData.skills_required)
          ? workflowData.skills_required
          : workflowData.required_skills
          ? workflowData.required_skills.split(",").map((s) => s.trim())
          : template.skills
          ? template.skills.split(",").map((s) => s.trim())
          : [],
        components: [],
      },
      ai_source: workflowData.source || "database",
      number_of_candidates: workflowData.number_of_candidates || 10,
      survey_q1_expected_answer:
        workflowData.survey_q1_expected_answer || "",
    };

    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};