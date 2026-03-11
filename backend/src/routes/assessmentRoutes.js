const express = require("express");
const router = express.Router();

const assessmentController = require("../controllers/assessmentController");
console.log(assessmentController);

// GET assessment questions
router.get(
  "/questions/:candidateId",
  assessmentController.getAssessmentQuestions
);

// UPDATE assessment status
router.post(
  "/status",
  assessmentController.updateAssessmentStatus
);

// SUBMIT assessment results
router.post(
  "/submit",
  assessmentController.submitAssessmentResults
);

module.exports = router;