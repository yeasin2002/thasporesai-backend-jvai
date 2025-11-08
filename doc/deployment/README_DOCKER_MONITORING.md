# JobSphere Docker + Monitoring Setup

Complete Docker setup with optional Grafana + Loki monitoring.

## 🎯 Overview

This setup provides:

- ✅ Production-ready Docker deployment
- ✅ MongoDB Atlas cloud database
- ✅ Optional log monitoring (Grafana + Loki)
- ✅ Same setup for local and production

## 🚀 Quick Start

### Without Monitoring (Default)

```bash
# 1. Setup
cp .env.docker .env
nano .env  # Add DATABASE_URL

# 2. Start
pnpm docker:start

# 3. Access
open http://localhost:4000
```

### With Monitoring (Optional)

```bash
# 1. Setup
cp .env.docker .env
nano .env  # Add DATABASE_URL and ENABLE_MONITORING=true

# 2. Start with monitoring
pnpm docker:monitoring:start

# 3. Access
open http://localhost:4000      # API
open http://localhost:3000      # Grafana (admin/admin)
```

## 📦 What's Included

### Core Services

- **App** - JobSphere API (Node.js + Express)
- **MongoDB Atlas** - Cloud database (external)

### Monitoring Services (Optional)

- **Loki** - Log aggregation (Port 3100)
- **Promtail** - Log shipper
- **Grafana** - Visualization (Port 3000)

## 🛠️ Commands

### Basic Operations

```bash
# Start (without monitoring)
pnpm docker:start
make start
docker-compose up -d

# Start (with monitoring)
pnpm docker:monitoring:start
make start-monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Stop
pnpm docker:stop
make stop
docker-compose down

# View logs
pnpm docker:logs
make logs
docker-compose logs -f app

# Restart
pnpm docker:restart
make restart
docker-compose restart
```

### Monitoring Operations

```bash
# Start with monitoring
pnpm docker:monitoring:start
make start-monitoring

# Stop all (including monitoring)
pnpm docker:monitoring:stop
make stop-monitoring

# View monitoring logs
pnpm docker:monitoring:logs
make logs-monitoring

# Open Grafana
make grafana
open http://localhost:3000
```

## 🌐 Access Points

### Application

- **API**: http://localhost:4000/
- **Swagger**: http://localhost:4000/swagger
- **Scalar**: http://localhost:4000/scaler

### Monitoring (if enabled)

- **Grafana**: http://localhost:3000/ (admin/admin)
- **Loki API**: http://localhost:3100/

## 📚 Documentation

### Quick Guides

- `START_WITH_MONITORING.md` - Start with monitoring
- `MONITORING_QUICK_START.md` - Monitoring commands
- `doc/deployment/QUICK_START.md` - 5-minute setup

### Complete Guides

- `DOCKER_SETUP.md` - Main Docker guide
- `doc/deployment/README.docker.md` - Complete Docker guide
- `doc/deployment/MONITORING.md` - Complete monitoring guide
- `doc/deployment/MONGODB_ATLAS.md` - MongoDB Atlas setup
- `doc/deployment/PRODUCTION.md` - Production deployment

### Reference

- `DOCKER_SETUP_COMPLETE.md` - Docker setup summary
- `MONITORING_SETUP_COMPLETE.md` - Monitoring setup summary

## 🔧 Configuration

### Environment Variables

**Required:**

```env
DATABASE_URL=mongodb+srv://...
ACCESS_SECRET=...
REFRESH_SECRET=...
SMTP_USER=...
SMTP_PASS=...
```

**Optional (Monitoring):**

```env
ENABLE_MONITORING=true
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
```

### Files

- `.env` - Main configuration
- `.env.docker` - Template
- `.env.monitoring.example` - Monitoring template
- `docker-compose.yml` - Main services
- `docker-compose.monitoring.yml` - Monitoring services

## 📊 Monitoring Features

### Log Aggregation

- Real-time log streaming
- 7-day retention (configurable)
- Full-text search
- Time-based queries

### Visualization

- Pre-built dashboard
- Log level filtering
- Error rate tracking
- Custom dashboards

### Queries

```logql
# All logs
{job="jobsphere-app"}

# Errors only
{job="jobsphere-app"} |= "error"

# Search text
{job="jobsphere-app"} |= "database"
```

## 🎯 Use Cases

### Development

- ✅ Use monitoring for debugging
- ✅ Track errors in real-time
- ✅ Search logs quickly

### Testing

- ✅ Test with production build
- ✅ Verify logging
- ✅ Monitor performance

### Production

- ✅ Deploy without monitoring
- ✅ Use external monitoring services
- ⚠️ Or enable monitoring with proper security

## 🔐 Security

### Development

- Default credentials OK (admin/admin)
- Exposed on localhost

### Production

- Change Grafana password
- Restrict access (localhost only)
- Use reverse proxy with HTTPS
- Consider external monitoring services

## 🔍 Troubleshooting

### Application Issues

```bash
# Check logs
docker-compose logs app

# Restart
docker-compose restart app

# Rebuild
docker-compose up -d --build
```

### Monitoring Issues

```bash
# Check services
docker-compose -f docker-compose.monitoring.yml ps

# Check logs
docker-compose -f docker-compose.monitoring.yml logs

# Restart
docker-compose -f docker-compose.monitoring.yml restart
```

## 📁 Project Structure

```
jobsphere/
├── docker-compose.yml              # Main services
├── docker-compose.monitoring.yml   # Monitoring (optional)
├── Dockerfile                      # App container
├── .env                            # Configuration
├── .env.docker                     # Template
├── .env.monitoring.example         # Monitoring template
├── Makefile                        # Shortcuts
├── monitoring/                     # Monitoring configs
│   ├── loki-config.yaml
│   ├── promtail-config.yaml
│   ├── grafana-datasources.yaml
│   ├── grafana-dashboards.yaml
│   └── dashboards/
│       └── jobsphere-logs.json
├── doc/deployment/                 # Documentation
│   ├── README.md
│   ├── QUICK_START.md
│   ├── README.docker.md
│   ├── MONITORING.md
│   ├── MONGODB_ATLAS.md
│   └── PRODUCTION.md
└── [guides]
    ├── DOCKER_SETUP.md
    ├── START_WITH_MONITORING.md
    ├── MONITORING_QUICK_START.md
    ├── DOCKER_SETUP_COMPLETE.md
    └── MONITORING_SETUP_COMPLETE.md
```

## 🎊 Next Steps

### For Local Development

1. ✅ Setup MongoDB Atlas
2. ✅ Configure `.env`
3. ✅ Start services
4. ✅ (Optional) Enable monitoring

### For Production

1. ✅ Read production guide
2. ✅ Setup server
3. ✅ Configure security
4. ✅ Deploy without monitoring

## 📖 Learn More

- **Docker Setup**: `DOCKER_SETUP.md`
- **Monitoring**: `doc/deployment/MONITORING.md`
- **MongoDB Atlas**: `doc/deployment/MONGODB_ATLAS.md`
- **Production**: `doc/deployment/PRODUCTION.md`

---

**Ready to start?**

Without monitoring: `pnpm docker:start`

With monitoring: `pnpm docker:monitoring:start`
