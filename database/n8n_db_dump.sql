--
-- PostgreSQL database dump
--

\restrict nh5fNEWiS6C5XZP6pDXa8WeHJd7Mhq8xqrkG1EOHzjHydZuiizgu0NmMCLCZ8rg

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aadhaar_verification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aadhaar_verification (
    screening_id character varying(50) NOT NULL,
    masked_aadhaar character varying(20) NOT NULL,
    verification_status character varying(20) NOT NULL,
    attempts_made integer DEFAULT 0,
    verified_at timestamp without time zone,
    name_match_score numeric(3,2),
    extracted_name character varying(100),
    verification_data jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verification_method character varying(50) DEFAULT 'ocr_tesseract'::character varying,
    image_quality_score integer,
    ocr_confidence integer,
    security_flags jsonb,
    ip_address inet,
    user_agent text,
    CONSTRAINT check_attempts_range CHECK (((attempts_made >= 0) AND (attempts_made <= 10))),
    CONSTRAINT check_name_match_score CHECK (((name_match_score >= 0.0) AND (name_match_score <= 1.0))),
    CONSTRAINT check_verification_status CHECK (((verification_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('verified'::character varying)::text, ('failed'::character varying)::text, ('locked'::character varying)::text])))
);


ALTER TABLE public.aadhaar_verification OWNER TO postgres;

--
-- Name: TABLE aadhaar_verification; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.aadhaar_verification IS 'Aadhaar card verification data and audit trail';


--
-- Name: COLUMN aadhaar_verification.masked_aadhaar; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.masked_aadhaar IS 'Last 4 digits of Aadhaar number (XXXX-XXXX-1234)';


--
-- Name: COLUMN aadhaar_verification.name_match_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.name_match_score IS 'Similarity score between extracted name and candidate name (0.0 to 1.0)';


--
-- Name: COLUMN aadhaar_verification.verification_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.verification_data IS 'Complete OCR extraction data and metadata';


--
-- Name: assessment_questions_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_questions_v2 (
    id integer NOT NULL,
    screening_id character varying(50),
    question_id integer,
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_answer character varying(1) NOT NULL,
    category character varying(50),
    difficulty character varying(20),
    explanation text,
    time_limit integer DEFAULT 90
);


ALTER TABLE public.assessment_questions_v2 OWNER TO postgres;

--
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assessment_questions_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assessment_questions_v2_id_seq OWNER TO postgres;

--
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_questions_v2_id_seq OWNED BY public.assessment_questions_v2.id;


--
-- Name: assessment_results_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_results_v2 (
    screening_id character varying(50) NOT NULL,
    answers jsonb NOT NULL,
    total_questions integer,
    correct_answers integer,
    score_percentage integer,
    time_spent integer,
    started_at timestamp without time zone,
    completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    violations jsonb,
    is_passed boolean,
    grade character varying(2),
    aadhaar_verified boolean DEFAULT false,
    verification_attempts integer DEFAULT 0,
    verification_data jsonb,
    survey_responses_count integer DEFAULT 0,
    survey_validation_status character varying(20) DEFAULT 'pending'::character varying,
    survey_completed_at timestamp without time zone,
    technical_assessment_unlocked boolean DEFAULT false,
    qualifying_survey_questions_count integer DEFAULT 0,
    informational_survey_questions_count integer DEFAULT 0,
    two_stage_process_completed boolean DEFAULT false,
    CONSTRAINT check_survey_validation_status_results CHECK (((survey_validation_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('passed'::character varying)::text, ('failed'::character varying)::text])))
);


ALTER TABLE public.assessment_results_v2 OWNER TO postgres;

--
-- Name: COLUMN assessment_results_v2.survey_responses_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_responses_count IS 'Total number of survey questions answered';


--
-- Name: COLUMN assessment_results_v2.survey_validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_validation_status IS 'Status of preference screening validation';


--
-- Name: COLUMN assessment_results_v2.survey_completed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_completed_at IS 'When the survey/preference screening was completed';


--
-- Name: COLUMN assessment_results_v2.technical_assessment_unlocked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.technical_assessment_unlocked IS 'Whether technical assessment was unlocked after survey validation';


--
-- Name: COLUMN assessment_results_v2.qualifying_survey_questions_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.qualifying_survey_questions_count IS 'Number of qualifying survey questions';


