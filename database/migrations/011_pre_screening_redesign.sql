-- ============================================================
-- Migration 011: Pre-Screening Redesign
-- ============================================================

-- Dedicated pre-screening questions for HR assessments
CREATE TABLE IF NOT EXISTS public.hr_pre_screening_questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES public.hr_assessments(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_type VARCHAR(20) NOT NULL
        CHECK (answer_type IN ('yes_no', 'mcq', 'text')),
    options JSONB,
    is_mandatory BOOLEAN DEFAULT false,
    expected_answer TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hr_prescreen_assessment_id
    ON public.hr_pre_screening_questions (assessment_id);
CREATE INDEX IF NOT EXISTS idx_hr_prescreen_sort_order
    ON public.hr_pre_screening_questions (assessment_id, sort_order);

-- Track per-answer matching and ownership context
ALTER TABLE public.survey_responses
    ADD COLUMN IF NOT EXISTS candidate_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS assessment_id INTEGER REFERENCES public.hr_assessments(id),
    ADD COLUMN IF NOT EXISTS jid VARCHAR(20),
    ADD COLUMN IF NOT EXISTS matched_expected BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_survey_responses_candidate
    ON public.survey_responses (candidate_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_assessment
    ON public.survey_responses (assessment_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_matched
    ON public.survey_responses (matched_expected);
