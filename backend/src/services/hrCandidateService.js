const db = require("../config/db");

exports.getAllCandidates = async (filters = {}) => {
  const params = [];
  const videoConditions = [];
  const mcqConditions = ["1=1"];

  if (filters.jid) {
    params.push(filters.jid);
    videoConditions.push(`(
      c.jid = $${params.length}
      OR (
        c.jid IS NULL AND EXISTS (
          SELECT 1
          FROM candidates_v2 cvx
          WHERE cvx.email = c.email AND cvx.jid = $${params.length}
        )
      )
    )`);
    mcqConditions.push(`cv.jid = $${params.length}`);
  }

  if (filters.job_title) {
    params.push(filters.job_title);
    videoConditions.push(`(
      c.job_title = $${params.length}
      OR (
        c.job_title IS NULL AND EXISTS (
          SELECT 1
          FROM candidates_v2 cvx
          WHERE cvx.email = c.email AND cvx.job_title = $${params.length}
        )
      )
    )`);
    mcqConditions.push(`cv.job_title = $${params.length}`);
  }

  const videoWhere = videoConditions.length > 0 ? `WHERE ${videoConditions.join(" AND ")}` : "";
  const mcqWhere = mcqConditions.length > 0 ? `WHERE ${mcqConditions.join(" AND ")}` : "";

  const result = await db.query(`
    -- Video interview candidates (existing flow)
    SELECT
      c.id::text AS id, c.video_assessment_id, c.name, c.email, c.phone, c.jid, c.job_title, c.created_at,
      e.final_score, e.interview_score, e.security_score, e.security_details,
      e.recommendation, e.security_violations_count, e.security_severity,
      e.decision_comment,
      ar.attention_metrics, ar.emotion_analysis, ar.face_detection, ar.violations_summary,
      cv2.match_score AS resume_score,
      asr.score_percentage AS mcq_score,
      'video' AS source
    FROM video_interview_candidates c
    LEFT JOIN video_interview_evaluations e  ON c.video_assessment_id = e.video_assessment_id
    LEFT JOIN video_analysis_results ar      ON c.video_assessment_id = ar.video_assessment_id
    LEFT JOIN LATERAL (
      SELECT cvx.screening_id, cvx.match_score
      FROM candidates_v2 cvx
      WHERE cvx.email = c.email
        AND (c.jid IS NULL OR cvx.jid = c.jid)
      ORDER BY cvx.created_at DESC
      LIMIT 1
    ) cv2 ON TRUE
    LEFT JOIN assessment_results_v2 asr      ON cv2.screening_id = asr.screening_id
    ${videoWhere}

    UNION ALL

    -- MCQ-only candidates from n8n pipeline (no video interview)
    SELECT
      cv.screening_id AS id, NULL AS video_assessment_id, cv.name, cv.email, cv.phone,
      cv.jid, cv.job_title, cv.created_at,
      asr.score_percentage AS final_score,
      NULL AS interview_score, NULL AS security_score, NULL AS security_details,
      NULL AS recommendation, 0 AS security_violations_count, 'low' AS security_severity,
      NULL AS decision_comment,
      NULL AS attention_metrics, NULL AS emotion_analysis, NULL AS face_detection, NULL AS violations_summary,
      cv.match_score AS resume_score,
      asr.score_percentage AS mcq_score,
      'mcq' AS source
    FROM candidates_v2 cv
    INNER JOIN assessment_results_v2 asr ON cv.screening_id = asr.screening_id
    LEFT JOIN video_interview_candidates vic
      ON cv.email = vic.email
     AND (vic.jid = cv.jid OR (vic.jid IS NULL AND cv.jid IS NULL))
    ${mcqWhere} AND vic.id IS NULL

    ORDER BY created_at DESC
  `, params);

  return result.rows.map((row) => ({
    id:                        row.id,
    video_assessment_id:       row.video_assessment_id,
    name:                      row.name,
    email:                     row.email,
    phone:                     row.phone || "",
    jid:                       row.jid || null,
    job_title:                 row.job_title || null,
    score:                     row.final_score || 0,
    date:                      row.created_at,
    interview_score:           row.interview_score,
    security_score:            row.security_score,
    resume_score:              row.resume_score || null,
    mcq_score:                 row.mcq_score || null,
    recommendation:            row.recommendation,
    security_details:          row.security_details || {},
    attention_metrics:         row.attention_metrics || {},
    emotion_analysis:          row.emotion_analysis || {},
    face_detection:            row.face_detection || {},
    violations_summary:        row.violations_summary || {},
    security_violations_count: row.security_violations_count || 0,
    security_severity:         row.security_severity || "low",
    decision_comment:          row.decision_comment || null,
    source:                    row.source,
  }));
};

