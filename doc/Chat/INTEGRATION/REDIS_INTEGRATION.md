# Redis Integration for Chat System

## Overview

This guide covers integrating Redis with the JobSphere chat system to improve performance, scalability, and enable horizontal scaling across multiple server instances.

## Why Redis?

Redis provides several critical benefits for real-time chat systems:

1. **Horizontal Scaling**: Enable multiple Socket.IO server instances
2. **Shared State**: Synchronize online status across servers
3. **Performance**: Fast in-memory caching for frequently accessed data
4. **Pub/Sub**: Efficient message broadcasting between server instances
5. **Session Storage**: Persistent connection state management

## Architecture with Redis

### Before Redis (Current - Single Server)

```
┌─────────────────────────────────────┐
│    Express + Socket.IO Server       │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  In-Memory Online Status     │  │
│  │  (Lost on restart)           │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │     MongoDB Database         │  │
│  │  (All persistent data)       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### After Redis (Multi-Server Ready)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Server 1    │    │  Server 2    │    │  Server 3    │
│  Socket.IO   │    │  Socket.IO   │    │  Socket.IO   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Redis Adapter         │
              │   (Pub/Sub + State)     │
              └────────────┬────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼─────┐   ┌──────▼─────┐   ┌─────▼──────┐
   │   Redis    │   │  MongoDB   │   │   Redis    │
   │  (Status)  │   │  (Messages)│   │  (Cache)   │
   └────────────┘   └────────────┘   └────────────┘
```

## Installation

### 1. Install Dependencies

```bash
# Install Redis client and Socket.IO Redis adapter
npm install redis @socket.io/redis-adapter

# Or with pnpm (recommended for this project)
pnpm add redis @socket.io/redis-adapter
```

### 2. Install Redis Server

#### Development (Local)

**Windows:**

```bash
# Using Chocolatey
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**macOS:**

```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Production (Docker)

```bash
docker run -d \
  --name redis-chat \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --appendonly yes
```

### 3. Verify Redis Installation

```bash
# Test connection
redis-cli ping
# Should return: PONG

# Check version
redis-cli --version
```

## Implementation

### Step 1: Update Environment Variables

Add to `.env`:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Leave empty for local development
REDIS_DB=0               # Database number (0-15)

# Redis Connection URL (alternative to individual settings)
REDIS_URL=redis://localhost:6379

# Redis Options
REDIS_KEY_PREFIX=jobsphere:chat:  # Prefix for all keys
REDIS_TTL=3600                     # Default TTL in seconds (1 hour)
```

### Step 2: Create Redis Client Module

Create `src/lib/redis.ts`:

```typescript
import { createClient } from "redis";
import consola from "consola";

// Redis client type
export type RedisClient = ReturnType<typeof createClient>;

// Create Redis client instance
const redisClient = createClient({
  url:
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || "localhost"}:${
      process.env.REDIS_PORT || 6379
    }`,
  password: process.env.REDIS_PASSWORD || undefined,
  database: Number(process.env.REDIS_DB) || 0,
});

// Error handling
redisClient.on("error", (err) => {
  consola.error("❌ Redis Client Error:", err);
});

redisClient.on("connect", () => {
  consola.success("✅ Redis connected successfully");
});

redisClient.on("ready", () => {
  consola.info("🚀 Redis client ready");
});

redisClient.on("reconnecting", () => {
  consola.warn("⚠️ Redis reconnecting...");
});

// Connect to Redis
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    consola.success("✅ Redis connection established");
  } catch (error) {
    consola.error("❌ Failed to connect to Redis:", error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    consola.info("👋 Redis connection closed");
  } catch (error) {
    consola.error("❌ Error disconnecting from Redis:", error);
  }
};

// Export client
export { redisClient };
```

### Step 3: Update Socket.IO with Redis Adapter

Update `src/api/chat/socket/index.ts`:

```typescript
import consola from "consola";
import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { registerChatHandlers } from "./handlers/chat.handler";
import { registerStatusHandlers } from "./handlers/status.handler";
import { registerTypingHandlers } from "./handlers/typing.handler";
import { authMiddleware } from "./middleware/auth.middleware";

/**
 * Initialize Socket.IO Server with Redis Adapter
 * Sets up real-time communication with horizontal scaling support
 *
 * @param httpServer - HTTP server instance from Express
 * @returns Socket.IO server instance
 */
export const initializeSocketIO = async (httpServer: HTTPServer) => {
  // Create Socket.IO server with CORS configuration
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Setup Redis Adapter for horizontal scaling
  try {
    // Create Redis clients for pub/sub
    const pubClient = createClient({
      url:
        process.env.REDIS_URL ||
        `redis://${process.env.REDIS_HOST || "localhost"}:${
          process.env.REDIS_PORT || 6379
        }`,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    const subClient = pubClient.duplicate();

    // Connect both clients
    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Attach Redis adapter to Socket.IO
    io.adapter(createAdapter(pubClient, subClient));

    consola.success("✅ Socket.IO Redis adapter configured");
  } catch (error) {
    consola.error("❌ Failed to setup Redis adapter:", error);
    consola.warn(
      "⚠️ Running Socket.IO without Redis adapter (single server mode)"
    );
  }

  // Apply authentication middleware
  io.use(authMiddleware);

  // Handle connections
  io.on("connection", (socket) => {
    consola.info(`✅ User connected: ${socket.data.userId}`);

    registerChatHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerStatusHandlers(io, socket);

    socket.on("disconnect", () => {
      consola.warn(`❌ User disconnected: ${socket.data.userId}`);
    });
  });

  return io;
};
```

