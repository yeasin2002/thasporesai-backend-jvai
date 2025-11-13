# 📮 JobSphere Payment System - Postman Collection Guide

**Test the API with Postman**

---

## 🚀 Setup

### 1. Import Environment

Create a new environment in Postman with these variables:

```json
{
  "base_url": "http://localhost:4000/api",
  "access_token": "",
  "customer_id": "",
  "contractor_id": "",
  "job_id": "",
  "application_id": "",
  "offer_id": ""
}
```

### 2. Set Authorization

For all authenticated requests:
- Type: Bearer Token
- Token: `{{access_token}}`

---

## 📋 Collection Structure

### Folder 1: Authentication

#### 1.1 Register Customer
```
POST {{base_url}}/auth/register
Body (JSON):
{
  "email": "customer@test.com",
  "password": "Test123!",
  "full_name": "Test Customer",
  "role": "customer",
  "phone": "1234567890",
  "address": "123 Test St",
  "bio": "Test customer",
  "description": "Testing",
  "profile_img": "",
  "cover_img": ""
}

Tests:
pm.test("Status is 201", () => pm.response.to.have.status(201));
pm.environment.set("customer_id", pm.response.json().data._id);
```

#### 1.2 Register Contractor
```
POST {{base_url}}/auth/register
Body (JSON):
{
  "email": "contractor@test.com",
  "password": "Test123!",
  "full_name": "Test Contractor",
  "role": "contractor",
  "phone": "0987654321",
  "address": "456 Test Ave",
  "bio": "Test contractor",
  "description": "Testing",
  "profile_img": "",
  "cover_img": "",
  "skills": ["plumbing", "electrical"]
}

Tests:
pm.test("Status is 201", () => pm.response.to.have.status(201));
pm.environment.set("contractor_id", pm.response.json().data._id);
```

#### 1.3 Login Customer
```
POST {{base_url}}/auth/login
Body (JSON):
{
  "email": "customer@test.com",
  "password": "Test123!"
}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
const response = pm.response.json();
pm.environment.set("access_token", response.data.accessToken);
```

#### 1.4 Login Contractor
```
POST {{base_url}}/auth/login
Body (JSON):
{
  "email": "contractor@test.com",
  "password": "Test123!"
}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
const response = pm.response.json();
pm.environment.set("access_token", response.data.accessToken);
```

---

### Folder 2: Wallet Management

#### 2.1 Get Wallet
```
GET {{base_url}}/wallet
Authorization: Bearer {{access_token}}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Has balance", () => {
  const wallet = pm.response.json().data;
  pm.expect(wallet).to.have.property("balance");
  pm.expect(wallet).to.have.property("escrowBalance");
});
```

#### 2.2 Deposit Money
```
POST {{base_url}}/wallet/deposit
Authorization: Bearer {{access_token}}
Body (JSON):
{
  "amount": 200,
  "paymentMethodId": "pm_test_123"
}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Balance increased", () => {
  const wallet = pm.response.json().data.wallet;
  pm.expect(wallet.balance).to.be.above(0);
});
```

#### 2.3 Get Transactions
```
GET {{base_url}}/wallet/transactions?page=1&limit=10
Authorization: Bearer {{access_token}}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Has transactions", () => {
  const data = pm.response.json().data;
  pm.expect(data).to.have.property("transactions");
  pm.expect(data).to.have.property("pagination");
});
```

#### 2.4 Withdraw Money (Contractor Only)
```
POST {{base_url}}/wallet/withdraw
Authorization: Bearer {{access_token}}
Body (JSON):
{
  "amount": 50
}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Has new balance", () => {
  const data = pm.response.json().data;
  pm.expect(data).to.have.property("newBalance");
});
```

---

### Folder 3: Job Management

#### 3.1 Create Job (Customer)
```
POST {{base_url}}/job
Authorization: Bearer {{access_token}}
Body (JSON):
{
  "title": "Fix Kitchen Sink",
  "description": "Leaking kitchen sink needs immediate repair",
  "budget": 100,
  "category": ["{{category_id}}"],
  "location": "{{location_id}}",
  "address": "123 Main Street",
  "coverImg": "https://example.com/image.jpg"
}

Tests:
pm.test("Status is 201", () => pm.response.to.have.status(201));
const job = pm.response.json().data;
pm.environment.set("job_id", job._id);
pm.test("Job is open", () => pm.expect(job.status).to.equal("open"));
```

#### 3.2 Get Job Details
```
GET {{base_url}}/job/{{job_id}}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Has job details", () => {
  const job = pm.response.json().data;
  pm.expect(job).to.have.property("title");
  pm.expect(job).to.have.property("budget");
});
```

#### 3.3 Update Job Status
```
PATCH {{base_url}}/job/{{job_id}}/status
Authorization: Bearer {{access_token}}
Body (JSON):
{
  "status": "in_progress"
}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Status updated", () => {
  const job = pm.response.json().data;
  pm.expect(job.status).to.equal("in_progress");
});
```

#### 3.4 Complete Job (Customer)
```
POST {{base_url}}/job/{{job_id}}/complete
Authorization: Bearer {{access_token}}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Job completed", () => {
  const data = pm.response.json().data;
  pm.expect(data.job.status).to.equal("completed");
  pm.expect(data.payment).to.have.property("contractorPayout");
});
```

#### 3.5 Cancel Job
```
POST {{base_url}}/job/{{job_id}}/cancel
Authorization: Bearer {{access_token}}
Body (JSON):
{
  "reason": "No longer needed"
}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Job cancelled", () => {
  const data = pm.response.json().data;
  pm.expect(data.job.status).to.equal("cancelled");
});
```

