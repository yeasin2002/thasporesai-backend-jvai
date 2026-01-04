# JobSphere VPS Deployment Guide

This guide walks you through deploying JobSphere API on your VPS with Docker and Nginx.

---

## 📋 Pre-Deployment Checklist

### Required Services
- [ ] MongoDB Atlas account (or MongoDB instance)
- [ ] Gmail account with App Password enabled
- [ ] Firebase project with service account JSON
- [ ] Domain name (optional, can use VPS IP)
- [ ] VPS with Ubuntu/Debian (minimum 2GB RAM)

---

## 🔧 Configuration Files to Update

### 1. `.env` File (Production Environment)

**Location:** `c:\Yeasin\office\thasporesai\thasporesai-backend-jvai\.env`

**Action:** Copy `.env.production.example` to `.env` and update these values:

```bash
# Copy the example file
cp .env.production.example .env
```

**Values to Update:**

| Variable | What to Update | Example | How to Get |
|----------|---------------|---------|------------|
| `DATABASE_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/jobsphere` | MongoDB Atlas → Database → Connect → Drivers |
| `API_BASE_URL` | Your domain or VPS IP | `https://api.yourdomain.com` or `http://123.45.67.89:4000` | Your VPS IP or domain |
| `CORS_ORIGIN` | Frontend domain(s) | `https://yourdomain.com` or `*` for testing | Your frontend URL |
| `ACCESS_SECRET` | Random 64-char string | Generate with: `openssl rand -base64 64` | Run command in terminal |
| `REFRESH_SECRET` | Random 64-char string | Generate with: `openssl rand -base64 64` | Run command in terminal |
| `SMTP_USER` | Gmail address | `yourapp@gmail.com` | Your Gmail account |
| `SMTP_PASS` | Gmail App Password | `abcd efgh ijkl mnop` | Gmail → Security → 2FA → App Passwords |
| `FIREBASE_KEY_PAIR` | Firebase VAPID key | Get from Firebase Console | Firebase → Project Settings → Cloud Messaging |
| `ADMIN_USER_ID` | Admin user MongoDB ID | `507f1f77bcf86cd799439011` | Create admin user first, then add ID |

**Optional (for Stripe payments):**
- `STRIPE_SECRET_KEY` - Get from Stripe Dashboard
- `STRIPE_PUBLISHABLE_KEY` - Get from Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET` - Get from Stripe Webhooks

---

### 2. Nginx Configuration

**Location:** `c:\Yeasin\office\thasporesai\thasporesai-backend-jvai\nginx\jobsphere.conf`

**Lines to Update:**

#### Line 11: Server Name
```nginx
server_name your-domain.com;  # Replace with your domain or VPS IP
```

**Update to:**
- **With Domain:** `server_name api.yourdomain.com;`
- **Without Domain (IP only):** `server_name 123.45.67.89;` or `server_name _;`

#### Line 67: Uploads Path (Optional - for direct file serving)
```nginx
alias /path/to/your/project/uploads/;  # Update this path
```

**Update to:**
```nginx
alias /opt/jobsphere/uploads/;
```
(Assuming you clone the project to `/opt/jobsphere`)

**Or comment out this entire location block if you want Docker to serve files:**
```nginx
# location /uploads/ {
#     alias /opt/jobsphere/uploads/;
#     expires 30d;
#     add_header Cache-Control "public, immutable";
# }
```

#### Lines 92-116: HTTPS Configuration (After SSL setup)

**When to update:** After obtaining SSL certificate with Let's Encrypt

**Uncomment and update:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;  # Your domain

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    # ... rest of SSL config
}
```

---

### 3. Deploy Script

**Location:** `c:\Yeasin\office\thasporesai\thasporesai-backend-jvai\deploy.sh`

**Lines to Update:**

#### Line 37: Git Branch (Optional)
```bash
git pull origin main || git pull origin master
```

**Update to your branch name if different:**
```bash
git pull origin production
```

**Or remove this section if not using git on VPS:**
```bash
# Pull latest changes (if using git)
# if [ -d .git ]; then
#     echo -e "${GREEN}Pulling latest changes...${NC}"
#     git pull origin main || git pull origin master
# fi
```

---

## 🚀 Deployment Steps on VPS

### Step 1: Connect to VPS
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### Step 2: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Install Nginx
sudo apt install nginx -y

# Install certbot (for SSL)
sudo apt install certbot python3-certbot-nginx -y
```

### Step 3: Clone Project
```bash
# Create directory
sudo mkdir -p /opt/jobsphere
cd /opt/jobsphere