--
-- Name: COLUMN assessment_results_v2.informational_survey_questions_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.informational_survey_questions_count IS 'Number of informational survey questions';


--
-- Name: COLUMN assessment_results_v2.two_stage_process_completed; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.two_stage_process_completed IS 'Whether both survey and technical stages were completed';


--
-- Name: candidates_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidates_v2 (
    screening_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    location character varying(100),
    current_company character varying(100),
    job_title character varying(100),
    match_score integer,
    required_skills text,
    experience_level character varying(50),
    salary_expectation character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    status character varying(20) DEFAULT 'pending'::character varying,
    identity_verified boolean DEFAULT false,
    verification_required boolean DEFAULT true,
    verification_attempts integer DEFAULT 0,
    last_verification_attempt timestamp without time zone,
    survey_validation_status character varying(20) DEFAULT 'pending'::character varying,
    survey_completed_at timestamp without time zone,
    technical_assessment_unlocked boolean DEFAULT false,
    resume_drive_id character varying(255),
    resume_file_name character varying(255),
    resume_drive_url text,
    resume_text text,
    CONSTRAINT check_survey_validation_status CHECK (((survey_validation_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('passed'::character varying)::text, ('failed'::character varying)::text])))
);


ALTER TABLE public.candidates_v2 OWNER TO postgres;

--
-- Name: TABLE candidates_v2; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.candidates_v2 IS 'Candidate information with identity verification support';


--
-- Name: COLUMN candidates_v2.survey_validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.survey_validation_status IS 'Status of preference screening: pending, passed, failed';


--
-- Name: COLUMN candidates_v2.survey_completed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.survey_completed_at IS 'Timestamp when survey was completed and validated';


--
-- Name: COLUMN candidates_v2.technical_assessment_unlocked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.technical_assessment_unlocked IS 'TRUE if candidate passed preference screening and can access technical questions';


--
-- Name: job_requirements_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_requirements_v2 (
    id integer NOT NULL,
    screening_id character varying(50),
    job_title character varying(100),
    required_skills text,
    experience_level character varying(50),
    salary_budget character varying(50),
    question_count integer DEFAULT 20,
    time_limit character varying(20) DEFAULT '30 minutes'::character varying,
    difficulty character varying(20) DEFAULT 'intermediate'::character varying,
    focus_areas jsonb,
    optional_skills text
);


ALTER TABLE public.job_requirements_v2 OWNER TO postgres;

--
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_requirements_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_requirements_v2_id_seq OWNER TO postgres;

--
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_requirements_v2_id_seq OWNED BY public.job_requirements_v2.id;


