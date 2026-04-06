const settingsService = require("../services/settingsService");

// ─── Departments ────────────────────────────────────────────

exports.getDepartments = async (req, res) => {
  try {
    const departments = await settingsService.getAllDepartments();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }
    const dept = await settingsService.createDepartment(name);
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ success: false, message: "Department already exists" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const deleted = await settingsService.deleteDepartment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.json({ success: true, message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─── HR Members ─────────────────────────────────────────────

exports.getMembers = async (req, res) => {
  try {
    const members = await settingsService.getAllMembers();
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    const member = await settingsService.createMember({ name, email, role });
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const deleted = await settingsService.deleteMember(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }
    res.json({ success: true, message: "Member deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
