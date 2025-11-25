# JobSphere Money Flow - Simple Explanation

**Last Updated**: November 23, 2025  
**Status**: Current Implementation

---

## 🎯 Quick Answer to Your Questions

### 1. How Does Money Work in JobSphere?

**YES - Users Recharge Their Wallet First (Prepaid System)**

Think of it like a mobile phone plan:

- Users add money to their wallet ONCE
- They can use that balance for MULTIPLE transactions
- No need to pay separately for each job

### 2. Where Does the Money Go?

Money moves through **3 stages**:

1. **Customer's Wallet** → Money added by customer
2. **Escrow (Holding Area)** → Money locked when offer sent
3. **Final Destination** → Split between Admin and Contractor when job completes

---

## 💰 The Complete Money Journey

### Stage 1: Customer Adds Money to Wallet

**What Happens:**

- Customer deposits money (minimum $10)
- Money goes into their "Available Balance"
- They can use this for any job

**Example:**

```
Customer deposits: $500
Wallet Balance: $500 (available to use)
Escrow Balance: $0 (nothing locked yet)
```

**Important Notes:**

- Currently: Money is added directly (TODO: Stripe integration)
- Future: Will use Stripe for actual credit card payments
- Minimum deposit: $10
- No maximum limit

---

### Stage 2: Customer Sends Job Offer

**What Happens:**

- Customer selects a contractor
- Sends offer with job amount (e.g., $100)
- System calculates total cost: $105 (job + 5% platform fee)
- Money moves from "Available" to "Escrow" (locked)

**Money Movement:**
00 - $105)
└─ Escrow Balance: $105 (locked until decision)

```

**Why Escrow?**
- Protects both parties
- Money is safe but not yet transferred
- Can be refunded if contractor rejects
- Prevents customer from spending same money twice

**Cost Breakdown for $100 Job:**
```

Job Amount: $100
Platform Fee (5%): $5
─────────────────────
Total Charged: $105

```

---

### Stage 3A: Contractor Accepts Offer ✅

**What Happens:**
- Contractor reviews and accepts
- Platform fee ($5) goes to Admin immediately
- Remaining money ($100) stays in escrow
- Job status changes to "assigned"

**Money Movement:**
```

Customer Escrow: $105
├─ Platform Fee: $5 → Admin Wallet (immediately)
└─ Remaining: $100 → Stays in Escrow (until job done)

Admin Wallet: +$5
Customer Escrow: $100 (still locked)

```

**Why Split Payment?**
- Platform fee = Payment for using JobSphere
- Remaining money = Held until work is completed
- Protects customer from bad work
- Ensures contractor gets paid after completion

---

### Stage 3B: Contractor Rejects Offer ❌

**What Happens:**
- Contractor declines the offer
- Full amount ($105) refunded to customer
- Money returns to "Available Balance"
- Customer can send new offer

**Money Movement:**
```

Customer Escrow: $105 → $0
Customer Available: $395 → $500 (full refund)

Result: Customer gets all money back

```

---

### Stage 4: Job Completion 🎉

**What Happens:**
- Contractor completes work
- Customer marks job as complete
- Service fee (20%) goes to Admin
- Contractor gets their payout (80%)

**Final Money Split for $100 Job:**
```

Escrow Balance: $100

Split:
├─ Service Fee (20%): $20 → Admin Wallet
└─ Contractor Payout (80%): $80 → Contractor Wallet

Final Results:
├─ Admin Total: $25 ($5 platform + $20 service)
├─ Contractor Gets: $80
└─ Customer Paid: $105 total

```

---

### Stage 5: Contractor Withdraws Money 💸

**What Happens:**
- Contractor has money in wallet
- Requests withdrawal (minimum $10, maximum $10,000)
- Money transferred to their bank account
- Takes 2-3 business days

**Example:**
```

Contractor Wallet: $80
Requests Withdrawal: $50

After Withdrawal:
├─ Wallet Balance: $30
└─ Bank Transfer: $50 (pending 2-3 days)

```

**Important:**
- Only contractors can withdraw
- Customers cannot withdraw (they use balance for jobs)
- Minimum: $10
- Maximum: $10,000 per transaction

---

## 📊 Complete Example: $100 Job from Start to Finish

### Step 1: Customer Deposits Money
```

Action: Customer deposits $200
Result: Wallet Balance = $200

```

### Step 2: Customer Posts Job
```

Action: Posts job with $100 budget
Result: Job visible to contractors

```

### Step 3: Contractor Applies
```

