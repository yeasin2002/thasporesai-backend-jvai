# VPS Deployment Debug Guide

## Current Issue: Health Check Failed

Your deployment script runs but the health check fails. Here's how to debug:

## Step 1: Check Container Status

```bash
docker compose ps
```

Expected output:
```
NAME              IMAGE                    STATUS
jobsphere-app     ...                      Up (healthy)
```

If status shows "Exited" or "Unhealthy", proceed to Step 2.

## Step 2: Check Container Logs

```bash
docker compose logs app
```

Look for errors in the logs. Common issues:

### A. Missing Environment Variables

Error: `Error: Missing required environment variable: DATABASE_URL`

**Solution:** Check your `.env` file has all required variables:
```bash
cat .env
```

Required variables:
- DATABASE_URL
- ACCESS_SECRET
- REFRESH_SECRET
- SMTP_USER
- SMTP_PASS
- API_BASE_URL
- CORS_ORIGIN

### B. Database Connection Failed

Error: `MongooseServerSelectionError: connect ECONNREFUSED` or `Authentication failed`

**Solution:**
1. Verify MongoDB Atlas connection string
2. Check IP whitelist in MongoDB Atlas (add VPS IP or use 0.0.0.0/0 for testing)
3. Test connection:
```bash
docker compose exec app node -e "require('mongoose').connect(process.env.DATABASE_URL).then(() => console.log('✓ Connected')).catch(e => console.log('✗ Error:', e.message))"
```

### C. Firebase Service Account Missing

Error: `Error: ENOENT: no such file or directory, open '/app/firebase-service-account.json'`

**Solution:**
```bash
# Check if file exists
ls -la firebase-service-account.json

# If missing, upload it:
nano firebase-service-account.json
# Paste your Firebase service account JSON
```

### D. ImageKit Configuration Missing (Warning Only)

Warning: `⚠️  ImageKit configuration missing. Image upload features will not work.`

**This is just a warning, not an error.** The app will still work, but image uploads will use local storage instead of ImageKit CDN.

**To fix (optional):**
1. Sign up at https://imagekit.io/
2. Get your API keys from Dashboard → Developer → API Keys
3. Add to `.env`:
```bash
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### E. Port Already in Use

Error: `Error: listen EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find what's using port 4000
sudo lsof -i :4000

# Kill the process or change PORT in .env
```

## Step 3: Manual Container Test

Try running the container interactively to see errors:

```bash
# Stop current container
docker compose down

# Run interactively
docker compose run --rm app sh

# Inside container, try starting the app:
node dist/app.js
```

## Step 4: Check Environment Variables in Container

```bash
# View environment variables
docker compose exec app env | grep -E "DATABASE_URL|ACCESS_SECRET|SMTP"

# If empty, the .env file isn't being loaded
```

## Step 5: Rebuild from Scratch

If nothing works, rebuild everything:

```bash
# Stop and remove everything
docker compose down -v

# Remove images
docker rmi $(docker images -q jobsphere*)

# Rebuild
docker compose up -d --build

# Watch logs
docker compose logs -f app
```

## Common Solutions

### Solution 1: Missing .env File

```bash
# Ensure .env exists in project root
ls -la .env

# If missing:
cp .env.production.example .env
nano .env
# Fill in all values
```

### Solution 2: Wrong MongoDB Connection String

```bash
# Test MongoDB connection from VPS
curl -I "mongodb+srv://your-connection-string"

# Or use mongosh:
mongosh "mongodb+srv://your-connection-string"
```

### Solution 3: Firebase File Not Mounted

Check docker-compose.yml has this volume:
```yaml
volumes:
  - ./firebase-service-account.json:/app/firebase-service-account.json:ro
```

### Solution 4: Build Failed

If build fails with Lefthook error, the Dockerfile should have:
```dockerfile
RUN pnpm install --frozen-lockfile --ignore-scripts
```

This skips the `prepare` script (Lefthook) which needs Git.

## Quick Health Check Commands

```bash
# 1. Check if container is running
docker compose ps

# 2. Check logs for errors
docker compose logs --tail=50 app

# 3. Test API from inside VPS
curl http://localhost:4000/

# 4. Test API from outside
curl http://YOUR_VPS_IP:4000/

# 5. Check container health
docker inspect jobsphere-app | grep -A 10 Health
```

## Expected Successful Output

When everything works, you should see:

```bash
# docker compose ps
NAME              STATUS
jobsphere-app     Up (healthy)

# curl http://localhost:4000/
{"status":200,"message":"JobSphere API is running","success":true}

# docker compose logs app (last few lines)
[INFO] Server running on port 4000
[INFO] MongoDB connected successfully
[INFO] Firebase initialized
```

## Still Not Working?

Share these outputs for debugging:

```bash
# 1. Docker version
docker --version

# 2. Container status
docker compose ps

# 3. Last 100 lines of logs
docker compose logs --tail=100 app > logs.txt

# 4. Environment check (hide sensitive values)
cat .env | sed 's/=.*/=***/' 

# 5. File structure
ls -la

# 6. Container inspect
docker inspect jobsphere-app > inspect.txt
```

## Next Steps After Fixing

Once the container is healthy:

1. Test API endpoints:
```bash
curl http://localhost:4000/api-docs
curl http://localhost:4000/api/location
```

2. Setup Nginx reverse proxy (see DEPLOYMENT.md)

3. Setup SSL with Let's Encrypt

4. Create admin user

5. Test from Flutter app