--
-- Name: job_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_templates (
    id integer NOT NULL,
    template_name character varying(100) NOT NULL,
    category character varying(50) DEFAULT 'General'::character varying,
    description text,
    form_data jsonb NOT NULL,
    usage_count integer DEFAULT 0,
    created_by character varying(100) DEFAULT 'HR Team'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


ALTER TABLE public.job_templates OWNER TO postgres;

--
-- Name: TABLE job_templates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.job_templates IS 'Pre-configured job posting templates for HR team';


--
-- Name: COLUMN job_templates.form_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.job_templates.form_data IS 'Complete form data including job details and survey questions in JSON format';


--
-- Name: COLUMN job_templates.usage_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.job_templates.usage_count IS 'Number of times this template has been used';


--
-- Name: job_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_templates_id_seq OWNER TO postgres;

--
-- Name: job_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_templates_id_seq OWNED BY public.job_templates.id;


--
-- Name: survey_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_questions (
    id integer NOT NULL,
    screening_id character varying(50),
    question_id integer,
    question_text text NOT NULL,
    question_type character varying(20),
    options jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expected_answer character varying(100),
    is_qualifying boolean DEFAULT false,
    question_category character varying(20) DEFAULT 'informational'::character varying,
    validation_type character varying(20),
    CONSTRAINT check_question_category CHECK (((question_category)::text = ANY (ARRAY[('qualifying'::character varying)::text, ('informational'::character varying)::text]))),
    CONSTRAINT check_validation_type CHECK (((validation_type)::text = ANY (ARRAY[('exact_match'::character varying)::text, ('none'::character varying)::text])))
);


ALTER TABLE public.survey_questions OWNER TO postgres;

--
-- Name: COLUMN survey_questions.expected_answer; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.expected_answer IS 'Expected answer for qualifying questions (Yes/No or specific multiple choice option)';


--
-- Name: COLUMN survey_questions.is_qualifying; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.is_qualifying IS 'TRUE if this question requires validation to proceed to technical assessment';


--
-- Name: COLUMN survey_questions.question_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.question_category IS 'Category: qualifying or informational';


--
-- Name: COLUMN survey_questions.validation_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.validation_type IS 'Type of validation: exact_match for Yes/No and Multiple Choice';


--
-- Name: survey_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_questions_id_seq OWNER TO postgres;

--
-- Name: survey_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_questions_id_seq OWNED BY public.survey_questions.id;


--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_responses (
    id integer NOT NULL,
    screening_id character varying(50),
    question_id integer,
    response_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.survey_responses OWNER TO postgres;

--
-- Name: survey_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_responses_id_seq OWNER TO postgres;

--
-- Name: survey_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_responses_id_seq OWNED BY public.survey_responses.id;


--
-- Name: survey_validation_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_validation_results (
    id integer NOT NULL,
    screening_id character varying(50) NOT NULL,
    validation_status character varying(20) NOT NULL,
    qualifying_questions_count integer DEFAULT 0,
    correct_answers_count integer DEFAULT 0,
    failed_questions jsonb,
    all_survey_responses jsonb,
    validation_details jsonb,
    validated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_validation_status CHECK (((validation_status)::text = ANY (ARRAY[('passed'::character varying)::text, ('failed'::character varying)::text, ('pending'::character varying)::text])))
);


ALTER TABLE public.survey_validation_results OWNER TO postgres;

--
-- Name: TABLE survey_validation_results; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.survey_validation_results IS 'Results of preference/survey question validation before technical assessment';


--
-- Name: COLUMN survey_validation_results.validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.validation_status IS 'Status: passed, failed, or pending';


--
-- Name: COLUMN survey_validation_results.failed_questions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.failed_questions IS 'Array of failed question details with expected vs actual answers';


--
-- Name: COLUMN survey_validation_results.all_survey_responses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.all_survey_responses IS 'Complete survey response data for reference';


--
-- Name: COLUMN survey_validation_results.validation_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.validation_details IS 'Detailed validation metadata and scoring breakdown';


--
-- Name: survey_validation_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.survey_validation_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.survey_validation_results_id_seq OWNER TO postgres;

--
-- Name: survey_validation_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_validation_results_id_seq OWNED BY public.survey_validation_results.id;


--
-- Name: survey_validation_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.survey_validation_summary AS
 SELECT c.screening_id,
    c.name,
    c.email,
    c.survey_validation_status,
    c.survey_completed_at,
    c.technical_assessment_unlocked,
    svr.validation_status AS detailed_validation_status,
    svr.qualifying_questions_count,
    svr.correct_answers_count,
    svr.failed_questions,
    svr.validated_at,
        CASE
            WHEN (svr.qualifying_questions_count > 0) THEN round((((svr.correct_answers_count)::numeric / (svr.qualifying_questions_count)::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS validation_percentage
   FROM (public.candidates_v2 c
     LEFT JOIN public.survey_validation_results svr ON (((c.screening_id)::text = (svr.screening_id)::text)));


ALTER VIEW public.survey_validation_summary OWNER TO postgres;

--
-- Name: VIEW survey_validation_summary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.survey_validation_summary IS 'Combined view of candidate survey validation status and results';


--
-- Name: verification_audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_audit_log (
    id integer NOT NULL,
    screening_id character varying(50) NOT NULL,
    action_type character varying(50) NOT NULL,
    action_details jsonb,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address inet,
    user_agent text,
    result character varying(20)
);


ALTER TABLE public.verification_audit_log OWNER TO postgres;

--
-- Name: TABLE verification_audit_log; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.verification_audit_log IS 'Complete audit log for all verification activities';


--
-- Name: verification_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.verification_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verification_audit_log_id_seq OWNER TO postgres;

--
-- Name: verification_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.verification_audit_log_id_seq OWNED BY public.verification_audit_log.id;


--
-- Name: assessment_questions_v2 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2 ALTER COLUMN id SET DEFAULT nextval('public.assessment_questions_v2_id_seq'::regclass);


--
-- Name: job_requirements_v2 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2 ALTER COLUMN id SET DEFAULT nextval('public.job_requirements_v2_id_seq'::regclass);


--
-- Name: job_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates ALTER COLUMN id SET DEFAULT nextval('public.job_templates_id_seq'::regclass);


--
-- Name: survey_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions ALTER COLUMN id SET DEFAULT nextval('public.survey_questions_id_seq'::regclass);


--
-- Name: survey_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses ALTER COLUMN id SET DEFAULT nextval('public.survey_responses_id_seq'::regclass);


--
-- Name: survey_validation_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results ALTER COLUMN id SET DEFAULT nextval('public.survey_validation_results_id_seq'::regclass);


--
-- Name: verification_audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log ALTER COLUMN id SET DEFAULT nextval('public.verification_audit_log_id_seq'::regclass);


--
-- Name: aadhaar_verification aadhaar_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aadhaar_verification
    ADD CONSTRAINT aadhaar_verification_pkey PRIMARY KEY (screening_id);


--
-- Name: assessment_questions_v2 assessment_questions_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2
    ADD CONSTRAINT assessment_questions_v2_pkey PRIMARY KEY (id);


--
-- Name: assessment_results_v2 assessment_results_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_results_v2
    ADD CONSTRAINT assessment_results_v2_pkey PRIMARY KEY (screening_id);


--
-- Name: candidates_v2 candidates_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates_v2
    ADD CONSTRAINT candidates_v2_pkey PRIMARY KEY (screening_id);


--
-- Name: job_requirements_v2 job_requirements_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2
    ADD CONSTRAINT job_requirements_v2_pkey PRIMARY KEY (id);


--
-- Name: job_templates job_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_pkey PRIMARY KEY (id);


--
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- Name: survey_validation_results survey_validation_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results
    ADD CONSTRAINT survey_validation_results_pkey PRIMARY KEY (id);


--
-- Name: verification_audit_log verification_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log
    ADD CONSTRAINT verification_audit_log_pkey PRIMARY KEY (id);


--
-- Name: idx_aadhaar_verification_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aadhaar_verification_created ON public.aadhaar_verification USING btree (created_at);


--
-- Name: idx_aadhaar_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aadhaar_verification_status ON public.aadhaar_verification USING btree (verification_status);


--
-- Name: idx_candidates_v2_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_email ON public.candidates_v2 USING btree (email);


--
-- Name: idx_candidates_v2_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_status ON public.candidates_v2 USING btree (status);


--
-- Name: idx_candidates_v2_survey_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_survey_status ON public.candidates_v2 USING btree (survey_validation_status);


--
-- Name: idx_candidates_v2_verification; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_verification ON public.candidates_v2 USING btree (identity_verified);


--
-- Name: idx_job_templates_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_templates_active ON public.job_templates USING btree (is_active);


--
-- Name: idx_job_templates_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_templates_category ON public.job_templates USING btree (category);


--
-- Name: idx_job_templates_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_templates_created ON public.job_templates USING btree (created_at DESC);


--
-- Name: idx_survey_validation_screening; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_screening ON public.survey_validation_results USING btree (screening_id);


--
-- Name: idx_survey_validation_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_status ON public.survey_validation_results USING btree (validation_status);


--
-- Name: idx_survey_validation_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_timestamp ON public.survey_validation_results USING btree (validated_at);


--
-- Name: idx_verification_audit_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verification_audit_action ON public.verification_audit_log USING btree (action_type);


--
-- Name: idx_verification_audit_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verification_audit_timestamp ON public.verification_audit_log USING btree ("timestamp");


--
-- Name: job_templates update_job_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_job_templates_updated_at BEFORE UPDATE ON public.job_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: aadhaar_verification aadhaar_verification_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aadhaar_verification
    ADD CONSTRAINT aadhaar_verification_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: assessment_questions_v2 assessment_questions_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2
    ADD CONSTRAINT assessment_questions_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: assessment_results_v2 assessment_results_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_results_v2
    ADD CONSTRAINT assessment_results_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: job_requirements_v2 job_requirements_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2
    ADD CONSTRAINT job_requirements_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: survey_questions survey_questions_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: survey_responses survey_responses_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: survey_validation_results survey_validation_results_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results
    ADD CONSTRAINT survey_validation_results_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: verification_audit_log verification_audit_log_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log
    ADD CONSTRAINT verification_audit_log_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- PostgreSQL database dump complete
--

\unrestrict nh5fNEWiS6C5XZP6pDXa8WeHJd7Mhq8xqrkG1EOHzjHydZuiizgu0NmMCLCZ8rg

