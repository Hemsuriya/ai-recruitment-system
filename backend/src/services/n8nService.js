const axios = require("axios");

const BASE = process.env.N8N_BASE_URL;

const axiosClient = axios.create({
  baseURL: BASE,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAssessmentQuestions = async (candidateId) => {
  try {
    const endpoint = process.env.N8N_GET_QUESTIONS_WEBHOOK;
    console.log("Calling n8n endpoint:", `${BASE}${endpoint}`);

    const response = await axiosClient.post(endpoint, {
      screeningId: candidateId,
      verificationStatus: true,
    });

    return response.data;
  } catch (error) {
    console.error("N8N GET QUESTIONS ERROR:", error.response?.data || error.message);
    throw new Error("Failed to fetch assessment questions from n8n");
  }
};

const updateAssessmentStatus = async (candidateId, status) => {
  try {
    const endpoint = process.env.N8N_UPDATE_STATUS_WEBHOOK;

    const response = await axiosClient.post(endpoint, {
      screeningId: candidateId,
      status,
    });

    return response.data;
  } catch (error) {
    console.error("N8N UPDATE STATUS ERROR:", error.response?.data || error.message);
    throw new Error("Failed to update assessment status via n8n");
  }
};

const submitAssessmentResults = async (payload) => {
  try {
    const endpoint = process.env.N8N_SUBMIT_RESULTS_WEBHOOK;

    const response = await axiosClient.post(endpoint, payload);

    return response.data;
  } catch (error) {
    console.error("N8N SUBMIT RESULTS ERROR:", error.response?.data || error.message);
    throw new Error("Failed to submit assessment results to n8n");
  }
};

const triggerVideoInterviewWorkflow = async ({
  jobPositionId,
  appBaseUrl,
  minMcqScore,
}) => {
  try {
    const endpoint =
      process.env.N8N_VIDEO_INTERVIEW_WEBHOOK ||
      "/webhook/generate-video-interview-from-mcq";

    const response = await axiosClient.post(endpoint, {
      jobPositionId,
      appBaseUrl:
        appBaseUrl || process.env.FRONTEND_BASE_URL || "http://localhost:5173",
      minMcqScore: Number(minMcqScore || process.env.VIDEO_INVITE_MIN_SCORE || 80),
    });

    return response.data;
  } catch (error) {
    console.error(
      "N8N VIDEO INTERVIEW TRIGGER ERROR:",
      error.response?.data || error.message
    );
    throw new Error("Failed to trigger video interview workflow");
  }
};

const fetchOrCreateJobTemplate = async ({
  jobId,
  jobDescription,
  regenerate = false,
}) => {
  try {
    const endpoint = process.env.N8N_JOB_TEMPLATE_WEBHOOK;

    console.log("Calling n8n job template endpoint:", `${BASE}${endpoint}`);

    const response = await axiosClient.post(endpoint, {
      action: "create",
      job_id: jobId,
      job_description: jobDescription,
      regenerate,
    });

    return response.data;
  } catch (error) {
    console.error(
      "N8N JOB TEMPLATE ERROR:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch or create job template from n8n");
  }
};

module.exports = {
  getAssessmentQuestions,
  updateAssessmentStatus,
  submitAssessmentResults,
  triggerVideoInterviewWorkflow,
  fetchOrCreateJobTemplate,
};
