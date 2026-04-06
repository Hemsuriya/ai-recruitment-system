# Changelog — AI Candidate Screening Platform

Last updated: 2026-03-25 | Branch: `hem-updates`

---

## Page Status Overview

| Page | Route | Status | Data Source | Owner |
|------|-------|--------|-------------|-------|
| Login | `/login` | UI Complete | Static (no auth) | PKW |
| Dashboard | `/hr/dashboard` | Filters Live, KPIs Static | API (roles, JID dropdown) | Don / Hemsuriya |
| Candidates List | `/hr/candidates` | Fully Functional | Live API | Hemsuriya |
| Candidate Detail | `/hr/candidates/:id` | Fully Functional | Live API | Hemsuriya |
| Templates | `/hr/templates` | Fully Functional | Live API | Hemsuriya |
| Create Assessment | `/hr/create-assessment` | Fully Functional | Live API | Hemsuriya |
| Settings | `/hr/settings` | UI Complete | Static | PKW |
| ID Verification | `/candidate/id-verification` | UI Complete | Static | Hemsuriya |
| Selfie Verification | `/candidate/selfie-verification` | UI Complete | Static | PKW |
| Assessment Instructions | `/candidate-portal/assessment-instructions` | UI Complete | Static | SD |

---

## Changes by Date

### 2026-03-25 — Templates CRUD, Cascading Filters, Assessment Creation

**Backend:**
- Added `GET /api/job-postings/roles` — returns distinct job titles from job_postings
- Added `GET /api/job-postings/dropdown?job_title=X` — filters JID dropdown by role
- Added `GET /api/job-postings/by-template/:templateId` — get JIDs linked to a template
- Added `POST /api/job-postings/create-assessment` — creates template + job_posting with auto JID in one transaction
- Added `POST /api/job-templates/:key/duplicate` — duplicates a template
- Added `job_title` filter to `GET /api/hr/candidates?job_title=X`
- Updated template service: `time_limit_minutes` in all CRUD operations

**Frontend — Templates Page (`/hr/templates`):**
- Replaced 6 hardcoded cards with real DB data via `GET /api/job-templates`
- Edit button → navigates to Create Assessment in edit mode
- Duplicate button → copies template with "(Copy)" suffix, refreshes list
- Delete button (trash icon) → removes from DB with confirmation dialog
- Use button → navigates to Create Assessment pre-filled with template data
- Shows timer duration on each card

**Frontend — Create Assessment Page (`/hr/create-assessment`):**
- Added timer input (Assessment Timer in minutes, default 30)
- Edit mode: when `?edit=key` in URL, shows "Edit Template" title, updates existing
- New mode: "Generate Assessment" creates template + job_posting, shows auto-generated JID
- Template picker fetches real templates from DB
- Success message with JID and link to Candidates page

**Frontend — Candidates Page (`/hr/candidates`):**
- Added Role dropdown before JID dropdown (cascading filter)
- Selecting a role resets JID filter and re-fetches JID dropdown for that role
- Both filters pass to backend for server-side filtering
- Supports `?template_id=` URL param from Templates "Use" button

**Frontend — Dashboard (`/hr/dashboard`):**
- Replaced hardcoded roles with real `GET /api/job-postings/roles`
- Replaced hardcoded job postings with real `GET /api/job-postings/dropdown`
- Cascading: Role dropdown first → JID dropdown filters to that role
- KPIs, funnel chart, candidate table remain static (separate scope)

**Database:**
- Migration 008: Added `time_limit_minutes INTEGER DEFAULT 30` to `job_templates`

---

### 2026-03-25 — Candidate Detail Page API Integration + JID System

**Backend:**
- Added `job_postings` table with auto-generated JID trigger (`JOB-{YEAR}-{SEQ}`)
- Added `jid` FK column to `candidates_v2` and `video_interview_candidates`
- Created job postings CRUD service, controller, routes at `/api/job-postings`
- Added JID filter to `GET /api/hr/candidates?jid=X`

**Frontend — Candidate Detail Page (`/hr/candidates/:id`):**
- Switched from mock data to live API (`GET /api/hr/candidates/:id`)
- View Details panel: profile, scores, skills, AI summary — all from DB
- AI Insights panel: emotion detection, attention metrics, head/gaze orientation
- Proctoring panel: integrity score, violations flags, risk verdict
- Video panel: plays recording if URL exists, shows duration
- Transcript panel: collapsible interview transcript parsed from DB
- Loading spinner + error states

