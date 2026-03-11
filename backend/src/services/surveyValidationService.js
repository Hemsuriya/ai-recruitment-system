const db = require("../config/db");

exports.validateSurvey = async (screening_id) => {
  // Get candidate's answers
  const answersResult = await db.query(
    `SELECT question_id, response_text
     FROM survey_responses
     WHERE screening_id = $1`,
    [screening_id]
  );

  // Try to get expected answers from job_templates via candidate's template_key
  const templateResult = await db.query(
    `SELECT jt.survey_question_1, jt.survey_q1_expected_answer
     FROM candidates_v2 c
     JOIN job_templates jt ON c.template_key = jt.template_key
     WHERE c.screening_id = $1`,
    [screening_id]
  );

  const answers = answersResult.rows;
  let passed = true;

  if (templateResult.rows.length > 0) {
    // Dynamic validation against template expected answers
    const template = templateResult.rows[0];
    const expectedQ1 = template.survey_q1_expected_answer?.toLowerCase().trim();

    for (const ans of answers) {
      if (ans.question_id === 1 && expectedQ1) {
        if (ans.response_text.toLowerCase().trim() !== expectedQ1) {
          passed = false;
        }
      }
    }
  } else {
    // Fallback: basic hardcoded validation
    for (const ans of answers) {
      if (ans.question_id === 1 && ans.response_text.toLowerCase() !== "yes") {
        passed = false;
      }
      if (ans.question_id === 2) {
        const years = parseInt(ans.response_text);
        if (isNaN(years) || years < 2) passed = false;
      }
    }
  }

  if (passed) {
    await db.query(
      `UPDATE candidates_v2
       SET technical_assessment_unlocked = true
       WHERE screening_id = $1`,
      [screening_id]
    );
  }

  return { screening_id, passed };
};