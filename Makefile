# AURA TECH Backend — Docker convenience commands (Hetzner / local)
# Usage: make help

COMPOSE       ?= docker compose
COMPOSE_FILE  ?= docker-compose.yml
DEV_COMPOSE   ?= -f docker-compose.yml -f docker-compose.override.yml
ENV_FILE      ?= .env
BACKUP_DIR    ?= /app/backups
TIMESTAMP     := $(shell date +%Y%m%d_%H%M%S)

.PHONY: help up down logs build clean ps restart backup backup-restore health dev prod

help: ## Show all commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up: ## Start all production services (detached)
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d

down: ## Stop services (keep volumes)
	$(COMPOSE) -f $(COMPOSE_FILE) down

logs: ## Tail logs (all services)
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f --tail=100

build: ## Build Docker images
	$(COMPOSE) -f $(COMPOSE_FILE) build --pull

clean: ## Stop and remove containers + volumes (DESTRUCTIVE)
	$(COMPOSE) -f $(COMPOSE_FILE) down -v --remove-orphans
	docker image prune -f

ps: ## List running services
	$(COMPOSE) -f $(COMPOSE_FILE) ps

restart: ## Restart all services
	$(COMPOSE) -f $(COMPOSE_FILE) restart

health: ## Check backend health endpoint
	@curl -fsS http://127.0.0.1:3000/health && echo ""

backup: ## Backup PostgreSQL database to $(BACKUP_DIR)
	@mkdir -p $(BACKUP_DIR)
	$(COMPOSE) -f $(COMPOSE_FILE) exec -T postgres \
		pg_dump -U $${DB_USER:-postgres} $${DB_NAME:-auratech_db} \
		> $(BACKUP_DIR)/auratech_db_$(TIMESTAMP).sql
	@echo "Backup saved: $(BACKUP_DIR)/auratech_db_$(TIMESTAMP).sql"

backup-restore: ## Restore from BACKUP=path/to/file.sql
	@test -n "$(BACKUP)" || (echo "Usage: make backup-restore BACKUP=./file.sql" && exit 1)
	cat $(BACKUP) | $(COMPOSE) -f $(COMPOSE_FILE) exec -T postgres \
		psql -U $${DB_USER:-postgres} -d $${DB_NAME:-auratech_db}

dev: ## Start with local dev overrides (live reload)
	$(COMPOSE) $(DEV_COMPOSE) --env-file $(ENV_FILE) up --build

prod: ## Production deploy via script
	@chmod +x ./deploy.sh 2>/dev/null || true
	./deploy.sh
