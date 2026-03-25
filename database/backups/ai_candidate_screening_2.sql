--
-- PostgreSQL database dump
--

\restrict Ye6ayxFam52NV4aBX7QubRpsa4dYexwEzrw3Bqk3r4zLfUuLwfxLblzD4JKr6NK

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg13+1)
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-24 13:45:31

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
-- TOC entry 2 (class 3079 OID 16385)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3702 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 258 (class 1255 OID 17793)
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
-- TOC entry 230 (class 1259 OID 16534)
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
    verification_method character varying(50) DEFAULT 'ocr_tesseract'::character varying,
    image_quality_score integer,
    ocr_confidence integer,
    security_flags jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_attempts_range CHECK (((attempts_made >= 0) AND (attempts_made <= 10))),
    CONSTRAINT check_name_match_score CHECK (((name_match_score >= 0.0) AND (name_match_score <= 1.0))),
    CONSTRAINT check_verification_status CHECK (((verification_status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'failed'::character varying, 'locked'::character varying])::text[])))
);


ALTER TABLE public.aadhaar_verification OWNER TO postgres;

--
-- TOC entry 3703 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE aadhaar_verification; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.aadhaar_verification IS 'Aadhaar card verification data and audit trail';


--
-- TOC entry 3704 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN aadhaar_verification.masked_aadhaar; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.masked_aadhaar IS 'Last 4 digits of Aadhaar number (XXXX-XXXX-1234)';


--
-- TOC entry 3705 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN aadhaar_verification.name_match_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.name_match_score IS 'Similarity score between extracted name and candidate name (0.0 to 1.0)';


--
-- TOC entry 3706 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN aadhaar_verification.verification_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.aadhaar_verification.verification_data IS 'Complete OCR extraction data and metadata';


--
-- TOC entry 228 (class 1259 OID 16498)
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
-- TOC entry 227 (class 1259 OID 16497)
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
-- TOC entry 3707 (class 0 OID 0)
-- Dependencies: 227
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assessment_questions_v2_id_seq OWNED BY public.assessment_questions_v2.id;


