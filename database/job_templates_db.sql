--
-- PostgreSQL database dump
--

\restrict chRdjDsZARu5Kewt2dUyzaVuZIKzadYdBM05X8Atoci6D5nUf1joHSQ0JfroDS8

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: job_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_templates (
    id integer NOT NULL,
    template_key text NOT NULL,
    job_title text NOT NULL,
    job_description text NOT NULL,
    required_skills text NOT NULL,
    number_of_candidates text NOT NULL,
    survey_question_1 text,
    survey_q1_expected_answer text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.job_templates OWNER TO postgres;

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
-- Name: job_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates ALTER COLUMN id SET DEFAULT nextval('public.job_templates_id_seq'::regclass);


--
-- Data for Name: job_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_templates (id, template_key, job_title, job_description, required_skills, number_of_candidates, survey_question_1, survey_q1_expected_answer, created_at, updated_at) FROM stdin;
1	Template_1	Data Scientist	Data Scientist	Python	2	Are you willing to relocate?	Yes	2025-12-24 08:02:40.725636	2025-12-24 08:02:40.725636
2	Template_2	Data Scientist	Data Scientist	Python, N8N	2	Are you willing to relocate?	Yes	2025-12-24 08:02:40.725636	2025-12-24 08:02:40.725636
\.


--
-- Name: job_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_templates_id_seq', 2, true);


--
-- Name: job_templates job_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_pkey PRIMARY KEY (id);


--
-- Name: job_templates job_templates_template_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_templates
    ADD CONSTRAINT job_templates_template_key_key UNIQUE (template_key);


--
-- PostgreSQL database dump complete
--

\unrestrict chRdjDsZARu5Kewt2dUyzaVuZIKzadYdBM05X8Atoci6D5nUf1joHSQ0JfroDS8

