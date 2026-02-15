# Beszel Quick Start

## 🚀 5-Minute Setup

### 1. Start Services

```bash
docker compose up -d
```

### 2. Access Dashboard

Open browser: **http://your-vps-ip:8090**

### 3. Create Admin Account

- Enter email and password
- Click "Create Account"

### 4. Add Server

- Click "Add System"
- **Name:** JobSphere VPS
- **Host:** `/beszel_socket/beszel.sock`
- Click "Generate" to create keys
- Copy the **Token** and **Public Key**

### 5. Configure Agent

```bash
nano .env
```

Add these lines (replace with your actual keys):

```env
BESZEL_TOKEN=your-token-here
BESZEL_KEY=your-key-here
```

### 6. Restart Agent

```bash
docker compose restart beszel-agent
```

### 7. Done! ✅

Your server should now show as "Connected" in the dashboard with live metrics.

---

## 📊 What You'll See

- **CPU Usage** - Real-time processor utilization
- **Memory** - RAM usage and available memory
- **Disk** - Storage usage and I/O stats
- **Network** - Bandwidth (upload/download)
- **Docker** - Container status and resources

---

## 🔧 Common Commands

```bash
# View Beszel logs
docker compose logs beszel

# View agent logs
docker compose logs beszel-agent

# Restart Beszel
docker compose restart beszel beszel-agent

# Stop Beszel
docker compose stop beszel beszel-agent
```

---

## 🌐 Access URLs

- **Dashboard:** http://your-vps-ip:8090
- **API:** http://your-vps-ip:4000
- **API Docs:** http://your-vps-ip:4000/api-docs

---

## 📖 Full Documentation

See [BESZEL-SETUP.md](BESZEL-SETUP.md) for:

- Nginx reverse proxy setup
- HTTPS configuration
- Alert configuration
- Troubleshooting guide
- Advanced features

---

## ❓ Troubleshooting

**Agent not connecting?**

```bash
# Check logs
docker compose logs beszel-agent

# Verify keys in .env
cat .env | grep BESZEL

# Restart agent
docker compose restart beszel-agent
```

**Dashboard not accessible?**

```bash
# Check if running
docker compose ps beszel

# Check firewall
sudo ufw status

# Allow port if needed
sudo ufw allow 8090/tcp
```

---

## 🔒 Security Tips

1. Change default port in `.env`:

   ```env
   BESZEL_PORT=9999
   ```

2. Use strong password for admin account

3. Setup HTTPS via Nginx (see full docs)

4. Restrict access via firewall or Nginx auth
