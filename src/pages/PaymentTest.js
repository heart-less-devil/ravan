import React, { useState } from 'react';
import StripePayment from '../components/StripePayment';

const PaymentTest = () => {
  const [amount, setAmount] = useState(99);
  const [paymentStatus, setPaymentStatus] = useState('');

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentStatus('Payment successful!');
    console.log('Payment successful:', paymentIntent);
  };

  const handlePaymentError = (error) => {
    setPaymentStatus('Payment failed: ' + error);
    console.error('Payment error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Payment Test Page
          </h1>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              step="0.01"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Test Card Details
            </h2>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Card Number:</strong> 4242 4242 4242 4242
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Expiry:</strong> Any future date (e.g., 12/25)
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>CVC:</strong> Any 3 digits (e.g., 123)
              </p>
            </div>
          </div>

          <StripePayment
            amount={amount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />

          {paymentStatus && (
            <div className={`mt-6 p-4 rounded-md ${
              paymentStatus.includes('successful') 
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {paymentStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTest; 