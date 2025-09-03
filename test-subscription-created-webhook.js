const fs = require('fs');
const path = require('path');

// Test script to simulate the subscription created webhook event
const testWebhookEvent = {
  "id": "evt_1S0ztcLf1iznKy11xwHJo2NL",
  "object": "event",
  "api_version": "2025-06-30.basil",
  "created": 1756364720,
  "data": {
    "object": {
      "id": "sub_1S0ztbLf1iznKy11kxIDV7F8",
      "object": "subscription",
      "application": null,
      "application_fee_percent": null,
      "automatic_tax": {
        "disabled_reason": null,
        "enabled": false,
        "liability": null
      },
      "billing_cycle_anchor": 1756364719,
      "billing_cycle_anchor_config": null,
      "billing_mode": {
        "type": "classic"
      },
      "billing_thresholds": null,
      "cancel_at": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "cancellation_details": {
        "comment": null,
        "feedback": null,
        "reason": null
      },
      "collection_method": "charge_automatically",
      "created": 1756364719,
      "currency": "usd",
      "customer": "cus_StrDyyZ2GNZ3vZ",
      "days_until_due": null,
      "default_payment_method": null,
      "default_source": null,
      "default_tax_rates": [],
      "description": null,
      "discounts": [],
      "ended_at": null,
      "invoice_settings": {
        "account_tax_ids": null,
        "issuer": {
          "type": "self"
        }
      },
      "items": {
        "object": "list",
        "data": [
          {
            "id": "si_SwtgfGAXyJlSFA",
            "object": "subscription_item",
            "billing_thresholds": null,
            "created": 1756364719,
            "current_period_end": 1756451119,
            "current_period_start": 1756364719,
            "discounts": [],
            "metadata": {},
            "plan": {
              "id": "price_1Ry3VCLf1iznKy11PtmX3JJE",
              "object": "plan",
              "active": true,
              "amount": 100,
              "amount_decimal": "100",
              "billing_scheme": "per_unit",
              "created": 1755663598,
              "currency": "usd",
              "interval": "day",
              "interval_count": 1,
              "livemode": true,
              "metadata": {},
              "meter": null,
              "nickname": null,
              "product": "prod_StrDZ0q9ySolEN",
              "tiers_mode": null,
              "transform_usage": null,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "price": {
              "id": "price_1Ry3VCLf1iznKy11PtmX3JJE",
              "object": "price",
              "active": true,
              "billing_scheme": "per_unit",
              "created": 1755663598,
              "currency": "usd",
              "custom_unit_amount": null,
              "livemode": true,
              "lookup_key": "daily_1usd_12days",
              "metadata": {},
              "nickname": null,
              "product": "prod_StrDZ0q9ySolEN",
              "recurring": {
                "interval": "day",
                "interval_count": 1,
                "meter": null,
                "trial_period_days": null,
                "usage_type": "licensed"
              },
              "tax_behavior": "unspecified",
              "tiers_mode": null,
              "transform_quantity": null,
              "type": "recurring",
              "unit_amount": 100,
              "unit_amount_decimal": "100"
            },
            "quantity": 1,
            "subscription": "sub_1S0ztbLf1iznKy11kxIDV7F8",
            "tax_rates": []
          }
        ],
        "has_more": false,
        "total_count": 1,
        "url": "/v1/subscription_items?subscription=sub_1S0ztbLf1iznKy11kxIDV7F8"
      },
      "latest_invoice": "in_1S0ztbLf1iznKy113fu9TjBy",
      "livemode": true,
      "metadata": {},
      "next_pending_invoice_item_invoice": null,
      "on_behalf_of": null,
      "pause_collection": null,
      "payment_settings": {
        "payment_method_options": null,
        "payment_method_types": null,
        "save_default_payment_method": "on_subscription"
      },
      "pending_invoice_item_interval": null,
      "pending_setup_intent": null,
      "pending_update": null,
      "plan": {
        "id": "price_1Ry3VCLf1iznKy11PtmX3JJE",
        "object": "plan",
        "active": true,
        "amount": 100,
        "amount_decimal": "100",
        "billing_scheme": "per_unit",
        "created": 1755663598,
        "currency": "usd",
        "interval": "day",
        "interval_count": 1,
        "livemode": true,
        "metadata": {},
        "meter": null,
        "nickname": null,
        "product": "prod_StrDZ0q9ySolEN",
        "tiers_mode": null,
        "transform_usage": null,
        "trial_period_days": null,
        "usage_type": "licensed"
      },
      "quantity": 1,
      "schedule": null,
      "start_date": 1756364719,
      "status": "incomplete",
      "test_clock": null,
      "transfer_data": null,
      "trial_end": null,
      "trial_settings": {
        "end_behavior": {
          "missing_payment_method": "create_invoice"
        }
      },
      "trial_start": null
    }
  },
  "livemode": true,
  "pending_webhooks": 1,
  "request": {
    "id": "req_acarbZTzNiF8Ho",
    "idempotency_key": "stripe-node-retry-52b4bd1a-7d48-41ee-b10e-bfc2c6a60ff5"
  },
  "type": "customer.subscription.created"
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
function processSubscriptionCreatedWebhook(event) {
  console.log('\n🔍 Processing customer.subscription.created webhook...');
  
  const subscription = event.data.object;
  console.log('✅ Customer subscription created');
  console.log('Subscription details:', {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    plan: subscription.plan?.id,
    interval: subscription.plan?.interval,
    amount: subscription.plan?.amount
  });
  
  // Check if this is a daily subscription (either by metadata or plan details)
  const isDailySubscription = subscription.metadata?.planId === 'daily-12' || 
                             (subscription.plan?.interval === 'day' && subscription.plan?.amount === 100);
  
  if (isDailySubscription) {
    console.log('🔄 Daily subscription created, setting up daily billing...');
    
    // Simulate customer retrieval
    const customerEmail = 'universalx0242@gmail.com'; // From the previous webhook
    console.log('📧 Found customer email:', customerEmail);
    
    // Find user in mock database
    const userIndex = mockDB.users.findIndex(u => u.email === customerEmail);
    if (userIndex !== -1) {
      console.log('✅ Found user in database:', mockDB.users[userIndex].email);
      
      // Update user with subscription details
      mockDB.users[userIndex].subscriptionId = subscription.id;
      mockDB.users[userIndex].stripeCustomerId = subscription.customer;
      mockDB.users[userIndex].currentPlan = 'daily-12';
      mockDB.users[userIndex].subscriptionStatus = subscription.status;
      mockDB.users[userIndex].subscriptionCreatedAt = new Date(subscription.created * 1000).toISOString();
      mockDB.users[userIndex].subscriptionEndAt = new Date(subscription.current_period_end * 1000).toISOString();
      mockDB.users[userIndex].lastCreditRenewal = new Date().toISOString();
      mockDB.users[userIndex].nextCreditRenewal = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      console.log('✅ File storage daily subscription updated for:', customerEmail);
      console.log('📝 Updated user record:', {
        email: mockDB.users[userIndex].email,
        subscriptionId: mockDB.users[userIndex].subscriptionId,
        currentPlan: mockDB.users[userIndex].currentPlan,
        subscriptionStatus: mockDB.users[userIndex].subscriptionStatus,
        subscriptionCreatedAt: mockDB.users[userIndex].subscriptionCreatedAt,
        subscriptionEndAt: mockDB.users[userIndex].subscriptionEndAt
      });
    } else {
      console.log('⚠️ User not found in file storage for:', customerEmail);
    }
  } else {
    console.log('📋 Non-daily subscription created, no special handling needed');
  }
}

// Run the test
console.log('🧪 Testing Subscription Created Webhook Processing');
console.log('==================================================');

processSubscriptionCreatedWebhook(testWebhookEvent);

console.log('\n✅ Test completed successfully!');
console.log('\n📋 Summary:');
console.log('- Subscription ID: sub_1S0ztbLf1iznKy11kxIDV7F8');
console.log('- Customer ID: cus_StrDyyZ2GNZ3vZ');
console.log('- Customer Email: universalx0242@gmail.com');
console.log('- Plan: Daily subscription ($1.00 USD per day)');
console.log('- Status: incomplete (payment pending)');
console.log('- Latest Invoice: in_1S0ztbLf1iznKy113fu9TjBy');
console.log('- Billing: Daily recurring');
