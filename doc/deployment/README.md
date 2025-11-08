# JobSphere Deployment Documentation

Complete deployment guides for JobSphere backend application.

## 📚 Documentation Index

### Quick Start

- **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes

### Docker Setup

- **[README.docker.md](README.docker.md)** - Complete Docker guide
- **[CHANGES.md](CHANGES.md)** - Recent changes (MongoDB Atlas migration)

### Database

- **[MONGODB_ATLAS.md](MONGODB_ATLAS.md)** - MongoDB Atlas setup guide

### Production

- **[PRODUCTION.md](PRODUCTION.md)** - Production deployment guide

## 🚀 Quick Start

```bash
# 1. Setup MongoDB Atlas (see MONGODB_ATLAS.md)
# Get connection string from MongoDB Atlas

# 2. Configure environment
cp .env.docker .env
nano .env  # Add DATABASE_URL and other values

# 3. Start services
docker-compose up -d

# 4. Check logs
docker-compose logs -f app
```

## 📋 What You Need

### Required

- Docker & Docker Compose
- MongoDB Atlas account (free tier available)
- Gmail account (for SMTP)

### Optional

- Firebase account (for push notifications)
- Domain name (for production)
- SSL certificate (for HTTPS)

## 🏗️ Architecture

```
┌─────────────────┐
│   Docker App    │
│   (Node.js)     │
└────────┬────────┘
         │
         ├─────────► MongoDB Atlas (Cloud)
         │
         ├─────────► Firebase (Push Notifications)
         │
         └─────────► Gmail SMTP (Emails)
```

## 📦 What's Included

### Docker Services

- **app** - JobSphere API (Node.js + Express)

### External Services

- **MongoDB Atlas** - Cloud database
- **Firebase** - Push notifications (optional)
- **Gmail SMTP** - Email sending

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

**Optional:**

```env
PORT=4000
API_BASE_URL=http://localhost:4000
CORS_ORIGIN=*
```

### Files

- `.env` - Environment configuration
- `docker-compose.yml` - Docker services
- `Dockerfile` - Application container
- `firebase-service-account.json` - Firebase credentials (optional)

## 📖 Guides by Use Case

### Local Development

1. Read [QUICK_START.md](QUICK_START.md)
2. Setup MongoDB Atlas: [MONGODB_ATLAS.md](MONGODB_ATLAS.md)
3. Start with `docker-compose up -d`

### Testing Production Build Locally

1. Follow local development setup
2. Build runs in production mode by default
3. Test all endpoints before deploying

### Production Deployment

1. Read [PRODUCTION.md](PRODUCTION.md)
2. Setup server with Docker
3. Configure MongoDB Atlas with IP whitelist
4. Setup reverse proxy (Caddy/Nginx)
5. Enable HTTPS
6. Configure automated backups

## 🛠️ Common Commands

### Using PNPM

```bash
pnpm docker:setup      # Initial setup
pnpm docker:start      # Start services
pnpm docker:stop       # Stop services
pnpm docker:logs       # View logs
pnpm docker:build      # Rebuild
```

### Using Make

```bash
make setup             # Initial setup
make start             # Start services
make stop              # Stop services
make logs              # View logs
make build             # Rebuild
make backup            # Backup database
```

### Using Docker Compose

```bash
docker-compose up -d           # Start
docker-compose down            # Stop
docker-compose logs -f app     # Logs
docker-compose ps              # Status
docker-compose restart         # Restart
```

## 🔍 Troubleshooting

### Connection Issues

```bash
# Check logs
docker-compose logs app

# Verify environment
cat .env

# Test connection
curl http://localhost:4000/
```

### Database Issues

- Check MongoDB Atlas IP whitelist
- Verify connection string
- Check user permissions
- See [MONGODB_ATLAS.md](MONGODB_ATLAS.md)

### Container Issues

```bash
# Restart services
docker-compose restart

# Rebuild
docker-compose up -d --build

# Check status
docker-compose ps
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
```

### Metrics

- MongoDB Atlas dashboard
- Docker stats: `docker stats`
- Application logs: `docker-compose logs`

## 🔐 Security

### Best Practices

- ✅ Use strong passwords
- ✅ Generate random JWT secrets (32+ chars)
- ✅ Whitelist IPs in MongoDB Atlas
- ✅ Enable HTTPS in production
- ✅ Regular backups
- ✅ Keep Docker images updated
- ✅ Monitor logs for suspicious activity

### Production Checklist

- [ ] MongoDB Atlas IP whitelist configured
- [ ] Strong database password
- [ ] Random JWT secrets
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring enabled
- [ ] Log rotation configured

## 📈 Scaling

### Vertical Scaling

- Upgrade MongoDB Atlas cluster tier
- Increase Docker container resources

### Horizontal Scaling

- Add Redis for session management
- Scale app instances: `docker-compose up -d --scale app=3`
- Add load balancer (Nginx/Caddy)

## 🆘 Support

### Documentation

- Quick Start: [QUICK_START.md](QUICK_START.md)
- Docker Guide: [README.docker.md](README.docker.md)
- MongoDB Atlas: [MONGODB_ATLAS.md](MONGODB_ATLAS.md)
- Production: [PRODUCTION.md](PRODUCTION.md)

### External Resources

- Docker Docs: https://docs.docker.com/
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Express.js: https://expressjs.com/

### Common Issues

- Check logs: `docker-compose logs`
- Verify config: `docker-compose config`
- Test connection: `curl http://localhost:4000/`

## 🎯 Next Steps

1. **Setup MongoDB Atlas** - [MONGODB_ATLAS.md](MONGODB_ATLAS.md)
2. **Quick Start** - [QUICK_START.md](QUICK_START.md)
3. **Deploy to Production** - [PRODUCTION.md](PRODUCTION.md)
4. **Configure Backups** - See PRODUCTION.md
5. **Setup Monitoring** - See PRODUCTION.md

---

**Ready to deploy?** Start with [QUICK_START.md](QUICK_START.md)! 🚀
