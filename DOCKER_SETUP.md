# Docker Setup - JobSphere

Complete Docker setup for JobSphere backend using MongoDB Atlas.

## 🎯 Overview

This Docker setup provides:
- ✅ Production-ready Node.js application
- ✅ MongoDB Atlas cloud database integration
- ✅ Simple single-container deployment
- ✅ Same setup for local testing and production
- ✅ Automated health checks
- ✅ Volume persistence for uploads and logs

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- MongoDB Atlas account (free tier available)
- Gmail account (for SMTP)

## 🚀 Quick Start

### 1. Setup MongoDB Atlas

Create a free MongoDB Atlas cluster:
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0)
3. Create database user
4. Whitelist IP (0.0.0.0/0 for dev)
5. Get connection string

**Detailed guide:** `doc/deployment/MONGODB_ATLAS.md`

### 2. Configure Environment

```bash
# Copy template
cp .env.docker .env

# Edit with your values
nano .env
```

**Required values:**
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jobsphere?retryWrites=true&w=majority
ACCESS_SECRET=random_32_character_string_here
REFRESH_SECRET=random_32_character_string_here
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### 3. Start Services

```bash
# Using Docker Compose
docker-compose up -d

# Or using PNPM
pnpm docker:start

# Or using Make
make start
```

### 4. Verify

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Test API
curl http://localhost:4000/
```

## 🧪 Test Your Setup

Run the automated test script:

**Windows (PowerShell):**
```powershell
.\test-docker-setup.ps1
```

**Linux/Mac:**
```bash
chmod +x test-docker-setup.sh
./test-docker-setup.sh
```

## 📦 What's Included

### Docker Services
- **app** - JobSphere API (Node.js + Express + TypeScript)

### External Services
- **MongoDB Atlas** - Cloud database (managed)
- **Firebase** - Push notifications (optional)
- **Gmail SMTP** - Email sending

### Files
- `Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Service configuration
- `.env` - Environment variables
- `.dockerignore` - Build optimization

## 🛠️ Available Commands

### Using PNPM Scripts

```bash
pnpm docker:setup      # Initial setup (copy .env, create dirs)
pnpm docker:start      # Start services
pnpm docker:stop       # Stop services
pnpm docker:restart    # Restart services
pnpm docker:logs       # View app logs
pnpm docker:build      # Rebuild and start
pnpm docker:clean      # Stop and remove volumes (⚠️ deletes data)
pnpm docker:ps         # Show service status
pnpm docker:test       # Test API endpoint
```

### Using Makefile

```bash
make setup             # Initial setup
make start             # Start services
make stop              # Stop services
make restart           # Restart services
make logs              # View logs
make build             # Rebuild
make clean             # Clean all (⚠️ deletes data)
make backup            # Backup database and uploads
make shell             # Access app container shell
make db-shell          # Access MongoDB shell
make test              # Test API endpoint
make health            # Check service health
make help              # Show all commands
```

### Using Docker Compose

```bash
docker-compose up -d           # Start in background
docker-compose down            # Stop services
docker-compose logs -f app     # Follow logs
docker-compose ps              # Show status
docker-compose restart         # Restart services
docker-compose up -d --build   # Rebuild and start
```

## 🌐 Access Points

Once running, access:
- **API**: http://localhost:4000/
- **Swagger Docs**: http://localhost:4000/swagger
- **Scalar Docs**: http://localhost:4000/scaler
- **API Spec**: http://localhost:4000/api-docs.json

## 📁 Project Structure

```
jobsphere/
├── Dockerfile                 # Production build
├── docker-compose.yml         # Service config
├── .env                       # Environment (create from .env.docker)
├── .env.docker                # Template
├── .dockerignore              # Build optimization
├── Makefile                   # Shortcuts
├── test-docker-setup.ps1      # Test script (Windows)
├── test-docker-setup.sh       # Test script (Linux/Mac)
├── uploads/                   # User uploads (persisted)
├── logs/                      # App logs (persisted)
└── doc/deployment/            # Documentation
    ├── README.md              # Index
    ├── QUICK_START.md         # 5-minute guide
    ├── README.docker.md       # Complete Docker guide
    ├── MONGODB_ATLAS.md       # Atlas setup
    ├── PRODUCTION.md          # Production deployment
    └── CHANGES.md             # Recent changes
```

## 🔧 Configuration

### Environment Variables

**Required:**
```env
DATABASE_URL=mongodb+srv://...     # MongoDB Atlas connection
ACCESS_SECRET=...                  # JWT access token secret (32+ chars)
REFRESH_SECRET=...                 # JWT refresh token secret (32+ chars)
SMTP_USER=...                      # Gmail address
SMTP_PASS=...                      # Gmail app password
```

