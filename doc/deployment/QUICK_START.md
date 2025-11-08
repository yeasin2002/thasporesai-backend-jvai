# Quick Start - Docker Deployment

Get JobSphere running in 5 minutes.

## Prerequisites

- Docker & Docker Compose installed
- 2GB free disk space

## Steps

### 1. Clone & Navigate

```bash
git clone <your-repo>
cd jobsphere
```

### 2. Configure Environment

```bash
# Copy template
cp .env.docker .env

# Edit (required)
nano .env
```

**Minimum required changes:**

```env
MONGO_ROOT_PASSWORD=your_strong_password_here
ACCESS_SECRET=random_32_character_string_here_abc123
REFRESH_SECRET=random_32_character_string_here_xyz789
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

### 3. Start Services

```bash
docker-compose up -d
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

### 5. Access

- **API**: http://localhost:4000
- **Swagger Docs**: http://localhost:4000/swagger
- **Scalar Docs**: http://localhost:4000/scaler

## Common Commands

```bash
# Stop
docker-compose down

# Restart
docker-compose restart

# View logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build
```

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env
PORT=5000
docker-compose up -d
```

**Database connection failed:**
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Check logs
docker-compose logs mongodb
```

**Permission errors:**
```bash
# Fix permissions
sudo chown -R 1000:1000 uploads/ logs/
```

## Next Steps

- Read full guide: `doc/deployment/README.docker.md`
- Configure Firebase for push notifications
- Setup reverse proxy for production (Nginx/Caddy)
- Configure automated backups
