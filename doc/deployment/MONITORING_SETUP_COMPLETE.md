# ✅ Monitoring Setup Complete

Grafana + Loki monitoring has been added to your JobSphere Docker setup!

## 🎉 What's Added

### Services
- ✅ **Loki** - Log aggregation and storage (Port 3100)
- ✅ **Promtail** - Log shipper (collects from app)
- ✅ **Grafana** - Visualization dashboard (Port 3000)

### Files Created
- ✅ `docker-compose.monitoring.yml` - Monitoring services
- ✅ `monitoring/loki-config.yaml` - Loki configuration
- ✅ `monitoring/promtail-config.yaml` - Promtail configuration
- ✅ `monitoring/grafana-datasources.yaml` - Grafana datasources
- ✅ `monitoring/grafana-dashboards.yaml` - Dashboard provisioning
- ✅ `monitoring/dashboards/jobsphere-logs.json` - Pre-built dashboard
- ✅ `.env.monitoring.example` - Monitoring environment template
- ✅ `START_WITH_MONITORING.md` - Quick start guide
- ✅ `MONITORING_QUICK_START.md` - Quick reference
- ✅ `doc/deployment/MONITORING.md` - Complete documentation

### Commands Added

**PNPM Scripts:**
```bash
pnpm docker:monitoring:start   # Start with monitoring
pnpm docker:monitoring:stop    # Stop all including monitoring
pnpm docker:monitoring:logs    # View monitoring logs
```

**Makefile:**
```bash
make start-monitoring          # Start with monitoring
make stop-monitoring           # Stop all
make logs-monitoring           # View monitoring logs
make grafana                   # Open Grafana dashboard
```

### Environment Variables
```env
ENABLE_MONITORING=true         # Enable/disable monitoring
GRAFANA_PORT=3000              # Grafana port
GRAFANA_ADMIN_USER=admin       # Grafana username
GRAFANA_ADMIN_PASSWORD=admin   # Grafana password
GRAFANA_ROOT_URL=http://localhost:3000
```

## 🚀 Quick Start

### 1. Enable Monitoring (Optional)

Edit `.env`:
```env
ENABLE_MONITORING=true
```

### 2. Start Services

```bash
# Option 1: PNPM
pnpm docker:monitoring:start

# Option 2: Make
make start-monitoring

# Option 3: Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### 3. Access Grafana

Open http://localhost:3000

**Login:**
- Username: `admin`
- Password: `admin` (change on first login)

### 4. View Logs

**Option A: Pre-built Dashboard**
1. Go to **Dashboards** → **JobSphere Application Logs**

**Option B: Explore**
1. Click **Explore** (compass icon)
2. Select **Loki** datasource
3. Query: `{job="jobsphere-app"}`

## 📊 Features

### Log Aggregation
- ✅ Real-time log streaming
- ✅ 7-day retention (configurable)
- ✅ Efficient storage
- ✅ Fast queries

### Visualization
- ✅ Pre-built dashboard
- ✅ Log level filtering
- ✅ Full-text search
- ✅ Time-based queries
- ✅ Custom dashboards

### Monitoring
- ✅ Error rate tracking
- ✅ Warning detection
- ✅ Log volume metrics
- ✅ Custom alerts (optional)

## 🔍 Common Queries

**All logs:**
```logql
{job="jobsphere-app"}
```

**Errors only:**
```logql
{job="jobsphere-app"} |= "error"
```

**Warnings:**
```logql
{job="jobsphere-app"} |= "warn"
```

**Search for text:**
```logql
{job="jobsphere-app"} |= "database"
```

**Count errors per minute:**
```logql
sum(count_over_time({job="jobsphere-app"} |= "error" [1m]))
```

## 🛠️ Commands Reference

### Start/Stop

```bash
# Start with monitoring
pnpm docker:monitoring:start
make start-monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Stop all
pnpm docker:monitoring:stop
make stop-monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml down

# Start without monitoring (normal)
pnpm docker:start
make start
docker-compose up -d
```

### View Logs

```bash
# App logs
docker-compose logs -f app

# Monitoring logs
pnpm docker:monitoring:logs
make logs-monitoring
docker-compose -f docker-compose.monitoring.yml logs -f

# Specific service
docker-compose -f docker-compose.monitoring.yml logs -f grafana
docker-compose -f docker-compose.monitoring.yml logs -f loki
docker-compose -f docker-compose.monitoring.yml logs -f promtail
```

### Status

```bash
# Check all services
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml ps

