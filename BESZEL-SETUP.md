# Beszel Server Monitoring Setup Guide

## What is Beszel?

Beszel is a lightweight server monitoring solution that provides real-time insights into your VPS performance:

- 📊 CPU, Memory, Disk, and Network usage
- 🐳 Docker container monitoring
- 📈 Historical data and charts
- 🔔 Alert notifications
- 🌐 Web-based dashboard
- 🪶 Lightweight (minimal resource usage)

## Architecture

Beszel consists of two components:

1. **Beszel Hub** - Web dashboard (runs on port 8090)
2. **Beszel Agent** - Collects system metrics (communicates via Unix socket)

Both are included in your `docker-compose.yml` and will start automatically.

## Quick Start

### 1. Start Beszel Services

Beszel is already configured in your `docker-compose.yml`. Just start it:

```bash
# Start all services (including Beszel)
docker compose up -d

# Or start only Beszel services
docker compose up -d beszel beszel-agent
```

### 2. Access the Dashboard

Open your browser and navigate to:

- **Local:** http://localhost:8090
- **VPS:** http://your-vps-ip:8090

### 3. Initial Setup

On first access, you'll be prompted to create an admin account:

1. Enter your email
2. Set a strong password
3. Click "Create Account"

### 4. Add Your Server

After logging in, add your server to start monitoring:

1. Click "Add System" or "+" button
2. Fill in the details:
   - **Name:** JobSphere VPS (or any name you prefer)
   - **Host / IP:** `/beszel_socket/beszel.sock`
   - **Port:** Leave empty (using Unix socket)
   - **Public Key:** Copy the key shown in the UI

3. Click "Generate" to create a new key pair
4. Copy the **Token** and **Public Key** shown

### 5. Configure Agent with Keys

Update your `.env` file with the generated keys:

```bash
nano .env
```

Add these values (replace with your actual keys from step 4):

```env
BESZEL_TOKEN=your-generated-token-here
BESZEL_KEY=your-generated-public-key-here
```

### 6. Restart Agent

Restart the agent to apply the new configuration:

```bash
docker compose restart beszel-agent
```

### 7. Verify Connection

Go back to the Beszel dashboard. Your server should now show as "Connected" with live metrics.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Beszel Monitoring
BESZEL_PORT=8090
BESZEL_APP_URL=http://localhost:8090
BESZEL_HUB_URL=http://localhost:8090
BESZEL_TOKEN=your-token-here
BESZEL_KEY=your-key-here
```

### For Production/VPS

Update `BESZEL_APP_URL` to your domain or VPS IP:

```env
BESZEL_APP_URL=http://your-vps-ip:8090
# Or with domain:
BESZEL_APP_URL=https://monitor.yourdomain.com
```

## Nginx Reverse Proxy (Optional)

To access Beszel via a subdomain with HTTPS:

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/beszel
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name monitor.yourdomain.com;

    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/beszel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Add SSL Certificate

```bash
sudo certbot --nginx -d monitor.yourdomain.com
```

### 4. Update Environment

Update `.env`:

```env
BESZEL_APP_URL=https://monitor.yourdomain.com
```

Restart Beszel:

```bash
docker compose restart beszel
```

## Firewall Configuration

If using UFW firewall, allow port 8090:

```bash
# Allow Beszel port
sudo ufw allow 8090/tcp

# Or if using Nginx reverse proxy, only allow Nginx
sudo ufw allow 'Nginx Full'
```

## Features

### Dashboard Overview

- **CPU Usage:** Real-time CPU utilization
- **Memory:** RAM usage and available memory
- **Disk:** Storage usage and I/O stats
- **Network:** Bandwidth usage (upload/download)
- **Docker:** Container status and resource usage

### Alerts (Optional)

Set up alerts for critical metrics:

1. Go to Settings → Alerts
2. Configure thresholds:
   - CPU > 80%
   - Memory > 90%
   - Disk > 85%
3. Add notification channels (email, webhook, etc.)

### Historical Data

- View historical charts (1h, 6h, 24h, 7d, 30d)
- Export data for analysis
- Compare metrics over time

## Troubleshooting

### Dashboard Not Accessible

```bash
# Check if Beszel is running
docker compose ps beszel

