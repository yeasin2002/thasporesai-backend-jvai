# Pino Logging System Guide

## Overview

JobSphere uses **Pino** - a fast, low-overhead Node.js logger with automatic file rotation and pretty printing for development. This replaces the previous Winston logger.

## Features

- ✅ **Fast & Efficient**: 5x faster than Winston
- ✅ **Automatic File Rotation**: Logs stored in `logs/` directory
- ✅ **Pretty Printing**: Colorized console output in development
- ✅ **Request Logging**: Automatic HTTP request/response logging
- ✅ **Structured Logging**: JSON format for easy parsing
- ✅ **Multiple Log Levels**: debug, info, warn, error
- ✅ **Context Tracking**: Request body, params, query, user info
- ✅ **Error Stack Traces**: Full error details with stack traces

## Configuration

### Environment Variables

Add to your `.env` file:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

**Log Levels**:

- `debug` - All logs (development)
- `info` - Info and above (production)
- `warn` - Warnings and errors only
- `error` - Errors only

### Log Files

Logs are automatically stored in the `logs/` directory:

```
logs/
├── app.log      # All logs (debug, info, warn, error)
└── error.log    # Error logs only
```

**File Rotation**: Files are automatically managed by Pino. Old logs are preserved with timestamps.

## Usage

### 1. Automatic HTTP Request Logging

All HTTP requests are automatically logged with:

- Method (GET, POST, etc.)
- URL path
- Status code
- Response time
- Request body (for POST/PUT/PATCH)
- Query parameters
- User information (if authenticated)
- IP address
- User agent

**Example log output**:

```
[2025-11-18 10:30:45] INFO - POST /api/auth/login 200 - 45ms
  request: {
    method: "POST",
    url: "/api/auth/login",
    body: { email: "user@example.com" },
    headers: { userAgent: "Mozilla/5.0..." }
  }
  response: { statusCode: 200 }
  responseTime: 45
```

### 2. Manual Logging Functions

Import from `@/lib/pino`:

```typescript
import {
  logger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logResponse,
} from "@/lib/pino";
```

#### Log Info

```typescript
logInfo("User registered successfully", {
  userId: user._id,
  email: user.email,
  role: user.role,
});
```

#### Log Error

```typescript
try {
  // Your code
} catch (error) {
  logError("Failed to create job", error, {
    userId: req.user.id,
    jobData: req.body,
  });
}
```

#### Log Warning

```typescript
logWarn("Payment processing delayed", {
  orderId: order._id,
  amount: order.amount,
  retryCount: 3,
});
```

#### Log Debug (Development Only)

```typescript
logDebug("Database query executed", {
  query: "findOne",
  collection: "users",
  duration: "12ms",
});
```

#### Log Response (API Responses)

```typescript
logResponse(200, "Job created successfully", {
  jobId: job._id,
  customerId: customer._id,
});
```

### 3. Response Handler Integration

All response helper functions automatically log:

```typescript
import { sendSuccess, sendError, sendNotFound } from "@/helpers";

// Automatically logs: [200] Job created successfully
sendSuccess(res, 200, "Job created successfully", job);

// Automatically logs: [404] Job not found (with full context)
sendNotFound(res, "Job not found");

// Automatically logs: [500] Internal Server Error (with error details)
sendInternalError(res, "Failed to process payment");
```

**Logged context includes**:

- HTTP method
- URL path
- Request body
- Query parameters
- Route parameters
- User IP address
- User agent
- Validation errors (if any)

### 4. Direct Logger Usage

For advanced use cases:

```typescript
import { logger } from "@/lib/pino";

// Simple log
logger.info("Server started");

// Log with context
logger.info({ userId: "123", action: "login" }, "User logged in");

// Log error with stack trace
logger.error({ err: error }, "Database connection failed");

// Child logger (adds context to all logs)
const childLogger = logger.child({ module: "payment" });
childLogger.info("Processing payment");
```

## Log Format

### Development Mode

Pretty printed with colors:

```
[2025-11-18 10:30:45] INFO - User logged in
  userId: "user_123"
  email: "user@example.com"
  ip: "192.168.1.1"
```

### Production Mode

JSON format for easy parsing:

```json
{
  "level": "INFO",
  "time": "2025-11-18T10:30:45.123Z",
  "msg": "User logged in",
  "userId": "user_123",
  "email": "user@example.com",
  "ip": "192.168.1.1"
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
logDebug("Cache hit", { key: "user:123" });
logInfo("User registered", { userId: user._id });
logWarn("Rate limit approaching", { userId, requestCount: 95 });
logError("Payment failed", error, { orderId: order._id });

// ❌ Bad
logInfo("Variable x = 5"); // Too verbose
logError("User not found"); // Not an error, use logWarn
```

