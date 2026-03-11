const express = require("express");
const router = express.Router();
const surveyController = require("../controllers/surveyController");

// Specific routes BEFORE param routes
router.post("/submit", surveyController.submitSurveyAnswers);
router.get("/:screening_id", surveyController.getSurveyQuestions);

module.exports = router;