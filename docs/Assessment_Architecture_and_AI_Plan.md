Assessment Module Architecture and AI Integration Proposal

This document is intended for the development team. 
Because the database and API changes below are currently only on the local environment, this document serves to explain exactly what was changed, why it was changed, the gaps we are facing, and the proposed options for moving forward with n8n AI integrations. Please review this before we finalize an approach and push the code.

--------------------------------------------------------------------------------

SECTION 1: RECENT LOCAL CHANGES (THE FOUNDATION)

We needed a robust "Create Assessment" flow. Instead of sending raw form data straight to an AI Agent to generate the Job ID (JID) and Job Description (JD), we first built a deterministic database and API foundation to ensure no data is lost and configurations are strictly preserved.

Step-by-Step Changes Made:

1. New Database Table: hr_assessments
We created this table to serve as the master configuration for any assessment.
Columns added include:
- Role Title, Experience Level, Skills (stored as an array)
- Granular timers: mcq_time_limit, video_time_limit, coding_time_limit
- Toggle flags: include_coding, include_ai_interview, generate_ai_questions
- job_description (Currently set to save as NULL - this is reserved for the AI Agent)

2. New Database Table: hr_assessment_questions
We created this to persist the exact custom pre-screening questions the HR user selects or writes in the UI.

3. Database Trigger for JID Generation
We implemented a PostgreSQL trigger (generate_jid_trigger on the job_postings table).
Why? Relying on an AI to generate the JID is an anti-pattern. JIDs must be unique, sequential, and follow a strict format (e.g., JOB-2026-005). AI models can hallucinate or create duplicates. The database trigger guarantees flawless ID allocation.

4. New Backend Service & Routes
Added assessmentConfigService.js and the POST /api/hr/assessments API endpoint.
When the React UI submits the assessment form, the API:
- Creates a job template.
- Creates a job posting (triggering the database to assign the JID).
- Stores the hr_assessments record.
- Bulk-inserts the pre-screening questions.
- Returns the auto-generated JID back to the Frontend.

--------------------------------------------------------------------------------

SECTION 2: GAPS AND CHALLENGES

The core requirement is to automatically generate a Job Description (JD) using an AI Agent based on the entered Role Title and Skills.

The Challenge:
Currently, the job_description column in the database saves as blank (NULL). 
We paused the AI integration because wiring a new AI trigger directly into the existing, massive n8n workflow (aicandidatescreeningv1.2) is high-risk. 

The existing n8n workflow is a complex, 15 plus node pipeline designed for Resume Matching. It is triggered manually by an HR user filling out an n8n form. The new "Create Assessment" flow is triggered programmatically by our React UI. Attempting to force the React UI to trigger the existing n8n form workflow could break the resume matching pipeline for other developers who are relying on it.

--------------------------------------------------------------------------------

SECTION 3: PROPOSED N8N APPROACHES TO SOLVE THE AI JD GAP

To generate the JD, we must determine how the new React API flow communicates with n8n. Here are the three options being considered:

OPTION A: A Completely Separate Workflow
Create a brand new, 5-node n8n workflow used exclusively for JD generation.
Flow: React UI -> Backend API -> n8n Webhook -> AI Generates JD -> API updates JD.
Pros: Zero risk of breaking the existing resume matching workflow. Very easy to debug.
Cons: We now have two disjointed workflows. The JD lives isolated and does not automatically feed into the resume matching pipeline.

OPTION B: Modify the Existing Workflow
Wire the new React UI trigger directly into the existing aicandidatescreeningv1.2 workflow.
Flow: Add a new webhook trigger next to the existing n8n form trigger. Add a "Route Input" node. If triggered by React, generate the JD, then pass it into the existing Resume Search node.
Pros: Single source of truth. The AI-generated JD immediately kicks off the resume matching process.
Cons: High risk of breaking the existing workflow. Requires complex routing logic and could block the entire pipeline if the JD generation fails.

OPTION C: The Hybrid Approach (RECOMMENDED)
Create a small, isolated JD generation workflow that optionally chains into the existing workflow.
Flow:
1. React UI hits Backend.
2. Backend hits the new n8n JD generation webhook.
3. AI generates the JD.
4. The new workflow saves the JD to the database via API.
5. The Bridge: The new workflow uses an "Execute Workflow" node to securely trigger the existing aicandidatescreeningv1.2 workflow, passing the newly generated JD as a pristine variable.

Why Option C is Recommended for the Team:
- Developer Safety: The existing resume matching workflow remains completely untouched. No one's work gets blocked or broken.
- Database Integrity: If the AI has a bad generation day, the assessment and configuration still save perfectly to the database; only the JD remains blank.
- Complete Automation: It fulfills the assignment by decoupling JD generation from ID allocation, while still providing a seamless bridge to the existing resume matching pipeline when we are ready to turn it on.

Please review this document. Let us discuss and finalize the approach before these database changes and webhook triggers are pushed to the shared repository.
