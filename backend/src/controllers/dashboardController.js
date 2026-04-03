const dashboardService = require("../services/dashboardService");

function getDashboardFilters(req) {
  return {
    jid: req.query.jid || undefined,
    jobTitle: req.query.job_title || undefined,
  };
}

function handleDashboardError(error, res) {
  console.error("Failed to load dashboard:", error);
  res.status(500).json({ error: "Failed to load dashboard" });
}

exports.getDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDashboard(getDashboardFilters(req));
    res.json(dashboard);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getSummary(getDashboardFilters(req));
    res.json(summary);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getFunnel = async (req, res) => {
  try {
    const funnel = await dashboardService.getFunnel(getDashboardFilters(req));
    res.json(funnel);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getStageScores = async (req, res) => {
  try {
    const stageScores = await dashboardService.getStageScores(getDashboardFilters(req));
    res.json(stageScores);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getRecentCandidates = async (req, res) => {
  try {
    const recentCandidates = await dashboardService.getRecentCandidates(getDashboardFilters(req));
    res.json(recentCandidates);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const recentActivity = await dashboardService.getRecentActivity(getDashboardFilters(req));
    res.json(recentActivity);
  } catch (error) {
    handleDashboardError(error, res);
  }
};
