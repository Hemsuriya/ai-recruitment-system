const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/assessmentConfigController");

router.post("/", ctrl.createAssessment);
router.get("/", ctrl.getAllAssessments);
router.get("/:id", ctrl.getAssessmentById);
router.put("/:id", ctrl.updateAssessment);
router.delete("/:id", ctrl.deleteAssessment);

module.exports = router;