Action: Contractor submits application
Result: Customer sees application

```

### Step 4: Customer Sends Offer
```

Action: Sends $100 offer
Calculation:

- Job Amount: $100
- Platform Fee (5%): $5
- Total Charge: $105

Money Movement:

- Available: $200 → $95
- Escrow: $0 → $105

```

### Step 5: Contractor Accepts
```

Action: Accepts offer
Money Movement:

- Escrow: $105 → $100
- Admin Wallet: +$5 (platform fee)

Job Status: "assigned"

```

### Step 6: Work Completed
```

Action: Customer marks complete
Money Movement:

- Escrow: $100 → $0
- Admin Wallet: +$20 (service fee)
- Contractor Wallet: +$80 (payout)

Final Balances:

- Customer: $95 available
- Admin: $25 earned
- Contractor: $80 earned

```

### Step 7: Contractor Withdraws
```

Action: Withdraws $80
Result: $80 sent to bank (2-3 days)

```

---

## 🔄 Alternative Scenarios

### Scenario A: Offer Rejected

```

Steps 1-4: Same as above
Customer Escrow: $105

Step 5: Contractor Rejects
Money Movement:

- Escrow: $105 → $0
- Available: $95 → $200 (full refund)

Result: Customer gets all money back

```

### Scenario B: Job Cancelled

```

Steps 1-5: Same as main example
Customer Escrow: $100
Admin Already Got: $5

Step 6: Customer Cancels Job
Money Movement:

- Escrow: $100 → $0
- Available: $95 → $195 (refund $100)

Result:

- Customer gets $100 back (not the $5 platform fee)
- Admin keeps $5 platform fee

```

### Scenario C: Offer Expires (7 Days)

```

Steps 1-4: Same as above
Customer Escrow: $105

After 7 Days: Offer expires automatically
Money Movement:

- Escrow: $105 → $0
- Available: $95 → $200 (full refund)

Result: Customer gets all money back

```

---

## 💡 Key Concepts Explained

### What is "Escrow"?

**Simple Explanation:**
- Escrow = A safe holding area for money
- Money is locked but not transferred yet
- Protects both customer and contractor
- Released only when conditions are met

**Think of it like:**
- Putting money in a locked box
- Both parties can see it
- Only opens when job is done (or cancelled)

### What is "Available Balance"?

**Simple Explanation:**
- Money you can use right now
- Not locked in any transaction
- Can send offers with this money
- Can be withdrawn (contractors only)

### What is "Escrow Balance"?

**Simple Explanation:**
- Money locked in pending offers
- Cannot be used for other jobs
- Will be released when offer is decided
- Either goes to contractor or refunded

### Why Two Types of Fees?

**Platform Fee (5%)**
- Charged when offer is sent
- Goes to Admin when offer accepted
- Pays for using JobSphere platform
- Non-refundable after acceptance

**Service Fee (20%)**
- Charged when job completes
- Deducted from contractor's payout
- Pays for transaction processing
- Ensures quality and support

---

## 🎨 Visual Money Flow

```

┌─────────────────────────────────────────────────────────────┐
│ CUSTOMER DEPOSITS $200 │
└─────────────────────┬───────────────────────────────────────┘
│
▼
┌──────────────────┐
│ Customer Wallet │
│ Balance: $200 │
└────────┬─────────┘
│
│ Sends $100 Offer
│ (Charged $105)
▼
┌──────────────────┐
│ Customer Wallet │
│ Available: $95 │
│ Escrow: $105 │
└────────┬─────────┘
│
┌────────────┴────────────┐
│ │
▼ ▼
ACCEPT REJECT
│ │
▼ ▼
┌───────────────┐ ┌──────────────┐
│ Platform Fee │ │ Full Refund │
│ $5 → Admin │ │ $105 → Back │
│ │ │ │
│ Escrow: $100 │ │ Available: │
│ (Still Locked)│ │ $200 │
└───────┬───────┘ └──────────────┘
│
│ Job Completed
▼
┌───────────────────────┐
│ Final Split │
├───────────────────────┤
│ Service Fee: $20 │
│ → Admin Wallet │
│ │
│ Contractor: $80 │
│ → Contractor Wallet │
└───────────────────────┘
│
▼
┌───────────────────────┐
│ Contractor Withdraws │
│ $80 → Bank Account │
│ (2-3 business days) │
└───────────────────────┘

