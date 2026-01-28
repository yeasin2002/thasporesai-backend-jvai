# Agenda Job Scheduler Migration

## Overview

The offer expiration job has been migrated from a simple `setInterval` approach to using **Agenda**, a robust job scheduling library for Node.js with MongoDB persistence.

## Why Agenda?

### Benefits Over setInterval

1. **Persistence**: Jobs survive server restarts
2. **Distributed**: Multiple servers can share the same job queue
3. **Reliability**: Jobs are locked to prevent duplicate execution
4. **Monitoring**: Built-in job status tracking and history
5. **Scalability**: Handles high-volume job processing
6. **Flexibility**: Easy to add more scheduled jobs in the future

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Server                          │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Agenda     │────────▶│   MongoDB    │                │
│  │  Scheduler   │         │  agendaJobs  │                │
│  └──────┬───────┘         └──────────────┘                │
│         │                                                   │
│         │ Every Hour                                        │
│         ▼                                                   │
│  ┌──────────────────────────────────────┐                 │
│  │   Expire Offers Job Handler          │                 │
│  │                                       │                 │
│  │  1. Find expired accepted offers     │                 │
│  │  2. Refund customer (DB transaction) │                 │
│  │  3. Reset job/application status     │                 │
│  │  4. Send notifications               │                 │
│  └──────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### Files Structure

```
src/
├── lib/
│   └── agenda.ts              # Agenda initialization and configuration
├── jobs/
│   └── expire-offers.ts       # Offer expiration job definition
└── app.ts                     # Server startup with Agenda integration
```

## Configuration

### Agenda Settings

Located in `src/lib/agenda.ts`:

```typescript
{
  backend: new MongoBackend({
    address: DATABASE_URL,
    collection: "agendaJobs"  // Separate collection for job data
  }),
  processEvery: "1 minute",    // Check for jobs every minute
  maxConcurrency: 20,          // Max 20 jobs running simultaneously
  defaultConcurrency: 5,       // Default 5 per job type
  defaultLockLifetime: 10 * 60 * 1000  // 10 minutes lock
}
```

### Job Configuration

Located in `src/jobs/expire-offers.ts`:

```typescript
{
  concurrency: 1,              // Only one instance runs at a time
  lockLifetime: 5 * 60 * 1000  // 5 minutes lock lifetime
}
```

### Schedule

- **Frequency**: Every 1 hour
- **Immediate**: Runs immediately on server start
- **Persistence**: Schedule persists across restarts

## Job Lifecycle

### 1. Server Startup

```typescript
// app.ts
const agenda = await initializeAgenda();
await initializeExpireOffersJob(agenda);
await startAgenda();
```

### 2. Job Definition

```typescript
// jobs/expire-offers.ts
agenda.define(EXPIRE_OFFERS_JOB, expireOffersHandler, options);
```

### 3. Job Scheduling

```typescript
// Schedule to run every hour
await agenda.every("1 hour", EXPIRE_OFFERS_JOB, {}, { skipImmediate: false });
```

### 4. Job Execution

When the scheduled time arrives:
1. Agenda locks the job
2. Executes `expireOffersHandler`
3. Processes expired offers
4. Returns result
5. Unlocks the job

### 5. Graceful Shutdown

```typescript
process.on("SIGTERM", async () => {
  await agenda.stop();  // Stops processing and unlocks jobs
});
```

## Database Collections

### agendaJobs Collection

Stores job definitions, schedules, and execution history:

```javascript
{
  _id: ObjectId,
  name: "expire-offers",
  type: "single",           // Recurring job
  data: {},                 // Job-specific data
  priority: 0,
  nextRunAt: ISODate,       // Next scheduled run
  lastRunAt: ISODate,       // Last execution time
  lastFinishedAt: ISODate,  // Last completion time
  lockedAt: null,           // Lock timestamp when running
  failedAt: null,           // Failure timestamp
  failReason: null,         // Error message if failed
  repeatInterval: "1 hour", // Schedule interval
  repeatTimezone: null
}
```

## Monitoring

### Logs

Agenda provides detailed logging:

