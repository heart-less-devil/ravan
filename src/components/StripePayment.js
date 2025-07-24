import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Shield, Lock, CreditCard, CheckCircle, AlertCircle, X, Star, Users, Target, Building2, Zap, Database, Download, MessageSquare, BarChart3, Users2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

// Load Stripe with correct publishable key
const stripePromise = loadStripe('pk_live_51RlErgLf1iznKy11bUQ4zowN63lhfc2ElpXY9stuz1XqzBBJcWHHWzczvSUfVAxkFQiOTFfzaDzD38WMzBKCAlJA00lB6CGJwT');

const CheckoutForm = ({ plan, isAnnual, onSuccess, onError, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const amount = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const savings = isAnnual ? (plan.monthlyPrice * 12) - plan.annualPrice : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      return;
    }

    try {
      // Create payment intent for subscription
      const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount,
          planId: plan.id,
          isAnnual,
          customerEmail: localStorage.getItem('userEmail') || null // Include user email if available
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (paymentError) {
        setError(paymentError.message);
        onError && onError(paymentError.message);
      } else {
        onSuccess && onSuccess(paymentIntent);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
      onError && onError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'Test Plan': return Star;
      case 'Starter': return Building2;
      case 'Professional': return Users;
      case 'Enterprise': return Target;
      default: return Star;
    }
  };

  const getPlanFeatures = (planName) => {
    switch (planName) {
      case 'Starter':
        return [
          { icon: Users, text: '5 Contact Searches per month' },
          { icon: Database, text: 'Basic company information' },
          { icon: CreditCard, text: 'No credit card required' },
          { icon: AlertCircle, text: 'Limited features' }
        ];
      case 'Professional':
        return [
          { icon: Users, text: '50 Contact Searches per month' },
          { icon: Database, text: 'Complete company profiles' },
          { icon: Download, text: 'Export to CSV/Excel' },
          { icon: MessageSquare, text: 'Email support' }
        ];
      case 'Enterprise':
        return [
          { icon: Users, text: '100 Contact Searches per month' },
          { icon: Users2, text: 'Team collaboration tools' },
          { icon: BarChart3, text: 'Advanced analytics' },
          { icon: MessageSquare, text: 'Priority support' }
        ];
      default:
        return [];
    }
  };

  const PlanIcon = getPlanIcon(plan.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <PlanIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Complete Payment</h2>
                <p className="text-primary-100 text-sm">Secure checkout powered by Stripe</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Plan Details */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-gray-600">{plan.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${amount}
              </div>
              <div className="text-sm text-gray-500">
                /{isAnnual ? 'year' : 'month'}
              </div>
              {savings > 0 && (
                <div className="text-sm text-green-600 font-medium mt-1">
                  Save ${savings}/year
                </div>
              )}
            </div>
          </div>

          {/* Plan Features */}
          <div className="space-y-2">
            {getPlanFeatures(plan.name).map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <feature.icon className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-gray-600">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Information
              </label>
              <div className="border-2 border-gray-200 rounded-lg p-4 focus-within:border-primary-500 transition-colors">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#374151',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        '::placeholder': {
                          color: '#9CA3AF',
                        },
                      },
                      invalid: {
                        color: '#EF4444',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Security Badges */}
            <div className="flex items-center justify-center space-x-6 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-600" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Lock className="w-4 h-4 text-green-600" />
                <span>PCI Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CreditCard className="w-4 h-4 text-green-600" />
                <span>Stripe Powered</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!stripe || loading}
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay ${amount} {isAnnual ? '/year' : '/month'}</span>
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">
              By completing this payment, you agree to our Terms of Service and Privacy Policy
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
              <span>🔒 256-bit encryption</span>
              <span>•</span>
              <span>💳 Secure payment processing</span>
              <span>•</span>
              <span>🛡️ Fraud protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StripePayment = ({ plan, isAnnual, onSuccess, onError, onClose }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        plan={plan} 
        isAnnual={isAnnual} 
        onSuccess={onSuccess} 
        onError={onError}
        onClose={onClose}
      />
    </Elements>
  );
};

export default StripePayment;