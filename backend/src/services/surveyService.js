const db = require("../config/db");

function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase();
}

function extractCandidateAnswer(answerMap, questionId) {
  return answerMap[questionId] ?? answerMap[String(questionId)] ?? "";
}

async function getAssessmentContextForScreening(screeningId) {
  const result = await db.query(
    `SELECT c.screening_id, c.jid, ha.id AS assessment_id
     FROM candidates_v2 c
     LEFT JOIN hr_assessments ha ON ha.jid = c.jid AND ha.status <> 'archived'
     WHERE c.screening_id = $1
     ORDER BY ha.created_at DESC NULLS LAST
     LIMIT 1`,
    [screeningId]
  );
  return result.rows[0] || null;
}

async function getPreScreeningQuestionsByAssessment(assessmentId) {
  if (!assessmentId) return [];
  const result = await db.query(
    `SELECT
       id,
       id AS question_id,
       question_text,
       answer_type AS question_type,
       options,
       is_mandatory,
       expected_answer,
       CASE WHEN expected_answer IS NULL THEN 'informational' ELSE 'qualifying' END AS question_category
     FROM hr_pre_screening_questions
     WHERE assessment_id = $1
     ORDER BY sort_order, id`,
    [assessmentId]
  );
  return result.rows.map((row) => ({
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
  }));
}

exports.getSurveyQuestions = async (screeningId) => {
  // 1) Candidate-specific survey questions if n8n pre-created them
  const perCandidate = await db.query(
    `SELECT
       id,
       question_id,
       question_text,
       question_type,
       options,
       expected_answer,
       is_qualifying,
       question_category
     FROM survey_questions
     WHERE screening_id = $1
     ORDER BY question_id`,
    [screeningId]
  );

  if (perCandidate.rows.length > 0) {
    return perCandidate.rows.map((row) => ({
      ...row,
      options: Array.isArray(row.options) ? row.options : [],
      is_mandatory: Boolean(row.is_qualifying),
    }));
  }

  // 2) Fallback to dedicated HR assessment pre-screening questions (single pre-pipeline phase)
  const ctx = await getAssessmentContextForScreening(screeningId);
  if (ctx?.assessment_id) {
    const fromAssessment = await getPreScreeningQuestionsByAssessment(
      ctx.assessment_id
    );
    if (fromAssessment.length > 0) {
      return fromAssessment;
    }
  }

  return [];
};

exports.submitSurveyAnswers = async (screeningId, answers) => {
  const ctx = await getAssessmentContextForScreening(screeningId);
  const candidateId = ctx?.screening_id || screeningId;
  const assessmentId = ctx?.assessment_id || null;
  const jid = ctx?.jid || null;

  const configuredQuestions = await exports.getSurveyQuestions(screeningId);
  const questionById = {};
  configuredQuestions.forEach((q) => {
    questionById[q.question_id] = q;
    questionById[String(q.question_id)] = q;
  });

  const answerMap = {};
  answers.forEach((a) => {
    answerMap[a.question_id] = a.answer;
    answerMap[String(a.question_id)] = a.answer;
  });

  const mandatoryUnanswered = [];
  const failedQuestions = [];
  let correctCount = 0;
  let qualifyingTotal = 0;

  for (const q of configuredQuestions) {
    const rawAnswer = extractCandidateAnswer(answerMap, q.question_id);
    const answer = String(rawAnswer || "").trim();

    if (q.is_mandatory && !answer) {
      mandatoryUnanswered.push({
        question_id: q.question_id,
        question_text: q.question_text,
      });
      continue;
    }

    const expected = String(q.expected_answer || "").trim();
    if (expected) {
      qualifyingTotal++;
      const matched = normalizeAnswer(answer) === normalizeAnswer(expected);
      if (matched) {
        correctCount++;
      } else {
        failedQuestions.push({
          question_id: q.question_id,
          question_text: q.question_text,
          expected: q.expected_answer,
          given: answer,
        });
      }
    }
  }

  if (mandatoryUnanswered.length > 0) {
    failedQuestions.push(
      ...mandatoryUnanswered.map((q) => ({
        ...q,
        expected: "required answer",
        given: "",
      }))
    );
  }

  const validationStatus = failedQuestions.length > 0 ? "failed" : "passed";
  const unlockAssessment = validationStatus === "passed";

  // Re-submission safe: replace responses for this screening id.
  await db.query(`DELETE FROM survey_responses WHERE screening_id = $1`, [screeningId]);

  for (const answer of answers) {
    const question = questionById[answer.question_id] || questionById[String(answer.question_id)];
    const expected = question?.expected_answer;
    const matchedExpected = expected
      ? normalizeAnswer(answer.answer) === normalizeAnswer(expected)
      : null;

    await db.query(
      `INSERT INTO survey_responses
       (screening_id, candidate_id, assessment_id, jid, question_id, response_text, matched_expected)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        screeningId,
        candidateId,
        assessmentId,
        jid,
        answer.question_id,
        answer.answer ?? "",
        matchedExpected,
      ]
    );
  }

  await db.query(
    `UPDATE candidates_v2
     SET survey_validation_status = $1,
         survey_completed_at = CURRENT_TIMESTAMP,
         technical_assessment_unlocked = $2
     WHERE screening_id = $3`,
    [validationStatus, unlockAssessment, screeningId]
  );

  return {
    message: "Survey answers saved successfully",
    validation_status: validationStatus,
    qualifying_total: qualifyingTotal,
    qualifying_passed: correctCount,
    failed_questions: failedQuestions,
    decision: unlockAssessment ? "pipeline_1_mcq" : "hold_or_reject",
  };
};
