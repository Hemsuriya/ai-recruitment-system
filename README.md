# AI Candidate Screening

An end-to-end AI-powered candidate screening platform combining a Node.js backend, Python AI microservices, n8n automation workflows, and a React frontend.

---

## Architecture

```
ai-candidate-screening/
├── frontend/                  # React Vite app
├── backend/                   # Node.js / Express API (port 5000)
├── ai-services/
│   ├── id-verification/       # FastAPI — DeepFace ID verify (port 8000)
│   └── video-analysis/        # Flask — MediaPipe proctoring (port 5001)
├── workflows/                 # n8n automation workflows
├── database/                  # PostgreSQL schemas + backups
├── infrastructure/            # Docker + cloud infra
├── scripts/                   # Setup & automation scripts
└── docs/                      # Documentation
```

## Services

| Service | Port | Tech |
|---|---|---|
| Backend API | 5000 | Node.js, Express, PostgreSQL |
| ID Verification | 8000 | FastAPI, DeepFace, Redis |
| Video Analysis | 5001 | Flask, MediaPipe, OpenCV |
| n8n Workflows | 5678 | n8n |
| PostgreSQL | 5432 | PostgreSQL 17 |
| Redis | 6379 | Redis 7 |

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env

# 2. Install dependencies
make install

# 3. Start all services
make dev

# 4. Import n8n workflows
# Go to http://localhost:5678 → Settings → Import Workflow
# Import all JSON files from /workflows
```

## Backend API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/candidate/create` | Create new candidate |
| GET | `/survey/:screening_id` | Get survey questions |
| POST | `/survey/submit` | Submit survey answers |
| POST | `/validation/validate` | Validate survey + unlock assessment |
| GET | `/assessment/questions/:candidateId` | Get assessment questions (via n8n) |
| POST | `/assessment/status` | Update assessment status (via n8n) |
| POST | `/assessment/submit` | Submit assessment results (via n8n) |

## AI Services API

### ID Verification (port 8000)
- `POST /upload-id` — Store candidate ID image
- `POST /verify-selfie` — Verify selfie against stored ID
- `GET /health`

### Video Analysis (port 5001)
- `POST /analyze` — Analyze interview video (MediaPipe proctoring)
- `POST /test-download` — Test OneDrive video download
- `GET /health`

## Environment Variables

See `.env.example` for all required variables.


Page	URL
HR Portal	http://localhost:5000/hr
MCQ Assessment	http://localhost:5000/assessment-page
Video Interview	http://localhost:5000/video-interview
Health Check	http://localhost:5000/health