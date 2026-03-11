const express = require("express");
const router = express.Router();

const surveyController = require("../controllers/surveyController");

router.get("/:screening_id", surveyController.getSurveyQuestions);

router.post("/submit", surveyController.submitSurveyAnswers);

module.exports = router;