# Clone your repository
git clone https://github.com/yeasin2002/thasporesai-backend-jvai.git .

# Or upload files via SCP/SFTP if not using git
```

### Step 4: Configure Environment
```bash
# Copy and edit .env file
cp .env.production.example .env
nano .env
# Fill in all the values from the table above
# Save: Ctrl+X, then Y, then Enter
```

### Step 5: Upload Firebase Credentials
```bash
# Upload firebase-service-account.json to /opt/jobsphere/
# Use SCP from your local machine:
scp firebase-service-account.json root@your-vps-ip:/opt/jobsphere/

# Or create and paste content:
nano /opt/jobsphere/firebase-service-account.json
# Paste JSON content, save and exit
```

### Step 6: Setup Nginx
```bash
# Copy nginx config
sudo cp nginx/jobsphere.conf /etc/nginx/sites-available/jobsphere

# Edit the config (update server_name and paths)
sudo nano /etc/nginx/sites-available/jobsphere

# Create symlink
sudo ln -s /etc/nginx/sites-available/jobsphere /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 7: Deploy Application
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Step 8: Verify Deployment
```bash
# Check if container is running
docker ps

# Check logs
docker compose logs -f app

# Test API
curl http://localhost:4000/
# Should return: {"status":200,"message":"JobSphere API is running","success":true}

# Test from outside
curl http://your-vps-ip/
```

### Step 9: Setup SSL (Optional but Recommended)
```bash
# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Certbot will automatically configure nginx
# Follow the prompts

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🔍 Verification Checklist

After deployment, verify these endpoints:

- [ ] `http://your-vps-ip/` - API health check
- [ ] `http://your-vps-ip/api-docs` - Swagger documentation
- [ ] `http://your-vps-ip/scaler` - Scalar API docs
- [ ] `http://your-vps-ip/api/location` - Test public endpoint
- [ ] WebSocket connection (test with Flutter app)

---

## 📝 Post-Deployment Tasks

### 1. Create Admin User
```bash
# Use API client or curl to create admin user
# Then update ADMIN_USER_ID in .env
```

### 2. Setup Monitoring (Optional)
```bash
# View logs
docker compose logs -f app

# Check container stats
docker stats

# Setup log rotation
sudo nano /etc/logrotate.d/jobsphere
```

### 3. Setup Firewall
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 4. Setup Automatic Backups
```bash
# MongoDB Atlas has automatic backups
# For local files (uploads), setup cron job:
crontab -e

# Add daily backup at 2 AM:
0 2 * * * tar -czf /backup/uploads-$(date +\%Y\%m\%d).tar.gz /opt/jobsphere/uploads
```

---

## 🔄 Update/Redeploy

To update the application after code changes:

```bash
cd /opt/jobsphere
./deploy.sh
```

The script will:
1. Pull latest changes (if using git)
2. Rebuild Docker containers
3. Restart the application
4. Run health check

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker compose logs app

# Check if port 4000 is in use
sudo lsof -i :4000

# Restart Docker
sudo systemctl restart docker
docker compose up -d
```

### Nginx errors
```bash
# Test config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### Database connection issues
```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test MongoDB connection from container
docker compose exec app node -e "require('mongoose').connect(process.env.DATABASE_URL).then(() => console.log('Connected')).catch(e => console.log(e))"
```

### WebSocket not working
```bash
# Verify nginx WebSocket config
sudo nginx -t

# Check if upgrade headers are set
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:4000/socket.io/
```

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker compose logs -f app`
2. Verify all environment variables are set correctly
3. Ensure all required services (MongoDB, Firebase) are accessible
4. Check firewall rules
5. Review nginx error logs: `sudo tail -f /var/log/nginx/error.log`

---

## 🔐 Security Recommendations

- [ ] Use strong, unique secrets for JWT tokens
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Set CORS_ORIGIN to specific domains (not `*`)
- [ ] Keep Docker and system packages updated
- [ ] Use MongoDB Atlas IP whitelist
- [ ] Enable firewall (ufw)
- [ ] Regular backups of database and uploads
- [ ] Monitor logs for suspicious activity
- [ ] Use environment-specific Firebase projects
- [ ] Rotate secrets periodically

---

## 📊 Monitoring

### View Application Logs
```bash
docker compose logs -f app
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Container Health
```bash
docker ps
docker stats
```

### Database Monitoring
- Use MongoDB Atlas monitoring dashboard
- Set up alerts for high CPU/memory usage

---

**Last Updated:** December 2025  
**Project:** JobSphere API  
**Version:** 1.0.0
