const db = require("../config/db");

exports.getSurveyQuestions = async (screening_id) => {
  // 1. Try per-candidate survey_questions first (inserted by n8n workflow)
  const perCandidate = await db.query(
    `SELECT id, question_id, question_text, question_type, options, is_qualifying, question_category
     FROM survey_questions
     WHERE screening_id = $1
     ORDER BY question_id`,
    [screening_id]
  );

  if (perCandidate.rows.length > 0) {
    return perCandidate.rows;
  }

  // 2. Fallback: get questions from hr_assessment_questions via candidate's JID
  const hrQuestions = await db.query(
    `SELECT haq.id, haq.question_text, haq.is_default, haq.sort_order
     FROM hr_assessment_questions haq
     JOIN hr_assessments ha ON ha.id = haq.assessment_id
     JOIN candidates_v2 c ON c.jid = ha.jid
     WHERE c.screening_id = $1
     ORDER BY haq.sort_order`,
    [screening_id]
  );

  if (hrQuestions.rows.length > 0) {
    return hrQuestions.rows.map((q, i) => ({
      id: q.id,
      question_id: i + 1,
      question_text: q.question_text,
      question_type: "text",
      options: null,
      is_qualifying: false,
      question_category: "informational",
    }));
  }

  // 3. Last fallback: generic survey questions (no screening_id filter)
  const generic = await db.query(
    `SELECT id, question_text FROM survey_questions WHERE screening_id IS NULL ORDER BY id`
  );

  return generic.rows;
};

exports.submitSurveyAnswers = async (screening_id, answers) => {
  // Store each answer
  for (const answer of answers) {
    await db.query(
      `INSERT INTO survey_responses (screening_id, question_id, response_text)
       VALUES ($1, $2, $3)`,
      [screening_id, answer.question_id, answer.answer]
    );
  }

  // Validate qualifying questions against expected answers
  const qualifyingQuestions = await db.query(
    `SELECT question_id, expected_answer, question_text
     FROM survey_questions
     WHERE screening_id = $1 AND is_qualifying = true AND expected_answer IS NOT NULL`,
    [screening_id]
  );

  let validationStatus = "passed";
  let correctCount = 0;
  const failedQuestions = [];

  if (qualifyingQuestions.rows.length > 0) {
    const answerMap = {};
    answers.forEach((a) => { answerMap[a.question_id] = a.answer; });

    for (const q of qualifyingQuestions.rows) {
      const candidateAnswer = (answerMap[q.question_id] || "").trim().toLowerCase();
      const expected = (q.expected_answer || "").trim().toLowerCase();
      if (candidateAnswer === expected) {
        correctCount++;
      } else {
        failedQuestions.push({
          question_id: q.question_id,
          question_text: q.question_text,
          expected: q.expected_answer,
          given: answerMap[q.question_id] || "",
        });
      }
    }

    if (failedQuestions.length > 0) {
      validationStatus = "failed";
    }
  }

  // Update candidate survey status
  await db.query(
    `UPDATE candidates_v2
     SET survey_validation_status = $1,
         survey_completed_at = CURRENT_TIMESTAMP,
         technical_assessment_unlocked = $2
     WHERE screening_id = $3`,
    [validationStatus, validationStatus === "passed", screening_id]
  );

  return {
    message: "Survey answers saved successfully",
    validation_status: validationStatus,
    qualifying_total: qualifyingQuestions.rows.length,
    qualifying_passed: correctCount,
    failed_questions: failedQuestions,
  };
};
