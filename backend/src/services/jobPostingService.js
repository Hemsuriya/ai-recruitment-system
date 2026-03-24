const db = require("../config/db");

exports.getAllPostings = async () => {
  const result = await db.query(`
    SELECT jp.*, jt.template_key, jt.required_skills
    FROM job_postings jp
    LEFT JOIN job_templates jt ON jp.template_id = jt.id
    ORDER BY jp.created_at DESC
  `);
  return result.rows;
};

exports.getPostingByJid = async (jid) => {
  const result = await db.query(
    `SELECT jp.*, jt.template_key, jt.required_skills
     FROM job_postings jp
     LEFT JOIN job_templates jt ON jp.template_id = jt.id
     WHERE jp.jid = $1`,
    [jid]
  );
  return result.rows[0] || null;
};

exports.createPosting = async (data) => {
  const result = await db.query(
    `INSERT INTO job_postings (template_id, job_title, status, opens_at, closes_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.template_id || null,
      data.job_title,
      data.status || "open",
      data.opens_at || null,
      data.closes_at || null,
      data.created_by || "HR Team",
    ]
  );
  return result.rows[0];
};

exports.updatePosting = async (jid, data) => {
  const result = await db.query(
    `UPDATE job_postings
     SET job_title = COALESCE($1, job_title),
         status    = COALESCE($2, status),
         closes_at = COALESCE($3, closes_at)
     WHERE jid = $4
     RETURNING *`,
    [data.job_title || null, data.status || null, data.closes_at || null, jid]
  );
  return result.rows[0] || null;
};

exports.getPostingsDropdown = async () => {
  const result = await db.query(`
    SELECT jid, job_title, status, opens_at, closes_at
    FROM job_postings
    WHERE status IN ('open', 'closed')
    ORDER BY created_at DESC
  `);
  return result.rows;
};