### 2. Include Relevant Context

```typescript
// ✅ Good - Includes context for debugging
logError("Failed to create job", error, {
  userId: req.user.id,
  jobData: req.body,
  timestamp: new Date(),
});

// ❌ Bad - No context
logError("Failed to create job", error);
```

### 3. Don't Log Sensitive Data

```typescript
// ✅ Good
logInfo("User logged in", {
  userId: user._id,
  email: user.email,
});

// ❌ Bad - Logs password
logInfo("User logged in", {
  userId: user._id,
  password: user.password, // NEVER LOG PASSWORDS
  creditCard: user.card, // NEVER LOG PAYMENT INFO
});
```

### 4. Use Structured Logging

```typescript
// ✅ Good - Structured data
logInfo("Payment processed", {
  orderId: order._id,
  amount: order.amount,
  currency: "USD",
  status: "completed",
});

// ❌ Bad - String concatenation
logInfo(`Payment processed: ${order._id} - ${order.amount} USD`);
```

### 5. Log Errors with Full Context

```typescript
// ✅ Good
try {
  await processPayment(order);
} catch (error) {
  logError("Payment processing failed", error, {
    orderId: order._id,
    amount: order.amount,
    customerId: order.customerId,
    attemptNumber: retryCount,
  });
  throw error;
}

// ❌ Bad
try {
  await processPayment(order);
} catch (error) {
  console.log("Error:", error); // Don't use console.log
}
```

## Viewing Logs

### Development

Logs are printed to console with colors and also saved to files.

### Production

Logs are saved to files only. View with:

```bash
# View all logs
cat logs/app.log

# View error logs only
cat logs/error.log

# Tail logs in real-time
tail -f logs/app.log

# Search logs
grep "error" logs/app.log

# View last 100 lines
tail -n 100 logs/app.log
```

### Using Pino Pretty (Development)

View logs with pretty formatting:

```bash
# Pretty print log file
cat logs/app.log | pino-pretty

# Tail with pretty print
tail -f logs/app.log | pino-pretty

# Filter by level
cat logs/app.log | pino-pretty --level info
```

## Log Analysis

### Search for Specific User

```bash
grep "userId.*user_123" logs/app.log | pino-pretty
```

### Find All Errors

```bash
grep '"level":"ERROR"' logs/app.log | pino-pretty
```

### Find Slow Requests (>1000ms)

```bash
grep "responseTime" logs/app.log | grep -E "responseTime\":[0-9]{4,}" | pino-pretty
```

### Count Errors by Type

```bash
grep '"level":"ERROR"' logs/app.log | jq -r '.msg' | sort | uniq -c | sort -rn
```

## Performance

Pino is extremely fast:

- **5x faster** than Winston
- **10x faster** than Bunyan
- **Minimal overhead**: ~1-2ms per log
- **Async logging**: Non-blocking I/O

## Migration from Winston

If you have existing Winston code:

```typescript
// Old (Winston)
import { logError, logInfo } from "@/lib/logger";

// New (Pino) - Same API!
import { logError, logInfo } from "@/lib/pino";
```

The API is compatible, so most code works without changes.

## Troubleshooting

### Logs not appearing in files

Check that the `logs/` directory exists and is writable:

```bash
mkdir -p logs
chmod 755 logs
```

### Too many logs in development

Reduce log level:

```env
LOG_LEVEL=info
```

### Logs not pretty printed

Ensure `pino-pretty` is installed:

```bash
bun add pino-pretty
```

### Performance issues

Disable pretty printing in production:

```env
NODE_ENV=production
```

## Advanced Configuration

### Custom Log Rotation

Edit `src/lib/pino.ts` to customize rotation:

```typescript
{
  target: "pino/file",
  options: {
    destination: path.join(logsDir, "app.log"),
    mkdir: true,
    // Add rotation options here if needed
  },
}
```

### Add Custom Serializers

```typescript
export const logger = pino({
  serializers: {
    user: (user) => ({
      id: user._id,
      email: user.email,
      // Omit sensitive fields
    }),
  },
});
```

### Create Module-Specific Loggers

```typescript
import { logger } from "@/lib/pino";

const paymentLogger = logger.child({ module: "payment" });
paymentLogger.info("Processing payment"); // Includes module: "payment"
```

## Summary

Pino provides a powerful, fast, and flexible logging system for JobSphere. Use it consistently throughout the application for better debugging, monitoring, and troubleshooting.

**Key Points**:

- All HTTP requests are automatically logged
- Use appropriate log levels (debug, info, warn, error)
- Include relevant context in logs
- Never log sensitive data (passwords, tokens, etc.)
- Logs are stored in `logs/` directory with automatic rotation
- View logs with `pino-pretty` for better readability
