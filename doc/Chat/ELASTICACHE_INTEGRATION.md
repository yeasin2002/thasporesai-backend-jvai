# Amazon ElastiCache Integration for Chat System

## Overview

This guide covers deploying the JobSphere chat system on AWS with Amazon ElastiCache for Redis, enabling production-grade performance, scalability, and reliability.

## What is Amazon ElastiCache?

Amazon ElastiCache is a fully managed in-memory caching service that supports Redis and Memcached. For our chat system, we'll use ElastiCache for Redis.

### Benefits

- ✅ **Fully Managed**: AWS handles patching, backups, and monitoring
- ✅ **High Availability**: Multi-AZ deployment with automatic failover
- ✅ **Scalability**: Easy vertical and horizontal scaling
- ✅ **Security**: VPC isolation, encryption at rest and in transit
- ✅ **Performance**: Sub-millisecond latency
- ✅ **Cost-Effective**: Pay only for what you use

## Architecture on AWS

### Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                Application Load Balancer                │ │
│  │              (HTTPS with SSL Certificate)               │ │
│  └────────────┬───────────────────────────────┬───────────┘ │
│               │                               │              │
│  ┌────────────▼──────────┐     ┌──────────────▼──────────┐ │
│  │   EC2 Instance 1      │     │   EC2 Instance 2        │ │
│  │   (Node.js + Socket)  │     │   (Node.js + Socket)    │ │
│  │   Availability Zone A │     │   Availability Zone B   │ │
│  └────────────┬──────────┘     └──────────────┬──────────┘ │
│               │                               │              │
│               └───────────┬───────────────────┘              │
│                           │                                  │
│              ┌────────────▼────────────┐                     │
│              │  ElastiCache for Redis  │                     │
│              │  (Cluster Mode Enabled) │                     │
│              │  - Primary Node (AZ-A)  │                     │
│              │  - Replica Node (AZ-B)  │                     │
│              └────────────┬────────────┘                     │
│                           │                                  │
│              ┌────────────▼────────────┐                     │
│              │   Amazon DocumentDB     │                     │
│              │   (MongoDB Compatible)  │                     │
│              │  - Primary (AZ-A)       │                     │
│              │  - Replica (AZ-B)       │                     │
│              └─────────────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### AWS Account Setup

1. **AWS Account**: Active AWS account with billing enabled
2. **IAM User**: User with appropriate permissions
3. **VPC**: Virtual Private Cloud configured
4. **Security Groups**: Properly configured firewall rules
5. **EC2 Key Pair**: For SSH access to instances

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticache:CreateCacheCluster",
        "elasticache:CreateReplicationGroup",
        "elasticache:DescribeCacheClusters",
        "elasticache:DescribeReplicationGroups",
        "elasticache:ModifyCacheCluster",
        "elasticache:ModifyReplicationGroup",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets",
        "ec2:DescribeVpcs"
      ],
      "Resource": "*"
    }
  ]
}
```

## Step-by-Step Setup

### Step 1: Create ElastiCache Subnet Group

#### Using AWS Console

1. Navigate to **ElastiCache** → **Subnet Groups**
2. Click **Create Subnet Group**
3. Configure:
   - **Name**: `jobsphere-chat-subnet-group`
   - **Description**: `Subnet group for JobSphere chat system`
   - **VPC**: Select your VPC
   - **Subnets**: Select at least 2 subnets in different AZs
4. Click **Create**

#### Using AWS CLI

```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name jobsphere-chat-subnet-group \
  --cache-subnet-group-description "Subnet group for JobSphere chat" \
  --subnet-ids subnet-12345678 subnet-87654321
```

### Step 2: Create Security Group

#### Using AWS Console

1. Navigate to **EC2** → **Security Groups**
2. Click **Create Security Group**
3. Configure:
   - **Name**: `jobsphere-elasticache-sg`
   - **Description**: `Security group for ElastiCache Redis`
   - **VPC**: Select your VPC
4. Add Inbound Rule:
   - **Type**: Custom TCP
   - **Port**: 6379
   - **Source**: Security group of your EC2 instances
5. Click **Create**

#### Using AWS CLI

```bash
# Create security group
aws ec2 create-security-group \
  --group-name jobsphere-elasticache-sg \
  --description "Security group for ElastiCache Redis" \
  --vpc-id vpc-12345678

