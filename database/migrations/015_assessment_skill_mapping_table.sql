-- ============================================================
-- Migration 015: Canonical Assessment Skill Mapping Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.hr_assessment_skill_mappings (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES public.hr_assessments(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    weight NUMERIC(8,2) NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assessment_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_hr_assessment_skill_mappings_assessment
    ON public.hr_assessment_skill_mappings (assessment_id, sort_order);

INSERT INTO public.hr_assessment_skill_mappings
    (assessment_id, skill_name, is_mandatory, weight, sort_order)
SELECT
    ha.id AS assessment_id,
    ms.skill_name,
    ms.is_mandatory,
    ms.weight,
    ms.sort_order
FROM public.hr_assessments ha
JOIN LATERAL (
    SELECT
        skill_name,
        true AS is_mandatory,
        COALESCE((ha.skill_weights ->> skill_name)::numeric, 1) AS weight,
        row_number() OVER () - 1 AS sort_order
    FROM unnest(COALESCE(ha.mandatory_skills, ha.skills, ARRAY[]::TEXT[])) AS skill_name

    UNION ALL

    SELECT
        skill_name,
        false AS is_mandatory,
        COALESCE(ha.optional_skill_weight, 0.5) AS weight,
        1000 + row_number() OVER () - 1 AS sort_order
    FROM unnest(COALESCE(ha.optional_skills, ARRAY[]::TEXT[])) AS skill_name
) ms ON true
ON CONFLICT (assessment_id, skill_name) DO NOTHING;

COMMENT ON TABLE public.hr_assessment_skill_mappings
    IS 'Canonical mapping of assessment skills with mandatory flag and effective weight.';

