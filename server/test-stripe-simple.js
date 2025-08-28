const stripe = require('stripe')('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');

console.log('🔧 Testing Stripe connection...');
console.log('Stripe initialized:', !!stripe);

try {
  // Test payment intent creation
  stripe.paymentIntents.create({
    amount: 100,
    currency: 'usd',
    metadata: { test: 'true' }
  }).then(intent => {
    console.log('✅ Payment intent created:', intent.id);
    console.log('Amount:', intent.amount);
    console.log('Status:', intent.status);
  }).catch(err => {
    console.error('❌ Error:', err.message);
  });
} catch (err) {
  console.error('❌ Stripe error:', err.message);
}
