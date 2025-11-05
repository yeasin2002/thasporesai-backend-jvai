# Socket.IO Logging and Debugging Guide

## Overview

The JobSphere chat system includes comprehensive logging middleware to help debug issues, monitor performance, and track user activity in real-time.

## Features

- ✅ **Connection Logging**: Track all socket connections and disconnections
- ✅ **Event Logging**: Log all incoming and outgoing events
- ✅ **Data Sanitization**: Automatically redact sensitive information
- ✅ **Performance Monitoring**: Track slow events and processing times
- ✅ **Room Operations**: Monitor room joins and leaves
- ✅ **Connection Statistics**: Periodic stats about active connections
- ✅ **Error Tracking**: Detailed error logging with stack traces

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Enable Socket.IO debug logging
SOCKET_DEBUG=true

# Node environment
NODE_ENV=development  # Logging is automatic in development
```

### Logging Levels

The logger automatically adjusts based on environment:

- **Development**: All logs enabled by default
- **Production**: Only enabled if `SOCKET_DEBUG=true`

## Log Output Examples

### 1. Connection Attempt

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
      "origin": "http://localhost:3000",
      "referer": "http://localhost:3000/chat"
    },
    "query": {},
    "auth": "***TOKEN_PROVIDED***"
  }
}
```

### 2. Incoming Event

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
      "content": {
        "text": "Hello, how are you?"
      }
    }
  ]
}
```

### 3. Outgoing Event

```json
{
  "message": "📤 Outgoing Event: new_message",
  "timestamp": "2025-11-05T10:30:15.100Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "eventName": "new_message",
  "data": [
    {
      "_id": "msg123",
      "conversationId": "user123_user456",
      "senderId": {
        "name": "John Doe",
        "avatar": "/uploads/avatar.jpg"
      },
      "messageType": "text",
      "content": {
        "text": "Hello, how are you?"
      },
      "timestamp": "2025-11-05T10:30:15.000Z"
    }
  ]
}
```

### 4. Room Operations

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

### 5. Performance Warning

```json
{
  "message": "⚠️ Slow Event: send_message",
  "timestamp": "2025-11-05T10:30:15.200Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "eventName": "send_message",
  "duration": "150ms"
}
```

### 6. Connection Statistics

```json
{
  "message": "📊 Connection Statistics",
  "timestamp": "2025-11-05T10:31:00.000Z",
  "totalSockets": 25,
  "uniqueUsers": 20,
  "rooms": 15
}
```

### 7. Disconnection

```json
{
  "message": "🔌 Socket Disconnected",
  "timestamp": "2025-11-05T10:35:00.000Z",
  "socketId": "abc123xyz",
  "userId": "user123",
  "reason": "client namespace disconnect",
  "duration": 300000
}
```

### 8. Error

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

## Data Sanitization

The logger automatically redacts sensitive information:

### Before Sanitization

```json
{
  "email": "user@example.com",
  "password": "mySecretPassword123",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "authToken": "Bearer abc123xyz"
}
```

### After Sanitization

```json
{
  "email": "user@example.com",
  "password": "***REDACTED***",
  "token": "***REDACTED***",
  "authToken": "***REDACTED***"
}
```

### Redacted Fields

The following field names are automatically redacted:

- `password`
- `token`
- `secret`
- `auth`
- Any field containing these keywords (case-insensitive)

## Using the Logger in Your Code

### Basic Usage

The logger is automatically applied to all socket connections. No additional code needed!

### Custom Event Logging

For detailed debugging of specific events:

```typescript
import { createEventLogger } from "../middleware/logger.middleware";

export const registerChatHandlers = (io: Server, socket: Socket) => {
  socket.on("send_message", async (data) => {
    // Log event details
    const logger = createEventLogger("send_message");
    logger(socket, data);

    // Your handler code...
  });
};
```

### Manual Logging

For custom log messages:

```typescript
import consola from "consola";

// Info log
consola.info({
  message: "Custom log message",
  timestamp: new Date().toISOString(),
  socketId: socket.id,
  userId: socket.data.userId,
  customData: { key: "value" },
});

// Warning log
consola.warn({
  message: "Warning message",
  // ... additional data
});

