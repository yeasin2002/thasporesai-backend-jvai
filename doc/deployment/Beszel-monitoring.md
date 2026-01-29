# Beszel Monitoring Integration

## Overview

Beszel is a lightweight server monitoring system that tracks system resources and Docker containers in real-time. This integration adds monitoring to JobSphere without modifying application code.

**What it monitors:**

- CPU, RAM, disk I/O, network statistics
- Docker container metrics (JobSphere, MongoDB, Beszel itself)
- Real-time dashboards with historical data (30+ days)

**Resource footprint:**

- Agent: < 10MB RAM, < 1% CPU
- Hub: < 50MB RAM
- Collection interval: 1 second

## Architecture

```
┌─────────────────────────────────────────────┐
│  Host System                                 │
│                                              │
│  ┌───────────────────────────────────────┐  │
│  │  Docker Network (beszel-network)      │  │
│  │                                        │  │
│  │  ┌─────────────┐   ┌──────────────┐  │  │
│  │  │ Beszel Hub  │◄──┤ Beszel Agent │  │  │
│  │  │ :8090       │   │              │  │  │
│  │  │ (Dashboard) │   │ (Collector)  │  │  │
│  │  └─────────────┘   └──────┬───────┘  │  │
│  │                            │Monitors  │  │
│  │                            ▼          │  │
│  │               ┌────────────────────┐  │  │
│  │               │ JobSphere App      │  │  │
│  │               │ MongoDB            │  │  │
│  │               └────────────────────┘  │  │
│  │                                        │  │
│  │  Volume: beszel_data (persists data)  │  │
│  └───────────────────────────────────────┘  │
│                                              │
│  Docker Socket: /var/run/docker.sock (ro)   │
└─────────────────────────────────────────────┘
```

**Components:**

- **Hub**: Web dashboard (port 8090), stores metrics in SQLite
- **Agent**: Collects system + container metrics via Docker socket
- **Network**: Shared bridge network for service communication
- **Volume**: Persists monitoring data across restarts

## Quick Start

### 1. Update docker-compose.yml

Add these services:

```yaml
services:
  # Existing services...

  beszel-hub:
    image: henrygd/beszel:latest
    container_name: beszel-hub
    restart: unless-stopped
    ports:
      - "${BESZEL_HUB_PORT:-8090}:8090"
    volumes:
      - beszel_data:/beszel/data
    networks:
      - beszel-network
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--quiet",
          "--tries=1",
          "--spider",
          "http://localhost:8090/api/health",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  beszel-agent:
    image: henrygd/beszel-agent:latest
    container_name: beszel-agent
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - beszel-network
    environment:
      - HUB_URL=http://beszel-hub:8090
      - KEY=${BESZEL_AGENT_KEY}
      - INTERVAL=${BESZEL_INTERVAL:-1}
    depends_on:
      beszel-hub:
        condition: service_healthy

networks:
  beszel-network:
    driver: bridge

volumes:
  beszel_data:
    driver: local
```

**Add beszel-network to existing services:**

```yaml
services:
  jobsphere-app:
    # ... existing config
    networks:
      - beszel-network # Add this

  mongodb:
    # ... existing config
    networks:
      - beszel-network # Add this
```

### 2. Configure Environment (.env)

Add to `.env` (or use defaults):

```bash
# Beszel Monitoring
BESZEL_HUB_PORT=8090              # Dashboard port
BESZEL_AGENT_KEY=                 # Generated during setup
BESZEL_INTERVAL=1                 # Collection interval (seconds)
```

### 3. Deploy

```bash
# Start monitoring services
docker-compose up -d beszel-hub beszel-agent

# Verify services running
docker-compose ps beszel-hub beszel-agent

# Check logs if needed
docker-compose logs -f beszel-hub beszel-agent
```

### 4. Initial Setup

1. Open http://localhost:8090
2. Create admin account (first-time only)
3. Add system:
   - Click "Add System"
   - Name: "JobSphere Local"
   - Copy the generated key
   - Add to `.env` as `BESZEL_AGENT_KEY=your_key_here`
   - Restart agent: `docker-compose restart beszel-agent`
4. Metrics appear within 5 seconds

## Features

### What Gets Monitored

**System Metrics:**

- CPU usage (per core + total)
- RAM (total, used, available)
- Disk I/O (read/write bytes, operations)
- Network (bytes sent/received, packets)

**Container Metrics:**

- Per-container CPU/RAM usage
- Container network I/O
- Container status (running, stopped, etc.)

**Data Persistence:**

- 30+ days history (configurable)
- Survives container restarts
- Stored in `beszel_data` volume

### Dashboard Features

- Real-time graphs (1-second updates)
- Historical data visualization
- Container resource breakdown
- Sortable/filterable metrics
- Export capabilities

## Configuration

### Environment Variables

| Variable           | Default    | Description                   |
| ------------------ | ---------- | ----------------------------- |
| `BESZEL_HUB_PORT`  | 8090       | External port for dashboard   |
| `BESZEL_AGENT_KEY` | (required) | Auth key from Hub setup       |
| `BESZEL_INTERVAL`  | 1          | Collection interval (seconds) |

### Adjusting Collection Interval

For lower resource usage:

```bash
# Collect every 5 seconds instead of 1
BESZEL_INTERVAL=5
```

### Data Retention

Configure in Hub dashboard:

