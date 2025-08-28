const stripe = require('stripe')('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');

async function testStripeConnection() {
  try {
    console.log('🔧 Testing Stripe connection...');
    
    // Test 1: Check if Stripe is initialized
    console.log('✅ Stripe initialized:', !!stripe);
    
    // Test 2: Try to create a test payment intent
    console.log('💳 Creating test payment intent...');
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00
      currency: 'usd',
      metadata: {
        test: 'true',
        description: 'Test payment intent creation'
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    console.log('✅ Test payment intent created successfully!');
    console.log('  - ID:', paymentIntent.id);
    console.log('  - Amount:', paymentIntent.amount);
    console.log('  - Status:', paymentIntent.status);
    console.log('  - Client Secret:', !!paymentIntent.client_secret);
    
    // Test 3: Check account details
    console.log('🏦 Checking account details...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Account retrieved:', {
      id: account.id,
      country: account.country,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled
    });
    
    console.log('\n🎉 All Stripe tests passed! Your payment integration should work now.');
    
  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    console.error('Full error:', error);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('🔑 Authentication failed. Check your secret key.');
    } else if (error.type === 'StripePermissionError') {
      console.error('🚫 Permission denied. Check your API key permissions.');
    } else if (error.type === 'StripeRateLimitError') {
      console.error('⏱️ Rate limit exceeded. Try again later.');
    }
  }
}

// Run the test
testStripeConnection();
