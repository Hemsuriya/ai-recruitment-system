const db = require("../config/db");

exports.getSurveyQuestions = async () => {

  const query = `
    SELECT id, question_text
    FROM survey_questions
    ORDER BY id
  `;

  const result = await db.query(query);

  return result.rows;
};


exports.submitSurveyAnswers = async (screening_id, answers) => {

  for (const answer of answers) {

    const query = `
      INSERT INTO survey_responses
      (screening_id, question_id, response_text)
      VALUES ($1,$2,$3)
    `;

    await db.query(query, [
      screening_id,
      answer.question_id,
      answer.answer
    ]);

  }

  return { message: "Survey answers saved successfully" };

};