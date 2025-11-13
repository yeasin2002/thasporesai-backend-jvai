# 🚀 JobSphere Payment System - Quick Start Guide

**For Frontend & Mobile Developers**

---

## 📋 TL;DR

```
Customer pays $105 → Escrow → Contractor gets $80 → Admin gets $25
```

---

## 🔑 Essential Endpoints

### 1. Wallet
```bash
GET    /api/wallet                    # Get balance
POST   /api/wallet/deposit            # Add money
POST   /api/wallet/withdraw           # Withdraw (contractors only)
GET    /api/wallet/transactions       # History
```

### 2. Offers
```bash
POST   /api/job-request/:appId/send-offer      # Customer sends
POST   /api/job-request/offer/:id/accept       # Contractor accepts
POST   /api/job-request/offer/:id/reject       # Contractor rejects
```

### 3. Jobs
```bash
PATCH  /api/job/:id/status            # Update status
POST   /api/job/:id/complete          # Mark complete (releases payment)
POST   /api/job/:id/cancel            # Cancel (refunds customer)
```

---

## 💰 Commission Breakdown

```javascript
const calculateCommission = (jobBudget) => ({
  customerPays: jobBudget * 1.05,      // +5% platform fee
  platformFee: jobBudget * 0.05,       // 5% to admin (on accept)
  serviceFee: jobBudget * 0.20,        // 20% to admin (on complete)
  contractorGets: jobBudget * 0.80,    // 80% to contractor
  adminTotal: jobBudget * 0.25         // 25% total to admin
});

// Example: $100 job
// Customer pays: $105
// Admin gets: $25 ($5 + $20)
// Contractor gets: $80
```

---

## 🔄 Payment Flow

```
1. Customer deposits $200 → Wallet
2. Customer sends $100 offer → Escrow ($105 deducted)
3. Contractor accepts → Platform fee $5 to admin
4. Contractor works → Status: "in_progress"
5. Customer completes → Service fee $20 to admin, $80 to contractor
```

---

## 📱 Code Examples

### React/Next.js

```typescript
// Send Offer
const sendOffer = async (applicationId: string, amount: number) => {
  const response = await fetch(`/api/job-request/${applicationId}/send-offer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      timeline: '7 days',
      description: 'Work details'
    })
  });
  return response.json();
};

// Accept Offer
const acceptOffer = async (offerId: string) => {
  const response = await fetch(`/api/job-request/offer/${offerId}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Complete Job
const completeJob = async (jobId: string) => {
  const response = await fetch(`/api/job/${jobId}/complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Flutter/Dart

```dart
// Send Offer
Future<Map<String, dynamic>> sendOffer(
  String applicationId,
  double amount,
) async {
  final response = await http.post(
    Uri.parse('$baseUrl/job-request/$applicationId/send-offer'),
    headers: await getHeaders(),
    body: json.encode({
      'amount': amount,
      'timeline': '7 days',
      'description': 'Work details',
    }),
  );
  return json.decode(response.body);
}

// Accept Offer
Future<Map<String, dynamic>> acceptOffer(String offerId) async {
  final response = await http.post(
    Uri.parse('$baseUrl/job-request/offer/$offerId/accept'),
    headers: await getHeaders(),
  );
  return json.decode(response.body);
}

// Complete Job
Future<Map<String, dynamic>> completeJob(String jobId) async {
  final response = await http.post(
    Uri.parse('$baseUrl/job/$jobId/complete'),
    headers: await getHeaders(),
  );
  return json.decode(response.body);
}
```

---

## ⚠️ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Insufficient balance" | Not enough money | Show deposit prompt |
| "Offer already exists" | One offer per job | Disable send button |
| "Job not open" | Job assigned/completed | Update UI state |
| "Not authorized" | Wrong user | Check user role |

---

## 🎨 UI Components Needed

### 1. Wallet Widget
```
┌─────────────────────┐
│ 💰 Wallet           │
│ Available: $1,000   │
│ In Escrow: $105     │
└─────────────────────┘
```

### 2. Offer Dialog
```
┌─────────────────────────┐
│ Send Offer              │
├─────────────────────────┤
│ Amount: $100            │
│ Platform Fee: $5        │
│ ─────────────────────   │
│ Total: $105             │
│                         │
│ Contractor Gets: $80    │
│ (after 20% service fee) │
│                         │
│ [Cancel] [Send Offer]   │
└─────────────────────────┘
```

### 3. Job Status Badge
```typescript
const statusColors = {
  open: 'blue',
  assigned: 'purple',
  in_progress: 'orange',
  completed: 'green',
  cancelled: 'red'
};
```

---

## 🔔 Notifications

Handle these notification types:

```typescript
{
  offer_received: 'New offer: $100',
  offer_accepted: 'Offer accepted',
  offer_rejected: 'Offer rejected - $105 refunded',
  payment_released: 'Payment received: $80',
  offer_expired: 'Offer expired - $105 refunded'
}
```

---

## ✅ Testing Checklist

- [ ] Customer can deposit money
- [ ] Customer can send offer
- [ ] Wallet shows correct balance after offer
- [ ] Contractor receives notification
- [ ] Contractor can accept offer
- [ ] Job status updates to "assigned"
- [ ] Contractor can update to "in_progress"
- [ ] Customer can mark complete
- [ ] Contractor receives payment
- [ ] Transaction history shows all events
- [ ] Contractor can withdraw
- [ ] Offer rejection refunds customer
- [ ] Job cancellation refunds customer

---

## 📚 Full Documentation

For complete details, see:
- **FRONTEND_API_DOCUMENTATION.md** - Complete API reference
- **Swagger UI**: `http://your-domain.com/swagger`
- **Scalar UI**: `http://your-domain.com/scaler`

---

## 🆘 Need Help?

1. Check error message in API response
2. Verify authentication token
3. Check wallet balance
4. Review job status
5. Contact backend team

---

**Quick Start Complete!** 🎉

Now check the full documentation for detailed examples and edge cases.
