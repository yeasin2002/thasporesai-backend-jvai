# Logging System Documentation

## Overview

JobSphere uses **Pino** for high-performance, structured logging with automatic file rotation and pretty printing.

## Quick Links

- [Complete Guide](./PINO_LOGGING_GUIDE.md) - Full documentation
- [Usage Examples](./USAGE_EXAMPLES.md) - Code examples for common scenarios

## Quick Start

### 1. Import Logger Functions

```typescript
import { logInfo, logError, logWarn, logDebug } from "@/lib/pino";
```

### 2. Log Messages

```typescript
// Info
logInfo("User registered", { userId: user._id, email: user.email });

// Error
logError("Payment failed", error, { orderId: order._id });

// Warning
logWarn("Rate limit approaching", { userId, requestCount: 95 });

// Debug (development only)
logDebug("Cache hit", { key: "user:123" });
```

### 3. Automatic HTTP Logging

All HTTP requests are automatically logged with:
- Method, URL, status code
- Response time
- Request body, params, query
- User information (if authenticated)

## Features

✅ **Fast** - 5x faster than Winston  
✅ **Automatic File Rotation** - Logs stored in `logs/` directory  
✅ **Pretty Console Output** - Colorized in development  
✅ **Structured JSON** - Easy to parse and analyze  
✅ **Request Tracking** - Full context for every request  
✅ **Error Stack Traces** - Complete error details  

## Log Files

```
logs/
├── app.log      # All logs
└── error.log    # Errors only
```

## Configuration

Add to `.env`:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

## Response Handler Integration

All response helpers automatically log:

```typescript
import { sendSuccess, sendError } from "@/helpers";

// Automatically logs with full context
sendSuccess(res, 200, "Job created", job);
sendError(res, 500, "Failed to create job");
```

## Best Practices

1. **Use appropriate log levels**
   - `debug` - Verbose debugging info
   - `info` - Important events
   - `warn` - Issues that need attention
   - `error` - Failures and exceptions

2. **Include context**
   ```typescript
   logInfo("Payment processed", {
     orderId: order._id,
     amount: order.amount,
     userId: user._id,
   });
   ```

3. **Never log sensitive data**
   - ❌ Passwords
   - ❌ Tokens
   - ❌ Credit card numbers
   - ❌ API keys

4. **Log errors with full context**
   ```typescript
   try {
     await processPayment(order);
   } catch (error) {
     logError("Payment failed", error, {
       orderId: order._id,
       userId: user._id,
     });
   }
   ```

## Viewing Logs

### Development
Logs are printed to console with colors and saved to files.

### Production
View logs with:

```bash
# View all logs
cat logs/app.log

# View errors only
cat logs/error.log

# Tail logs in real-time
tail -f logs/app.log

# Pretty print
cat logs/app.log | pino-pretty
```

## Migration from Winston

The API is compatible with the old Winston logger:

```typescript
// Old (Winston)
import { logError, logInfo } from "@/lib/logger";

// New (Pino) - Same API!
import { logError, logInfo } from "@/lib/pino";
```

## Documentation

- **[PINO_LOGGING_GUIDE.md](./PINO_LOGGING_GUIDE.md)** - Complete guide with configuration, features, and best practices
- **[USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)** - Real-world code examples for all common scenarios

## Support

For issues or questions, refer to the complete guide or check the usage examples.