**Optional:**
```env
PORT=4000                          # Application port
API_BASE_URL=http://localhost:4000 # API base URL
CORS_ORIGIN=*                      # CORS allowed origins
```

### Firebase (Optional)

For push notifications:
1. Download `firebase-service-account.json` from Firebase Console
2. Place in project root
3. File is automatically mounted in container

## 🔍 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check if port is in use
netstat -ano | findstr :4000  # Windows
lsof -i :4000                 # Linux/Mac

# Restart
docker-compose restart
```

### Database connection failed

```bash
# Check logs
docker-compose logs app

# Verify DATABASE_URL
cat .env | grep DATABASE_URL

# Common issues:
# 1. IP not whitelisted in MongoDB Atlas
# 2. Wrong username/password
# 3. Special characters in password not URL-encoded
# 4. Network connectivity issues
```

### Permission errors

```bash
# Windows (PowerShell as Admin)
icacls uploads /grant Everyone:F /T
icacls logs /grant Everyone:F /T

# Linux/Mac
sudo chown -R 1000:1000 uploads/ logs/
sudo chmod -R 755 uploads/ logs/
```

### Port already in use

```bash
# Change PORT in .env
PORT=5000

# Restart
docker-compose up -d
```

## 📊 Monitoring

### Health Checks

```bash
# API health
curl http://localhost:4000/

# Container health
docker inspect --format='{{.State.Health.Status}}' jobsphere-app

# View logs
docker-compose logs -f app

# Resource usage
docker stats
```

### Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 app

# Since specific time
docker-compose logs --since 30m app
```

## 🚀 Production Deployment

### Quick Production Setup

1. **Get a server** (DigitalOcean, AWS EC2, etc.)
2. **Install Docker** on server
3. **Clone repository**
4. **Configure `.env`** with production values
5. **Start services**: `docker-compose up -d`
6. **Setup reverse proxy** (Caddy/Nginx) for HTTPS
7. **Configure firewall**
8. **Setup backups**

**Detailed guide:** `doc/deployment/PRODUCTION.md`

### Production Environment

```env
# MongoDB Atlas with IP whitelist
DATABASE_URL=mongodb+srv://...

# Your domain
API_BASE_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Strong secrets (32+ chars)
ACCESS_SECRET=<openssl rand -base64 32>
REFRESH_SECRET=<openssl rand -base64 32>

# Production email
SMTP_USER=production@yourdomain.com
SMTP_PASS=...
```

## 🔐 Security

### Best Practices

- ✅ Use strong database passwords
- ✅ Generate random JWT secrets (32+ chars)
- ✅ Whitelist IPs in MongoDB Atlas
- ✅ Enable HTTPS in production
- ✅ Regular backups
- ✅ Keep Docker images updated
- ✅ Monitor logs for suspicious activity
- ✅ Use environment-specific configs

### Production Checklist

- [ ] MongoDB Atlas IP whitelist configured
- [ ] Strong database password
- [ ] Random JWT secrets (32+ chars)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring enabled
- [ ] Log rotation configured

## 📚 Documentation

- **Quick Start**: `doc/deployment/QUICK_START.md`
- **Complete Guide**: `doc/deployment/README.docker.md`
- **MongoDB Atlas**: `doc/deployment/MONGODB_ATLAS.md`
- **Production**: `doc/deployment/PRODUCTION.md`
- **Changes**: `doc/deployment/CHANGES.md`

## 🆘 Support

### Common Issues

1. **Connection timeout** - Check MongoDB Atlas IP whitelist
2. **Authentication failed** - Verify username/password
3. **Port in use** - Change PORT in .env
4. **Permission errors** - Fix folder permissions

### Get Help

- Check logs: `docker-compose logs app`
- Verify config: `docker-compose config`
- Test connection: `curl http://localhost:4000/`
- Read docs: `doc/deployment/`

## 🎯 Next Steps

1. ✅ Setup MongoDB Atlas - [Guide](doc/deployment/MONGODB_ATLAS.md)
2. ✅ Configure environment - Copy `.env.docker` to `.env`
3. ✅ Start services - `docker-compose up -d`
4. ✅ Test setup - Run `test-docker-setup.ps1` or `.sh`
5. ✅ Deploy to production - [Guide](doc/deployment/PRODUCTION.md)

---

**Ready to start?** Run `pnpm docker:setup` or `make setup`! 🚀
