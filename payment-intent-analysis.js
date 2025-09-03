const fs = require('fs');
const path = require('path');

// Comprehensive Payment Intent Analysis
function analyzePaymentIntent(paymentIntent) {
  console.log('🔍 PAYMENT INTENT ANALYSIS');
  console.log('==========================\n');

  console.log('📊 PAYMENT INTENT DETAILS:');
  console.log('---------------------------');
  console.log(`ID: ${paymentIntent.id}`);
  console.log(`Status: ${paymentIntent.status}`);
  console.log(`Amount: $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()}`);
  console.log(`Customer: ${paymentIntent.customer || 'NULL'}`);
  console.log(`Payment Method: ${paymentIntent.payment_method || 'NULL'}`);
  console.log(`Created: ${new Date(paymentIntent.created * 1000).toISOString()}`);
  console.log(`Plan ID: ${paymentIntent.metadata?.planId || 'Not specified'}`);
  console.log(`Test Mode: ${paymentIntent.metadata?.test || 'false'}\n`);

  // Status Analysis
  console.log('📈 STATUS ANALYSIS:');
  console.log('-------------------');
  
  switch (paymentIntent.status) {
    case 'requires_payment_method':
      console.log('⚠️  Status: REQUIRES PAYMENT METHOD');
      console.log('📝 Meaning: Payment intent created but no payment method attached');
      console.log('🎯 Next Steps: Customer needs to provide payment information');
      console.log('⏰ Timeout: Payment intent will expire if not completed');
      break;
      
    case 'requires_confirmation':
      console.log('🔄 Status: REQUIRES CONFIRMATION');
      console.log('📝 Meaning: Payment method attached, awaiting confirmation');
      console.log('🎯 Next Steps: Confirm the payment intent');
      break;
      
    case 'requires_action':
      console.log('🔐 Status: REQUIRES ACTION');
      console.log('📝 Meaning: Additional authentication required (3D Secure, etc.)');
      console.log('🎯 Next Steps: Customer needs to complete authentication');
      break;
      
    case 'processing':
      console.log('⏳ Status: PROCESSING');
      console.log('📝 Meaning: Payment is being processed');
      console.log('🎯 Next Steps: Wait for processing to complete');
      break;
      
    case 'succeeded':
      console.log('✅ Status: SUCCEEDED');
      console.log('📝 Meaning: Payment completed successfully');
      console.log('🎯 Next Steps: Update user account and send confirmation');
      break;
      
    case 'canceled':
      console.log('❌ Status: CANCELED');
      console.log('📝 Meaning: Payment was canceled');
      console.log('🎯 Next Steps: Handle cancellation and notify customer');
      break;
      
    default:
      console.log(`❓ Status: ${paymentIntent.status.toUpperCase()}`);
      console.log('📝 Meaning: Unknown status');
      break;
  }

  console.log('\n🔍 DETAILED ANALYSIS:');
  console.log('----------------------');

  // Customer Analysis
  if (!paymentIntent.customer) {
    console.log('❌ CUSTOMER ISSUE: No customer attached to payment intent');
    console.log('📝 Impact: Cannot track payment to specific user');
    console.log('🔧 Solution: Attach customer ID when creating payment intent\n');
  } else {
    console.log('✅ Customer attached:', paymentIntent.customer);
  }

  // Payment Method Analysis
  if (!paymentIntent.payment_method) {
    console.log('❌ PAYMENT METHOD ISSUE: No payment method attached');
    console.log('📝 Impact: Payment cannot be processed');
    console.log('🔧 Solution: Customer needs to provide payment method\n');
  } else {
    console.log('✅ Payment method attached:', paymentIntent.payment_method);
  }

  // Amount Analysis
  if (paymentIntent.amount_received === 0) {
    console.log('❌ PAYMENT ISSUE: No amount received yet');
    console.log('📝 Impact: Payment not completed');
    console.log('🔧 Solution: Complete payment process\n');
  } else {
    console.log('✅ Amount received:', paymentIntent.amount_received);
  }

  // Metadata Analysis
  console.log('📋 METADATA ANALYSIS:');
  console.log('---------------------');
  if (paymentIntent.metadata) {
    Object.entries(paymentIntent.metadata).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });
  } else {
    console.log('No metadata provided');
  }

  console.log('\n🎯 RECOMMENDED ACTIONS:');
  console.log('========================');

  if (paymentIntent.status === 'requires_payment_method') {
    console.log('1. IMMEDIATE ACTIONS:');
    console.log('   • Send payment method collection form to customer');
    console.log('   • Provide clear instructions for payment completion');
    console.log('   • Set up payment intent monitoring for timeout\n');
    
    console.log('2. TECHNICAL IMPROVEMENTS:');
    console.log('   • Attach customer ID when creating payment intents');
    console.log('   • Add customer email to metadata for tracking');
    console.log('   • Implement payment intent status monitoring\n');
    
    console.log('3. USER EXPERIENCE:');
    console.log('   • Provide clear payment instructions');
    console.log('   • Show payment progress indicators');
    console.log('   • Send reminder emails for incomplete payments\n');
  }

  return {
    status: paymentIntent.status,
    requiresAction: paymentIntent.status === 'requires_payment_method',
    hasCustomer: !!paymentIntent.customer,
    hasPaymentMethod: !!paymentIntent.payment_method,
    amountReceived: paymentIntent.amount_received,
    planId: paymentIntent.metadata?.planId,
    isTest: paymentIntent.metadata?.test === 'true'
  };
}

