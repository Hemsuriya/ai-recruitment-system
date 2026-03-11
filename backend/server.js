require("dotenv").config();

const app = require("./src/app");

const requiredEnv = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "N8N_BASE_URL",
  "N8N_GET_QUESTIONS_WEBHOOK",
  "N8N_UPDATE_STATUS_WEBHOOK",
  "N8N_SUBMIT_RESULTS_WEBHOOK"
];

requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    console.error(`❌ Missing environment variable: ${env}`);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AI Candidate Screening API running on port ${PORT}`);
});