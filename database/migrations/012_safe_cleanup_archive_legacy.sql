-- ============================================================
-- Migration 012: Safe Cleanup (Non-Destructive Archive)
-- ============================================================
-- Goal:
-- - Clean schema without deleting existing data.
-- - Move currently-unused legacy verification tables into archive schema.
-- - Keep active tables/columns untouched.

BEGIN;

CREATE SCHEMA IF NOT EXISTS legacy_archive;

-- Move legacy identity verification tables (not referenced by current backend routes/services)
DO $$
BEGIN
  IF to_regclass('public.aadhaar_verification') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.aadhaar_verification SET SCHEMA legacy_archive';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.verification_audit_log') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.verification_audit_log SET SCHEMA legacy_archive';
  END IF;
END $$;

-- Track archived tables for operational visibility
CREATE TABLE IF NOT EXISTS public.schema_cleanup_log (
    id SERIAL PRIMARY KEY,
    cleanup_action TEXT NOT NULL,
    object_name TEXT NOT NULL,
    moved_to_schema TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.schema_cleanup_log (cleanup_action, object_name, moved_to_schema)
SELECT 'archive_table', 'aadhaar_verification', 'legacy_archive'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.schema_cleanup_log
  WHERE cleanup_action = 'archive_table'
    AND object_name = 'aadhaar_verification'
    AND moved_to_schema = 'legacy_archive'
);

INSERT INTO public.schema_cleanup_log (cleanup_action, object_name, moved_to_schema)
SELECT 'archive_table', 'verification_audit_log', 'legacy_archive'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.schema_cleanup_log
  WHERE cleanup_action = 'archive_table'
    AND object_name = 'verification_audit_log'
    AND moved_to_schema = 'legacy_archive'
);

COMMIT;