exports.getCandidateById = async (id) => {
  // Check if id is a screening_id (string like scr_...) → MCQ-only candidate
  const isScreeningId = isNaN(Number(id));

  if (isScreeningId) {
    // MCQ-only candidate from candidates_v2
    const result = await db.query(
      `SELECT
        cv.screening_id AS id,
        NULL AS video_assessment_id,
        cv.name,
        cv.email,
        cv.phone,
        cv.location,
        cv.job_title,
        cv.jid,
        cv.status,
        false AS interview_started,
        false AS interview_completed,
        false AS videos_uploaded,
        NULL AS proctoring_flags,
        cv.created_at,
        cv.created_at AS updated_at,
        NULL AS interview_score,
        NULL AS security_score,
        asr.score_percentage AS final_score,
        NULL AS question_scores,
        0 AS security_violations_count,
        'low' AS security_severity,
        NULL AS security_details,
        NULL AS strengths,
        NULL AS weaknesses,
        NULL AS overall_feedback,
        NULL AS recommendation,
        NULL AS evaluated_by,
        NULL AS evaluated_at,
        NULL AS final_decision,
        NULL AS decision_by,
        NULL AS decision_at,
        NULL AS decision_comment,
        NULL AS emotion_analysis,
        NULL AS attention_metrics,
        NULL AS face_detection,
        NULL AS violations_summary,
        NULL AS full_report,
        NULL AS analysis_status,
        NULL AS frames_processed,
        NULL AS video_duration_seconds,
        NULL AS full_transcript,
        NULL AS video_url,
        NULL AS video_duration,
        NULL AS video_uploaded_at,
        cv.match_score AS resume_score,
        cv.current_company,
        cv.experience_level,
        cv.salary_expectation,
        cv.required_skills AS candidate_skills,
        NULL AS notice_period,
        NULL AS visa_status,
        asr.score_percentage AS mcq_score,
        asr.grade AS mcq_grade,
        asr.total_questions AS mcq_total_questions,
        asr.correct_answers AS mcq_correct_answers,
        asr.answers AS mcq_answers,
        asr.time_spent AS mcq_time_spent,
        cv.identity_verified
       FROM candidates_v2 cv
       LEFT JOIN assessment_results_v2 asr ON cv.screening_id = asr.screening_id
       WHERE cv.screening_id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  // Numeric id → video interview candidate (existing flow)
  const result = await db.query(
    `SELECT
      c.id,
      c.video_assessment_id,
      c.name,
      c.email,
      c.phone,
      c.location,
      c.job_title,
      c.jid,
      c.status,
      c.interview_started,
      c.interview_completed,
      c.videos_uploaded,
      c.proctoring_flags,
      c.created_at,
      c.updated_at,
      e.interview_score,
      e.security_score,
      e.final_score,
      e.question_scores,
      e.security_violations_count,
      e.security_severity,
      e.security_details,
      e.strengths,
      e.weaknesses,
      e.overall_feedback,
      e.recommendation,
      e.evaluated_by,
      e.evaluated_at,
      e.final_decision,
      e.decision_by,
      e.decision_at,
      e.decision_comment,
      ar.emotion_analysis,
      ar.attention_metrics,
      ar.face_detection,
      ar.violations_summary,
      ar.full_report,
      ar.analysis_status,
      ar.frames_processed,
      ar.video_duration_seconds,
      r.full_transcript,
      r.video_url,
      r.video_duration,
      r.uploaded_at AS video_uploaded_at,
      cv2.match_score AS resume_score,
      cv2.current_company,
      cv2.experience_level,
      cv2.salary_expectation,
      cv2.required_skills AS candidate_skills,
      cv2.notice_period,
      cv2.visa_status,
      asr.score_percentage AS mcq_score,
      asr.grade AS mcq_grade,
      asr.total_questions AS mcq_total_questions,
      asr.correct_answers AS mcq_correct_answers
     FROM video_interview_candidates c
     LEFT JOIN video_interview_evaluations e ON c.video_assessment_id = e.video_assessment_id
     LEFT JOIN video_analysis_results ar     ON c.video_assessment_id = ar.video_assessment_id
     LEFT JOIN video_interview_responses r   ON c.video_assessment_id = r.video_assessment_id
     LEFT JOIN candidates_v2 cv2             ON c.email = cv2.email
     LEFT JOIN assessment_results_v2 asr     ON cv2.screening_id = asr.screening_id
     WHERE c.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

exports.updateCandidateComment = async (id, decision_comment) => {
  const candidateResult = await db.query(
    `SELECT video_assessment_id FROM video_interview_candidates WHERE id = $1`,
    [id]
  );
  if (candidateResult.rows.length === 0) return null;

  const videoAssessmentId = candidateResult.rows[0].video_assessment_id;

  const updateResult = await db.query(
    `UPDATE video_interview_evaluations
     SET decision_comment = $1
     WHERE video_assessment_id = $2
     RETURNING *`,
    [decision_comment, videoAssessmentId]
  );

  if (updateResult.rows.length > 0) return updateResult.rows[0];

  const insertResult = await db.query(
    `INSERT INTO video_interview_evaluations (video_assessment_id, decision_comment)
     VALUES ($1, $2) RETURNING *`,
    [videoAssessmentId, decision_comment]
  );
  return insertResult.rows[0];
};

exports.searchCandidates = async (term) => {
  const result = await db.query(
    `SELECT
      c.id, c.video_assessment_id, c.name, c.email, c.phone, c.jid, c.created_at,
      e.final_score, e.security_details, e.decision_comment
     FROM video_interview_candidates c
     LEFT JOIN video_interview_evaluations e ON c.video_assessment_id = e.video_assessment_id
     WHERE c.name ILIKE $1 OR c.email ILIKE $1 OR c.phone ILIKE $1
     ORDER BY c.created_at DESC`,
    [`%${term}%`]
  );

  return result.rows.map((row) => ({
    id:                  row.id,
    video_assessment_id: row.video_assessment_id,
    name:                row.name,
    email:               row.email,
    phone:               row.phone,
    jid:                 row.jid || null,
    score:               row.final_score || 0,
    date:                row.created_at,
    security_details:    row.security_details || {},
    decision_comment:    row.decision_comment || null,
  }));
};
