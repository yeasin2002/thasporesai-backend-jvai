# Complete Task & Docker Commands Guide

> **All-in-one reference for Task runner, Docker commands, and migration from Makefile/npm scripts**

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Most Used Commands](#most-used-commands)
- [All Commands by Category](#all-commands-by-category)
- [Migration Reference](#migration-reference)
- [Common Workflows](#common-workflows)
- [Direct Docker Commands](#direct-docker-commands)
- [Troubleshooting](#troubleshooting)
- [Tips & Tricks](#tips--tricks)

---

## Quick Start

### Install Task

**Windows:**

```powershell
choco install go-task    # Using Chocolatey
scoop install task       # Using Scoop
```

**macOS:**

```bash
brew install go-task
```

**Linux:**

```bash
snap install task --classic
```

**Verify:**

```bash
task --version
```

### List All Tasks

```bash
task                # List all available tasks
task --list         # Same as above
```

### Run a Task

```bash
task docker:start   # Start all services
task dev            # Start dev server
task lint           # Run linter
```

---

## Most Used Commands

### Development

```bash
task dev                    # Start dev server
task build                  # Build for production
task start                  # Start production server
```

### Docker

```bash
task docker:start           # Start all services (App + Beszel)
task docker:stop            # Stop all services
task docker:restart         # Restart all services
task docker:logs            # View all logs (live)
task docker:ps              # Show container status
```

### Code Quality

```bash
task lint                   # Run linter + format check
task lint:fix               # Fix all issues
task format                 # Format code with Prettier
```

### Testing

```bash
task docker:test            # Test API health
task docker:test:beszel     # Test Beszel dashboard
task test:all               # Test everything
```

### Deployment

```bash
task deploy                 # Deploy to production
task update                 # Pull latest code and rebuild
```

---

## All Commands by Category

### 🚀 Development Commands

| Command            | Description                                    |
| ------------------ | ---------------------------------------------- |
| `task dev`         | Start development server with hot reload (tsx) |
| `task dev:bun`     | Start development server with Bun hot reload   |
| `task build`       | Build the application for production           |
| `task compile`     | Compile to standalone binary                   |
| `task start`       | Start production server                        |
| `task check-types` | Run TypeScript type checking                   |

### 🎨 Code Quality Commands

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `task lint`         | Run linter and format checker     |
| `task lint:fix`     | Fix linting and formatting issues |
| `task eslint`       | Run ESLint only                   |
| `task eslint:fix`   | Fix ESLint issues                 |
| `task format`       | Format code with Prettier         |
| `task format:check` | Check code formatting             |

### 🐳 Docker - Starting Services

| Command                    | Description                       |
| -------------------------- | --------------------------------- |
| `task docker:start`        | Start all services (App + Beszel) |
| `task docker:start:app`    | Start only JobSphere API          |
| `task docker:start:beszel` | Start only Beszel monitoring      |

### 🛑 Docker - Stopping Services

| Command                   | Description                 |
| ------------------------- | --------------------------- |
| `task docker:stop`        | Stop all services           |
| `task docker:stop:app`    | Stop only JobSphere API     |
| `task docker:stop:beszel` | Stop only Beszel monitoring |

### 🔄 Docker - Restarting Services

| Command                      | Description                    |
| ---------------------------- | ------------------------------ |
| `task docker:restart`        | Restart all services           |
| `task docker:restart:app`    | Restart only JobSphere API     |
| `task docker:restart:beszel` | Restart only Beszel monitoring |

### 🔨 Docker - Building & Rebuilding

| Command               | Description                |
| --------------------- | -------------------------- |
| `task docker:build`   | Build and start services   |
| `task docker:rebuild` | Clean rebuild all services |

### 📋 Docker - Logs

| Command                   | Description                 |
| ------------------------- | --------------------------- |
| `task docker:logs`        | View all logs (live)        |
| `task docker:logs:app`    | View JobSphere API logs     |
| `task docker:logs:beszel` | View Beszel monitoring logs |

### 📊 Docker - Status & Testing

| Command                   | Description                  |
| ------------------------- | ---------------------------- |
| `task docker:ps`          | Show Docker container status |
| `task docker:test`        | Test API health              |
| `task docker:test:beszel` | Test Beszel dashboard        |
| `task docker:health`      | Check service health         |

### 🧹 Docker - Cleanup

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `task docker:clean` | Stop services and remove volumes (⚠️ deletes data) |
| `task docker:prune` | Clean up Docker resources                          |

### 🖥️ Docker - Shell Access

| Command                    | Description                   |
| -------------------------- | ----------------------------- |
| `task docker:shell`        | Access app container shell    |
| `task docker:shell:beszel` | Access Beszel container shell |

### ⚙️ Setup & Maintenance

| Command        | Description                           |
| -------------- | ------------------------------------- |
| `task setup`   | Initial project setup                 |
| `task install` | Install dependencies                  |
| `task update`  | Pull latest code and rebuild          |
| `task backup`  | Backup uploads, logs, and Beszel data |
| `task deploy`  | Deploy to production (VPS)            |
| `task clean`   | Clean build artifacts                 |

### 🔧 Module Generation

| Command                | Description               |
| ---------------------- | ------------------------- |
| `task generate:module` | Generate a new API module |

### 🪝 Git Hooks

| Command            | Description                |
| ------------------ | -------------------------- |
| `task prepare`     | Install Lefthook git hooks |
| `task ruler:apply` | Apply Ruler configuration  |

### 🎯 Combined Workflows

| Command         | Description                                      |
| --------------- | ------------------------------------------------ |
| `task dev:full` | Start full dev environment (API + Beszel + logs) |
| `task test:all` | Run all tests (API + Beszel + health)            |
| `task ci`       | Run CI checks (lint + type-check + build)        |
| `task fresh`    | Fresh start (clean + install + build + start)    |

---

## Migration Reference

### Why Migrate to Task?

- ✅ **Cross-platform** - Works on Windows, macOS, Linux
- ✅ **Fast** - Written in Go, faster than Make
- ✅ **Simple** - YAML syntax, easier to read and write
- ✅ **Modern** - Built-in features like dependencies, variables, prompts
- ✅ **No dependencies** - Single binary, no need for Make or shell

### Command Migration Table

| Old Command                  | New Command                  | Description             |
| ---------------------------- | ---------------------------- | ----------------------- |
| **Development**              |                              |                         |
| `pnpm dev`                   | `task dev`                   | Start dev server        |
| `pnpm dev:b`                 | `task dev:bun`               | Start with Bun          |
| `pnpm build`                 | `task build`                 | Build for production    |
| `pnpm start`                 | `task start`                 | Start production server |
| `pnpm compile`               | `task compile`               | Compile to binary       |
| `pnpm check-types`           | `task check-types`           | Type checking           |
| **Code Quality**             |                              |                         |
| `pnpm lint`                  | `task lint`                  | Run linter              |
| `pnpm lint:fix`              | `task lint:fix`              | Fix linting issues      |
| `pnpm format`                | `task format`                | Format code             |
| `pnpm format:check`          | `task format:check`          | Check formatting        |
| `pnpm eslint`                | `task eslint`                | Run ESLint              |
| `pnpm eslint:fix`            | `task eslint:fix`            | Fix ESLint issues       |
| **Docker - Makefile**        |                              |                         |
| `make start`                 | `task docker:start`          | Start all services      |
| `make stop`                  | `task docker:stop`           | Stop all services       |
| `make restart`               | `task docker:restart`        | Restart all services    |
| `make logs`                  | `task docker:logs:app`       | View app logs           |
| `make logs-all`              | `task docker:logs`           | View all logs           |
| `make build`                 | `task docker:build`          | Build and start         |
| `make rebuild`               | `task docker:rebuild`        | Clean rebuild           |
| `make status`                | `task docker:ps`             | Show container status   |
| `make test`                  | `task docker:test`           | Test API                |
| `make health`                | `task docker:health`         | Check health            |
| `make clean`                 | `task docker:clean`          | Remove volumes          |
| `make prune`                 | `task docker:prune`          | Clean Docker resources  |
| `make shell`                 | `task docker:shell`          | Access app shell        |
| `make setup`                 | `task setup`                 | Initial setup           |
| `make update`                | `task update`                | Pull and rebuild        |
| `make backup`                | `task backup`                | Backup data             |
| **Docker - npm scripts**     |                              |                         |
| `pnpm docker:start`          | `task docker:start`          | Start all services      |
| `pnpm docker:start:app`      | `task docker:start:app`      | Start API only          |
| `pnpm docker:start:beszel`   | `task docker:start:beszel`   | Start Beszel only       |
| `pnpm docker:stop`           | `task docker:stop`           | Stop all services       |
| `pnpm docker:stop:app`       | `task docker:stop:app`       | Stop API only           |
| `pnpm docker:stop:beszel`    | `task docker:stop:beszel`    | Stop Beszel only        |
| `pnpm docker:restart`        | `task docker:restart`        | Restart all services    |
| `pnpm docker:restart:app`    | `task docker:restart:app`    | Restart API only        |
| `pnpm docker:restart:beszel` | `task docker:restart:beszel` | Restart Beszel only     |
| `pnpm docker:logs`           | `task docker:logs`           | View all logs           |
| `pnpm docker:logs:app`       | `task docker:logs:app`       | View app logs           |
| `pnpm docker:logs:beszel`    | `task docker:logs:beszel`    | View Beszel logs        |
| `pnpm docker:build`          | `task docker:build`          | Build and start         |
| `pnpm docker:rebuild`        | `task docker:rebuild`        | Clean rebuild           |
| `pnpm docker:ps`             | `task docker:ps`             | Show container status   |
| `pnpm docker:test`           | `task docker:test`           | Test API                |
| `pnpm docker:test:beszel`    | `task docker:test:beszel`    | Test Beszel             |
| `pnpm docker:clean`          | `task docker:clean`          | Remove volumes          |
| **Other**                    |                              |                         |
| `pnpm generate:module`       | `task generate:module`       | Generate module         |
| `pnpm prepare`               | `task prepare`               | Install git hooks       |
| `pnpm ruler:apply`           | `task ruler:apply`           | Apply Ruler config      |
| `./deploy.sh`                | `task deploy`                | Deploy to production    |

---

## Common Workflows

### Start Development

```bash
# Local development
task dev

# Docker development
task docker:start
task docker:logs:app

# Or combined
task dev:full
```

### Deploy Changes

```bash
# Manual
git pull
task docker:rebuild
task docker:logs:app

# Or automated
task update
```

### Fix Code Issues

```bash
# Individual commands
task lint:fix
task format

# Or combined
task ci
```

### Test Everything

```bash
# Individual tests
task docker:test
task docker:test:beszel
task docker:health

# Or combined
task test:all
```

### Fresh Start

```bash
# Manual
task docker:stop
task docker:clean
task docker:start

# Or combined
task fresh
```

### Quick Health Check

```bash
task docker:ps
task docker:test
task docker:test:beszel
```

### View Logs During Development

```bash
# All logs
task docker:logs

# Specific service
task docker:logs:app
task docker:logs:beszel
```

### Restart After Config Change

```bash
# Edit .env file
nano .env

# Restart services
task docker:restart

# Or restart specific service
task docker:restart:app
```

---

## Direct Docker Commands

If you prefer using Docker directly instead of Task:

### Start Services

```bash
docker compose up -d                    # All services
docker compose up -d app                # App only
docker compose up -d beszel beszel-agent # Beszel only
```

### Stop Services

```bash
docker compose down                     # All services
docker compose stop app                 # App only
docker compose stop beszel beszel-agent # Beszel only
```

### View Logs

```bash
docker compose logs -f                  # All logs
docker compose logs -f app              # App logs
docker compose logs -f beszel           # Beszel logs
docker compose logs --tail=100 app      # Last 100 lines
```

### Restart Services

```bash
docker compose restart                  # All services
docker compose restart app              # App only
docker compose restart beszel-agent     # Agent only
```

### Rebuild

```bash
docker compose up -d --build            # Rebuild and start
docker compose down && docker compose up -d --build  # Clean rebuild
```

### Container Management

```bash
docker compose ps                       # List containers
docker compose exec app sh              # Enter app container
docker compose exec beszel sh           # Enter beszel container
```

### Troubleshooting Commands

```bash
docker compose ps                       # Check container status
docker compose logs --tail=50 app       # View recent logs
docker stats                            # Check resource usage
docker inspect jobsphere-app            # Inspect container
docker compose rm                       # Remove stopped containers
docker compose down -v                  # Remove all (including volumes)
```

### Rebuild from Scratch

```bash
# Stop everything
docker compose down -v

# Remove images
docker rmi $(docker images -q jobsphere*)

# Rebuild
docker compose up -d --build
```

---

## Troubleshooting

### Task not found

```bash
# Check if Task is installed
task --version

# If not, install it
choco install go-task    # Windows
brew install go-task     # macOS
snap install task --classic  # Linux
```

### Command not working

```bash
# Check task syntax (dry run)
task --dry docker:start

# View task definition
task --summary docker:start

# List all tasks
task --list
```

### Container won't start

```bash
# Check container status
task docker:ps

# Check logs
task docker:logs:app

# Check if port is in use
sudo lsof -i :4000

# Restart Docker
sudo systemctl restart docker
task docker:start
```

### Health check failed

```bash
# Check logs
task docker:logs:app

# Verify environment variables
cat .env

# Test manually
curl http://localhost:4000/
```

### Beszel not connecting

```bash
# Check agent logs
task docker:logs:beszel

# Verify keys in .env
cat .env | grep BESZEL

# Restart agent
task docker:restart:beszel
```

---

## Tips & Tricks

### List Tasks

```bash
task                        # List all tasks
task --list                 # Same as above
task --list-all             # Include internal tasks
```

### Get Task Info

```bash
task --summary docker:start # Show task description
task --dry docker:start     # Show what would run (dry run)
```

### Run Multiple Tasks

```bash
task lint format build      # Run in sequence
```

### Watch Mode

```bash
task --watch dev            # Re-run on file changes
```

### Parallel Execution

```bash
task --parallel task1 task2 # Run in parallel
```

### Use Aliases

Add to your shell profile:

```bash
# ~/.bashrc or ~/.zshrc
alias t='task'
alias tl='task --list'
alias td='task docker:start'
alias tds='task docker:stop'
alias tdl='task docker:logs'
```

---

## Quick Reference Card

### Most Common Commands

```bash
task                        # List all tasks
task dev                    # Start dev server
task docker:start           # Start all services
task docker:stop            # Stop all services
task docker:logs            # View logs
task docker:restart         # Restart services
task docker:test            # Test API
task lint                   # Run linter
task lint:fix               # Fix issues
task deploy                 # Deploy to production
```

### Emergency Commands

```bash
task docker:ps              # Check status
task docker:logs:app        # Check logs
task docker:restart:app     # Restart API
task docker:rebuild         # Clean rebuild
task fresh                  # Fresh start
```

---

## Resources

- [Task Documentation](https://taskfile.dev/)
- [Task GitHub](https://github.com/go-task/task)
- [Taskfile.yml](Taskfile.yml) - This project's task definitions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [BESZEL-SETUP.md](BESZEL-SETUP.md) - Beszel monitoring setup
- [VPS-DEBUG.md](VPS-DEBUG.md) - Troubleshooting guide

---

**Last Updated:** 2026-02-14  
**Project:** JobSphere Backend API  
**Taskfile Location:** `c:\Yeasin\office\thasporesai\backend\Taskfile.yml`
