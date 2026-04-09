-- ============================================================
-- Migration 001: Shared Functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;
-- ============================================================
-- Migration 002: Candidates & Job Requirements (MCQ Flow)
-- ============================================================

CREATE TABLE public.candidates_v2 (
    screening_id        character varying(50)  NOT NULL,
    name                character varying(100) NOT NULL,
    email               character varying(100) NOT NULL,
    phone               character varying(20),
    location            character varying(100),
    current_company     character varying(100),
    job_title           character varying(100),
    match_score         integer,
    required_skills     text,
    experience_level    character varying(50),
    salary_expectation  character varying(50),
    template_key        character varying(100),
    created_at          timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at          timestamp without time zone,
    status              character varying(20)  DEFAULT 'pending',
    identity_verified   boolean DEFAULT false,
    verification_required boolean DEFAULT true,
    verification_attempts integer DEFAULT 0,
    last_verification_attempt timestamp without time zone,
    survey_validation_status  character varying(20) DEFAULT 'pending',
    survey_completed_at       timestamp without time zone,
    technical_assessment_unlocked boolean DEFAULT false,
    resume_drive_id     character varying(255),
    resume_file_name    character varying(255),
    resume_drive_url    text,
    resume_text         text,
    CONSTRAINT candidates_v2_pkey PRIMARY KEY (screening_id),
    CONSTRAINT check_survey_validation_status CHECK (
        survey_validation_status IN ('pending', 'passed', 'failed')
    )
);

COMMENT ON TABLE public.candidates_v2 IS 'Candidate information with identity verification support';
COMMENT ON COLUMN public.candidates_v2.survey_validation_status IS 'Status of preference screening: pending, passed, failed';
COMMENT ON COLUMN public.candidates_v2.technical_assessment_unlocked IS 'TRUE if candidate passed preference screening and can access technical questions';

CREATE INDEX idx_candidates_v2_email           ON public.candidates_v2 USING btree (email);
CREATE INDEX idx_candidates_v2_status          ON public.candidates_v2 USING btree (status);
CREATE INDEX idx_candidates_v2_survey_status   ON public.candidates_v2 USING btree (survey_validation_status);
CREATE INDEX idx_candidates_v2_verification    ON public.candidates_v2 USING btree (identity_verified);


-- ── Job Requirements (per-candidate config) ──────────────────
CREATE TABLE public.job_requirements_v2 (
    id              serial PRIMARY KEY,
    screening_id    character varying(50),
    job_title       character varying(100),
    required_skills text,
    experience_level character varying(50),
    salary_budget   character varying(50),
    question_count  integer DEFAULT 20,
    time_limit      character varying(20) DEFAULT '30 minutes',
    difficulty      character varying(20) DEFAULT 'intermediate',
    focus_areas     jsonb,
    optional_skills text,
    CONSTRAINT job_requirements_v2_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);


