const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const db = require("./config/db");

const candidateRoutes = require("./routes/candidateRoutes");
const surveyRoutes = require("./routes/surveyRoutes");
const validationRoutes = require("./routes/validationRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const jobTemplateRoutes = require("./routes/jobTemplateRoutes");
const hrCandidateRoutes = require("./routes/hrCandidateRoutes");
const jobPostingRoutes = require("./routes/jobPostingRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const assessmentConfigRoutes = require("./routes/assessmentConfigRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const videoInterviewRoutes = require("./routes/videoInterviewRoutes");


const app = express();

// ─── Security middleware FIRST ───────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "http://localhost:5000"],
        frameSrc: ["'self'", "http://localhost:5678"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
// ------ Serve frontend static files ----------------------
app.use(express.static(path.join(__dirname, "../frontend")));

// ─── Candidate-facing routes ─────────────────────────────────
app.use("/candidate", candidateRoutes);
app.use("/survey", surveyRoutes);
app.use("/validation", validationRoutes);
app.use("/assessment", assessmentRoutes);
app.use("/assessment", videoInterviewRoutes);

// ─── HR Portal routes ─────────────────────────────────────────
app.use("/api/job-templates", jobTemplateRoutes);
app.use("/api/job-postings", jobPostingRoutes);
app.use("/api/hr/candidates", hrCandidateRoutes);
app.use("/api/hr/assessments", assessmentConfigRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);

// ─── Frontend Pages ─────────────────────────────────────────

// HR Portal
app.get("/hr", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/hr/index.html"));
});

// MCQ Assessment
app.get("/assessment-page", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/candidate/MCQ/assessment_html_page.html")
  );
});

// Video Interview
app.get("/video-interview", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/candidate/Video Interview/video-interview.html")
  );
});

// ─── Health & diagnostics ────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.get("/db-test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "AI Candidate Screening API Running", version: "1.0.0" });
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ─── Startup migrations ───────────────────────────────────────
(async () => {
  try {
    await db.query(`
      ALTER TABLE job_templates
        ADD COLUMN IF NOT EXISTS pre_screening_questions text[];
    `);
    await db.query(`
      ALTER TABLE hr_members
        ADD COLUMN IF NOT EXISTS department_id integer
          REFERENCES departments(id) ON DELETE SET NULL;
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_pre_screening_questions (
        id SERIAL PRIMARY KEY,
        assessment_id INTEGER NOT NULL REFERENCES hr_assessments(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        answer_type VARCHAR(20) NOT NULL
          CHECK (answer_type IN ('yes_no', 'mcq', 'text')),
        options JSONB,
        is_mandatory BOOLEAN DEFAULT false,
        expected_answer TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`
      ALTER TABLE survey_responses
        ADD COLUMN IF NOT EXISTS candidate_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS assessment_id INTEGER REFERENCES hr_assessments(id),
        ADD COLUMN IF NOT EXISTS jid VARCHAR(20),
        ADD COLUMN IF NOT EXISTS matched_expected BOOLEAN;
    `);
    console.log("✅ Startup migrations applied");

    // ─── Seed departments + members (only if tables are empty) ───
    const { rows: deptRows } = await db.query(`SELECT COUNT(*) FROM departments`);
    if (parseInt(deptRows[0].count, 10) === 0) {
      await db.query(`
        INSERT INTO departments (name) VALUES
          ('Data Science'),
          ('Engineering'),
          ('Product'),
          ('Marketing'),
          ('Finance')
        ON CONFLICT DO NOTHING
      `);
      console.log("✅ Seeded departments");
    }

    const { rows: memberRows } = await db.query(`SELECT COUNT(*) FROM hr_members`);
    if (parseInt(memberRows[0].count, 10) === 0) {
      await db.query(`
        INSERT INTO hr_members (name, email, role, department_id)
        SELECT m.name, m.email, m.role, d.id
        FROM (VALUES
          ('Arjun Sharma',    'arjun@company.com',    'Manager',  'Data Science'),
          ('Ankith Verma',    'ankith@company.com',   'Lead',     'Data Science'),
          ('Priya Nair',      'priya@company.com',    'Manager',  'Engineering'),
          ('Rahul Mehta',     'rahul@company.com',    'Lead',     'Engineering'),
          ('Sneha Iyer',      'sneha@company.com',    'Manager',  'Product'),
          ('Karthik Rao',     'karthik@company.com',  'Director', 'Product'),
          ('Divya Pillai',    'divya@company.com',    'Manager',  'Marketing'),
          ('Rohan Gupta',     'rohan@company.com',    'HR',       'Finance')
        ) AS m(name, email, role, dept_name)
        JOIN departments d ON d.name = m.dept_name
        ON CONFLICT DO NOTHING
      `);
      console.log("✅ Seeded HR members");
    } else {
      // Existing members with no department_id: assign to matching dept if name hints
      // (safe no-op if already assigned)
    }
  } catch (err) {
    console.error("⚠️  Startup migration error:", err.message);
  }
})();

module.exports = app;
