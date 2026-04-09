const db = require("../config/db");
// Existing job_templates CRUD
exports.getAllTemplates = async () => {
  const result = await db.query(`
    SELECT
      template_key, job_title, job_description,
      required_skills, number_of_candidates,
      survey_question_1, survey_q1_expected_answer,
      time_limit_minutes,
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
  return result.rows[0] || null;
};

// Dropdown source: job_templates (mapped to assessment_templates shape)
exports.getAllAssessmentTemplates = async () => {
  const result = await db.query(`
    SELECT
      id,
      template_key   AS template_code,
      job_title      AS template_name,
      job_title      AS role_title,
      job_description,
      required_skills AS skills,
      created_at,
      updated_at
    FROM job_templates
    ORDER BY job_title ASC
  `);

  return result.rows;
};

exports.getAssessmentTemplateByCode = async (templateCode) => {
  const result = await db.query(
    `SELECT
       id,
       template_key   AS template_code,
       job_title      AS template_name,
       job_title      AS role_title,
       job_description,
       required_skills AS skills,
       survey_question_1,
       survey_q1_expected_answer,
       number_of_candidates,
       time_limit_minutes,
       pre_screening_questions
     FROM job_templates
     WHERE template_key = $1`,
    [templateCode]
  );

  return result.rows[0] || null;
};

exports.createTemplate = async (data) => {
  const {
    template_key, job_title, job_description,
    required_skills, number_of_candidates,
    survey_question_1, survey_q1_expected_answer,
    time_limit_minutes, pre_screening_questions
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
       number_of_candidates, survey_question_1, survey_q1_expected_answer,
       time_limit_minutes, pre_screening_questions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      template_key, job_title,
      job_description || null, required_skills || null,
      number_of_candidates || null,
      survey_question_1 || null, survey_q1_expected_answer || null,
      time_limit_minutes || 30,
      pre_screening_questions || null
    ]
  );
  return result.rows[0];
};

exports.updateTemplate = async (templateKey, data) => {
  const {
    job_title, job_description, required_skills,
    number_of_candidates, survey_question_1, survey_q1_expected_answer,
    time_limit_minutes, pre_screening_questions
  } = data;

  const result = await db.query(
    `UPDATE job_templates
     SET job_title = $1, job_description = $2, required_skills = $3,
         number_of_candidates = $4, survey_question_1 = $5,
         survey_q1_expected_answer = $6, time_limit_minutes = $7,
         pre_screening_questions = COALESCE($8, pre_screening_questions),
         updated_at = CURRENT_TIMESTAMP
     WHERE template_key = $9
     RETURNING *`,
    [
      job_title, job_description || null, required_skills || null,
      number_of_candidates || null, survey_question_1 || null,
      survey_q1_expected_answer || null, time_limit_minutes || 30,
      pre_screening_questions || null,
      templateKey
    ]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

exports.duplicateTemplate = async (templateKey) => {
  const original = await exports.getTemplateByKey(templateKey);
  if (!original) return null;

  const newKey = `${templateKey}_copy_${Date.now()}`;
  const result = await db.query(
    `INSERT INTO job_templates
      (template_key, job_title, job_description, required_skills,
       number_of_candidates, survey_question_1, survey_q1_expected_answer,
       time_limit_minutes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      newKey,
      `${original.job_title} (Copy)`,
      original.job_description,
      original.required_skills,
      original.number_of_candidates,
      original.survey_question_1,
      original.survey_q1_expected_answer,
      original.time_limit_minutes || 30,
    ]
  );
  return result.rows[0];
};

exports.deleteTemplate = async (templateKey) => {
  // Delete linked job_postings first (FK constraint)
  await db.query(
    `DELETE FROM job_postings WHERE template_id = (SELECT id FROM job_templates WHERE template_key = $1)`,
    [templateKey]
  );
  const result = await db.query(
    `DELETE FROM job_templates WHERE template_key = $1 RETURNING template_key`,
    [templateKey]
  );
  return result.rows.length > 0;
};
