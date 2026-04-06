--
-- PostgreSQL database dump
--

\restrict AqNLMFHW2ltrqNL2BJGP79eV04kJJ8jKcqKxqKe5y5HaAN2g9PDRFw0OEYNETqN

-- Dumped from database version 17.9 (Debian 17.9-1.pgdg13+1)
-- Dumped by pg_dump version 17.9 (Debian 17.9-1.pgdg13+1)

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
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: generate_jid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_jid() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aadhaar_verification; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE aadhaar_verification; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.aadhaar_verification IS 'Aadhaar card verification data and audit trail';


--
-- Name: COLUMN aadhaar_verification.masked_aadhaar; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.aadhaar_verification.masked_aadhaar IS 'Last 4 digits of Aadhaar number (XXXX-XXXX-1234)';


--
-- Name: COLUMN aadhaar_verification.name_match_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.aadhaar_verification.name_match_score IS 'Similarity score between extracted name and candidate name (0.0 to 1.0)';


--
-- Name: COLUMN aadhaar_verification.verification_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.aadhaar_verification.verification_data IS 'Complete OCR extraction data and metadata';


--
-- Name: assessment_questions_v2; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assessment_questions_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assessment_questions_v2_id_seq OWNED BY public.assessment_questions_v2.id;


--
-- Name: assessment_results_v2; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: COLUMN assessment_results_v2.survey_responses_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results_v2.survey_responses_count IS 'Total number of survey questions answered';


--
-- Name: COLUMN assessment_results_v2.survey_validation_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results_v2.survey_validation_status IS 'Status of preference screening validation';


--
-- Name: COLUMN assessment_results_v2.survey_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results_v2.survey_completed_at IS 'When the survey/preference screening was completed';


--
-- Name: COLUMN assessment_results_v2.technical_assessment_unlocked; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results_v2.technical_assessment_unlocked IS 'Whether technical assessment was unlocked after survey validation';


--
-- Name: COLUMN assessment_results_v2.qualifying_survey_questions_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results_v2.qualifying_survey_questions_count IS 'Number of qualifying survey questions';


--
-- Name: COLUMN assessment_results_v2.informational_survey_questions_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results_v2.informational_survey_questions_count IS 'Number of informational survey questions';


--
-- Name: COLUMN assessment_results_v2.two_stage_process_completed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.assessment_results_v2.two_stage_process_completed IS 'Whether both survey and technical stages were completed';


