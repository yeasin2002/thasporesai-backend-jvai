# MongoDB Atlas Setup Guide

This guide covers setting up MongoDB Atlas (cloud database) for JobSphere.

## Why MongoDB Atlas?

- ✅ Fully managed cloud database
- ✅ Automatic backups and scaling
- ✅ High availability and security
- ✅ Free tier available (512MB storage)
- ✅ No need to manage MongoDB container

## Setup Steps

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Verify your email

### 2. Create a Cluster

1. Click **"Build a Database"**
2. Choose **"Shared"** (Free tier - M0)
3. Select cloud provider and region (closest to your server)
4. Name your cluster (e.g., `jobsphere-cluster`)
5. Click **"Create Cluster"** (takes 3-5 minutes)

### 3. Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `jobsphere-admin` (or your choice)
5. Generate strong password (save it securely!)
6. Set privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 4. Configure Network Access

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Choose one:
   - **For development**: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - **For production**: Add your server's IP address
4. Click **"Confirm"**

**Security Note:** For production, always whitelist specific IPs instead of allowing all.

### 5. Get Connection String

1. Go to **Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** driver
5. Copy the connection string

**Example connection string:**

```
mongodb+srv://jobsphere-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 6. Configure Your Application

Update your `.env` file:

```env
# Replace with your actual connection string
DATABASE_URL=mongodb+srv://jobsphere-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/jobsphere?retryWrites=true&w=majority
```

**Important:**

- Replace `<password>` with your actual database user password
- Add `/jobsphere` before the `?` to specify database name
- Keep the `?retryWrites=true&w=majority` parameters

### 7. Test Connection

```bash
# Start your Docker container
docker-compose up -d

# Check logs for successful connection
docker-compose logs -f app

# You should see: "✅ MongoDB connected successfully"
```

## Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

**Parts:**

- `<username>`: Database user (e.g., `jobsphere-admin`)
- `<password>`: User password (URL-encoded if contains special chars)
- `<cluster>`: Your cluster address (e.g., `cluster0.xxxxx`)
- `<database>`: Database name (e.g., `jobsphere`)

## Special Characters in Password

If your password contains special characters, URL-encode them:

| Character | Encoded |
| --------- | ------- |
| @         | %40     |
| :         | %3A     |
| /         | %2F     |
| ?         | %3F     |
| #         | %23     |
| [         | %5B     |
| ]         | %5D     |

**Example:**

- Password: `Pass@123!`
- Encoded: `Pass%40123!`

## MongoDB Atlas Dashboard Features

### Database Browser

- View collections and documents
- Run queries directly
- Import/export data

### Metrics

- Monitor database performance
- Track connections and operations
- View storage usage

### Backups

- Automatic daily backups (paid tiers)
- Point-in-time recovery
- Download backup snapshots

### Alerts

- Set up email alerts
- Monitor connection issues
- Track performance metrics

## Production Best Practices

### 1. Network Security

```bash
# Whitelist only your server IP
# Get your server IP:
curl ifconfig.me

# Add to MongoDB Atlas Network Access
```

### 2. Database User Permissions

- Create separate users for different environments
- Use read-only users for analytics
- Rotate passwords regularly

### 3. Connection Pooling

Your app already handles this via Mongoose, but verify settings:

```typescript
// In your connection code
mongoose.connect(DATABASE_URL, {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 4. Monitoring

- Enable MongoDB Atlas monitoring
- Set up alerts for:
  - High connection count
  - Slow queries
  - Storage usage > 80%
  - Failed authentication attempts

### 5. Backups

**Free Tier (M0):**

- No automatic backups
- Export data manually using `mongodump`

**Paid Tiers:**

- Automatic continuous backups
- Point-in-time recovery
- Backup retention policies

**Manual backup from your app:**

```bash
# Using Docker
docker-compose exec app sh
mongodump --uri="$DATABASE_URL" --out=/app/backup
```

## Troubleshooting

### Connection Timeout

**Error:** `MongoServerSelectionError: connection timed out`

**Solutions:**

1. Check Network Access whitelist in Atlas
2. Verify connection string is correct
3. Check if cluster is running
4. Verify DNS resolution: `nslookup cluster0.xxxxx.mongodb.net`

### Authentication Failed

**Error:** `MongoServerError: Authentication failed`

**Solutions:**

1. Verify username and password
2. Check if user has correct permissions
3. URL-encode special characters in password
4. Ensure user is created in correct database

### Database Not Found

**Error:** Database doesn't exist

**Solution:**

- MongoDB creates database automatically on first write
- Ensure database name is in connection string
- Check if collections are being created

### IP Not Whitelisted

**Error:** `MongoServerError: IP address not whitelisted`

**Solutions:**

1. Add your IP to Network Access in Atlas
2. For dynamic IPs, use "Allow Access from Anywhere" (dev only)
3. For production, use static IP or VPN

## Scaling

### Upgrade Cluster

When you need more resources:

1. Go to your cluster
2. Click **"..."** → **"Edit Configuration"**
3. Choose larger tier (M10, M20, etc.)
4. Apply changes (no downtime)

### Vertical Scaling

- Increase cluster tier for more RAM/CPU
- Add more storage

### Horizontal Scaling

- Enable sharding (M30+ tiers)
- Add replica set members
- Configure read preferences

## Cost Optimization

### Free Tier (M0)

- 512MB storage
- Shared RAM
- No backups
- Perfect for development

### Paid Tiers

- Start at $9/month (M10)
- Automatic backups
- Better performance
- Dedicated resources

### Tips to Reduce Costs

1. Use indexes efficiently
2. Archive old data
3. Compress documents
4. Monitor query performance
5. Use appropriate cluster size

## Migration from Local MongoDB

If migrating from local MongoDB to Atlas:

```bash
# 1. Export from local
docker-compose exec mongodb mongodump --out=/data/backup

# 2. Copy backup from container
docker cp jobsphere-mongodb:/data/backup ./backup

# 3. Import to Atlas
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/jobsphere" ./backup/jobsphere
```

## Support

**MongoDB Atlas Support:**

- Documentation: https://docs.atlas.mongodb.com/
- Community Forums: https://www.mongodb.com/community/forums/
- Support Tickets: Available on paid tiers

**Common Resources:**

- Connection String Guide: https://docs.mongodb.com/manual/reference/connection-string/
- Security Checklist: https://docs.atlas.mongodb.com/security-checklist/
- Performance Best Practices: https://docs.atlas.mongodb.com/best-practices/

## Summary

✅ **Setup Complete When:**

- Cluster is running
- Database user created
- IP whitelisted
- Connection string configured in `.env`
- App connects successfully

Your JobSphere app is now using MongoDB Atlas cloud database! 🚀
