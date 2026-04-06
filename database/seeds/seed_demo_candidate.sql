-- ============================================================
-- Demo Seed: Complete candidate data for Candidates Detail Page
-- Run: psql -U postgres -d ai_candidate_screening -f seed_demo_candidate.sql
-- ============================================================

-- ── 1. Ensure job postings exist ─────────────────────────────
INSERT INTO job_postings (jid, job_title, status, opens_at, created_by)
VALUES
  ('JOB-2026-001', 'ML Engineer', 'open', '2026-03-01', 'HR Team'),
  ('JOB-2026-002', 'Senior Frontend Engineer', 'open', '2026-03-10', 'HR Team'),
  ('JOB-2026-003', 'Backend Engineer', 'open', '2026-03-15', 'HR Team')
ON CONFLICT (jid) DO NOTHING;

-- ── 2. Insert video interview candidates ─────────────────────
INSERT INTO video_interview_candidates
  (video_assessment_id, name, email, phone, location, job_title, jid, status, interview_started, interview_completed, videos_uploaded)
VALUES
  ('VA-DEMO-001', 'Sarah Chen', 'sarah.chen@email.com', '+1-555-234-5678', 'San Francisco, CA', 'ML Engineer', 'JOB-2026-001', 'completed', true, true, true),
  ('VA-DEMO-002', 'James Wilson', 'james.wilson@email.com', '+1-555-345-6789', 'New York, NY', 'Senior Frontend Engineer', 'JOB-2026-002', 'completed', true, true, true),
  ('VA-DEMO-003', 'Priya Sharma', 'priya.sharma@email.com', '+91-98765-43210', 'Bangalore, India', 'ML Engineer', 'JOB-2026-001', 'completed', true, true, true),
  ('VA-DEMO-004', 'Michael Park', 'michael.park@email.com', '+1-555-456-7890', 'Austin, TX', 'Backend Engineer', 'JOB-2026-003', 'completed', true, true, true),
  ('VA-DEMO-005', 'Emily Rodriguez', 'emily.rodriguez@email.com', '+1-555-567-8901', 'Seattle, WA', 'Senior Frontend Engineer', 'JOB-2026-002', 'completed', true, true, true)
ON CONFLICT (video_assessment_id) DO NOTHING;

-- ── 3. Insert evaluations (scores, strengths, weaknesses) ────
INSERT INTO video_interview_evaluations
  (video_assessment_id, interview_score, security_score, final_score,
   question_scores, security_violations_count, security_severity, security_details,
   strengths, weaknesses, overall_feedback, recommendation)
