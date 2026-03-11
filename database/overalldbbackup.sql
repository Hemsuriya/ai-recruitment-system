--
-- PostgreSQL database dump
--

\restrict XFeBdZiHFyozBneVF9ByOAuBZr06oq558MfQavxtsdZNu0U1UKN07E7QrRUvsfp

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-10 11:44:35

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
-- TOC entry 249 (class 1255 OID 19078)
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
-- TOC entry 219 (class 1259 OID 19079)
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
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE aadhaar_verification; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.aadhaar_verification IS 'Aadhaar card verification data and audit trail';


--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN aadhaar_verification.masked_aadhaar; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.masked_aadhaar IS 'Last 4 digits of Aadhaar number (XXXX-XXXX-1234)';


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN aadhaar_verification.name_match_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.name_match_score IS 'Similarity score between extracted name and candidate name (0.0 to 1.0)';


--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 219
-- Name: COLUMN aadhaar_verification.verification_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.verification_data IS 'Complete OCR extraction data and metadata';


--
-- TOC entry 220 (class 1259 OID 19093)
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
-- TOC entry 221 (class 1259 OID 19103)
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
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 221
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_questions_v2_id_seq OWNED BY public.assessment_questions_v2.id;


--
-- TOC entry 222 (class 1259 OID 19104)
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
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN assessment_results_v2.survey_responses_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_responses_count IS 'Total number of survey questions answered';


--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN assessment_results_v2.survey_validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_validation_status IS 'Status of preference screening validation';


--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN assessment_results_v2.survey_completed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_completed_at IS 'When the survey/preference screening was completed';


--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN assessment_results_v2.technical_assessment_unlocked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.technical_assessment_unlocked IS 'Whether technical assessment was unlocked after survey validation';


--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN assessment_results_v2.qualifying_survey_questions_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.qualifying_survey_questions_count IS 'Number of qualifying survey questions';


--
-- TOC entry 5287 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN assessment_results_v2.informational_survey_questions_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.informational_survey_questions_count IS 'Number of informational survey questions';


--
-- TOC entry 5288 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN assessment_results_v2.two_stage_process_completed; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.two_stage_process_completed IS 'Whether both survey and technical stages were completed';


--
-- TOC entry 223 (class 1259 OID 19121)
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
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE candidates_v2; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.candidates_v2 IS 'Candidate information with identity verification support';


--
-- TOC entry 5290 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN candidates_v2.survey_validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.survey_validation_status IS 'Status of preference screening: pending, passed, failed';


--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN candidates_v2.survey_completed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.survey_completed_at IS 'Timestamp when survey was completed and validated';


--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN candidates_v2.technical_assessment_unlocked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.technical_assessment_unlocked IS 'TRUE if candidate passed preference screening and can access technical questions';


--
-- TOC entry 224 (class 1259 OID 19137)
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
-- TOC entry 225 (class 1259 OID 19146)
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
-- TOC entry 5293 (class 0 OID 0)
-- Dependencies: 225
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_requirements_v2_id_seq OWNED BY public.job_requirements_v2.id;


--
-- TOC entry 226 (class 1259 OID 19147)
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
-- TOC entry 5294 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE job_templates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.job_templates IS 'Pre-configured job posting templates for HR team';


--
-- TOC entry 5295 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN job_templates.form_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.job_templates.form_data IS 'Complete form data including job details and survey questions in JSON format';


--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN job_templates.usage_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.job_templates.usage_count IS 'Number of times this template has been used';


--
-- TOC entry 227 (class 1259 OID 19161)
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
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 227
-- Name: job_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_templates_id_seq OWNED BY public.job_templates.id;


--
-- TOC entry 228 (class 1259 OID 19162)
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
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN survey_questions.expected_answer; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.expected_answer IS 'Expected answer for qualifying questions (Yes/No or specific multiple choice option)';


--
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN survey_questions.is_qualifying; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.is_qualifying IS 'TRUE if this question requires validation to proceed to technical assessment';


--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN survey_questions.question_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.question_category IS 'Category: qualifying or informational';


