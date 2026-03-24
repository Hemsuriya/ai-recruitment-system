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
    const postings = await jobPostingService.getPostingsDropdown();
    res.json({ success: true, data: postings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
