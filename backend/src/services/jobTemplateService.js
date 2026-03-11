const db = require("../config/db");

exports.getAllTemplates = async () => {
  const result = await db.query(`
    SELECT
      template_key, job_title, job_description,
      required_skills, number_of_candidates,
      survey_question_1, survey_q1_expected_answer,
      created_at, updated_at
    FROM job_templates
    ORDER BY created_at DESC
  `);
  return result.rows;
};

exports.getTemplateByKey = async (templateKey) => {
  const result = await db.query(
    `SELECT * FROM job_templates WHERE template_key = $1`,
    [templateKey]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

exports.createTemplate = async (data) => {
  const {
    template_key, job_title, job_description,
    required_skills, number_of_candidates,
    survey_question_1, survey_q1_expected_answer
  } = data;

  // Check duplicate key
  const existing = await db.query(
    `SELECT template_key FROM job_templates WHERE template_key = $1`,
    [template_key]
  );
  if (existing.rows.length > 0) {
    const err = new Error("Template key already exists");
    err.statusCode = 400;
    throw err;
  }

  const result = await db.query(
    `INSERT INTO job_templates
      (template_key, job_title, job_description, required_skills,
       number_of_candidates, survey_question_1, survey_q1_expected_answer)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      template_key, job_title,
      job_description || null, required_skills || null,
      number_of_candidates || null,
      survey_question_1 || null, survey_q1_expected_answer || null
    ]
  );
  return result.rows[0];
};

exports.updateTemplate = async (templateKey, data) => {
  const {
    job_title, job_description, required_skills,
    number_of_candidates, survey_question_1, survey_q1_expected_answer
  } = data;

  const result = await db.query(
    `UPDATE job_templates
     SET job_title = $1, job_description = $2, required_skills = $3,
         number_of_candidates = $4, survey_question_1 = $5,
         survey_q1_expected_answer = $6, updated_at = CURRENT_TIMESTAMP
     WHERE template_key = $7
     RETURNING *`,
    [
      job_title, job_description || null, required_skills || null,
      number_of_candidates || null, survey_question_1 || null,
      survey_q1_expected_answer || null, templateKey
    ]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

exports.deleteTemplate = async (templateKey) => {
  const result = await db.query(
    `DELETE FROM job_templates WHERE template_key = $1 RETURNING template_key`,
    [templateKey]
  );
  return result.rows.length > 0;
};
