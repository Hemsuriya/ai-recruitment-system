const axios = require("axios");

const BASE = process.env.N8N_BASE_URL;

// ─── Validate required env variables ─────────────────────────
const requiredEnv = [
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

// ─── Axios client with global config ─────────────────────────
const axiosClient = axios.create({
  baseURL: BASE,
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json"
  }
});

// ─── GET assessment questions ─────────────────────────────────
const getAssessmentQuestions = async (candidateId) => {
  try {
    const endpoint = process.env.N8N_GET_QUESTIONS_WEBHOOK;

    console.log("Calling n8n endpoint:", `${BASE}${endpoint}`);

    const response = await axiosClient.post(endpoint, {
      screeningId: candidateId,
      verificationStatus: true
    });

    return response.data;

  } catch (error) {

    console.error(
      "❌ N8N GET QUESTIONS ERROR:",
      error.response?.data || error.message
    );

    throw new Error("Failed to fetch assessment questions from n8n");
  }
};

// ─── UPDATE assessment status ─────────────────────────────────
const updateAssessmentStatus = async (candidateId, status) => {
  try {

    const endpoint = process.env.N8N_UPDATE_STATUS_WEBHOOK;

    const response = await axiosClient.post(endpoint, {
      screeningId: candidateId,
      status
    });

    return response.data;

  } catch (error) {

    console.error(
      "❌ N8N UPDATE STATUS ERROR:",
      error.response?.data || error.message
    );

    throw new Error("Failed to update assessment status via n8n");
  }
};

// ─── SUBMIT assessment results ────────────────────────────────
const submitAssessmentResults = async (payload) => {
  try {

    const endpoint = process.env.N8N_SUBMIT_RESULTS_WEBHOOK;

    const response = await axiosClient.post(endpoint, payload);

    return response.data;

  } catch (error) {

    console.error(
      "❌ N8N SUBMIT RESULTS ERROR:",
      error.response?.data || error.message
    );

    throw new Error("Failed to submit assessment results to n8n");
  }
};

// ─── Export functions ─────────────────────────────────────────
module.exports = {
  getAssessmentQuestions,
  updateAssessmentStatus,
  submitAssessmentResults
};