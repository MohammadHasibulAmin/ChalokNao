# Admin Module Setup Guide

## Overview
The enhanced admin module provides comprehensive management of the ChalokNao platform including:
- Driver Verification & Documentation Management
- User Account Suspension/Resumption
- Report Monitoring & Resolution
- Commission & Transaction Tracking with Stripe Integration

---

## Backend Setup

### 1. Install Stripe Package
```bash
cd backend
npm install
# Stripe is now included in package.json
```

### 2. Environment Variables (.env)
Add these to your `backend/.env`:

```env
MONGO_URI=mongodb+srv://fabiha_db_user:tmbmAh2203@chaloknao.izs6lcj.mongodb.net/?appName=ChalokNao
JWT_SECRET=mySecretKey
DB_NAME=ChalokNao
PORT=5000
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY
```

### 3. Get Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up for a free account
3. Navigate to **Developers > API Keys**
4. Copy your Secret Key (starts with `sk_test_` or `sk_live_`)
5. Copy your Publishable Key (starts with `pk_test_` or `pk_live_`)
6. Paste them in `.env`

### 4. New Database Collections
The system automatically creates these collections:
- `reports` - User reports and complaints
- `transactions` - Commission and payment records

---

## Admin API Endpoints

### Dashboard Stats
```
GET /api/admin/dashboard/stats
Returns: {
  totalDrivers, verifiedDrivers, pendingVerifications,
  suspendedUsers, totalRevenue, completedTransactions, openReports
}
```

### Driver Verification
```
GET /api/admin/drivers
PUT /api/admin/verify-doc/:driverId
  Body: { status: "approved" | "rejected" }
```

### User Management
```
PUT /api/admin/suspend-user/:userId
PUT /api/admin/resume-user/:userId
GET /api/admin/users/suspended
```

### Reports
```
GET /api/admin/reports?status=open|resolved
POST /api/admin/reports
  Body: { reportedById, reportedUserId, reason, description, type }
PUT /api/admin/reports/:reportId
  Body: { resolution: "action taken" }
```

### Transactions & Commission
```
GET /api/admin/transactions?status=completed|pending_payment&ownerId=xyz
POST /api/admin/process-hire
  Body: { hireId, ownerId, salary, stripeCustomerId }
PUT /api/admin/transactions/:transactionId
  Body: { stripePaymentIntentId }
```

---

## Commission Structure

### Calculation
- **Commission Rate**: 15% of hire salary
- **Owner Gets**: 85% of hire salary
- **Platform Gets**: 15% commission

### Example
- Hire Salary: ৳10,000
- Commission: ৳1,500 (15%)
- Owner Payment: ৳8,500 (85%)

### Auto-Trigger
Commission transaction is automatically created when both owner and driver confirm a hire.

---

## Frontend Features

### Dashboard Tab
Shows real-time statistics:
- Total drivers & verified count
- Pending verifications
- Suspended users
- Total revenue & transaction count
- Open reports needing action

### Verification Tab
- View pending driver verifications
- Review uploaded documents (license, NID)
- Approve or reject driver profiles
- Notifications sent to drivers automatically

### Suspension Tab
- View all drivers with status
- Suspend/resume accounts with one click
- See list of all suspended users
- Track suspension timestamps

### Reports Tab
- Monitor user reports (harassment, fraud, misconduct)
- Filter by status (open/resolved)
- Create new reports for investigation
- Resolve reports with documented resolution notes

### Transactions Tab
- View all transactions with status
- See commission breakdown per transaction
- Track owner payments
- Monitor Stripe payment status

---

## Testing with Stripe

### Test Cards
Use these cards in Stripe test mode:

**Successful Payment:**
- Card: 4242 4242 4242 4242
- Expiry: 12/25
- CVC: 123

**Failed Payment:**
- Card: 4000 0000 0000 0002
- Expiry: 12/25
- CVC: 123

### Test Mode
Your Stripe account starts in **Test Mode** by default. All transactions are simulated.

---

## Key Features

### 1. Automatic Commission Calculation
When a hire is confirmed by both parties:
1. Commission is calculated (15%)
2. Transaction record is created
3. Admin can track in dashboard

### 2. Account Suspension
Admins can suspend accounts for:
- Verification rejection
- Policy violations
- Fraudulent activity
- User reports

Suspended accounts cannot log in or perform actions.

### 3. Report System
Users can report other users for:
- Harassment
- Fraud
- Inappropriate behavior
- Misconduct
- Other violations

Admins review and document resolutions.

### 4. Transaction Tracking
Complete audit trail:
- Hire ID & parties involved
- Transaction amounts
- Commission breakdown
- Stripe payment status
- Completion timestamps

---

## Admin UI Navigation

The admin panel has 5 main tabs:

1. **Dashboard**: Overview statistics & metrics
2. **Verification**: Driver document approval/rejection
3. **Suspension**: Account management & suspension
4. **Reports**: User report investigation
5. **Transactions**: Commission & payment tracking

---

## Security Notes

1. **Admin-Only Routes**: All `/api/admin/*` routes should be protected with admin middleware
2. **Stripe Keys**: Never expose SECRET keys in frontend
3. **Sensitive Data**: Transaction details are server-side only
4. **Audit Logging**: Consider logging all admin actions for compliance

---

## Troubleshooting

### Stripe Not Working
- Verify `STRIPE_SECRET_KEY` in `.env`
- Check Stripe account is active
- Use test keys for development
- Check browser console for errors

### Commission Not Creating
- Ensure hire status = "Confirmed"
- Check MongoDB transaction collection
- Verify salary amount is valid

### Reports Not Showing
- Check `/api/admin/reports` returns data
- Verify reports were created with POST
- Check admin has access to API

---

## Next Steps

1. Install Stripe with `npm install`
2. Add Stripe keys to `.env`
3. Deploy backend changes
4. Test admin panel features
5. Configure Stripe webhooks for production
6. Train admins on the interface

---

## Support

For issues or questions about the admin module, check:
- Backend: `/controllers/admin/verificationController.js`
- Frontend: `/src/pages/AdminVerification.js`
- Routes: `/routes/admin/verificationRoutes.js`
