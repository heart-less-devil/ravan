const fs = require('fs');
const path = require('path');

// Webhook Monitoring and Alerting System
class WebhookMonitor {
  constructor() {
    this.alerts = [];
    this.criticalEvents = [
      'invoice.payment_failed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted'
    ];
  }

  // Monitor webhook events and generate alerts
  monitorWebhookEvent(event) {
    console.log(`🔍 Monitoring webhook event: ${event.type}`);
    
    const alerts = [];
    
    switch (event.type) {
      case 'customer.subscription.created':
        alerts.push(...this.analyzeSubscriptionCreated(event));
        break;
      case 'invoice.payment_failed':
        alerts.push(...this.analyzePaymentFailed(event));
        break;
      case 'customer.subscription.updated':
        alerts.push(...this.analyzeSubscriptionUpdated(event));
        break;
    }
    
    this.alerts.push(...alerts);
    return alerts;
  }

  // Analyze subscription creation events
  analyzeSubscriptionCreated(event) {
    const subscription = event.data.object;
    const alerts = [];
    
    console.log('📊 Analyzing subscription creation...');
    
    // Check for incomplete status
    if (subscription.status === 'incomplete') {
      alerts.push({
        type: 'CRITICAL',
        event: 'customer.subscription.created',
        message: 'Subscription created with incomplete status - payment method missing',
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        action: 'Contact customer to complete payment setup'
      });
    }
    
    // Check for missing payment method
    if (!subscription.default_payment_method && !subscription.default_source) {
      alerts.push({
        type: 'WARNING',
        event: 'customer.subscription.created',
        message: 'No payment method attached to subscription',
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        action: 'Send payment method setup link'
      });
    }
    
    // Check billing configuration
    if (subscription.collection_method !== 'charge_automatically') {
      alerts.push({
        type: 'WARNING',
        event: 'customer.subscription.created',
        message: 'Subscription not set to charge automatically',
        subscriptionId: subscription.id,
        action: 'Review collection method configuration'
      });
    }
    
    return alerts;
  }

  // Analyze payment failure events
  analyzePaymentFailed(event) {
    const invoice = event.data.object;
    const alerts = [];
    
    console.log('📊 Analyzing payment failure...');
    
    // Check attempt count
    if (invoice.attempt_count >= 3) {
      alerts.push({
        type: 'CRITICAL',
        event: 'invoice.payment_failed',
        message: `Payment failed after ${invoice.attempt_count} attempts`,
        invoiceId: invoice.id,
        customerEmail: invoice.customer_email,
        amount: invoice.amount_due,
        action: 'Immediate customer contact required'
      });
    }
    
    // Check if it's a manual invoice (daily plan)
    if (invoice.billing_reason === 'manual') {
      alerts.push({
        type: 'WARNING',
        event: 'invoice.payment_failed',
        message: 'Manual invoice payment failed - daily plan affected',
        invoiceId: invoice.id,
        customerEmail: invoice.customer_email,
        action: 'Check daily plan access and notify customer'
      });
    }
    
    return alerts;
  }

  // Analyze subscription updates
  analyzeSubscriptionUpdated(event) {
    const subscription = event.data.object;
    const alerts = [];
    
    console.log('📊 Analyzing subscription update...');
    
    // Check for status changes to past_due or unpaid
    if (['past_due', 'unpaid'].includes(subscription.status)) {
      alerts.push({
        type: 'CRITICAL',
        event: 'customer.subscription.updated',
        message: `Subscription status changed to: ${subscription.status}`,
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        action: 'Review payment method and contact customer'
      });
    }
    
    return alerts;
  }

  // Generate alert summary
  generateAlertSummary() {
    console.log('\n🚨 WEBHOOK ALERT SUMMARY');
    console.log('========================');
    
    const criticalAlerts = this.alerts.filter(a => a.type === 'CRITICAL');
    const warningAlerts = this.alerts.filter(a => a.type === 'WARNING');
    
    console.log(`📊 Total Alerts: ${this.alerts.length}`);
    console.log(`🚨 Critical: ${criticalAlerts.length}`);
    console.log(`⚠️  Warnings: ${warningAlerts.length}\n`);
    
    if (criticalAlerts.length > 0) {
      console.log('🚨 CRITICAL ALERTS:');
      criticalAlerts.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.message}`);
        console.log(`   Event: ${alert.event}`);
        console.log(`   Action: ${alert.action}\n`);
      });
    }
    
    if (warningAlerts.length > 0) {
      console.log('⚠️  WARNING ALERTS:');
      warningAlerts.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.message}`);
        console.log(`   Event: ${alert.event}`);
        console.log(`   Action: ${alert.action}\n`);
      });
    }
    
    return {
      total: this.alerts.length,
      critical: criticalAlerts.length,
      warnings: warningAlerts.length,
      alerts: this.alerts
    };
  }

  // Generate customer action items
  generateCustomerActionItems() {
    const customerActions = new Map();
    
    this.alerts.forEach(alert => {
      const customerKey = alert.customerEmail || alert.customerId;
      if (customerKey) {
        if (!customerActions.has(customerKey)) {
          customerActions.set(customerKey, []);
        }
        customerActions.get(customerKey).push(alert);
      }
    });
    
    console.log('👥 CUSTOMER ACTION ITEMS:');
    console.log('=========================');
    
    customerActions.forEach((alerts, customer) => {
      console.log(`\n📧 Customer: ${customer}`);
      alerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. ${alert.action}`);
      });
    });
    
    return customerActions;
  }
}

// Test the monitoring system with the provided webhook events
function testWebhookMonitoring() {
  console.log('🧪 TESTING WEBHOOK MONITORING SYSTEM');
  console.log('====================================\n');
  
  const monitor = new WebhookMonitor();
  
  // Test with subscription created event
  const subscriptionCreatedEvent = {
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_1S0ztbLf1iznKy11kxIDV7F8',
        customer: 'cus_StrDyyZ2GNZ3vZ',
        status: 'incomplete',
        default_payment_method: null,
        default_source: null,
        collection_method: 'charge_automatically'
      }
    }
  };
  
  // Test with payment failed event
  const paymentFailedEvent = {
    type: 'invoice.payment_failed',
    data: {
      object: {
        id: 'in_1S0FNsLf1iznKy116gHh9A3q',
        customer_email: 'universalx0242@gmail.com',
        attempt_count: 4,
        amount_due: 100,
        billing_reason: 'manual'
      }
    }
  };
  
  console.log('1. Testing subscription created monitoring...');
  monitor.monitorWebhookEvent(subscriptionCreatedEvent);
  
  console.log('\n2. Testing payment failed monitoring...');
  monitor.monitorWebhookEvent(paymentFailedEvent);
  
  console.log('\n3. Generating alert summary...');
  const summary = monitor.generateAlertSummary();
  
  console.log('\n4. Generating customer action items...');
  monitor.generateCustomerActionItems();
  
  return summary;
}

// Run the test
const monitoringResults = testWebhookMonitoring();

console.log('\n✅ WEBHOOK MONITORING TEST COMPLETE');
console.log(`📊 Total Issues Detected: ${monitoringResults.total}`);
console.log(`🚨 Critical Issues: ${monitoringResults.critical}`);
console.log(`⚠️  Warning Issues: ${monitoringResults.warnings}`);
