const db = require("../config/db");

exports.getSurveyQuestions = async (screening_id) => {
  // Try to get template-specific survey question first
  const templateResult = await db.query(
    `SELECT jt.survey_question_1
     FROM candidates_v2 c
     JOIN job_templates jt ON c.template_key = jt.template_key
     WHERE c.screening_id = $1`,
    [screening_id]
  );

  // If a template survey question exists, return it alongside generic questions
  const genericResult = await db.query(
    `SELECT id, question_text FROM survey_questions ORDER BY id`
  );

  const questions = genericResult.rows;

  if (templateResult.rows.length > 0 && templateResult.rows[0].survey_question_1) {
    // Prepend or override with template-specific question
    questions.unshift({
      id: 1,
      question_text: templateResult.rows[0].survey_question_1,
    });
  }

  return questions;
};

exports.submitSurveyAnswers = async (screening_id, answers) => {
  for (const answer of answers) {
    const query = `
      INSERT INTO survey_responses
      (screening_id, question_id, response_text)
      VALUES ($1, $2, $3)
    `;
    await db.query(query, [screening_id, answer.question_id, answer.answer]);
  }

  return { message: "Survey answers saved successfully" };
};