```

---

## 📋 Transaction Types in Database

The system tracks every money movement:

| Type | When | From | To | Description |
|------|------|------|-----|-------------|
| `deposit` | Customer adds money | Customer | Customer | Wallet top-up |
| `escrow_hold` | Offer sent | Available | Escrow | Lock money for offer |
| `platform_fee` | Offer accepted | Escrow | Admin | 5% platform fee |
| `service_fee` | Job completed | Escrow | Admin | 20% service fee |
| `contractor_payout` | Job completed | Escrow | Contractor | 80% payment |
| `refund` | Offer rejected/cancelled | Escrow | Available | Money returned |
| `withdrawal` | Contractor withdraws | Wallet | Bank | Cash out |

---

## ⚠️ Important Rules

### For Customers:
1. ✅ Must have money in wallet before sending offers
2. ✅ Money is locked in escrow when offer sent
3. ✅ Get full refund if contractor rejects
4. ✅ Platform fee ($5) non-refundable after acceptance
5. ❌ Cannot withdraw money (use it for jobs only)

### For Contractors:
1. ✅ Can accept or reject offers
2. ✅ Get 80% of job amount when complete
3. ✅ Can withdraw anytime (min $10, max $10,000)
4. ✅ Money arrives in 2-3 business days
5. ❌ Cannot send offers (only customers can)

### For Admin:
1. ✅ Gets 5% when offer accepted
2. ✅ Gets 20% when job completed
3. ✅ Total commission: 25% per job
4. ✅ Money auto-transferred (no manual work)

---

## 🔮 Future Enhancements (TODO)

### Currently Missing:
- ❌ Stripe integration for deposits (currently manual)
- ❌ Stripe Connect for withdrawals (currently manual)
- ❌ Webhook handling for payment confirmations
- ❌ Dispute resolution system
- ❌ Partial refunds

### Coming Soon:
- ✅ Real credit card payments via Stripe
- ✅ Automatic bank transfers for withdrawals
- ✅ Payment failure handling
- ✅ Chargeback protection
- ✅ Multi-currency support

---

## 🆚 Comparison: Current vs Future

### Current System (Wallet-Based)
```

Customer → Deposits to Wallet → Uses Balance → Sends Offers
↓
(Manual/Direct)

```

**Pros:**
- Simple to understand
- Fast transactions
- No payment gateway fees per transaction
- Users can budget better

**Cons:**
- Requires upfront deposit
- Money locked in platform
- No instant credit card payments

### Future System (Hybrid)
```

Customer → Option 1: Deposit to Wallet (prepaid)
→ Option 2: Pay per job (Stripe)

```

**Benefits:**
- Flexibility for users
- Both prepaid and pay-per-use
- Better for one-time users
- Stripe handles security

---

## 📞 Common Questions

### Q: Why do I need to deposit money first?
**A:** It's a prepaid system like a mobile phone. You add credit once and use it for multiple jobs. This makes transactions faster and cheaper.

### Q: What if I don't have enough balance?
**A:** You'll see an error: "Insufficient balance. Required: $105, Available: $50". Just deposit more money first.

### Q: Can I get my money back?
**A:**
- ✅ YES if contractor rejects offer (full refund)
- ✅ YES if you cancel before acceptance (full refund)
- ❌ NO platform fee ($5) after contractor accepts
- ✅ YES remaining money if you cancel after acceptance

### Q: How long does withdrawal take?
**A:** 2-3 business days for money to reach your bank account.

### Q: Is my money safe in escrow?
**A:** YES! Escrow money is locked and cannot be used by anyone until the job is completed or cancelled. It's like a safe deposit box.

### Q: What happens if contractor doesn't complete work?
**A:** You can cancel the job and get a refund of the escrow amount (minus the platform fee already paid).

---

## 🎯 Summary

**JobSphere uses a PREPAID WALLET SYSTEM:**

1. **Customers deposit money once** → Use for multiple jobs
2. **Money moves to escrow** → When offer sent (locked safely)
3. **Platform fee taken** → When contractor accepts (5%)
4. **Service fee taken** → When job completes (20%)
5. **Contractor gets paid** → 80% of job amount
6. **Contractor withdraws** → Money to bank account

**Key Benefit:** Fast, secure, and transparent money flow with complete audit trail.

---

**Document Status**: ✅ Reflects Current Implementation
**Last Verified**: November 23, 2025
**Code Location**: `src/api/wallet/`, `src/api/offer/`

```

Before Offer:
├─ Available Balance: $500
└─ Escrow Balance: $0

After Sending $100 Offer:
├─ Available Balance: $395 ($5

```

```
