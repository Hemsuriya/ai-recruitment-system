const db = require("../config/db");

exports.validateSurvey = async (screening_id) => {
  const answersResult = await db.query(
    `SELECT question_id, response_text FROM survey_responses WHERE screening_id = $1`,
    [screening_id]
  );

  const questionsResult = await db.query(
    `SELECT question_id, expected_answer, validation_type, question_text
     FROM survey_questions
     WHERE screening_id = $1 AND is_qualifying = true`,
    [screening_id]
  );

  const answers = answersResult.rows;
  const qualifyingQuestions = questionsResult.rows;

  const answerMap = {};
  for (const a of answers) {
    answerMap[a.question_id] = a.response_text;
  }

  let passed = true;
  let correctCount = 0;
  const failedQuestions = [];

  if (qualifyingQuestions.length > 0) {
    for (const q of qualifyingQuestions) {
      const given    = (answerMap[q.question_id] || "").toLowerCase().trim();
      const expected = (q.expected_answer || "").toLowerCase().trim();

      if (q.validation_type === "exact_match" && expected) {
        if (given === expected) {
          correctCount++;
        } else {
          passed = false;
          failedQuestions.push({
            question_id:   q.question_id,
            question_text: q.question_text,
            expected,
            given,
          });
        }
      } else {
        correctCount++;
      }
    }
  } else {
    // Fallback: job_template expected answers
    const templateResult = await db.query(
      `SELECT jt.survey_question_1, jt.survey_q1_expected_answer
       FROM candidates_v2 c
       JOIN job_templates jt ON c.template_key = jt.template_key
       WHERE c.screening_id = $1`,
      [screening_id]
    );

    if (templateResult.rows.length > 0) {
      const template  = templateResult.rows[0];
      const expectedQ1 = (template.survey_q1_expected_answer || "").toLowerCase().trim();
      const givenQ1    = (answerMap[1] || "").toLowerCase().trim();

      if (expectedQ1 && givenQ1 !== expectedQ1) {
        passed = false;
        failedQuestions.push({ question_id: 1, expected: expectedQ1, given: givenQ1 });
      } else {
        correctCount++;
      }
    } else {
      // Last resort hardcoded fallback
      const q1 = (answerMap[1] || "").toLowerCase();
      if (q1 !== "yes") {
        passed = false;
        failedQuestions.push({ question_id: 1, expected: "yes", given: q1 });
      } else {
        correctCount++;
      }
      const q2Years = parseInt(answerMap[2] || "0");
      if (isNaN(q2Years) || q2Years < 2) {
        passed = false;
        failedQuestions.push({ question_id: 2, expected: ">=2", given: answerMap[2] });
      }
    }
  }

  const validationStatus = passed ? "passed" : "failed";

  // Update candidate record
  await db.query(
    `UPDATE candidates_v2
     SET technical_assessment_unlocked = $1,
         survey_validation_status = $2,
         survey_completed_at = NOW()
     WHERE screening_id = $3`,
    [passed, validationStatus, screening_id]
  );

  // Upsert into survey_validation_results (delete + insert to handle re-runs)
  await db.query(
    `DELETE FROM survey_validation_results WHERE screening_id = $1`,
    [screening_id]
  );

  await db.query(
    `INSERT INTO survey_validation_results
     (screening_id, validation_status, qualifying_questions_count,
      correct_answers_count, failed_questions, all_survey_responses, validated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [
      screening_id,
      validationStatus,
      qualifyingQuestions.length,
      correctCount,
      JSON.stringify(failedQuestions),
      JSON.stringify(answers),
    ]
  );

  return {
    screening_id,
    passed,
    validation_status: validationStatus,
    failed_questions:  failedQuestions,
  };
};