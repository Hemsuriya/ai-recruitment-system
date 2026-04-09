-- ============================================================
-- Migration 013: Optional Pre-Screening Scoring Mapping
-- ============================================================

ALTER TABLE public.hr_pre_screening_questions
    ADD COLUMN IF NOT EXISTS optional_weight NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS optional_score_map JSONB;

COMMENT ON COLUMN public.hr_pre_screening_questions.optional_weight
    IS 'Optional question weight used for scoring-only calculation (non-gating).';

COMMENT ON COLUMN public.hr_pre_screening_questions.optional_score_map
    IS 'Optional answer-to-score mapping JSON object, e.g. {"Yes":1,"No":0}.';

