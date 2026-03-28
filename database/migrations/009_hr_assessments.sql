-- ============================================================
-- Migration 009: HR Assessments Master Config
-- ============================================================

-- ── hr_assessments table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_assessments (
    id SERIAL PRIMARY KEY,
    jid VARCHAR(20) NOT NULL REFERENCES public.job_postings(jid),
    template_id INTEGER REFERENCES public.job_templates(id),
    role_title VARCHAR(150) NOT NULL,
    experience_level VARCHAR(50),
    skills TEXT[],
    job_description TEXT,
    ai_generated_jd BOOLEAN DEFAULT false,
    mcq_time_limit INTEGER DEFAULT 30,
    video_time_limit INTEGER DEFAULT 15,
    coding_time_limit INTEGER DEFAULT 45,
    include_coding BOOLEAN DEFAULT false,
    include_aptitude BOOLEAN DEFAULT false,
    include_ai_interview BOOLEAN DEFAULT true,
    include_manual_interview BOOLEAN DEFAULT false,
    generate_ai_questions BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    created_by VARCHAR(100) DEFAULT 'HR Team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_assessments_jid ON public.hr_assessments (jid);
CREATE INDEX IF NOT EXISTS idx_hr_assessments_status ON public.hr_assessments (status);
CREATE INDEX IF NOT EXISTS idx_hr_assessments_created ON public.hr_assessments (created_at DESC);

-- Trigger for updated_at
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_hr_assessments_updated_at
            BEFORE UPDATE ON public.hr_assessments
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- ── hr_assessment_questions table ───────────────────────────
CREATE TABLE IF NOT EXISTS public.hr_assessment_questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES public.hr_assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_selected BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_aq_assessment_id ON public.hr_assessment_questions (assessment_id);
