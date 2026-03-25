# Migration 007 — Job Postings & JID System

**Date:** 2026-03-24
**Author:** Hemsuriya

## What Changed

### New Table: `job_postings`

A new `job_postings` table has been added to unify both candidate pipelines under a single **JID (Job ID)**.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| **jid** | VARCHAR(20) UNIQUE | **Auto-generated** — `JOB-{YEAR}-{SEQ}` (e.g., `JOB-2026-001`) |
| template_id | INTEGER FK | References `job_templates.id` (optional) |
| job_title | VARCHAR(100) | Job title for this posting |
| status | VARCHAR(20) | `draft`, `open`, `closed`, `archived` |
| opens_at | DATE | Posting start date |
| closes_at | DATE | Posting end date |
| created_by | VARCHAR(100) | Who created it |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

**JID is auto-generated** via a PostgreSQL trigger. When inserting a row with `jid = NULL`, the trigger generates the next sequential JID for the current year.

### Altered Tables

| Table | Change |
|-------|--------|
| `candidates_v2` | Added `jid VARCHAR(20)` FK → `job_postings.jid` |
| `video_interview_candidates` | Added `jid VARCHAR(20)` FK → `job_postings.jid` |

Both columns are **nullable** — existing data is unaffected.

---

## New API Endpoints

### `/api/job-postings`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/job-postings` | List all job postings |
| GET | `/api/job-postings/dropdown` | Dropdown data (jid, title, status, dates) — use for filter UIs |
| GET | `/api/job-postings/:jid` | Get posting by JID |
| POST | `/api/job-postings` | Create posting (JID auto-generated) |
| PUT | `/api/job-postings/:jid` | Update posting |

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `GET /api/hr/candidates` | Now supports `?jid=JOB-2026-001` query param for filtering |
| `GET /api/hr/candidates/:id` | Response now includes `jid` field |
| `POST /candidate/create` | Now accepts `jid` in request body |

---

## How to Use JID in Your Pages

### Creating a Job Posting
```js
// POST /api/job-postings
// Body: { job_title: "ML Engineer", template_id: 1, status: "open" }
// Response: { jid: "JOB-2026-001", ... }  ← JID auto-generated
```

### Creating a Candidate with JID
```js
// POST /candidate/create
// Body: { name: "...", email: "...", jid: "JOB-2026-001", ... }
```

### Filtering Candidates by JID
```js
// GET /api/hr/candidates?jid=JOB-2026-001
```

### Getting Dropdown Data for Filters
```js
// GET /api/job-postings/dropdown
// Returns: [{ jid, job_title, status, opens_at, closes_at }]
```

---

## Action Required by Team

1. **Dashboard** (Don): JID filter dropdown is added with mock data. Replace mock with `GET /api/job-postings/dropdown` when wiring real data.
2. **CreateAssessment** (Don/PKW): When creating an assessment, create or select a job posting first, then pass the JID when creating candidates.
3. **All candidate-facing flows**: Pass `jid` when creating candidates so they're linked to the correct job posting.

---

## How to Apply This Migration

```bash
# If using Docker (auto-applied on fresh DB):
docker compose down -v && docker compose up --build -d

# If applying to existing DB manually:
psql -U postgres -d ai_candidate_screening -f database/migrations/007_job_postings.sql
```
