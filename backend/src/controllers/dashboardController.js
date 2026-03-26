const dashboardService = require("../services/dashboardService");

function handleDashboardError(error, res) {
  console.error("Failed to load dashboard:", error);
  res.status(500).json({ error: "Failed to load dashboard" });
}

exports.getDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDashboard();
    res.json(dashboard);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getSummary = async (req, res) => {
  try {
    const summary = await dashboardService.getSummary();
    res.json(summary);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getFunnel = async (req, res) => {
  try {
    const funnel = await dashboardService.getFunnel();
    res.json(funnel);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getStageScores = async (req, res) => {
  try {
    const stageScores = await dashboardService.getStageScores();
    res.json(stageScores);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getRecentCandidates = async (req, res) => {
  try {
    const recentCandidates = await dashboardService.getRecentCandidates();
    res.json(recentCandidates);
  } catch (error) {
    handleDashboardError(error, res);
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const recentActivity = await dashboardService.getRecentActivity();
    res.json(recentActivity);
  } catch (error) {
    handleDashboardError(error, res);
  }
};