--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 228
-- Name: COLUMN survey_questions.validation_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.validation_type IS 'Type of validation: exact_match for Yes/No and Multiple Choice';


--
-- TOC entry 229 (class 1259 OID 19174)
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
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 229
-- Name: survey_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_questions_id_seq OWNED BY public.survey_questions.id;


--
-- TOC entry 230 (class 1259 OID 19175)
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
-- TOC entry 231 (class 1259 OID 19182)
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
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 231
-- Name: survey_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_responses_id_seq OWNED BY public.survey_responses.id;


--
-- TOC entry 232 (class 1259 OID 19183)
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
-- TOC entry 5304 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE survey_validation_results; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.survey_validation_results IS 'Results of preference/survey question validation before technical assessment';


--
-- TOC entry 5305 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN survey_validation_results.validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.validation_status IS 'Status: passed, failed, or pending';


--
-- TOC entry 5306 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN survey_validation_results.failed_questions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.failed_questions IS 'Array of failed question details with expected vs actual answers';


--
-- TOC entry 5307 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN survey_validation_results.all_survey_responses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.all_survey_responses IS 'Complete survey response data for reference';


--
-- TOC entry 5308 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN survey_validation_results.validation_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.validation_details IS 'Detailed validation metadata and scoring breakdown';


--
-- TOC entry 233 (class 1259 OID 19195)
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
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 233
-- Name: survey_validation_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_validation_results_id_seq OWNED BY public.survey_validation_results.id;


--
-- TOC entry 234 (class 1259 OID 19196)
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
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 234
-- Name: VIEW survey_validation_summary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.survey_validation_summary IS 'Combined view of candidate survey validation status and results';


--
-- TOC entry 235 (class 1259 OID 19201)
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
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE verification_audit_log; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.verification_audit_log IS 'Complete audit log for all verification activities';


--
-- TOC entry 236 (class 1259 OID 19210)
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
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 236
-- Name: verification_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.verification_audit_log_id_seq OWNED BY public.verification_audit_log.id;


--
-- TOC entry 237 (class 1259 OID 19293)
-- Name: video_analysis_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_analysis_results (
    id integer NOT NULL,
    video_assessment_id character varying(255) NOT NULL,
    candidate_name character varying(255),
    candidate_email character varying(255),
    video_drive_id character varying(255),
    video_url text,
    analysis_status character varying(50) DEFAULT 'pending'::character varying,
    analysis_started_at timestamp without time zone,
    analysis_completed_at timestamp without time zone,
    emotion_analysis jsonb,
    attention_metrics jsonb,
    face_detection jsonb,
    violations_summary jsonb,
    full_report jsonb,
    processing_time_seconds integer,
    frames_processed integer,
    video_duration_seconds integer,
    error_message text,
    retry_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.video_analysis_results OWNER TO postgres;

--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE video_analysis_results; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.video_analysis_results IS 'Stores Python-based video analysis results using FMDv10_2.py (MediaPipe)';


--
-- TOC entry 238 (class 1259 OID 19304)
-- Name: video_analysis_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.video_analysis_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_analysis_results_id_seq OWNER TO postgres;

--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 238
-- Name: video_analysis_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_analysis_results_id_seq OWNED BY public.video_analysis_results.id;


--
-- TOC entry 239 (class 1259 OID 19305)
-- Name: video_interview_candidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_interview_candidates (
    id integer NOT NULL,
    video_assessment_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    location character varying(255),
    current_company character varying(255),
    job_title character varying(255),
    match_score integer,
    candidate_skills jsonb,
    required_skills text,
    experience_level character varying(100),
    salary_expectation character varying(100),
    expires_at timestamp without time zone,
    status character varying(50) DEFAULT 'invited'::character varying,
    interview_started boolean DEFAULT false,
    interview_completed boolean DEFAULT false,
    videos_uploaded boolean DEFAULT false,
    proctoring_flags integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.video_interview_candidates OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 19321)
-- Name: video_interview_candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.video_interview_candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_interview_candidates_id_seq OWNER TO postgres;

--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 240
-- Name: video_interview_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_interview_candidates_id_seq OWNED BY public.video_interview_candidates.id;


--
-- TOC entry 241 (class 1259 OID 19322)
-- Name: video_interview_evaluations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_interview_evaluations (
    id integer NOT NULL,
    video_assessment_id character varying(255) NOT NULL,
    interview_score integer,
    security_score integer,
    final_score integer,
    question_scores jsonb,
    security_violations_count integer DEFAULT 0,
    security_severity character varying(20),
    security_details jsonb,
    strengths text[],
    weaknesses text[],
    overall_feedback text,
    recommendation character varying(20),
    evaluated_by character varying(50) DEFAULT 'AI'::character varying,
    evaluated_at timestamp without time zone DEFAULT now(),
    final_decision character varying(20),
    decision_by character varying(100),
    decision_at timestamp without time zone,
    decision_comment text,
    CONSTRAINT video_interview_evaluations_final_score_check CHECK (((final_score >= 0) AND (final_score <= 100))),
    CONSTRAINT video_interview_evaluations_interview_score_check CHECK (((interview_score >= 0) AND (interview_score <= 100))),
    CONSTRAINT video_interview_evaluations_recommendation_check CHECK (((recommendation)::text = ANY (ARRAY[('hire'::character varying)::text, ('maybe'::character varying)::text, ('reject'::character varying)::text]))),
    CONSTRAINT video_interview_evaluations_security_score_check CHECK (((security_score >= 0) AND (security_score <= 100))),
    CONSTRAINT video_interview_evaluations_security_severity_check CHECK (((security_severity)::text = ANY (ARRAY[('low'::character varying)::text, ('medium'::character varying)::text, ('high'::character varying)::text])))
);


ALTER TABLE public.video_interview_evaluations OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 19337)
-- Name: video_interview_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.video_interview_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_interview_evaluations_id_seq OWNER TO postgres;

