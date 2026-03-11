# n8n Workflows

Import these JSON files into your n8n instance via **Settings → Import Workflow**.

| File | Description |
|---|---|
| `AICandidateScreening_V1_2.json` | Main candidate screening pipeline |
| `Evaluation_with_HIL_New.json` | Evaluation with Human-in-the-Loop review |
| `Video_Interview_Question_Generation_and_email.json` | Generates video interview questions and sends email |
| `Video_Upload_and_Mediapipe_analysis_v2.json` | Handles video upload and triggers MediaPipe analysis |
| `Curl_Automation.json` | Scheduled trigger to start Round 2 video interviews |

## Webhook Endpoints Used

| Webhook | Triggered by |
|---|---|
| `/webhook/get-assessment-questions` | Backend assessment route |
| `/webhook/update-assessment-status` | Backend assessment route |
| `/webhook/assessment-results` | Backend assessment route |
| `/webhook/start-round2-video-interview` | Curl Automation schedule |
