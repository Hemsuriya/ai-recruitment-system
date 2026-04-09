const db = require("../config/db");

function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase();
}

function parseOptionalScoreMap(value) {
  if (!value) return null;
  const source =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        })()
      : value;

  if (!source || typeof source !== "object" || Array.isArray(source)) return null;

  const normalized = {};
  for (const [key, rawScore] of Object.entries(source)) {
    const answerKey = String(key || "").trim();
    const score = Number(rawScore);
    if (!answerKey || !Number.isFinite(score)) continue;
    normalized[answerKey] = score;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
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
       optional_weight,
       optional_score_map,
       CASE WHEN is_mandatory THEN 'mandatory' ELSE 'optional' END AS question_category
     FROM hr_pre_screening_questions
     WHERE assessment_id = $1
     ORDER BY sort_order, id`,
    [assessmentId]
  );
  return result.rows.map((row) => ({
    ...row,
    options: Array.isArray(row.options) ? row.options : [],
    optional_score_map: parseOptionalScoreMap(row.optional_score_map),
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
  const mandatoryFailures = [];
  let correctCount = 0;
  let qualifyingTotal = 0;
  let optionalWeightedScore = 0;
  let optionalWeightedMax = 0;
  const optionalBreakdown = [];

  for (const q of configuredQuestions) {
    const rawAnswer = extractCandidateAnswer(answerMap, q.question_id);
    const answer = String(rawAnswer || "").trim();
    const isMandatory = Boolean(q.is_mandatory);
    const expected = String(q.expected_answer || "").trim();

    if (isMandatory && !answer) {
      mandatoryUnanswered.push({
        question_id: q.question_id,
        question_text: q.question_text,
        reason: "mandatory_unanswered",
      });
      continue;
    }

    if (expected) {
      const matched = normalizeAnswer(answer) === normalizeAnswer(expected);
      if (isMandatory) {
        qualifyingTotal++;
        if (matched) {
          correctCount++;
        } else {
          mandatoryFailures.push({
            question_id: q.question_id,
            question_text: q.question_text,
            expected: q.expected_answer,
            given: answer,
            reason: "mandatory_expected_mismatch",
          });
        }
      } else {
        const weight =
          Number.isFinite(Number(q.optional_weight)) && Number(q.optional_weight) >= 0
            ? Number(q.optional_weight)
            : 1;
        const earned = matched ? 1 : 0;
        optionalWeightedScore += weight * earned;
        optionalWeightedMax += weight;
        optionalBreakdown.push({
          question_id: q.question_id,
          question_text: q.question_text,
          weight,
          matched_expected: matched,
          given: answer,
          expected: q.expected_answer,
        });
      }
      continue;
    }

    if (!isMandatory) {
      const parsedMap = parseOptionalScoreMap(q.optional_score_map);
      if (parsedMap) {
        const mappedScore = Number(parsedMap[answer] ?? parsedMap[normalizeAnswer(answer)] ?? 0);
        const maxMappedScore = Math.max(...Object.values(parsedMap));
        const weight =
          Number.isFinite(Number(q.optional_weight)) && Number(q.optional_weight) >= 0
            ? Number(q.optional_weight)
            : 1;
        const earnedRatio =
          maxMappedScore > 0 ? Math.max(0, mappedScore) / maxMappedScore : 0;
        optionalWeightedScore += weight * earnedRatio;
        optionalWeightedMax += weight;
        optionalBreakdown.push({
          question_id: q.question_id,
          question_text: q.question_text,
          weight,
          mapped_score: mappedScore,
          mapped_max: maxMappedScore,
          given: answer,
        });
      }
    }
  }

  if (mandatoryUnanswered.length > 0) {
    mandatoryFailures.push(
      ...mandatoryUnanswered.map((q) => ({
        ...q,
        expected: "required answer",
        given: "",
      }))
    );
  }

  // Mandatory gate first: optional score does not block progression.
  const validationStatus = mandatoryFailures.length > 0 ? "failed" : "passed";
  const unlockAssessment = validationStatus === "passed";
  const optionalScorePercent =
    optionalWeightedMax > 0
      ? Number(((optionalWeightedScore / optionalWeightedMax) * 100).toFixed(2))
      : null;

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

  await db.query(`DELETE FROM survey_validation_results WHERE screening_id = $1`, [
    screeningId,
  ]);
  await db.query(
    `INSERT INTO survey_validation_results
     (screening_id, validation_status, qualifying_questions_count, correct_answers_count, failed_questions, all_survey_responses, validation_details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      screeningId,
      validationStatus,
      qualifyingTotal,
      correctCount,
      JSON.stringify(mandatoryFailures),
      JSON.stringify(answers),
      JSON.stringify({
        gate_type: "mandatory_first",
        mandatory_failed_count: mandatoryFailures.length,
        optional_weighted_score: optionalWeightedScore,
        optional_weighted_max: optionalWeightedMax,
        optional_score_percent: optionalScorePercent,
        optional_breakdown: optionalBreakdown,
      }),
    ]
  );

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
    failed_questions: mandatoryFailures,
    optional_score_percent: optionalScorePercent,
    decision: unlockAssessment ? "pipeline_1_mcq" : "hold_or_reject",
    gate_reason:
      validationStatus === "passed"
        ? "mandatory_gate_passed"
        : "mandatory_gate_failed",
  };
};