-- ── Job Templates ─────────────────────────────────────────────
CREATE TABLE public.job_templates (
    id                          serial PRIMARY KEY,
    template_name               character varying(100) NOT NULL,
    category                    character varying(50)  DEFAULT 'General',
    description                 text,
    form_data                   jsonb NOT NULL DEFAULT '{}',
    usage_count                 integer DEFAULT 0,
    created_by                  character varying(100) DEFAULT 'HR Team',
    is_active                   boolean DEFAULT true,
    created_at                  timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at                  timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  public.job_templates IS 'Pre-configured job posting templates for HR team';
COMMENT ON COLUMN public.job_templates.form_data IS 'Complete form data including job details and survey questions in JSON format';
COMMENT ON COLUMN public.job_templates.usage_count IS 'Number of times this template has been used';

CREATE INDEX idx_job_templates_active   ON public.job_templates USING btree (is_active);
CREATE INDEX idx_job_templates_category ON public.job_templates USING btree (category);
CREATE INDEX idx_job_templates_created  ON public.job_templates USING btree (created_at DESC);

CREATE TRIGGER update_job_templates_updated_at
    BEFORE UPDATE ON public.job_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- ============================================================
-- Migration 003: Survey Questions, Responses & Validation
-- ============================================================

CREATE TABLE public.survey_questions (
    id              serial PRIMARY KEY,
    screening_id    character varying(50),
    question_id     integer,
    question_text   text NOT NULL,
    question_type   character varying(20),
    options         jsonb,
    expected_answer character varying(100),
    is_qualifying   boolean DEFAULT false,
    question_category character varying(20) DEFAULT 'informational',
    validation_type character varying(20),
    created_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_question_category CHECK (
        question_category IN ('qualifying', 'informational')
    ),
    CONSTRAINT check_validation_type CHECK (
        validation_type IN ('exact_match', 'none') OR validation_type IS NULL
    ),
    CONSTRAINT survey_questions_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON COLUMN public.survey_questions.expected_answer IS 'Expected answer for qualifying questions';
COMMENT ON COLUMN public.survey_questions.is_qualifying IS 'TRUE if this question requires validation to proceed to technical assessment';
COMMENT ON COLUMN public.survey_questions.question_category IS 'Category: qualifying or informational';

CREATE TABLE public.hr_pre_screening_questions (
    id              serial PRIMARY KEY,
    assessment_id   integer NOT NULL REFERENCES public.hr_assessments(id) ON DELETE CASCADE,
    question_text   text NOT NULL,
    answer_type     character varying(20) NOT NULL,
    options         jsonb,
    is_mandatory    boolean DEFAULT false,
    expected_answer text,
    sort_order      integer DEFAULT 0,
    created_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_hr_prescreen_answer_type CHECK (
        answer_type IN ('yes_no', 'mcq', 'text')
    )
);

CREATE INDEX idx_hr_prescreen_assessment_id ON public.hr_pre_screening_questions USING btree (assessment_id);
CREATE INDEX idx_hr_prescreen_sort_order ON public.hr_pre_screening_questions USING btree (assessment_id, sort_order);


CREATE TABLE public.survey_responses (
    id              serial PRIMARY KEY,
    screening_id    character varying(50),
    candidate_id    character varying(50),
    assessment_id   integer,
    jid             character varying(20),
    question_id     integer,
    response_text   text,
    matched_expected boolean,
    created_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT survey_responses_assessment_id_fkey
        FOREIGN KEY (assessment_id) REFERENCES public.hr_assessments(id),
    CONSTRAINT survey_responses_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);


CREATE TABLE public.survey_validation_results (
    id                          serial PRIMARY KEY,
    screening_id                character varying(50) NOT NULL,
    validation_status           character varying(20) NOT NULL,
    qualifying_questions_count  integer DEFAULT 0,
    correct_answers_count       integer DEFAULT 0,
    failed_questions            jsonb,
    all_survey_responses        jsonb,
    validation_details          jsonb,
    validated_at                timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_validation_status CHECK (
        validation_status IN ('passed', 'failed', 'pending')
    ),
    CONSTRAINT survey_validation_results_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON TABLE  public.survey_validation_results IS 'Results of preference/survey question validation before technical assessment';
COMMENT ON COLUMN public.survey_validation_results.failed_questions IS 'Array of failed question details with expected vs actual answers';
COMMENT ON COLUMN public.survey_validation_results.validation_details IS 'Detailed validation metadata and scoring breakdown';

CREATE INDEX idx_survey_validation_screening  ON public.survey_validation_results USING btree (screening_id);
CREATE INDEX idx_survey_validation_status     ON public.survey_validation_results USING btree (validation_status);
CREATE INDEX idx_survey_validation_timestamp  ON public.survey_validation_results USING btree (validated_at);


-- ── Convenience view ──────────────────────────────────────────
CREATE VIEW public.survey_validation_summary AS
SELECT
    c.screening_id,
    c.name,
    c.email,
    c.survey_validation_status,
    c.survey_completed_at,
    c.technical_assessment_unlocked,
    svr.validation_status   AS detailed_validation_status,
    svr.qualifying_questions_count,
    svr.correct_answers_count,
    svr.failed_questions,
    svr.validated_at,
    CASE
        WHEN svr.qualifying_questions_count > 0
        THEN ROUND((svr.correct_answers_count::numeric / svr.qualifying_questions_count::numeric) * 100, 2)
        ELSE 0
    END AS validation_percentage
FROM public.candidates_v2 c
LEFT JOIN public.survey_validation_results svr ON c.screening_id = svr.screening_id;

COMMENT ON VIEW public.survey_validation_summary IS 'Combined view of candidate survey validation status and results';
-- ============================================================
-- Migration 004: MCQ Assessment Questions & Results
-- ============================================================

CREATE TABLE public.assessment_questions_v2 (
    id              serial PRIMARY KEY,
    screening_id    character varying(50),
    question_id     integer,
    question_text   text NOT NULL,
    options         jsonb NOT NULL,
    correct_answer  character varying(1) NOT NULL,
    category        character varying(50),
    difficulty      character varying(20),
    explanation     text,
    time_limit      integer DEFAULT 90,
    CONSTRAINT assessment_questions_v2_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);


CREATE TABLE public.assessment_results_v2 (
    screening_id                        character varying(50) NOT NULL,
    answers                             jsonb NOT NULL,
    total_questions                     integer,
    correct_answers                     integer,
    score_percentage                    integer,
    time_spent                          integer,
    started_at                          timestamp without time zone,
    completed_at                        timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    violations                          jsonb,
    is_passed                           boolean,
    grade                               character varying(2),
    aadhaar_verified                    boolean DEFAULT false,
    verification_attempts               integer DEFAULT 0,
    verification_data                   jsonb,
    survey_responses_count              integer DEFAULT 0,
    survey_validation_status            character varying(20) DEFAULT 'pending',
    survey_completed_at                 timestamp without time zone,
    technical_assessment_unlocked       boolean DEFAULT false,
    qualifying_survey_questions_count   integer DEFAULT 0,
    informational_survey_questions_count integer DEFAULT 0,
    two_stage_process_completed         boolean DEFAULT false,
    CONSTRAINT assessment_results_v2_pkey PRIMARY KEY (screening_id),
    CONSTRAINT check_survey_validation_status_results CHECK (
        survey_validation_status IN ('pending', 'passed', 'failed')
    ),
    CONSTRAINT assessment_results_v2_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON COLUMN public.assessment_results_v2.survey_responses_count IS 'Total number of survey questions answered';
-- ============================================================
-- Migration 005: Identity Verification & Audit
-- ============================================================

CREATE TABLE public.aadhaar_verification (
    screening_id            character varying(50)  NOT NULL,
    masked_aadhaar          character varying(20)  NOT NULL,
    verification_status     character varying(20)  NOT NULL,
    attempts_made           integer DEFAULT 0,
    verified_at             timestamp without time zone,
    name_match_score        numeric(3,2),
    extracted_name          character varying(100),
    verification_data       jsonb,
    verification_method     character varying(50) DEFAULT 'ocr_tesseract',
    image_quality_score     integer,
    ocr_confidence          integer,
    security_flags          jsonb,
    ip_address              inet,
    user_agent              text,
    created_at              timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT aadhaar_verification_pkey PRIMARY KEY (screening_id),
    CONSTRAINT check_attempts_range CHECK (attempts_made >= 0 AND attempts_made <= 10),
    CONSTRAINT check_name_match_score CHECK (name_match_score >= 0.0 AND name_match_score <= 1.0),
    CONSTRAINT check_verification_status CHECK (
        verification_status IN ('pending', 'verified', 'failed', 'locked')
    ),
    CONSTRAINT aadhaar_verification_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON TABLE  public.aadhaar_verification IS 'Aadhaar card verification data and audit trail';
COMMENT ON COLUMN public.aadhaar_verification.masked_aadhaar IS 'Last 4 digits of Aadhaar number (XXXX-XXXX-1234)';
COMMENT ON COLUMN public.aadhaar_verification.name_match_score IS 'Similarity score between extracted name and candidate name (0.0 to 1.0)';

CREATE INDEX idx_aadhaar_verification_status  ON public.aadhaar_verification USING btree (verification_status);
CREATE INDEX idx_aadhaar_verification_created ON public.aadhaar_verification USING btree (created_at);


-- ── Verification Audit Log ────────────────────────────────────
CREATE TABLE public.verification_audit_log (
    id              serial PRIMARY KEY,
    screening_id    character varying(50) NOT NULL,
    action_type     character varying(50) NOT NULL,
    action_details  jsonb,
    timestamp       timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address      inet,
    user_agent      text,
    result          character varying(20),
    CONSTRAINT verification_audit_log_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON TABLE public.verification_audit_log IS 'Complete audit log for all verification activities';

CREATE INDEX idx_verification_audit_action    ON public.verification_audit_log USING btree (action_type);
CREATE INDEX idx_verification_audit_timestamp ON public.verification_audit_log USING btree (timestamp);
-- ============================================================
-- Migration 006: Video Interview (Round 2)
-- ============================================================

CREATE TABLE public.video_interview_candidates (
    id                  serial PRIMARY KEY,
    video_assessment_id character varying(255) NOT NULL UNIQUE,
    name                character varying(255) NOT NULL,
    email               character varying(255) NOT NULL,
    phone               character varying(50),
    location            character varying(255),
    current_company     character varying(255),
    job_title           character varying(255),
    match_score         integer,
    candidate_skills    jsonb,
    required_skills     text,
    experience_level    character varying(100),
    salary_expectation  character varying(100),
    expires_at          timestamp without time zone,
    status              character varying(50)  DEFAULT 'invited',
    interview_started   boolean DEFAULT false,
    interview_completed boolean DEFAULT false,
    videos_uploaded     boolean DEFAULT false,
    proctoring_flags    integer DEFAULT 0,
    created_at          timestamp without time zone DEFAULT now(),
    updated_at          timestamp without time zone DEFAULT now()
);

CREATE INDEX idx_video_assessment_id ON public.video_interview_candidates USING btree (video_assessment_id);
CREATE INDEX idx_video_email         ON public.video_interview_candidates USING btree (email);
CREATE INDEX idx_video_status        ON public.video_interview_candidates USING btree (status);

CREATE TRIGGER update_video_candidates_updated_at
    BEFORE UPDATE ON public.video_interview_candidates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── Video Job Requirements ────────────────────────────────────
CREATE TABLE public.video_job_requirements (
    id                  serial PRIMARY KEY,
    video_assessment_id character varying(255),
    job_title           character varying(255),
    required_skills     text,
    optional_skills     text,
    experience_level    character varying(100),
    salary_budget       character varying(100),
    question_count      integer,
    total_duration      integer,
    time_per_question   integer,
    difficulty          character varying(50),
    focus_areas         jsonb,
    interview_format    character varying(100),
    recording_enabled   boolean DEFAULT true,
    proctoring_enabled  boolean DEFAULT true,
    created_at          timestamp without time zone DEFAULT now(),
    CONSTRAINT video_job_requirements_video_assessment_id_fkey
        FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id)
);


-- ── Video Interview Questions ─────────────────────────────────
CREATE TABLE public.video_interview_questions (
    id                      serial PRIMARY KEY,
    video_assessment_id     character varying(255),
    question_id             integer,
    question_text           text NOT NULL,
    question_type           character varying(50)  DEFAULT 'video',
    category                character varying(100),
    difficulty              character varying(50),
    time_limit              integer,
    expected_response_type  character varying(50)  DEFAULT 'video',
    evaluation_criteria     jsonb,
    key_points              jsonb,
    created_at              timestamp without time zone DEFAULT now(),
    CONSTRAINT video_interview_questions_video_assessment_id_fkey
        FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id)
);


-- ── Video Interview Responses ─────────────────────────────────
CREATE TABLE public.video_interview_responses (
    id                      serial PRIMARY KEY,
    video_assessment_id     character varying(255),
    candidate_name          character varying(255),
    candidate_email         character varying(255),
    video_url               text,
    video_drive_id          character varying(255),
    video_duration          integer,
    full_transcript         jsonb,
    security_report         jsonb,
    uploaded_at             timestamp without time zone DEFAULT now(),
    interview_completed_at  timestamp without time zone DEFAULT now(),
    CONSTRAINT video_interview_responses_video_assessment_id_fkey
        FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id)
);

CREATE INDEX idx_video_response_assessment_id ON public.video_interview_responses USING btree (video_assessment_id);


-- ── Video Analysis Results (MediaPipe) ───────────────────────
CREATE TABLE public.video_analysis_results (
    id                      serial PRIMARY KEY,
    video_assessment_id     character varying(255) NOT NULL UNIQUE,
    candidate_name          character varying(255),
    candidate_email         character varying(255),
    video_drive_id          character varying(255),
    video_url               text,
    analysis_status         character varying(50)  DEFAULT 'pending',
    analysis_started_at     timestamp without time zone,
    analysis_completed_at   timestamp without time zone,
    emotion_analysis        jsonb,
    attention_metrics       jsonb,
    face_detection          jsonb,
    violations_summary      jsonb,
    full_report             jsonb,
    processing_time_seconds integer,
    frames_processed        integer,
    video_duration_seconds  integer,
    error_message           text,
    retry_count             integer DEFAULT 0,
    created_at              timestamp without time zone DEFAULT now(),
    updated_at              timestamp without time zone DEFAULT now(),
    CONSTRAINT fk_video_assessment_analysis
        FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE
);

COMMENT ON TABLE public.video_analysis_results IS 'Stores Python-based video analysis results using MediaPipe';

CREATE INDEX idx_video_analysis_assessment_id ON public.video_analysis_results USING btree (video_assessment_id);
CREATE INDEX idx_video_analysis_status        ON public.video_analysis_results USING btree (analysis_status);
CREATE INDEX idx_video_analysis_created_at    ON public.video_analysis_results USING btree (created_at);

CREATE TRIGGER update_video_analysis_updated_at
    BEFORE UPDATE ON public.video_analysis_results
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ── Video Interview Evaluations ───────────────────────────────
CREATE TABLE public.video_interview_evaluations (
    id                          serial PRIMARY KEY,
    video_assessment_id         character varying(255) NOT NULL UNIQUE,
    interview_score             integer,
    security_score              integer,
    final_score                 integer,
    question_scores             jsonb,
    security_violations_count   integer DEFAULT 0,
    security_severity           character varying(20),
    security_details            jsonb,
    strengths                   text[],
    weaknesses                  text[],
    overall_feedback            text,
    recommendation              character varying(20),
    evaluated_by                character varying(50)  DEFAULT 'AI',
    evaluated_at                timestamp without time zone DEFAULT now(),
    final_decision              character varying(20),
    decision_by                 character varying(100),
    decision_at                 timestamp without time zone,
    decision_comment            text,
    CONSTRAINT video_interview_evaluations_interview_score_check CHECK (interview_score >= 0 AND interview_score <= 100),
    CONSTRAINT video_interview_evaluations_security_score_check  CHECK (security_score  >= 0 AND security_score  <= 100),
    CONSTRAINT video_interview_evaluations_final_score_check     CHECK (final_score     >= 0 AND final_score     <= 100),
    CONSTRAINT video_interview_evaluations_recommendation_check  CHECK (recommendation IN ('hire', 'maybe', 'reject')),
    CONSTRAINT video_interview_evaluations_security_severity_check CHECK (security_severity IN ('low', 'medium', 'high')),
    CONSTRAINT fk_video_assessment_evaluation
        FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE
);

CREATE INDEX idx_evaluation_assessment ON public.video_interview_evaluations USING btree (video_assessment_id);
CREATE INDEX idx_recommendation        ON public.video_interview_evaluations USING btree (recommendation);
CREATE INDEX idx_evaluated_at          ON public.video_interview_evaluations USING btree (evaluated_at);
