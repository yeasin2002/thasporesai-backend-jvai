# Beszel Monitoring - Quick Start Guide

## 🚀 5-Minute Setup

### Option 1: Automated Setup (Recommended)

**Windows:**

```powershell
.\scripts\setup-beszel.ps1
```

**Linux/Mac:**

```bash
chmod +x scripts/setup-beszel.sh
./scripts/setup-beszel.sh
```

The script will:

- ✅ Check Docker is running
- ✅ Pull Beszel images
- ✅ Start the Hub
- ✅ Wait for Hub to be ready
- ✅ Display next steps

### Option 2: Manual Setup

```bash
# 1. Pull images
docker-compose pull beszel-hub beszel-agent

# 2. Start Hub
docker-compose up -d beszel-hub

# 3. Wait 30-40 seconds for Hub to be ready
# Check status: docker-compose ps beszel-hub

# 4. Open http://localhost:8090 and create admin account

# 5. Add system and copy the KEY

# 6. Update .env file:
# BESZEL_AGENT_KEY=your_copied_key_here

# 7. Start Agent
docker-compose up -d beszel-agent

# 8. Verify in dashboard - system should show "Online"
```

## 📊 Access Dashboard

Open in your browser:

```
http://localhost:8090
```

**First-time setup:**

1. Create admin account
2. Click "Add System"
3. Name: "JobSphere Local"
4. Copy the generated KEY
5. Add to `.env`: `BESZEL_AGENT_KEY=your_key`
6. Restart agent: `docker-compose restart beszel-agent`

## ✅ Verification Checklist

p, beszel-hub, beszel-agent)

- [ ] Real-time updates (1-second interval)

## 🔧 Common Commands

```bash
# View logs
docker-compose logs -f beszel-hub beszel-agent

# Restart monitoring
docker-compose restart beszel-hub beszel-agent

# Stop monitoring (app continues running)
docker-compose stop beszel-hub beszel-agent

# Start monitoring
docker-compose start beszel-hub beszel-agent

# Check status
docker-compose ps beszel-hub beszel-agent

# View Hub health
docker inspect beszel-hub --format='{{.State.Health.Status}}'
```

## 🐛 Troubleshooting

### Hub not accessible

```bash
# Check if running
docker-compose ps beszel-hub

# Check logs
docker-compose logs beszel-hub

# Verify port not in use
netstat -ano | findstr :8090  # Windows
lsof -i :8090                 # Linux/Mac
```

### Agent not connecting

```bash
# Check Agent logs
docker-compose logs beszel-agent

# Verify KEY is set in .env
cat .env | grep BESZEL_AGENT_KEY

# Restart Agent
docker-compose restart beszel-agent
```

### No container metrics

```bash
# Verify Docker socket mount (Linux/Mac)
docker-compose exec beszel-agent ls -la /var/run/docker.sock

# Check Agent can access Docker
docker-compose exec beszel-agent docker ps
```

## 📚 Full Documentation

For detailed information, see:

- **Complete Guide**: `doc/deployment/Beszel-monitoring.md`
- **Spec Documents**: `.kiro/specs/beszel-monitoring-integration/`

## 🎯 What Gets Monitored

**System Metrics:**

- CPU usage (per core + total)
- RAM (total, used, available)
- Disk I/O (read/write)
- Network (bytes sent/received)

**Container Metrics:**

- Per-container CPU/RAM
- Container network I/O
- Container status

**Data Retention:**

- 30+ days history
- Survives restarts
- Configurable in dashboard

## 🔒 Security Notes

- Agent has **read-only** Docker socket access
- Hub exposed only on localhost by default
- No sensitive app data collected
- Admin authentication required for dashboard

## 💡 Tips

**Reduce resource usage:**

```bash
# Collect every 5 seconds instead of 1
# In .env: BESZEL_INTERVAL=5
docker-compose restart beszel-agent
```

**Backup monitoring data:**

```bash
docker run --rm -v beszel_data:/data -v $(pwd):/backup ubuntu tar czf /backup/beszel-backup.tar.gz /data
```

**Update Beszel:**

```bash
docker-compose pull beszel-hub beszel-agent
docker-compose up -d beszel-hub beszel-agent
```

## 🆘 Need Help?

1. Check logs: `docker-compose logs beszel-hub beszel-agent`
2. Review full documentation: `doc/deployment/Beszel-monitoring.md`
3. Verify configuration: `docker-compose config`
4. Check network: `docker network inspect beszel-network`

---

**Resource Footprint:**

- Agent: ~5-10MB RAM, <1% CPU
- Hub: ~30-50MB RAM
- Zero application code changes required

After setup, verify:

- [ ] Dashboard accessible at http://localhost:8090
- [ ] System shows "Online" status
- [ ] CPU/RAM/Disk/Network graphs updating
- [ ] Container metrics visible (jobsphere-ap