# Check monitoring only
docker-compose -f docker-compose.monitoring.yml ps
```

## 🌐 Access Points

Once running:
- **API**: http://localhost:4000/
- **Swagger**: http://localhost:4000/swagger
- **Grafana**: http://localhost:3000/ (admin/admin)
- **Loki API**: http://localhost:3100/

## 📁 Project Structure

```
jobsphere/
├── docker-compose.yml              # Main services
├── docker-compose.monitoring.yml   # Monitoring services ⭐ NEW
├── .env                            # Environment config
├── .env.monitoring.example         # Monitoring template ⭐ NEW
├── START_WITH_MONITORING.md        # Quick guide ⭐ NEW
├── MONITORING_QUICK_START.md       # Quick reference ⭐ NEW
├── monitoring/                     # Monitoring configs ⭐ NEW
│   ├── loki-config.yaml
│   ├── promtail-config.yaml
│   ├── grafana-datasources.yaml
│   ├── grafana-dashboards.yaml
│   └── dashboards/
│       └── jobsphere-logs.json
└── doc/deployment/
    └── MONITORING.md               # Complete guide ⭐ NEW
```

## 🔧 Configuration

### Enable/Disable

**Development (with monitoring):**
```env
ENABLE_MONITORING=true
```

**Production (without monitoring):**
```env
ENABLE_MONITORING=false
```

### Customize Grafana

```env
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password
GRAFANA_ROOT_URL=http://localhost:3000
```

### Change Retention

Edit `monitoring/loki-config.yaml`:
```yaml
limits_config:
  retention_period: 168h  # 7 days (default)
  # retention_period: 72h   # 3 days
  # retention_period: 720h  # 30 days
```

## 🎯 Use Cases

### Development
- ✅ Debug issues in real-time
- ✅ Monitor error rates
- ✅ Search logs quickly
- ✅ Track API requests

### Testing
- ✅ Verify log output
- ✅ Check error handling
- ✅ Monitor performance
- ✅ Validate logging format

### Production (Optional)
- ⚠️ Not recommended (use external services)
- ✅ If needed, secure Grafana properly
- ✅ Increase retention period
- ✅ Setup alerts

## 🔐 Security Notes

### Development
- Default credentials are fine (admin/admin)
- Exposed on localhost only

### Production (if enabled)
1. **Change password:**
```env
GRAFANA_ADMIN_PASSWORD=strong-random-password
```

2. **Restrict access:**
```yaml
grafana:
  ports:
    - "127.0.0.1:3000:3000"  # Localhost only
```

3. **Use reverse proxy:**
- Setup Nginx/Caddy
- Enable HTTPS
- Add authentication

4. **Consider alternatives:**
- Datadog
- New Relic
- Sentry
- CloudWatch (AWS)

## 📊 Pre-built Dashboard

The included dashboard shows:

1. **Log Levels Over Time**
   - Bar chart of errors and warnings
   - 1-minute intervals
   - Quick issue identification

2. **Application Logs**
   - Real-time log stream
   - Level filtering
   - Full-text search
   - Time navigation

### Access Dashboard

1. Open http://localhost:3000
2. Login (admin/admin)
3. Go to **Dashboards** → **JobSphere Application Logs**

## 🔍 Troubleshooting

### No logs appearing

```bash
# Check services
docker-compose -f docker-compose.monitoring.yml ps

# Check Promtail logs
docker-compose -f docker-compose.monitoring.yml logs promtail

# Verify log files
ls -la logs/

# Test Loki
curl http://localhost:3100/ready
```

### Can't access Grafana

```bash
# Check Grafana is running
docker-compose -f docker-compose.monitoring.yml ps grafana

# Check logs
docker-compose -f docker-compose.monitoring.yml logs grafana

# Restart Grafana
docker-compose -f docker-compose.monitoring.yml restart grafana
```

### High disk usage

```bash
# Check Loki data size
docker exec jobsphere-loki du -sh /loki

# Reduce retention in monitoring/loki-config.yaml
# Then restart: docker-compose -f docker-compose.monitoring.yml restart loki
```

## 📚 Documentation

### Quick References
- `START_WITH_MONITORING.md` - Quick start guide
- `MONITORING_QUICK_START.md` - Command reference

### Complete Guides
- `doc/deployment/MONITORING.md` - Full documentation
- `doc/deployment/README.md` - Documentation index

### Configuration
- `.env.monitoring.example` - Environment template
- `monitoring/` - All config files

## 🎊 You're All Set!

Monitoring is now available for your JobSphere application!

**To start with monitoring:**
```bash
pnpm docker:monitoring:start
```

**To start without monitoring:**
```bash
pnpm docker:start
```

**Access Grafana:**
http://localhost:3000 (admin/admin)

---

**Questions?** Check `doc/deployment/MONITORING.md` 📚

**Happy monitoring!** 📊
