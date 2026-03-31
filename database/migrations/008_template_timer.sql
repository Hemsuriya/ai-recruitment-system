-- ============================================================
-- Migration 008: Add time_limit_minutes to job_templates
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'job_templates' AND column_name = 'time_limit_minutes'
    ) THEN
        ALTER TABLE public.job_templates
            ADD COLUMN time_limit_minutes INTEGER DEFAULT 30;
    END IF;
END $$;