**Verdict Engine (frontend-computed, not stored in DB):**
- Base verdict from `final_score`: ≥85 Strong Hire, ≥60 Hire, ≥40 Maybe, <40 Reject
- Downgrade for severe proctoring violations (5+ total or 2+ session rejoins): -2 levels
- Downgrade for moderate violations (3+): -1 level
- Downgrade for low security score (<50): -1 level
- Downgrade for low attention (<55%): -1 level
- Downgrade for anxious/fearful emotion + >50% negative: -1 level

**Frontend — Candidates List Page (`/hr/candidates`):**
- Switched from mock data to live API
- JID filter dropdown populated from `/api/job-postings/dropdown`
- Verdict badges dynamically computed

**Database:**
- Migration 007: `job_postings` table with JID auto-generation trigger
- Added `jid` FK to both candidate pipelines
- Seed data: 5 demo candidates with full scores, evaluations, transcripts, emotion data

---

### 2026-03-24 — Frontend Setup + Docker + Merge

- Merged `Don_changes` branch (full frontend pages, layout components, mock data)
- Merged `pkw_changes` branch (settings, selfie verification, assessment instructions, UI fixes)
- Set up frontend Dockerfile (Node 22 Alpine + Vite dev server)
- Added frontend service to `docker-compose.yml`
- Configured Vite with `host: true` for Docker access
- Added path aliases (`@/`, `@components/`, `@features/`, `@mock/`, `@types_/`)
- Created ID Verification page (candidate-facing, static)

---

## API Endpoints Summary

### Candidate-Facing (MCQ Pipeline)
| Method | Route | Status |
|--------|-------|--------|
| POST | `/candidate/create` | Working |
| GET | `/survey/:screening_id` | Working |
| POST | `/survey/submit` | Working |
| POST | `/validation/validate` | Working |
| GET | `/assessment/questions/:candidateId` | Working (via n8n) |
| POST | `/assessment/status` | Working (via n8n) |
| POST | `/assessment/submit` | Working (via n8n) |

### HR Portal
| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/hr/candidates` | Working (supports `?jid=` and `?job_title=` filters) |
| GET | `/api/hr/candidates/:id` | Working (full detail with AI insights) |
| PUT | `/api/hr/candidates/:id/comment` | Working |
| GET | `/api/hr/candidates/search/:term` | Working |

### Job Postings
| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/job-postings` | Working |
| GET | `/api/job-postings/dropdown` | Working (supports `?job_title=` filter) |
| GET | `/api/job-postings/roles` | Working |
| GET | `/api/job-postings/by-template/:templateId` | Working |
| GET | `/api/job-postings/:jid` | Working |
| POST | `/api/job-postings` | Working |
| POST | `/api/job-postings/create-assessment` | Working |
| PUT | `/api/job-postings/:jid` | Working |

### Job Templates
| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/job-templates` | Working |
| GET | `/api/job-templates/:key` | Working |
| POST | `/api/job-templates` | Working |
| POST | `/api/job-templates/:key/duplicate` | Working |
| PUT | `/api/job-templates/:key` | Working |
| DELETE | `/api/job-templates/:key` | Working |

### AI Services
| Method | Route | Port | Status |
|--------|-------|------|--------|
| POST | `/upload-id` | 8000 | Working |
| POST | `/verify-selfie` | 8000 | Working |
| POST | `/analyze` | 5001 | Working |
| GET | `/health` | 8000/5001 | Working |

---

## Database Migrations

| File | Description | Status |
|------|-------------|--------|
| `001_initial_schema.sql` | Core schema (18 tables, functions, triggers) | Applied |
| `002_candidates_and_job_templates.sql` | Candidate profiles & job templates | Applied |
| `002_seed_data.sql` | Default survey questions + Data Scientist template | Applied |
| `003_n8n_db.sql` | Separate n8n database | Applied |
| `003_survey.sql` | Pre-screening survey tables | Applied |
| `004_assessment.sql` | MCQ assessment tables | Applied |
| `005_identity_verification.sql` | Aadhaar verification tables | Applied |
| `006_video_interview.sql` | Video interview pipeline (6 tables) | Applied |
| `007_job_postings.sql` | JID system — job_postings + auto JID trigger + FK additions | Applied |
| `008_template_timer.sql` | time_limit_minutes on job_templates | Applied |

---

## Known Limitations

- Dashboard KPIs, funnel chart, and candidate table are hardcoded (not wired to API)
- Login page has no authentication — any click navigates to dashboard
- n8n workflows don't pass JID yet (candidates created via n8n will have `jid: null`)
- Candidate portal pages (ID verification, selfie, assessment instructions) are static UI only
- No resume/MCQ scores in candidate detail — only video interview data is live
- Settings page is UI only, no backend integration
