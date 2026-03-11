-- =============================================================================
-- AI Candidate Screening — Seed Data
-- Migration: 002_seed_data.sql
-- =============================================================================

-- Default survey questions (global, not tied to a specific candidate)
INSERT INTO public.survey_questions (question_text, question_type, is_qualifying, question_category, validation_type)
VALUES
    ('Are you willing to relocate?',            'text', true,  'qualifying',     'exact_match'),
    ('How many years of experience do you have?','text', true,  'qualifying',     'none'),
    ('What is your notice period?',              'text', false, 'informational',  'none'),
    ('Are you open to contract roles?',          'text', false, 'informational',  'none')
ON CONFLICT DO NOTHING;

-- Default job template
INSERT INTO public.job_templates (
    template_key, job_title, job_description, required_skills,
    number_of_candidates, survey_question_1, survey_q1_expected_answer,
    template_name, category, is_active
)
VALUES (
    'Template_DataScientist',
    'Data Scientist',
    'We are looking for a Data Scientist with strong Python and ML skills.',
    'Python, Machine Learning, SQL',
    '5',
    'Are you willing to relocate?',
    'Yes',
    'Data Scientist Template',
    'Data Science',
    true
)
ON CONFLICT (template_key) DO NOTHING;