# Add inbound rule (replace sg-xxxxxxxx with your EC2 security group)
aws ec2 authorize-security-group-ingress \
  --group-id sg-elasticache-id \
  --protocol tcp \
  --port 6379 \
  --source-group sg-ec2-id
```

### Step 3: Create ElastiCache Redis Cluster

#### Option A: Single Node (Development/Testing)

**Using AWS Console:**

1. Navigate to **ElastiCache** → **Redis clusters**
2. Click **Create Redis cluster**
3. Configure:
   - **Cluster mode**: Disabled
   - **Name**: `jobsphere-chat-redis`
   - **Engine version**: 7.0 or later
   - **Node type**: cache.t3.micro (for testing) or cache.t3.small (for production)
   - **Number of replicas**: 0 (for single node)
   - **Subnet group**: Select `jobsphere-chat-subnet-group`
   - **Security groups**: Select `jobsphere-elasticache-sg`
4. Click **Create**

**Using AWS CLI:**

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id jobsphere-chat-redis \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --cache-subnet-group-name jobsphere-chat-subnet-group \
  --security-group-ids sg-elasticache-id
```

#### Option B: Cluster with Replication (Production)

**Using AWS Console:**

1. Navigate to **ElastiCache** → **Redis clusters**
2. Click **Create Redis cluster**
3. Configure:
   - **Cluster mode**: Enabled
   - **Name**: `jobsphere-chat-redis-cluster`
   - **Engine version**: 7.0 or later
   - **Node type**: cache.t3.small or larger
   - **Number of shards**: 1 (can scale later)
   - **Replicas per shard**: 1 (for high availability)
   - **Multi-AZ**: Enabled
   - **Automatic failover**: Enabled
   - **Subnet group**: Select `jobsphere-chat-subnet-group`
   - **Security groups**: Select `jobsphere-elasticache-sg`
   - **Encryption at rest**: Enabled
   - **Encryption in transit**: Enabled
4. Click **Create**

**Using AWS CLI:**

```bash
aws elasticache create-replication-group \
  --replication-group-id jobsphere-chat-redis-cluster \
  --replication-group-description "Redis cluster for JobSphere chat" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.small \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --multi-az-enabled \
  --cache-subnet-group-name jobsphere-chat-subnet-group \
  --security-group-ids sg-elasticache-id \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token "YourStrongAuthToken123!"
```

### Step 4: Get Connection Endpoint

#### Using AWS Console

1. Navigate to **ElastiCache** → **Redis clusters**
2. Click on your cluster name
3. Copy the **Primary Endpoint** or **Configuration Endpoint**

#### Using AWS CLI

```bash
# For single node
aws elasticache describe-cache-clusters \
  --cache-cluster-id jobsphere-chat-redis \
  --show-cache-node-info

# For replication group
aws elasticache describe-replication-groups \
  --replication-group-id jobsphere-chat-redis-cluster
```

## Application Configuration

### Step 1: Update Environment Variables

Update your `.env` file on EC2 instances:

```env
# ElastiCache Redis Configuration
REDIS_HOST=jobsphere-chat-redis.abc123.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=YourStrongAuthToken123!  # If auth enabled
REDIS_DB=0

# Or use connection URL
REDIS_URL=rediss://jobsphere-chat-redis.abc123.0001.use1.cache.amazonaws.com:6379

# Enable TLS for encryption in transit
REDIS_TLS=true
```

### Step 2: Update Redis Client Configuration

Update `src/lib/redis.ts`:

