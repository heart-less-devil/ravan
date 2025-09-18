# Stripe Guest Customers Handling Guide

## What are Guest Customers?

Stripe automatically creates "Guest" customers when payments aren't tied to a registered customer account. This helps track customer data even without full account registration.

## Key Points:

### ✅ **Guest Customer Characteristics:**
- Created automatically by Stripe
- Not editable (read-only)
- Still provides valuable customer data
- Can be converted to regular customers later

### ✅ **Current Implementation:**

#### **Backend (server/index.js):**
```javascript
// Payment Intent Creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100,
  currency: currency,
  customer: customer ? customer.id : undefined, // Link to customer if available
  metadata: {
    planId: planId,
    isAnnual: isAnnual ? 'true' : 'false',
    customerType: customer ? 'registered' : 'guest', // Track customer type
    integration_check: 'accept_a_payment'
  },
  automatic_payment_methods: {
    enabled: true,
  },
});
```

#### **Webhook Handling:**
```javascript
case 'payment_intent.succeeded':
  const paymentIntent = event.data.object;
  const customerType = paymentIntent.metadata?.customerType || 'guest';
  console.log('Customer type:', customerType);
  
  // Handle guest vs registered customer differently
  if (customerType === 'guest') {
    // Send guest-specific email
    // Store payment data for later customer association
  } else {
    // Send regular customer email
    // Update customer profile
  }
```

### ✅ **Benefits of Current Setup:**

1. **Flexible Payment Flow:**
   - Users can pay without account registration
   - Guest customers still tracked in Stripe
   - Can convert to regular customers later

2. **Better Data Collection:**
   - Payment history preserved
   - Customer behavior tracked
   - Email confirmations sent

3. **Future Customer Conversion:**
   - Guest customers can be linked to accounts later
   - Payment history maintained
   - Seamless upgrade path

### ✅ **Email Handling:**

**Guest Customers:**
- Payment confirmation emails still sent
- Receipt email from payment details
- Transaction tracking maintained

**Registered Customers:**
- Full customer profile access
- Subscription management
- Detailed payment history

### ✅ **Best Practices:**

1. **Always Include Customer Email:**
   ```javascript
   customerEmail: localStorage.getItem('userEmail') || null
   ```

2. **Track Customer Type:**
   ```javascript
   customerType: customer ? 'registered' : 'guest'
   ```

3. **Handle Both Types in Webhooks:**
   ```javascript
   if (customerType === 'guest') {
     // Guest-specific logic
   } else {
     // Registered customer logic
   }
   ```

4. **Future Customer Conversion:**
   ```javascript
   // When guest user creates account
   const customer = await stripe.customers.create({
     email: userEmail,
     metadata: { convertedFromGuest: true }
   });
   ```

### ✅ **Current Features Working:**

- ✅ Guest customer creation
- ✅ Payment processing for guests
- ✅ Email confirmations
- ✅ Customer type tracking
- ✅ Webhook handling
- ✅ Metadata preservation

### ✅ **Future Enhancements:**

1. **Customer Conversion Flow:**
   - Guest to registered customer upgrade
   - Payment history linking
   - Account creation with existing payments

2. **Enhanced Tracking:**
   - Guest customer analytics
   - Conversion rate tracking
   - Payment pattern analysis

3. **Improved Email Templates:**
   - Guest-specific messaging
   - Account creation prompts
   - Upgrade suggestions

## Summary

The current implementation properly handles both guest and registered customers:

- **Guest customers** get payment processing and email confirmations
- **Registered customers** get full account features
- **Webhooks** handle both types appropriately
- **Future conversion** is possible and supported

This provides a flexible payment system that works for all user types while maintaining data integrity and customer experience. 