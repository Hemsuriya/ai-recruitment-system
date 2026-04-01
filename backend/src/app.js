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
const assessmentConfigRoutes = require("./routes/assessmentConfigRoutes");
const authRoutes = require("./routes/authRoutes");
const emailRoutes = require("./routes/emailRoutes");

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
  max: 100,
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

// ─── HR Portal routes ─────────────────────────────────────────
app.use("/api/job-templates", jobTemplateRoutes);
app.use("/api/job-postings", jobPostingRoutes);
app.use("/api/hr/candidates", hrCandidateRoutes);
app.use("/api/hr/assessments", assessmentConfigRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);

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

module.exports = app;