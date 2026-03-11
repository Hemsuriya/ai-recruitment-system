const express = require("express");
const router = express.Router();

const validationController = require("../controllers/surveyValidationController");

router.post("/validate", validationController.validateSurvey);

module.exports = router;