```
✅ Agenda job scheduler initialized
✅ Defined job: expire-offers
✅ Scheduled job: expire-offers (runs every hour, starting immediately)
✅ Agenda job processing started
⏰ Running expire-offers job at 2024-01-28T10:00:00.000Z
✅ No expired offers found
```

### Job Results

Each execution returns:

```typescript
{
  processed: number,      // Total offers found
  successful: number,     // Successfully processed
  failed: number,         // Failed to process
  message: string         // Summary message
}
```

### Database Queries

Monitor job execution:

```javascript
// Get all jobs
db.agendaJobs.find({ name: "expire-offers" });

// Get next run time
db.agendaJobs.findOne(
  { name: "expire-offers" },
  { nextRunAt: 1, lastRunAt: 1 }
);

// Get failed jobs
db.agendaJobs.find({ name: "expire-offers", failedAt: { $ne: null } });
```

## Adding New Jobs

To add a new scheduled job:

### 1. Create Job File

```typescript
// src/jobs/my-new-job.ts
import type { Agenda, Job } from "agenda";

export const MY_JOB_NAME = "my-new-job";

export const myJobHandler = async (_job: Job) => {
  // Your job logic here
  console.log("Running my job");
};

export const defineMyJob = (agenda: Agenda) => {
  agenda.define(MY_JOB_NAME, myJobHandler, {
    concurrency: 1,
    lockLifetime: 5 * 60 * 1000,
  });
};

export const scheduleMyJob = async (agenda: Agenda) => {
  await agenda.cancel({ name: MY_JOB_NAME });
  await agenda.every("30 minutes", MY_JOB_NAME);
};

export const initializeMyJob = async (agenda: Agenda) => {
  defineMyJob(agenda);
  await scheduleMyJob(agenda);
};
```

### 2. Register in app.ts

```typescript
import { initializeMyJob } from "./jobs/my-new-job";

// In server startup
const agenda = await initializeAgenda();
await initializeExpireOffersJob(agenda);
await initializeMyJob(agenda);  // Add your job
await startAgenda();
```

## Troubleshooting

### Job Not Running

1. Check Agenda is started: `await startAgenda()`
2. Check job is defined: Look for "Defined job: expire-offers" in logs
3. Check job is scheduled: Query `agendaJobs` collection
4. Check for errors: Look for failed jobs in database

### Duplicate Executions

- Ensure `concurrency: 1` is set for jobs that shouldn't run in parallel
- Check that `agenda.cancel()` is called before rescheduling

### Jobs Stuck in "Locked" State

- Increase `lockLifetime` if job takes longer than expected
- Check for server crashes during job execution
- Manually unlock: `db.agendaJobs.updateMany({ lockedAt: { $ne: null } }, { $set: { lockedAt: null } })`

### Performance Issues

- Reduce `processEvery` interval if jobs need faster pickup
- Increase `maxConcurrency` for more parallel processing
- Add indexes to `agendaJobs` collection if needed

## Migration Checklist

- [x] Install Agenda and MongoDB backend
- [x] Create Agenda initialization module
- [x] Refactor expire-offers job to use Agenda
- [x] Update app.ts to use Agenda
- [x] Remove old setInterval implementation
- [x] Test job execution
- [x] Verify graceful shutdown
- [x] Document migration

## Testing

### Manual Testing

1. Start server: `bun dev`
2. Check logs for Agenda initialization
3. Wait for job execution (or trigger manually)
4. Verify expired offers are processed
5. Check `agendaJobs` collection for job history

### Trigger Job Manually

```typescript
// In a test script or admin endpoint
import { getAgenda } from "@/lib/agenda";

const agenda = getAgenda();
await agenda.now("expire-offers");
```

## Future Enhancements

1. **Agendash UI**: Add web interface for job monitoring
2. **Job Metrics**: Track execution times and success rates
3. **Retry Logic**: Configure automatic retries for failed jobs
4. **Job Priorities**: Prioritize critical jobs
5. **Dynamic Scheduling**: Allow admins to change schedules
6. **Job Notifications**: Alert admins when jobs fail

## Resources

- [Agenda Documentation](https://github.com/agenda/agenda)
- [MongoDB Backend](https://github.com/agenda/agenda/tree/main/packages/mongo-backend)
- [Agendash UI](https://github.com/agenda/agendash)
