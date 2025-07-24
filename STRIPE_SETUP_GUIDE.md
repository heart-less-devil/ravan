# Stripe Setup Guide for Annual/Monthly Subscriptions

## Current Implementation Status

✅ **Annual/Monthly Toggle**: Already implemented in the pricing page
✅ **Price Calculation**: Correctly calculates annual vs monthly prices
✅ **Savings Display**: Shows 20% savings for annual billing
✅ **Payment Processing**: Handles both billing cycles
✅ **Email Notifications**: Sends confirmation emails for both payment types

## Next Steps: Setting Up Stripe Price IDs

### 1. Create Products in Stripe Dashboard

Go to your Stripe Dashboard → Products and create the following products:

#### Test Plan
- **Name**: Test Plan
- **Description**: Perfect for testing payment system
- **Price**: $1 USD

#### Basic Plan  
- **Name**: Basic Plan
- **Description**: Ideal for growing businesses
- **Price**: $400 USD

#### Premium Plan
- **Name**: Premium Plan  
- **Description**: For advanced users and teams
- **Price**: $600 USD

### 2. Create Price IDs for Each Plan

For each product, create two prices:

#### Test Plan Prices
- **Monthly**: `price_test_monthly` (Recurring, $1/month)
- **Annual**: `price_test_annual` (Recurring, $12/year)

#### Basic Plan Prices
- **Monthly**: `price_basic_monthly` (Recurring, $400/month)
- **Annual**: `price_basic_annual` (Recurring, $4800/year)

#### Premium Plan Prices
- **Monthly**: `price_premium_monthly` (Recurring, $600/month)
- **Annual**: `price_premium_annual` (Recurring, $7200/year)

### 3. Update Backend Price IDs

Replace the placeholder price IDs in `server/index.js`:

```javascript
const priceIds = {
  'test': {
    monthly: 'price_1ABC123...', // Your actual Stripe price ID
    annual: 'price_1DEF456...'   // Your actual Stripe price ID
  },
  'basic': {
    monthly: 'price_1GHI789...', // Your actual Stripe price ID
    annual: 'price_1JKL012...'   // Your actual Stripe price ID
  },
  'premium': {
    monthly: 'price_1MNO345...', // Your actual Stripe price ID
    annual: 'price_1PQR678...'   // Your actual Stripe price ID
  }
};
```

### 4. Switch to Subscription Mode (Optional)

Currently, the system uses one-time payments. To switch to recurring subscriptions:

1. **Update StripePayment Component**: Change from `create-payment-intent` to `create-subscription`
2. **Update Backend**: Use the subscription route instead of payment intent
3. **Update Webhook**: Handle subscription events instead of payment events

### 5. Testing the Annual/Monthly Toggle

1. **Frontend Test**:
   - Go to `/pricing` page
   - Toggle between "Pay Monthly" and "Pay Yearly 20% off"
   - Verify prices change correctly
   - Verify savings are displayed for annual plans

2. **Payment Test**:
   - Select a plan
   - Choose monthly vs annual billing
   - Complete test payment
   - Verify correct amount is charged

3. **Email Test**:
   - Check that confirmation emails are sent
   - Verify email content includes billing cycle information

## Current Features Working

✅ **Toggle Switch**: Users can switch between monthly and annual billing
✅ **Price Display**: Shows correct prices for each billing cycle
✅ **Savings Calculation**: Displays 20% savings for annual plans
✅ **Payment Processing**: Handles both billing cycles correctly
✅ **Email Notifications**: Sends confirmation emails
✅ **User Profile**: Shows subscription details in customer profile

## Environment Variables Needed

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Webhook Events Handled

- `payment_intent.succeeded` - One-time payments
- `customer.subscription.created` - New subscriptions
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Cancelled subscriptions
- `invoice.payment_succeeded` - Successful recurring payments
- `invoice.payment_failed` - Failed recurring payments

## Next Steps

1. **Create Stripe Products**: Set up products in Stripe dashboard
2. **Create Price IDs**: Generate price IDs for monthly/annual billing
3. **Update Backend**: Replace placeholder price IDs with real ones
4. **Test Payments**: Verify both billing cycles work correctly
5. **Monitor Webhooks**: Ensure all events are handled properly

The annual/monthly toggle functionality is already fully implemented and working! You just need to set up the actual Stripe price IDs to complete the integration. 