# Check logs
docker compose logs beszel

# Restart Beszel
docker compose restart beszel
```

### Agent Not Connecting

```bash
# Check agent status
docker compose ps beszel-agent

# Check agent logs
docker compose logs beszel-agent

# Verify socket file exists
ls -la beszel_socket/

# Restart agent
docker compose restart beszel-agent
```

### "Invalid Token" Error

1. Generate new keys in Beszel UI
2. Update `.env` with new TOKEN and KEY
3. Restart agent: `docker compose restart beszel-agent`

### Socket Permission Issues

```bash
# Check socket permissions
ls -la beszel_socket/beszel.sock

# Fix permissions if needed
sudo chmod 666 beszel_socket/beszel.sock
```

## Useful Commands

```bash
# View Beszel logs
docker compose logs -f beszel

# View agent logs
docker compose logs -f beszel-agent

# Restart Beszel services
docker compose restart beszel beszel-agent

# Stop Beszel services
docker compose stop beszel beszel-agent

# Remove Beszel (keeps data)
docker compose stop beszel beszel-agent
docker compose rm beszel beszel-agent

# Remove Beszel and data
docker compose down beszel beszel-agent
rm -rf beszel_data beszel_agent_data beszel_socket
```

## Data Persistence

Beszel data is stored in these directories:

- `./beszel_data` - Dashboard data (users, settings, historical metrics)
- `./beszel_agent_data` - Agent data
- `./beszel_socket` - Unix socket for communication

These directories are automatically created and persisted across container restarts.

## Backup

To backup Beszel data:

```bash
# Backup dashboard data
tar -czf beszel-backup-$(date +%Y%m%d).tar.gz beszel_data/

# Restore from backup
tar -xzf beszel-backup-YYYYMMDD.tar.gz
```

## Security Recommendations

1. **Change default port** if exposed to internet:
   ```env
   BESZEL_PORT=9999  # Use non-standard port
   ```

2. **Use strong password** for admin account

3. **Enable HTTPS** via Nginx reverse proxy

4. **Restrict access** via firewall or Nginx auth:
   ```nginx
   auth_basic "Restricted Access";
   auth_basic_user_file /etc/nginx/.htpasswd;
   ```

5. **Regular updates:**
   ```bash
   docker compose pull beszel beszel-agent
   docker compose up -d beszel beszel-agent
   ```

## Uninstall

To completely remove Beszel:

```bash
# Stop and remove containers
docker compose stop beszel beszel-agent
docker compose rm beszel beszel-agent

# Remove data directories
rm -rf beszel_data beszel_agent_data beszel_socket

# Remove from docker-compose.yml
# (Comment out or delete the beszel and beszel-agent services)

# Remove environment variables from .env
# (Delete BESZEL_* variables)
```

## Resources

- [Beszel Official Documentation](https://beszel.dev/)
- [Beszel GitHub Repository](https://github.com/henrygd/beszel)
- [Docker Hub - Beszel](https://hub.docker.com/r/henrygd/beszel)

## Support

If you encounter issues:

1. Check logs: `docker compose logs beszel beszel-agent`
2. Verify `.env` configuration
3. Ensure Docker socket is accessible
4. Check firewall rules
5. Review Beszel documentation

## Integration with JobSphere

Beszel runs alongside your JobSphere API and monitors:

- JobSphere container resource usage
- Overall VPS performance
- MongoDB connection impact
- Network traffic from API requests
- Disk usage from uploads and logs

This helps you:
- Identify performance bottlenecks
- Plan resource scaling
- Monitor API health
- Detect unusual activity
- Optimize server costs
