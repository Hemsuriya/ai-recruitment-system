const db = require("../config/db");

const templateHeadcountSelect = `
  CASE
    WHEN COALESCE(jt.number_of_candidates, '') ~ '^[0-9]+$'
      THEN jt.number_of_candidates::int
    ELSE NULL
  END AS headcount
`;

exports.getAllPostings = async () => {
  const result = await db.query(`
    SELECT jp.*, jt.template_key, jt.required_skills, ${templateHeadcountSelect}
    FROM job_postings jp
    LEFT JOIN job_templates jt ON jp.template_id = jt.id
    ORDER BY jp.created_at DESC
  `);
  return result.rows;
};

exports.getPostingByJid = async (jid) => {
  const result = await db.query(
    `SELECT jp.*, jt.template_key, jt.required_skills, ${templateHeadcountSelect}
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

exports.getPostingsDropdown = async (jobTitle) => {
  const params = [];
  let filter = `WHERE status IN ('open', 'closed')`;
  if (jobTitle) {
    params.push(jobTitle);
    filter += ` AND job_title = $${params.length}`;
  }
  const result = await db.query(
    `SELECT jp.jid, jp.job_title, jp.status, jp.opens_at, jp.closes_at, ${templateHeadcountSelect}
     FROM job_postings jp
     LEFT JOIN job_templates jt ON jp.template_id = jt.id
     ${filter.replace("job_title", "jp.job_title").replace("status", "jp.status")}
     ORDER BY jp.created_at DESC`,
    params
  );
  return result.rows;
};

exports.createAssessment = async (data) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    // 1. Create or update template
    let templateId;
    if (data.template_key) {
      const existing = await client.query(
        `SELECT id FROM job_templates WHERE template_key = $1`,
        [data.template_key]
      );
      if (existing.rows.length > 0) {
        // Update existing
        templateId = existing.rows[0].id;
        await client.query(
          `UPDATE job_templates
           SET job_title = COALESCE($1, job_title),
               required_skills = COALESCE($2, required_skills),
               number_of_candidates = COALESCE($3, number_of_candidates),
               survey_question_1 = COALESCE($4, survey_question_1),
               survey_q1_expected_answer = COALESCE($5, survey_q1_expected_answer),
               time_limit_minutes = COALESCE($6, time_limit_minutes),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $7`,
          [
            data.job_title, data.required_skills,
            data.headcount ? String(data.headcount) : null,
            data.survey_question_1, data.survey_q1_expected_answer,
            data.time_limit_minutes, templateId
          ]
        );
      } else {
        // Create new with provided key
        const res = await client.query(
          `INSERT INTO job_templates (template_key, job_title, required_skills, number_of_candidates, survey_question_1, survey_q1_expected_answer, time_limit_minutes)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [
            data.template_key,
            data.job_title,
            data.required_skills,
            data.headcount ? String(data.headcount) : null,
            data.survey_question_1,
            data.survey_q1_expected_answer,
            data.time_limit_minutes || 30,
          ]
        );
        templateId = res.rows[0].id;
      }
    } else {
      // Auto-generate template_key
      const key = `Template_${Date.now()}`;
      const res = await client.query(
        `INSERT INTO job_templates (template_key, job_title, required_skills, number_of_candidates, survey_question_1, survey_q1_expected_answer, time_limit_minutes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, template_key`,
        [
          key,
          data.job_title,
          data.required_skills,
          data.headcount ? String(data.headcount) : null,
          data.survey_question_1,
          data.survey_q1_expected_answer,
          data.time_limit_minutes || 30,
        ]
      );
      templateId = res.rows[0].id;
      data.template_key = res.rows[0].template_key;
    }

    // 2. Create job_posting (JID auto-generated by trigger)
    const postingRes = await client.query(
      `INSERT INTO job_postings (template_id, job_title, status, created_by)
       VALUES ($1, $2, 'open', $3)
       RETURNING *`,
      [templateId, data.job_title, data.created_by || "HR Team"]
    );

    await client.query("COMMIT");

    return {
      jid: postingRes.rows[0].jid,
      template_key: data.template_key,
      posting: postingRes.rows[0],
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.getDistinctRoles = async () => {
  const result = await db.query(
    `SELECT DISTINCT job_title FROM job_postings WHERE status IN ('open', 'closed') ORDER BY job_title`
  );
  return result.rows.map((r) => r.job_title);
};

exports.getPostingsByTemplateId = async (templateId) => {
  const result = await db.query(
    `SELECT jp.jid, jp.job_title, jp.status, jp.opens_at, jp.closes_at, ${templateHeadcountSelect}
     FROM job_postings jp
     LEFT JOIN job_templates jt ON jp.template_id = jt.id
     WHERE jp.template_id = $1
     ORDER BY jp.created_at DESC`,
    [templateId]
  );
  return result.rows;
};
