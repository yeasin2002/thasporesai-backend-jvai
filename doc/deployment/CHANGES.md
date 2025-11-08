# Docker Setup Changes - MongoDB Atlas

## What Changed

### Removed Local MongoDB Container

**Before:**
- Local MongoDB container in docker-compose.yml
- Required MONGO_ROOT_USER, MONGO_ROOT_PASSWORD, MONGO_DB_NAME
- mongo-init.js for database initialization
- mongodb_data volume for persistence

**After:**
- Using MongoDB Atlas (cloud database)
- Only requires DATABASE_URL connection string
- No local MongoDB container
- Simpler docker-compose.yml

### Updated Configuration

**docker-compose.yml:**
- Removed `mongodb` service
- Removed `mongodb_data` volume
- Removed `networks` (not needed for single service)
- Removed `depends_on` (no local database)
- Simplified environment variables

**.env.docker:**
- Removed MongoDB-specific variables
- Added `DATABASE_URL` for MongoDB Atlas connection string

### Benefits

✅ **Simpler Setup:**
- One less container to manage
- Faster startup time
- Less disk space usage

✅ **Better for Production:**
- Managed database service
- Automatic backups (paid tiers)
- High availability
- Better security

✅ **Cost Effective:**
- Free tier available (512MB)
- No need to manage database server
- Scales automatically

✅ **Easier Deployment:**
- Same setup for local and production
- No database migration needed
- Works on any platform

## Migration Guide

### If You Were Using Local MongoDB

**1. Export existing data:**
```bash
# If you have data in local MongoDB
docker-compose exec mongodb mongodump --out=/data/backup
docker cp jobsphere-mongodb:/data/backup ./backup
```

**2. Setup MongoDB Atlas:**
- Follow guide: `doc/deployment/MONGODB_ATLAS.md`
- Get connection string

**3. Import data to Atlas:**
```bash
mongorestore --uri="your-atlas-connection-string" ./backup/jobsphere
```

**4. Update .env:**
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/jobsphere?retryWrites=true&w=majority
```

**5. Restart services:**
```bash
docker-compose down
docker-compose up -d
```

## New Setup Process

### Quick Start

```bash
# 1. Get MongoDB Atlas connection string
# See: doc/deployment/MONGODB_ATLAS.md

# 2. Configure environment
cp .env.docker .env
nano .env  # Add your DATABASE_URL

# 3. Start services
docker-compose up -d

# 4. Check logs
docker-compose logs -f app
```

### Environment Variables

**Required:**
```env
DATABASE_URL=mongodb+srv://...
ACCESS_SECRET=...
REFRESH_SECRET=...
SMTP_USER=...
SMTP_PASS=...
```

**Optional:**
```env
PORT=4000
API_BASE_URL=http://localhost:4000
CORS_ORIGIN=*
```

## Documentation Updates

**New Files:**
- `doc/deployment/MONGODB_ATLAS.md` - Complete Atlas setup guide

**Updated Files:**
- `docker-compose.yml` - Removed MongoDB service
- `.env.docker` - Updated for Atlas
- `.env.production.example` - Updated for Atlas
- `doc/deployment/README.docker.md` - Updated instructions
- `doc/deployment/QUICK_START.md` - Updated quick start
- `doc/deployment/PRODUCTION.md` - Updated production guide
- `doc/deployment/SUMMARY.md` - Updated summary

## Troubleshooting

### Connection Issues

**Error:** `MongoServerSelectionError: connection timed out`

**Solutions:**
1. Check IP whitelist in MongoDB Atlas
2. Verify connection string
3. Check network connectivity

### Authentication Failed

**Error:** `Authentication failed`

**Solutions:**
1. Verify username/password
2. URL-encode special characters
3. Check user permissions

### Database Not Found

**Solution:**
- MongoDB creates database on first write
- Ensure database name is in connection string

## Support

**MongoDB Atlas:**
- Setup Guide: `doc/deployment/MONGODB_ATLAS.md`
- Atlas Docs: https://docs.atlas.mongodb.com/

**Docker Setup:**
- Quick Start: `doc/deployment/QUICK_START.md`
- Full Guide: `doc/deployment/README.docker.md`
- Production: `doc/deployment/PRODUCTION.md`