// Error log
consola.error({
  message: "Error message",
  error: {
    message: error.message,
    stack: error.stack,
  },
});
```

## Debugging Common Issues

### Issue 1: User Not Receiving Messages

**Check logs for:**

1. Connection status:

```
✅ User connected: user456
```

2. Room join:

```
🚪 User Joined Room(s): ["user123_user456"]
```

3. Message broadcast:

```
📤 Outgoing Event: new_message
```

**Debug steps:**

1. Verify user is connected (check connection logs)
2. Verify user joined the correct room
3. Check if message was broadcast to the room
4. Look for any error logs

### Issue 2: Slow Message Delivery

**Check logs for:**

```
⚠️ Slow Event: send_message
duration: "250ms"
```

**Debug steps:**

1. Check database query performance
2. Look for network latency issues
3. Check if server is under heavy load
4. Review connection statistics

### Issue 3: Authentication Failures

**Check logs for:**

```
❌ Socket Error
error: "Invalid authentication token"
```

**Debug steps:**

1. Verify token is being sent in handshake
2. Check token format and expiration
3. Verify JWT secret is correct
4. Look at connection attempt logs for auth field

### Issue 4: Connection Drops

**Check logs for:**

```
🔌 Socket Disconnected
reason: "transport close"
duration: 5000
```

**Debug steps:**

1. Check disconnect reason
2. Look at connection duration (short = connection issue)
3. Check for network issues
4. Review ping/pong timeout settings

## Performance Monitoring

### Tracking Slow Events

Events taking longer than 100ms are automatically logged:

```json
{
  "message": "⚠️ Slow Event: send_message",
  "duration": "150ms"
}
```

**Optimization tips:**

- Add database indexes
- Use connection pooling
- Implement caching
- Optimize queries

### Connection Statistics

Monitor these metrics every minute:

- **totalSockets**: Total active socket connections
- **uniqueUsers**: Number of unique users connected
- **rooms**: Number of active rooms

**Healthy metrics:**

- totalSockets ≈ uniqueUsers (one connection per user)
- rooms < totalSockets (not all users in rooms)

**Warning signs:**

- totalSockets >> uniqueUsers (multiple connections per user)
- Rapidly increasing connections without disconnections
- High number of rooms relative to users

## Log Analysis

### Using grep to Filter Logs

```bash
# Find all connection attempts
grep "Socket Connection Attempt" logs.txt

# Find all errors
grep "Socket Error" logs.txt

# Find slow events
grep "Slow Event" logs.txt

# Find specific user activity
grep "user123" logs.txt

# Find specific event
grep "send_message" logs.txt
```

### Using jq for JSON Logs

If your logs are in JSON format:

```bash
# Get all error messages
cat logs.json | jq 'select(.message | contains("Error"))'

# Get events for specific user
cat logs.json | jq 'select(.userId == "user123")'

# Get slow events
cat logs.json | jq 'select(.message | contains("Slow Event"))'

# Count events by type
cat logs.json | jq -r '.eventName' | sort | uniq -c
```

## Production Considerations

### 1. Log Rotation

Use a log rotation tool to prevent disk space issues:

```bash
# Install logrotate (Linux)
sudo apt install logrotate

# Configure rotation
sudo nano /etc/logrotate.d/jobsphere-chat
```

Configuration:

```
/var/log/jobsphere-chat/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Log Aggregation

For production, send logs to a centralized service:

**Options:**

- AWS CloudWatch Logs
- Elasticsearch + Kibana
- Datadog
- Loggly
- Papertrail

**Example with Winston CloudWatch:**

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

### 3. Disable Verbose Logging in Production

```env
# Production .env
NODE_ENV=production
SOCKET_DEBUG=false  # Only enable when debugging
```

### 4. Sampling

For high-traffic applications, log only a sample of events:

```typescript
// Log 10% of events
if (Math.random() < 0.1) {
  consola.info({ message: "Event sample", data });
}
```

## Monitoring Dashboard

### Key Metrics to Track

1. **Connection Rate**: Connections per minute
2. **Disconnection Rate**: Disconnections per minute
3. **Average Connection Duration**: How long users stay connected
4. **Event Rate**: Events per second
5. **Error Rate**: Errors per minute
6. **Slow Event Rate**: Events taking >100ms

### Example Monitoring Query (CloudWatch Insights)

```sql
fields @timestamp, message, userId, eventName, duration
| filter message like /Slow Event/
| stats count() by eventName
| sort count desc
```

## Troubleshooting Checklist

When debugging issues, check:

- [ ] User is authenticated (check connection logs)
- [ ] User joined the correct room (check room logs)
- [ ] Events are being received (check incoming event logs)
- [ ] Events are being sent (check outgoing event logs)
- [ ] No errors in logs (check error logs)
- [ ] Performance is acceptable (check slow event logs)
- [ ] Connection is stable (check disconnect logs)
- [ ] Data is not being redacted incorrectly (check sanitization)

## Best Practices

1. **Enable logging in development**: Always run with `SOCKET_DEBUG=true`
2. **Review logs regularly**: Check for patterns and issues
3. **Set up alerts**: Alert on high error rates or slow events
4. **Use structured logging**: JSON format for easy parsing
5. **Sanitize sensitive data**: Never log passwords or tokens
6. **Rotate logs**: Prevent disk space issues
7. **Monitor performance**: Track slow events and optimize
8. **Aggregate logs**: Use centralized logging in production

## Additional Resources

- [Socket.IO Debugging Guide](https://socket.io/docs/v4/troubleshooting-connection-issues/)
- [Consola Documentation](https://github.com/unjs/consola)
- [Winston Logger](https://github.com/winstonjs/winston)
- [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)

## Support

If you encounter issues:

1. Check the logs for error messages
2. Review this debugging guide
3. Check Socket.IO documentation
4. Contact the development team

---

**Remember**: Good logging is essential for debugging and monitoring. Always log enough information to diagnose issues, but not so much that it impacts performance or exposes sensitive data.