```typescript
import { createClient } from "redis";
import consola from "consola";

// Redis client configuration for AWS ElastiCache
const redisConfig = {
  url:
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  password: process.env.REDIS_PASSWORD || undefined,
  database: Number(process.env.REDIS_DB) || 0,
  socket: {
    // Enable TLS for encryption in transit
    tls: process.env.REDIS_TLS === "true",
    // Connection timeout
    connectTimeout: 10000,
    // Reconnection strategy
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        consola.error("❌ Max Redis reconnection attempts reached");
        return new Error("Max retries reached");
      }
      // Exponential backoff: 100ms, 200ms, 400ms, ...
      const delay = Math.min(retries * 100, 3000);
      consola.warn(
        `⚠️ Reconnecting to Redis in ${delay}ms (attempt ${retries})`
      );
      return delay;
    },
  },
};

// Create Redis client
const redisClient = createClient(redisConfig);

// Error handling
redisClient.on("error", (err) => {
  consola.error("❌ Redis Client Error:", err);
  // Send to error tracking service (Sentry, CloudWatch, etc.)
});

redisClient.on("connect", () => {
  consola.success("✅ Connected to ElastiCache Redis");
});

redisClient.on("ready", () => {
  consola.info("🚀 ElastiCache Redis client ready");
});

redisClient.on("reconnecting", () => {
  consola.warn("⚠️ Reconnecting to ElastiCache Redis...");
});

redisClient.on("end", () => {
  consola.info("👋 ElastiCache Redis connection closed");
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    consola.success("✅ ElastiCache Redis connection established");

    // Test connection
    const pong = await redisClient.ping();
    consola.info(`📡 ElastiCache Redis PING: ${pong}`);
  } catch (error) {
    consola.error("❌ Failed to connect to ElastiCache Redis:", error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    consola.info("👋 ElastiCache Redis connection closed gracefully");
  } catch (error) {
    consola.error("❌ Error disconnecting from ElastiCache Redis:", error);
  }
};

export { redisClient };
```

### Step 3: Update Socket.IO Configuration

Update `src/api/chat/socket/index.ts`:

```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

export const initializeSocketIO = async (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Setup Redis Adapter for ElastiCache
  try {
    const redisConfig = {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
      socket: {
        tls: process.env.REDIS_TLS === "true",
        reconnectStrategy: (retries: number) => Math.min(retries * 100, 3000),
      },
    };

    const pubClient = createClient(redisConfig);
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));

    consola.success("✅ Socket.IO connected to ElastiCache Redis adapter");
  } catch (error) {
    consola.error("❌ Failed to setup ElastiCache Redis adapter:", error);
    throw error; // Fail fast in production
  }

  // ... rest of the code
};
```

## Deployment on AWS EC2

### Step 1: Launch EC2 Instances

#### Using AWS Console

1. Navigate to **EC2** → **Instances**
2. Click **Launch Instance**
3. Configure:
   - **Name**: `jobsphere-chat-server-1`
   - **AMI**: Amazon Linux 2023 or Ubuntu 22.04
   - **Instance type**: t3.small or larger
   - **Key pair**: Select or create
   - **Network**: Select your VPC
   - **Subnet**: Select subnet in AZ-A
   - **Security group**: Create or select with ports:
     - 22 (SSH)
     - 80 (HTTP)
     - 443 (HTTPS)
     - 4000 (Your app port)
4. Click **Launch Instance**
5. Repeat for second instance in AZ-B

### Step 2: Install Dependencies on EC2

SSH into your EC2 instance:

