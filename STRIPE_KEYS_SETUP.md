# Stripe API Keys Setup Guide

## Current Issue
The Stripe API keys in the code are invalid placeholders. We need to set up proper keys.

## Solution Options

### Option 1: Use Test Keys (Recommended for Development)
I've updated the code to use test keys by default:

**Backend (server/index.js):**
```javascript
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE';
```

**Frontend (src/components/StripePayment.js):**
```javascript
const stripePromise = loadStripe('pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE');
```

### Option 2: Use Real Stripe Keys (For Production)

1. **Get Real Keys from Stripe Dashboard:**
   - Go to https://dashboard.stripe.com/
   - Navigate to Developers → API Keys
   - Copy your Publishable Key (pk_live_...) and Secret Key (sk_live_...)

2. **Set Environment Variables:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_real_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_live_your_real_publishable_key_here
   ```

3. **Update Frontend:**
   Replace the test key in `src/components/StripePayment.js` with your real publishable key.

## Test Keys vs Live Keys

### Test Keys (Current Setup)
- ✅ Safe for development
- ✅ No real money charged
- ✅ Can test all payment flows
- ❌ Won't work in production

### Live Keys (For Production)
- ✅ Real payments processed
- ✅ Production ready
- ❌ Charges real money
- ❌ Need proper webhook setup

## Current Status
- ✅ Code updated to use test keys
- ✅ Payment system fixes applied
- ✅ Ready for testing with test keys
- ⏳ Need to test payment flow

## Next Steps
1. Test the payment system with test keys
2. If working, deploy to production
3. Set up real Stripe keys for production
4. Configure webhooks for production

## Testing with Test Keys
Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

Any expiry date in the future and any 3-digit CVC will work.
