const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/settingsController");

// Departments
router.get("/departments", ctrl.getDepartments);
router.post("/departments", ctrl.createDepartment);
router.delete("/departments/:id", ctrl.deleteDepartment);

// HR Members
router.get("/members", ctrl.getMembers);
router.post("/members", ctrl.createMember);
router.delete("/members/:id", ctrl.deleteMember);

module.exports = router;
