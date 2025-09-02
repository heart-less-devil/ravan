const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || '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');

async function testPaymentIntentCreation() {
  console.log('🧪 Testing PaymentIntent creation with fixed configuration...');
  
  try {
    // Test 1: Create a simple payment intent
    console.log('\n1. Testing basic payment intent creation...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00
      currency: 'usd',
      metadata: {
        planId: 'test',
        test: 'true'
      },
      payment_method_types: ['card'],
      confirm: false,
    });
    
    console.log('✅ PaymentIntent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      paymentMethodTypes: paymentIntent.payment_method_types,
      hasClientSecret: !!paymentIntent.client_secret
    });
    
    // Test 2: Create a customer and payment intent
    console.log('\n2. Testing payment intent with customer...');
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      metadata: { test: 'true' }
    });
    
    const customerPaymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      customer: customer.id,
      metadata: {
        planId: 'daily-12',
        customerEmail: 'test@example.com',
        test: 'true'
      },
      payment_method_types: ['card'],
      confirm: false,
    });
    
    console.log('✅ Customer PaymentIntent created successfully:', {
      id: customerPaymentIntent.id,
      customer: customerPaymentIntent.customer,
      status: customerPaymentIntent.status,
      paymentMethodTypes: customerPaymentIntent.payment_method_types
    });
    
    // Test 3: Test subscription creation
    console.log('\n3. Testing subscription creation...');
    
    // Create a test product and price
    const product = await stripe.products.create({
      name: 'Test Daily Plan',
      metadata: { test: 'true' }
    });
    
    const price = await stripe.prices.create({
      unit_amount: 100,
      currency: 'usd',
      recurring: { interval: 'day' },
      product: product.id,
      metadata: { test: 'true' }
    });
    
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { 
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card']
      },
      metadata: { test: 'true' }
    });
    
    console.log('✅ Subscription created successfully:', {
      id: subscription.id,
      status: subscription.status,
      customer: subscription.customer
    });
    
    console.log('\n🎉 All tests passed! Payment system is working correctly.');
    
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    await stripe.subscriptions.cancel(subscription.id);
    await stripe.prices.update(price.id, { active: false });
    await stripe.products.update(product.id, { active: false });
    await stripe.customers.del(customer.id);
    
    console.log('✅ Test data cleaned up successfully.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testPaymentIntentCreation();
