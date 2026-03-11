const express = require("express");
const router = express.Router();
const assessmentController = require("../controllers/assessmentController");

router.get("/questions/:candidateId", assessmentController.getAssessmentQuestions);
router.post("/status", assessmentController.updateAssessmentStatus);
router.post("/submit", assessmentController.submitAssessmentResults);

module.exports = router;