const { syncOldPayments } = require('./sync-old-payments');

console.log('🚀 Starting payment sync test...');

syncOldPayments()
  .then(() => {
    console.log('✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