### Step 4: Create Redis Service for Online Status

Create `src/api/chat/services/redis-status.service.ts`:

```typescript
import { redisClient } from "@/lib/redis";
import consola from "consola";

const ONLINE_STATUS_PREFIX = "online:";
const ONLINE_STATUS_TTL = 300; // 5 minutes

/**
 * Set user online status in Redis
 * @param userId - User ID
 * @param socketId - Socket connection ID
 */
export const setUserOnline = async (userId: string, socketId: string) => {
  try {
    const key = `${ONLINE_STATUS_PREFIX}${userId}`;
    await redisClient.setEx(key, ONLINE_STATUS_TTL, socketId);
    consola.info(`✅ User ${userId} marked as online`);
  } catch (error) {
    consola.error("Error setting user online:", error);
  }
};

/**
 * Set user offline status in Redis
 * @param userId - User ID
 */
export const setUserOffline = async (userId: string) => {
  try {
    const key = `${ONLINE_STATUS_PREFIX}${userId}`;
    await redisClient.del(key);
    consola.info(`👋 User ${userId} marked as offline`);
  } catch (error) {
    consola.error("Error setting user offline:", error);
  }
};

/**
 * Check if user is online
 * @param userId - User ID
 * @returns boolean - true if online
 */
export const isUserOnline = async (userId: string): Promise<boolean> => {
  try {
    const key = `${ONLINE_STATUS_PREFIX}${userId}`;
    const socketId = await redisClient.get(key);
    return socketId !== null;
  } catch (error) {
    consola.error("Error checking user online status:", error);
    return false;
  }
};

/**
 * Get online status for multiple users
 * @param userIds - Array of user IDs
 * @returns Object with userId as key and online status as value
 */
export const getBulkOnlineStatus = async (
  userIds: string[]
): Promise<Record<string, boolean>> => {
  try {
    const pipeline = redisClient.multi();

    for (const userId of userIds) {
      const key = `${ONLINE_STATUS_PREFIX}${userId}`;
      pipeline.exists(key);
    }

    const results = await pipeline.exec();
    const statusMap: Record<string, boolean> = {};

    userIds.forEach((userId, index) => {
      statusMap[userId] = results?.[index] === 1;
    });

    return statusMap;
  } catch (error) {
    consola.error("Error getting bulk online status:", error);
    return {};
  }
};

/**
 * Refresh user's online status TTL
 * @param userId - User ID
 */
export const refreshUserOnline = async (userId: string) => {
  try {
    const key = `${ONLINE_STATUS_PREFIX}${userId}`;
    await redisClient.expire(key, ONLINE_STATUS_TTL);
  } catch (error) {
    consola.error("Error refreshing user online status:", error);
  }
};
```

### Step 5: Update Status Handler

Update `src/api/chat/socket/handlers/status.handler.ts`:

