# Cancel Offer Feature - Implementation Summary

**Date**: November 25, 2025  
**Status**: ✅ **COMPLETED**  
**Feature**: Customer-Initiated Offer Cancellation

---

## Overview

Implemented a new feature allowing customers (buyers) to cancel pending offers if contractors haven't responded yet. This provides customers with more control over their offers and ensures they can get their money back if a contractor is unresponsive.

---

## Business Requirements

### What Problem Does This Solve?

**Scenario**:

- Customer sends an offer to a contractor
- Contractor doesn't respond (not accepting or rejecting)
- Customer's money is locked in escrow
- Customer wants to cancel and try another contractor

**Solution**:

- Customer can cancel the pending offer
- Full refund returned to customer wallet
- Application/Invite status reset
- Customer can send a new offer to a different contractor

---

## Business Rules

### Who Can Cancel?

✅ **Only the customer** who sent the offer can cancel it  
❌ Contractors cannot cancel offers (they can only accept/reject)  
❌ Admin cannot cancel offers (they can cancel jobs)

### When Can It Be Cancelled?

✅ **Only pending offers** can be cancelled  
❌ Cannot cancel accepted offers (job already assigned)  
❌ Cannot cancel rejected offers (already processed)  
❌ Cannot cancel completed offers (job finished)  
❌ Cannot cancel expired offers (already refunded)

### What Happens on Cancellation?

1. ✅ Full refund to customer wallet (totalCharge amount)
2. ✅ Money moved from escrow to available balance
3. ✅ Offer status changed to "cancelled"
4. ✅ Application/Invite status reset (allows new offers)
5. ✅ Refund transaction record created
6. ✅ Contractor receives cancellation notification

---

## Money Flow

### Before Cancellation

```
Customer Wallet:
  - Available Balance: $95
  - Escrow Balance: $105

Offer Status: "pending"
Application Status: "offer_sent"
```

### After Cancellation

```
Customer Wallet:
  - Available Balance: $200 (refunded)
  - Escrow Balance: $0

Offer Status: "cancelled"
Application Status: "pending" (reset)

Transaction Created:
  - Type: "refund"
  - Amount: $105
  - Description: "Offer cancelled by customer"
```

---

## API Endpoint

### POST /api/offer/:offerId/cancel

**Authentication**: Required (JWT Bearer token)  
**Authorization**: Customer role only  
**Rate Limit**: Standard

**Request**:

```typescript
POST /api/offer/673d5f8e9a1b2c3d4e5f6789/cancel
Headers: {
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
Body: {
  "reason": "Contractor not responding, trying another contractor" // Optional
}
```

**Success Response (200)**:

```json
{
  "status": 200,
  "message": "Offer cancelled successfully",
  "data": {
    "offer": {
      "_id": "673d5f8e9a1b2c3d4e5f6789",
      "status": "cancelled",
      "cancelledAt": "2025-11-25T10:30:00.000Z",
      "cancellationReason": "Contractor not responding, trying another contractor"
    },
    "refund": {
      "amount": 105,
      "description": "Full refund issued to your wallet"
    },
    "wallet": {
      "balance": 200,
      "escrowBalance": 0
    },
    "message": "Your offer has been cancelled and the full amount has been refunded to your wallet. You can send a new offer if needed."
  }
}
```

**Error Responses**:

**400 - Not Pending**:

```json
{
  "status": 400,
  "message": "Cannot cancel offer with status: accepted. Only pending offers can be cancelled.",
  "data": null
}
```

**403 - Not Owner**:

```json
{
  "status": 403,
  "message": "Only the customer who sent the offer can cancel it",
  "data": null
}
```

**404 - Not Found**:

```json
{
  "status": 404,
  "message": "Offer not found",
  "data": null
}
```

---

## Implementation Details

### Files Created/Modified

**Created**:

1. `src/api/offer/services/cancel-offer.service.ts` - Main service handler

**Modified**:

1. `src/api/offer/offer.route.ts` - Added cancel endpoint
2. `src/api/offer/offer.validation.ts` - Added CancelOfferSchema
3. `src/api/offer/offer.openapi.ts` - Added OpenAPI documentation
4. `src/api/offer/services/index.ts` - Exported cancel service

### Key Service Logic