---

### Folder 4: Job Applications

#### 4.1 Apply to Job (Contractor)
```
POST {{base_url}}/job-request/apply/{{job_id}}
Authorization: Bearer {{access_token}}
Body (JSON):
{
  "message": "I have 5 years of experience in plumbing"
}

Tests:
pm.test("Status is 201", () => pm.response.to.have.status(201));
const application = pm.response.json().data;
pm.environment.set("application_id", application._id);
```

#### 4.2 Get Job Applications (Customer)
```
GET {{base_url}}/job-request/job/{{job_id}}
Authorization: Bearer {{access_token}}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
pm.test("Has applications", () => {
  const applications = pm.response.json().data;
  pm.expect(applications).to.be.an("array");
});
```

#### 4.3 Get My Applications (Contractor)
```
GET {{base_url}}/job-request/my?page=1&limit=10
Authorization: Bearer {{access_token}}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
```

---

### Folder 5: Offer Management

#### 5.1 Send Offer (Customer)
```
POST {{base_url}}/job-request/{{application_id}}/send-offer
Authorization: Bearer {{access_token}}
Body (JSON):
{
  "amount": 100,
  "timeline": "2 days",
  "description": "Fix the leak and replace gasket as discussed"
}

Tests:
pm.test("Status is 201", () => pm.response.to.have.status(201));
const data = pm.response.json().data;
pm.environment.set("offer_id", data.offer._id);
pm.test("Correct amounts", () => {
  pm.expect(data.amounts.totalCharge).to.equal(105);
  pm.expect(data.amounts.platformFee).to.equal(5);
  pm.expect(data.amounts.serviceFee).to.equal(20);
  pm.expect(data.amounts.contractorPayout).to.equal(80);
});
```

#### 5.2 Accept Offer (Contractor)
```
POST {{base_url}}/job-request/offer/{{offer_id}}/accept
Authorization: Bearer {{access_token}}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
const data = pm.response.json().data;
pm.test("Offer accepted", () => {
  pm.expect(data.offer.status).to.equal("accepted");
  pm.expect(data.job.status).to.equal("assigned");
});
pm.test("Correct payment breakdown", () => {
  pm.expect(data.payment.platformFee).to.equal(5);
  pm.expect(data.payment.serviceFee).to.equal(20);
  pm.expect(data.payment.contractorPayout).to.equal(80);
});
```

#### 5.3 Reject Offer (Contractor)
```
POST {{base_url}}/job-request/offer/{{offer_id}}/reject
Authorization: Bearer {{access_token}}
Body (JSON):
{
  "reason": "Timeline is too short for quality work"
}

Tests:
pm.test("Status is 200", () => pm.response.to.have.status(200));
const data = pm.response.json().data;
pm.test("Offer rejected", () => {
  pm.expect(data.offer.status).to.equal("rejected");
  pm.expect(data.refundAmount).to.equal(105);
});
```

---

## 🔄 Complete Test Flow

### Pre-Request Script (Collection Level)
```javascript
// Set base URL if not set
if (!pm.environment.get("base_url")) {
  pm.environment.set("base_url", "http://localhost:4000/api");
}
```

### Test Script (Collection Level)
```javascript
// Log response for debugging
console.log(pm.response.json());

// Check response time
pm.test("Response time < 2s", () => {
  pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path
```
1. Register Customer → Save customer_id
2. Register Contractor → Save contractor_id
3. Login Customer → Save access_token
4. Deposit $200
5. Create Job → Save job_id
6. Login Contractor → Save access_token
7. Apply to Job → Save application_id
8. Login Customer → Save access_token
9. Send Offer → Save offer_id
10. Login Contractor → Save access_token
11. Accept Offer
12. Update Job Status to "in_progress"
13. Login Customer → Save access_token
14. Complete Job
15. Login Contractor → Save access_token
16. Verify Wallet Balance ($80)
17. Withdraw $50
```

### Scenario 2: Offer Rejection
```
1-9. Same as Happy Path
10. Login Contractor
11. Reject Offer (with reason)
12. Login Customer
13. Verify Wallet Refunded ($200)
```

### Scenario 3: Job Cancellation
```
1-11. Same as Happy Path
12. Login Customer
13. Cancel Job (with reason)
14. Verify Wallet Refunded
```

---

## 📊 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| base_url | API base URL | http://localhost:4000/api |
| access_token | JWT token | eyJhbGciOiJIUzI1NiIs... |
| customer_id | Customer user ID | 507f1f77bcf86cd799439011 |
| contractor_id | Contractor user ID | 507f191e810c19729de860ea |
| job_id | Job ID | 507f1f77bcf86cd799439012 |
| application_id | Application ID | 507f1f77bcf86cd799439013 |
| offer_id | Offer ID | 507f1f77bcf86cd799439014 |
| category_id | Category ID | Get from /api/category |
| location_id | Location ID | Get from /api/location |

---

## 🎯 Quick Test Commands

### Test All Endpoints
```bash
newman run JobSphere_Payment.postman_collection.json \
  -e JobSphere_Dev.postman_environment.json \
  --reporters cli,html
```

### Test Specific Folder
```bash
newman run JobSphere_Payment.postman_collection.json \
  -e JobSphere_Dev.postman_environment.json \
  --folder "Offer Management"
```

---

## 📝 Notes

- Always login before testing authenticated endpoints
- Save IDs from responses to environment variables
- Check wallet balance after each transaction
- Verify transaction history for audit trail
- Test error cases (insufficient balance, invalid status, etc.)

---

**Happy Testing!** 🎉

For more details, see **FRONTEND_API_DOCUMENTATION.md**
