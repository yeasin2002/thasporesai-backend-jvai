# Log Monitoring with Grafana and Loki

Complete guide for setting up log monitoring for JobSphere using Grafana and Loki.

## 📊 Overview

This monitoring stack provides:

- **Loki** - Log aggregation and storage
- **Promtail** - Log shipper (collects logs from app)
- **Grafana** - Visualization and dashboards

## 🎯 Features

- ✅ Real-time log streaming
- ✅ Log level filtering (error, warn, info)
- ✅ Full-text search
- ✅ Time-based queries
- ✅ Pre-built dashboards
- ✅ 7-day log retention
- ✅ Optional (development only by default)

## 🚀 Quick Start

### 1. Enable Monitoring

Edit `.env`:

```env
ENABLE_MONITORING=true
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
```

### 2. Start with Monitoring

```bash
# Using PNPM
pnpm docker:monitoring:start

# Using Make
make start-monitoring

# Using Docker Compose
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### 3. Access Grafana

Open http://localhost:3000

**Default credentials:**

- Username: `admin`
- Password: `admin` (change on first login)

### 4. View Logs

1. Go to **Explore** (compass icon)
2. Select **Loki** datasource
3. Query: `{job="jobsphere-app"}`
4. Or use pre-built dashboard: **JobSphere Application Logs**

## 📦 What's Included

### Services

**Loki (Port 3100)**

- Log aggregation system
- Stores logs efficiently
- Provides query API
- 7-day retention

**Promtail**

- Collects logs from app container
- Ships logs to Loki
- Parses JSON logs
- Adds labels

**Grafana (Port 3000)**

- Web UI for log visualization
- Pre-configured Loki datasource
- Pre-built dashboards
- Query builder

### Files

```
monitoring/
├── loki-config.yaml           # Loki configuration
├── promtail-config.yaml       # Promtail configuration
├── grafana-datasources.yaml   # Grafana datasources
├── grafana-dashboards.yaml    # Dashboard provisioning
└── dashboards/
    └── jobsphere-logs.json    # Pre-built log dashboard
```

## 🛠️ Commands

### Using PNPM

```bash
# Start with monitoring
pnpm docker:monitoring:start

# Stop all (including monitoring)
pnpm docker:monitoring:stop

# View monitoring logs
pnpm docker:monitoring:logs
```

### Using Make

```bash
# Start with monitoring
make start-monitoring

# Stop all
make stop-monitoring

# View monitoring logs
make logs-monitoring

# Open Grafana
make grafana
```

### Using Docker Compose

```bash
# Start with monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Stop all
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml down

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f

# View specific service
docker-compose -f docker-compose.monitoring.yml logs -f grafana
docker-compose -f docker-compose.monitoring.yml logs -f loki
docker-compose -f docker-compose.monitoring.yml logs -f promtail
```

## 📊 Using Grafana

### Access Dashboard

1. Open http://localhost:3000
2. Login (admin/admin)
3. Go to **Dashboards** → **JobSphere Application Logs**

### Explore Logs

1. Click **Explore** (compass icon)
2. Select **Loki** datasource
3. Use LogQL queries

### Common Queries

**All logs:**

```logql
{job="jobsphere-app"}
```

**Error logs only:**

```logql
{job="jobsphere-app"} |= "error"
```

**Specific level:**

```logql
{job="jobsphere-app"} | json | level="error"
```

**Search for text:**

```logql
{job="jobsphere-app"} |= "database"
```

**Count errors per minute:**

```logql
sum(count_over_time({job="jobsphere-app"} |= "error" [1m]))
```

**Filter by time:**

- Use time picker in top-right
- Last 5 minutes, 1 hour, 24 hours, etc.

## 🔧 Configuration

### Loki Configuration

Edit `monitoring/loki-config.yaml`:

```yaml
# Change retention period (default: 7 days)
limits_config:
  retention_period: 168h # 7 days in hours