```typescript
// 1. Validate offer exists and is pending
if (offer.status !== "pending") {
  return sendBadRequest(res, "Only pending offers can be cancelled");
}

// 2. Validate user is the customer
if (offer.customer._id.toString() !== userId) {
  return sendForbidden(res, "Only the customer can cancel this offer");
}

// 3. Process refund (atomic transaction)
customerWallet.balance += offer.totalCharge;
customerWallet.escrowBalance -= offer.totalCharge;

// 4. Update offer status
offer.status = "cancelled";
offer.cancelledAt = new Date();
offer.cancellationReason = reason || "Cancelled by customer";

// 5. Reset application/invite status
if (offer.application) {
  await db.jobApplicationRequest.findByIdAndUpdate(offer.application, {
    status: "pending",
  });
} else if (offer.invite) {
  await db.jobInvite.findByIdAndUpdate(offer.invite, { status: "accepted" });
}

// 6. Create refund transaction
await db.transaction.create({
  type: "refund",
  amount: offer.totalCharge,
  description: "Offer cancelled by customer - Full refund",
});

// 7. Notify contractor
await sendNotification({
  userId: offer.contractor._id,
  title: "Offer Cancelled",
  body: "The customer has cancelled their offer",
});
```

---

## Database Changes

### Offer Model

No schema changes required. Uses existing fields:

- `status`: "cancelled" (already supported)
- `cancelledAt`: Date (already exists)
- `cancellationReason`: String (already exists)

### Transaction Model

Uses existing "refund" transaction type.

---

## Security Considerations

### Authorization

✅ Only authenticated users can access  
✅ Only customers can cancel offers  
✅ Only offer owner can cancel their own offer  
✅ Role-based access control enforced

### Validation

✅ Offer ID validated (must be valid MongoDB ObjectId)  
✅ Offer status validated (must be "pending")  
✅ Wallet balance validated (sufficient escrow)  
✅ Cancellation reason validated (optional, max 500 chars)

### Transaction Safety

✅ MongoDB transactions used (atomic operations)  
✅ Rollback on any failure  
✅ Race condition prevention  
✅ Escrow balance verification

---

## Testing Checklist

### Unit Tests

- [ ] Validate offer exists
- [ ] Validate offer is pending
- [ ] Validate user is customer
- [ ] Validate wallet has sufficient escrow
- [ ] Verify refund calculation
- [ ] Verify application/invite reset
- [ ] Verify transaction creation
- [ ] Verify notification sent

### Integration Tests

- [ ] Complete flow: send offer → cancel → verify refund
- [ ] Cannot cancel accepted offer
- [ ] Cannot cancel rejected offer
- [ ] Cannot cancel expired offer
- [ ] Cannot cancel someone else's offer
- [ ] Contractor cannot cancel offer
- [ ] Wallet balances correct after cancellation
- [ ] Application status reset correctly
- [ ] Invite status reset correctly

### Edge Cases

- [ ] Cancel with insufficient escrow (should fail)
- [ ] Cancel non-existent offer (404)
- [ ] Cancel with invalid offer ID (400)
- [ ] Concurrent cancellation attempts (race condition)
- [ ] Cancel after contractor just accepted (should fail)

---

## User Flow Examples

### Example 1: Application-Based Offer

```
1. Contractor applies to job
   └─> POST /api/job-request/apply/:jobId

2. Customer sends offer
   └─> POST /api/offer/application/:applicationId/send
   └─> Customer wallet: $200 → $95 available, $105 escrow
   └─> Application status: "offer_sent"

3. Contractor doesn't respond (waiting...)

4. Customer cancels offer
   └─> POST /api/offer/:offerId/cancel
   └─> Customer wallet: $95 → $200 available, $0 escrow
   └─> Application status: "pending" (reset)

5. Customer can send new offer to different contractor
   └─> POST /api/offer/application/:anotherApplicationId/send
```

### Example 2: Invite-Based Offer

```
1. Customer invites contractor
   └─> POST /api/job-invite/send/:jobId

2. Contractor accepts invite
   └─> PATCH /api/job-invite/:inviteId/accept

3. Customer sends offer
   └─> POST /api/offer/invite/:inviteId/send
   └─> Customer wallet: $200 → $95 available, $105 escrow
   └─> Invite status: "offer_sent"

4. Contractor doesn't respond (waiting...)

5. Customer cancels offer
   └─> POST /api/offer/:offerId/cancel
   └─> Customer wallet: $95 → $200 available, $0 escrow
   └─> Invite status: "accepted" (reset)

6. Customer can send new offer to same or different contractor
```

---

## Comparison with Similar Features

### Cancel Offer vs Reject Offer

| Feature          | Cancel Offer             | Reject Offer             |
| ---------------- | ------------------------ | ------------------------ |
| **Who**          | Customer                 | Contractor               |
| **When**         | Pending offers           | Pending offers           |
| **Refund**       | Full refund              | Full refund              |
| **Status Reset** | Application/Invite reset | Application/Invite reset |
| **Use Case**     | Customer changes mind    | Contractor declines work |

