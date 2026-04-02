-- 1. Departments table
CREATE TABLE IF NOT EXISTS departments (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default departments
INSERT INTO departments (name) VALUES
  ('Engineering'),
  ('Data Science'),
  ('Product'),
  ('Design'),
  ('Marketing'),
  ('Sales'),
  ('Finance'),
  ('Human Resources'),
  ('Operations'),
  ('Legal'),
  ('Customer Support')
ON CONFLICT (name) DO NOTHING;

-- 2. HR Members table
CREATE TABLE IF NOT EXISTS hr_members (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  role  VARCHAR(50) NOT NULL DEFAULT 'HR',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Seed sample HR members
INSERT INTO hr_members (name, email, role) VALUES
  ('Rahul Sharma',    'rahul.sharma@company.com',    'CTO'),
  ('Priya Nair',      'priya.nair@company.com',      'Manager'),
  ('Ankit Verma',     'ankit.verma@company.com',     'Lead'),
  ('Sneha Iyer',      'sneha.iyer@company.com',      'HR'),
  ('Vikram Desai',    'vikram.desai@company.com',    'Director'),
  ('Meera Kapoor',    'meera.kapoor@company.com',    'VP'),
  ('Arjun Reddy',     'arjun.reddy@company.com',     'Manager'),
  ('Kavitha Menon',   'kavitha.menon@company.com',   'HR')
ON CONFLICT DO NOTHING;

-- 4. Add columns to job_postings
ALTER TABLE job_postings
  ADD COLUMN IF NOT EXISTS department       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS hiring_manager   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS interviewer      VARCHAR(100);
