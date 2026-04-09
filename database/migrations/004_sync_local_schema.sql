-- Migration: Add missing tables from Docker ai_candidate_screening to local video_interview_v2
-- These tables were created by the new frontend but only exist in Docker

-- 1. Create generate_jid function (needed by job_postings trigger)
CREATE OR REPLACE FUNCTION public.generate_jid()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    next_num INTEGER;
    current_year TEXT;
BEGIN
    current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(jid, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM public.job_postings
    WHERE jid LIKE 'JOB-' || current_year || '-%';

    NEW.jid := 'JOB-' || current_year || '-' || LPAD(next_num::TEXT, 3, '0');
    RETURN NEW;
END;
$function$;

-- 2. Create job_postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
    id SERIAL PRIMARY KEY,
    jid VARCHAR(20) NOT NULL UNIQUE,
    template_id INTEGER REFERENCES public.job_templates(id),
    job_title VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'open'
        CHECK (status IN ('draft', 'open', 'closed', 'archived')),
    opens_at DATE DEFAULT CURRENT_DATE,
    closes_at DATE,
    created_by VARCHAR(100) DEFAULT 'HR Team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_jid ON public.job_postings(jid);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_title ON public.job_postings(job_title);

-- jid auto-generation trigger
CREATE TRIGGER trg_generate_jid
    BEFORE INSERT ON public.job_postings
    FOR EACH ROW
    WHEN (NEW.jid IS NULL OR NEW.jid = '')
    EXECUTE FUNCTION public.generate_jid();

CREATE TRIGGER update_job_postings_updated_at
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create hr_assessments table
CREATE TABLE IF NOT EXISTS public.hr_assessments (
    id SERIAL PRIMARY KEY,
    jid VARCHAR(20) NOT NULL REFERENCES public.job_postings(jid),
    template_id INTEGER REFERENCES public.job_templates(id),
    role_title VARCHAR(150) NOT NULL,
    experience_level VARCHAR(50),
    skills TEXT[],
    mandatory_skills TEXT[],
    optional_skills TEXT[],
    skill_weights JSONB,
    optional_skill_weight NUMERIC(6,2) DEFAULT 0.5,
    job_description TEXT,
    ai_generated_jd BOOLEAN DEFAULT FALSE,
    mcq_time_limit INTEGER DEFAULT 30,
    video_time_limit INTEGER DEFAULT 15,
    coding_time_limit INTEGER DEFAULT 45,
    include_coding BOOLEAN DEFAULT FALSE,
    include_aptitude BOOLEAN DEFAULT FALSE,
    include_ai_interview BOOLEAN DEFAULT TRUE,
    include_manual_interview BOOLEAN DEFAULT FALSE,
    generate_ai_questions BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    created_by VARCHAR(100) DEFAULT 'HR Team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_assessments_jid ON public.hr_assessments(jid);
CREATE INDEX IF NOT EXISTS idx_hr_assessments_status ON public.hr_assessments(status);
CREATE INDEX IF NOT EXISTS idx_hr_assessments_created ON public.hr_assessments(created_at DESC);

CREATE TABLE IF NOT EXISTS public.hr_assessment_skill_mappings (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES public.hr_assessments(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    weight NUMERIC(8,2) NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assessment_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_hr_assessment_skill_mappings_assessment
  ON public.hr_assessment_skill_mappings(assessment_id, sort_order);

CREATE TRIGGER update_hr_assessments_updated_at
    BEFORE UPDATE ON public.hr_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create hr_assessment_questions table
CREATE TABLE IF NOT EXISTS public.hr_assessment_questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES public.hr_assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aq_assessment_id ON public.hr_assessment_questions(assessment_id);
