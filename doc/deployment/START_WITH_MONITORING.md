# Start JobSphere with Monitoring

Quick guide to start JobSphere with Grafana and Loki monitoring.

## 🚀 Quick Start

### 1. Enable Monitoring

Edit `.env`:
```env
ENABLE_MONITORING=true
```

### 2. Start Services

Choose one method:

**Using PNPM:**
```bash
pnpm docker:monitoring:start
```

**Using Make:**
```bash
make start-monitoring
```

**Using Docker Compose:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### 3. Access Services

- **API**: http://localhost:4000/
- **Grafana**: http://localhost:3000/ (admin/admin)
- **Loki API**: http://localhost:3100/

## 📊 View Logs

### Option 1: Pre-built Dashboard

1. Open http://localhost:3000
2. Login (admin/admin)
3. Go to **Dashboards** → **JobSphere Application Logs**

### Option 2: Explore

1. Click **Explore** (compass icon)
2. Select **Loki** datasource
3. Query: `{job="jobsphere-app"}`

## 🔍 Common Queries

**All logs:**
```
{job="jobsphere-app"}
```

**Errors only:**
```
{job="jobsphere-app"} |= "error"
```

**Search text:**
```
{job="jobsphere-app"} |= "database"
```

## 🛑 Stop Services

```bash
# PNPM
pnpm docker:monitoring:stop

# Make
make stop-monitoring

# Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml down
```

## 📚 Full Documentation

See `doc/deployment/MONITORING.md` for complete guide.

---

**Monitoring enabled!** 📊 View logs at http://localhost:3000