--
-- TOC entry 229 (class 1259 OID 16512)
-- Name: assessment_results_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_results_v2 (
    screening_id character varying(50) NOT NULL,
    answers jsonb NOT NULL,
    total_questions integer,
    correct_answers integer,
    score_percentage integer,
    time_spent integer,
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
    started_at timestamp without time zone,
    completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_survey_validation_status_results CHECK (((survey_validation_status)::text = ANY ((ARRAY['pending'::character varying, 'passed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.assessment_results_v2 OWNER TO postgres;

--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN assessment_results_v2.survey_responses_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_responses_count IS 'Total number of survey questions answered';


--
-- TOC entry 3709 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN assessment_results_v2.survey_validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_validation_status IS 'Status of preference screening validation';


--
-- TOC entry 3710 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN assessment_results_v2.survey_completed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.survey_completed_at IS 'When the survey/preference screening was completed';


--
-- TOC entry 3711 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN assessment_results_v2.technical_assessment_unlocked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.technical_assessment_unlocked IS 'Whether technical assessment was unlocked after survey validation';


--
-- TOC entry 3712 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN assessment_results_v2.qualifying_survey_questions_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.qualifying_survey_questions_count IS 'Number of qualifying survey questions';


--
-- TOC entry 3713 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN assessment_results_v2.informational_survey_questions_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.informational_survey_questions_count IS 'Number of informational survey questions';


--
-- TOC entry 3714 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN assessment_results_v2.two_stage_process_completed; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.assessment_results_v2.two_stage_process_completed IS 'Whether both survey and technical stages were completed';


--
-- TOC entry 218 (class 1259 OID 16396)
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
    template_key character varying(100),
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    CONSTRAINT check_survey_validation_status CHECK (((survey_validation_status)::text = ANY ((ARRAY['pending'::character varying, 'passed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.candidates_v2 OWNER TO postgres;

--
-- TOC entry 3715 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE candidates_v2; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.candidates_v2 IS 'Candidate information with identity verification support';


--
-- TOC entry 3716 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN candidates_v2.survey_validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.survey_validation_status IS 'Status of preference screening: pending, passed, failed';


--
-- TOC entry 3717 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN candidates_v2.survey_completed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.survey_completed_at IS 'Timestamp when survey was completed and validated';


--
-- TOC entry 3718 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN candidates_v2.technical_assessment_unlocked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.candidates_v2.technical_assessment_unlocked IS 'TRUE if candidate passed preference screening and can access technical questions';


--
-- TOC entry 220 (class 1259 OID 16429)
-- Name: job_requirements_v2; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_requirements_v2 (
    id integer NOT NULL,
    screening_id character varying(50),
    job_title character varying(100),
    required_skills text,
    optional_skills text,
    experience_level character varying(50),
    salary_budget character varying(50),
    question_count integer DEFAULT 20,
    time_limit character varying(20) DEFAULT '30 minutes'::character varying,
    difficulty character varying(20) DEFAULT 'intermediate'::character varying,
    focus_areas jsonb
);


ALTER TABLE public.job_requirements_v2 OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16428)
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
-- TOC entry 3719 (class 0 OID 0)
-- Dependencies: 219
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_requirements_v2_id_seq OWNED BY public.job_requirements_v2.id;


--
-- TOC entry 247 (class 1259 OID 17838)
-- Name: job_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_templates (
    id integer NOT NULL,
    template_key text NOT NULL,
    job_title text NOT NULL,
    job_description text,
    required_skills text,
    number_of_candidates text,
    survey_question_1 text,
    survey_q1_expected_answer text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_templates OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 17837)
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
-- TOC entry 3720 (class 0 OID 0)
-- Dependencies: 246
-- Name: job_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_templates_id_seq OWNED BY public.job_templates.id;


--
-- TOC entry 222 (class 1259 OID 16446)
-- Name: survey_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.survey_questions (
    id integer NOT NULL,
    screening_id character varying(50),
    question_id integer,
    question_text text NOT NULL,
    question_type character varying(20),
    options jsonb,
    expected_answer character varying(100),
    is_qualifying boolean DEFAULT false,
    question_category character varying(20) DEFAULT 'informational'::character varying,
    validation_type character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_question_category CHECK (((question_category)::text = ANY ((ARRAY['qualifying'::character varying, 'informational'::character varying])::text[]))),
    CONSTRAINT check_validation_type CHECK ((((validation_type)::text = ANY ((ARRAY['exact_match'::character varying, 'none'::character varying])::text[])) OR (validation_type IS NULL)))
);


ALTER TABLE public.survey_questions OWNER TO postgres;

--
-- TOC entry 3721 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN survey_questions.expected_answer; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.expected_answer IS 'Expected answer for qualifying questions (Yes/No or specific multiple choice option)';


--
-- TOC entry 3722 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN survey_questions.is_qualifying; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.is_qualifying IS 'TRUE if this question requires validation to proceed to technical assessment';


--
-- TOC entry 3723 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN survey_questions.question_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.question_category IS 'Category: qualifying or informational';


--
-- TOC entry 3724 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN survey_questions.validation_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_questions.validation_type IS 'Type of validation: exact_match for Yes/No and Multiple Choice';


--
-- TOC entry 221 (class 1259 OID 16445)
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
-- TOC entry 3725 (class 0 OID 0)
-- Dependencies: 221
-- Name: survey_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_questions_id_seq OWNED BY public.survey_questions.id;


--
-- TOC entry 224 (class 1259 OID 16465)
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
-- TOC entry 223 (class 1259 OID 16464)
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
-- TOC entry 3726 (class 0 OID 0)
-- Dependencies: 223
-- Name: survey_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_responses_id_seq OWNED BY public.survey_responses.id;


--
-- TOC entry 226 (class 1259 OID 16480)
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
    CONSTRAINT check_validation_status CHECK (((validation_status)::text = ANY ((ARRAY['passed'::character varying, 'failed'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.survey_validation_results OWNER TO postgres;

--
-- TOC entry 3727 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE survey_validation_results; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.survey_validation_results IS 'Results of preference/survey question validation before technical assessment';


--
-- TOC entry 3728 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN survey_validation_results.validation_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.validation_status IS 'Status: passed, failed, or pending';


--
-- TOC entry 3729 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN survey_validation_results.failed_questions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.failed_questions IS 'Array of failed question details with expected vs actual answers';


--
-- TOC entry 3730 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN survey_validation_results.all_survey_responses; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.all_survey_responses IS 'Complete survey response data for reference';


--
-- TOC entry 3731 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN survey_validation_results.validation_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.survey_validation_results.validation_details IS 'Detailed validation metadata and scoring breakdown';


--
-- TOC entry 225 (class 1259 OID 16479)
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
-- TOC entry 3732 (class 0 OID 0)
-- Dependencies: 225
-- Name: survey_validation_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.survey_validation_results_id_seq OWNED BY public.survey_validation_results.id;


--
-- TOC entry 245 (class 1259 OID 17794)
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
-- TOC entry 3733 (class 0 OID 0)
-- Dependencies: 245
-- Name: VIEW survey_validation_summary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.survey_validation_summary IS 'Combined view of candidate survey validation status and results';


--
-- TOC entry 232 (class 1259 OID 16551)
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
-- TOC entry 3734 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE verification_audit_log; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.verification_audit_log IS 'Complete audit log for all verification activities';


--
-- TOC entry 231 (class 1259 OID 16550)
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
-- TOC entry 3735 (class 0 OID 0)
-- Dependencies: 231
-- Name: verification_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.verification_audit_log_id_seq OWNED BY public.verification_audit_log.id;


--
-- TOC entry 244 (class 1259 OID 16656)
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
-- TOC entry 3736 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE video_analysis_results; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.video_analysis_results IS 'Stores Python-based video analysis results using FMDv10_2.py (MediaPipe)';


--
-- TOC entry 243 (class 1259 OID 16655)
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
-- TOC entry 3737 (class 0 OID 0)
-- Dependencies: 243
-- Name: video_analysis_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_analysis_results_id_seq OWNED BY public.video_analysis_results.id;


--
-- TOC entry 234 (class 1259 OID 16566)
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
    status character varying(50) DEFAULT 'invited'::character varying,
    interview_started boolean DEFAULT false,
    interview_completed boolean DEFAULT false,
    videos_uploaded boolean DEFAULT false,
    proctoring_flags integer DEFAULT 0,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.video_interview_candidates OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16565)
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
-- TOC entry 3738 (class 0 OID 0)
-- Dependencies: 233
-- Name: video_interview_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_interview_candidates_id_seq OWNED BY public.video_interview_candidates.id;


--
-- TOC entry 240 (class 1259 OID 16617)
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
    CONSTRAINT video_interview_evaluations_recommendation_check CHECK (((recommendation)::text = ANY ((ARRAY['hire'::character varying, 'maybe'::character varying, 'reject'::character varying])::text[]))),
    CONSTRAINT video_interview_evaluations_security_score_check CHECK (((security_score >= 0) AND (security_score <= 100))),
    CONSTRAINT video_interview_evaluations_security_severity_check CHECK (((security_severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[])))
);


ALTER TABLE public.video_interview_evaluations OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16616)
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
-- TOC entry 3739 (class 0 OID 0)
-- Dependencies: 239
-- Name: video_interview_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_interview_evaluations_id_seq OWNED BY public.video_interview_evaluations.id;


--
-- TOC entry 236 (class 1259 OID 16584)
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
-- TOC entry 235 (class 1259 OID 16583)
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
-- TOC entry 3740 (class 0 OID 0)
-- Dependencies: 235
-- Name: video_interview_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_interview_questions_id_seq OWNED BY public.video_interview_questions.id;


--
-- TOC entry 238 (class 1259 OID 16601)
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
-- TOC entry 237 (class 1259 OID 16600)
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
-- TOC entry 3741 (class 0 OID 0)
-- Dependencies: 237
-- Name: video_interview_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_interview_responses_id_seq OWNED BY public.video_interview_responses.id;


--
-- TOC entry 242 (class 1259 OID 16639)
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
-- TOC entry 241 (class 1259 OID 16638)
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
-- TOC entry 3742 (class 0 OID 0)
-- Dependencies: 241
-- Name: video_job_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.video_job_requirements_id_seq OWNED BY public.video_job_requirements.id;


--
-- TOC entry 3383 (class 2604 OID 17799)
-- Name: assessment_questions_v2 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2 ALTER COLUMN id SET DEFAULT nextval('public.assessment_questions_v2_id_seq'::regclass);


--
-- TOC entry 3369 (class 2604 OID 17800)
-- Name: job_requirements_v2 id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2 ALTER COLUMN id SET DEFAULT nextval('public.job_requirements_v2_id_seq'::regclass);


--
-- TOC entry 3427 (class 2604 OID 17841)
-- Name: job_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates ALTER COLUMN id SET DEFAULT nextval('public.job_templates_id_seq'::regclass);


--
-- TOC entry 3373 (class 2604 OID 17802)
-- Name: survey_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions ALTER COLUMN id SET DEFAULT nextval('public.survey_questions_id_seq'::regclass);


--
-- TOC entry 3377 (class 2604 OID 17803)
-- Name: survey_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses ALTER COLUMN id SET DEFAULT nextval('public.survey_responses_id_seq'::regclass);


--
-- TOC entry 3379 (class 2604 OID 17804)
-- Name: survey_validation_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results ALTER COLUMN id SET DEFAULT nextval('public.survey_validation_results_id_seq'::regclass);


--
-- TOC entry 3397 (class 2604 OID 17805)
-- Name: verification_audit_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log ALTER COLUMN id SET DEFAULT nextval('public.verification_audit_log_id_seq'::regclass);


--
-- TOC entry 3422 (class 2604 OID 17806)
-- Name: video_analysis_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results ALTER COLUMN id SET DEFAULT nextval('public.video_analysis_results_id_seq'::regclass);


--
-- TOC entry 3399 (class 2604 OID 17807)
-- Name: video_interview_candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_candidates ALTER COLUMN id SET DEFAULT nextval('public.video_interview_candidates_id_seq'::regclass);


--
-- TOC entry 3414 (class 2604 OID 17808)
-- Name: video_interview_evaluations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations ALTER COLUMN id SET DEFAULT nextval('public.video_interview_evaluations_id_seq'::regclass);


--
-- TOC entry 3407 (class 2604 OID 17809)
-- Name: video_interview_questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_questions ALTER COLUMN id SET DEFAULT nextval('public.video_interview_questions_id_seq'::regclass);


--
-- TOC entry 3411 (class 2604 OID 17810)
-- Name: video_interview_responses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_responses ALTER COLUMN id SET DEFAULT nextval('public.video_interview_responses_id_seq'::regclass);


--
-- TOC entry 3418 (class 2604 OID 17811)
-- Name: video_job_requirements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_job_requirements ALTER COLUMN id SET DEFAULT nextval('public.video_job_requirements_id_seq'::regclass);


--
-- TOC entry 3680 (class 0 OID 16534)
-- Dependencies: 230
-- Data for Name: aadhaar_verification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aadhaar_verification (screening_id, masked_aadhaar, verification_status, attempts_made, verified_at, name_match_score, extracted_name, verification_data, verification_method, image_quality_score, ocr_confidence, security_flags, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- TOC entry 3678 (class 0 OID 16498)
-- Dependencies: 228
-- Data for Name: assessment_questions_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_questions_v2 (id, screening_id, question_id, question_text, options, correct_answer, category, difficulty, explanation, time_limit) FROM stdin;
\.


--
-- TOC entry 3679 (class 0 OID 16512)
-- Dependencies: 229
-- Data for Name: assessment_results_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_results_v2 (screening_id, answers, total_questions, correct_answers, score_percentage, time_spent, violations, is_passed, grade, aadhaar_verified, verification_attempts, verification_data, survey_responses_count, survey_validation_status, survey_completed_at, technical_assessment_unlocked, qualifying_survey_questions_count, informational_survey_questions_count, two_stage_process_completed, started_at, completed_at) FROM stdin;
\.


--
-- TOC entry 3668 (class 0 OID 16396)
-- Dependencies: 218
-- Data for Name: candidates_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidates_v2 (screening_id, name, email, phone, location, current_company, job_title, match_score, required_skills, experience_level, salary_expectation, template_key, status, identity_verified, verification_required, verification_attempts, last_verification_attempt, survey_validation_status, survey_completed_at, technical_assessment_unlocked, resume_drive_id, resume_file_name, resume_drive_url, resume_text, created_at, expires_at) FROM stdin;
749bfc64-1440-46f0-9270-32340213f2b8	Rahul Sharma	rahul@example.com	9876543210	Bangalore	\N	\N	\N	\N	\N	\N	\N	pending	f	t	0	\N	passed	\N	t	\N	\N	\N	\N	2026-03-09 22:35:57.83477	\N
\.


--
-- TOC entry 3670 (class 0 OID 16429)
-- Dependencies: 220
-- Data for Name: job_requirements_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_requirements_v2 (id, screening_id, job_title, required_skills, optional_skills, experience_level, salary_budget, question_count, time_limit, difficulty, focus_areas) FROM stdin;
\.


--
-- TOC entry 3696 (class 0 OID 17838)
-- Dependencies: 247
-- Data for Name: job_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_templates (id, template_key, job_title, job_description, required_skills, number_of_candidates, survey_question_1, survey_q1_expected_answer, created_at, updated_at) FROM stdin;
1	Template_1	Data Scientist	Data Scientist	Python	2	Are you willing to relocate?	Yes	2025-12-24 08:02:40.725636	2025-12-24 08:02:40.725636
2	Template_2	Data Scientist	Data Scientist	Python, N8N	2	Are you willing to relocate?	Yes	2025-12-24 08:02:40.725636	2025-12-24 08:02:40.725636
\.


--
-- TOC entry 3672 (class 0 OID 16446)
-- Dependencies: 222
-- Data for Name: survey_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_questions (id, screening_id, question_id, question_text, question_type, options, expected_answer, is_qualifying, question_category, validation_type, created_at) FROM stdin;
1	\N	\N	Are you willing to relocate?	text	\N	\N	t	qualifying	exact_match	2026-03-11 13:02:41.816747
2	\N	\N	How many years of experience do you have?	text	\N	\N	t	qualifying	none	2026-03-11 13:02:41.816747
3	\N	\N	What is your notice period?	text	\N	\N	f	informational	none	2026-03-11 13:02:41.816747
4	\N	\N	Are you open to contract roles?	text	\N	\N	f	informational	none	2026-03-11 13:02:41.816747
\.


--
-- TOC entry 3674 (class 0 OID 16465)
-- Dependencies: 224
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_responses (id, screening_id, question_id, response_text, created_at) FROM stdin;
1	749bfc64-1440-46f0-9270-32340213f2b8	1	Yes	2026-03-09 23:50:25.796587
2	749bfc64-1440-46f0-9270-32340213f2b8	2	3 years	2026-03-09 23:50:25.805309
3	749bfc64-1440-46f0-9270-32340213f2b8	3	10 LPA	2026-03-09 23:50:25.805933
\.


--
-- TOC entry 3676 (class 0 OID 16480)
-- Dependencies: 226
-- Data for Name: survey_validation_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.survey_validation_results (id, screening_id, validation_status, qualifying_questions_count, correct_answers_count, failed_questions, all_survey_responses, validation_details, validated_at) FROM stdin;
\.


--
-- TOC entry 3682 (class 0 OID 16551)
-- Dependencies: 232
-- Data for Name: verification_audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_audit_log (id, screening_id, action_type, action_details, "timestamp", ip_address, user_agent, result) FROM stdin;
\.


--
-- TOC entry 3694 (class 0 OID 16656)
-- Dependencies: 244
-- Data for Name: video_analysis_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_analysis_results (id, video_assessment_id, candidate_name, candidate_email, video_drive_id, video_url, analysis_status, analysis_started_at, analysis_completed_at, emotion_analysis, attention_metrics, face_detection, violations_summary, full_report, processing_time_seconds, frames_processed, video_duration_seconds, error_message, retry_count, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3684 (class 0 OID 16566)
-- Dependencies: 234
-- Data for Name: video_interview_candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_interview_candidates (id, video_assessment_id, name, email, phone, location, current_company, job_title, match_score, candidate_skills, required_skills, experience_level, salary_expectation, status, interview_started, interview_completed, videos_uploaded, proctoring_flags, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3690 (class 0 OID 16617)
-- Dependencies: 240
-- Data for Name: video_interview_evaluations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_interview_evaluations (id, video_assessment_id, interview_score, security_score, final_score, question_scores, security_violations_count, security_severity, security_details, strengths, weaknesses, overall_feedback, recommendation, evaluated_by, evaluated_at, final_decision, decision_by, decision_at, decision_comment) FROM stdin;
\.


--
-- TOC entry 3686 (class 0 OID 16584)
-- Dependencies: 236
-- Data for Name: video_interview_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_interview_questions (id, video_assessment_id, question_id, question_text, question_type, category, difficulty, time_limit, expected_response_type, evaluation_criteria, key_points, created_at) FROM stdin;
\.


--
-- TOC entry 3688 (class 0 OID 16601)
-- Dependencies: 238
-- Data for Name: video_interview_responses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_interview_responses (id, video_assessment_id, candidate_name, candidate_email, video_url, video_drive_id, video_duration, full_transcript, security_report, uploaded_at, interview_completed_at) FROM stdin;
\.


--
-- TOC entry 3692 (class 0 OID 16639)
-- Dependencies: 242
-- Data for Name: video_job_requirements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_job_requirements (id, video_assessment_id, job_title, required_skills, optional_skills, experience_level, salary_budget, question_count, total_duration, time_per_question, difficulty, focus_areas, interview_format, recording_enabled, proctoring_enabled, created_at) FROM stdin;
\.


--
-- TOC entry 3743 (class 0 OID 0)
-- Dependencies: 227
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assessment_questions_v2_id_seq', 1, false);


--
-- TOC entry 3744 (class 0 OID 0)
-- Dependencies: 219
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_requirements_v2_id_seq', 1, false);


--
-- TOC entry 3745 (class 0 OID 0)
-- Dependencies: 246
-- Name: job_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_templates_id_seq', 2, true);


--
-- TOC entry 3746 (class 0 OID 0)
-- Dependencies: 221
-- Name: survey_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_questions_id_seq', 3, true);


--
-- TOC entry 3747 (class 0 OID 0)
-- Dependencies: 223
-- Name: survey_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_responses_id_seq', 3, true);


--
-- TOC entry 3748 (class 0 OID 0)
-- Dependencies: 225
-- Name: survey_validation_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.survey_validation_results_id_seq', 1, false);


--
-- TOC entry 3749 (class 0 OID 0)
-- Dependencies: 231
-- Name: verification_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.verification_audit_log_id_seq', 1, false);


--
-- TOC entry 3750 (class 0 OID 0)
-- Dependencies: 243
-- Name: video_analysis_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_analysis_results_id_seq', 1, false);


--
-- TOC entry 3751 (class 0 OID 0)
-- Dependencies: 233
-- Name: video_interview_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_interview_candidates_id_seq', 1, false);


--
-- TOC entry 3752 (class 0 OID 0)
-- Dependencies: 239
-- Name: video_interview_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_interview_evaluations_id_seq', 1, false);


--
-- TOC entry 3753 (class 0 OID 0)
-- Dependencies: 235
-- Name: video_interview_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_interview_questions_id_seq', 1, false);


--
-- TOC entry 3754 (class 0 OID 0)
-- Dependencies: 237
-- Name: video_interview_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_interview_responses_id_seq', 1, false);


--
-- TOC entry 3755 (class 0 OID 0)
-- Dependencies: 241
-- Name: video_job_requirements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.video_job_requirements_id_seq', 1, false);


--
-- TOC entry 3466 (class 2606 OID 17813)
-- Name: aadhaar_verification aadhaar_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aadhaar_verification
    ADD CONSTRAINT aadhaar_verification_pkey PRIMARY KEY (screening_id);


--
-- TOC entry 3462 (class 2606 OID 16506)
-- Name: assessment_questions_v2 assessment_questions_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2
    ADD CONSTRAINT assessment_questions_v2_pkey PRIMARY KEY (id);


--
-- TOC entry 3464 (class 2606 OID 16528)
-- Name: assessment_results_v2 assessment_results_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_results_v2
    ADD CONSTRAINT assessment_results_v2_pkey PRIMARY KEY (screening_id);


--
-- TOC entry 3444 (class 2606 OID 16410)
-- Name: candidates_v2 candidates_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates_v2
    ADD CONSTRAINT candidates_v2_pkey PRIMARY KEY (screening_id);


--
-- TOC entry 3451 (class 2606 OID 16439)
-- Name: job_requirements_v2 job_requirements_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2
    ADD CONSTRAINT job_requirements_v2_pkey PRIMARY KEY (id);


--
-- TOC entry 3502 (class 2606 OID 17847)
-- Name: job_templates job_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 3504 (class 2606 OID 17849)
-- Name: job_templates job_templates_template_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_template_key_key UNIQUE (template_key);


--
-- TOC entry 3453 (class 2606 OID 16458)
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3455 (class 2606 OID 16473)
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 3460 (class 2606 OID 16491)
-- Name: survey_validation_results survey_validation_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results
    ADD CONSTRAINT survey_validation_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3489 (class 2606 OID 17815)
-- Name: video_interview_evaluations unique_evaluation; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT unique_evaluation UNIQUE (video_assessment_id);


--
-- TOC entry 3472 (class 2606 OID 16559)
-- Name: verification_audit_log verification_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log
    ADD CONSTRAINT verification_audit_log_pkey PRIMARY KEY (id);


--
-- TOC entry 3498 (class 2606 OID 16667)
-- Name: video_analysis_results video_analysis_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT video_analysis_results_pkey PRIMARY KEY (id);


--
-- TOC entry 3500 (class 2606 OID 17817)
-- Name: video_analysis_results video_analysis_results_video_assessment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT video_analysis_results_video_assessment_id_key UNIQUE (video_assessment_id);


--
-- TOC entry 3477 (class 2606 OID 16580)
-- Name: video_interview_candidates video_interview_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_candidates
    ADD CONSTRAINT video_interview_candidates_pkey PRIMARY KEY (id);


--
-- TOC entry 3479 (class 2606 OID 16582)
-- Name: video_interview_candidates video_interview_candidates_video_assessment_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_candidates
    ADD CONSTRAINT video_interview_candidates_video_assessment_id_key UNIQUE (video_assessment_id);


--
-- TOC entry 3491 (class 2606 OID 16632)
-- Name: video_interview_evaluations video_interview_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT video_interview_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 3481 (class 2606 OID 16594)
-- Name: video_interview_questions video_interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_questions
    ADD CONSTRAINT video_interview_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3484 (class 2606 OID 16610)
-- Name: video_interview_responses video_interview_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_responses
    ADD CONSTRAINT video_interview_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 3493 (class 2606 OID 16649)
-- Name: video_job_requirements video_job_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_job_requirements
    ADD CONSTRAINT video_job_requirements_pkey PRIMARY KEY (id);


--
-- TOC entry 3467 (class 1259 OID 16685)
-- Name: idx_aadhaar_verification_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aadhaar_verification_created ON public.aadhaar_verification USING btree (created_at);


--
-- TOC entry 3468 (class 1259 OID 16684)
-- Name: idx_aadhaar_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aadhaar_verification_status ON public.aadhaar_verification USING btree (verification_status);


--
-- TOC entry 3445 (class 1259 OID 16673)
-- Name: idx_candidates_v2_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_email ON public.candidates_v2 USING btree (email);


--
-- TOC entry 3446 (class 1259 OID 16674)
-- Name: idx_candidates_v2_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_status ON public.candidates_v2 USING btree (status);


--
-- TOC entry 3447 (class 1259 OID 16675)
-- Name: idx_candidates_v2_survey_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_survey_status ON public.candidates_v2 USING btree (survey_validation_status);


--
-- TOC entry 3448 (class 1259 OID 16677)
-- Name: idx_candidates_v2_template; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_template ON public.candidates_v2 USING btree (template_key);


--
-- TOC entry 3449 (class 1259 OID 16676)
-- Name: idx_candidates_v2_verification; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_candidates_v2_verification ON public.candidates_v2 USING btree (identity_verified);


--
-- TOC entry 3485 (class 1259 OID 16692)
-- Name: idx_evaluated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluated_at ON public.video_interview_evaluations USING btree (evaluated_at);


--
-- TOC entry 3486 (class 1259 OID 16691)
-- Name: idx_evaluation_assessment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_evaluation_assessment ON public.video_interview_evaluations USING btree (video_assessment_id);


--
-- TOC entry 3487 (class 1259 OID 16693)
-- Name: idx_recommendation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recommendation ON public.video_interview_evaluations USING btree (recommendation);


--
-- TOC entry 3456 (class 1259 OID 16681)
-- Name: idx_survey_validation_screening; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_screening ON public.survey_validation_results USING btree (screening_id);


--
-- TOC entry 3457 (class 1259 OID 16682)
-- Name: idx_survey_validation_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_status ON public.survey_validation_results USING btree (validation_status);


--
-- TOC entry 3458 (class 1259 OID 16683)
-- Name: idx_survey_validation_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_survey_validation_timestamp ON public.survey_validation_results USING btree (validated_at);


--
-- TOC entry 3469 (class 1259 OID 16686)
-- Name: idx_verification_audit_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verification_audit_action ON public.verification_audit_log USING btree (action_type);


--
-- TOC entry 3470 (class 1259 OID 16687)
-- Name: idx_verification_audit_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_verification_audit_timestamp ON public.verification_audit_log USING btree ("timestamp");


--
-- TOC entry 3494 (class 1259 OID 16695)
-- Name: idx_video_analysis_assessment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_analysis_assessment_id ON public.video_analysis_results USING btree (video_assessment_id);


--
-- TOC entry 3495 (class 1259 OID 16697)
-- Name: idx_video_analysis_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_analysis_created_at ON public.video_analysis_results USING btree (created_at);


--
-- TOC entry 3496 (class 1259 OID 16696)
-- Name: idx_video_analysis_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_analysis_status ON public.video_analysis_results USING btree (analysis_status);


--
-- TOC entry 3473 (class 1259 OID 16688)
-- Name: idx_video_assessment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_assessment_id ON public.video_interview_candidates USING btree (video_assessment_id);


--
-- TOC entry 3474 (class 1259 OID 16689)
-- Name: idx_video_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_email ON public.video_interview_candidates USING btree (email);


--
-- TOC entry 3482 (class 1259 OID 16694)
-- Name: idx_video_response_assessment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_response_assessment_id ON public.video_interview_responses USING btree (video_assessment_id);


--
-- TOC entry 3475 (class 1259 OID 16690)
-- Name: idx_video_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_video_status ON public.video_interview_candidates USING btree (status);


--
-- TOC entry 3521 (class 2620 OID 17850)
-- Name: job_templates update_job_templates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_job_templates_updated_at BEFORE UPDATE ON public.job_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3520 (class 2620 OID 17819)
-- Name: video_analysis_results update_video_analysis_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_video_analysis_updated_at BEFORE UPDATE ON public.video_analysis_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 3511 (class 2606 OID 16545)
-- Name: aadhaar_verification aadhaar_verification_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aadhaar_verification
    ADD CONSTRAINT aadhaar_verification_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 3509 (class 2606 OID 16507)
-- Name: assessment_questions_v2 assessment_questions_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_questions_v2
    ADD CONSTRAINT assessment_questions_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 3510 (class 2606 OID 16529)
-- Name: assessment_results_v2 assessment_results_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_results_v2
    ADD CONSTRAINT assessment_results_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 3518 (class 2606 OID 17820)
-- Name: video_analysis_results fk_video_assessment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT fk_video_assessment FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- TOC entry 3515 (class 2606 OID 17825)
-- Name: video_interview_evaluations fk_video_assessment; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT fk_video_assessment FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- TOC entry 3505 (class 2606 OID 16440)
-- Name: job_requirements_v2 job_requirements_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_requirements_v2
    ADD CONSTRAINT job_requirements_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 3506 (class 2606 OID 16459)
-- Name: survey_questions survey_questions_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 3507 (class 2606 OID 16474)
-- Name: survey_responses survey_responses_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 3508 (class 2606 OID 16492)
-- Name: survey_validation_results survey_validation_results_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.survey_validation_results
    ADD CONSTRAINT survey_validation_results_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 3512 (class 2606 OID 16560)
-- Name: verification_audit_log verification_audit_log_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_audit_log
    ADD CONSTRAINT verification_audit_log_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- TOC entry 3519 (class 2606 OID 16668)
-- Name: video_analysis_results video_analysis_results_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT video_analysis_results_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- TOC entry 3516 (class 2606 OID 16633)
-- Name: video_interview_evaluations video_interview_evaluations_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT video_interview_evaluations_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- TOC entry 3513 (class 2606 OID 16595)
-- Name: video_interview_questions video_interview_questions_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_questions
    ADD CONSTRAINT video_interview_questions_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


--
-- TOC entry 3514 (class 2606 OID 16611)
-- Name: video_interview_responses video_interview_responses_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_interview_responses
    ADD CONSTRAINT video_interview_responses_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


--
-- TOC entry 3517 (class 2606 OID 16650)
-- Name: video_job_requirements video_job_requirements_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_job_requirements
    ADD CONSTRAINT video_job_requirements_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


-- Completed on 2026-03-24 13:45:31

--
-- PostgreSQL database dump complete
--

\unrestrict Ye6ayxFam52NV4aBX7QubRpsa4dYexwEzrw3Bqk3r4zLfUuLwfxLblzD4JKr6NK