--
-- Name: candidates_v2; Type: TABLE; Schema: public; Owner: -
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
    jid character varying(20),
    notice_period character varying(50),
    visa_status character varying(50),
    CONSTRAINT check_survey_validation_status CHECK (((survey_validation_status)::text = ANY ((ARRAY['pending'::character varying, 'passed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: TABLE candidates_v2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.candidates_v2 IS 'Candidate information with identity verification support';


--
-- Name: COLUMN candidates_v2.survey_validation_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.candidates_v2.survey_validation_status IS 'Status of preference screening: pending, passed, failed';


--
-- Name: COLUMN candidates_v2.survey_completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.candidates_v2.survey_completed_at IS 'Timestamp when survey was completed and validated';


--
-- Name: COLUMN candidates_v2.technical_assessment_unlocked; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.candidates_v2.technical_assessment_unlocked IS 'TRUE if candidate passed preference screening and can access technical questions';


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: hr_assessment_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_assessment_questions (
    id integer NOT NULL,
    assessment_id integer NOT NULL,
    question_text text NOT NULL,
    is_default boolean DEFAULT false,
    is_selected boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: hr_assessment_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hr_assessment_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hr_assessment_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hr_assessment_questions_id_seq OWNED BY public.hr_assessment_questions.id;


--
-- Name: hr_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_assessments (
    id integer NOT NULL,
    jid character varying(20) NOT NULL,
    template_id integer,
    role_title character varying(150) NOT NULL,
    experience_level character varying(50),
    skills text[],
    job_description text,
    ai_generated_jd boolean DEFAULT false,
    mcq_time_limit integer DEFAULT 30,
    video_time_limit integer DEFAULT 15,
    coding_time_limit integer DEFAULT 45,
    include_coding boolean DEFAULT false,
    include_aptitude boolean DEFAULT false,
    include_ai_interview boolean DEFAULT true,
    include_manual_interview boolean DEFAULT false,
    generate_ai_questions boolean DEFAULT true,
    status character varying(20) DEFAULT 'active'::character varying,
    created_by character varying(100) DEFAULT 'HR Team'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_assessments_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'closed'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: hr_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hr_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hr_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hr_assessments_id_seq OWNED BY public.hr_assessments.id;


--
-- Name: hr_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_members (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150),
    role character varying(50) DEFAULT 'HR'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: hr_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hr_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hr_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hr_members_id_seq OWNED BY public.hr_members.id;


--
-- Name: job_postings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_postings (
    id integer NOT NULL,
    jid character varying(20) NOT NULL,
    template_id integer,
    job_title character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying,
    opens_at date DEFAULT CURRENT_DATE,
    closes_at date,
    created_by character varying(100) DEFAULT 'HR Team'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    headcount integer DEFAULT 1,
    department character varying(100),
    hiring_manager character varying(100),
    interviewer character varying(100),
    CONSTRAINT job_postings_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'open'::character varying, 'closed'::character varying, 'archived'::character varying])::text[])))
);


--
-- Name: job_postings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_postings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_postings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_postings_id_seq OWNED BY public.job_postings.id;


--
-- Name: job_requirements_v2; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_requirements_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_requirements_v2_id_seq OWNED BY public.job_requirements_v2.id;


--
-- Name: job_templates; Type: TABLE; Schema: public; Owner: -
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
    updated_at timestamp without time zone DEFAULT now(),
    time_limit_minutes integer DEFAULT 30
);


--
-- Name: job_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_templates_id_seq OWNED BY public.job_templates.id;


--
-- Name: survey_questions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: COLUMN survey_questions.expected_answer; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.survey_questions.expected_answer IS 'Expected answer for qualifying questions (Yes/No or specific multiple choice option)';


--
-- Name: COLUMN survey_questions.is_qualifying; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.survey_questions.is_qualifying IS 'TRUE if this question requires validation to proceed to technical assessment';


--
-- Name: COLUMN survey_questions.question_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.survey_questions.question_category IS 'Category: qualifying or informational';


--
-- Name: COLUMN survey_questions.validation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.survey_questions.validation_type IS 'Type of validation: exact_match for Yes/No and Multiple Choice';


--
-- Name: survey_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.survey_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.survey_questions_id_seq OWNED BY public.survey_questions.id;


--
-- Name: survey_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.survey_responses (
    id integer NOT NULL,
    screening_id character varying(50),
    question_id integer,
    response_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: survey_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.survey_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.survey_responses_id_seq OWNED BY public.survey_responses.id;


--
-- Name: survey_validation_results; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE survey_validation_results; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.survey_validation_results IS 'Results of preference/survey question validation before technical assessment';


--
-- Name: COLUMN survey_validation_results.validation_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.survey_validation_results.validation_status IS 'Status: passed, failed, or pending';


--
-- Name: COLUMN survey_validation_results.failed_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.survey_validation_results.failed_questions IS 'Array of failed question details with expected vs actual answers';


--
-- Name: COLUMN survey_validation_results.all_survey_responses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.survey_validation_results.all_survey_responses IS 'Complete survey response data for reference';


--
-- Name: COLUMN survey_validation_results.validation_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.survey_validation_results.validation_details IS 'Detailed validation metadata and scoring breakdown';


--
-- Name: survey_validation_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.survey_validation_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: survey_validation_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.survey_validation_results_id_seq OWNED BY public.survey_validation_results.id;


--
-- Name: survey_validation_summary; Type: VIEW; Schema: public; Owner: -
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


--
-- Name: VIEW survey_validation_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.survey_validation_summary IS 'Combined view of candidate survey validation status and results';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'hr'::character varying,
    reset_token character varying(255),
    reset_token_expiry timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_audit_log; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE verification_audit_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.verification_audit_log IS 'Complete audit log for all verification activities';


--
-- Name: verification_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_audit_log_id_seq OWNED BY public.verification_audit_log.id;


--
-- Name: video_analysis_results; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: TABLE video_analysis_results; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.video_analysis_results IS 'Stores Python-based video analysis results using FMDv10_2.py (MediaPipe)';


--
-- Name: video_analysis_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_analysis_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_analysis_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_analysis_results_id_seq OWNED BY public.video_analysis_results.id;


--
-- Name: video_interview_candidates; Type: TABLE; Schema: public; Owner: -
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
    updated_at timestamp without time zone DEFAULT now(),
    jid character varying(20)
);


--
-- Name: video_interview_candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_interview_candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_interview_candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_interview_candidates_id_seq OWNED BY public.video_interview_candidates.id;


--
-- Name: video_interview_evaluations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: video_interview_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_interview_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_interview_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_interview_evaluations_id_seq OWNED BY public.video_interview_evaluations.id;


--
-- Name: video_interview_questions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: video_interview_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_interview_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_interview_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_interview_questions_id_seq OWNED BY public.video_interview_questions.id;


--
-- Name: video_interview_responses; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: video_interview_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_interview_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_interview_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_interview_responses_id_seq OWNED BY public.video_interview_responses.id;


--
-- Name: video_job_requirements; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: video_job_requirements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.video_job_requirements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: video_job_requirements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.video_job_requirements_id_seq OWNED BY public.video_job_requirements.id;


--
-- Name: assessment_questions_v2 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_questions_v2 ALTER COLUMN id SET DEFAULT nextval('public.assessment_questions_v2_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: hr_assessment_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_assessment_questions ALTER COLUMN id SET DEFAULT nextval('public.hr_assessment_questions_id_seq'::regclass);


--
-- Name: hr_assessments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_assessments ALTER COLUMN id SET DEFAULT nextval('public.hr_assessments_id_seq'::regclass);


--
-- Name: hr_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_members ALTER COLUMN id SET DEFAULT nextval('public.hr_members_id_seq'::regclass);


--
-- Name: job_postings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_postings ALTER COLUMN id SET DEFAULT nextval('public.job_postings_id_seq'::regclass);


--
-- Name: job_requirements_v2 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_requirements_v2 ALTER COLUMN id SET DEFAULT nextval('public.job_requirements_v2_id_seq'::regclass);


--
-- Name: job_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_templates ALTER COLUMN id SET DEFAULT nextval('public.job_templates_id_seq'::regclass);


--
-- Name: survey_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_questions ALTER COLUMN id SET DEFAULT nextval('public.survey_questions_id_seq'::regclass);


--
-- Name: survey_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses ALTER COLUMN id SET DEFAULT nextval('public.survey_responses_id_seq'::regclass);


--
-- Name: survey_validation_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_validation_results ALTER COLUMN id SET DEFAULT nextval('public.survey_validation_results_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_audit_log ALTER COLUMN id SET DEFAULT nextval('public.verification_audit_log_id_seq'::regclass);


--
-- Name: video_analysis_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analysis_results ALTER COLUMN id SET DEFAULT nextval('public.video_analysis_results_id_seq'::regclass);


--
-- Name: video_interview_candidates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_candidates ALTER COLUMN id SET DEFAULT nextval('public.video_interview_candidates_id_seq'::regclass);


--
-- Name: video_interview_evaluations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_evaluations ALTER COLUMN id SET DEFAULT nextval('public.video_interview_evaluations_id_seq'::regclass);


--
-- Name: video_interview_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_questions ALTER COLUMN id SET DEFAULT nextval('public.video_interview_questions_id_seq'::regclass);


--
-- Name: video_interview_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_responses ALTER COLUMN id SET DEFAULT nextval('public.video_interview_responses_id_seq'::regclass);


--
-- Name: video_job_requirements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_job_requirements ALTER COLUMN id SET DEFAULT nextval('public.video_job_requirements_id_seq'::regclass);


--
-- Data for Name: aadhaar_verification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.aadhaar_verification (screening_id, masked_aadhaar, verification_status, attempts_made, verified_at, name_match_score, extracted_name, verification_data, verification_method, image_quality_score, ocr_confidence, security_flags, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: assessment_questions_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_questions_v2 (id, screening_id, question_id, question_text, options, correct_answer, category, difficulty, explanation, time_limit) FROM stdin;
1	scr_1775287222530_gtmxg	2	In an N8N workflow, what is the purpose of the 'Merge' node?	{"A": "To split a workflow into multiple branches", "B": "To combine data from multiple sources into a single output", "C": "To filter out data based on specific conditions", "D": "To trigger a workflow based on a specific event"}	B	N8N	medium	B is correct because the 'Merge' node is used to combine data from multiple sources into a single output. A is wrong because the 'Split' node is used to split a workflow into multiple branches. C is wrong because the 'Filter' node is used to filter out data based on specific conditions. D is wrong because the 'Trigger' node is used to trigger a workflow based on a specific event.	90
2	scr_1775287222530_gtmxg	1	Given a Python script that needs to handle missing values in a dataset, what would be the most appropriate library to use?	{"A": "Pandas", "B": "NumPy", "C": "Scikit-learn", "D": "Matplotlib"}	A	Python	easy	A is correct because Pandas provides built-in functions to handle missing values. B is wrong because NumPy is primarily used for numerical operations. C is wrong because Scikit-learn is used for machine learning tasks. D is wrong because Matplotlib is used for data visualization.	60
3	scr_1775287222530_gtmxg	3	Given a Python function that needs to perform data validation on a large dataset, what would be the most efficient way to handle errors and exceptions?	{"A": "Using a try-except block to catch and handle exceptions", "B": "Using a loop to iterate over the data and check for errors", "C": "Using a list comprehension to filter out invalid data", "D": "Using a recursive function to validate the data"}	A	Python	medium	A is correct because using a try-except block is the most efficient way to handle errors and exceptions in Python. B is wrong because using a loop to iterate over the data can be time-consuming and inefficient. C is wrong because using a list comprehension can only filter out invalid data, but not handle exceptions. D is wrong because using a recursive function can lead to a stack overflow error.	90
4	scr_1775287222530_gtmxg	5	Given a Python script that needs to perform data processing on a large dataset, what would be the most efficient way to optimize the performance of the script?	{"A": "Using a 'for' loop to iterate over the data", "B": "Using a list comprehension to process the data", "C": "Using the 'Pandas' library to process the data", "D": "Using the 'NumPy' library to process the data"}	C	Python	medium	C is correct because using the 'Pandas' library is the most efficient way to process large datasets in Python. A is wrong because using a 'for' loop can be time-consuming and inefficient. B is wrong because using a list comprehension can only process small to medium-sized datasets. D is wrong because using the 'NumPy' library is primarily used for numerical operations, not data processing.	90
5	scr_1775287222530_gtmxg	4	In an N8N workflow, how would you handle a situation where a node is failing due to a timeout error, but the workflow needs to continue running?	{"A": "Increase the timeout value for the node", "B": "Use a 'Retry' node to retry the failed node", "C": "Use a 'Wait' node to pause the workflow and wait for the node to complete", "D": "Use a 'Split' node to split the workflow into multiple branches and bypass the failed node"}	B	N8N	hard	B is correct because using a 'Retry' node is the most effective way to handle a node failure due to a timeout error. A is wrong because increasing the timeout value may not always resolve the issue. C is wrong because using a 'Wait' node can pause the workflow indefinitely. D is wrong because using a 'Split' node can bypass the failed node, but may not resolve the underlying issue.	120
6	scr_1775287222530_4zgk9	4	In an N8N workflow, how would you handle a situation where a node is failing due to a timeout error, but the workflow needs to continue running?	{"A": "Increase the timeout value for the node", "B": "Use a 'Retry' node to retry the failed node", "C": "Use a 'Wait' node to pause the workflow and wait for the node to complete", "D": "Use a 'Split' node to split the workflow into multiple branches and bypass the failed node"}	B	N8N	hard	B is correct because using a 'Retry' node is the most effective way to handle a node failure due to a timeout error. A is wrong because increasing the timeout value may not always resolve the issue. C is wrong because using a 'Wait' node can pause the workflow indefinitely. D is wrong because using a 'Split' node can bypass the failed node, but may not resolve the underlying issue.	120
7	scr_1775287222530_4zgk9	2	In an N8N workflow, what is the purpose of the 'Merge' node?	{"A": "To split a workflow into multiple branches", "B": "To combine data from multiple sources into a single output", "C": "To filter out data based on specific conditions", "D": "To trigger a workflow based on a specific event"}	B	N8N	medium	B is correct because the 'Merge' node is used to combine data from multiple sources into a single output. A is wrong because the 'Split' node is used to split a workflow into multiple branches. C is wrong because the 'Filter' node is used to filter out data based on specific conditions. D is wrong because the 'Trigger' node is used to trigger a workflow based on a specific event.	90
8	scr_1775287222530_4zgk9	1	Given a Python script that needs to handle missing values in a dataset, what would be the most appropriate library to use?	{"A": "Pandas", "B": "NumPy", "C": "Scikit-learn", "D": "Matplotlib"}	A	Python	easy	A is correct because Pandas provides built-in functions to handle missing values. B is wrong because NumPy is primarily used for numerical operations. C is wrong because Scikit-learn is used for machine learning tasks. D is wrong because Matplotlib is used for data visualization.	60
9	scr_1775287222530_4zgk9	5	Given a Python script that needs to perform data processing on a large dataset, what would be the most efficient way to optimize the performance of the script?	{"A": "Using a 'for' loop to iterate over the data", "B": "Using a list comprehension to process the data", "C": "Using the 'Pandas' library to process the data", "D": "Using the 'NumPy' library to process the data"}	C	Python	medium	C is correct because using the 'Pandas' library is the most efficient way to process large datasets in Python. A is wrong because using a 'for' loop can be time-consuming and inefficient. B is wrong because using a list comprehension can only process small to medium-sized datasets. D is wrong because using the 'NumPy' library is primarily used for numerical operations, not data processing.	90
10	scr_1775287222530_4zgk9	3	Given a Python function that needs to perform data validation on a large dataset, what would be the most efficient way to handle errors and exceptions?	{"A": "Using a try-except block to catch and handle exceptions", "B": "Using a loop to iterate over the data and check for errors", "C": "Using a list comprehension to filter out invalid data", "D": "Using a recursive function to validate the data"}	A	Python	medium	A is correct because using a try-except block is the most efficient way to handle errors and exceptions in Python. B is wrong because using a loop to iterate over the data can be time-consuming and inefficient. C is wrong because using a list comprehension can only filter out invalid data, but not handle exceptions. D is wrong because using a recursive function can lead to a stack overflow error.	90
\.


--
-- Data for Name: assessment_results_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assessment_results_v2 (screening_id, answers, total_questions, correct_answers, score_percentage, time_spent, violations, is_passed, grade, aadhaar_verified, verification_attempts, verification_data, survey_responses_count, survey_validation_status, survey_completed_at, technical_assessment_unlocked, qualifying_survey_questions_count, informational_survey_questions_count, two_stage_process_completed, started_at, completed_at) FROM stdin;
SCR-DEMO-001	{}	30	27	90	\N	\N	t	A	f	0	\N	0	pending	\N	f	0	0	f	\N	2026-03-26 06:43:20.947626
SCR-DEMO-002	{}	25	21	84	\N	\N	t	B	f	0	\N	0	pending	\N	f	0	0	f	\N	2026-03-26 06:43:20.947626
SCR-DEMO-003	{}	30	20	67	\N	\N	t	C	f	0	\N	0	pending	\N	f	0	0	f	\N	2026-03-26 06:43:20.947626
SCR-DEMO-004	{}	20	17	85	\N	\N	t	A	f	0	\N	0	pending	\N	f	0	0	f	\N	2026-03-26 06:43:20.947626
SCR-DEMO-005	{}	25	12	48	\N	\N	f	F	f	0	\N	0	pending	\N	f	0	0	f	\N	2026-03-26 06:43:20.947626
scr_1775287222530_4zgk9	{"1": {"correct": "A", "selected": "A", "is_correct": true}, "2": {"correct": "B", "selected": "B", "is_correct": true}, "3": {"correct": "A", "selected": "A", "is_correct": true}, "4": {"correct": "B", "selected": "B", "is_correct": true}, "5": {"correct": "C", "selected": "C", "is_correct": true}}	5	5	100	142	\N	t	A	f	0	\N	0	pending	\N	f	0	0	f	\N	2026-04-04 07:23:22.109237
\.


--
-- Data for Name: candidates_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.candidates_v2 (screening_id, name, email, phone, location, current_company, job_title, match_score, required_skills, experience_level, salary_expectation, template_key, status, identity_verified, verification_required, verification_attempts, last_verification_attempt, survey_validation_status, survey_completed_at, technical_assessment_unlocked, resume_drive_id, resume_file_name, resume_drive_url, resume_text, created_at, expires_at, jid, notice_period, visa_status) FROM stdin;
749bfc64-1440-46f0-9270-32340213f2b8	Rahul Sharma	rahul@example.com	9876543210	Bangalore	\N	\N	\N	\N	\N	\N	\N	pending	f	t	0	\N	passed	\N	t	\N	\N	\N	\N	2026-03-09 22:35:57.83477	\N	\N	\N	\N
SCR-DEMO-001	Sarah Chen	sarah.chen@email.com	+1-555-234-5678	San Francisco, CA	Google	ML Engineer	92	Python, TensorFlow, PyTorch, MLOps, SQL	Senior	$180k - $220k	\N	pending	f	t	0	\N	pending	\N	f	\N	\N	\N	\N	2026-03-26 06:43:20.947626	\N	JOB-2026-001	2 weeks	US Citizen
SCR-DEMO-002	James Wilson	james.wilson@email.com	+1-555-345-6789	New York, NY	Stripe	Senior Frontend Engineer	85	React, TypeScript, CSS, Design Systems, Testing	Senior	$160k - $200k	\N	pending	f	t	0	\N	pending	\N	f	\N	\N	\N	\N	2026-03-26 06:43:20.947626	\N	JOB-2026-002	1 month	H1-B
SCR-DEMO-003	Priya Sharma	priya.sharma@email.com	+91-98765-43210	Bangalore, India	Infosys	ML Engineer	78	Python, PyTorch, Computer Vision	Mid	₹18L - ₹25L	\N	pending	f	t	0	\N	pending	\N	f	\N	\N	\N	\N	2026-03-26 06:43:20.947626	\N	JOB-2026-001	3 months	Requires Sponsorship
SCR-DEMO-004	Michael Park	michael.park@email.com	+1-555-456-7890	Austin, TX	Uber	Backend Engineer	88	Go, Java, PostgreSQL, Docker, Kubernetes, REST APIs	Senior	$170k - $210k	\N	pending	f	t	0	\N	pending	\N	f	\N	\N	\N	\N	2026-03-26 06:43:20.947626	\N	JOB-2026-003	2 weeks	US Citizen
SCR-DEMO-005	Emily Rodriguez	emily.rodriguez@email.com	+1-555-567-8901	Seattle, WA	Freelance	Senior Frontend Engineer	45	React, JavaScript	Junior	$80k - $100k	\N	pending	f	t	0	\N	pending	\N	f	\N	\N	\N	\N	2026-03-26 06:43:20.947626	\N	JOB-2026-002	Immediate	Green Card
scr_1775287222530_gtmxg	Arjun Mehta	Prasanna.KW@cbcinc.ai	Not provided	Dallas, TX	TechNova Solutions	Data Scientist	87	Python, SQL, Machine Learning, Statistics, Data Visualization	2-5 years	Not specified	\N	pending	f	t	0	\N	pending	\N	f	01PQMN3IZ5RHPKZU5H6JAL4KV6QS3WAJZV	Arjun_Mehta_Resume_v2.pdf	https://cloudbclabsit-my.sharepoint.com/personal/aicandidatescreening_cbcinc_ai/Documents/Candidate%20Resume/Arjun_Mehta_Resume_v2.pdf	Arjun Mehta\nDallas, TX\nEmail: Prasanna.KW@cbcinc.ai\nLinkedIn: linkedin.com/in/arjunmehta | GitHub: github.com/arjunmehta\nSUMMARY\nVersatile Data Scientist, Machine Learning Engineer, and Full Stack Developer with 4+ years of\nexperience building scalable data-driven applications. Strong expertise in Python, SQL, and\nmodern web technologies with a focus on deploying production-grade ML systems and end-to-end\nsolutions.\nSKILLS\nProgramming: Python, JavaScript, TypeScript, Java\nData & ML: Pandas, NumPy, Scikit-learn, TensorFlow, PyTorch, XGBoost\nDatabases: PostgreSQL, MySQL, MongoDB, Snowflake\nFull Stack: React, Node.js, Express, REST APIs, HTML/CSS\nCloud & Tools: AWS (S3, EC2, Lambda), Docker, Kubernetes, Git, CI/CD\nData Engineering: Apache Spark, Airflow, ETL Pipelines\nEXPERIENCE\nData Scientist / ML Engineer\nTechNova Solutions | Jan 2022 – Present\n- Built and deployed ML models for churn prediction, improving retention by 18%\n- Designed ETL pipelines using Python and Spark processing 10M+ records daily\n- Deployed models using Docker and AWS Lambda for real-time inference\n- Integrated ML APIs into production systems\nFull Stack Engineer\nInnovateX Labs | Jun 2020 – Dec 2021\n- Developed full-stack apps using React, Node.js, PostgreSQL\n- Built REST APIs handling 50K+ daily requests\n- Integrated dashboards using D3.js and Tableau\n- Improved performance by 30%\nPROJECTS\nFraud Detection System: Real-time system using XGBoost achieving 92% precision\nResume Screening Tool: NLP-based ranking using BERT with Flask API\nE-commerce Platform: Full-stack app with recommendation engine\nEDUCATION\n\nBachelor of Technology in Computer Science\nUniversity of Texas at Dallas	2026-04-04 07:20:26.484913	2026-04-07 07:20:26.453	JOB-2026-016	\N	\N
scr_1775287222530_4zgk9	Hemsuriya M	hemsuriya.m@cbcinc.ai	Not provided	Not provided	CBC	Data Scientist	40	Python, SQL, Machine Learning, Statistics, Data Visualization	2-5 years	Not specified	\N	completed	f	t	0	\N	pending	\N	f	01PQMN3I2LBYMPT43AQVG3MOM6UAAB4WYH	Hemsuriya M Resume.pdf	https://cloudbclabsit-my.sharepoint.com/personal/aicandidatescreening_cbcinc_ai/Documents/Candidate%20Resume/Hemsuriya%20M%20Resume.pdf	Email: hemsuriya.m@cbcinc.ai\nPython Developer and Data Scientist with 3+ years of experience in\nbuilding data-driven solutions, and delivering actionable insights.\nSkilled in applying analytical techniques.\nData Scientist — CBC\nExperience: 3+ Years\nHemsuriya M\nProfessional Summary\nSkills\nPython•\nData Science•\nExperience	2026-04-04 07:20:26.484913	2026-04-07 07:20:26.453	JOB-2026-016	\N	\N
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, created_at) FROM stdin;
1	Engineering	2026-04-02 07:15:29.141131
2	Data Science	2026-04-02 07:15:29.141131
3	Product	2026-04-02 07:15:29.141131
4	Design	2026-04-02 07:15:29.141131
5	Marketing	2026-04-02 07:15:29.141131
6	Sales	2026-04-02 07:15:29.141131
7	Finance	2026-04-02 07:15:29.141131
8	Human Resources	2026-04-02 07:15:29.141131
9	Operations	2026-04-02 07:15:29.141131
10	Legal	2026-04-02 07:15:29.141131
11	Customer Support	2026-04-02 07:15:29.141131
\.


--
-- Data for Name: hr_assessment_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_assessment_questions (id, assessment_id, question_text, is_default, is_selected, sort_order, created_at) FROM stdin;
1	1	Are you willing to relocate?	t	t	0	2026-04-04 07:20:19.015145
\.


--
-- Data for Name: hr_assessments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_assessments (id, jid, template_id, role_title, experience_level, skills, job_description, ai_generated_jd, mcq_time_limit, video_time_limit, coding_time_limit, include_coding, include_aptitude, include_ai_interview, include_manual_interview, generate_ai_questions, status, created_by, created_at, updated_at) FROM stdin;
1	JOB-2026-016	2	Data Scientist	Senior	{Python,N8N}	\N	f	30	15	45	t	t	t	f	t	active	HR Team	2026-04-04 07:20:19.015145	2026-04-04 07:20:19.015145
\.


--
-- Data for Name: hr_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_members (id, name, email, role, created_at) FROM stdin;
1	Rahul Sharma	rahul.sharma@company.com	CTO	2026-04-02 07:19:35.89945
2	Priya Nair	priya.nair@company.com	Manager	2026-04-02 07:19:46.734645
3	Ankit Verma	ankit.verma@company.com	Lead	2026-04-02 07:19:46.764373
4	Sneha Iyer	sneha.iyer@company.com	HR	2026-04-02 07:19:46.801995
5	Vikram Desai	vikram.desai@company.com	Director	2026-04-02 07:19:46.840284
6	Meera Kapoor	meera.kapoor@company.com	VP	2026-04-02 07:19:46.980275
7	Arjun Reddy	arjun.reddy@company.com	Manager	2026-04-02 07:19:47.020684
8	Kavitha Menon	kavitha.menon@company.com	HR	2026-04-02 07:19:47.159914
\.


--
-- Data for Name: job_postings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_postings (id, jid, template_id, job_title, status, opens_at, closes_at, created_by, created_at, updated_at, headcount, department, hiring_manager, interviewer) FROM stdin;
1	JOB-2026-001	\N	ML Engineer	open	\N	\N	HR Team	2026-03-24 17:10:15.820067	2026-03-24 17:10:15.820067	1	\N	\N	\N
2	JOB-2026-002	\N	Senior Frontend Engineer	open	\N	\N	HR Team	2026-03-24 17:11:05.457358	2026-03-24 17:11:05.457358	1	\N	\N	\N
5	JOB-2026-003	\N	Backend Engineer	open	2026-03-15	\N	HR Team	2026-03-24 17:20:25.306918	2026-03-24 17:20:25.306918	1	\N	\N	\N
13	JOB-2026-004	5	Senior Data Scientist	open	2026-03-26	\N	HR Team	2026-03-26 06:31:03.766765	2026-03-26 06:31:03.766765	1	\N	\N	\N
15	JOB-2026-005	2	Data Scientist	open	2026-03-27	\N	HR Team	2026-03-27 06:08:39.836066	2026-03-27 06:08:39.836066	2	\N	\N	\N
16	JOB-2026-006	5	Senior Data Scientist	open	2026-03-27	\N	HR Team	2026-03-27 07:02:09.286712	2026-03-27 07:02:09.286712	1	\N	\N	\N
17	JOB-2026-007	2	Data Scientist	open	2026-03-30	\N	HR Team	2026-03-30 17:59:32.25109	2026-03-30 17:59:32.25109	2	\N	\N	\N
18	JOB-2026-008	5	Senior Data Scientist	open	2026-03-30	\N	HR Team	2026-03-30 18:04:16.928857	2026-03-30 18:04:16.928857	2	\N	\N	\N
19	JOB-2026-009	5	Junior Data Scientist	open	2026-04-02	\N	HR Team	2026-04-02 04:37:49.632204	2026-04-02 04:37:49.632204	1	\N	\N	\N
21	JOB-2026-011	17	ML Scientist 	open	2026-04-02	\N	HR Team	2026-04-02 04:51:15.572497	2026-04-02 04:51:15.572497	1	\N	\N	\N
22	JOB-2026-012	17	ML Scientist 	open	2026-04-02	\N	HR Team	2026-04-02 04:52:55.836522	2026-04-02 04:52:55.836522	1	\N	\N	\N
23	JOB-2026-013	17	ML Scientist 	open	2026-04-02	\N	HR Team	2026-04-02 06:53:33.196073	2026-04-02 06:53:33.196073	1	\N	\N	\N
24	JOB-2026-014	\N	__schema_test	open	\N	\N	HR Team	2026-04-02 07:01:47.612074	2026-04-02 07:01:47.612074	1	\N	\N	\N
25	JOB-2026-015	17	ML Scientist 	open	2026-04-04	\N	HR Team	2026-04-04 06:44:40.170462	2026-04-04 06:44:40.170462	1	Finance	Priya Nair	\N
28	JOB-2026-016	2	Data Scientist	open	2026-04-04	\N	HR Team	2026-04-04 07:20:19.015145	2026-04-04 07:20:19.015145	1	\N	\N	\N
\.


--
-- Data for Name: job_requirements_v2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_requirements_v2 (id, screening_id, job_title, required_skills, optional_skills, experience_level, salary_budget, question_count, time_limit, difficulty, focus_areas) FROM stdin;
1	scr_1775287222530_gtmxg	Data Scientist	Python, SQL, Machine Learning, Statistics, Data Visualization	None specified	2-5 years	Competitive	5	15 minutes	intermediate	["Comprehensive Assessment"]
2	scr_1775287222530_4zgk9	Data Scientist	Python, SQL, Machine Learning, Statistics, Data Visualization	None specified	2-5 years	Competitive	5	15 minutes	intermediate	["Comprehensive Assessment"]
\.


--
-- Data for Name: job_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.job_templates (id, template_key, job_title, job_description, required_skills, number_of_candidates, survey_question_1, survey_q1_expected_answer, created_at, updated_at, time_limit_minutes) FROM stdin;
5	Template_1774506663767	Junior Data Scientist	\N		\N	Are you willing to relocate?	\N	2026-03-26 06:31:03.766765	2026-04-02 04:37:49.632204	30
17	Template_1774506663767_copy_1775104610949_copy_1775105399501	ML Scientist 	\N	python, ML	\N	Are you willing to relocate?	\N	2026-04-02 04:49:59.50217	2026-04-04 06:44:40.170462	30
2	Template_2	Data Scientist	Data Scientist	Python, N8N	2	Are you willing to relocate?	Yes	2025-12-24 08:02:40.725636	2026-04-04 07:20:19.015145	30
\.


--
-- Data for Name: survey_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.survey_questions (id, screening_id, question_id, question_text, question_type, options, expected_answer, is_qualifying, question_category, validation_type, created_at) FROM stdin;
1	\N	\N	Are you willing to relocate?	text	\N	\N	t	qualifying	exact_match	2026-03-11 13:02:41.816747
2	\N	\N	How many years of experience do you have?	text	\N	\N	t	qualifying	none	2026-03-11 13:02:41.816747
3	\N	\N	What is your notice period?	text	\N	\N	f	informational	none	2026-03-11 13:02:41.816747
4	\N	\N	Are you open to contract roles?	text	\N	\N	f	informational	none	2026-03-11 13:02:41.816747
\.


--
-- Data for Name: survey_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.survey_responses (id, screening_id, question_id, response_text, created_at) FROM stdin;
1	749bfc64-1440-46f0-9270-32340213f2b8	1	Yes	2026-03-09 23:50:25.796587
2	749bfc64-1440-46f0-9270-32340213f2b8	2	3 years	2026-03-09 23:50:25.805309
3	749bfc64-1440-46f0-9270-32340213f2b8	3	10 LPA	2026-03-09 23:50:25.805933
4	scr_1775287222530_4zgk9	1	Yes	2026-04-04 07:20:59.87548
\.


--
-- Data for Name: survey_validation_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.survey_validation_results (id, screening_id, validation_status, qualifying_questions_count, correct_answers_count, failed_questions, all_survey_responses, validation_details, validated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, role, reset_token, reset_token_expiry, created_at) FROM stdin;
\.


--
-- Data for Name: verification_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification_audit_log (id, screening_id, action_type, action_details, "timestamp", ip_address, user_agent, result) FROM stdin;
\.


--
-- Data for Name: video_analysis_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.video_analysis_results (id, video_assessment_id, candidate_name, candidate_email, video_drive_id, video_url, analysis_status, analysis_started_at, analysis_completed_at, emotion_analysis, attention_metrics, face_detection, violations_summary, full_report, processing_time_seconds, frames_processed, video_duration_seconds, error_message, retry_count, created_at, updated_at) FROM stdin;
1	VA-DEMO-001	\N	\N	\N	\N	completed	\N	\N	{"sad": 2, "angry": 0, "happy": 35, "fearful": 3, "neutral": 55, "surprised": 5, "dominant_emotion": "Confident", "neutral_percentage": 55, "negative_percentage": 10, "positive_percentage": 35}	{"engagement_level": "High", "head_orientation": "Centered", "eye_contact_score": 94, "speaking_confidence": 92, "attention_percentage": 96}	{"gaze_status": "Direct eye contact", "face_detected": true, "face_confidence": 0.98, "head_pose_status": "Stable - Centered"}	{"tab_switches": 0, "audio_anomalies": 0, "total_violations": 0, "looking_away_count": 2}	\N	\N	12500	2520	\N	0	2026-03-24 17:20:25.317382	2026-03-24 17:20:25.317382
2	VA-DEMO-002	\N	\N	\N	\N	completed	\N	\N	{"sad": 2, "angry": 0, "happy": 25, "fearful": 5, "neutral": 60, "surprised": 8, "dominant_emotion": "Neutral", "neutral_percentage": 60, "negative_percentage": 15, "positive_percentage": 25}	{"engagement_level": "Good", "head_orientation": "Mostly Centered", "eye_contact_score": 86, "speaking_confidence": 84, "attention_percentage": 89}	{"gaze_status": "Mostly direct", "face_detected": true, "face_confidence": 0.95, "head_pose_status": "Mostly Centered"}	{"tab_switches": 1, "audio_anomalies": 0, "total_violations": 1, "looking_away_count": 5}	\N	\N	11000	2340	\N	0	2026-03-24 17:20:25.317382	2026-03-24 17:20:25.317382
3	VA-DEMO-003	\N	\N	\N	\N	completed	\N	\N	{"sad": 8, "angry": 2, "happy": 10, "fearful": 23, "neutral": 45, "surprised": 12, "dominant_emotion": "Nervous", "neutral_percentage": 45, "negative_percentage": 45, "positive_percentage": 10}	{"engagement_level": "Moderate", "head_orientation": "Occasional drift", "eye_contact_score": 68, "speaking_confidence": 65, "attention_percentage": 72}	{"gaze_status": "Intermittent eye contact", "face_detected": true, "face_confidence": 0.88, "head_pose_status": "Occasional drift left"}	{"tab_switches": 2, "audio_anomalies": 1, "total_violations": 3, "looking_away_count": 15}	\N	\N	9800	2100	\N	0	2026-03-24 17:20:25.317382	2026-03-24 17:20:25.317382
4	VA-DEMO-004	\N	\N	\N	\N	completed	\N	\N	{"sad": 2, "angry": 0, "happy": 30, "fearful": 5, "neutral": 58, "surprised": 5, "dominant_emotion": "Confident", "neutral_percentage": 58, "negative_percentage": 12, "positive_percentage": 30}	{"engagement_level": "High", "head_orientation": "Centered", "eye_contact_score": 92, "speaking_confidence": 91, "attention_percentage": 94}	{"gaze_status": "Consistent eye contact", "face_detected": true, "face_confidence": 0.97, "head_pose_status": "Stable - Centered"}	{"tab_switches": 0, "audio_anomalies": 0, "total_violations": 0, "looking_away_count": 3}	\N	\N	13200	2700	\N	0	2026-03-24 17:20:25.317382	2026-03-24 17:20:25.317382
5	VA-DEMO-005	\N	\N	\N	\N	completed	\N	\N	{"sad": 15, "angry": 5, "happy": 5, "fearful": 30, "neutral": 30, "surprised": 15, "dominant_emotion": "Anxious", "neutral_percentage": 30, "negative_percentage": 65, "positive_percentage": 5}	{"engagement_level": "Low", "head_orientation": "Frequent drift", "eye_contact_score": 45, "speaking_confidence": 40, "attention_percentage": 52}	{"gaze_status": "Frequently looking away", "face_detected": true, "face_confidence": 0.78, "head_pose_status": "Frequent drift right"}	{"tab_switches": 3, "audio_anomalies": 2, "total_violations": 5, "looking_away_count": 28}	\N	\N	7500	1800	\N	0	2026-03-24 17:20:25.317382	2026-03-24 17:20:25.317382
\.


--
-- Data for Name: video_interview_candidates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.video_interview_candidates (id, video_assessment_id, name, email, phone, location, current_company, job_title, match_score, candidate_skills, required_skills, experience_level, salary_expectation, status, interview_started, interview_completed, videos_uploaded, proctoring_flags, expires_at, created_at, updated_at, jid) FROM stdin;
1	VA-DEMO-001	Sarah Chen	sarah.chen@email.com	+1-555-234-5678	San Francisco, CA	\N	ML Engineer	\N	\N	\N	\N	\N	completed	t	t	t	0	\N	2026-03-24 17:20:25.309822	2026-03-24 17:20:25.309822	JOB-2026-001
2	VA-DEMO-002	James Wilson	james.wilson@email.com	+1-555-345-6789	New York, NY	\N	Senior Frontend Engineer	\N	\N	\N	\N	\N	completed	t	t	t	0	\N	2026-03-24 17:20:25.309822	2026-03-24 17:20:25.309822	JOB-2026-002
3	VA-DEMO-003	Priya Sharma	priya.sharma@email.com	+91-98765-43210	Bangalore, India	\N	ML Engineer	\N	\N	\N	\N	\N	completed	t	t	t	0	\N	2026-03-24 17:20:25.309822	2026-03-24 17:20:25.309822	JOB-2026-001
4	VA-DEMO-004	Michael Park	michael.park@email.com	+1-555-456-7890	Austin, TX	\N	Backend Engineer	\N	\N	\N	\N	\N	completed	t	t	t	0	\N	2026-03-24 17:20:25.309822	2026-03-24 17:20:25.309822	JOB-2026-003
5	VA-DEMO-005	Emily Rodriguez	emily.rodriguez@email.com	+1-555-567-8901	Seattle, WA	\N	Senior Frontend Engineer	\N	\N	\N	\N	\N	completed	t	t	t	0	\N	2026-03-24 17:20:25.309822	2026-03-24 17:20:25.309822	JOB-2026-002
\.


--
-- Data for Name: video_interview_evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.video_interview_evaluations (id, video_assessment_id, interview_score, security_score, final_score, question_scores, security_violations_count, security_severity, security_details, strengths, weaknesses, overall_feedback, recommendation, evaluated_by, evaluated_at, final_decision, decision_by, decision_at, decision_comment) FROM stdin;
2	VA-DEMO-001	92	95	93	{"confidence": 90, "skill_match": 92, "communication": 94, "technical_clarity": 96}	0	low	{"tab_switches": 0, "audio_anomalies": 0, "session_rejoins": 0}	{"Exceptional ML systems knowledge with production experience","Clear and confident communication style","Strong problem-solving approach with real-world examples"}	{"Could elaborate more on cross-team collaboration","Limited experience with streaming data pipelines"}	Outstanding candidate with deep ML expertise. Demonstrated strong technical clarity and production-level thinking. Highly recommended for senior ML role.	hire	AI	2026-03-24 17:40:51.597587	\N	\N	\N	\N
3	VA-DEMO-002	85	88	86	{"confidence": 82, "skill_match": 84, "communication": 88, "technical_clarity": 87}	1	low	{"tab_switches": 1, "audio_anomalies": 0, "session_rejoins": 0}	{"Excellent React and TypeScript expertise","Strong understanding of design systems and accessibility","Good articulation of architecture decisions"}	{"Slightly nervous during system design questions","Could improve on backend integration knowledge"}	Strong frontend candidate with solid design system experience. Good cultural fit. Recommended for hire.	hire	AI	2026-03-24 17:40:51.597587	\N	\N	\N	\N
4	VA-DEMO-003	78	70	74	{"confidence": 72, "skill_match": 78, "communication": 75, "technical_clarity": 82}	3	medium	{"tab_switches": 2, "audio_anomalies": 1, "session_rejoins": 0}	{"Good theoretical ML knowledge","Familiarity with PyTorch and TensorFlow"}	{"Limited production deployment experience","Some hesitation on system design questions","Proctoring flagged minor attention issues"}	Decent candidate with good fundamentals but lacks production experience. May need mentoring. Consider for junior-mid level role.	maybe	AI	2026-03-24 17:40:51.597587	\N	\N	\N	\N
5	VA-DEMO-004	88	92	90	{"confidence": 90, "skill_match": 88, "communication": 86, "technical_clarity": 92}	0	low	{"tab_switches": 0, "audio_anomalies": 0, "session_rejoins": 0}	{"Strong distributed systems knowledge","Excellent API design thinking","Clear communication with good examples from production"}	{"Limited experience with event-driven architectures","Could improve on database optimization topics"}	Very strong backend candidate with excellent systems thinking. Clean proctoring. Highly recommended.	hire	AI	2026-03-24 17:40:51.597587	\N	\N	\N	\N
6	VA-DEMO-005	55	60	57	{"confidence": 48, "skill_match": 52, "communication": 60, "technical_clarity": 55}	5	high	{"tab_switches": 3, "audio_anomalies": 2, "session_rejoins": 1}	{"Basic React knowledge","Willingness to learn"}	{"Significant gaps in TypeScript knowledge","Struggled with component architecture questions","Multiple proctoring violations detected","Low confidence throughout interview"}	Candidate struggled with core frontend concepts and had multiple proctoring flags. Not recommended at this time.	reject	AI	2026-03-24 17:40:51.597587	\N	\N	\N	\N
\.


--
-- Data for Name: video_interview_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.video_interview_questions (id, video_assessment_id, question_id, question_text, question_type, category, difficulty, time_limit, expected_response_type, evaluation_criteria, key_points, created_at) FROM stdin;
\.


--
-- Data for Name: video_interview_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.video_interview_responses (id, video_assessment_id, candidate_name, candidate_email, video_url, video_drive_id, video_duration, full_transcript, security_report, uploaded_at, interview_completed_at) FROM stdin;
1	VA-DEMO-001	\N	\N	\N	\N	2520	[{"time": "0:05", "message": "Welcome! Please start by introducing yourself and your background.", "speaker": "Interviewer"}, {"time": "0:20", "message": "Hi, thanks for having me. I have spent the last 8 years building production ML systems, most recently at Google where I led the recommendations infrastructure team.", "speaker": "Candidate"}, {"time": "2:10", "message": "Can you walk me through a challenging technical problem you solved recently?", "speaker": "Interviewer"}, {"time": "2:28", "message": "Sure. We had a severe model latency regression after a schema change. I set up incremental A/B shadow testing to isolate the regression and rolled back a feature transformation layer within 2 hours.", "speaker": "Candidate"}, {"time": "7:45", "message": "How do you approach performance monitoring in production ML pipelines?", "speaker": "Interviewer"}, {"time": "8:02", "message": "I combine offline KPIs with real-time online metrics, and use custom alerting thresholds based on historical drift patterns. Grafana dashboards for visibility, PagerDuty for escalation.", "speaker": "Candidate"}, {"time": "15:00", "message": "Tell me about a time you had to make a difficult technical tradeoff.", "speaker": "Interviewer"}, {"time": "15:18", "message": "We had to choose between model accuracy and latency for a real-time recommendation system. I proposed a two-tier approach: a fast lightweight model for initial candidates, then a heavier model for re-ranking the top results. This gave us 95% of the accuracy at 10x the speed.", "speaker": "Candidate"}, {"time": "25:30", "message": "How do you handle model versioning and deployment?", "speaker": "Interviewer"}, {"time": "25:48", "message": "We use MLflow for experiment tracking, DVC for data versioning, and a custom CI/CD pipeline that runs shadow traffic tests before any production deployment. Every model has automated rollback triggers based on key metrics.", "speaker": "Candidate"}]	\N	2026-03-24 17:41:25.0102	2026-03-24 17:41:25.0102
2	VA-DEMO-002	\N	\N	\N	\N	2340	[{"time": "0:08", "message": "Thanks for joining us today. Tell us about yourself.", "speaker": "Interviewer"}, {"time": "0:22", "message": "Of course! I am a frontend engineer with 6 years experience, currently at Stripe. I specialize in design systems and high-performance React applications.", "speaker": "Candidate"}, {"time": "3:15", "message": "How do you handle state management at scale?", "speaker": "Interviewer"}, {"time": "3:30", "message": "I lean on Zustand for global state and React Query for server state. Context API only for truly static config. The key is avoiding prop drilling without over-engineering.", "speaker": "Candidate"}, {"time": "9:00", "message": "What is your philosophy on accessibility?", "speaker": "Interviewer"}, {"time": "9:18", "message": "Accessibility is non-negotiable. WCAG AA as minimum baseline, semantic HTML first, then ARIA only when native elements fall short. I write axe-core tests in CI.", "speaker": "Candidate"}, {"time": "18:00", "message": "How would you architect a micro-frontend system?", "speaker": "Interviewer"}, {"time": "18:20", "message": "I would use Module Federation with Webpack 5. Each team owns their micro-app with independent deployments. Shared design system via an npm package. The shell app handles routing and authentication.", "speaker": "Candidate"}]	\N	2026-03-24 17:41:25.0102	2026-03-24 17:41:25.0102
3	VA-DEMO-003	\N	\N	\N	\N	2100	[{"time": "0:06", "message": "Good to have you here. Walk us through your experience in ML.", "speaker": "Interviewer"}, {"time": "0:21", "message": "I have been working in ML for about 3 years. Mostly focused on computer vision projects using PyTorch. I have built image classification and object detection models.", "speaker": "Candidate"}, {"time": "5:00", "message": "Can you explain how you would deploy an ML model to production?", "speaker": "Interviewer"}, {"time": "5:22", "message": "Um, I would probably use Flask to wrap the model as an API... and then deploy it on a server. Maybe use Docker.", "speaker": "Candidate"}, {"time": "12:00", "message": "How do you handle model monitoring in production?", "speaker": "Interviewer"}, {"time": "12:30", "message": "I have not actually deployed many models to production yet. In my projects I mostly evaluate models offline using test sets. But I know tools like MLflow exist for this.", "speaker": "Candidate"}]	\N	2026-03-24 17:41:25.0102	2026-03-24 17:41:25.0102
4	VA-DEMO-004	\N	\N	\N	\N	2700	[{"time": "0:05", "message": "Welcome! Tell us about your backend engineering experience.", "speaker": "Interviewer"}, {"time": "0:18", "message": "I have 7 years of backend experience, primarily in Go and Java. Currently at Uber where I work on the payments processing platform handling millions of transactions daily.", "speaker": "Candidate"}, {"time": "4:00", "message": "How do you design systems for high availability?", "speaker": "Interviewer"}, {"time": "4:15", "message": "I follow the principle of designing for failure. Circuit breakers, retry with exponential backoff, bulkhead isolation. We use multi-region deployments with active-active configuration and automatic failover.", "speaker": "Candidate"}, {"time": "12:00", "message": "Walk me through your approach to API design.", "speaker": "Interviewer"}, {"time": "12:20", "message": "I am a strong advocate for REST with clear resource modeling. Versioning via URL path, consistent error responses, pagination with cursor-based approach for large datasets. I document everything with OpenAPI specs.", "speaker": "Candidate"}, {"time": "22:00", "message": "How do you handle database scaling?", "speaker": "Interviewer"}, {"time": "22:18", "message": "We use a combination of read replicas for read-heavy workloads, connection pooling with PgBouncer, and strategic denormalization. For truly large scale, we partition by geography and use CockroachDB for global consistency.", "speaker": "Candidate"}]	\N	2026-03-24 17:41:25.0102	2026-03-24 17:41:25.0102
5	VA-DEMO-005	\N	\N	\N	\N	1800	[{"time": "0:10", "message": "Hi, tell us about your frontend experience.", "speaker": "Interviewer"}, {"time": "0:30", "message": "I have been learning React for about a year. I have done some projects in a bootcamp.", "speaker": "Candidate"}, {"time": "3:00", "message": "How would you manage component state in a complex form?", "speaker": "Interviewer"}, {"time": "3:25", "message": "I would use... useState I think? For each field. Or maybe a form library... I am not sure which one.", "speaker": "Candidate"}, {"time": "8:00", "message": "Can you explain the difference between useEffect and useLayoutEffect?", "speaker": "Interviewer"}, {"time": "8:30", "message": "Um, I think useEffect runs after render and useLayoutEffect... I am not really sure about the difference honestly.", "speaker": "Candidate"}]	\N	2026-03-24 17:41:25.0102	2026-03-24 17:41:25.0102
\.


--
-- Data for Name: video_job_requirements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.video_job_requirements (id, video_assessment_id, job_title, required_skills, optional_skills, experience_level, salary_budget, question_count, total_duration, time_per_question, difficulty, focus_areas, interview_format, recording_enabled, proctoring_enabled, created_at) FROM stdin;
\.


--
-- Name: assessment_questions_v2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assessment_questions_v2_id_seq', 10, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq', 11, true);


--
-- Name: hr_assessment_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hr_assessment_questions_id_seq', 1, true);


--
-- Name: hr_assessments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hr_assessments_id_seq', 1, true);


--
-- Name: hr_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hr_members_id_seq', 8, true);


--
-- Name: job_postings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_postings_id_seq', 28, true);


--
-- Name: job_requirements_v2_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_requirements_v2_id_seq', 2, true);


--
-- Name: job_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.job_templates_id_seq', 21, true);


--
-- Name: survey_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.survey_questions_id_seq', 3, true);


--
-- Name: survey_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.survey_responses_id_seq', 4, true);


--
-- Name: survey_validation_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.survey_validation_results_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: verification_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.verification_audit_log_id_seq', 1, false);


--
-- Name: video_analysis_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.video_analysis_results_id_seq', 15, true);


--
-- Name: video_interview_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.video_interview_candidates_id_seq', 15, true);


--
-- Name: video_interview_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.video_interview_evaluations_id_seq', 11, true);


--
-- Name: video_interview_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.video_interview_questions_id_seq', 1, false);


--
-- Name: video_interview_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.video_interview_responses_id_seq', 5, true);


--
-- Name: video_job_requirements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.video_job_requirements_id_seq', 1, false);


--
-- Name: aadhaar_verification aadhaar_verification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aadhaar_verification
    ADD CONSTRAINT aadhaar_verification_pkey PRIMARY KEY (screening_id);


--
-- Name: assessment_questions_v2 assessment_questions_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_questions_v2
    ADD CONSTRAINT assessment_questions_v2_pkey PRIMARY KEY (id);


--
-- Name: assessment_results_v2 assessment_results_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results_v2
    ADD CONSTRAINT assessment_results_v2_pkey PRIMARY KEY (screening_id);


--
-- Name: candidates_v2 candidates_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates_v2
    ADD CONSTRAINT candidates_v2_pkey PRIMARY KEY (screening_id);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: hr_assessment_questions hr_assessment_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_assessment_questions
    ADD CONSTRAINT hr_assessment_questions_pkey PRIMARY KEY (id);


--
-- Name: hr_assessments hr_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_assessments
    ADD CONSTRAINT hr_assessments_pkey PRIMARY KEY (id);


--
-- Name: hr_members hr_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_members
    ADD CONSTRAINT hr_members_pkey PRIMARY KEY (id);


--
-- Name: job_postings job_postings_jid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_jid_key UNIQUE (jid);


--
-- Name: job_postings job_postings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_pkey PRIMARY KEY (id);


--
-- Name: job_requirements_v2 job_requirements_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_requirements_v2
    ADD CONSTRAINT job_requirements_v2_pkey PRIMARY KEY (id);


--
-- Name: job_templates job_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_pkey PRIMARY KEY (id);


--
-- Name: job_templates job_templates_template_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_template_key_key UNIQUE (template_key);


--
-- Name: survey_questions survey_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_pkey PRIMARY KEY (id);


--
-- Name: survey_responses survey_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_pkey PRIMARY KEY (id);


--
-- Name: survey_validation_results survey_validation_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_validation_results
    ADD CONSTRAINT survey_validation_results_pkey PRIMARY KEY (id);


--
-- Name: video_interview_evaluations unique_evaluation; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT unique_evaluation UNIQUE (video_assessment_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_audit_log verification_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_audit_log
    ADD CONSTRAINT verification_audit_log_pkey PRIMARY KEY (id);


--
-- Name: video_analysis_results video_analysis_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT video_analysis_results_pkey PRIMARY KEY (id);


--
-- Name: video_analysis_results video_analysis_results_video_assessment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT video_analysis_results_video_assessment_id_key UNIQUE (video_assessment_id);


--
-- Name: video_interview_candidates video_interview_candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_candidates
    ADD CONSTRAINT video_interview_candidates_pkey PRIMARY KEY (id);


--
-- Name: video_interview_candidates video_interview_candidates_video_assessment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_candidates
    ADD CONSTRAINT video_interview_candidates_video_assessment_id_key UNIQUE (video_assessment_id);


--
-- Name: video_interview_evaluations video_interview_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT video_interview_evaluations_pkey PRIMARY KEY (id);


--
-- Name: video_interview_questions video_interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_questions
    ADD CONSTRAINT video_interview_questions_pkey PRIMARY KEY (id);


--
-- Name: video_interview_responses video_interview_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_responses
    ADD CONSTRAINT video_interview_responses_pkey PRIMARY KEY (id);


--
-- Name: video_job_requirements video_job_requirements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_job_requirements
    ADD CONSTRAINT video_job_requirements_pkey PRIMARY KEY (id);


--
-- Name: idx_aadhaar_verification_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aadhaar_verification_created ON public.aadhaar_verification USING btree (created_at);


--
-- Name: idx_aadhaar_verification_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_aadhaar_verification_status ON public.aadhaar_verification USING btree (verification_status);


--
-- Name: idx_candidates_v2_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_v2_email ON public.candidates_v2 USING btree (email);


--
-- Name: idx_candidates_v2_jid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_v2_jid ON public.candidates_v2 USING btree (jid);


--
-- Name: idx_candidates_v2_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_v2_status ON public.candidates_v2 USING btree (status);


--
-- Name: idx_candidates_v2_survey_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_v2_survey_status ON public.candidates_v2 USING btree (survey_validation_status);


--
-- Name: idx_candidates_v2_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_v2_template ON public.candidates_v2 USING btree (template_key);


--
-- Name: idx_candidates_v2_verification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_candidates_v2_verification ON public.candidates_v2 USING btree (identity_verified);


--
-- Name: idx_evaluated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluated_at ON public.video_interview_evaluations USING btree (evaluated_at);


--
-- Name: idx_evaluation_assessment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_evaluation_assessment ON public.video_interview_evaluations USING btree (video_assessment_id);


--
-- Name: idx_job_postings_jid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_postings_jid ON public.job_postings USING btree (jid);


--
-- Name: idx_job_postings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_postings_status ON public.job_postings USING btree (status);


--
-- Name: idx_job_postings_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_job_postings_title ON public.job_postings USING btree (job_title);


--
-- Name: idx_recommendation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recommendation ON public.video_interview_evaluations USING btree (recommendation);


--
-- Name: idx_survey_validation_screening; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_survey_validation_screening ON public.survey_validation_results USING btree (screening_id);


--
-- Name: idx_survey_validation_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_survey_validation_status ON public.survey_validation_results USING btree (validation_status);


--
-- Name: idx_survey_validation_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_survey_validation_timestamp ON public.survey_validation_results USING btree (validated_at);


--
-- Name: idx_verification_audit_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_audit_action ON public.verification_audit_log USING btree (action_type);


--
-- Name: idx_verification_audit_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_audit_timestamp ON public.verification_audit_log USING btree ("timestamp");


--
-- Name: idx_video_analysis_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_analysis_assessment_id ON public.video_analysis_results USING btree (video_assessment_id);


--
-- Name: idx_video_analysis_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_analysis_created_at ON public.video_analysis_results USING btree (created_at);


--
-- Name: idx_video_analysis_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_analysis_status ON public.video_analysis_results USING btree (analysis_status);


--
-- Name: idx_video_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_assessment_id ON public.video_interview_candidates USING btree (video_assessment_id);


--
-- Name: idx_video_candidates_jid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_candidates_jid ON public.video_interview_candidates USING btree (jid);


--
-- Name: idx_video_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_email ON public.video_interview_candidates USING btree (email);


--
-- Name: idx_video_response_assessment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_response_assessment_id ON public.video_interview_responses USING btree (video_assessment_id);


--
-- Name: idx_video_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_status ON public.video_interview_candidates USING btree (status);


--
-- Name: job_postings trg_generate_jid; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_generate_jid BEFORE INSERT ON public.job_postings FOR EACH ROW WHEN (((new.jid IS NULL) OR ((new.jid)::text = ''::text))) EXECUTE FUNCTION public.generate_jid();


--
-- Name: job_postings update_job_postings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: job_templates update_job_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_job_templates_updated_at BEFORE UPDATE ON public.job_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: video_analysis_results update_video_analysis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_analysis_updated_at BEFORE UPDATE ON public.video_analysis_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: aadhaar_verification aadhaar_verification_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aadhaar_verification
    ADD CONSTRAINT aadhaar_verification_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: assessment_questions_v2 assessment_questions_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_questions_v2
    ADD CONSTRAINT assessment_questions_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: assessment_results_v2 assessment_results_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_results_v2
    ADD CONSTRAINT assessment_results_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: candidates_v2 candidates_v2_jid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates_v2
    ADD CONSTRAINT candidates_v2_jid_fkey FOREIGN KEY (jid) REFERENCES public.job_postings(jid);


--
-- Name: video_analysis_results fk_video_assessment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT fk_video_assessment FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- Name: video_interview_evaluations fk_video_assessment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT fk_video_assessment FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- Name: hr_assessment_questions hr_assessment_questions_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_assessment_questions
    ADD CONSTRAINT hr_assessment_questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.hr_assessments(id) ON DELETE CASCADE;


--
-- Name: hr_assessments hr_assessments_jid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_assessments
    ADD CONSTRAINT hr_assessments_jid_fkey FOREIGN KEY (jid) REFERENCES public.job_postings(jid);


--
-- Name: hr_assessments hr_assessments_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_assessments
    ADD CONSTRAINT hr_assessments_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.job_templates(id);


--
-- Name: job_postings job_postings_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_postings
    ADD CONSTRAINT job_postings_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.job_templates(id);


--
-- Name: job_requirements_v2 job_requirements_v2_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_requirements_v2
    ADD CONSTRAINT job_requirements_v2_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: survey_questions survey_questions_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_questions
    ADD CONSTRAINT survey_questions_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: survey_responses survey_responses_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_responses
    ADD CONSTRAINT survey_responses_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: survey_validation_results survey_validation_results_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.survey_validation_results
    ADD CONSTRAINT survey_validation_results_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: verification_audit_log verification_audit_log_screening_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_audit_log
    ADD CONSTRAINT verification_audit_log_screening_id_fkey FOREIGN KEY (screening_id) REFERENCES public.candidates_v2(screening_id);


--
-- Name: video_analysis_results video_analysis_results_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_analysis_results
    ADD CONSTRAINT video_analysis_results_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- Name: video_interview_candidates video_interview_candidates_jid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_candidates
    ADD CONSTRAINT video_interview_candidates_jid_fkey FOREIGN KEY (jid) REFERENCES public.job_postings(jid);


--
-- Name: video_interview_evaluations video_interview_evaluations_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_evaluations
    ADD CONSTRAINT video_interview_evaluations_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id) ON DELETE CASCADE;


--
-- Name: video_interview_questions video_interview_questions_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_questions
    ADD CONSTRAINT video_interview_questions_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


--
-- Name: video_interview_responses video_interview_responses_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_interview_responses
    ADD CONSTRAINT video_interview_responses_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


--
-- Name: video_job_requirements video_job_requirements_video_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_job_requirements
    ADD CONSTRAINT video_job_requirements_video_assessment_id_fkey FOREIGN KEY (video_assessment_id) REFERENCES public.video_interview_candidates(video_assessment_id);


--
-- PostgreSQL database dump complete
--

\unrestrict AqNLMFHW2ltrqNL2BJGP79eV04kJJ8jKcqKxqKe5y5HaAN2g9PDRFw0OEYNETqN