```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

Install Node.js and dependencies:

```bash
# Update system
sudo yum update -y  # For Amazon Linux
# or
sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Node.js (using nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install Git
sudo yum install git -y  # Amazon Linux
# or
sudo apt install git -y  # Ubuntu
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/jobsphere-backend.git
cd jobsphere-backend

# Install dependencies
pnpm install

# Create .env file
nano .env
```

Add your environment variables:

```env
# Server
PORT=4000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://your-documentdb-endpoint:27017/jobsphere

# JWT
JWT_SECRET=your-production-secret
JWT_REFRESH_SECRET=your-refresh-secret

# ElastiCache Redis
REDIS_HOST=jobsphere-chat-redis.abc123.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=YourStrongAuthToken123!
REDIS_TLS=true

# CORS
CLIENT_URL=https://your-frontend-domain.com
```

Build and start:

```bash
# Build application
pnpm build

# Start with PM2
pm2 start dist/app.js --name jobsphere-chat

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 4: Configure Load Balancer

#### Using AWS Console

1. Navigate to **EC2** → **Load Balancers**
2. Click **Create Load Balancer**
3. Select **Application Load Balancer**
4. Configure:
   - **Name**: `jobsphere-chat-alb`
   - **Scheme**: Internet-facing
   - **IP address type**: IPv4
   - **VPC**: Select your VPC
   - **Subnets**: Select at least 2 in different AZs
   - **Security groups**: Allow HTTP (80) and HTTPS (443)
5. Configure Target Group:
   - **Name**: `jobsphere-chat-targets`
   - **Protocol**: HTTP
   - **Port**: 4000
   - **Health check path**: `/health` (create this endpoint)
6. Register your EC2 instances
7. Click **Create**

### Step 5: Configure SSL Certificate

#### Using AWS Certificate Manager (ACM)

1. Navigate to **Certificate Manager**
2. Click **Request certificate**
3. Select **Request a public certificate**
4. Enter your domain: `api.jobsphere.com`
5. Select **DNS validation**
6. Click **Request**
7. Add CNAME records to your DNS
8. Wait for validation

#### Add HTTPS Listener to ALB

1. Go to your Load Balancer
2. Click **Listeners** tab
3. Click **Add listener**
4. Configure:
   - **Protocol**: HTTPS
   - **Port**: 443
   - **Default action**: Forward to target group
   - **SSL certificate**: Select your ACM certificate
5. Click **Add**

## Monitoring and Logging

### CloudWatch Metrics

#### ElastiCache Metrics to Monitor

1. **CPUUtilization**: Should stay below 75%
2. **NetworkBytesIn/Out**: Monitor traffic
3. **CurrConnections**: Number of client connections
4. **Evictions**: Should be 0 or very low
5. **CacheHits/CacheMisses**: Monitor hit ratio

#### Set Up CloudWatch Alarms

```bash
# CPU Utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name jobsphere-redis-high-cpu \
  --alarm-description "Alert when Redis CPU exceeds 75%" \
  --metric-name CPUUtilization \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 75 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=CacheClusterId,Value=jobsphere-chat-redis

# Connection count alarm
aws cloudwatch put-metric-alarm \
  --alarm-name jobsphere-redis-high-connections \
  --alarm-description "Alert when Redis connections exceed 1000" \
  --metric-name CurrConnections \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=CacheClusterId,Value=jobsphere-chat-redis
```

### Application Logging

Update your application to send logs to CloudWatch:

```bash
# Install CloudWatch Logs agent
sudo yum install amazon-cloudwatch-agent -y

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

Or use Winston with CloudWatch transport:

```bash
pnpm add winston-cloudwatch
```

```typescript
import winston from "winston";
import CloudWatchTransport from "winston-cloudwatch";

const logger = winston.createLogger({
  transports: [
    new CloudWatchTransport({
      logGroupName: "/aws/jobsphere/chat",
      logStreamName: `${process.env.NODE_ENV}-${
        new Date().toISOString().split("T")[0]
      }`,
      awsRegion: process.env.AWS_REGION || "us-east-1",
    }),
  ],
});
```

## Cost Optimization

### ElastiCache Pricing (US East - N. Virginia)

| Node Type       | vCPU | Memory  | Price/Hour | Price/Month |
| --------------- | ---- | ------- | ---------- | ----------- |
| cache.t3.micro  | 2    | 0.5 GB  | $0.017     | ~$12        |
| cache.t3.small  | 2    | 1.37 GB | $0.034     | ~$25        |
| cache.t3.medium | 2    | 3.09 GB | $0.068     | ~$50        |
| cache.m6g.large | 2    | 6.38 GB | $0.113     | ~$82        |

### Cost Optimization Tips

1. **Right-size your cluster**: Start small, scale as needed
2. **Use Reserved Instances**: Save up to 55% with 1-year commitment
3. **Enable Auto Scaling**: Scale based on demand
4. **Use Graviton2 instances**: m6g types are 10% cheaper
5. **Monitor and optimize**: Remove unused keys, set appropriate TTLs

### Estimated Monthly Costs

**Development/Small Scale:**

- ElastiCache (cache.t3.micro): $12
- EC2 (t3.small x 1): $15
- **Total**: ~$27/month

**Production/Medium Scale:**

- ElastiCache (cache.t3.small x 2 with replication): $50
- EC2 (t3.medium x 2): $60
- ALB: $20
- Data transfer: $10
- **Total**: ~$140/month

## Security Best Practices

### 1. Network Security

- ✅ Deploy in private subnets
- ✅ Use security groups to restrict access
- ✅ Enable VPC Flow Logs
- ✅ Use AWS PrivateLink for internal communication

### 2. Encryption

- ✅ Enable encryption at rest
- ✅ Enable encryption in transit (TLS)
- ✅ Use AWS KMS for key management
- ✅ Rotate auth tokens regularly

### 3. Access Control

- ✅ Use IAM roles for EC2 instances
- ✅ Enable Redis AUTH
- ✅ Implement least privilege principle
- ✅ Use AWS Secrets Manager for credentials

### 4. Monitoring

- ✅ Enable CloudWatch Logs
- ✅ Set up CloudWatch Alarms
- ✅ Use AWS CloudTrail for audit logs
- ✅ Implement application-level logging

## Backup and Disaster Recovery

### Automated Backups

ElastiCache automatically creates daily backups:

```bash
# Configure backup retention
aws elasticache modify-replication-group \
  --replication-group-id jobsphere-chat-redis-cluster \
  --snapshot-retention-limit 7 \
  --snapshot-window "03:00-05:00"
```

### Manual Snapshots

```bash
# Create manual snapshot
aws elasticache create-snapshot \
  --replication-group-id jobsphere-chat-redis-cluster \
  --snapshot-name jobsphere-chat-backup-$(date +%Y%m%d)
```

### Restore from Snapshot

```bash
# Restore to new cluster
aws elasticache create-replication-group \
  --replication-group-id jobsphere-chat-redis-restored \
  --replication-group-description "Restored from snapshot" \
  --snapshot-name jobsphere-chat-backup-20250101
```

## Scaling Strategies

### Vertical Scaling (Scale Up)

```bash
# Modify node type
aws elasticache modify-replication-group \
  --replication-group-id jobsphere-chat-redis-cluster \
  --cache-node-type cache.m6g.large \
  --apply-immediately
```

### Horizontal Scaling (Scale Out)

```bash
# Add replica nodes
aws elasticache increase-replica-count \
  --replication-group-id jobsphere-chat-redis-cluster \
  --new-replica-count 2 \
  --apply-immediately
```

### Auto Scaling (Future)

ElastiCache doesn't support auto-scaling directly, but you can:

1. Use CloudWatch metrics
2. Create Lambda functions to scale
3. Trigger based on CPU/memory thresholds

## Troubleshooting

### Connection Issues

```typescript
// Add detailed logging
redisClient.on("error", (err) => {
  console.error("Redis Error:", {
    message: err.message,
    code: err.code,
    errno: err.errno,
    syscall: err.syscall,
  });
});
```

### Performance Issues

```bash
# Check slow queries
redis-cli --tls -h your-endpoint.cache.amazonaws.com SLOWLOG GET 10

# Monitor memory
redis-cli --tls -h your-endpoint.cache.amazonaws.com INFO memory

# Check connected clients
redis-cli --tls -h your-endpoint.cache.amazonaws.com CLIENT LIST
```

### High Memory Usage

```bash
# Check key distribution
redis-cli --tls -h your-endpoint.cache.amazonaws.com --bigkeys

# Set eviction policy
aws elasticache modify-cache-cluster \
  --cache-cluster-id jobsphere-chat-redis \
  --cache-parameter-group-name default.redis7
```

## Testing

### Test ElastiCache Connection

```bash
# From EC2 instance
redis-cli -h your-endpoint.cache.amazonaws.com -p 6379 --tls -a YourAuthToken PING
```

### Load Testing

```bash
# Install redis-benchmark
sudo yum install redis -y

# Run benchmark
redis-benchmark -h your-endpoint.cache.amazonaws.com -p 6379 --tls -a YourAuthToken -t set,get -n 100000 -q
```

## Migration Checklist

- [ ] Create ElastiCache subnet group
- [ ] Create security group
- [ ] Launch ElastiCache cluster
- [ ] Get connection endpoint
- [ ] Update application configuration
- [ ] Test connection from EC2
- [ ] Deploy application to EC2
- [ ] Configure load balancer
- [ ] Set up SSL certificate
- [ ] Configure CloudWatch monitoring
- [ ] Set up alarms
- [ ] Test end-to-end functionality
- [ ] Configure backups
- [ ] Document runbook

## References

- [Amazon ElastiCache Documentation](https://docs.aws.amazon.com/elasticache/)
- [ElastiCache for Redis Best Practices](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/BestPractices.html)
- [Socket.IO with Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## Support

For issues or questions:

1. Check CloudWatch Logs
2. Review ElastiCache metrics
3. Check application logs
4. Contact AWS Support (if needed)
5. Review this documentation

---

**Next Steps**: After completing this setup, your chat system will be production-ready with high availability, scalability, and performance on AWS!