// Payment Intent Monitoring System
class PaymentIntentMonitor {
  constructor() {
    this.pendingIntents = new Map();
    this.timeoutThreshold = 30 * 60 * 1000; // 30 minutes
  }

  // Monitor a payment intent
  monitorPaymentIntent(paymentIntent) {
    const analysis = analyzePaymentIntent(paymentIntent);
    
    if (analysis.requiresAction) {
      this.pendingIntents.set(paymentIntent.id, {
        ...paymentIntent,
        createdAt: new Date(),
        lastChecked: new Date(),
        analysis
      });
      
      console.log('📊 Added to monitoring system');
      console.log(`⏰ Will timeout in ${this.timeoutThreshold / 60000} minutes`);
    }
    
    return analysis;
  }

  // Check for expired payment intents
  checkExpiredIntents() {
    const now = new Date();
    const expired = [];
    
    this.pendingIntents.forEach((intent, id) => {
      const age = now - intent.createdAt;
      if (age > this.timeoutThreshold) {
        expired.push(intent);
        this.pendingIntents.delete(id);
      }
    });
    
    if (expired.length > 0) {
      console.log(`⚠️ Found ${expired.length} expired payment intents`);
      expired.forEach(intent => {
        console.log(`   - ${intent.id} (${intent.analysis.planId})`);
      });
    }
    
    return expired;
  }

  // Get monitoring summary
  getMonitoringSummary() {
    return {
      totalPending: this.pendingIntents.size,
      pendingIntents: Array.from(this.pendingIntents.values()).map(intent => ({
        id: intent.id,
        status: intent.status,
        planId: intent.analysis.planId,
        age: new Date() - intent.createdAt,
        createdAt: intent.createdAt
      }))
    };
  }
}

// Test the analysis with the provided payment intent
const testPaymentIntent = {
  "id": "pi_3S2zh5Lf1iznKy110oGgADZp",
  "object": "payment_intent",
  "last_payment_error": null,
  "livemode": true,
  "next_action": null,
  "status": "requires_payment_method",
  "amount": 100,
  "amount_capturable": 0,
  "amount_details": {
    "tip": {}
  },
  "amount_received": 0,
  "application": null,
  "application_fee_amount": null,
  "automatic_payment_methods": null,
  "canceled_at": null,
  "cancellation_reason": null,
  "capture_method": "automatic_async",
  "client_secret": "pi_3S2zh5Lf1iznKy110oGgADZp_secret_DNLGdNJDb8CHg3RnaMJLbjH3U",
  "confirmation_method": "automatic",
  "created": 1756840599,
  "currency": "usd",
  "customer": null,
  "description": null,
  "excluded_payment_method_types": null,
  "latest_charge": null,
  "metadata": {
    "planId": "daily-12",
    "test": "true"
  },
  "on_behalf_of": null,
  "payment_method": null,
  "payment_method_configuration_details": null,
  "payment_method_options": {
    "card": {
      "installments": null,
      "mandate_options": null,
      "network": null,
      "request_three_d_secure": "automatic"
    }
  },
  "payment_method_types": [
    "card"
  ],
  "processing": null,
  "receipt_email": null,
  "review": null,
  "setup_future_usage": null,
  "shipping": null,
  "source": null,
  "statement_descriptor": null,
  "statement_descriptor_suffix": null,
  "transfer_data": null,
  "transfer_group": null
};

console.log('🧪 TESTING PAYMENT INTENT ANALYSIS');
console.log('==================================\n');

const monitor = new PaymentIntentMonitor();
const analysis = monitor.monitorPaymentIntent(testPaymentIntent);

console.log('\n📊 MONITORING SUMMARY:');
console.log('======================');
const summary = monitor.getMonitoringSummary();
console.log(`Total Pending Intents: ${summary.totalPending}`);
summary.pendingIntents.forEach(intent => {
  console.log(`- ${intent.id}: ${intent.status} (${intent.planId}) - Age: ${Math.round(intent.age / 60000)} minutes`);
});

console.log('\n✅ ANALYSIS COMPLETE');
console.log(`Status: ${analysis.status}`);
console.log(`Requires Action: ${analysis.requiresAction ? 'YES' : 'NO'}`);
console.log(`Has Customer: ${analysis.hasCustomer ? 'YES' : 'NO'}`);
console.log(`Has Payment Method: ${analysis.hasPaymentMethod ? 'YES' : 'NO'}`);
console.log(`Plan: ${analysis.planId}`);
console.log(`Test Mode: ${analysis.isTest ? 'YES' : 'NO'}`);
