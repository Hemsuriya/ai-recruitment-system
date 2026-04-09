-- ============================================================
-- Migration 014: Skill Tiers and Weights for HR Assessments
-- ============================================================

ALTER TABLE public.hr_assessments
    ADD COLUMN IF NOT EXISTS mandatory_skills TEXT[],
    ADD COLUMN IF NOT EXISTS optional_skills TEXT[],
    ADD COLUMN IF NOT EXISTS skill_weights JSONB,
    ADD COLUMN IF NOT EXISTS optional_skill_weight NUMERIC(6,2) DEFAULT 0.5;

COMMENT ON COLUMN public.hr_assessments.mandatory_skills
    IS 'Mandatory skills selected by HR.';

COMMENT ON COLUMN public.hr_assessments.optional_skills
    IS 'Optional skills selected by HR.';

COMMENT ON COLUMN public.hr_assessments.skill_weights
    IS 'Weight mapping for mandatory skills only, e.g. {"Python":2.0}.';

COMMENT ON COLUMN public.hr_assessments.optional_skill_weight
    IS 'System-defined weight multiplier applied to optional skills (not HR editable).';

