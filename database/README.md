# Database

Single PostgreSQL database for all services: `ai_candidate_screening`

n8n uses its own **separate** database managed internally by the n8n container.

---

## Structure

```
database/
├── migrations/
│   ├── 001_initial_schema.sql   ← All table definitions + indexes
│   └── 002_seed_data.sql        ← Default templates + survey questions
├── overalldbbackup.sql          ← Full backup (source of truth)
└── README.md
```

## Tables

### Screening Pipeline (MCQ flow)
| Table | Description |
|---|---|
| `candidates_v2` | Candidate profiles, links to `job_templates` via `template_key` |
| `job_templates` | Job templates created by HR |
| `job_requirements_v2` | Per-candidate job requirements |
| `survey_questions` | Survey questions (global or per-candidate) |
| `survey_responses` | Candidate survey answers |
| `survey_validation_results` | Pass/fail results per candidate |
| `assessment_questions_v2` | AI-generated MCQ questions per candidate |
| `assessment_results_v2` | MCQ scores and answers |

### Identity Verification
| Table | Description |
|---|---|
| `aadhaar_verification` | ID card verification records |
| `verification_audit_log` | Audit trail for all verification events |

### Video Interview Pipeline
| Table | Description |
|---|---|
| `video_interview_candidates` | Candidates invited to video interview |
| `video_interview_questions` | AI-generated video interview questions |
| `video_interview_responses` | Uploaded videos + transcripts |
| `video_interview_evaluations` | AI + HR scores, recommendations |
| `video_job_requirements` | Job config for video interviews |
| `video_analysis_results` | MediaPipe proctoring output |

## Running Migrations

```bash
# Manually
psql -U postgres -d ai_candidate_screening -f migrations/001_initial_schema.sql
psql -U postgres -d ai_candidate_screening -f migrations/002_seed_data.sql
```

## Restore from backup
```bash
psql -U postgres -d ai_candidate_screening -f overalldbbackup.sql
```
