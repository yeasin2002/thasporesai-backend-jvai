# Socket.IO Logger Documentation

## Setup

```env
SOCKET_DEBUG=true
NODE_ENV=development
```

## What Gets Logged

- Connections/disconnections with handshake details
- All incoming/outgoing events with sanitized data
- Room joins/leaves
- Errors with stack traces
- Slow events (>100ms)
- Connection stats (every 60s)

## Auto-Redacted Fields

Keywords: `password`, `token`, `secret`, `auth`

```json
// Before: { "password": "secret123" }
// After:  { "password": "***REDACTED***" }
```

## Log Structure

```json
{
  "message": "Event description",
  "timestamp": "2025-11-05T10:30:00.000Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "eventName": "send_message",
  "data": {}
}
```

## Implementation

### Middleware (`logger.middleware.ts`)

```typescript
import { Socket } from "socket.io";
import consola from "consola";

// Applied conditionally in index.ts
if (
  process.env.NODE_ENV !== "production" ||
  process.env.SOCKET_DEBUG === "true"
) {
  io.use(loggerMiddleware);
}
```

Features:

- Connection tracking with IP, user agent, auth status
- Event logging (incoming/outgoing)
- Room operation monitoring
- Performance tracking (>100ms warnings)
- Error logging with stack traces
- Periodic stats (60s intervals)
- Automatic data sanitization

### Integration (`index.ts`)

```typescript
import { loggerMiddleware } from "./middleware/logger.middleware";

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
});

// Apply logging
if (
  process.env.NODE_ENV !== "production" ||
  process.env.SOCKET_DEBUG === "true"
) {
  io.use(loggerMiddleware);
}

io.use(authMiddleware);
```

## Common Debugging Patterns

### User not receiving messages

```bash
# 1. Check connection
grep "User connected: user456" logs.txt

# 2. Check room join
grep "User Joined Room" logs.txt | grep "user456"

# 3. Check message broadcast
grep "new_message" logs.txt

# 4. Check errors
grep "Socket Error" logs.txt
```

### Performance issues

```bash
# Find slow events
grep "Slow Event" logs.txt

# Check specific event
grep "send_message.*Slow Event" logs.txt
```

### Authentication failures

```bash
# Check auth in connection
grep "Socket Connection Attempt" logs.txt | grep "auth"

# Find auth errors
grep "Invalid authentication token" logs.txt
```

## Log Examples

### Connection

```json
{
  "message": "🔌 Socket Connection Attempt",
  "socketId": "abc123xyz",
  "userId": "user123",
  "handshake": {
    "address": "192.168.1.100",
    "headers": { "userAgent": "Mozilla/5.0..." },
    "auth": "***TOKEN_PROVIDED***"
  }
}
```

### Incoming Event

```json
{
  "message": "📨 Incoming Event: send_message",
  "socketId": "abc123xyz",
  "userId": "user123",
  "eventName": "send_message",
  "data": [
    {
      "conversationId": "user123_user456",
      "content": { "text": "Hello!" }
    }
  ]
}
```

### Slow Event

```json
{
  "message": "⚠️ Slow Event: send_message",
  "socketId": "abc123xyz",
  "duration": "150ms"
}
```

### Error

```json
{
  "message": "❌ Socket Error",
  "socketId": "abc123xyz",
  "error": {
    "message": "Failed to send message",
    "stack": "Error: Failed to send message\n..."
  }
}
```

### Stats

```json
{
  "message": "📊 Connection Statistics",
  "totalSockets": 25,
  "uniqueUsers": 20,
  "rooms": 15
}
```

## Custom Logging

```typescript
import consola from "consola";

consola.info({
  message: "Custom log",
  socketId: socket.id,
  userId: socket.data.userId,
  customData: { key: "value" },
});
```

## Production

### Disable verbose logging

```env
NODE_ENV=production
SOCKET_DEBUG=false
```

### Log rotation

```bash
# /etc/logrotate.d/jobsphere-chat
/var/log/jobsphere-chat/*.log {
    daily
    rotate 7
    compress
    notifempty
}
```

### Event sampling (high-traffic)

```typescript
if (Math.random() < 0.1) {
  // 10% sample
  consola.info({ message: "Event sample", data });
}
```

### Centralized logging

```typescript
import CloudWatchTransport from "winston-cloudwatch";

logger.add(
  new CloudWatchTransport({
    logGroupName: "/aws/jobsphere/chat",
    awsRegion: "us-east-1",
  })
);
```

## Troubleshooting Checklist

- [ ] User authenticated (connection logs)
- [ ] User joined correct room (room logs)
- [ ] Events received (incoming event logs)
- [ ] Events sent (outgoing event logs)
- [ ] No errors (error logs)
- [ ] Performance acceptable (slow event logs)
- [ ] Connection stable (disconnect logs)

## Monitoring Metrics

Track these KPIs:

- Connection/disconnection rate (per minute)
- Average connection duration
- Event rate (per second)
- Error rate (per minute)
- Slow event percentage

### CloudWatch Insights Query

```sql
fields @timestamp, message, userId, eventName, duration
| filter message like /Slow Event/
| stats count() by eventName
| sort count desc
```

## File Structure

```
src/api/chat/socket/
├── middleware/
│   ├── auth.middleware.ts
│   └── logger.middleware.ts      # ⭐ Logger
├── handlers/
│   ├── chat.handler.ts
│   ├── typing.handler.ts
│   └── status.handler.ts
└── index.ts                       # ⭐ Integration
```

## Key Features

- Zero configuration in development
- Automatic sensitive data redaction
- Performance monitoring (>100ms)
- Connection statistics
- Room operation tracking
- Error tracking with stack traces
- Conditional production use
- No handler code changes needed
