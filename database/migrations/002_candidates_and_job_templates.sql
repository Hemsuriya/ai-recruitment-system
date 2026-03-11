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
