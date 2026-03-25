const db = require("../config/db");
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

  if (result.rows.length === 0) return null;
  return result.rows[0];
};