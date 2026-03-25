-- ============================================================
-- Migration 007: Job Postings with Auto-Generated JID
-- ============================================================

-- ── job_postings table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_postings (
    id              SERIAL PRIMARY KEY,
    jid             VARCHAR(20) NOT NULL UNIQUE,
    template_id     INTEGER REFERENCES public.job_templates(id),
    job_title       VARCHAR(100) NOT NULL,
    status          VARCHAR(20) DEFAULT 'open'
                    CHECK (status IN ('draft','open','closed','archived')),
    opens_at        DATE DEFAULT CURRENT_DATE,
    closes_at       DATE,
    created_by      VARCHAR(100) DEFAULT 'HR Team',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_jid    ON public.job_postings (jid);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings (status);
CREATE INDEX IF NOT EXISTS idx_job_postings_title  ON public.job_postings (job_title);

-- ── Auto-generate JID trigger ────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_jid()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
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
$$;

CREATE TRIGGER trg_generate_jid
    BEFORE INSERT ON public.job_postings
    FOR EACH ROW
    WHEN (NEW.jid IS NULL OR NEW.jid = '')
    EXECUTE FUNCTION public.generate_jid();

-- ── updated_at trigger (reuse existing function) ─────────────
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_job_postings_updated_at
            BEFORE UPDATE ON public.job_postings
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- ── Add jid FK to MCQ pipeline ───────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'candidates_v2' AND column_name = 'jid'
    ) THEN
        ALTER TABLE public.candidates_v2
            ADD COLUMN jid VARCHAR(20) REFERENCES public.job_postings(jid);
        CREATE INDEX idx_candidates_v2_jid ON public.candidates_v2 (jid);
    END IF;
END $$;

-- ── Add jid FK to Video pipeline ─────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'video_interview_candidates' AND column_name = 'jid'
    ) THEN
        ALTER TABLE public.video_interview_candidates
            ADD COLUMN jid VARCHAR(20) REFERENCES public.job_postings(jid);
        CREATE INDEX idx_video_candidates_jid ON public.video_interview_candidates (jid);
    END IF;
END $$;
