# Phase 6: Load Testing Guide

**Purpose**: Verify Stripe integration performance under load  
**Tool**: k6 (recommended) or Artillery  
**Date**: January 25, 2026

---

## Setup

### Install k6

**Windows**:
```powershell
choco install k6
```

**Mac**:
```bash
brew install k6
```

**Linux**:
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

---

## Load Test Scenarios

### Scenario 1: Deposit Endpoint Load Test

**File**: `tests/load/deposit-load.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Less than 10% failure rate
  },
};

const BASE_URL = 'http://localhost:4000';
const AUTH_TOKEN = 'YOUR_TEST_TOKEN'; // Replace with actual token

export default function () {
  const payload = JSON.stringify({
    amount: Math.floor(Math.random() * 100) + 10, // Random amount 10-110
    paymentMethodId: 'pm_card_visa',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/wallet/deposit`, payload, params);

  check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'response time < 2s': (r) => r.timings.duration < 2000,
    'has transaction id': (r) => JSON.parse(r.body).data?.transaction?.id !== undefined,
  });

  sleep(1); // Wait 1 second between requests
}
```

**Run**:
```bash
k6 run tests/load/deposit-load.js
```

**Expected Results**:
- 95% of requests complete in < 2 seconds
- Less than 10% failure rate
- No server crashes
- Database connections stable

---

### Scenario 2: Withdrawal Endpoint Load Test

**File**: `tests/load/withdrawal-load.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.15'],
  },
};

const BASE_URL = 'http://localhost:4000';
const CONTRACTOR_TOKEN = 'YOUR_CONTRACTOR_TOKEN';

export default function () {
  const payload = JSON.stringify({
    amount: Math.floor(Math.random() * 50) + 10,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONTRACTOR_TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/wallet/withdraw`, payload, params);

  check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'response time < 3s': (r) => r.timings.duration < 3000,
  });

  sleep(2);
}
```

---

### Scenario 3: Webhook Processing Load Test

**File**: `tests/load/webhook-load.js`

```javascript
import http from 'k6/http';
import { check } from 'k6';
import crypto from 'k6/crypto';

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:4000';
const WEBHOOK_SECRET = 'YOUR_WEBHOOK_SECRET';

export default function () {
  const payload = JSON.stringify({
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: `pi_test_${Date.now()}`,
        amount: 10000,
        status: 'succeeded',
        metadata: {
          userId: 'test_user_123',
          walletId: 'test_wallet_123',
        },
      },
    },
  });

  // Generate signature (simplified - use actual Stripe signature in production)
  const signature = crypto.hmac('sha256', payload, WEBHOOK_SECRET, 'hex');

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': `t=${Date.now()},v1=${signature}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/webhooks/stripe`, payload, params);

  check(res, {
    'status is 200 or 400': (r) => r.status === 200 || r.status === 400,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
}
```

---

### Scenario 4: Mixed Load Test

**File**: `tests/load/mixed-load.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    deposits: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '1m', target: 0 },
      ],
      exec: 'depositTest',
    },
    withdrawals: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '2m', target: 5 },
        { duration: '1m', target: 0 },
      ],
      exec: 'withdrawalTest',
    },
    walletReads: {
      executor: 'constant-vus',
      vus: 20,
      duration: '4m',
      exec: 'walletReadTest',
    },
  },
};

const BASE_URL = 'http://localhost:4000';
const CUSTOMER_TOKEN = 'YOUR_CUSTOMER_TOKEN';
const CONTRACTOR_TOKEN = 'YOUR_CONTRACTOR_TOKEN';

export function depositTest() {
  const res = http.post(
    `${BASE_URL}/api/wallet/deposit`,
    JSON.stringify({
      amount: 50,
      paymentMethodId: 'pm_card_visa',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CUSTOMER_TOKEN}`,
      },
    }
  );

  check(res, { 'deposit status ok': (r) => r.status === 200 || r.status === 400 });
  sleep(1);
}

