-- ============================================================
-- Seed: Initial Data
-- Run after all migrations
-- ============================================================

-- ── Job Templates ─────────────────────────────────────────────
INSERT INTO public.job_templates (template_name, category, description, form_data, created_by) VALUES
(
    'Data Scientist',
    'Data Science',
    'Template for hiring a Data Scientist',
    '{
        "title": "Data Scientist",
        "skills": ["Python", "Machine Learning", "SQL"],
        "experience": "3+ years",
        "survey_question_1": "Are you willing to relocate?",
        "survey_q1_expected_answer": "Yes"
    }',
    'system'
),
(
    'Backend Engineer',
    'Engineering',
    'Template for hiring a Backend Engineer',
    '{
        "title": "Backend Engineer",
        "skills": ["Node.js", "PostgreSQL", "REST APIs"],
        "experience": "2+ years",
        "survey_question_1": "Are you open to hybrid work?",
        "survey_q1_expected_answer": "Yes"
    }',
    'system'
);


-- ── Default Survey Questions (global / non-screening-specific) ─
INSERT INTO public.survey_questions (question_text, question_type, is_qualifying, question_category, validation_type, expected_answer) VALUES
('Are you willing to relocate?',         'yes_no',   true,  'qualifying',    'exact_match', 'Yes'),
('How many years of experience do you have?', 'text', false, 'informational', 'none',        NULL),
('What is your expected salary?',        'text',     false, 'informational', 'none',        NULL);
