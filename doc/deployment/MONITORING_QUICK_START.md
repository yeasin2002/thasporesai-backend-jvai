# 📊 Monitoring Quick Start

Enable Grafana + Loki log monitoring for JobSphere in 3 steps.

## ⚡ Quick Start

### 1. Enable (Optional)

Edit `.env`:
```env
ENABLE_MONITORING=true
```

### 2. Start

```bash
# PNPM
pnpm docker:monitoring:start

# Make
make start-monitoring

# Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### 3. Access

- **Grafana**: http://localhost:3000 (admin/admin)
- **API**: http://localhost:4000

## 📊 View Logs

1. Open http://localhost:3000
2. Login (admin/admin)
3. Go to **Explore** or **Dashboards** → **JobSphere Application Logs**

## 🔍 Quick Queries

```logql
# All logs
{job="jobsphere-app"}

# Errors only
{job="jobsphere-app"} |= "error"

# Search text
{job="jobsphere-app"} |= "database"
```

## 🛑 Stop

```bash
# PNPM
pnpm docker:monitoring:stop

# Make
make stop-monitoring
```

## 📚 Full Guide

See `doc/deployment/MONITORING.md` for complete documentation.

---

**Monitoring stack:**
- Loki (log aggregation)
- Promtail (log shipper)
- Grafana (visualization)
