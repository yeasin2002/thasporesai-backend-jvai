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
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jobsphere?retryWrites=true&w=majority
ACCESS_SECRET=random_32_character_string_here_abc123
REFRESH_SECRET=random_32_character_string_here_xyz789
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

**Get MongoDB Atlas connection string:**
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for dev)
5. Get connection string

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
# Check app logs
docker-compose logs app

# Verify DATABASE_URL
cat .env | grep DATABASE_URL

# Common issues:
# - IP not whitelisted in MongoDB Atlas
# - Wrong username/password
# - Special characters in password not URL-encoded
```

**Permission errors:**
```bash
# Fix permissions
sudo chown -R 1000:1000 uploads/ logs/
```

## Next Steps

- Read full guide: `doc/deployment/README.docker.md`
- MongoDB Atlas setup: `doc/deployment/MONGODB_ATLAS.md`
- Configure Firebase for push notifications
- Setup reverse proxy for production (Nginx/Caddy)
- Configure automated backups