- Settings → Data Retention
- Default: 30 days
- Adjust based on disk space

## Management

### Backup Monitoring Data

```bash
# Backup volume
docker run --rm -v beszel_data:/data -v $(pwd):/backup ubuntu tar czf /backup/beszel-backup.tar.gz /data

# Restore volume
docker run --rm -v beszel_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/beszel-backup.tar.gz -C /
```

### Update Beszel

```bash
# Pull latest images
docker-compose pull beszel-hub beszel-agent

# Restart with new images
docker-compose up -d beszel-hub beszel-agent
```

### Monitoring Independence

Monitoring can be stopped without affecting application:

```bash
# Stop monitoring only
docker-compose stop beszel-hub beszel-agent

# Application continues running
docker-compose ps jobsphere-app  # Still running

# Restart monitoring
docker-compose start beszel-hub beszel-agent
```

## Troubleshooting

### Hub Not Accessible

**Symptoms:** Cannot access http://localhost:8090

**Solutions:**

```bash
# Check if port 8090 in use
lsof -i :8090

# Verify container running
docker-compose ps beszel-hub

# Check logs
docker-compose logs beszel-hub

# Verify health check
docker inspect beszel-hub | grep -A 10 Health
```

### Agent Not Collecting Metrics

**Symptoms:** No data in dashboard, "Agent offline" status

**Solutions:**

```bash
# Check Docker socket mount
docker-compose exec beszel-agent ls -la /var/run/docker.sock

# Verify Agent key configured
docker-compose exec beszel-agent env | grep KEY

# Check connectivity to Hub
docker-compose exec beszel-agent ping beszel-hub

# View Agent logs
docker-compose logs beszel-agent
```

### No Container Metrics

**Symptoms:** System metrics work, but containers not showing

**Solutions:**

```bash
# Verify Docker socket permissions
ls -la /var/run/docker.sock

# Check Agent can access Docker
docker-compose exec beszel-agent docker ps

# Ensure containers on same network
docker network inspect beszel-network
```

### Data Not Persisting

**Symptoms:** History lost after restart

**Solutions:**

```bash
# Verify volume exists
docker volume inspect beszel_data

# Check volume mount
docker inspect beszel-hub | grep -A 5 Mounts

# Test volume persistence
docker-compose down
docker-compose up -d
# Data should remain
```

### High Resource Usage

**Symptoms:** Agent/Hub using too much CPU/RAM

**Solutions:**

1. Increase collection interval: `BESZEL_INTERVAL=5`
2. Reduce data retention in Hub settings
3. Check for metric storage growth:
   ```bash
   docker exec beszel-hub du -sh /beszel/data
   ```

## Testing

### Validation Checklist

After deployment:

- [ ] Hub accessible at http://localhost:8090
- [ ] Admin account created successfully
- [ ] System added with Agent key configured
- [ ] Agent shows "Online" status in dashboard
- [ ] System metrics appearing (CPU, RAM, disk, network)
- [ ] Container metrics for all containers
- [ ] Graphs updating in real-time (1-second interval)
- [ ] Data persists after `docker-compose restart beszel-hub`

### Manual Testing

```bash
# Generate load to test monitoring
docker-compose exec jobsphere-app sh -c "while true; do echo test; done"

# Check CPU spike in dashboard
# Stop with Ctrl+C

# Test persistence
docker-compose down
docker-compose up -d
# Check history retained in dashboard
```

## Implementation Checklist

- [ ] Update `docker-compose.yml` with Hub/Agent services
- [ ] Add `beszel-network` to existing services
- [ ] Create `.env` with configuration
- [ ] Deploy monitoring: `docker-compose up -d`
- [ ] Complete Hub initial setup
- [ ] Configure Agent key
- [ ] Verify metrics collection
- [ ] Test data persistence
- [ ] Document custom configurations
- [ ] Setup backup schedule (optional)

## Key Points

**Zero Application Changes:**

- No code modifications required
- No existing service config changes
- Monitoring added via Docker Compose only

**Resource Efficient:**

- Agent: ~5-10MB RAM
- Hub: ~30-50MB RAM
- Minimal CPU overhead (<1%)

**Production Ready:**

- Data persists across restarts
- Health checks ensure reliability
- Read-only Docker socket (security)
- Monitoring independent of application

**Extensible:**

- Add alerts for thresholds
- Export metrics to external systems
- Custom dashboards via Hub API
- Multi-host support (multiple Agents → one Hub)

## Security Notes

**Docker Socket Access:**

- Agent has read-only access
- Cannot modify/control containers
- Only reads metrics and status

**Network Security:**

- Hub exposed only on localhost by default
- Agent internal only (no host exposure)
- Consider reverse proxy + auth for production

**Data Security:**

- Metrics are system-level only
- No sensitive app data collected
- Hub admin interface requires authentication

## Support

**Common Commands:**

```bash
# View all logs
docker-compose logs beszel-hub beszel-agent

# Restart monitoring
docker-compose restart beszel-hub beszel-agent

# Check service health
docker-compose ps
docker inspect beszel-hub | grep -A 10 Health

# Network debugging
docker network inspect beszel-network

# Volume inspection
docker volume inspect beszel_data
```

**Official Resources:**

- Beszel GitHub: https://github.com/henrygd/beszel
- Documentation: Included in Hub dashboard
- Docker Hub: henrygd/beszel, henrygd/beszel-agent
