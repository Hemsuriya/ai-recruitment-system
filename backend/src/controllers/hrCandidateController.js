const hrCandidateService = require("../services/hrCandidateService");

exports.getAllCandidates = async (req, res) => {
  try {
    const filters = { jid: req.query.jid || null };
    const candidates = await hrCandidateService.getAllCandidates(filters);
    res.json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await hrCandidateService.getCandidateById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }
    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { decision_comment } = req.body;
    const result = await hrCandidateService.updateCandidateComment(
      req.params.id,
      decision_comment
    );
    if (!result) {
      return res.status(404).json({ success: false, error: "Candidate not found" });
    }
    res.json({ success: true, message: "Comment updated successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.searchCandidates = async (req, res) => {
  try {
    const candidates = await hrCandidateService.searchCandidates(req.params.term);
    res.json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