--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 242
-- Name: video_interview_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_interview_evaluations_id_seq OWNED BY public.video_interview_evaluations.id;


--
-- TOC entry 243 (class 1259 OID 19338)
-- Name: video_interview_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_interview_questions (
    id integer NOT NULL,
    video_assessment_id character varying(255),
    question_id integer,
    question_text text NOT NULL,
    question_type character varying(50) DEFAULT 'video'::character varying,
    category character varying(100),
    difficulty character varying(50),
    time_limit integer,
    expected_response_type character varying(50) DEFAULT 'video'::character varying,
    evaluation_criteria jsonb,
    key_points jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.video_interview_questions OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 19348)
-- Name: video_interview_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.video_interview_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_interview_questions_id_seq OWNER TO postgres;

--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 244
-- Name: video_interview_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_interview_questions_id_seq OWNED BY public.video_interview_questions.id;


--
-- TOC entry 245 (class 1259 OID 19349)
-- Name: video_interview_responses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_interview_responses (
    id integer NOT NULL,
    video_assessment_id character varying(255),
    candidate_name character varying(255),
    candidate_email character varying(255),
    video_url text,
    video_drive_id character varying(255),
    video_duration integer,
    full_transcript jsonb,
    security_report jsonb,
    uploaded_at timestamp without time zone DEFAULT now(),
    interview_completed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.video_interview_responses OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 19357)
-- Name: video_interview_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.video_interview_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_interview_responses_id_seq OWNER TO postgres;

--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 246
-- Name: video_interview_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_interview_responses_id_seq OWNED BY public.video_interview_responses.id;


--
-- TOC entry 247 (class 1259 OID 19358)
-- Name: video_job_requirements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_job_requirements (
    id integer NOT NULL,
    video_assessment_id character varying(255),
    job_title character varying(255),
    required_skills text,
    optional_skills text,
    experience_level character varying(100),
    salary_budget character varying(100),
    question_count integer,
    total_duration integer,
    time_per_question integer,
    difficulty character varying(50),
    focus_areas jsonb,
    interview_format character varying(100),
    recording_enabled boolean DEFAULT true,
    proctoring_enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.video_job_requirements OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 19367)
-- Name: video_job_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.video_job_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_job_requirements_id_seq OWNER TO postgres;