export function withdrawalTest() {
  const res = http.post(
    `${BASE_URL}/api/wallet/withdraw`,
    JSON.stringify({ amount: 30 }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONTRACTOR_TOKEN}`,
      },
    }
  );

  check(res, { 'withdrawal status ok': (r) => r.status === 200 || r.status === 400 });
  sleep(2);
}

export function walletReadTest() {
  const res = http.get(`${BASE_URL}/api/wallet`, {
    headers: {
      'Authorization': `Bearer ${CUSTOMER_TOKEN}`,
    },
  });

  check(res, {
    'wallet read ok': (r) => r.status === 200,
    'has balance': (r) => JSON.parse(r.body).data?.balance !== undefined,
  });
  sleep(0.5);
}
```

---

## Performance Metrics

### Key Metrics to Monitor

1. **Response Time**
   - p50 (median): < 500ms
   - p95: < 2000ms
   - p99: < 5000ms

2. **Throughput**
   - Deposits: 10-20 requests/second
   - Withdrawals: 5-10 requests/second
   - Wallet reads: 50-100 requests/second

3. **Error Rate**
   - < 1% for normal operations
   - < 10% under peak load

4. **Database Performance**
   - Query time: < 100ms average
   - Connection pool: < 80% utilization
   - No connection timeouts

5. **Stripe API**
   - Rate limit: Stay under 100 requests/second
   - No 429 errors from Stripe
   - Retry logic working

---

## Monitoring During Load Tests

### Server Monitoring

```bash
# CPU and Memory
top

# Network connections
netstat -an | grep 4000 | wc -l

# MongoDB connections
mongo --eval "db.serverStatus().connections"
```

### Application Logs

```bash
# Watch error logs
tail -f logs/error-*.log

# Watch combined logs
tail -f logs/combined-*.log

# Count errors
grep "ERROR" logs/combined-*.log | wc -l
```

### Database Monitoring

```javascript
// MongoDB shell
db.currentOp()
db.serverStatus()
db.stats()
```

---

## Performance Benchmarks

### Baseline Performance (No Load)

| Endpoint | Avg Response Time | p95 | p99 |
|----------|------------------|-----|-----|
| POST /api/wallet/deposit | 800ms | 1200ms | 1500ms |
| POST /api/wallet/withdraw | 600ms | 1000ms | 1300ms |
| GET /api/wallet | 50ms | 100ms | 150ms |
| POST /api/webhooks/stripe | 200ms | 400ms | 600ms |

### Under Load (20 concurrent users)

| Endpoint | Avg Response Time | p95 | p99 | Error Rate |
|----------|------------------|-----|-----|------------|
| POST /api/wallet/deposit | 1200ms | 2000ms | 3000ms | < 5% |
| POST /api/wallet/withdraw | 900ms | 1500ms | 2000ms | < 5% |
| GET /api/wallet | 100ms | 200ms | 300ms | < 1% |
| POST /api/webhooks/stripe | 300ms | 600ms | 900ms | < 2% |

---

## Bottleneck Analysis

### Common Bottlenecks

1. **Stripe API Latency**
   - Payment Intents: 500-1000ms
   - Transfers: 300-600ms
   - Account creation: 1000-2000ms

2. **Database Queries**
   - Complex aggregations: 100-500ms
   - Simple finds: 10-50ms
   - Updates: 20-100ms

3. **Network I/O**
   - External API calls
   - Database connections
   - File system operations

### Optimization Strategies

1. **Caching**
   - Cache wallet balances (Redis)
   - Cache user Stripe IDs
   - Cache account statuses

2. **Database Indexing**
   - Index on userId for transactions
   - Index on stripePaymentIntentId
   - Index on status and createdAt

3. **Connection Pooling**
   - MongoDB connection pool: 10-50 connections
   - HTTP keep-alive for Stripe API

4. **Async Processing**
   - Queue webhook processing
   - Background jobs for retries
   - Async notifications

---

## Load Test Results Template

**Date**: _________  
**Duration**: _________  
**Peak Load**: _________ concurrent users

### Results

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Avg Response Time | < 1s | _____ | ✅/❌ |
| p95 Response Time | < 2s | _____ | ✅/❌ |
| Error Rate | < 10% | _____ | ✅/❌ |
| Throughput | 10 req/s | _____ | ✅/❌ |
| CPU Usage | < 80% | _____ | ✅/❌ |
| Memory Usage | < 80% | _____ | ✅/❌ |
| DB Connections | < 80% | _____ | ✅/❌ |

### Issues Found

1. _________________
2. _________________
3. _________________

### Recommendations

1. _________________
2. _________________
3. _________________

---

## Conclusion

Load testing ensures the Stripe integration can handle production traffic. Run these tests regularly and before major releases.

**Status**: ✅ Passed / ⚠️ Needs Optimization / ❌ Failed
