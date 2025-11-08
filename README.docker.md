# Docker Setup Guide for JobSphere

This guide covers Docker setup for both local development and production deployment.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB free disk space

## Quick Start

### Local Development

```bash
# 1. Copy environment file
cp .env.docker .env

# 2. Edit .env with your configuration
nano .env

# 3. Start development environment
docker-compose --profile dev up -d

# 4. View logs
docker-compose logs -f app-dev

# 5. Stop services
docker-compose --profile dev down
```

### Production Deployment

```bash
# 1. Copy and configure environment
cp .env.docker .env
nano .env  # Update with production values

# 2. Ensure firebase-service-account.json exists
ls firebase-service-account.json

# 3. Build and start production services
docker-compose --profile prod up -d

# 4. View logs
docker-compose logs -f app

# 5. Check health
curl http://localhost:4000/health
```

## Docker Compose Profiles

The setup uses Docker Compose profiles for different environments:

- **dev**: Development environment with hot reload
- **prod**: Production environment with optimized build
- **redis**: Optional Redis for Socket.IO scaling

### Start specific profiles

```bash
# Development only
docker-compose --profile dev up -d

# Production with Redis
docker-compose --profile prod --profile redis up -d

# All services
docker-compose --profile dev --profile prod --profile redis up -d
```

## Environment Configuration

### Required Environment Variables

```env
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=strong_password_here
MONGO_DB_NAME=jobsphere

# Application
PORT=4000
API_BASE_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:3000

# JWT Secrets (min 32 characters)
ACCESS_SECRET=your-access-secret-min-32-chars
REFRESH_SECRET=your-refresh-secret-min-32-chars

# Email (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Firebase Setup

1. Download `firebase-service-account.json` from Firebase Console
2. Place it in project root
3. Ensure it's mounted in docker-compose.yml (already configured)

## Available Commands

### Development

```bash
# Start development environment
docker-compose --profile dev up -d

# Rebuild after code changes
docker-compose --profile dev up -d --build

# View real-time logs
docker-compose logs -f app-dev

# Execute commands in container
docker-compose exec app-dev pnpm check-types
docker-compose exec app-dev pnpm check

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p changeme
```

### Production

```bash
# Start production environment
docker-compose --profile prod up -d

# Rebuild production image
docker-compose --profile prod up -d --build

# View logs
docker-compose logs -f app

# Scale application (requires Redis)
docker-compose --profile prod --profile redis up -d --scale app=3

# Backup MongoDB
docker-compose exec mongodb mongodump --out=/data/backup

# Restore MongoDB
docker-compose exec mongodb mongorestore /data/backup
```

### Maintenance

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# View running containers
docker-compose ps

# Check resource usage
docker stats

# Clean up unused images
docker image prune -a

# View container logs
docker-compose logs app
docker-compose logs mongodb
docker-compose logs redis
```

## Production Deployment Options

### Option 1: Using docker-compose.yml (Recommended for VPS)

```bash
# Start with production profile
docker-compose --profile prod up -d
```

### Option 2: Using docker-compose.prod.yml (Advanced)

```bash
# Start production-optimized setup
docker-compose -f docker-compose.prod.yml up -d

# With Nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile nginx up -d
```

### Option 3: Standalone Docker (No Compose)

```bash
# Build image
docker build -t jobsphere:latest --target production .

# Run MongoDB
docker run -d --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=changeme \
  -v mongodb_data:/data/db \
  mongo:7.0

# Run application
docker run -d --name jobsphere \
  -p 4000:4000 \
  --link mongodb:mongodb \
  -e DATABASE_URL=mongodb://admin:changeme@mongodb:27017/jobsphere?authSource=admin \
  -e ACCESS_SECRET=your-secret \
  -e REFRESH_SECRET=your-secret \
  -v ./uploads:/app/uploads \
  -v ./firebase-service-account.json:/app/firebase-service-account.json:ro \
  jobsphere:latest
```

## Volumes and Data Persistence

### Persistent Volumes

- `mongodb_data`: MongoDB database files
- `mongodb_config`: MongoDB configuration
- `redis_data`: Redis persistence (if using Redis)

### Bind Mounts

- `./uploads`: User-uploaded files
- `./logs`: Application logs
- `./firebase-service-account.json`: Firebase credentials (read-only)

### Backup Strategy

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --archive=/data/backup.archive --gzip

# Copy backup to host
docker cp jobsphere-mongodb:/data/backup.archive ./backup-$(date +%Y%m%d).archive

# Backup uploads folder
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/
```

## Networking

All services communicate through the `jobsphere-network` bridge network:

- **mongodb**: Accessible at `mongodb:27017` from app container
- **redis**: Accessible at `redis:6379` from app container
- **app**: Exposed on host port 4000

## Health Checks

### Application Health Check

```bash
# Check if app is healthy
curl http://localhost:4000/health

# Docker health status
docker inspect --format='{{.State.Health.Status}}' jobsphere-app
```

### MongoDB Health Check

```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Redis Health Check

```bash
# Check Redis status
docker-compose exec redis redis-cli ping
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check if port is already in use
lsof -i :4000  # Linux/Mac
netstat -ano | findstr :4000  # Windows

# Restart services
docker-compose restart
```

### Database connection issues

```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection from app container
docker-compose exec app-dev node -e "require('mongoose').connect(process.env.DATABASE_URL).then(() => console.log('Connected')).catch(console.error)"
```

### Permission issues with volumes

```bash
# Fix upload folder permissions
sudo chown -R 1000:1000 uploads/
sudo chmod -R 755 uploads/
```

### Out of disk space

```bash
# Clean up Docker resources
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Check disk usage
docker system df
```

## Security Best Practices

1. **Change default passwords** in `.env` file
2. **Use strong JWT secrets** (min 32 characters)
3. **Don't commit** `.env` or `firebase-service-account.json`
4. **Limit MongoDB exposure** to localhost in production
5. **Use HTTPS** with reverse proxy (Nginx/Caddy)
6. **Regular backups** of database and uploads
7. **Update base images** regularly for security patches
8. **Use Docker secrets** for sensitive data in production

## Performance Optimization

### Production Optimizations

- Multi-stage build reduces image size
- Only production dependencies installed
- Node.js runs in production mode
- Health checks ensure service availability

### Scaling with Redis

```bash
# Start with Redis for Socket.IO scaling
docker-compose --profile prod --profile redis up -d

# Scale app instances
docker-compose --profile prod up -d --scale app=3
```

### Resource Limits

Add to docker-compose.yml:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push
        run: |
          docker build -t jobsphere:latest .
          docker push jobsphere:latest
      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app
```

### Resource Usage

```bash
# Real-time stats
docker stats

# Container inspect
docker inspect jobsphere-app
```

## Support

For issues or questions:

- Check logs: `docker-compose logs`
- Verify environment: `docker-compose config`
- Review documentation in `/doc` folder
