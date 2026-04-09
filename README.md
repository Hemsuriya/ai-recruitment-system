# AI Candidate Screening Platform

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red)]()

An enterprise-grade, AI-powered candidate screening and evaluation platform. Automates the hiring pipeline end-to-end — from resume screening and MCQ assessments to AI-proctored video interviews with real-time emotion detection, gaze tracking, and behavioral analysis.

Built with a microservices architecture: React frontend, Node.js/Express backend, Python AI services (FastAPI + Flask), PostgreSQL, Redis, and n8n workflow automation — fully containerized with Docker Compose.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Services](#services)
- [Getting Started](#getting-started)
- [Frontend](#frontend)
- [Backend API Reference](#backend-api-reference)
- [AI Services](#ai-services)
- [Database Schema](#database-schema)
- [JID System](#jid-system)
- [Verdict Engine](#verdict-engine)
- [n8n Workflows](#n8n-workflows)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Contributing](#contributing)

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React 19 + Vite)                       │
│                            localhost:5173                                  │
│                                                                           │
│   ┌─────────────────────────────┐    ┌──────────────────────────────────┐ │
│   │    HR Dashboard Module      │    │   Candidate Portal Module        │ │
│   │                             │    │                                  │ │
│   │  /hr/dashboard              │    │  /candidate/id-verification      │ │
│   │  /hr/candidates             │    │  /candidate/selfie-verification  │ │
│   │  /hr/candidates/:id ────────┼──► │  /candidate/assessment-          │ │
│   │  /hr/templates              │    │           instructions           │ │
│   │  /hr/create-assessment      │    │                                  │ │
│   │  /hr/settings               │    │  (Standalone layout, no sidebar) │ │
│   │                             │    │                                  │ │
│   │  (HrShell layout + sidebar) │    │                                  │ │
│   └──────────┬──────────────────┘    └──────────────┬───────────────────┘ │
└──────────────┼──────────────────────────────────────┼─────────────────────┘
               │                REST API              │
               ▼                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js / Express 5)                        │
│                           localhost:5000                                   │
│                                                                           │
│   /candidate/*          Candidate-facing MCQ pipeline                     │
│   /survey/*             Pre-screening survey CRUD                         │
│   /validation/*         Survey validation engine                          │
│   /assessment/*         MCQ assessment (via n8n webhooks)                  │
│   /api/hr/candidates    HR candidate listing + detail + JID filtering     │
│   /api/job-templates    Job template CRUD                                 │
│   /api/job-postings     Job postings with auto-generated JID              │
└───────┬─────────────┬──────────────┬──────────────┬───────────────────────┘
        │             │              │              │
        ▼             ▼              ▼              ▼
 ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────────────┐
 │ PostgreSQL │ │  Redis   │ │    n8n     │ │      AI Services         │
 │ :5433      │ │  :6379   │ │   :5678    │ │                          │
 │            │ │          │ │            │ │  ID Verification  :8000  │
 │ 18 tables  │ │ Caching  │ │ 5 workflow │ │  (FastAPI + DeepFace)    │
 │ 2 pipelines│ │ Sessions │ │ automations│ │                          │
 │ JID system │ │          │ │            │ │  Video Analysis   :5001  │
 │            │ │          │ │            │ │  (Flask + MediaPipe)     │
 └────────────┘ └──────────┘ └────────────┘ └──────────────────────────┘
```

---

## Tech Stack

| Layer              | Technology                                                          |
| ------------------ | ------------------------------------------------------------------- |
| **Frontend**       | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4, React Router 7   |
| **Backend**        | Node.js 20, Express 5, PostgreSQL 17, Redis 7.2                    |
| **AI — ID Verify** | Python 3.10, FastAPI, DeepFace, OpenCV, Redis caching               |
| **AI — Video**     | Python 3.10, Flask, MediaPipe, OpenCV                               |
| **Automation**     | n8n 1.97 (workflow engine for AI evaluation + email triggers)       |
| **Infrastructure** | Docker Compose, 7-container orchestration, health checks            |
| **UI Components**  | Lucide React icons, custom design system with CSS variables         |

---

## Project Structure

```
ai-candidate-screening/
│
├── frontend/                            # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layouts/                 # HrShell (sidebar + topbar wrapper)
│   │   │   └── ui/                      # Avatar, ScoreChip
│   │   ├── features/
│   │   │   ├── auth/                    # LoginPage
│   │   │   ├── dashboard/              # DashboardPage (KPIs, pipeline funnel)
│   │   │   ├── assessment/             # CreateAssessmentPage
│   │   │   ├── candidates/             # List + Detail pages (API-driven)
│   │   │   │   ├── hooks/              # useCandidatesList, useCandidateDetail
│   │   │   │   ├── components/         # Table, Row, Filters, Badges
│   │   │   │   └── pages/              # CandidatesListPage, CandidateDetailPage
│   │   │   ├── candidate/             # Candidate-facing (ID verify, selfie)
│   │   │   ├── candidate-portal/      # Assessment instructions
│   │   │   ├── templates/             # TemplatesListPage
│   │   │   └── settings/             # SettingsPage
│   │   ├── services/
│   │   │   └── api.ts                  # Typed API client (candidateApi, jobPostingApi)
│   │   ├── mock/                       # Development mock data
│   │   ├── styles/globals.css          # Design tokens & utility classes
│   │   ├── types/models.ts            # TypeScript interfaces
│   │   ├── App.tsx                     # Route definitions
│   │   └── main.tsx                    # Entry point
│   ├── Dockerfile                      # Node 22 Alpine + Vite dev server
│   ├── vite.config.ts                  # Tailwind plugin + path aliases
│   └── package.json
│
├── backend/                             # Express REST API
│   ├── src/
│   │   ├── config/db.js                # PostgreSQL connection pool
│   │   ├── controllers/                # 6 controllers (candidate, HR, job postings, etc.)
│   │   ├── routes/                     # 6 route modules
│   │   ├── services/                   # Business logic layer
│   │   │   ├── candidateService.js     # MCQ pipeline candidate CRUD
│   │   │   ├── hrCandidateService.js   # HR candidate queries + JID filtering
│   │   │   ├── jobPostingService.js    # Job postings CRUD + dropdown
│   │   │   ├── jobTemplateService.js   # Job template CRUD
│   │   │   ├── surveyService.js        # Survey question management
│   │   │   ├── surveyValidationService.js  # Survey response validation
│   │   │   └── n8nService.js           # n8n webhook integration
│   │   └── app.js                      # Express app (CORS, helmet, rate limiting)
│   ├── server.js                       # HTTP server entry point
│   ├── Dockerfile                      # Node 20 Alpine
│   └── package.json
│
├── ai-services/
│   ├── id-verification/                # FastAPI — DeepFace ID verification
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── video-analysis/                 # Flask — MediaPipe video proctoring
│       ├── video_analysis_api.py
│       ├── requirements.txt
│       └── Dockerfile
│
├── database/
│   ├── migrations/                     # Ordered SQL migrations (001–007)
│   │   ├── 001_initial_schema.sql      # Core schema (18 tables, functions, triggers)
│   │   ├── 002_candidates_and_job_templates.sql
│   │   ├── 003_survey.sql              # Pre-screening survey tables
│   │   ├── 004_assessment.sql          # MCQ assessment tables
│   │   ├── 005_identity_verification.sql
│   │   ├── 006_video_interview.sql     # Video pipeline tables
│   │   ├── 007_job_postings.sql        # JID system (auto-generated Job IDs)
│   │   └── 007_CHANGELOG.md            # Schema change documentation
│   ├── backups/                        # PostgreSQL dump files
│   └── seeds/                          # Demo/test data
│       └── seed_demo_candidate.sql     # 5 complete demo candidates
│
├── workflows/                          # n8n workflow JSON exports
├── scripts/                            # Setup & utility scripts
├── docker-compose.yml                  # 7-service orchestration
├── .env.example                        # Environment variable template
└── README.md
```

---

## Services

| Service              | Container             | Port | Stack                       | Description                                         |
| -------------------- | --------------------- | ---- | --------------------------- | --------------------------------------------------- |
| **Frontend**         | `acs_frontend`        | 5173 | React 19, Vite, Tailwind 4  | HR dashboard + candidate assessment portal          |
| **Backend API**      | `acs_backend`         | 5000 | Node.js 20, Express 5       | REST API, business logic, n8n webhook integration   |
| **PostgreSQL**       | `acs_postgres`        | 5433 | PostgreSQL 17               | Primary database (18 tables, 2 pipelines, JID system) |
| **Redis**            | `acs_redis`           | 6379 | Redis 7.2                   | AI service caching, session store                   |
| **n8n**              | `acs_n8n`             | 5678 | n8n 1.97                    | Workflow automation (evaluation, emails, AI scoring) |
| **ID Verification**  | `acs_id_verification` | 8000 | FastAPI, DeepFace, OpenCV   | Aadhaar/ID document verification via facial recognition |
| **Video Analysis**   | `acs_video_analysis`  | 5001 | Flask, MediaPipe, OpenCV    | Real-time video proctoring & behavioral analysis    |

### Health Checks

```bash
curl http://localhost:5000/health        # Backend
curl http://localhost:8000/health        # ID Verification
curl http://localhost:5001/health        # Video Analysis
```

---

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** v2+
- **Node.js** 20+ (for local development only)
- **Git**

### Quick Start

```bash
# 1. Clone
git clone https://github.com/Hemsuriya-M/AiCandidateScreening.git
cd ai-candidate-screening

# 2. Configure
cp .env.example backend/.env

# 3. Launch all services
docker compose up --build -d

# 4. Verify
docker compose ps

# 5. Apply JID migration (if DB already exists)
docker cp database/migrations/007_job_postings.sql acs_postgres:/tmp/007.sql
docker exec acs_postgres psql -U postgres -d ai_candidate_screening -f /tmp/007.sql

# 6. (Optional) Load demo data
docker cp database/seeds/seed_demo_candidate.sql acs_postgres:/tmp/seed.sql
docker exec acs_postgres psql -U postgres -d ai_candidate_screening -f /tmp/seed.sql
```

### Access Points

| Interface                 | URL                                                |
| ------------------------- | -------------------------------------------------- |
| HR Login                  | http://localhost:5173/login                         |
| HR Dashboard              | http://localhost:5173/hr/dashboard                  |
| Candidates List           | http://localhost:5173/hr/candidates                 |
| Candidate Detail          | http://localhost:5173/hr/candidates/1               |
| Candidate ID Verification | http://localhost:5173/candidate/id-verification     |
| Backend API Root          | http://localhost:5000                               |
| n8n Workflow Editor       | http://localhost:5678                               |

### Stopping Services

```bash
docker compose down           # Stop containers
docker compose down -v        # Stop + delete volumes (full reset)
```

---

## Frontend

### Route Architecture

Two distinct user groups with separate route prefixes and layouts:

**HR Module** (`/hr/*`) — Wrapped in `HrShell` layout with sidebar:

| Route                   | Component            | Data Source | Description                               |
| ----------------------- | -------------------- | ----------- | ----------------------------------------- |
| `/login`                | LoginPage            | Static      | HR authentication                         |
| `/hr/dashboard`         | DashboardPage        | Mock + JID  | Pipeline overview, KPIs, JID filter       |
| `/hr/candidates`        | CandidatesListPage   | **Live API** | Candidate list with JID/verdict/status filters |
| `/hr/candidates/:id`    | CandidateDetailPage  | **Live API** | Scores, AI insights, proctoring, transcript |
| `/hr/templates`         | TemplatesListPage    | API         | Reusable job assessment templates         |
| `/hr/create-assessment` | CreateAssessmentPage | Static      | AI-powered assessment builder             |
| `/hr/settings`          | SettingsPage         | Static      | Platform configuration                    |

**Candidate Portal** (`/candidate/*`) — Standalone layout, no sidebar:

| Route                                | Component                | Description                      |
| ------------------------------------ | ------------------------ | -------------------------------- |
| `/candidate/id-verification`         | IdVerificationPage       | Aadhaar/ID upload & verification |
| `/candidate/selfie-verification`     | SelfieVerificationPage   | Live selfie capture & matching   |
| `/candidate/assessment-instructions` | AssessmentInstructionsPage | Pre-assessment guidelines       |

### API Integration

The candidates pages use a typed API client at `frontend/src/services/api.ts`:

```typescript
// Fetch all candidates (with optional JID filter)
candidateApi.getAll(jid?: string)

// Fetch single candidate detail (scores, proctoring, transcript, AI insights)
candidateApi.getById(id)

// Job postings dropdown for filters
jobPostingApi.getDropdown()
```

### Path Aliases

```
@/*           → src/*
@components/* → src/components/*
@features/*   → src/features/*
@mock/*        → src/mock/*
@types_/*      → src/types/*
```

---

## Backend API Reference

### Candidate-Facing Endpoints (MCQ Pipeline)

| Method | Route                                | Description                          |
| ------ | ------------------------------------ | ------------------------------------ |
| POST   | `/candidate/create`                  | Register candidate (accepts `jid`)   |
| GET    | `/survey/:screening_id`              | Fetch pre-screening survey questions |
| POST   | `/survey/submit`                     | Submit survey responses              |
| POST   | `/validation/validate`               | Validate survey & unlock assessment  |
| GET    | `/assessment/questions/:candidateId` | Fetch AI-generated MCQ questions     |
| POST   | `/assessment/status`                 | Update assessment progress           |
| POST   | `/assessment/submit`                 | Submit final assessment results      |

### HR Portal Endpoints

| Method | Route                               | Description                                  |
| ------ | ----------------------------------- | -------------------------------------------- |
| GET    | `/api/hr/candidates`                | List all evaluated candidates                |
| GET    | `/api/hr/candidates?jid=JOB-2026-001` | Filter candidates by Job ID              |
| GET    | `/api/hr/candidates/:id`            | Full candidate detail (scores, AI, transcript) |
| PUT    | `/api/hr/candidates/:id/comment`    | Update HR decision comment                   |
| GET    | `/api/hr/candidates/search/:term`   | Search by name, email, phone                 |

### Job Postings Endpoints

| Method | Route                      | Description                           |
| ------ | -------------------------- | ------------------------------------- |
| GET    | `/api/job-postings`        | List all job postings                 |
| GET    | `/api/job-postings/dropdown` | Dropdown data for filter UIs        |
| GET    | `/api/job-postings/:jid`   | Get posting by JID                    |
| POST   | `/api/job-postings`        | Create posting (JID auto-generated)   |
| PUT    | `/api/job-postings/:jid`   | Update posting status/title           |

### Job Templates Endpoints

| Method | Route                      | Description                    |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/api/job-templates`       | List all templates             |
| GET    | `/api/job-templates/:id`   | Get template by ID             |
| POST   | `/api/job-templates`       | Create template                |
| PUT    | `/api/job-templates/:id`   | Update template                |
| DELETE | `/api/job-templates/:id`   | Delete template                |

---

## AI Services

### ID Verification Service (Port 8000)

FastAPI service using **DeepFace** for facial recognition and ID document verification.

| Method | Endpoint         | Description                            |
| ------ | ---------------- | -------------------------------------- |
| POST   | `/upload-id`     | Upload and store candidate ID document |
| POST   | `/verify-selfie` | Verify live selfie against stored ID   |
| GET    | `/health`        | Service health check                   |

**Capabilities:** Face detection, facial similarity scoring, Redis caching for verification results, fallback to disk cache, OpenCV image preprocessing.

### Video Analysis Service (Port 5001)

Flask service using **MediaPipe** for real-time behavioral analysis during video interviews.

| Method | Endpoint         | Description                                    |
| ------ | ---------------- | ---------------------------------------------- |
| POST   | `/analyze`       | Analyze interview video for proctoring signals |
| POST   | `/test-download` | Test OneDrive video download pipeline          |
| GET    | `/health`        | Service health check                           |

**Analysis Outputs:**
- **Emotion Detection** — happy, sad, angry, fearful, neutral, surprised percentages + dominant emotion
- **Attention Metrics** — attention percentage, speaking confidence, eye contact score, engagement level
- **Face Detection** — head pose status, gaze direction, face confidence score
- **Violations Summary** — tab switches, audio anomalies, looking away count, session rejoins

---

## Database Schema

**PostgreSQL 17** with 18 tables across 2 candidate pipelines + JID system.

### Table Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        JID SYSTEM                                │
│  job_postings ──────────────────────────────────────────────────┤
│  (JID auto-generated: JOB-2026-001)                             │
│       │                                                          │
│       ├──► candidates_v2.jid (MCQ pipeline)                      │
│       └──► video_interview_candidates.jid (Video pipeline)       │
└─────────────────────────────────────────────────────────────────┘

┌─── MCQ Pipeline ──────────────┐  ┌─── Video Pipeline ────────────┐
│ candidates_v2 (screening_id)  │  │ video_interview_candidates    │
│   ├── job_requirements_v2     │  │  (video_assessment_id)        │
│   ├── survey_questions        │  │   ├── video_job_requirements  │
│   ├── survey_responses        │  │   ├── video_interview_questions│
│   ├── survey_validation       │  │   ├── video_interview_responses│
│   ├── assessment_questions_v2 │  │   ├── video_interview_evals   │
│   ├── assessment_results_v2   │  │   └── video_analysis_results  │
│   ├── aadhaar_verification    │  │                                │
│   └── verification_audit_log  │  │                                │
└───────────────────────────────┘  └────────────────────────────────┘

┌─── Shared ────────────────────┐
│ job_templates                 │
│ job_postings (JID)            │
└───────────────────────────────┘
```

### Migrations

| Migration | Description |
| --------- | ----------- |
| `001_initial_schema.sql` | Core schema — all 16 tables, functions, triggers, indexes |
| `002_candidates_and_job_templates.sql` | Candidate profiles & reusable job templates |
| `003_survey.sql` | Pre-screening survey questions, responses, validation |
| `004_assessment.sql` | MCQ assessment questions & results |
| `005_identity_verification.sql` | Aadhaar verification records & audit trail |
| `006_video_interview.sql` | Video interview pipeline (6 tables) |
| `007_job_postings.sql` | **JID system** — `job_postings` table with auto-generated JID trigger, FK additions to both pipelines |

---

## JID System

**JID (Job ID)** is the unified identifier linking both candidate pipelines to specific hiring cycles.

### How It Works

1. **Auto-generated** via PostgreSQL trigger: `JOB-{YEAR}-{SEQ}` (e.g., `JOB-2026-001`, `JOB-2026-002`)
2. **`job_postings` table** stores job title, status (`draft`/`open`/`closed`/`archived`), date range, and links to `job_templates`
3. Both `candidates_v2.jid` and `video_interview_candidates.jid` reference `job_postings.jid`
4. **API filtering**: `GET /api/hr/candidates?jid=JOB-2026-001` returns only candidates for that job
5. **Frontend**: JID dropdown in Candidates list page and Dashboard fetches from `/api/job-postings/dropdown`

### Creating a Job Posting

```bash
curl -X POST http://localhost:5000/api/job-postings \
  -H "Content-Type: application/json" \
  -d '{"job_title": "ML Engineer", "status": "open"}'

# Response: { "jid": "JOB-2026-001", "job_title": "ML Engineer", ... }
```

---

## Verdict Engine

Candidate verdicts are **auto-computed** on the frontend — not stored in the database. The algorithm factors in multiple signals:

### Scoring Logic

```
Base Verdict (from final_score):
  ≥ 85  →  Strong Hire
  ≥ 60  →  Hire
  ≥ 40  →  Maybe
  < 40  →  Reject

Downgrade Modifiers:
  Severe violations (5+ total OR 2+ session rejoins)    →  -2 levels
  Moderate violations (3+)                               →  -1 level
  Low security score (< 50)                              →  -1 level
  Low attention (< 55%)                                  →  -1 level
  Anxious/fearful emotion + >50% negative sentiment      →  -1 level
```

### Data Sources

| Signal | Source Table | Key Fields |
| ------ | ----------- | ---------- |
| Final Score | `video_interview_evaluations` | `final_score`, `interview_score`, `security_score` |
| Proctoring Violations | `video_analysis_results` | `violations_summary` (tab switches, audio anomalies, rejoins) |
| Emotion Analysis | `video_analysis_results` | `emotion_analysis` (dominant emotion, negative %) |
| Attention Metrics | `video_analysis_results` | `attention_metrics` (attention %, speaking confidence) |
| Security Details | `video_interview_evaluations` | `security_details`, `security_severity` |

---

## n8n Workflows

Imported via the n8n UI at http://localhost:5678.

| Workflow | Purpose |
| -------- | ------- |
| `aicandidatescreeningv1_2.json` | Core screening pipeline orchestration |
| `Evaluation_with_HIL_New.json` | Human-in-the-loop AI evaluation with score aggregation |
| `Video_Interview___Question_Generation_and_email.json` | AI question generation + candidate email trigger |
| `Video_Upload_and_Mediapipe_analysis_v2.json` | Video upload → MediaPipe analysis pipeline |
| `Curl_Automation.json` | API testing & automation scripts |

### Importing

```bash
# Via n8n UI:
# 1. Open http://localhost:5678
# 2. Workflows → Import from File
# 3. Select JSON files from /workflows directory
```

---

## Environment Variables

Copy `.env.example` to `backend/.env`:

```env
# ─── Backend Server ─────────────────────────────────
PORT=5000

# ─── PostgreSQL ─────────────────────────────────────
DB_HOST=localhost              # 'postgres' in Docker
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=ai_candidate_screening

# ─── Redis ──────────────────────────────────────────
REDIS_HOST=127.0.0.1           # 'redis' in Docker
REDIS_PORT=6379

# ─── n8n Webhooks ───────────────────────────────────
N8N_BASE_URL=http://localhost:5678
N8N_GET_QUESTIONS_WEBHOOK=/webhook/get-assessment-questions
N8N_UPDATE_STATUS_WEBHOOK=/webhook/update-assessment-status
N8N_SUBMIT_RESULTS_WEBHOOK=/webhook/assessment-results

# ─── AI Services ────────────────────────────────────
REDIS_DB=0
REDIS_TTL_SECONDS=3600
REDIS_ENABLED=true
VIDEO_ANALYSIS_PORT=5001
```

> Docker Compose automatically overrides `DB_HOST`, `REDIS_HOST`, and `N8N_BASE_URL` with container service names.

---

## Development

### Local Frontend Development

```bash
cd frontend
npm install
npm run dev                    # Vite dev server → http://localhost:5173
```

### Running the Migration

```bash
# Inside Docker
docker cp database/migrations/007_job_postings.sql acs_postgres:/tmp/007.sql
docker exec acs_postgres psql -U postgres -d ai_candidate_screening -f /tmp/007.sql

# Local PostgreSQL
psql -U postgres -d ai_candidate_screening -f database/migrations/007_job_postings.sql
```

### Loading Demo Data

```bash
docker cp database/seeds/seed_demo_candidate.sql acs_postgres:/tmp/seed.sql
docker exec acs_postgres psql -U postgres -d ai_candidate_screening -f /tmp/seed.sql
```

Creates 5 demo candidates with complete data: 3 job postings, evaluation scores, emotion analysis, attention metrics, proctoring flags, and full interview transcripts.

### Database Backup

```bash
docker exec acs_postgres pg_dump -U postgres ai_candidate_screening > database/backups/backup_$(date +%Y%m%d).sql
```

---

## Contributing

1. Create a feature branch from `main`
2. Follow existing code patterns and TypeScript conventions
3. Ensure `tsc -b` and `vite build` pass before submitting
4. Use conventional commit messages (`feat:`, `fix:`, `refactor:`, `docs:`)
5. Test with `docker compose up --build` before merging
6. Reference the [007_CHANGELOG.md](database/migrations/007_CHANGELOG.md) for recent schema changes

### Branch Strategy

| Branch | Purpose |
| ------ | ------- |
| `main` | Single production branch — all features consolidated |

---

**Built with AI-powered screening technology.**
