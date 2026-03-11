.PHONY: help install dev stop clean logs db-restore

help:
	@echo ""
	@echo "AI Candidate Screening — Available Commands"
	@echo "─────────────────────────────────────────────"
	@echo "  make install       Install all dependencies"
	@echo "  make dev           Start all services (Docker)"
	@echo "  make stop          Stop all Docker services"
	@echo "  make logs          Tail logs for all services"
	@echo "  make db-restore    Restore DB from backup"
	@echo "  make clean         Remove containers + volumes"
	@echo ""

install:
	cd backend && npm install
	cd ai-services/id-verification && pip install -r requirements.txt
	cd ai-services/video-analysis && pip install -r requirements.txt

dev:
	cp -n .env.example .env 2>/dev/null || true
	docker compose up -d --build
	@echo ""
	@echo "✅ Services running:"
	@echo "   Backend       → http://localhost:5000"
	@echo "   ID Verify     → http://localhost:8000"
	@echo "   Video Analysis→ http://localhost:5001"
	@echo "   n8n           → http://localhost:5678"
	@echo ""

stop:
	docker compose down

logs:
	docker compose logs -f

db-restore:
	docker compose exec postgres psql -U postgres -d ai_candidate_screening -f /docker-entrypoint-initdb.d/01_schema.sql

clean:
	docker compose down -v --remove-orphans
	@echo "🗑️  Containers and volumes removed"