--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 248
-- Name: video_job_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_job_requirements_id_seq OWNED BY public.video_job_requirements.id;


--
-- TOC entry 4936 (class 2604 OID 19211)
-- Name: assessment_questions_v2 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2 ALTER COLUMN id SET DEFAULT nextval('public.assessment_questions_v2_id_seq'::regclass);


--
-- TOC entry 4954 (class 2604 OID 19212)
-- Name: job_requirements_v2 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2 ALTER COLUMN id SET DEFAULT nextval('public.job_requirements_v2_id_seq'::regclass);


--
-- TOC entry 4958 (class 2604 OID 19368)
-- Name: job_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates ALTER COLUMN id SET DEFAULT nextval('public.job_templates_id_seq'::regclass);


--
-- TOC entry 4965 (class 2604 OID 19214)
-- Name: survey_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions ALTER COLUMN id SET DEFAULT nextval('public.survey_questions_id_seq'::regclass);


--
-- TOC entry 4969 (class 2604 OID 19215)
-- Name: survey_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses ALTER COLUMN id SET DEFAULT nextval('public.survey_responses_id_seq'::regclass);


--
-- TOC entry 4971 (class 2604 OID 19216)
-- Name: survey_validation_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results ALTER COLUMN id SET DEFAULT nextval('public.survey_validation_results_id_seq'::regclass);


--
-- TOC entry 4975 (class 2604 OID 19217)
-- Name: verification_audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log ALTER COLUMN id SET DEFAULT nextval('public.verification_audit_log_id_seq'::regclass);


--
-- TOC entry 4977 (class 2604 OID 19369)
-- Name: video_analysis_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results ALTER COLUMN id SET DEFAULT nextval('public.video_analysis_results_id_seq'::regclass);


--
-- TOC entry 4982 (class 2604 OID 19370)
-- Name: video_interview_candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_candidates ALTER COLUMN id SET DEFAULT nextval('public.video_interview_candidates_id_seq'::regclass);


