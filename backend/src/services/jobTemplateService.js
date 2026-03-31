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

// Dropdown source: assessment_templates
exports.getAllAssessmentTemplates = async () => {
  const result = await db.query(`
    SELECT
      id,
      template_code,
      template_name,
      role_title,
      experience_level,
      skills,
      job_description,
      include_ai_questions,
      include_coding_round,
      include_aptitude_test,
      include_ai_video_interview,
      include_manual_video_interview,
      created_at,
      updated_at
    FROM assessment_templates
    ORDER BY template_name ASC
  `);

  return result.rows;
};

exports.getAssessmentTemplateByCode = async (templateCode) => {
  const result = await db.query(
    `
    SELECT *
    FROM assessment_templates
    WHERE template_code = $1
    `,
    [templateCode]
  );

  return result.rows[0] || null;
};

exports.createTemplate = async (data) => {
  const {
    template_key, job_title, job_description,
    required_skills, number_of_candidates,
    survey_question_1, survey_q1_expected_answer,
    time_limit_minutes
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
       time_limit_minutes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      template_key, job_title,
      job_description || null, required_skills || null,
      number_of_candidates || null,
      survey_question_1 || null, survey_q1_expected_answer || null,
      time_limit_minutes || 30
    ]
  );
  return result.rows[0];
};

exports.updateTemplate = async (templateKey, data) => {
  const {
    job_title, job_description, required_skills,
    number_of_candidates, survey_question_1, survey_q1_expected_answer,
    time_limit_minutes
  } = data;

  const result = await db.query(
    `UPDATE job_templates
     SET job_title = $1, job_description = $2, required_skills = $3,
         number_of_candidates = $4, survey_question_1 = $5,
         survey_q1_expected_answer = $6, time_limit_minutes = $7,
         updated_at = CURRENT_TIMESTAMP
     WHERE template_key = $8
     RETURNING *`,
    [
      job_title, job_description || null, required_skills || null,
      number_of_candidates || null, survey_question_1 || null,
      survey_q1_expected_answer || null, time_limit_minutes || 30,
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
  const result = await db.query(
    `DELETE FROM job_templates WHERE template_key = $1 RETURNING template_key`,
    [templateKey]
  );
  return result.rows.length > 0;
};
