const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/jobPostingController");

router.get("/", ctrl.getAllPostings);
router.get("/dropdown", ctrl.getDropdown);
router.get("/:jid", ctrl.getPostingByJid);
router.post("/", ctrl.createPosting);
router.put("/:jid", ctrl.updatePosting);

module.exports = router;
