import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Shield, Lock, CreditCard, CheckCircle, AlertCircle, X, Star, Users, Target, Building2, Zap, Database, Download, MessageSquare, BarChart3, Users2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

// Load Stripe with correct publishable key
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51RlErgLf1iznKy11bUQ4zowN63lhfc2ElpXY9stuz1XqzBBJcWHHWzczvSUfVAxkFQiOTFfzaDzD38WMzBKCAlJA00lB6CGJwT';

console.log('🔧 Stripe Key Debug:');
console.log('  - Environment variable:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
console.log('  - Using key:', stripePublishableKey ? 'FOUND' : 'NOT FOUND');
console.log('  - Key length:', stripePublishableKey ? stripePublishableKey.length : 0);

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Validate Stripe is loaded
if (!stripePromise) {
  console.error('❌ Failed to load Stripe - check your publishable key');
}

const CheckoutForm = ({ plan, isAnnual, onSuccess, onError, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stripeReady, setStripeReady] = useState(false);

  // Debug Stripe loading
  useEffect(() => {
    console.log('🔧 Stripe Debug Info:');
    console.log('  - Stripe object:', !!stripe);
    console.log('  - Elements object:', !!elements);
    console.log('  - Stripe ready:', stripe?.ready);
    
    if (stripe && elements) {
      setStripeReady(true);
      console.log('✅ Stripe Elements ready!');
    }
  }, [stripe, elements]);

  const amount = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const savings = isAnnual ? (plan.monthlyPrice * 12) - plan.annualPrice : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      const errorMsg = 'Stripe not loaded. Please refresh the page.';
      console.error('❌ Stripe not loaded:', { stripe: !!stripe, elements: !!elements });
      setError(errorMsg);
      onError && onError(errorMsg);
      setLoading(false);
      return;
    }

    // Validate amount
    if (!amount || amount <= 0) {
      const errorMsg = 'Invalid payment amount. Please try again.';
      console.error('❌ Invalid amount:', amount);
      setError(errorMsg);
      onError && onError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      console.log('Creating payment/session...', { amount, planId: plan.id, isAnnual });
      
      // Special daily-12 subscription flow
      let response;
      if (plan.id === 'daily-12') {
        let customerEmail = localStorage.getItem('userEmail') || null;
        if (!customerEmail) {
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            if (u && u.email) customerEmail = u.email;
          } catch (_) {}
        }
        
        // Create payment method first with enhanced billing details
        const cardElement = elements.getElement(CardElement);
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: localStorage.getItem('userName') || 'Customer',
            email: customerEmail,
          }
        });

        if (pmError) {
          console.error('❌ Payment method creation failed:', pmError);
          throw new Error(pmError.message);
        }

        console.log('✅ Payment method created:', paymentMethod.id);
        
        // Now create subscription with payment method
        response = await fetch(`${API_BASE_URL}/api/create-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail,
            customerName: localStorage.getItem('userName') || 'Customer',
            planId: 'daily-12',
            paymentMethodId: paymentMethod.id
          }),
        });
      } else {
        // Default one-time payment intent
        response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            amount,
            planId: plan.id,
            isAnnual,
            customerEmail: localStorage.getItem('userEmail') || null
          }),
        });
      }

      console.log('📡 Payment intent response status:', response.status);
      console.log('📡 Payment intent response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Payment intent error response:', errorData);
        throw new Error(`Payment intent failed: ${response.status} ${errorData}`);
      }

      const responseData = await response.json();
      console.log('Payment intent response data:', responseData);

      // Handle different response types
      if (plan.id === 'daily-12') {
        // Daily-12 subscription response
        if (responseData.success) {
          console.log('✅ Daily-12 subscription created successfully!');
          setError(null);
          onSuccess && onSuccess({
            subscriptionId: responseData.subscriptionId,
            customerId: responseData.customerId,
            status: responseData.status,
            message: responseData.message
          });
          
          console.log('🎉 Daily-12 subscription with auto-cut billing created!');
          // Show success message and close modal
          setTimeout(() => {
            onClose && onClose();
          }, 2000);
          setLoading(false);
          return;
        } else if (responseData.needsPayment || responseData.subscriptionStatus === 'incomplete') {
          // Subscription created but payment incomplete (3D Secure required)
          console.log('⚠️ Subscription created but payment incomplete - 3D Secure required');
          console.log('📊 Subscription status:', responseData.subscriptionStatus);
          setError('⚠️ Payment incomplete: 3D Secure authentication required. Your subscription is created but payment needs to be completed. Please try again or contact support.');
          onError && onError('Payment incomplete: 3D Secure authentication required');
          setLoading(false);
          return;
        } else {
          console.error('❌ Daily-12 subscription creation failed:', responseData.message);
          setError(responseData.message || 'Subscription creation failed');
          onError && onError(responseData.message || 'Subscription creation failed');
          setLoading(false);
          return;
        }
      }

      if (!responseData.clientSecret) {
        throw new Error('No client secret received from server');
      }

      const { clientSecret } = responseData;

      console.log('Confirming payment with client secret...');

      // Confirm payment with enhanced 3D Secure support
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: localStorage.getItem('userName') || 'Customer',
            email: localStorage.getItem('userEmail') || null,
          }
        },
        // Enable 3D Secure redirects
        redirect: 'if_required'
      });

      console.log('💳 Payment confirmation result:', { 
        paymentError: paymentError ? paymentError.message : null, 
        paymentIntent: paymentIntent ? paymentIntent.id : null,
        status: paymentIntent ? paymentIntent.status : null
      });

      if (paymentError) {
        console.error('❌ Payment confirmation error:', paymentError);
        
        // Enhanced error handling for different error types
        let errorMessage = paymentError.message;
        
        if (paymentError.type === 'card_error') {
          switch (paymentError.code) {
            case 'card_declined':
              errorMessage = 'Your card was declined. Please try a different card or contact your bank.';
              break;
            case 'insufficient_funds':
              errorMessage = 'Insufficient funds. Please try a different card.';
              break;
            case 'expired_card':
              errorMessage = 'Your card has expired. Please use a different card.';
              break;
            case 'incorrect_cvc':
              errorMessage = 'Your card\'s security code is incorrect. Please try again.';
              break;
            case 'processing_error':
              errorMessage = 'An error occurred while processing your card. Please try again.';
              break;
            case 'authentication_required':
              errorMessage = 'Your card requires additional authentication. Please complete the verification process.';
              break;
            default:
              errorMessage = `Card error: ${paymentError.message}`;
          }
        } else if (paymentError.type === 'validation_error') {
          errorMessage = 'Please check your card details and try again.';
        } else if (paymentError.type === 'api_error') {
          errorMessage = 'Payment service temporarily unavailable. Please try again in a few minutes.';
        }
        
        setError(errorMessage);
        onError && onError(errorMessage);
      } else {
        console.log('✅ Payment successful:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          status: paymentIntent.status
        });
        
        // For daily-12 plan, show success message and close modal
        if (plan.id === 'daily-12') {
          console.log('🎉 Daily-12 subscription payment completed successfully!');
          // The webhook will handle the subscription activation
          // We just need to show success and close the modal
        }
        
        onSuccess && onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment process error:', err);
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
                {!stripeReady ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-600">Loading payment form...</span>
                  </div>
                ) : (
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
                          iconColor: '#6B7280',
                        },
                        invalid: {
                          color: '#EF4444',
                          iconColor: '#EF4444',
                        },
                        complete: {
                          color: '#10B981',
                          iconColor: '#10B981',
                        },
                      },
                      hidePostalCode: false,
                      disabled: false,
                    }}
                  />
                )}
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
              disabled={!stripe || !elements || loading || !stripeReady}
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
  // Check if Stripe is properly loaded
  if (!stripePromise) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment System Error</h2>
            <p className="text-gray-600 mb-4">
              Stripe payment system is not properly configured. Please check your environment variables.
            </p>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

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