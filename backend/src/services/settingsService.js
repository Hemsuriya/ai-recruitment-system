const db = require("../config/db");

// ─── Departments ────────────────────────────────────────────

exports.getAllDepartments = async () => {
  const result = await db.query(
    `SELECT id, name FROM departments ORDER BY name ASC`
  );
  return result.rows;
};

exports.createDepartment = async (name) => {
  const result = await db.query(
    `INSERT INTO departments (name) VALUES ($1) RETURNING *`,
    [name.trim()]
  );
  return result.rows[0];
};

exports.deleteDepartment = async (id) => {
  const result = await db.query(
    `DELETE FROM departments WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows.length > 0;
};

// ─── HR Members ─────────────────────────────────────────────

exports.getAllMembers = async () => {
  const result = await db.query(
    `SELECT id, name, email, role, department_id FROM hr_members ORDER BY name ASC`
  );
  return result.rows;
};

exports.createMember = async ({ name, email, role, department_id }) => {
  const result = await db.query(
    `INSERT INTO hr_members (name, email, role, department_id) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name.trim(), email?.trim() || null, role?.trim() || "HR", department_id || null]
  );
  return result.rows[0];
};

exports.deleteMember = async (id) => {
  const result = await db.query(
    `DELETE FROM hr_members WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows.length > 0;
};
