const express = require("express");
const router = express.Router();
const jobTemplateController = require("../controllers/jobTemplateController");

router.get("/", jobTemplateController.getAllTemplates);
router.get("/:templateKey", jobTemplateController.getTemplateByKey);
router.post("/", jobTemplateController.createTemplate);
router.put("/:templateKey", jobTemplateController.updateTemplate);
router.delete("/:templateKey", jobTemplateController.deleteTemplate);

module.exports = router;
