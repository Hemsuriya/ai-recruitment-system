const express = require("express");
const router = express.Router();
const hrCandidateController = require("../controllers/hrCandidateController");

router.get("/", hrCandidateController.getAllCandidates);
router.get("/search/:term", hrCandidateController.searchCandidates);
router.get("/:id", hrCandidateController.getCandidateById);
router.put("/:id/comment", hrCandidateController.updateComment);

module.exports = router;
