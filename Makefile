# JobSphere Docker Commands
# Usage: make <command>

.PHONY: help setup start stop restart logs build clean backup

help: ## Show this help message
	@echo "JobSphere Docker Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Initial setup - copy .env and create directories
	@echo "Setting up environment..."
	@cp -n .env.docker .env || true
	@mkdir -p uploads logs
	@echo "✓ Setup complete. Edit .env with your configuration."

start: ## Start all services
	@echo "Starting services..."
	@docker-compose up -d
	@echo "✓ Services started"
	@make status

stop: ## Stop all services
	@echo "Stopping services..."
	@docker-compose down
	@echo "✓ Services stopped"

restart: ## Restart all services
	@echo "Restarting services..."
	@docker-compose restart
	@echo "✓ Services restarted"

rebuild: ## Rebuild and start services
	@echo "Stopping services..."
	@docker-compose down
	@echo "Rebuilding and starting services..."
	@docker-compose up -d --build
	@echo "✓ Rebuild complete"

logs: ## View application logs
	@docker-compose logs -f app

logs-all: ## View all service logs
	@docker-compose logs -f

status: ## Show service status
	@docker-compose ps

build: ## Rebuild and start services
	@echo "Building and starting services..."
	@docker-compose up -d --build
	@echo "✓ Build complete"

clean: ## Stop services and remove volumes (⚠️  deletes data)
	@echo "⚠️  This will delete all data. Press Ctrl+C to cancel..."
	@sleep 5
	@docker-compose down -v
	@echo "✓ Cleaned"

backup: ## Backup database and uploads
	@echo "Creating backup..."
	@mkdir -p backups
	@docker-compose exec -T mongodb mongodump --archive=/data/backup.archive --gzip --authenticationDatabase=admin -u admin -p $$(grep MONGO_ROOT_PASSWORD .env | cut -d '=' -f2)
	@docker cp jobsphere-mongodb:/data/backup.archive ./backups/mongodb_$$(date +%Y%m%d_%H%M%S).archive
	@tar -czf ./backups/uploads_$$(date +%Y%m%d_%H%M%S).tar.gz uploads/
	@echo "✓ Backup complete in ./backups/"

shell: ## Access app container shell
	@docker-compose exec app sh

db-shell: ## Access MongoDB shell
	@docker-compose exec mongodb mongosh -u admin -p $$(grep MONGO_ROOT_PASSWORD .env | cut -d '=' -f2)

test: ## Test API endpoint
	@curl -s http://localhost:4000/ && echo "\n✓ API is responding" || echo "\n✗ API is not responding"

health: ## Check service health
	@echo "Checking health..."
	@docker inspect --format='{{.State.Health.Status}}' jobsphere-app 2>/dev/null || echo "Health check not available"
	@curl -s http://localhost:4000/ > /dev/null && echo "✓ API is healthy" || echo "✗ API is not responding"

update: ## Pull latest code and rebuild
	@echo "Updating application..."
	@git pull origin main
	@docker-compose up -d --build
	@echo "✓ Update complete"

prune: ## Clean up Docker resources
	@echo "Cleaning Docker resources..."
	@docker system prune -a --volumes -f
	@echo "✓ Cleanup complete"
