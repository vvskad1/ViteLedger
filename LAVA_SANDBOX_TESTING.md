# 🧪 Lava Sandbox Testing Guide

## Overview
VitaLedger now supports **Lava Sandbox Mode** for risk-free payment testing. All transactions are simulated—no real charges occur.

---

## 🔧 Setup

### 1. Backend Configuration

Edit `backend/.env`:

```env
SUBS_MODE=LAVA_SANDBOX
LAVA_API_KEY_TEST=sk_test_your_sandbox_key_here
LAVA_BASE_URL_SANDBOX=https://sandbox.api.lava.ai
LAVA_WEBHOOK_SECRET_TEST=whsec_test_your_webhook_secret_here
```

### 2. Frontend Configuration

Edit `frontend/.env`:

```env
REACT_APP_SUBS_MODE=LAVA_SANDBOX
```

### 3. Restart Services

```bash
# Backend
cd backend
uvicorn main:app --reload

# Frontend (in another terminal)
cd frontend
npm start
```

You should see: `🧪 Lava Sandbox mode active — all payments simulated via https://sandbox.api.lava.ai`

---

## 💳 Test Cards

Use these Stripe test cards (provided by Lava):

### Successful Payment
```
Card: 4242 4242 4242 4242
Exp: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: 00000
```

### Declined Payment
```
Card: 4000 0000 0000 0002
Exp: Any future date
CVC: Any 3 digits
```

### Requires Authentication (3D Secure)
```
Card: 4000 0025 0000 3155
Exp: Any future date
CVC: Any 3 digits
```

---

## 🧪 Testing Workflow

### Test 1: Subscribe to a Plan

1. Navigate to **Billing** page
2. You'll see the **sandbox banner** at the top
3. Select a plan (Basic/Plus/Pro)
4. Click **Subscribe**
5. Enter test card: `4242 4242 4242 4242`
6. Complete checkout
7. Verify:
   - User redirected to `/billing?success=true`
   - Subscription status shows `active` in UI
   - Database shows `status='active'`

### Test 2: Free Trial

1. Create a new user account
2. Check Billing page
3. Verify:
   - User has 3-day trial automatically activated
   - Status shows "FREE TRIAL"
   - Trial countdown displayed

### Test 3: Webhook Simulation

Manually trigger a webhook to test activation:

```bash
curl -X POST http://localhost:8000/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "subscription.active",
    "data": {
      "user_reference": "1",
      "subscription_id": "sub_test_123",
      "plan": "plus",
      "period": "monthly"
    }
  }'
```

Verify subscription activated in database.

### Test 4: Cancel Subscription

1. Go to Billing page (must have active subscription)
2. Click **Cancel Renewal**
3. Confirm cancellation
4. Verify status changes to `canceled`

### Test 5: Manage Subscription

1. Click **Manage Subscription**
2. Opens Lava customer portal (sandbox)
3. Test changing payment methods or viewing history

---

## 🔍 Verification Checklist

| Test | Expected Result | ✅/❌ |
|------|----------------|-------|
| Backend shows sandbox message on startup | "🧪 Lava Sandbox mode active..." | |
| Frontend shows sandbox banner | Yellow banner with test card info | |
| Checkout opens Lava sandbox page | URL contains sandbox.api.lava.ai | |
| Payment with test card succeeds | Instant success, no real charge | |
| Webhook marks user active | Status = 'active' in DB | |
| Trial auto-activates on registration | New users get 3-day Plus trial | |
| Cancel works without errors | Status changes to 'canceled' | |
| Portal opens successfully | Lava portal URL opens | |

---

## 🚨 Safety Notes

- ✅ **Sandbox keys are isolated** from live funds
- ✅ **No real Stripe charges** occur
- ✅ **Webhooks are simulated**
- ✅ **Database is safe** (use separate test DB if needed)
- ⚠️ **Never commit** `.env` files to Git
- ⚠️ **Keep test/live keys separate**

---

## 🔄 Switching Modes

### To MOCK Mode (Fully Local)
```env
# Backend .env
SUBS_MODE=MOCK

# Frontend .env
REACT_APP_SUBS_MODE=MOCK
```

### To LAVA Production (Live Payments)
```env
# Backend .env
SUBS_MODE=LAVA
LAVA_API_KEY=sk_live_xxx
LAVA_BASE_URL=https://api.lava.ai
LAVA_WEBHOOK_SECRET=whsec_live_xxx

# Frontend .env
REACT_APP_SUBS_MODE=LAVA
```

⚠️ **Only switch to LAVA after thorough sandbox testing!**

---

## 🐛 Troubleshooting

### Issue: "Rate limit reached"
**Solution:** You hit API limits. Wait or upgrade Lava tier.

### Issue: Checkout URL is empty
**Solution:** Check `LAVA_API_KEY_TEST` and `LAVA_BASE_URL_SANDBOX` are correct.

### Issue: Webhook not working
**Solution:** 
1. Check webhook endpoint is accessible
2. Verify `LAVA_WEBHOOK_SECRET_TEST` matches Lava dashboard
3. Use manual curl test (see Test 3)

### Issue: Frontend doesn't show sandbox banner
**Solution:** Ensure `REACT_APP_SUBS_MODE=LAVA_SANDBOX` in `frontend/.env` and restart dev server.

---

## 📊 Monitoring

Check backend logs for:
```
🧪 Lava Sandbox mode active — all payments simulated via https://sandbox.api.lava.ai
```

Check browser console for:
```
🧪 Lava Sandbox Mode — Use test card: 4242 4242 4242 4242
```

---

## ✅ Production Readiness

Before going live:

- [ ] All sandbox tests pass
- [ ] Switch to `SUBS_MODE=LAVA`
- [ ] Update to production API keys
- [ ] Configure real price IDs in Lava dashboard
- [ ] Test with real card in controlled environment
- [ ] Set up production webhook endpoint (HTTPS required)
- [ ] Monitor Lava dashboard for real transactions
- [ ] Configure production database

---

## 📞 Support

- **Lava Docs:** https://docs.lava.ai
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **VitaLedger Issues:** [GitHub Issues]

---

**Happy Testing! 🎉**
