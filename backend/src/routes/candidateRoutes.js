const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");

router.post("/create", candidateController.createCandidate);

module.exports = router;