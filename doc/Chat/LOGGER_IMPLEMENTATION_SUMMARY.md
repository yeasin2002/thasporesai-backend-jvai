# Socket.IO Logger Implementation Summary

## ✅ What Was Created

### 1. Logger Middleware (`logger.middleware.ts`)

A comprehensive logging middleware that tracks:

- **Connection Attempts**: Full handshake details, IP, user agent, auth status
- **All Events**: Both incoming and outgoing events with data
- **Room Operations**: Join/leave tracking
- **Performance**: Automatic detection of slow events (>100ms)
- **Errors**: Detailed error logging with stack traces
- **Statistics**: Periodic connection stats (every 60 seconds)
- **Data Sanitization**: Automatic redaction of sensitive fields

### 2. Integration (`index.ts`)

Updated Socket.IO initialization to:

- Apply logger middleware conditionally (dev mode or SOCKET_DEBUG=true)
- Enable room operation logging
- Enable performance monitoring
- Start connection statistics logger

### 3. Documentation

Created three comprehensive guides:

1. **LOGGING_AND_DEBUGGING.md** (Full Guide)

   - Complete feature documentation
   - Log output examples
   - Debugging workflows
   - Production considerations
   - Monitoring strategies

2. **LOGGER_QUICK_REFERENCE.md** (Quick Reference)

   - Quick setup instructions
   - Common debugging commands
   - Troubleshooting checklist

3. **LOGGER_IMPLEMENTATION_SUMMARY.md** (This File)
   - Implementation overview
   - File structure
   - Usage examples

## 📁 File Structure

```
src/api/chat/socket/
├── middleware/
│   ├── auth.middleware.ts          # JWT authentication
│   └── logger.middleware.ts        # ⭐ NEW - Logging middleware
├── handlers/
│   ├── chat.handler.ts
│   ├── typing.handler.ts
│   └── status.handler.ts
├── utils/
│   └── room.utils.ts
└── index.ts                        # ⭐ UPDATED - Added logging

doc/Chat/
├── LOGGING_AND_DEBUGGING.md        # ⭐ NEW - Full guide
├── LOGGER_QUICK_REFERENCE.md       # ⭐ NEW - Quick reference
└── LOGGER_IMPLEMENTATION_SUMMARY.md # ⭐ NEW - This file
```

## 🚀 Features

### Automatic Logging

✅ **No code changes needed** - Just enable in environment variables
✅ **Conditional** - Only runs in development or when explicitly enabled
✅ **Comprehensive** - Logs everything you need for debugging
✅ **Safe** - Automatically redacts sensitive data
✅ **Performance-aware** - Highlights slow events
✅ **Production-ready** - Can be enabled/disabled per environment

### Data Sanitization

Automatically redacts fields containing:

- `password`
- `token`
- `secret`
- `auth`

Example:

```json
// Before
{ "password": "secret123", "email": "user@example.com" }

// After
{ "password": "***REDACTED***", "email": "user@example.com" }
```

### Performance Monitoring

Automatically logs events taking longer than 100ms:

```json
{
  "message": "⚠️ Slow Event: send_message",
  "duration": "150ms",
  "eventName": "send_message"
}
```

### Connection Statistics

Every 60 seconds, logs:

- Total active sockets
- Unique users connected
- Number of active rooms

```json
{
  "message": "📊 Connection Statistics",
  "totalSockets": 25,
  "uniqueUsers": 20,
  "rooms": 15
}
```

## 🔧 Configuration

### Environment Variables

```env
# Enable logging
SOCKET_DEBUG=true

# Node environment (auto-enables in development)
NODE_ENV=development
```

### Conditional Logging

```typescript
// In index.ts
if (
  process.env.NODE_ENV !== "production" ||
  process.env.SOCKET_DEBUG === "true"
) {
  io.use(loggerMiddleware);
}
```

## 📊 Log Examples

### Connection

```json
{
  "message": "🔌 Socket Connection Attempt",
  "timestamp": "2025-11-05T10:30:00.000Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "handshake": {
    "address": "192.168.1.100",
    "headers": {
      "userAgent": "Mozilla/5.0...",
      "origin": "http://localhost:3000"
    },
    "auth": "***TOKEN_PROVIDED***"
  }
}
```

### Incoming Event

```json
{
  "message": "📨 Incoming Event: send_message",
  "timestamp": "2025-11-05T10:30:15.000Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "eventName": "send_message",
  "data": [
    {
      "conversationId": "user123_user456",
      "receiverId": "user456",
      "messageType": "text",
      "content": { "text": "Hello!" }
    }
  ]
}
```

