// Test script for daily subscription endpoint
const API_BASE_URL = 'http://localhost:3005';

async function testDailySubscription() {
  try {
    console.log('🧪 Testing Daily Subscription Endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/api/subscription/create-daily-12`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerEmail: 'test@example.com'
      })
    });

    console.log('📡 Response Status:', response.status);
    console.log('📡 Response OK:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success Response:', {
        subscriptionId: data.subscriptionId,
        hasClientSecret: !!data.clientSecret,
        endAt: data.endAt
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
    }
  } catch (error) {
    console.error('💥 Test Failed:', error.message);
  }
}

// Run the test
testDailySubscription();