### Cancel Offer vs Cancel Job

| Feature        | Cancel Offer   | Cancel Job                    |
| -------------- | -------------- | ----------------------------- |
| **Who**        | Customer only  | Customer or Admin             |
| **When**       | Pending offers | Any status (except completed) |
| **Scope**      | Single offer   | Entire job + offer            |
| **Refund**     | Full refund    | Conditional refund            |
| **Job Status** | Unchanged      | Changes to "cancelled"        |

---

## Frontend Integration Guide

### React/Next.js Example

```typescript
// Service function
export const cancelOffer = async (offerId: string, reason?: string) => {
  const response = await fetch(`/api/offer/${offerId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Component usage
const OfferCard = ({ offer }) => {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this offer?")) return;

    setCancelling(true);
    try {
      const result = await cancelOffer(offer._id, "Contractor not responding");
      toast.success("Offer cancelled successfully");
      // Refresh wallet balance
      refreshWallet();
      // Refresh offers list
      refreshOffers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      {offer.status === "pending" && (
        <button onClick={handleCancel} disabled={cancelling}>
          {cancelling ? "Cancelling..." : "Cancel Offer"}
        </button>
      )}
    </div>
  );
};
```

### Flutter Example

```dart
// Service function
Future<Map<String, dynamic>> cancelOffer(String offerId, {String? reason}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/offer/$offerId/cancel'),
    headers: {
      'Authorization': 'Bearer ${await getAccessToken()}',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({'reason': reason}),
  );

  if (response.statusCode != 200) {
    final error = jsonDecode(response.body);
    throw Exception(error['message']);
  }

  return jsonDecode(response.body);
}

// Widget usage
class OfferCard extends StatefulWidget {
  final Offer offer;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          if (offer.status == 'pending')
            ElevatedButton(
              onPressed: () => _handleCancel(context),
              child: Text('Cancel Offer'),
            ),
        ],
      ),
    );
  }

  Future<void> _handleCancel(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Cancel Offer'),
        content: Text('Are you sure you want to cancel this offer?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text('Yes'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await cancelOffer(offer.id, reason: 'Contractor not responding');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Offer cancelled successfully')),
      );
      // Refresh data
      Provider.of<WalletProvider>(context, listen: false).refresh();
      Provider.of<OffersProvider>(context, listen: false).refresh();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
}
```

---

## Monitoring & Analytics

### Metrics to Track

- Number of offers cancelled per day
- Average time between offer sent and cancellation
- Cancellation reasons (if provided)
- Refund success rate
- Contractor response time (to reduce cancellations)

### Alerts

- High cancellation rate (> 30% of offers)
- Failed refund transactions
- Escrow balance mismatches
- Concurrent cancellation attempts

---

## Future Enhancements

### Potential Improvements

1. **Auto-cancel after timeout**: Cancel offers automatically after 48 hours if no response
2. **Partial cancellation fee**: Charge small fee (e.g., 1%) for cancellations to discourage abuse
3. **Cancellation limit**: Limit number of cancellations per customer per day
4. **Contractor penalty**: Track contractors with high offer rejection/timeout rates
5. **Bulk cancellation**: Allow cancelling multiple pending offers at once

---

## Documentation Updates

### Updated Documents

1. ✅ `doc/payment/CANCEL_OFFER_FEATURE.md` - This document
2. ✅ OpenAPI/Swagger documentation - Auto-generated
3. ⏳ `doc/payment/MONEY/1.jobsphere-payment-readme.md` - Needs update
4. ⏳ Frontend API documentation - Needs update

### Recommended Updates

- Add "Cancel Offer" to payment flow diagrams
- Update API endpoint list in main documentation
- Add to frontend integration examples
- Update Postman collection

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Cannot cancel offer with status: accepted"  
**Solution**: Offer has already been accepted by contractor. Cannot cancel accepted offers.

**Issue**: "Only the customer who sent the offer can cancel it"  
**Solution**: User is not the customer who sent the offer. Only offer owner can cancel.

**Issue**: "Insufficient escrow balance"  
**Solution**: Database inconsistency. Contact support immediately.

**Issue**: "Offer not found"  
**Solution**: Invalid offer ID or offer has been deleted.

---

## Conclusion

The Cancel Offer feature provides customers with more control over their offers and ensures they can recover their funds if contractors are unresponsive. The implementation follows all existing patterns in the codebase and maintains consistency with the payment system architecture.

**Status**: ✅ Ready for testing and deployment

---

**Document Version**: 1.0.0  
**Last Updated**: November 25, 2025  
**Author**: Backend Team  
**Reviewed By**: Payment System Team
