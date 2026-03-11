const db = require("../config/db");

exports.getAllCandidates = async () => {
  const result = await db.query(`
    SELECT
      c.id, c.video_assessment_id, c.name, c.email, c.phone, c.created_at,
      e.final_score, e.interview_score, e.security_score, e.security_details,
      e.recommendation, e.security_violations_count, e.security_severity,
      e.decision_comment,
      ar.attention_metrics, ar.emotion_analysis, ar.face_detection, ar.violations_summary
    FROM video_interview_candidates c
    LEFT JOIN video_interview_evaluations e ON c.video_assessment_id = e.video_assessment_id
    LEFT JOIN video_analysis_results ar ON c.video_assessment_id = ar.video_assessment_id
    WHERE c.interview_completed = true
    ORDER BY c.created_at DESC
  `);

  return result.rows.map((row) => ({
    id: row.id,
    video_assessment_id: row.video_assessment_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    score: row.final_score || 0,
    date: row.created_at,
    interview_score: row.interview_score,
    security_score: row.security_score,
    recommendation: row.recommendation,
    security_details: row.security_details || {},
    attention_metrics: row.attention_metrics || {},
    emotion_analysis: row.emotion_analysis || {},
    face_detection: row.face_detection || {},
    violations_summary: row.violations_summary || {},
    security_violations_count: row.security_violations_count || 0,
    security_severity: row.security_severity || "low",
    decision_comment: row.decision_comment || null,
  }));
};

exports.getCandidateById = async (id) => {
  const result = await db.query(
    `SELECT
      c.*, e.*, ar.*,
      r.full_transcript, r.video_url
     FROM video_interview_candidates c
     LEFT JOIN video_interview_evaluations e ON c.video_assessment_id = e.video_assessment_id
     LEFT JOIN video_analysis_results ar ON c.video_assessment_id = ar.video_assessment_id
     LEFT JOIN video_interview_responses r ON c.video_assessment_id = r.video_assessment_id
     WHERE c.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

exports.updateCandidateComment = async (id, decision_comment) => {
  // Get video_assessment_id
  const candidateResult = await db.query(
    `SELECT video_assessment_id FROM video_interview_candidates WHERE id = $1`,
    [id]
  );
  if (candidateResult.rows.length === 0) return null;

  const videoAssessmentId = candidateResult.rows[0].video_assessment_id;

  // Upsert comment
  const updateResult = await db.query(
    `UPDATE video_interview_evaluations
     SET decision_comment = $1
     WHERE video_assessment_id = $2
     RETURNING *`,
    [decision_comment, videoAssessmentId]
  );

  if (updateResult.rows.length > 0) return updateResult.rows[0];

  // No evaluation row yet — insert one
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
      c.id, c.video_assessment_id, c.name, c.email, c.phone, c.created_at,
      e.final_score, e.security_details, e.decision_comment
     FROM video_interview_candidates c
     LEFT JOIN video_interview_evaluations e ON c.video_assessment_id = e.video_assessment_id
     WHERE c.name ILIKE $1 OR c.email ILIKE $1 OR c.phone ILIKE $1
     ORDER BY c.created_at DESC`,
    [`%${term}%`]
  );

  return result.rows.map((row) => ({
    id: row.id,
    video_assessment_id: row.video_assessment_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    score: row.final_score || 0,
    date: row.created_at,
    security_details: row.security_details || {},
    decision_comment: row.decision_comment || null,
  }));
};
