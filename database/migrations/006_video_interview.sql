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
