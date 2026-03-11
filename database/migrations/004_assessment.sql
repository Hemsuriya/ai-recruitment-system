-- ============================================================
-- Migration 004: MCQ Assessment Questions & Results
-- ============================================================

CREATE TABLE public.assessment_questions_v2 (
    id              serial PRIMARY KEY,
    screening_id    character varying(50),
    question_id     integer,
    question_text   text NOT NULL,
    options         jsonb NOT NULL,
    correct_answer  character varying(1) NOT NULL,
    category        character varying(50),
    difficulty      character varying(20),
    explanation     text,
    time_limit      integer DEFAULT 90,
    CONSTRAINT assessment_questions_v2_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);


CREATE TABLE public.assessment_results_v2 (
    screening_id                        character varying(50) NOT NULL,
    answers                             jsonb NOT NULL,
    total_questions                     integer,
    correct_answers                     integer,
    score_percentage                    integer,
    time_spent                          integer,
    started_at                          timestamp without time zone,
    completed_at                        timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    violations                          jsonb,
    is_passed                           boolean,
    grade                               character varying(2),
    aadhaar_verified                    boolean DEFAULT false,
    verification_attempts               integer DEFAULT 0,
    verification_data                   jsonb,
    survey_responses_count              integer DEFAULT 0,
    survey_validation_status            character varying(20) DEFAULT 'pending',
    survey_completed_at                 timestamp without time zone,
    technical_assessment_unlocked       boolean DEFAULT false,
    qualifying_survey_questions_count   integer DEFAULT 0,
    informational_survey_questions_count integer DEFAULT 0,
    two_stage_process_completed         boolean DEFAULT false,
    CONSTRAINT assessment_results_v2_pkey PRIMARY KEY (screening_id),
    CONSTRAINT check_survey_validation_status_results CHECK (
        survey_validation_status IN ('pending', 'passed', 'failed')
    ),
    CONSTRAINT assessment_results_v2_screening_id_fkey
        FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id)
);

COMMENT ON COLUMN public.assessment_results_v2.survey_responses_count IS 'Total number of survey questions answered';
