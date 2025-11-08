# Production Deployment Guide

Deploy JobSphere to production servers (VPS, AWS EC2, DigitalOcean, etc.)

## Server Requirements

- Ubuntu 20.04+ / Debian 11+ (recommended)
- 2GB RAM minimum (4GB recommended)
- 20GB disk space
- Docker & Docker Compose installed

## Deployment Steps

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose (if not included)
sudo apt install docker-compose-plugin

# Logout and login for group changes
exit
```

### 2. Clone Repository

```bash
# Clone your repository
git clone <your-repo-url>
cd jobsphere

# Or upload files via SCP/SFTP
```

### 3. Configure Environment

```bash
# Copy template
cp .env.docker .env

# Edit with production values
nano .env
```

**Production environment variables:**

```env
# MongoDB - Use strong password
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=<generate-strong-password>
MONGO_DB_NAME=jobsphere
MONGO_PORT=27017

# Application - Use your domain
PORT=4000
API_BASE_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# JWT - Generate random 32+ character strings
ACCESS_SECRET=<generate-random-string-32-chars>
REFRESH_SECRET=<generate-random-string-32-chars>

# Email
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
```

**Generate secrets:**

```bash
# Generate random strings
openssl rand -base64 32
openssl rand -base64 32
```

### 4. Firebase Setup (Optional)

```bash
# Upload firebase-service-account.json to server
scp firebase-service-account.json user@server:/path/to/jobsphere/

# Or create it on server
nano firebase-service-account.json
# Paste content and save
```

### 5. Start Services

```bash
# Build and start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### 6. Setup Reverse Proxy (SSL/HTTPS)

#### Option A: Caddy (Easiest - Auto SSL)

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
```

**Caddyfile:**

```
api.yourdomain.com {
    reverse_proxy localhost:4000
}
```

```bash
# Restart Caddy
sudo systemctl restart caddy
sudo systemctl enable caddy
```

#### Option B: Nginx

```bash
# Install Nginx
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/jobsphere
```

**Nginx config:**

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/jobsphere /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### 7. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Don't expose MongoDB port publicly
# Port 27017 should only be accessible from localhost
```

### 8. Verify Deployment

```bash
# Check services
docker-compose ps

# Test API
curl https://api.yourdomain.com/

# Check logs
docker-compose logs -f app
```

## Post-Deployment

### Setup Automated Backups

```bash
# Create backup script
nano /home/user/backup.sh
```

**backup.sh:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/user/backups"

# Load environment variables
source /path/to/jobsphere/.env

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB Atlas
mongodump --uri="$DATABASE_URL" \
  --archive=$BACKUP_DIR/mongodb_$DATE.archive \
  --gzip

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz \
  /path/to/jobsphere/uploads/

# Delete old backups (keep last 7 days)
find $BACKUP_DIR -name "*.archive" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Note:** MongoDB Atlas paid tiers include automatic backups. Free tier (M0) requires manual backups.

```bash
# Make executable
chmod +x /home/user/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

**Crontab entry:**

```
0 2 * * * /home/user/backup.sh >> /home/user/backup.log 2>&1
```

### Setup Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop

# Monitor Docker
docker stats

# Monitor logs
docker-compose logs -f --tail=100
```

### Setup Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/jobsphere
```

**Logrotate config:**

```
/path/to/jobsphere/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

## Updating Application

```bash
# Navigate to project
cd /path/to/jobsphere

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f app
```

## Rollback

```bash
# Stop current version
docker-compose down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild
docker-compose up -d --build
```

## Scaling

For high traffic, scale horizontally:

### 1. Add Redis

Edit `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: jobsphere-redis
  restart: unless-stopped
  networks:
    - jobsphere-network
```

### 2. Update App Config

```yaml
app:
  environment:
    REDIS_URL: redis://redis:6379
```

### 3. Scale App Instances

```bash
docker-compose up -d --scale app=3
```

### 4. Add Load Balancer

Use Nginx/Caddy to distribute traffic across instances.

## Security Checklist

- [ ] MongoDB Atlas IP whitelist configured
- [ ] Strong database user password
- [ ] Random JWT secrets (32+ chars)
- [ ] HTTPS enabled (SSL certificate)
- [ ] Firewall configured (UFW)
- [ ] Regular backups automated
- [ ] Log rotation configured
- [ ] Server updates automated
- [ ] SSH key authentication only
- [ ] Fail2ban installed (optional)
- [ ] MongoDB Atlas monitoring enabled

## Monitoring & Alerts

### Setup Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor:
- `https://api.yourdomain.com/` (health check)
- Response time
- SSL certificate expiry

### Setup Error Alerts

Configure email alerts for:
- Container crashes
- High CPU/memory usage
- Disk space warnings
- Failed backups

## Troubleshooting

### High Memory Usage

```bash
# Check memory
free -h

# Check Docker stats
docker stats

# Restart app
docker-compose restart app
```

### Disk Space Full

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Clean old logs
sudo journalctl --vacuum-time=7d
```

### Database Issues

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p your_password

# Repair database (if needed)
docker-compose exec mongodb mongod --repair
```

## Support

For production issues:
- Check logs: `docker-compose logs`
- Monitor resources: `docker stats`
- Review documentation: `/doc` folder
- Contact support: your-support-email@domain.com
