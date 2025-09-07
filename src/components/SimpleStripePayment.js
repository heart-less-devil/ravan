import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51RlErgLf1iznKy11bUQ4zowN63lhfc2ElpXY9stuz1XqzBBJcWHHWzczvSUfVAxkFQiOTFfzaDzD38WMzBKCAlJA00lB6CGJwT');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

const SimplePaymentForm = ({ plan, onSuccess, onError, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          name: localStorage.getItem('userName') || 'Customer',
          email: localStorage.getItem('userEmail') || localStorage.getItem('email') || 'customer@example.com',
        }
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      console.log('✅ Payment method created:', paymentMethod.id);

      // Create subscription
      const response = await fetch(`${API_BASE_URL}/api/create-simple-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          customerEmail: localStorage.getItem('userEmail') || localStorage.getItem('email') || 'customer@example.com',
          customerName: localStorage.getItem('userName') || 'Customer',
          planId: plan.id,
          amount: plan.price * 100, // Convert to cents
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Payment failed');
      }

      // Handle 3D Secure if required
      if (result.requires_action) {
        console.log('🔐 3D Secure authentication required');
        
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          result.client_secret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        if (paymentIntent.status !== 'succeeded') {
          throw new Error('Payment not completed');
        }
      }

      console.log('🎉 Payment successful!');
      onSuccess({
        subscriptionId: result.subscriptionId,
        customerId: result.customerId,
        status: 'active',
        message: `🎉 ${plan.name} subscription activated! Daily billing will start automatically.`
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      onError && onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
          <p className="text-gray-600">Secure checkout powered by Stripe</p>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-gray-600">{plan.description}</p>
            <p className="text-2xl font-bold text-blue-600">${plan.price}/day</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div className="border border-gray-300 rounded-lg p-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay $${plan.price}/day`}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <div className="flex justify-center space-x-4 mb-2">
            <span>🔒 SSL Secured</span>
            <span>🛡️ PCI Compliant</span>
            <span>⚡ Stripe Powered</span>
          </div>
          <p>By completing this payment, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

const SimpleStripePayment = ({ plan, onSuccess, onError, onClose }) => {
  return (
    <Elements stripe={stripePromise}>
      <SimplePaymentForm
        plan={plan}
        onSuccess={onSuccess}
        onError={onError}
        onClose={onClose}
      />
    </Elements>
  );
};

export default SimpleStripePayment;
