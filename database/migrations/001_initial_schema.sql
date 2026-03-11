-- =============================================================================
-- AI Candidate Screening — Initial Schema
-- Migration: 001_initial_schema.sql
-- Database:  ai_candidate_screening (single DB for all services)
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SCREENING PIPELINE TABLES
-- Core tables for the candidate screening flow
-- =============================================================================

-- Candidates (MCQ / survey pipeline)
CREATE TABLE IF NOT EXISTS public.candidates_v2 (
    screening_id            VARCHAR(50) PRIMARY KEY,
    name                    VARCHAR(100) NOT NULL,
    email                   VARCHAR(100) NOT NULL,
    phone                   VARCHAR(20),
    location                VARCHAR(100),
    current_company         VARCHAR(100),
    job_title               VARCHAR(100),
    match_score             INTEGER,
    required_skills         TEXT,
    experience_level        VARCHAR(50),
    salary_expectation      VARCHAR(50),
    template_key            VARCHAR(100),                         -- links to job_templates
    status                  VARCHAR(20) DEFAULT 'pending',
    identity_verified       BOOLEAN DEFAULT false,
    verification_required   BOOLEAN DEFAULT true,
    verification_attempts   INTEGER DEFAULT 0,
    last_verification_attempt TIMESTAMP,
    survey_validation_status VARCHAR(20) DEFAULT 'pending',
    survey_completed_at     TIMESTAMP,
    technical_assessment_unlocked BOOLEAN DEFAULT false,
    resume_drive_id         VARCHAR(255),
    resume_file_name        VARCHAR(255),
    resume_drive_url        TEXT,
    resume_text             TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at              TIMESTAMP,
    CONSTRAINT check_survey_validation_status
        CHECK (survey_validation_status IN ('pending','passed','failed'))
);