```typescript
import type { Server, Socket } from "socket.io";
import {
  setUserOnline,
  setUserOffline,
  isUserOnline,
  refreshUserOnline,
} from "../../services/redis-status.service";

/**
 * Status Event Handlers
 * Manages online/offline status using Redis
 */
export const registerStatusHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;

  // Set user online when connected
  setUserOnline(userId, socket.id);

  // Refresh online status periodically (every 2 minutes)
  const refreshInterval = setInterval(() => {
    refreshUserOnline(userId);
  }, 120000); // 2 minutes

  /**
   * Event: get_online_status
   * Check if a user is currently online
   */
  socket.on("get_online_status", async ({ userId: targetUserId }) => {
    try {
      const online = await isUserOnline(targetUserId);
      socket.emit("user_online_status", {
        userId: targetUserId,
        isOnline: online,
        lastSeen: online ? new Date() : null,
      });
    } catch (error) {
      console.error("Error getting online status:", error);
      socket.emit("error", { message: "Failed to get online status" });
    }
  });

  /**
   * Handle disconnection
   */
  socket.on("disconnect", async () => {
    clearInterval(refreshInterval);
    await setUserOffline(userId);

    // Notify other users in conversations
    // This would require fetching user's conversations
    // and broadcasting to those rooms
  });
};
```

### Step 6: Add Caching for Conversations

Create `src/api/chat/services/redis-cache.service.ts`:

```typescript
import { redisClient } from "@/lib/redis";
import consola from "consola";

const CACHE_PREFIX = "cache:";
const DEFAULT_TTL = 300; // 5 minutes

/**
 * Cache conversation list for a user
 * @param userId - User ID
 * @param conversations - Conversation data
 * @param ttl - Time to live in seconds
 */
export const cacheConversations = async (
  userId: string,
  conversations: any[],
  ttl: number = DEFAULT_TTL
) => {
  try {
    const key = `${CACHE_PREFIX}conversations:${userId}`;
    await redisClient.setEx(key, ttl, JSON.stringify(conversations));
    consola.info(`✅ Cached conversations for user ${userId}`);
  } catch (error) {
    consola.error("Error caching conversations:", error);
  }
};

/**
 * Get cached conversations for a user
 * @param userId - User ID
 * @returns Cached conversations or null
 */
export const getCachedConversations = async (
  userId: string
): Promise<any[] | null> => {
  try {
    const key = `${CACHE_PREFIX}conversations:${userId}`;
    const cached = await redisClient.get(key);

    if (cached) {
      consola.info(`✅ Retrieved cached conversations for user ${userId}`);
      return JSON.parse(cached);
    }

    return null;
  } catch (error) {
    consola.error("Error getting cached conversations:", error);
    return null;
  }
};

/**
 * Invalidate conversation cache for a user
 * @param userId - User ID
 */
export const invalidateConversationCache = async (userId: string) => {
  try {
    const key = `${CACHE_PREFIX}conversations:${userId}`;
    await redisClient.del(key);
    consola.info(`✅ Invalidated conversation cache for user ${userId}`);
  } catch (error) {
    consola.error("Error invalidating conversation cache:", error);
  }
};

/**
 * Cache unread message count
 * @param userId - User ID
 * @param count - Unread count
 */
export const cacheUnreadCount = async (userId: string, count: number) => {
  try {
    const key = `${CACHE_PREFIX}unread:${userId}`;
    await redisClient.setEx(key, 60, count.toString()); // 1 minute TTL
  } catch (error) {
    consola.error("Error caching unread count:", error);
  }
};

/**
 * Get cached unread count
 * @param userId - User ID
 * @returns Unread count or null
 */
export const getCachedUnreadCount = async (
  userId: string
): Promise<number | null> => {
  try {
    const key = `${CACHE_PREFIX}unread:${userId}`;
    const cached = await redisClient.get(key);
    return cached ? parseInt(cached, 10) : null;
  } catch (error) {
    consola.error("Error getting cached unread count:", error);
    return null;
  }
};
```

### Step 7: Update App Initialization

Update `src/app.ts`:

