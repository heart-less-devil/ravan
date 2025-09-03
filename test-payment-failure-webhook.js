const fs = require('fs');
const path = require('path');

// Test script to simulate the payment failure webhook event
const testWebhookEvent = {
  "id": "evt_1S2JIdLf1iznKy11MQMVItb5",
  "object": "event",
  "api_version": "2025-06-30.basil",
  "created": 1756677632,
  "data": {
    "object": {
      "id": "in_1S0FNsLf1iznKy116gHh9A3q",
      "object": "invoice",
      "account_country": "US",
      "account_name": "The BioPing",
      "account_tax_ids": null,
      "amount_due": 100,
      "amount_overpaid": 0,
      "amount_paid": 0,
      "amount_remaining": 100,
      "amount_shipping": 0,
      "application": null,
      "attempt_count": 4,
      "attempted": true,
      "auto_advance": true,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null,
        "provider": null,
        "status": null
      },
      "automatically_finalizes_at": null,
      "billing_reason": "manual",
      "collection_method": "charge_automatically",
      "created": 1756185928,
      "currency": "usd",
      "custom_fields": null,
      "customer": "cus_StrDyyZ2GNZ3vZ",
      "customer_address": null,
      "customer_email": "universalx0242@gmail.com",
      "customer_name": null,
      "customer_phone": null,
      "customer_shipping": null,
      "customer_tax_exempt": "none",
      "customer_tax_ids": [],
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "due_date": null,
      "effective_at": 1756224025,
      "ending_balance": 0,
      "footer": null,
      "from_invoice": null,
      "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1RlErgLf1iznKy11/live_YWNjdF8xUmxFcmdMZjFpem5LeTExLF9TdzdkMEhlNVZSRnZRM2l4YmFLQzdCWVdJWXBUNlJDLDE0NzIxODQzNQ0200emKYU3HM?s=ap",
      "invoice_pdf": "https://pay.stripe.com/invoice/acct_1RlErgLf1iznKy11/live_YWNjdF8xUmxFcmdMZjFpem5LeTExLF9TdzdkMEhlNVZSRnZRM2l4YmFLQzdCWVdJWXBUNlJDLDE0NzIxODQzNQ0200emKYU3HM/pdf?s=ap",
      "issuer": {
        "type": "self"
      },
      "last_finalization_error": null,
      "latest_revision": null,
      "lines": {
        "object": "list",
        "data": [
          {
            "id": "il_1S0FOWLf1iznKy11bk6flIGw",
            "object": "line_item",
            "amount": 100,
            "currency": "usd",
            "description": "Daily Test Plan (12 days)",
            "discount_amounts": [],
            "discountable": true,
            "discounts": [],
            "invoice": "in_1S0FNsLf1iznKy116gHh9A3q",
            "livemode": true,
            "metadata": {},
            "parent": {
              "invoice_item_details": {
                "invoice_item": "ii_1S0FOWLf1iznKy11Xu0gpFrw",
                "proration": false,
                "proration_details": {
                  "credited_items": null
                },
                "subscription": null
              },
              "subscription_item_details": null,
              "type": "invoice_item_details"
            },
            "period": {
              "end": 1756148400,
              "start": 1756148400
            },
            "pretax_credit_amounts": [],
            "pricing": {
              "price_details": {
                "price": "price_1S0FOWLf1iznKy11yM6VEBuX",
                "product": "prod_StrDZ0q9ySolEN"
              },
              "type": "price_details",
              "unit_amount_decimal": "100"
            },
            "quantity": 1,
            "taxes": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/invoices/in_1S0FNsLf1iznKy116gHh9A3q/lines"
      },
      "livemode": true,
      "metadata": {},
      "next_payment_attempt": 1756828830,
      "number": "SWHIWMSX-0015",
      "on_behalf_of": null,
      "parent": null,
      "payment_settings": {
        "default_mandate": null,
        "payment_method_options": null,
        "payment_method_types": null
      },
      "period_end": 1756185928,
      "period_start": 1756185928,
      "post_payment_credit_notes_amount": 0,
      "pre_payment_credit_notes_amount": 0,
      "receipt_number": null,
      "rendering": {
        "amount_tax_display": null,
        "pdf": {
          "page_size": "letter"
        },
        "template": null,
        "template_version": null
      },
      "shipping_cost": null,
      "shipping_details": null,
      "starting_balance": 0,
      "statement_descriptor": null,
      "status": "open",
      "status_transitions": {
        "finalized_at": 1756224025,
        "marked_uncollectible_at": null,
        "paid_at": null,
        "voided_at": null
      },
      "subtotal": 100,
      "subtotal_excluding_tax": 100,
      "test_clock": null,
      "total": 100,
      "total_discount_amounts": [],
      "total_excluding_tax": 100,
      "total_pretax_credit_amounts": [],
      "total_taxes": [],
      "webhooks_delivered_at": 1756185928
    }
  },
  "livemode": true,
  "pending_webhooks": 1,
  "request": {
    "id": null,
    "idempotency_key": null
  },
  "type": "invoice.payment_failed"
};

// Load the mock database
const mockDB = {
  users: []
};

try {
  const usersData = fs.readFileSync(path.join(__dirname, 'server', 'data', 'users.json'), 'utf8');
  mockDB.users = JSON.parse(usersData);
  console.log('✅ Loaded users database:', mockDB.users.length, 'users');
} catch (error) {
  console.log('⚠️ Could not load users database:', error.message);
}

// Simulate the webhook processing logic
function processPaymentFailureWebhook(event) {
  console.log('\n🔍 Processing invoice.payment_failed webhook...');
  
  const failedInvoice = event.data.object;
  console.log('❌ Invoice payment failed:', failedInvoice.id);
  console.log('Invoice details:', {
    customer: failedInvoice.customer,
    customerEmail: failedInvoice.customer_email,
    amount: failedInvoice.amount_due,
    billingReason: failedInvoice.billing_reason,
    attemptCount: failedInvoice.attempt_count
  });
  
  const email = failedInvoice.customer_email;
  const customerId = failedInvoice.customer;
  
  if (email) {
    // Find user by email
    const idx = mockDB.users.findIndex(u => u.email === email);
    
    if (idx !== -1) {
      console.log('✅ Found user in database:', mockDB.users[idx].email);
      
      // Handle subscription-based invoices
      const subId = failedInvoice.subscription;
      if (subId) {
        mockDB.users[idx].subscriptionOnHold = true;
        console.log('✅ Subscription put on hold for user:', email);
      } else {
        // Handle manual invoices (like daily plans)
        console.log('📋 Manual invoice payment failed for user:', email);
        
        // Check if this is a daily plan invoice
        const lineItems = failedInvoice.lines?.data || [];
        const isDailyPlan = lineItems.some(item => 
          item.description && item.description.includes('Daily')
        );
        
        if (isDailyPlan) {
          // For daily plans, we might want to suspend access or send notification
          mockDB.users[idx].paymentFailed = true;
          mockDB.users[idx].lastPaymentFailure = new Date().toISOString();
          console.log('⚠️ Daily plan payment failed for user:', email);
          console.log('📝 Updated user record:', {
            email: mockDB.users[idx].email,
            paymentFailed: mockDB.users[idx].paymentFailed,
            lastPaymentFailure: mockDB.users[idx].lastPaymentFailure
          });
        }
      }
    } else {
      console.log('⚠️ User not found for email:', email);
    }
    
    // Simulate email notification
    console.log('📧 Would send payment failure notification to:', email);
    console.log('📧 Email content would include:');
    console.log('   - Invoice ID:', failedInvoice.id);
    console.log('   - Amount: $' + (failedInvoice.amount_due / 100).toFixed(2) + ' USD');
    console.log('   - Attempts:', failedInvoice.attempt_count);
  } else {
    console.log('⚠️ No customer email found in invoice');
  }
}

// Run the test
console.log('🧪 Testing Payment Failure Webhook Processing');
console.log('===============================================');

processPaymentFailureWebhook(testWebhookEvent);

console.log('\n✅ Test completed successfully!');
console.log('\n📋 Summary:');
console.log('- Invoice ID: in_1S0FNsLf1iznKy116gHh9A3q');
console.log('- Customer Email: universalx0242@gmail.com');
console.log('- Amount: $1.00 USD');
console.log('- Billing Reason: manual');
console.log('- Description: Daily Test Plan (12 days)');
console.log('- Attempt Count: 4');
console.log('- Status: open (payment failed)');
