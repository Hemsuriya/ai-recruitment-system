-- ============================================================
-- Migration 003: Survey Questions, Responses & Validation
-- ============================================================

CREATE TABLE public.survey_questions (
    id              serial PRIMARY KEY,
    screening_id    character varying(50),
    question_id     integer,
    question_text   text NOT NULL,
    question_type   character varying(20),
    options         jsonb,
    expected_answer character varying(100),
    is_qualifying   boolean DEFAULT false,
    question_category character varying(20) DEFAULT 'informational',
    validation_type character varying(20),
    created_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_question_category CHECK (
        question_category IN ('qualifying', 'informational')
    ),
    CONSTRAINT check_validation_type CHECK (
        validation_type IN ('exact_match', 'none') OR validation_type IS NULL
    ),
    CONSTRAINT survey_questions_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON COLUMN public.survey_questions.expected_answer IS 'Expected answer for qualifying questions';
COMMENT ON COLUMN public.survey_questions.is_qualifying IS 'TRUE if this question requires validation to proceed to technical assessment';
COMMENT ON COLUMN public.survey_questions.question_category IS 'Category: qualifying or informational';


CREATE TABLE public.survey_responses (
    id              serial PRIMARY KEY,
    screening_id    character varying(50),
    question_id     integer,
    response_text   text,
    created_at      timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT survey_responses_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);


CREATE TABLE public.survey_validation_results (
    id                          serial PRIMARY KEY,
    screening_id                character varying(50) NOT NULL,
    validation_status           character varying(20) NOT NULL,
    qualifying_questions_count  integer DEFAULT 0,
    correct_answers_count       integer DEFAULT 0,
    failed_questions            jsonb,
    all_survey_responses        jsonb,
    validation_details          jsonb,
    validated_at                timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_validation_status CHECK (
        validation_status IN ('passed', 'failed', 'pending')
    ),
    CONSTRAINT survey_validation_results_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON TABLE  public.survey_validation_results IS 'Results of preference/survey question validation before technical assessment';
COMMENT ON COLUMN public.survey_validation_results.failed_questions IS 'Array of failed question details with expected vs actual answers';
COMMENT ON COLUMN public.survey_validation_results.validation_details IS 'Detailed validation metadata and scoring breakdown';

CREATE INDEX idx_survey_validation_screening  ON public.survey_validation_results USING btree (screening_id);
CREATE INDEX idx_survey_validation_status     ON public.survey_validation_results USING btree (validation_status);
CREATE INDEX idx_survey_validation_timestamp  ON public.survey_validation_results USING btree (validated_at);


-- ── Convenience view ──────────────────────────────────────────
CREATE VIEW public.survey_validation_summary AS
SELECT
    c.screening_id,
    c.name,
    c.email,
    c.survey_validation_status,
    c.survey_completed_at,
    c.technical_assessment_unlocked,
    svr.validation_status   AS detailed_validation_status,
    svr.qualifying_questions_count,
    svr.correct_answers_count,
    svr.failed_questions,
    svr.validated_at,
    CASE
        WHEN svr.qualifying_questions_count > 0
        THEN ROUND((svr.correct_answers_count::numeric / svr.qualifying_questions_count::numeric) * 100, 2)
        ELSE 0
    END AS validation_percentage
FROM public.candidates_v2 c
LEFT JOIN public.survey_validation_results svr ON c.screening_id = svr.screening_id;

COMMENT ON VIEW public.survey_validation_summary IS 'Combined view of candidate survey validation status and results';
