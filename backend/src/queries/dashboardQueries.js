exports.summaryQuery = `
  SELECT
    (SELECT COUNT(*)::int FROM candidates_v2) AS "totalCandidates",
    COALESCE(
      (SELECT ROUND(AVG(final_score))::int FROM video_interview_evaluations),
      0
    ) AS "avgScore",
    (
      SELECT COUNT(*)::int
      FROM video_interview_evaluations
      WHERE recommendation = 'hire'
    ) AS "shortlisted",
    (
      SELECT COUNT(*)::int
      FROM video_interview_candidates
      WHERE status IN ('invited', 'in_progress')
    ) AS "pendingDecision"
`;

exports.funnelQuery = `
  SELECT 'Resume' AS stage, COUNT(*)::int AS count FROM candidates_v2
  UNION ALL
  SELECT 'MCQ' AS stage, COUNT(*)::int AS count FROM assessment_results_v2
  UNION ALL
  SELECT 'Video' AS stage, COUNT(*)::int AS count FROM video_interview_candidates
  UNION ALL
  SELECT 'Final' AS stage, COUNT(*)::int AS count FROM video_interview_evaluations
`;

exports.stageScoresQuery = `
  SELECT 'Resume' AS stage, COALESCE(ROUND(AVG(match_score))::int, 0) AS "avgScore"
  FROM candidates_v2
  UNION ALL
  SELECT 'MCQ' AS stage, COALESCE(ROUND(AVG(score_percentage))::int, 0) AS "avgScore"
  FROM assessment_results_v2
  UNION ALL
  SELECT 'Video' AS stage, COALESCE(ROUND(AVG(interview_score))::int, 0) AS "avgScore"
  FROM video_interview_evaluations
  UNION ALL
  SELECT 'Final' AS stage, COALESCE(ROUND(AVG(final_score))::int, 0) AS "avgScore"
  FROM video_interview_evaluations
`;

exports.recentCandidatesQuery = `
  SELECT
    vic.name,
    vic.job_title AS role,
    COALESCE(c.match_score, 0) AS resume,
    COALESCE(ar.score_percentage, 0) AS mcq,
    COALESCE(vie.interview_score, 0) AS video,
    COALESCE(vie.recommendation, 'pending') AS verdict
  FROM video_interview_candidates vic
  LEFT JOIN candidates_v2 c
    ON LOWER(c.email) = LOWER(vic.email)
  LEFT JOIN assessment_results_v2 ar
    ON ar.screening_id = c.screening_id
  LEFT JOIN video_interview_evaluations vie
    ON vie.video_assessment_id = vic.video_assessment_id
  ORDER BY vic.created_at DESC
  LIMIT 10
`;

exports.recentActivityQuery = `
  SELECT text, "type", event_time
  FROM (
    SELECT
      c.created_at AS event_time,
      CONCAT(c.name, ' entered resume screening') AS text,
      'resume' AS "type"
    FROM candidates_v2 c
    WHERE c.created_at IS NOT NULL

    UNION ALL

    SELECT
      ar.completed_at AS event_time,
      CONCAT(c.name, ' completed MCQ assessment') AS text,
      'mcq' AS "type"
    FROM assessment_results_v2 ar
    JOIN candidates_v2 c
      ON c.screening_id = ar.screening_id
    WHERE ar.completed_at IS NOT NULL

    UNION ALL

    SELECT
      vic.updated_at AS event_time,
      CASE
        WHEN vic.status = 'completed' OR vic.interview_completed = TRUE
          THEN CONCAT(vic.name, ' completed video interview')
        ELSE CONCAT(vic.name, ' moved to video stage')
      END AS text,
      'video' AS "type"
    FROM video_interview_candidates vic
    WHERE vic.updated_at IS NOT NULL

    UNION ALL

    SELECT
      vie.evaluated_at AS event_time,
      CONCAT(vic.name, ' received ', COALESCE(vie.recommendation, 'pending'), ' verdict') AS text,
      'final' AS "type"
    FROM video_interview_evaluations vie
    JOIN video_interview_candidates vic
      ON vic.video_assessment_id = vie.video_assessment_id
    WHERE vie.evaluated_at IS NOT NULL
  ) activity
  ORDER BY event_time DESC
  LIMIT 10
`;
