const express = require("express");
const router = express.Router();
const controller = require("../controllers/videoInterviewController");

router.get(
  "/video-questions/:assessmentId",
  controller.getVideoQuestions
);

router.post("/proctor-event", controller.logProctoringEvent);

router.post(
  "/video-submit",
  controller.uploadMiddleware,
  controller.submitVideoResponse
);

module.exports = router;