--
-- TOC entry 4990 (class 2604 OID 19371)
-- Name: video_interview_evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations ALTER COLUMN id SET DEFAULT nextval('public.video_interview_evaluations_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 19372)
-- Name: video_interview_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_questions ALTER COLUMN id SET DEFAULT nextval('public.video_interview_questions_id_seq'::regclass);


--
-- TOC entry 4998 (class 2604 OID 19373)
-- Name: video_interview_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_responses ALTER COLUMN id SET DEFAULT nextval('public.video_interview_responses_id_seq'::regclass);


--
-- TOC entry 5001 (class 2604 OID 19374)
-- Name: video_job_requirements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_job_requirements ALTER COLUMN id SET DEFAULT nextval('public.video_job_requirements_id_seq'::regclass);


--
-- TOC entry 5243 (class 0 OID 19079)
-- Dependencies: 219
-- Data for Name: aadhaar_verification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aadhaar_verification (screening_id, masked_aadhaar, verification_status, attempts_made, verified_at, name_match_score, extracted_name, verification_data, created_at, verification_method, image_quality_score, ocr_confidence, security_flags, ip_address, user_agent) FROM stdin;
\.


--
-- TOC entry 5244 (class 0 OID 19093)
-- Dependencies: 220
-- Data for Name: assessment_questions_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_questions_v2 (id, screening_id, question_id, question_text, options, correct_answer, category, difficulty, explanation, time_limit) FROM stdin;
\.


--
-- TOC entry 5246 (class 0 OID 19104)
-- Dependencies: 222
-- Data for Name: assessment_results_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_results_v2 (screening_id, answers, total_questions, correct_answers, score_percentage, time_spent, started_at, completed_at, violations, is_passed, grade, aadhaar_verified, verification_attempts, verification_data, survey_responses_count, survey_validation_status, survey_completed_at, technical_assessment_unlocked, qualifying_survey_questions_count, informational_survey_questions_count, two_stage_process_completed) FROM stdin;
\.


--
-- TOC entry 5247 (class 0 OID 19121)
-- Dependencies: 223
-- Data for Name: candidates_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidates_v2 (screening_id, name, email, phone, location, current_company, job_title, match_score, required_skills, experience_level, salary_expectation, created_at, expires_at, status, identity_verified, verification_required, verification_attempts, last_verification_attempt, survey_validation_status, survey_completed_at, technical_assessment_unlocked, resume_drive_id, resume_file_name, resume_drive_url, resume_text) FROM stdin;
749bfc64-1440-46f0-9270-32340213f2b8	Rahul Sharma	rahul@example.com	9876543210	Bangalore	\N	\N	\N	\N	\N	\N	2026-03-09 22:35:57.83477	\N	pending	f	t	0	\N	passed	\N	t	\N	\N	\N	\N
\.


--
-- TOC entry 5248 (class 0 OID 19137)
-- Dependencies: 224
-- Data for Name: job_requirements_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_requirements_v2 (id, screening_id, job_title, required_skills, experience_level, salary_budget, question_count, time_limit, difficulty, focus_areas, optional_skills) FROM stdin;
\.


--
-- TOC entry 5250 (class 0 OID 19147)
-- Dependencies: 226
-- Data for Name: job_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_templates (id, template_name, category, description, form_data, usage_count, created_by, created_at, updated_at, is_active) FROM stdin;
1	Data Scientist Template	Data Science	Template for hiring a Data Scientist	{"title": "Data Scientist", "skills": ["Python", "Machine Learning", "SQL"], "experience": "3+ years"}	0	system	2026-03-10 01:55:37.232395	2026-03-10 01:55:37.232395	t
\.


--
-- TOC entry 5252 (class 0 OID 19162)
-- Dependencies: 228
-- Data for Name: survey_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_questions (id, screening_id, question_id, question_text, question_type, options, created_at, expected_answer, is_qualifying, question_category, validation_type) FROM stdin;
1	\N	\N	Are you willing to relocate?	\N	\N	2026-03-09 23:40:35.197781	\N	f	informational	\N
2	\N	\N	How many years of experience do you have?	\N	\N	2026-03-09 23:40:35.197781	\N	f	informational	\N
3	\N	\N	What is your expected salary?	\N	\N	2026-03-09 23:40:35.197781	\N	f	informational	\N
\.


--
-- TOC entry 5254 (class 0 OID 19175)
-- Dependencies: 230
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_responses (id, screening_id, question_id, response_text, created_at) FROM stdin;
1	749bfc64-1440-46f0-9270-32340213f2b8	1	Yes	2026-03-09 23:50:25.796587
2	749bfc64-1440-46f0-9270-32340213f2b8	2	3 years	2026-03-09 23:50:25.805309
3	749bfc64-1440-46f0-9270-32340213f2b8	3	10 LPA	2026-03-09 23:50:25.805933
\.


--
-- TOC entry 5256 (class 0 OID 19183)
-- Dependencies: 232
-- Data for Name: survey_validation_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_validation_results (id, screening_id, validation_status, qualifying_questions_count, correct_answers_count, failed_questions, all_survey_responses, validation_details, validated_at) FROM stdin;
\.


--
-- TOC entry 5258 (class 0 OID 19201)
-- Dependencies: 235
-- Data for Name: verification_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_audit_log (id, screening_id, action_type, action_details, "timestamp", ip_address, user_agent, result) FROM stdin;
\.


--
-- TOC entry 5260 (class 0 OID 19293)
-- Dependencies: 237
-- Data for Name: video_analysis_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_analysis_results (id, video_assessment_id, candidate_name, candidate_email, video_drive_id, video_url, analysis_status, analysis_started_at, analysis_completed_at, emotion_analysis, attention_metrics, face_detection, violations_summary, full_report, processing_time_seconds, frames_processed, video_duration_seconds, error_message, retry_count, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5262 (class 0 OID 19305)
-- Dependencies: 239
-- Data for Name: video_interview_candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_interview_candidates (id, video_assessment_id, name, email, phone, location, current_company, job_title, match_score, candidate_skills, required_skills, experience_level, salary_expectation, expires_at, status, interview_started, interview_completed, videos_uploaded, proctoring_flags, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5264 (class 0 OID 19322)
-- Dependencies: 241
-- Data for Name: video_interview_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_interview_evaluations (id, video_assessment_id, interview_score, security_score, final_score, question_scores, security_violations_count, security_severity, security_details, strengths, weaknesses, overall_feedback, recommendation, evaluated_by, evaluated_at, final_decision, decision_by, decision_at, decision_comment) FROM stdin;
\.


--
-- TOC entry 5266 (class 0 OID 19338)
-- Dependencies: 243
-- Data for Name: video_interview_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_interview_questions (id, video_assessment_id, question_id, question_text, question_type, category, difficulty, time_limit, expected_response_type, evaluation_criteria, key_points, created_at) FROM stdin;
\.


--
-- TOC entry 5268 (class 0 OID 19349)
-- Dependencies: 245
-- Data for Name: video_interview_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_interview_responses (id, video_assessment_id, candidate_name, candidate_email, video_url, video_drive_id, video_duration, full_transcript, security_report, uploaded_at, interview_completed_at) FROM stdin;
\.


--
-- TOC entry 5270 (class 0 OID 19358)
-- Dependencies: 247
-- Data for Name: video_job_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_job_requirements (id, video_assessment_id, job_title, required_skills, optional_skills, experience_level, salary_budget, question_count, total_duration, time_per_question, difficulty, focus_areas, interview_format, recording_enabled, proctoring_enabled, created_at) FROM stdin;
\.


--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 221
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_questions_v2_id_seq', 1, false);


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 225
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_requirements_v2_id_seq', 1, false);


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 227
-- Name: job_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_templates_id_seq', 1, true);


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 229
-- Name: survey_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_questions_id_seq', 3, true);


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 231
-- Name: survey_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_responses_id_seq', 3, true);


--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 233
-- Name: survey_validation_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_validation_results_id_seq', 1, false);


--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 236
-- Name: verification_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.verification_audit_log_id_seq', 1, false);


--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 238
-- Name: video_analysis_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_analysis_results_id_seq', 1, false);


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 240
-- Name: video_interview_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_interview_candidates_id_seq', 1, false);


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 242
-- Name: video_interview_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_interview_evaluations_id_seq', 1, false);


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 244
-- Name: video_interview_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_interview_questions_id_seq', 1, false);


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 246
-- Name: video_interview_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_interview_responses_id_seq', 1, false);


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 248
-- Name: video_job_requirements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_job_requirements_id_seq', 1, false);


--
-- TOC entry 5019 (class 2606 OID 19219)
-- Name: aadhaar_verification aadhaar_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aadhaar_verification
    ADD CONSTRAINT aadhaar_verification_pkey PRIMARY KEY (screening_id);


--
-- TOC entry 5023 (class 2606 OID 19221)
-- Name: assessment_questions_v2 assessment_questions_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2
    ADD CONSTRAINT assessment_questions_v2_pkey PRIMARY KEY (id);


--
-- TOC entry 5025 (class 2606 OID 19223)
-- Name: assessment_results_v2 assessment_results_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_results_v2
    ADD CONSTRAINT assessment_results_v2_pkey PRIMARY KEY (screening_id);


--
-- TOC entry 5027 (class 2606 OID 19225)
-- Name: candidates_v2 candidates_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates_v2
    ADD CONSTRAINT candidates_v2_pkey PRIMARY KEY (screening_id);


--
-- TOC entry 5033 (class 2606 OID 19227)
-- Name: job_requirements_v2 job_requirements_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2
    ADD CONSTRAINT job_requirements_v2_pkey PRIMARY KEY (id);


--
-- TOC entry 5038 (class 2606 OID 19229)
-- Name: job_templates job_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 5040 (class 2606 OID 19231)
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 19233)
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 5047 (class 2606 OID 19235)
-- Name: survey_validation_results survey_validation_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results
    ADD CONSTRAINT survey_validation_results_pkey PRIMARY KEY (id);


--
-- TOC entry 5070 (class 2606 OID 19376)
-- Name: video_interview_evaluations unique_evaluation; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT unique_evaluation UNIQUE (video_assessment_id);


--
-- TOC entry 5051 (class 2606 OID 19237)
-- Name: verification_audit_log verification_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log
    ADD CONSTRAINT verification_audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5056 (class 2606 OID 19378)
-- Name: video_analysis_results video_analysis_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT video_analysis_results_pkey PRIMARY KEY (id);


--
-- TOC entry 5058 (class 2606 OID 19380)
-- Name: video_analysis_results video_analysis_results_video_assessment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT video_analysis_results_video_assessment_id_key UNIQUE (video_assessment_id);


--
-- TOC entry 5063 (class 2606 OID 19382)
-- Name: video_interview_candidates video_interview_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_candidates
    ADD CONSTRAINT video_interview_candidates_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 19384)
-- Name: video_interview_candidates video_interview_candidates_video_assessment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_candidates
    ADD CONSTRAINT video_interview_candidates_video_assessment_id_key UNIQUE (video_assessment_id);


--
-- TOC entry 5072 (class 2606 OID 19386)
-- Name: video_interview_evaluations video_interview_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT video_interview_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 5074 (class 2606 OID 19388)
-- Name: video_interview_questions video_interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_questions
    ADD CONSTRAINT video_interview_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 5077 (class 2606 OID 19390)
-- Name: video_interview_responses video_interview_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_responses
    ADD CONSTRAINT video_interview_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 5079 (class 2606 OID 19392)
-- Name: video_job_requirements video_job_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_job_requirements
    ADD CONSTRAINT video_job_requirements_pkey PRIMARY KEY (id);


--
-- TOC entry 5020 (class 1259 OID 19238)
-- Name: idx_aadhaar_verification_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aadhaar_verification_created ON public.aadhaar_verification USING btree (created_at);


--
-- TOC entry 5021 (class 1259 OID 19239)
-- Name: idx_aadhaar_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aadhaar_verification_status ON public.aadhaar_verification USING btree (verification_status);


--
-- TOC entry 5028 (class 1259 OID 19240)
-- Name: idx_candidates_v2_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_email ON public.candidates_v2 USING btree (email);


--
-- TOC entry 5029 (class 1259 OID 19241)
-- Name: idx_candidates_v2_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_status ON public.candidates_v2 USING btree (status);


--
-- TOC entry 5030 (class 1259 OID 19242)
-- Name: idx_candidates_v2_survey_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_survey_status ON public.candidates_v2 USING btree (survey_validation_status);


--
-- TOC entry 5031 (class 1259 OID 19243)
-- Name: idx_candidates_v2_verification; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_verification ON public.candidates_v2 USING btree (identity_verified);


--
-- TOC entry 5066 (class 1259 OID 19393)
-- Name: idx_evaluated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluated_at ON public.video_interview_evaluations USING btree (evaluated_at);


--
-- TOC entry 5067 (class 1259 OID 19394)
-- Name: idx_evaluation_assessment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluation_assessment ON public.video_interview_evaluations USING btree (video_assessment_id);


--
-- TOC entry 5034 (class 1259 OID 19244)
-- Name: idx_job_templates_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_templates_active ON public.job_templates USING btree (is_active);


--
-- TOC entry 5035 (class 1259 OID 19245)
-- Name: idx_job_templates_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_templates_category ON public.job_templates USING btree (category);


--
-- TOC entry 5036 (class 1259 OID 19246)
-- Name: idx_job_templates_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_job_templates_created ON public.job_templates USING btree (created_at DESC);


--
-- TOC entry 5068 (class 1259 OID 19395)
-- Name: idx_recommendation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendation ON public.video_interview_evaluations USING btree (recommendation);


--
-- TOC entry 5043 (class 1259 OID 19247)
-- Name: idx_survey_validation_screening; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_screening ON public.survey_validation_results USING btree (screening_id);


--
-- TOC entry 5044 (class 1259 OID 19248)
-- Name: idx_survey_validation_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_status ON public.survey_validation_results USING btree (validation_status);


--
-- TOC entry 5045 (class 1259 OID 19249)
-- Name: idx_survey_validation_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_timestamp ON public.survey_validation_results USING btree (validated_at);


--
-- TOC entry 5048 (class 1259 OID 19250)
-- Name: idx_verification_audit_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verification_audit_action ON public.verification_audit_log USING btree (action_type);


--
-- TOC entry 5049 (class 1259 OID 19251)
-- Name: idx_verification_audit_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verification_audit_timestamp ON public.verification_audit_log USING btree ("timestamp");


--
-- TOC entry 5052 (class 1259 OID 19396)
-- Name: idx_video_analysis_assessment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_analysis_assessment_id ON public.video_analysis_results USING btree (video_assessment_id);


--
-- TOC entry 5053 (class 1259 OID 19397)
-- Name: idx_video_analysis_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_analysis_created_at ON public.video_analysis_results USING btree (created_at);


--
-- TOC entry 5054 (class 1259 OID 19398)
-- Name: idx_video_analysis_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_analysis_status ON public.video_analysis_results USING btree (analysis_status);


--
-- TOC entry 5059 (class 1259 OID 19399)
-- Name: idx_video_assessment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_assessment_id ON public.video_interview_candidates USING btree (video_assessment_id);


--
-- TOC entry 5060 (class 1259 OID 19400)
-- Name: idx_video_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_email ON public.video_interview_candidates USING btree (email);


--
-- TOC entry 5075 (class 1259 OID 19401)
-- Name: idx_video_response_assessment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_response_assessment_id ON public.video_interview_responses USING btree (video_assessment_id);


--
-- TOC entry 5061 (class 1259 OID 19402)
-- Name: idx_video_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_status ON public.video_interview_candidates USING btree (status);


--
-- TOC entry 5093 (class 2620 OID 19252)
-- Name: job_templates update_job_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_job_templates_updated_at BEFORE UPDATE ON public.job_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5094 (class 2620 OID 19403)
-- Name: video_analysis_results update_video_analysis_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_video_analysis_updated_at BEFORE UPDATE ON public.video_analysis_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5080 (class 2606 OID 19253)
-- Name: aadhaar_verification aadhaar_verification_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aadhaar_verification
    ADD CONSTRAINT aadhaar_verification_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 5081 (class 2606 OID 19258)
-- Name: assessment_questions_v2 assessment_questions_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2
    ADD CONSTRAINT assessment_questions_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 5082 (class 2606 OID 19263)
-- Name: assessment_results_v2 assessment_results_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_results_v2
    ADD CONSTRAINT assessment_results_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 5088 (class 2606 OID 19409)
-- Name: video_analysis_results fk_video_assessment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT fk_video_assessment FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- TOC entry 5089 (class 2606 OID 19404)
-- Name: video_interview_evaluations fk_video_assessment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT fk_video_assessment FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- TOC entry 5083 (class 2606 OID 19268)
-- Name: job_requirements_v2 job_requirements_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2
    ADD CONSTRAINT job_requirements_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 5084 (class 2606 OID 19273)
-- Name: survey_questions survey_questions_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 5085 (class 2606 OID 19278)
-- Name: survey_responses survey_responses_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 5086 (class 2606 OID 19283)
-- Name: survey_validation_results survey_validation_results_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results
    ADD CONSTRAINT survey_validation_results_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 5087 (class 2606 OID 19288)
-- Name: verification_audit_log verification_audit_log_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log
    ADD CONSTRAINT verification_audit_log_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 5090 (class 2606 OID 19414)
-- Name: video_interview_questions video_interview_questions_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_questions
    ADD CONSTRAINT video_interview_questions_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


--
-- TOC entry 5091 (class 2606 OID 19419)
-- Name: video_interview_responses video_interview_responses_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_responses
    ADD CONSTRAINT video_interview_responses_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


--
-- TOC entry 5092 (class 2606 OID 19424)
-- Name: video_job_requirements video_job_requirements_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_job_requirements
    ADD CONSTRAINT video_job_requirements_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


-- Completed on 2026-03-10 11:44:35

--
-- PostgreSQL database dump complete
--

\unrestrict XFeBdZiHFyozBneVF9ByOAuBZr06oq558MfQavxtsdZNu0U1UKN07E7QrRUvsfp

