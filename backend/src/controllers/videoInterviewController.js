const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, "../../uploads/videos");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "video/webm",
      "video/mp4",
      "video/ogg",
      "video/x-matroska",
      "application/octet-stream",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

exports.uploadMiddleware = upload.array("videos", 20);

// ── GET /assessment/video-questions/:assessmentId ───────────
exports.getVideoQuestions = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const candidate = await db.query(
      `SELECT video_assessment_id, name, email, status, interview_started, interview_completed
       FROM video_interview_candidates
       WHERE video_assessment_id = $1`,
      [assessmentId]
    );

    if (candidate.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    if (candidate.rows[0].interview_completed) {
      return res
        .status(400)
        .json({ success: false, message: "Interview already completed" });
    }

    const questions = await db.query(
      `SELECT question_id, question_text, question_type, category, difficulty, time_limit,
              evaluation_criteria, key_points
       FROM video_interview_questions
       WHERE video_assessment_id = $1
       ORDER BY question_id`,
      [assessmentId]
    );

    const jobReqs = await db.query(
      `SELECT job_title, total_duration, time_per_question, question_count
       FROM video_job_requirements
       WHERE video_assessment_id = $1
       LIMIT 1`,
      [assessmentId]
    );

    // Mark interview as started (idempotent).
    // Use updated_at as the effective start timestamp because some DB
    // environments do not have interview_started_at column yet.
    await db.query(
      `UPDATE video_interview_candidates
       SET interview_started = true, status = 'in_progress', updated_at = NOW()
       WHERE video_assessment_id = $1 AND interview_started = false`,
      [assessmentId]
    );

    const reqs = jobReqs.rows[0];
    const totalDuration =
      reqs?.total_duration ||
      questions.rows.reduce((sum, q) => sum + (q.time_limit || 120), 0);

    res.status(200).json({
      success: true,
      data: {
        candidate: {
          video_assessment_id: candidate.rows[0].video_assessment_id,
          name: candidate.rows[0].name,
          email: candidate.rows[0].email,
        },
        questions: questions.rows.map((q) => ({
          id: q.question_id,
          text: q.question_text,
          type: q.question_type,
          category: q.category,
          difficulty: q.difficulty,
          time_limit: q.time_limit || 120,
        })),
        total_duration: totalDuration,
        total_questions: questions.rows.length,
      },
    });
  } catch (error) {
    console.error("Error fetching video questions:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch video questions" });
  }
};

// ── POST /assessment/proctor-event ──────────────────────────
exports.logProctoringEvent = async (req, res) => {
  try {
    const { video_assessment_id, event_type, question_index, metadata } = req.body;

    if (!video_assessment_id || !event_type) {
      return res
        .status(400)
        .json({ success: false, message: "video_assessment_id and event_type are required" });
    }

    const allowed = [
      "tab_blur", "tab_focus", "camera_off", "camera_on",
      "mic_off", "mic_on", "fullscreen_exit", "fullscreen_enter",
      "multiple_faces", "no_face", "devtools_open",
    ];
    if (!allowed.includes(event_type)) {
      return res
        .status(400)
        .json({ success: false, message: `Unknown event_type: ${event_type}` });
    }

    await db.query(
      `INSERT INTO proctoring_events
         (video_assessment_id, event_type, question_index, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        video_assessment_id,
        event_type,
        question_index ?? null,
        metadata ? JSON.stringify(metadata) : "{}",
      ]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error logging proctoring event:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to log proctoring event" });
  }
};

// ── POST /assessment/video-submit ───────────────────────────
exports.submitVideoResponse = async (req, res) => {
  try {
    const { video_assessment_id, metadata } = req.body;
    const files = req.files || [];

    if (!video_assessment_id) {
      return res
        .status(400)
        .json({ success: false, message: "video_assessment_id is required" });
    }

    // Verify candidate exists
    const candidate = await db.query(
      `SELECT video_assessment_id, name, email, interview_started, interview_completed, created_at, updated_at
       FROM video_interview_candidates
       WHERE video_assessment_id = $1`,
      [video_assessment_id]
    );

    if (candidate.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    // Duplicate prevention
    if (candidate.rows[0].interview_completed) {
      return res
        .status(409)
        .json({ success: false, message: "Interview already submitted" });
    }

    // Timing validation
    // Be resilient: if start marker is missing (older rows / partial flows),
    // do not block candidate submission.
    let started = candidate.rows[0].interview_started;
    let interviewStartedAt = candidate.rows[0].updated_at || candidate.rows[0].created_at;
    if (!started) {
      await db.query(
        `UPDATE video_interview_candidates
         SET interview_started = true, status = 'in_progress', updated_at = NOW()
         WHERE video_assessment_id = $1`,
        [video_assessment_id]
      );
      started = true;
      interviewStartedAt = new Date();
    }

    // Compute allowed duration: job_requirements total_duration, else sum of question time_limits
    const durationResult = await db.query(
      `SELECT COALESCE(
         (SELECT total_duration FROM video_job_requirements WHERE video_assessment_id = $1 LIMIT 1),
         (SELECT SUM(COALESCE(time_limit, 120)) FROM video_interview_questions WHERE video_assessment_id = $1)
       ) AS allowed_seconds`,
      [video_assessment_id]
    );
    const allowedSeconds = parseInt(durationResult.rows[0]?.allowed_seconds, 10) || 0;
    const gracePeriod = Number(process.env.VIDEO_SUBMISSION_GRACE_SECONDS || 1800); // default 30 min grace
    const startTime = new Date(interviewStartedAt);
    const deadline = new Date(startTime.getTime() + (allowedSeconds + gracePeriod) * 1000);

    if (allowedSeconds > 0 && Number.isFinite(startTime.getTime()) && new Date() > deadline) {
      return res
        .status(400)
        .json({ success: false, message: "Submission window has expired" });
    }

    let questionMeta = [];
    try {
      questionMeta = metadata ? JSON.parse(metadata) : [];
    } catch (_) {
      /* ignore parse error */
    }

    const videoFiles = files.map((file, idx) => ({
      question_id: questionMeta[idx]?.question_id ?? idx + 1,
      question_index: questionMeta[idx]?.question_index ?? idx,
      file_path: `/uploads/videos/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    }));

    const totalDuration = questionMeta.reduce(
      (sum, m) => sum + (m.duration || 0),
      0
    );

    // Insert response row
    await db.query(
      `INSERT INTO video_interview_responses
         (video_assessment_id, candidate_name, candidate_email, video_url, video_duration)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        video_assessment_id,
        candidate.rows[0].name,
        candidate.rows[0].email,
        JSON.stringify({ question_videos: videoFiles }),
        totalDuration || null,
      ]
    );

    // Mark candidate interview as completed
    await db.query(
      `UPDATE video_interview_candidates
       SET interview_completed = true,
           videos_uploaded = true,
           status = 'completed',
           updated_at = NOW()
       WHERE video_assessment_id = $1`,
      [video_assessment_id]
    );

    res.status(200).json({
      success: true,
      data: {
        video_assessment_id,
        files_uploaded: videoFiles.length,
        total_duration: totalDuration,
      },
    });
  } catch (error) {
    console.error("Error submitting video response:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit video response" });
  }
};