```

### Promtail Configuration

Edit `monitoring/promtail-config.yaml`:

```yaml
# Add more log sources
scrape_configs:
  - job_name: custom-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: custom
          __path__: /var/log/custom/*.log
```

### Grafana Configuration

Edit `.env`:

```env
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password
GRAFANA_ROOT_URL=http://localhost:3000
```

## 📈 Pre-built Dashboard

The included dashboard shows:

1. **Log Levels Over Time**

   - Bar chart of errors and warnings
   - 1-minute intervals
   - Helps identify issues quickly

2. **Application Logs**
   - Real-time log stream
   - Filterable by level
   - Full-text search
   - Time-based navigation

### Customize Dashboard

1. Open dashboard
2. Click **Settings** (gear icon)
3. Edit panels
4. Add new panels
5. Save changes

## 🔍 Troubleshooting

### No logs appearing

```bash
# Check Promtail is running
docker-compose -f docker-compose.monitoring.yml ps promtail

# Check Promtail logs
docker-compose -f docker-compose.monitoring.yml logs promtail

# Verify log files exist
ls -la logs/

# Check Loki is receiving logs
curl http://localhost:3100/ready
```

### Grafana can't connect to Loki

```bash
# Check Loki is running
docker-compose -f docker-compose.monitoring.yml ps loki

# Test Loki API
curl http://localhost:3100/loki/api/v1/labels

# Check network
docker network inspect jobsphere-monitoring
```

### High disk usage

```bash
# Check Loki data size
docker exec jobsphere-loki du -sh /loki

# Reduce retention period in loki-config.yaml
# retention_period: 72h  # 3 days instead of 7

# Restart Loki
docker-compose -f docker-compose.monitoring.yml restart loki
```

### Grafana login issues

```bash
# Reset admin password
docker exec -it jobsphere-grafana grafana-cli admin reset-admin-password newpassword

# Or recreate Grafana container
docker-compose -f docker-compose.monitoring.yml stop grafana
docker volume rm jobsphere_grafana_data
docker-compose -f docker-compose.monitoring.yml up -d grafana
```

## 🎨 Creating Custom Dashboards

### 1. Create New Dashboard

1. Go to **Dashboards** → **New Dashboard**
2. Click **Add new panel**
3. Select **Loki** datasource
4. Enter LogQL query
5. Configure visualization
6. Save dashboard

### 2. Example Panels

**Error Rate:**

```logql
sum(rate({job="jobsphere-app"} |= "error" [5m]))
```

**Top Error Messages:**

```logql
topk(10, sum by (message) (count_over_time({job="jobsphere-app"} |= "error" [1h])))
```

**Request Duration:**

```logql
{job="jobsphere-app"} | json | __error__="" | duration > 1000
```

## 🔐 Security

### Production Recommendations

1. **Change default password:**

```env
GRAFANA_ADMIN_PASSWORD=strong-random-password
```

2. **Restrict access:**

```yaml
# In docker-compose.monitoring.yml
grafana:
  ports:
    - "127.0.0.1:3000:3000" # Only localhost
```

3. **Enable authentication:**

```env
GF_AUTH_ANONYMOUS_ENABLED=false
```

4. **Use HTTPS:**

- Setup reverse proxy (Nginx/Caddy)
- Configure SSL certificate
- Update GRAFANA_ROOT_URL

## 📊 Monitoring Best Practices

### 1. Log Levels

Use appropriate log levels in your app:

- `error` - Critical issues
- `warn` - Warnings
- `info` - General information
- `debug` - Debugging information

### 2. Structured Logging

Use JSON format for better parsing:

```typescript
console.log(
  JSON.stringify({
    level: "error",
    message: "Database connection failed",
    timestamp: new Date().toISOString(),
    error: error.message,
  })
);
```

### 3. Add Context

Include useful metadata:

```typescript
{
  level: 'info',
  message: 'User login',
  userId: '123',
  ip: '192.168.1.1',
  timestamp: new Date().toISOString()
}
```

### 4. Set Alerts

Create alerts in Grafana:

1. Go to **Alerting** → **Alert rules**
2. Create new alert
3. Set conditions (e.g., error rate > 10/min)
4. Configure notifications

## 🌐 Production Deployment

### Option 1: Development Only (Recommended)

Keep monitoring disabled in production:

```env
# .env (production)
ENABLE_MONITORING=false
```

Use external monitoring services:

- Datadog
- New Relic
- Sentry
- CloudWatch (AWS)

### Option 2: Enable in Production

If you want monitoring in production:

1. **Secure Grafana:**

```env
GRAFANA_ADMIN_PASSWORD=strong-password
GRAFANA_ROOT_URL=https://monitoring.yourdomain.com
```

2. **Setup reverse proxy:**

```nginx
server {
    listen 443 ssl;
    server_name monitoring.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

3. **Restrict access:**

- Use firewall rules
- VPN access only
- IP whitelist

4. **Increase retention:**

```yaml
# For production, keep logs longer
limits_config:
  retention_period: 720h # 30 days
```

## 📦 Data Persistence

### Volumes

- `loki_data` - Loki log storage
- `grafana_data` - Grafana dashboards and settings

### Backup

```bash
# Backup Grafana dashboards
docker exec jobsphere-grafana grafana-cli admin export-dashboard > backup.json

# Backup Loki data
docker run --rm -v jobsphere_loki_data:/data -v $(pwd):/backup alpine tar czf /backup/loki-backup.tar.gz /data
```

### Restore

```bash
# Restore Grafana
docker exec -i jobsphere-grafana grafana-cli admin import-dashboard < backup.json

# Restore Loki
docker run --rm -v jobsphere_loki_data:/data -v $(pwd):/backup alpine tar xzf /backup/loki-backup.tar.gz -C /
```

## 🎯 Next Steps

1. ✅ Start monitoring: `make start-monitoring`
2. ✅ Access Grafana: http://localhost:3000
3. ✅ Explore logs in **Explore** tab
4. ✅ View **JobSphere Application Logs** dashboard
5. ✅ Create custom dashboards
6. ✅ Set up alerts (optional)

## 📚 Resources

- **Loki Docs**: https://grafana.com/docs/loki/
- **Grafana Docs**: https://grafana.com/docs/grafana/
- **LogQL Guide**: https://grafana.com/docs/loki/latest/logql/
- **Dashboard Examples**: https://grafana.com/grafana/dashboards/

---

**Happy monitoring!** 📊
