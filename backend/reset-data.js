/**
 * reset-data.js
 * Clears all candidate / assessment / template / job-posting data.
 * KEEPS: departments, hr_members, users (auth)
 *
 * Run once from the backend folder:
 *   node reset-data.js
 */

require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "ai_candidate_screening",
});

// Order matters — child tables before parent tables to avoid FK violations
const TABLES_TO_CLEAR = [
  "survey_validation_results",
  "survey_responses",
  "survey_questions",
  "assessment_results_v2",
  "assessment_questions_v2",
  "job_requirements_v2",
  "hr_assessment_questions",
  "hr_assessments",
  "video_interview_evaluations",
  "video_interview_candidates",
  "candidates_v2",
  "job_postings",
  "job_templates",
];

const TABLES_KEPT = ["departments", "hr_members", "users"];

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const table of TABLES_TO_CLEAR) {
      try {
        await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
        console.log(`  ✅ Cleared ${table}`);
      } catch (err) {
        // Table might not exist — skip gracefully
        if (err.code === "42P01") {
          console.log(`  ⚠️  Skipped ${table} (table does not exist)`);
        } else {
          throw err;
        }
      }
    }

    await client.query("COMMIT");

    console.log("\n✅ Reset complete.");
    console.log(`   Preserved: ${TABLES_KEPT.join(", ")}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Reset failed, rolled back:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