VALUES
  ('VA-DEMO-001', 92, 95, 93,
   '{"communication": 94, "confidence": 90, "technical_clarity": 96, "skill_match": 92}'::jsonb,
   0, 'low',
   '{"tab_switches": 0, "audio_anomalies": 0, "session_rejoins": 0}'::jsonb,
   ARRAY['Exceptional ML systems knowledge with production experience', 'Clear and confident communication style', 'Strong problem-solving approach with real-world examples'],
   ARRAY['Could elaborate more on cross-team collaboration', 'Limited experience with streaming data pipelines'],
   'Outstanding candidate with deep ML expertise. Demonstrated strong technical clarity and production-level thinking. Highly recommended for senior ML role.',
   'hire'),

  ('VA-DEMO-002', 85, 88, 86,
   '{"communication": 88, "confidence": 82, "technical_clarity": 87, "skill_match": 84}'::jsonb,
   1, 'low',
   '{"tab_switches": 1, "audio_anomalies": 0, "session_rejoins": 0}'::jsonb,
   ARRAY['Excellent React and TypeScript expertise', 'Strong understanding of design systems and accessibility', 'Good articulation of architecture decisions'],
   ARRAY['Slightly nervous during system design questions', 'Could improve on backend integration knowledge'],
   'Strong frontend candidate with solid design system experience. Good cultural fit. Recommended for hire.',
   'hire'),

  ('VA-DEMO-003', 78, 70, 74,
   '{"communication": 75, "confidence": 72, "technical_clarity": 82, "skill_match": 78}'::jsonb,
   3, 'medium',
   '{"tab_switches": 2, "audio_anomalies": 1, "session_rejoins": 0}'::jsonb,
   ARRAY['Good theoretical ML knowledge', 'Familiarity with PyTorch and TensorFlow'],
   ARRAY['Limited production deployment experience', 'Some hesitation on system design questions', 'Proctoring flagged minor attention issues'],
   'Decent candidate with good fundamentals but lacks production experience. May need mentoring. Consider for junior-mid level role.',
   'maybe'),

  ('VA-DEMO-004', 88, 92, 90,
   '{"communication": 86, "confidence": 90, "technical_clarity": 92, "skill_match": 88}'::jsonb,
   0, 'low',
   '{"tab_switches": 0, "audio_anomalies": 0, "session_rejoins": 0}'::jsonb,
   ARRAY['Strong distributed systems knowledge', 'Excellent API design thinking', 'Clear communication with good examples from production'],
   ARRAY['Limited experience with event-driven architectures', 'Could improve on database optimization topics'],
   'Very strong backend candidate with excellent systems thinking. Clean proctoring. Highly recommended.',
   'hire'),

  ('VA-DEMO-005', 55, 60, 57,
   '{"communication": 60, "confidence": 48, "technical_clarity": 55, "skill_match": 52}'::jsonb,
   5, 'high',
   '{"tab_switches": 3, "audio_anomalies": 2, "session_rejoins": 1}'::jsonb,
   ARRAY['Basic React knowledge', 'Willingness to learn'],
   ARRAY['Significant gaps in TypeScript knowledge', 'Struggled with component architecture questions', 'Multiple proctoring violations detected', 'Low confidence throughout interview'],
   'Candidate struggled with core frontend concepts and had multiple proctoring flags. Not recommended at this time.',
   'reject')
ON CONFLICT (video_assessment_id) DO NOTHING;

-- ── 4. Insert video analysis results (emotion, attention, face) ──
INSERT INTO video_analysis_results
  (video_assessment_id, emotion_analysis, attention_metrics, face_detection,
   violations_summary, analysis_status, frames_processed, video_duration_seconds)
VALUES
  ('VA-DEMO-001',
   '{"dominant_emotion": "Confident", "happy": 35, "neutral": 55, "surprised": 5, "sad": 2, "angry": 0, "fearful": 3, "positive_percentage": 35, "neutral_percentage": 55, "negative_percentage": 10}'::jsonb,
   '{"attention_percentage": 96, "speaking_confidence": 92, "eye_contact_score": 94, "head_orientation": "Centered", "engagement_level": "High"}'::jsonb,
   '{"face_detected": true, "head_pose_status": "Stable - Centered", "gaze_status": "Direct eye contact", "face_confidence": 0.98}'::jsonb,
   '{"tab_switches": 0, "audio_anomalies": 0, "looking_away_count": 2, "total_violations": 0}'::jsonb,
   'completed', 12500, 2520),

  ('VA-DEMO-002',
   '{"dominant_emotion": "Neutral", "happy": 25, "neutral": 60, "surprised": 8, "sad": 2, "angry": 0, "fearful": 5, "positive_percentage": 25, "neutral_percentage": 60, "negative_percentage": 15}'::jsonb,
   '{"attention_percentage": 89, "speaking_confidence": 84, "eye_contact_score": 86, "head_orientation": "Mostly Centered", "engagement_level": "Good"}'::jsonb,
   '{"face_detected": true, "head_pose_status": "Mostly Centered", "gaze_status": "Mostly direct", "face_confidence": 0.95}'::jsonb,
   '{"tab_switches": 1, "audio_anomalies": 0, "looking_away_count": 5, "total_violations": 1}'::jsonb,
   'completed', 11000, 2340),

  ('VA-DEMO-003',
   '{"dominant_emotion": "Nervous", "happy": 10, "neutral": 45, "surprised": 12, "sad": 8, "angry": 2, "fearful": 23, "positive_percentage": 10, "neutral_percentage": 45, "negative_percentage": 45}'::jsonb,
   '{"attention_percentage": 72, "speaking_confidence": 65, "eye_contact_score": 68, "head_orientation": "Occasional drift", "engagement_level": "Moderate"}'::jsonb,
   '{"face_detected": true, "head_pose_status": "Occasional drift left", "gaze_status": "Intermittent eye contact", "face_confidence": 0.88}'::jsonb,
   '{"tab_switches": 2, "audio_anomalies": 1, "looking_away_count": 15, "total_violations": 3}'::jsonb,
   'completed', 9800, 2100),

  ('VA-DEMO-004',
   '{"dominant_emotion": "Confident", "happy": 30, "neutral": 58, "surprised": 5, "sad": 2, "angry": 0, "fearful": 5, "positive_percentage": 30, "neutral_percentage": 58, "negative_percentage": 12}'::jsonb,
   '{"attention_percentage": 94, "speaking_confidence": 91, "eye_contact_score": 92, "head_orientation": "Centered", "engagement_level": "High"}'::jsonb,
   '{"face_detected": true, "head_pose_status": "Stable - Centered", "gaze_status": "Consistent eye contact", "face_confidence": 0.97}'::jsonb,
   '{"tab_switches": 0, "audio_anomalies": 0, "looking_away_count": 3, "total_violations": 0}'::jsonb,
   'completed', 13200, 2700),

  ('VA-DEMO-005',
   '{"dominant_emotion": "Anxious", "happy": 5, "neutral": 30, "surprised": 15, "sad": 15, "angry": 5, "fearful": 30, "positive_percentage": 5, "neutral_percentage": 30, "negative_percentage": 65}'::jsonb,
   '{"attention_percentage": 52, "speaking_confidence": 40, "eye_contact_score": 45, "head_orientation": "Frequent drift", "engagement_level": "Low"}'::jsonb,
   '{"face_detected": true, "head_pose_status": "Frequent drift right", "gaze_status": "Frequently looking away", "face_confidence": 0.78}'::jsonb,
   '{"tab_switches": 3, "audio_anomalies": 2, "looking_away_count": 28, "total_violations": 5}'::jsonb,
   'completed', 7500, 1800)
