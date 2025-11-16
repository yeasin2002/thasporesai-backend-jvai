# Job Invite Module - Quick Reference

## Overview
Allows customers to proactively invite contractors to work on their jobs.

## Files Structure
```
job-invite/
├── job-invite.route.ts          # Express routes
├── job-invite.validation.ts     # Zod schemas
├── job-invite.openapi.ts        # OpenAPI documentation
├── services/
│   ├── index.ts                 # Barrel exports
│   ├── send-invite.service.ts
│   ├── get-sent-invites.service.ts
│   ├── get-received-invites.service.ts
│   ├── get-invite.service.ts
│   ├── accept-invite.service.ts
│   ├── reject-invite.service.ts
│   └── cancel-invite.service.ts
├── JOB_INVITE_MODULE.md         # Full documentation
└── README.md                    # This file
```

## Quick API Reference

### Customer Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/job-invite/send/:jobId` | Send invite to contractor |
| GET | `/api/job-invite/sent` | Get sent invites |
| DELETE | `/api/job-invite/:inviteId` | Cancel invite |

### Contractor Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/job-invite/received` | Get received invites |
| PATCH | `/api/job-invite/:inviteId/accept` | Accept invite |
| PATCH | `/api/job-invite/:inviteId/reject` | Reject invite |

### Shared Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/job-invite/:inviteId` | Get invite details |

## Database Model
- **Collection**: `jobinvites`
- **Key Fields**: job, customer, contractor, status, message
- **Statuses**: pending, accepted, rejected, cancelled

## Key Features
✅ One invite per contractor per job  
✅ Prevents duplicate invites  
✅ Auto-creates conversation on acceptance  
✅ Push notifications for all actions  
✅ Pagination support  
✅ Status filtering  
✅ Full authorization checks  

## Testing
See `api-client/job-invite.http` for API test examples.

## Documentation
See `JOB_INVITE_MODULE.md` for complete documentation.
