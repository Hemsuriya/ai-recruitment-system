const express = require("express");

const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.get("/", dashboardController.getDashboard);
router.get("/summary", dashboardController.getSummary);
router.get("/funnel", dashboardController.getFunnel);
router.get("/stage-scores", dashboardController.getStageScores);
router.get("/recent-candidates", dashboardController.getRecentCandidates);
router.get("/recent-activity", dashboardController.getRecentActivity);

module.exports = router;