ON CONFLICT (video_assessment_id) DO NOTHING;

-- ── 5. Insert video responses (skip if already exists) (transcript, video URL) ────────
INSERT INTO video_interview_responses
  (video_assessment_id, full_transcript, video_url, video_duration)
VALUES
  ('VA-DEMO-001',
   '[{"time":"0:05","speaker":"Interviewer","message":"Welcome! Please start by introducing yourself and your background."},{"time":"0:20","speaker":"Candidate","message":"Hi, thanks for having me. I have spent the last 8 years building production ML systems, most recently at Google where I led the recommendations infrastructure team."},{"time":"2:10","speaker":"Interviewer","message":"Can you walk me through a challenging technical problem you solved recently?"},{"time":"2:28","speaker":"Candidate","message":"Sure. We had a severe model latency regression after a schema change. I set up incremental A/B shadow testing to isolate the regression and rolled back a feature transformation layer within 2 hours."},{"time":"7:45","speaker":"Interviewer","message":"How do you approach performance monitoring in production ML pipelines?"},{"time":"8:02","speaker":"Candidate","message":"I combine offline KPIs with real-time online metrics, and use custom alerting thresholds based on historical drift patterns. Grafana dashboards for visibility, PagerDuty for escalation."},{"time":"15:00","speaker":"Interviewer","message":"Tell me about a time you had to make a difficult technical tradeoff."},{"time":"15:18","speaker":"Candidate","message":"We had to choose between model accuracy and latency for a real-time recommendation system. I proposed a two-tier approach: a fast lightweight model for initial candidates, then a heavier model for re-ranking the top results. This gave us 95% of the accuracy at 10x the speed."},{"time":"25:30","speaker":"Interviewer","message":"How do you handle model versioning and deployment?"},{"time":"25:48","speaker":"Candidate","message":"We use MLflow for experiment tracking, DVC for data versioning, and a custom CI/CD pipeline that runs shadow traffic tests before any production deployment. Every model has automated rollback triggers based on key metrics."}]'::jsonb,
   NULL, 2520),

  ('VA-DEMO-002',
   '[{"time":"0:08","speaker":"Interviewer","message":"Thanks for joining us today. Tell us about yourself."},{"time":"0:22","speaker":"Candidate","message":"Of course! I am a frontend engineer with 6 years experience, currently at Stripe. I specialize in design systems and high-performance React applications."},{"time":"3:15","speaker":"Interviewer","message":"How do you handle state management at scale?"},{"time":"3:30","speaker":"Candidate","message":"I lean on Zustand for global state and React Query for server state. Context API only for truly static config. The key is avoiding prop drilling without over-engineering."},{"time":"9:00","speaker":"Interviewer","message":"What is your philosophy on accessibility?"},{"time":"9:18","speaker":"Candidate","message":"Accessibility is non-negotiable. WCAG AA as minimum baseline, semantic HTML first, then ARIA only when native elements fall short. I write axe-core tests in CI."},{"time":"18:00","speaker":"Interviewer","message":"How would you architect a micro-frontend system?"},{"time":"18:20","speaker":"Candidate","message":"I would use Module Federation with Webpack 5. Each team owns their micro-app with independent deployments. Shared design system via an npm package. The shell app handles routing and authentication."}]'::jsonb,
   NULL, 2340),

  ('VA-DEMO-003',
   '[{"time":"0:06","speaker":"Interviewer","message":"Good to have you here. Walk us through your experience in ML."},{"time":"0:21","speaker":"Candidate","message":"I have been working in ML for about 3 years. Mostly focused on computer vision projects using PyTorch. I have built image classification and object detection models."},{"time":"5:00","speaker":"Interviewer","message":"Can you explain how you would deploy an ML model to production?"},{"time":"5:22","speaker":"Candidate","message":"Um, I would probably use Flask to wrap the model as an API... and then deploy it on a server. Maybe use Docker."},{"time":"12:00","speaker":"Interviewer","message":"How do you handle model monitoring in production?"},{"time":"12:30","speaker":"Candidate","message":"I have not actually deployed many models to production yet. In my projects I mostly evaluate models offline using test sets. But I know tools like MLflow exist for this."}]'::jsonb,
   NULL, 2100),

  ('VA-DEMO-004',
   '[{"time":"0:05","speaker":"Interviewer","message":"Welcome! Tell us about your backend engineering experience."},{"time":"0:18","speaker":"Candidate","message":"I have 7 years of backend experience, primarily in Go and Java. Currently at Uber where I work on the payments processing platform handling millions of transactions daily."},{"time":"4:00","speaker":"Interviewer","message":"How do you design systems for high availability?"},{"time":"4:15","speaker":"Candidate","message":"I follow the principle of designing for failure. Circuit breakers, retry with exponential backoff, bulkhead isolation. We use multi-region deployments with active-active configuration and automatic failover."},{"time":"12:00","speaker":"Interviewer","message":"Walk me through your approach to API design."},{"time":"12:20","speaker":"Candidate","message":"I am a strong advocate for REST with clear resource modeling. Versioning via URL path, consistent error responses, pagination with cursor-based approach for large datasets. I document everything with OpenAPI specs."},{"time":"22:00","speaker":"Interviewer","message":"How do you handle database scaling?"},{"time":"22:18","speaker":"Candidate","message":"We use a combination of read replicas for read-heavy workloads, connection pooling with PgBouncer, and strategic denormalization. For truly large scale, we partition by geography and use CockroachDB for global consistency."}]'::jsonb,
   NULL, 2700),

  ('VA-DEMO-005',
   '[{"time":"0:10","speaker":"Interviewer","message":"Hi, tell us about your frontend experience."},{"time":"0:30","speaker":"Candidate","message":"I have been learning React for about a year. I have done some projects in a bootcamp."},{"time":"3:00","speaker":"Interviewer","message":"How would you manage component state in a complex form?"},{"time":"3:25","speaker":"Candidate","message":"I would use... useState I think? For each field. Or maybe a form library... I am not sure which one."},{"time":"8:00","speaker":"Interviewer","message":"Can you explain the difference between useEffect and useLayoutEffect?"},{"time":"8:30","speaker":"Candidate","message":"Um, I think useEffect runs after render and useLayoutEffect... I am not really sure about the difference honestly."}]'::jsonb,
   NULL, 1800);
