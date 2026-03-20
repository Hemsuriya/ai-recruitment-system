# AI Candidate Screening Platform

An enterprise-grade, AI-powered candidate screening and evaluation platform. Built with a microservices architecture combining a React frontend, Node.js backend, Python AI services, PostgreSQL, Redis, and n8n workflow automation — fully containerized with Docker Compose.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Services](#services)
- [Getting Started](#getting-started)
- [Frontend](#frontend)
- [Backend API](#backend-api)
- [AI Services](#ai-services)
- [Database](#database)
- [n8n Workflows](#n8n-workflows)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                      │
│                         localhost:5173                              │
│  ┌──────────────────────────┐  ┌──────────────────────────────────┐ │
│  │   HR Dashboard Module    │  │   Candidate Assessment Module    │ │
│  │  /hr/dashboard           │  │  /candidate/id-verification      │ │
│  │  /hr/candidates          │  │  /candidate/assessment (planned) │ │
│  │  /hr/templates           │  │  /candidate/interview  (planned) │ │
│  │  /hr/create-assessment   │  │                                  │ │
│  └──────────┬───────────────┘  └──────────────┬───────────────────┘ │
└─────────────┼─────────────────────────────────┼─────────────────────┘
              │              REST API            │
              ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js / Express)                     │
│                         localhost:5000                              │
└──────┬──────────────┬──────────────┬──────────────┬─────────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐
│ PostgreSQL │ │   Redis    │ │    n8n     │ │  AI Services   │
│  :5433     │ │   :6379    │ │   :5678    │ │ :8000 / :5001  │
└────────────┘ └────────────┘ └────────────┘ └────────────────┘
```

---

## Tech Stack

| Layer              | Technology                                            |
| ------------------ | ----------------------------------------------------- |
| **Frontend**       | React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4      |
| **Backend**        | Node.js 20, Express 5, PostgreSQL 17, Redis 7         |
| **AI – ID Verify** | Python 3.10, FastAPI, DeepFace, OpenCV, Redis caching |
| **AI – Video**     | Python 3.10, Flask, MediaPipe, OpenCV                 |
| **Automation**     | n8n 1.97 (workflow engine)                            |
| **Infrastructure** | Docker Compose, multi-container orchestration         |
| **Routing**        | React Router v7                                       |
| **Icons**          | Lucide React                                          |

---

## Project Structure

```
ai-candidate-screening/
│
├── frontend/                          # React + Vite frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layouts/               # HrShell, HrLayout (HR sidebar + topbar)
│   │   │   ├── layout/                # Sidebar, Topbar components
│   │   │   └── ui/                    # Reusable UI components (Avatar, ScoreChip)
│   │   ├── features/
│   │   │   ├── auth/                  # LoginPage
│   │   │   ├── dashboard/             # DashboardPage (HR overview)
│   │   │   ├── assessment/            # CreateAssessmentPage (HR)
│   │   │   ├── candidates/            # CandidatesListPage, CandidateDetailPage (HR)
│   │   │   └── candidate/             # Candidate-facing pages
│   │   │       └── pages/
│   │   │           └── IdVerificationPage.tsx
│   │   ├── mock/                      # Mock data for development
│   │   ├── styles/                    # Global CSS, design tokens
│   │   ├── types/                     # TypeScript type definitions
│   │   ├── App.tsx                    # Route definitions
│   │   └── main.tsx                   # Application entry point
│   ├── hr/Templates/                  # HR job template components
│   ├── public/                        # Static assets
│   ├── Dockerfile                     # Frontend container config
│   ├── vite.config.ts                 # Vite + Tailwind + path aliases
│   ├── tsconfig.json                  # TypeScript project references
│   ├── tsconfig.app.json              # App-level TS config
│   └── package.json
│
├── backend/                           # Node.js Express API server
│   ├── src/
│   │   ├── config/                    # Database & service configuration
│   │   ├── controllers/               # Route handlers
│   │   ├── routes/                    # Express route definitions
│   │   ├── services/                  # Business logic layer
│   │   └── app.js                     # Express app setup
│   ├── server.js                      # Server entry point
│   ├── Dockerfile
│   └── package.json
│
├── ai-services/
│   ├── id-verification/               # FastAPI service for ID document verification
│   │   ├── main.py                    # FastAPI app (DeepFace + OpenCV)
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── video-analysis/                # Flask service for video proctoring
│       ├── video_analysis_api.py      # Flask app (MediaPipe + OpenCV)
│       ├── requirements.txt
│       └── Dockerfile
│
├── database/
│   ├── migrations/                    # SQL migration scripts (ordered)
│   │   ├── 001_initial_schema.sql     # Core tables & functions
│   │   ├── 001_create_functions.sql   # Database functions
│   │   ├── 002_candidates_and_job_templates.sql
│   │   ├── 002_seed_data.sql          # Initial seed data
│   │   ├── 003_n8n_db.sql             # n8n database creation
│   │   ├── 003_survey.sql             # Pre-screening survey tables
│   │   ├── 004_assessment.sql         # Assessment tables
│   │   ├── 005_identity_verification.sql
│   │   └── 006_video_interview.sql
│   ├── backups/                       # Database backup dumps
│   └── seeds/                         # Seed data scripts
│
├── workflows/                         # n8n workflow JSON exports
│   ├── aicandidatescreeningv1_2.json
│   ├── Evaluation_with_HIL_New.json
│   ├── Video_Interview___Question_Generation_and_email.json
│   ├── Video_Upload_and_Mediapipe_analysis_v2.json
│   └── Curl_Automation.json
│
├── scripts/                           # Setup & utility scripts
├── docker-compose.yml                 # Multi-container orchestration
├── .env.example                       # Environment variable template
└── README.md
```

---

## Services

| Service             | Container             | Port | Technology            | Description                                 |
| ------------------- | --------------------- | ---- | --------------------- | ------------------------------------------- |
| **Frontend**        | `acs_frontend`        | 5173 | React, Vite, Tailwind | HR dashboard + candidate assessment UI      |
| **Backend API**     | `acs_backend`         | 5000 | Node.js, Express      | REST API, business logic, n8n integration   |
| **PostgreSQL**      | `acs_postgres`        | 5433 | PostgreSQL 17         | Primary database with auto-migrations       |
| **Redis**           | `acs_redis`           | 6379 | Redis 7.2             | Caching for AI services, session management |
| **n8n**             | `acs_n8n`             | 5678 | n8n 1.97              | Workflow automation engine                  |
| **ID Verification** | `acs_id_verification` | 8000 | FastAPI, DeepFace     | Aadhaar/ID document verification via AI     |
| **Video Analysis**  | `acs_video_analysis`  | 5001 | Flask, MediaPipe      | Video interview proctoring & analysis       |

---

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (v2+)
- **Node.js** 20+ (for local development)
- **Git**

### Quick Start (Docker)

```bash
# 1. Clone the repository
git clone https://github.com/Hemsuriya-M/AiCandidateScreening.git
cd ai-candidate-screening

# 2. Configure environment
cp .env.example backend/.env

# 3. Start all services
docker compose up --build -d

# 4. Verify all containers are running
docker compose ps
```

Once running, access the application:

| Interface              | URL                                             |
| ---------------------- | ----------------------------------------------- |
| **HR Dashboard**       | http://localhost:5173/login                     |
| **Candidate ID Check** | http://localhost:5173/candidate/id-verification |
| **Backend API**        | http://localhost:5000                           |
| **n8n Workflows**      | http://localhost:5678                           |

### Local Development (Frontend only)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Stopping Services

```bash
docker compose down           # Stop all containers
docker compose down -v        # Stop + remove volumes (full reset)
```

---

## Frontend

### Route Architecture

The frontend serves two distinct user groups with separate route prefixes and layouts:

**HR Module** (`/hr/*`) — Wrapped in `HrShell` layout with sidebar navigation:

| Route                   | Page                 | Description                           |
| ----------------------- | -------------------- | ------------------------------------- |
| `/login`                | LoginPage            | HR authentication                     |
| `/hr/dashboard`         | DashboardPage        | Pipeline overview with stats          |
| `/hr/templates`         | TemplateList         | Reusable job assessment templates     |
| `/hr/create-assessment` | CreateAssessmentPage | AI-powered assessment builder         |
| `/hr/candidates`        | CandidatesListPage   | Candidate pipeline with filters       |
| `/hr/candidates/:id`    | CandidateDetailPage  | Individual candidate scores & details |

**Candidate Module** (`/candidate/*`) — Standalone layout, no sidebar:

| Route                        | Page               | Description                      |
| ---------------------------- | ------------------ | -------------------------------- |
| `/candidate/id-verification` | IdVerificationPage | Aadhaar/ID upload & verification |

### Tech Specs

| Dependency       | Version |
| ---------------- | ------- |
| React            | 19.x    |
| TypeScript       | ~5.9.3  |
| Vite             | 8.x     |
| React Router DOM | 7.x     |
| Tailwind CSS     | 4.x     |
| Lucide React     | 0.577+  |

### Path Aliases

Configured in both `vite.config.ts` and `tsconfig.app.json`:

```
@/*           → src/*
@components/* → src/components/*
@features/*   → src/features/*
@mock/*        → src/mock/*
@types_/*      → src/types/*
```

---

## Backend API

### Candidate Endpoints

| Method | Route                   | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| POST   | `/candidate/create`     | Register a new candidate             |
| GET    | `/survey/:screening_id` | Fetch pre-screening survey questions |
| POST   | `/survey/submit`        | Submit survey responses              |
| POST   | `/validation/validate`  | Validate survey & unlock assessment  |

### Assessment Endpoints (via n8n)

| Method | Route                                | Description                     |
| ------ | ------------------------------------ | ------------------------------- |
| GET    | `/assessment/questions/:candidateId` | Fetch AI-generated questions    |
| POST   | `/assessment/status`                 | Update assessment progress      |
| POST   | `/assessment/submit`                 | Submit final assessment results |

---

## AI Services

### ID Verification Service (Port 8000)

FastAPI-based service using DeepFace for facial recognition and document verification.

| Method | Endpoint         | Description                            |
| ------ | ---------------- | -------------------------------------- |
| POST   | `/upload-id`     | Upload and store candidate ID document |
| POST   | `/verify-selfie` | Verify live selfie against stored ID   |
| GET    | `/health`        | Service health check                   |

**Features:** Redis caching for verification results, fallback to disk cache, OpenCV preprocessing.

### Video Analysis Service (Port 5001)

Flask-based proctoring service using MediaPipe for behavioral analysis during video interviews.

| Method | Endpoint         | Description                            |
| ------ | ---------------- | -------------------------------------- |
| POST   | `/analyze`       | Analyze interview video for proctoring |
| POST   | `/test-download` | Test OneDrive video download pipeline  |
| GET    | `/health`        | Service health check                   |

**Features:** Gaze tracking, head pose estimation, lip movement detection, anomaly scoring.

---

## Database

**PostgreSQL 17** with ordered migration scripts auto-applied on first startup.

### Schema Overview

| Migration File                         | Description                           |
| -------------------------------------- | ------------------------------------- |
| `001_initial_schema.sql`               | Core tables (users, sessions, etc.)   |
| `001_create_functions.sql`             | Stored procedures & utility functions |
| `002_candidates_and_job_templates.sql` | Candidate profiles & job templates    |
| `002_seed_data.sql`                    | Initial development seed data         |
| `003_n8n_db.sql`                       | Separate n8n database creation        |
| `003_survey.sql`                       | Pre-screening survey tables           |
| `004_assessment.sql`                   | Assessment questions & submissions    |
| `005_identity_verification.sql`        | ID verification records & results     |
| `006_video_interview.sql`              | Video interview sessions & analysis   |

### Backups

Database dumps are stored in `database/backups/` for disaster recovery.

---

## n8n Workflows

Imported via the n8n UI at http://localhost:5678. Workflow JSON files are stored in `/workflows`.

| Workflow                                          | Purpose                                          |
| ------------------------------------------------- | ------------------------------------------------ |
| `aicandidatescreeningv1_2.json`                   | Core screening pipeline orchestration            |
| `Evaluation_with_HIL_New.json`                    | Human-in-the-loop evaluation workflow            |
| `Video_Interview___Question_Generation_and_email` | AI question generation + candidate email trigger |
| `Video_Upload_and_Mediapipe_analysis_v2.json`     | Video upload → MediaPipe analysis pipeline       |
| `Curl_Automation.json`                            | API testing automation                           |

### Importing Workflows

1. Navigate to http://localhost:5678
2. Go to **Workflows** → **Import from File**
3. Import each JSON file from the `workflows/` directory

---

## Environment Variables

Copy `.env.example` to `backend/.env` and configure:

```env
# Backend
PORT=5000

# PostgreSQL
DB_HOST=localhost          # Use 'postgres' inside Docker
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=ai_candidate_screening

# Redis
REDIS_HOST=127.0.0.1      # Use 'redis' inside Docker
REDIS_PORT=6379

# n8n Webhooks
N8N_BASE_URL=http://localhost:5678
N8N_GET_QUESTIONS_WEBHOOK=/webhook/get-assessment-questions
N8N_UPDATE_STATUS_WEBHOOK=/webhook/update-assessment-status
N8N_SUBMIT_RESULTS_WEBHOOK=/webhook/assessment-results

# AI Services
REDIS_DB=0
REDIS_TTL_SECONDS=3600
REDIS_ENABLED=true
VIDEO_ANALYSIS_PORT=5001
```

> **Note:** When running via Docker Compose, service hostnames (`postgres`, `redis`, `n8n`) are automatically injected via the `environment` section in `docker-compose.yml`.

---

## Contributing

1. Create a feature branch from `main`
2. Follow existing code patterns and TypeScript conventions
3. Ensure `tsc -b` and `vite build` pass before submitting a PR
4. Use conventional commit messages
5. Test with `docker compose up --build` before merging

---

Built with AI-powered screening technology.
