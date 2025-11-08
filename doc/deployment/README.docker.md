# Docker Deployment Guide

Simple Docker setup for running JobSphere in production or testing production build locally.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB free disk space

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.docker .env

# Edit with your values
nano .env
```

**Required changes in `.env`:**
- `MONGO_ROOT_PASSWORD` - Strong password for MongoDB
- `ACCESS_SECRET` - Random 32+ character string
- `REFRESH_SECRET` - Random 32+ character string
- `SMTP_USER` - Your Gmail address
- `SMTP_PASS` - Gmail app password
- `API_BASE_URL` - Your domain (production) or `http://localhost:4000` (local)
- `CORS_ORIGIN` - Your frontend URL or `*` for all

### 2. Firebase Setup (Optional)

If using push notifications:

```bash
# Download firebase-service-account.json from Firebase Console
# Place it in project root
ls firebase-service-account.json
```

### 3. Start Services

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app
```

### 4. Verify Deployment

```bash
# Check health
curl http://localhost:4000/

# Check API docs
open http://localhost:4000/swagger
```

## Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart app only
docker-compose restart app

# Rebuild after code changes
docker-compose up -d --build
```

### Database Operations

```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p your_password

# Backup database
docker-compose exec mongodb mongodump --out=/data/backup --authenticationDatabase=admin -u admin -p your_password

# Restore database
docker-compose exec mongodb mongorestore /data/backup --authenticationDatabase=admin -u admin -p your_password
```

### Maintenance

```bash
# View running containers
docker-compose ps

# Check resource usage
docker stats

# View app logs (last 100 lines)
docker-compose logs --tail=100 app

# Execute command in app container
docker-compose exec app node -v
```

## Production Deployment

### VPS Deployment (DigitalOcean, AWS EC2, etc.)

1. **Install Docker on server:**

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

2. **Clone repository:**

```bash
git clone <your-repo-url>
cd jobsphere
```

3. **Configure environment:**

```bash
cp .env.docker .env
nano .env  # Update with production values
```

4. **Start services:**

```bash
docker-compose up -d
```

5. **Setup reverse proxy (recommended):**

Install Nginx or Caddy for SSL/HTTPS:

```bash
# Install Caddy (easiest for SSL)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Create Caddyfile
sudo nano /etc/caddy/Caddyfile
```

**Caddyfile content:**

```
your-domain.com {
    reverse_proxy localhost:4000
}
```

```bash
# Restart Caddy
sudo systemctl restart caddy
```

### Environment Variables for Production

```env
# Use strong passwords
MONGO_ROOT_PASSWORD=<generate-strong-password>

# Use your domain
API_BASE_URL=https://your-domain.com
CORS_ORIGIN=https://your-frontend-domain.com

# Generate strong secrets (32+ chars)
ACCESS_SECRET=<generate-random-string>
REFRESH_SECRET=<generate-random-string>

# Your email credentials
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Generate secrets:**

```bash
# Linux/Mac
openssl rand -base64 32

# Or use online generator
# https://www.random.org/strings/
```

## Testing Production Build Locally

Test the production Docker build on your local machine before deploying:

```bash
# 1. Use local environment
cp .env.docker .env
nano .env  # Set API_BASE_URL=http://localhost:4000

# 2. Build and start
docker-compose up -d --build

# 3. Test endpoints
curl http://localhost:4000/
curl http://localhost:4000/api/category

# 4. Check logs
docker-compose logs -f app

# 5. Stop when done
docker-compose down
```

## Data Persistence

### Volumes

- `mongodb_data` - Database files (persisted)
- `./uploads` - User uploaded files (bind mount)
- `./logs` - Application logs (bind mount)

### Backup Strategy

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --archive=/data/backup.archive --gzip --authenticationDatabase=admin -u admin -p your_password
docker cp jobsphere-mongodb:/data/backup.archive ./backup-$(date +%Y%m%d).archive

# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup to remote (optional)
scp backup-*.archive user@backup-server:/backups/
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check if port is in use
sudo lsof -i :4000  # Linux/Mac
netstat -ano | findstr :4000  # Windows

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Database connection failed

```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify credentials in .env
cat .env | grep MONGO
```

### Permission errors

```bash
# Fix uploads folder permissions
sudo chown -R 1000:1000 uploads/
sudo chmod -R 755 uploads/

# Fix logs folder
sudo chown -R 1000:1000 logs/
sudo chmod -R 755 logs/
```

### Out of disk space

```bash
# Clean Docker resources
docker system prune -a --volumes

# Check disk usage
docker system df
df -h
```

### App crashes on startup

```bash
# Check logs for errors
docker-compose logs app

# Common issues:
# - Missing firebase-service-account.json (optional, can be ignored)
# - Invalid DATABASE_URL
# - Missing environment variables
# - Port already in use
```

## Monitoring

### Health Checks

```bash
# App health
curl http://localhost:4000/

# MongoDB health
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')" --quiet

# Container health status
docker inspect --format='{{.State.Health.Status}}' jobsphere-app
```

### Logs

```bash
# Real-time logs
docker-compose logs -f

# App logs only
docker-compose logs -f app

# Last 50 lines
docker-compose logs --tail=50 app

# Since specific time
docker-compose logs --since 30m app
```

### Resource Usage

```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Container details
docker inspect jobsphere-app
```

## Security Best Practices

1. **Change default passwords** - Never use default values in production
2. **Use strong secrets** - Minimum 32 characters for JWT secrets
3. **Limit MongoDB access** - Don't expose port 27017 publicly
4. **Use HTTPS** - Always use SSL/TLS in production (Caddy/Nginx)
5. **Regular updates** - Keep Docker images updated
6. **Backup regularly** - Automate database and file backups
7. **Monitor logs** - Check logs for suspicious activity
8. **Firewall rules** - Only expose necessary ports (80, 443)

## Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f app
```

## Scaling (Advanced)

For high traffic, use Redis and multiple app instances:

1. **Add Redis to docker-compose.yml:**

```yaml
redis:
  image: redis:7-alpine
  container_name: jobsphere-redis
  restart: unless-stopped
  networks:
    - jobsphere-network
```

2. **Update app environment:**

```yaml
environment:
  REDIS_URL: redis://redis:6379
```

3. **Scale app instances:**

```bash
docker-compose up -d --scale app=3
```

4. **Add load balancer** (Nginx/Caddy) to distribute traffic

## Support

**Common Issues:**
- Check logs: `docker-compose logs app`
- Verify environment: `docker-compose config`
- Test database: `docker-compose exec mongodb mongosh`

**Resources:**
- Docker docs: https://docs.docker.com/
- MongoDB docs: https://docs.mongodb.com/
- Project docs: `/doc` folder
