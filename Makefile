.PHONY: help build up down logs clean install dev prod backup restore
help:
	@echo "Excel Database Management System - Docker Commands"
	@echo "=================================================="
	@echo ""
	@echo "Basic Commands:"
	@echo "  make install    - Initial setup (production mode)"
	@echo "  make up         - Start production services"
	@echo "  make down       - Stop services"
	@echo "  make restart    - Restart services"
	@echo ""
	@echo "Development:"
	@echo "  make dev        - Development mode (hot reload)"
	@echo "  make dev-up     - Start development services"
	@echo "  make dev-down   - Stop development services"
	@echo "  make build      - Rebuild Docker images"
	@echo "  make logs       - Show all service logs"
	@echo "  make logs-api   - API logs only"
	@echo "  make logs-cli   - CLI terminal logs only"
	@echo "  make logs-web   - Web frontend logs only"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean      - Clean stopped containers and images"
	@echo "  make reset      - Delete all data and start fresh"
	@echo ""
	@echo "Backup:"
	@echo "  make backup     - Backup database"
	@echo "  make restore    - Restore database"
	@echo ""
	@echo "Status:"
	@echo "  make status     - Show service status"
	@echo "  make health     - Health check"
	@echo ""

install: build up
	@echo "Excel Database Management System successfully installed!"
	@echo "Web interface: http://localhost"
	@echo "API: http://localhost:5001/api"
	@echo "CLI Terminal: Click 'Terminal' button in web interface"

build:
	@echo "Building Docker images..."
	docker-compose build --no-cache

up:
	@echo "Starting production services..."
	docker-compose up -d
	@echo "Services started!"
	@make status

dev: dev-build dev-up
	@echo "Development mode ready!"
	@echo "Frontend: http://localhost:5173"
	@echo "API: http://localhost:5001/api"
	@echo "CLI: ws://localhost:8080"

dev-build:
	@echo "Building development images..."
	docker-compose -f docker-compose.dev.yml build --no-cache

dev-up:
	@echo "Starting development services..."
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	@echo "Stopping development services..."
	docker-compose -f docker-compose.dev.yml down

down:
	@echo "Stopping production services..."
	docker-compose down

restart: down up

logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f backend

logs-cli:
	docker-compose logs -f cli-terminal

logs-web:
	docker-compose logs -f frontend

logs-dev:
	docker-compose -f docker-compose.dev.yml logs -f

logs-dev-api:
	docker-compose -f docker-compose.dev.yml logs -f backend-dev

logs-dev-web:
	docker-compose -f docker-compose.dev.yml logs -f frontend-dev

clean:
	@echo "Cleaning up..."
	docker-compose down --volumes --remove-orphans
	docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
	docker system prune -f
	docker volume prune -f

reset: clean
	@echo "Resetting system..."
	sudo rm -rf backend/uploads/* backend/data/*
	@make install

status:
	@echo "Service Status:"
	@echo "==============="
	docker-compose ps

status-dev:
	@echo "Development Service Status:"
	@echo "=========================="
	docker-compose -f docker-compose.dev.yml ps

health:
	@echo "Health Check:"
	@echo "============="
	@curl -s http://localhost:5001/api/tables > /dev/null && echo "Backend API - OK" || echo "Backend API - FAIL"
	@curl -s http://localhost > /dev/null && echo "Frontend Web - OK" || echo "Frontend Web - FAIL"
	@netstat -an | grep :8080 > /dev/null && echo "CLI Terminal - OK" || echo "CLI Terminal - FAIL"

backup:
	@echo "Backing up database..."
	@mkdir -p backups
	@docker exec excel-db-backend cp /app/data/databases.db /app/uploads/backup_$(shell date +%Y%m%d_%H%M%S).db
	@docker cp excel-db-backend:/app/uploads/backup_$(shell date +%Y%m%d_%H%M%S).db ./backups/
	@echo "Backup created: backups/backup_$(shell date +%Y%m%d_%H%M%S).db"

restore:
	@echo "Current database will be backed up and selected backup will be restored"
	@ls -la backups/
	@read -p "Backup file name to restore: " file && docker cp backups/$$file excel-db-backend:/app/data/databases.db
	@make restart
	@echo "Database restored"

ports:
	@echo "Used Ports:"
	@echo "==========="
	@echo "Production:"
	@echo "  Web Frontend: http://localhost:80"
	@echo "  Backend API:  http://localhost:5001"
	@echo "  CLI Terminal: ws://localhost:8080"
	@echo "  Redis Cache:  localhost:6379"
	@echo ""
	@echo "Development:"
	@echo "  Web Frontend: http://localhost:5173"
	@echo "  Backend API:  http://localhost:5001"
	@echo "  CLI Terminal: ws://localhost:8080"
	@echo "  Redis Cache:  localhost:6379"