### Room Join

```json
{
  "message": "🚪 User Joined Room(s)",
  "timestamp": "2025-11-05T10:30:10.000Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "rooms": ["user123_user456"],
  "totalRooms": 2
}
```

### Error

```json
{
  "message": "❌ Socket Error",
  "timestamp": "2025-11-05T10:30:20.000Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "error": {
    "message": "Failed to send message",
    "stack": "Error: Failed to send message\n    at ..."
  }
}
```

## 🐛 Debugging Workflows

### Issue: User not receiving messages

**Steps:**

1. Check connection: `grep "User connected: user456" logs.txt`
2. Check room join: `grep "User Joined Room" logs.txt`
3. Check message broadcast: `grep "new_message" logs.txt`
4. Check for errors: `grep "Socket Error" logs.txt`

### Issue: Slow performance

**Steps:**

1. Find slow events: `grep "Slow Event" logs.txt`
2. Check duration
3. Identify bottleneck (database, network, etc.)
4. Optimize accordingly

### Issue: Authentication failures

**Steps:**

1. Check connection attempt: `grep "Socket Connection Attempt" logs.txt`
2. Look for auth field: Should show `***TOKEN_PROVIDED***`
3. Check for errors: `grep "Invalid authentication token" logs.txt`
4. Verify token format and expiration

## 📈 Production Considerations

### Enable Only When Needed

```env
# Production - disabled by default
NODE_ENV=production
SOCKET_DEBUG=false

# Enable temporarily for debugging
SOCKET_DEBUG=true
```

### Log Rotation

Use logrotate or similar:

```bash
/var/log/jobsphere-chat/*.log {
    daily
    rotate 7
    compress
}
```

### Centralized Logging

Send logs to CloudWatch, Elasticsearch, or similar:

```typescript
import CloudWatchTransport from "winston-cloudwatch";

logger.add(
  new CloudWatchTransport({
    logGroupName: "/aws/jobsphere/chat",
    awsRegion: "us-east-1",
  })
);
```

### Sampling

For high-traffic apps, log only a sample:

```typescript
if (Math.random() < 0.1) {
  // 10% sampling
  consola.info({ message: "Event sample", data });
}
```

## 🎯 Key Benefits

1. **Zero Configuration**: Works out of the box in development
2. **Comprehensive**: Logs everything needed for debugging
3. **Safe**: Automatically redacts sensitive data
4. **Performance-Aware**: Highlights slow operations
5. **Production-Ready**: Can be enabled/disabled per environment
6. **Flexible**: Easy to extend with custom logging

## 🔍 Advanced Usage

### Custom Event Logger

```typescript
import { createEventLogger } from "../middleware/logger.middleware";

socket.on("custom_event", (data) => {
  const logger = createEventLogger("custom_event");
  logger(socket, data);

  // Your handler code...
});
```

### Manual Logging

```typescript
import consola from "consola";

consola.info({
  message: "Custom log message",
  timestamp: new Date().toISOString(),
  socketId: socket.id,
  userId: socket.data.userId,
  customData: { key: "value" },
});
```

## 📚 Documentation Files

1. **LOGGING_AND_DEBUGGING.md** - Complete guide with examples
2. **LOGGER_QUICK_REFERENCE.md** - Quick reference for common tasks
3. **LOGGER_IMPLEMENTATION_SUMMARY.md** - This overview

## ✅ Testing

### Test Logging

1. Start server with `SOCKET_DEBUG=true`
2. Connect a client
3. Send some messages
4. Check console output

### Expected Output

You should see:

- Connection attempt log
- Incoming event logs
- Outgoing event logs
- Room operation logs
- Connection statistics (every 60s)

## 🎉 Summary

You now have a **production-ready logging system** that:

- ✅ Logs all socket activity automatically
- ✅ Redacts sensitive data
- ✅ Monitors performance
- ✅ Tracks connection statistics
- ✅ Helps debug issues quickly
- ✅ Works in development and production
- ✅ Zero code changes needed in handlers

**Just set `SOCKET_DEBUG=true` and start debugging!**

## 📞 Support

For issues or questions:

1. Check the logs for error messages
2. Review LOGGING_AND_DEBUGGING.md
3. Check LOGGER_QUICK_REFERENCE.md
4. Contact the development team

---

**Happy Debugging! 🐛🔍**