```typescript
import { connectDB } from "@/db";
import { connectRedis, disconnectRedis } from "@/lib/redis";
import { initializeSocketIO } from "@/api/chat/socket";
// ... other imports

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Create HTTP server
    const server = app.listen(PORT, () => {
      consola.success(`🚀 Server running on http://localhost:${PORT}`);
    });

    // Initialize Socket.IO with Redis adapter
    await initializeSocketIO(server);

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      consola.info("SIGTERM received, shutting down gracefully");
      await disconnectRedis();
      server.close(() => {
        consola.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    consola.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
```

## Redis Data Structures

### 1. Online Status

```
Key: online:user123
Value: socket_abc123
TTL: 300 seconds (5 minutes)
```

### 2. Conversation Cache

```
Key: cache:conversations:user123
Value: JSON array of conversations
TTL: 300 seconds (5 minutes)
```

### 3. Unread Count Cache

```
Key: cache:unread:user123
Value: "5"
TTL: 60 seconds (1 minute)
```

### 4. Socket.IO Adapter (Internal)

```
Key: socket.io#/#
Value: Socket.IO internal state
```

## Testing Redis Integration

### 1. Test Redis Connection

```bash
# In terminal
redis-cli

# Test commands
PING
SET test "Hello Redis"
GET test
DEL test
```

### 2. Monitor Redis Activity

```bash
# Watch all commands in real-time
redis-cli MONITOR

# Check connected clients
redis-cli CLIENT LIST

# View all keys
redis-cli KEYS "*"
```

### 3. Test Online Status

```typescript
// In your test file or REPL
import { setUserOnline, isUserOnline } from "./services/redis-status.service";

await setUserOnline("user123", "socket_abc");
const online = await isUserOnline("user123");
console.log("User online:", online); // true
```

## Performance Optimization

### 1. Connection Pooling

Redis client automatically handles connection pooling. Configure if needed:

```typescript
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});
```

### 2. Pipeline Commands

For bulk operations:

```typescript
const pipeline = redisClient.multi();
pipeline.set("key1", "value1");
pipeline.set("key2", "value2");
pipeline.set("key3", "value3");
await pipeline.exec();
```

### 3. Pub/Sub for Real-Time Events

```typescript
// Publisher
await redisClient.publish(
  "chat:notifications",
  JSON.stringify({ userId, message })
);

// Subscriber
const subscriber = redisClient.duplicate();
await subscriber.connect();
await subscriber.subscribe("chat:notifications", (message) => {
  console.log("Received:", JSON.parse(message));
});
```

## Monitoring and Debugging

### Redis CLI Commands

```bash
# Check memory usage
redis-cli INFO memory

# Monitor slow queries
redis-cli SLOWLOG GET 10

# Check key expiration
redis-cli TTL online:user123

# Count keys by pattern
redis-cli KEYS "online:*" | wc -l
```

### Application Logging

```typescript
// Add to redis.ts
redisClient.on("error", (err) => {
  consola.error("Redis Error:", err);
  // Send to error tracking service (Sentry, etc.)
});
```

## Troubleshooting

### Connection Issues

```typescript
// Add connection retry logic
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        consola.error("Max Redis reconnection attempts reached");
        return new Error("Max retries reached");
      }
      return retries * 100; // Exponential backoff
    },
  },
});
```

### Memory Issues

```bash
# Set max memory policy in redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru  # Evict least recently used keys
```

### Performance Issues

```typescript
// Use pipelining for bulk operations
// Use appropriate TTLs to prevent memory bloat
// Monitor slow queries with SLOWLOG
```

## Security Best Practices

### 1. Use Password Authentication

```env
REDIS_PASSWORD=your_strong_password_here
```

### 2. Bind to Localhost (Development)

```bash
# In redis.conf
bind 127.0.0.1
```

### 3. Disable Dangerous Commands

```bash
# In redis.conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

### 4. Use TLS (Production)

```typescript
const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: true,
  },
});
```

## Next Steps

1. ✅ Install Redis and dependencies
2. ✅ Configure environment variables
3. ✅ Implement Redis client module
4. ✅ Update Socket.IO with Redis adapter
5. ✅ Migrate online status to Redis
6. ✅ Add conversation caching
7. ✅ Test thoroughly
8. 📋 Deploy to production (see ELASTICACHE_INTEGRATION.md)

## References

- [Redis Documentation](https://redis.io/documentation)
- [Socket.IO Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- [Node Redis Client](https://github.com/redis/node-redis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