-- Job templates (HR creates these to define assessments)
CREATE TABLE IF NOT EXISTS public.job_templates (
    id                          SERIAL PRIMARY KEY,
    template_key                VARCHAR(100) UNIQUE NOT NULL,
    job_title                   VARCHAR(100) NOT NULL,
    job_description             TEXT,
    required_skills             TEXT,
    number_of_candidates        VARCHAR(20),
    survey_question_1           TEXT,
    survey_q1_expected_answer   TEXT,
    -- Extended fields (from overalldbbackup)
    template_name               VARCHAR(100),
    category                    VARCHAR(50) DEFAULT 'General',
    description                 TEXT,
    form_data                   JSONB,
    usage_count                 INTEGER DEFAULT 0,
    created_by                  VARCHAR(100) DEFAULT 'HR Team',
    is_active                   BOOLEAN DEFAULT true,
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job requirements per candidate (MCQ pipeline)
CREATE TABLE IF NOT EXISTS public.job_requirements_v2 (
    id                  SERIAL PRIMARY KEY,
    screening_id        VARCHAR(50) REFERENCES public.candidates_v2(screening_id),
    job_title           VARCHAR(100),
    required_skills     TEXT,
    optional_skills     TEXT,
    experience_level    VARCHAR(50),
    salary_budget       VARCHAR(50),
    question_count      INTEGER DEFAULT 20,
    time_limit          VARCHAR(20) DEFAULT '30 minutes',
    difficulty          VARCHAR(20) DEFAULT 'intermediate',
    focus_areas         JSONB
);

-- Survey questions (per screening or global)
CREATE TABLE IF NOT EXISTS public.survey_questions (
    id                  SERIAL PRIMARY KEY,
    screening_id        VARCHAR(50) REFERENCES public.candidates_v2(screening_id),
    question_id         INTEGER,
    question_text       TEXT NOT NULL,
    question_type       VARCHAR(20),
    options             JSONB,
    expected_answer     VARCHAR(100),
    is_qualifying       BOOLEAN DEFAULT false,
    question_category   VARCHAR(20) DEFAULT 'informational',
    validation_type     VARCHAR(20),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_question_category
        CHECK (question_category IN ('qualifying','informational')),
    CONSTRAINT check_validation_type
        CHECK (validation_type IN ('exact_match','none') OR validation_type IS NULL)
);

-- Survey responses
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id              SERIAL PRIMARY KEY,
    screening_id    VARCHAR(50) REFERENCES public.candidates_v2(screening_id),
    question_id     INTEGER,
    response_text   TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Survey validation results
CREATE TABLE IF NOT EXISTS public.survey_validation_results (
    id                          SERIAL PRIMARY KEY,
    screening_id                VARCHAR(50) NOT NULL REFERENCES public.candidates_v2(screening_id),
    validation_status           VARCHAR(20) NOT NULL,
    qualifying_questions_count  INTEGER DEFAULT 0,
    correct_answers_count       INTEGER DEFAULT 0,
    failed_questions            JSONB,
    all_survey_responses        JSONB,
    validation_details          JSONB,
    validated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_validation_status
        CHECK (validation_status IN ('passed','failed','pending'))
);

-- MCQ assessment questions (generated per candidate)
CREATE TABLE IF NOT EXISTS public.assessment_questions_v2 (
    id              SERIAL PRIMARY KEY,
    screening_id    VARCHAR(50) REFERENCES public.candidates_v2(screening_id),
    question_id     INTEGER,
    question_text   TEXT NOT NULL,
    options         JSONB NOT NULL,
    correct_answer  VARCHAR(1) NOT NULL,
    category        VARCHAR(50),
    difficulty      VARCHAR(20),
    explanation     TEXT,
    time_limit      INTEGER DEFAULT 90
);

-- MCQ assessment results
CREATE TABLE IF NOT EXISTS public.assessment_results_v2 (
    screening_id                        VARCHAR(50) PRIMARY KEY REFERENCES public.candidates_v2(screening_id),
    answers                             JSONB NOT NULL,
    total_questions                     INTEGER,
    correct_answers                     INTEGER,
    score_percentage                    INTEGER,
    time_spent                          INTEGER,
    violations                          JSONB,
    is_passed                           BOOLEAN,
    grade                               VARCHAR(2),
    aadhaar_verified                    BOOLEAN DEFAULT false,
    verification_attempts               INTEGER DEFAULT 0,
    verification_data                   JSONB,
    survey_responses_count              INTEGER DEFAULT 0,
    survey_validation_status            VARCHAR(20) DEFAULT 'pending',
    survey_completed_at                 TIMESTAMP,
    technical_assessment_unlocked       BOOLEAN DEFAULT false,
    qualifying_survey_questions_count   INTEGER DEFAULT 0,
    informational_survey_questions_count INTEGER DEFAULT 0,
    two_stage_process_completed         BOOLEAN DEFAULT false,
    started_at                          TIMESTAMP,
    completed_at                        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_survey_validation_status_results
        CHECK (survey_validation_status IN ('pending','passed','failed'))
);

-- =============================================================================
-- IDENTITY VERIFICATION TABLES
-- =============================================================================

-- Aadhaar / ID verification records
CREATE TABLE IF NOT EXISTS public.aadhaar_verification (
    screening_id            VARCHAR(50) NOT NULL REFERENCES public.candidates_v2(screening_id),
    masked_aadhaar          VARCHAR(20) NOT NULL,
    verification_status     VARCHAR(20) NOT NULL,
    attempts_made           INTEGER DEFAULT 0,
    verified_at             TIMESTAMP,
    name_match_score        NUMERIC(3,2),
    extracted_name          VARCHAR(100),
    verification_data       JSONB,
    verification_method     VARCHAR(50) DEFAULT 'ocr_tesseract',
    image_quality_score     INTEGER,
    ocr_confidence          INTEGER,
    security_flags          JSONB,
    ip_address              INET,
    user_agent              TEXT,
    created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_attempts_range
        CHECK (attempts_made >= 0 AND attempts_made <= 10),
    CONSTRAINT check_name_match_score
        CHECK (name_match_score >= 0.0 AND name_match_score <= 1.0),
    CONSTRAINT check_verification_status
        CHECK (verification_status IN ('pending','verified','failed','locked'))
);

-- Audit log for all verification actions
CREATE TABLE IF NOT EXISTS public.verification_audit_log (
    id              SERIAL PRIMARY KEY,
    screening_id    VARCHAR(50) NOT NULL REFERENCES public.candidates_v2(screening_id),
    action_type     VARCHAR(50) NOT NULL,
    action_details  JSONB,
    timestamp       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address      INET,
    user_agent      TEXT,
    result          VARCHAR(20)
);

-- =============================================================================
-- VIDEO INTERVIEW TABLES
-- =============================================================================

-- Video interview candidates (separate from MCQ pipeline)
CREATE TABLE IF NOT EXISTS public.video_interview_candidates (
    id                      SERIAL PRIMARY KEY,
    video_assessment_id     VARCHAR(255) NOT NULL UNIQUE,
    name                    VARCHAR(255) NOT NULL,
    email                   VARCHAR(255) NOT NULL,
    phone                   VARCHAR(50),
    location                VARCHAR(255),
    current_company         VARCHAR(255),
    job_title               VARCHAR(255),
    match_score             INTEGER,
    candidate_skills        JSONB,
    required_skills         TEXT,
    experience_level        VARCHAR(100),
    salary_expectation      VARCHAR(100),
    status                  VARCHAR(50) DEFAULT 'invited',
    interview_started       BOOLEAN DEFAULT false,
    interview_completed     BOOLEAN DEFAULT false,
    videos_uploaded         BOOLEAN DEFAULT false,
    proctoring_flags        INTEGER DEFAULT 0,
    expires_at              TIMESTAMP,
    created_at              TIMESTAMP DEFAULT now(),
    updated_at              TIMESTAMP DEFAULT now()
);

-- Video interview questions (generated per candidate)
CREATE TABLE IF NOT EXISTS public.video_interview_questions (
    id                      SERIAL PRIMARY KEY,
    video_assessment_id     VARCHAR(255) REFERENCES public.video_interview_candidates(video_assessment_id),
    question_id             INTEGER,
    question_text           TEXT NOT NULL,
    question_type           VARCHAR(50) DEFAULT 'video',
    category                VARCHAR(100),
    difficulty              VARCHAR(50),
    time_limit              INTEGER,
    expected_response_type  VARCHAR(50) DEFAULT 'video',
    evaluation_criteria     JSONB,
    key_points              JSONB,
    created_at              TIMESTAMP DEFAULT now()
);

-- Video interview responses (uploaded videos + transcripts)
CREATE TABLE IF NOT EXISTS public.video_interview_responses (
    id                          SERIAL PRIMARY KEY,
    video_assessment_id         VARCHAR(255) REFERENCES public.video_interview_candidates(video_assessment_id),
    candidate_name              VARCHAR(255),
    candidate_email             VARCHAR(255),
    video_url                   TEXT,
    video_drive_id              VARCHAR(255),
    video_duration              INTEGER,
    full_transcript             JSONB,
    security_report             JSONB,
    uploaded_at                 TIMESTAMP DEFAULT now(),
    interview_completed_at      TIMESTAMP DEFAULT now()
);

-- Video interview evaluations (AI + HR scores)
CREATE TABLE IF NOT EXISTS public.video_interview_evaluations (
    id                          SERIAL PRIMARY KEY,
    video_assessment_id         VARCHAR(255) NOT NULL REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE,
    interview_score             INTEGER CHECK (interview_score >= 0 AND interview_score <= 100),
    security_score              INTEGER CHECK (security_score >= 0 AND security_score <= 100),
    final_score                 INTEGER CHECK (final_score >= 0 AND final_score <= 100),
    question_scores             JSONB,
    security_violations_count   INTEGER DEFAULT 0,
    security_severity           VARCHAR(20) CHECK (security_severity IN ('low','medium','high')),
    security_details            JSONB,
    strengths                   TEXT[],
    weaknesses                  TEXT[],
    overall_feedback            TEXT,
    recommendation              VARCHAR(20) CHECK (recommendation IN ('hire','maybe','reject')),
    evaluated_by                VARCHAR(50) DEFAULT 'AI',
    evaluated_at                TIMESTAMP DEFAULT now(),
    final_decision              VARCHAR(20),
    decision_by                 VARCHAR(100),
    decision_at                 TIMESTAMP,
    decision_comment            TEXT
);

-- Video job requirements
CREATE TABLE IF NOT EXISTS public.video_job_requirements (
    id                  SERIAL PRIMARY KEY,
    video_assessment_id VARCHAR(255) REFERENCES public.video_interview_candidates(video_assessment_id),
    job_title           VARCHAR(255),
    required_skills     TEXT,
    optional_skills     TEXT,
    experience_level    VARCHAR(100),
    salary_budget       VARCHAR(100),
    question_count      INTEGER,
    total_duration      INTEGER,
    time_per_question   INTEGER,
    difficulty          VARCHAR(50),
    focus_areas         JSONB,
    interview_format    VARCHAR(100),
    recording_enabled   BOOLEAN DEFAULT true,
    proctoring_enabled  BOOLEAN DEFAULT true,
    created_at          TIMESTAMP DEFAULT now()
);

-- Video analysis results (MediaPipe proctoring output)
CREATE TABLE IF NOT EXISTS public.video_analysis_results (
    id                          SERIAL PRIMARY KEY,
    video_assessment_id         VARCHAR(255) NOT NULL REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE,
    candidate_name              VARCHAR(255),
    candidate_email             VARCHAR(255),
    video_drive_id              VARCHAR(255),
    video_url                   TEXT,
    analysis_status             VARCHAR(50) DEFAULT 'pending',
    analysis_started_at         TIMESTAMP,
    analysis_completed_at       TIMESTAMP,
    emotion_analysis            JSONB,
    attention_metrics           JSONB,
    face_detection              JSONB,
    violations_summary          JSONB,
    full_report                 JSONB,
    processing_time_seconds     INTEGER,
    frames_processed            INTEGER,
    video_duration_seconds      INTEGER,
    error_message               TEXT,
    retry_count                 INTEGER DEFAULT 0,
    created_at                  TIMESTAMP DEFAULT now(),
    updated_at                  TIMESTAMP DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- candidates_v2
CREATE INDEX IF NOT EXISTS idx_candidates_v2_email           ON public.candidates_v2 (email);
CREATE INDEX IF NOT EXISTS idx_candidates_v2_status          ON public.candidates_v2 (status);
CREATE INDEX IF NOT EXISTS idx_candidates_v2_survey_status   ON public.candidates_v2 (survey_validation_status);
CREATE INDEX IF NOT EXISTS idx_candidates_v2_verification    ON public.candidates_v2 (identity_verified);
CREATE INDEX IF NOT EXISTS idx_candidates_v2_template        ON public.candidates_v2 (template_key);

-- job_templates
CREATE INDEX IF NOT EXISTS idx_job_templates_active          ON public.job_templates (is_active);
CREATE INDEX IF NOT EXISTS idx_job_templates_category        ON public.job_templates (category);
CREATE INDEX IF NOT EXISTS idx_job_templates_created         ON public.job_templates (created_at DESC);

-- survey
CREATE INDEX IF NOT EXISTS idx_survey_validation_screening   ON public.survey_validation_results (screening_id);
CREATE INDEX IF NOT EXISTS idx_survey_validation_status      ON public.survey_validation_results (validation_status);
CREATE INDEX IF NOT EXISTS idx_survey_validation_timestamp   ON public.survey_validation_results (validated_at);

-- verification
CREATE INDEX IF NOT EXISTS idx_aadhaar_verification_status   ON public.aadhaar_verification (verification_status);
CREATE INDEX IF NOT EXISTS idx_aadhaar_verification_created  ON public.aadhaar_verification (created_at);
CREATE INDEX IF NOT EXISTS idx_verification_audit_action     ON public.verification_audit_log (action_type);
CREATE INDEX IF NOT EXISTS idx_verification_audit_timestamp  ON public.verification_audit_log (timestamp);

-- video interview
CREATE INDEX IF NOT EXISTS idx_video_assessment_id           ON public.video_interview_candidates (video_assessment_id);
CREATE INDEX IF NOT EXISTS idx_video_email                   ON public.video_interview_candidates (email);
CREATE INDEX IF NOT EXISTS idx_video_status                  ON public.video_interview_candidates (status);
CREATE INDEX IF NOT EXISTS idx_evaluation_assessment         ON public.video_interview_evaluations (video_assessment_id);
CREATE INDEX IF NOT EXISTS idx_evaluated_at                  ON public.video_interview_evaluations (evaluated_at);
CREATE INDEX IF NOT EXISTS idx_recommendation                ON public.video_interview_evaluations (recommendation);
CREATE INDEX IF NOT EXISTS idx_video_response_assessment_id  ON public.video_interview_responses (video_assessment_id);
CREATE INDEX IF NOT EXISTS idx_video_analysis_assessment_id  ON public.video_analysis_results (video_assessment_id);
CREATE INDEX IF NOT EXISTS idx_video_analysis_status         ON public.video_analysis_results (analysis_status);
CREATE INDEX IF NOT EXISTS idx_video_analysis_created_at     ON public.video_analysis_results (created_at);
