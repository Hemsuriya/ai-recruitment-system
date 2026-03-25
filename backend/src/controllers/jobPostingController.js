const jobPostingService = require("../services/jobPostingService");

exports.getAllPostings = async (req, res) => {
  try {
    const postings = await jobPostingService.getAllPostings();
    res.json({ success: true, data: postings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPostingByJid = async (req, res) => {
  try {
    const posting = await jobPostingService.getPostingByJid(req.params.jid);
    if (!posting) {
      return res.status(404).json({ success: false, error: "Job posting not found" });
    }
    res.json({ success: true, data: posting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createPosting = async (req, res) => {
  try {
    const posting = await jobPostingService.createPosting(req.body);
    res.status(201).json({ success: true, data: posting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePosting = async (req, res) => {
  try {
    const posting = await jobPostingService.updatePosting(req.params.jid, req.body);
    if (!posting) {
      return res.status(404).json({ success: false, error: "Job posting not found" });
    }
    res.json({ success: true, data: posting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDropdown = async (req, res) => {
  try {
    const postings = await jobPostingService.getPostingsDropdown(req.query.job_title || null);
    res.json({ success: true, data: postings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const { job_title } = req.body;
    if (!job_title) {
      return res.status(400).json({ success: false, error: "job_title is required" });
    }
    const result = await jobPostingService.createAssessment(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDistinctRoles = async (req, res) => {
  try {
    const roles = await jobPostingService.getDistinctRoles();
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPostingsByTemplate = async (req, res) => {
  try {
    const postings = await jobPostingService.getPostingsByTemplateId(req.params.templateId);
    res.json({ success: true, data: postings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
