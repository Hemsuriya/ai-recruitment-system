-- ============================================================
-- Migration 005: Identity Verification & Audit
-- ============================================================

CREATE TABLE public.aadhaar_verification (
    screening_id            character varying(50)  NOT NULL,
    masked_aadhaar          character varying(20)  NOT NULL,
    verification_status     character varying(20)  NOT NULL,
    attempts_made           integer DEFAULT 0,
    verified_at             timestamp without time zone,
    name_match_score        numeric(3,2),
    extracted_name          character varying(100),
    verification_data       jsonb,
    verification_method     character varying(50) DEFAULT 'ocr_tesseract',
    image_quality_score     integer,
    ocr_confidence          integer,
    security_flags          jsonb,
    ip_address              inet,
    user_agent              text,
    created_at              timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT aadhaar_verification_pkey PRIMARY KEY (screening_id),
    CONSTRAINT check_attempts_range CHECK (attempts_made >= 0 AND attempts_made <= 10),
    CONSTRAINT check_name_match_score CHECK (name_match_score >= 0.0 AND name_match_score <= 1.0),
    CONSTRAINT check_verification_status CHECK (
        verification_status IN ('pending', 'verified', 'failed', 'locked')
    ),
    CONSTRAINT aadhaar_verification_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON TABLE  public.aadhaar_verification IS 'Aadhaar card verification data and audit trail';
COMMENT ON COLUMN public.aadhaar_verification.masked_aadhaar IS 'Last 4 digits of Aadhaar number (XXXX-XXXX-1234)';
COMMENT ON COLUMN public.aadhaar_verification.name_match_score IS 'Similarity score between extracted name and candidate name (0.0 to 1.0)';

CREATE INDEX idx_aadhaar_verification_status  ON public.aadhaar_verification USING btree (verification_status);
CREATE INDEX idx_aadhaar_verification_created ON public.aadhaar_verification USING btree (created_at);


-- ── Verification Audit Log ────────────────────────────────────
CREATE TABLE public.verification_audit_log (
    id              serial PRIMARY KEY,
    screening_id    character varying(50) NOT NULL,
    action_type     character varying(50) NOT NULL,
    action_details  jsonb,
    timestamp       timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address      inet,
    user_agent      text,
    result          character varying(20),
    CONSTRAINT verification_audit_log_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON TABLE public.verification_audit_log IS 'Complete audit log for all verification activities';

CREATE INDEX idx_verification_audit_action    ON public.verification_audit_log USING btree (action_type);
CREATE INDEX idx_verification_audit_timestamp ON public.verification_audit_log USING btree (timestamp);
