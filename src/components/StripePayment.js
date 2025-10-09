import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Shield, Lock, CreditCard, CheckCircle, AlertCircle, X, Star, Users, Target, Building2, Zap, Database, Download, MessageSquare, BarChart3, Users2 } from 'lucide-react';
import { API_BASE_URL, STRIPE_PUBLISHABLE_KEY } from '../config';

// Load Stripe with correct publishable key
const stripePublishableKey = STRIPE_PUBLISHABLE_KEY;

console.log('🔧 Stripe Key Debug:');
console.log('  - Environment variable:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
console.log('  - Using key:', stripePublishableKey ? 'FOUND' : 'NOT FOUND');
console.log('  - Key length:', stripePublishableKey ? stripePublishableKey.length : 0);

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Validate Stripe is loaded
if (!stripePromise) {
  console.error('❌ Failed to load Stripe - check your publishable key');
  console.error('🔧 To fix this issue:');
  console.error('  1. Create a .env file in your project root');
  console.error('  2. Add: REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here');
  console.error('  3. Replace with your actual Stripe test/live key');
  console.error('  4. Restart your development server');
}

// Utility function to get user email from backend
const getUserEmail = async () => {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) return null;
    
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user?.email || null;
    }
  } catch (error) {
    console.error('Error fetching user email:', error);
  }
  
  return null;
};

// Enhanced 3D Secure Detection Utility
const detect3DSecureRequirement = (subscriptionData) => {
  console.log('🔍 3D Secure Detection Utility Starting...');
  
  const detection = {
    requires3DSecure: false,
    hasClientSecret: false,
    hasPaymentIntent: false,
    status: 'unknown',
    details: {}
  };
  
  // Check for 3D Secure requirement
  if (subscriptionData.requires_action && subscriptionData.client_secret) {
    detection.requires3DSecure = true;
    detection.hasClientSecret = true;
    detection.status = 'requires_3d_secure';
    detection.details = {
      subscriptionId: subscriptionData.subscriptionId,
      customerId: subscriptionData.customerId,
      paymentIntentId: subscriptionData.paymentIntentId,
      invoiceId: subscriptionData.invoiceId,
      clientSecret: subscriptionData.client_secret.substring(0, 20) + '...'
    };
  } else if (subscriptionData.authentication_required) {
    detection.requires3DSecure = true;
    detection.status = 'authentication_required';
    detection.details = {
      message: 'Authentication required but client secret missing'
    };
  } else if (subscriptionData.status === 'incomplete') {
    detection.status = 'incomplete';
    detection.details = {
      message: 'Subscription incomplete but no 3D Secure requirement detected'
    };
  } else if (subscriptionData.status === 'active') {
    detection.status = 'active';
    detection.details = {
      message: 'Subscription is already active'
    };
  }
  
  console.log('🔍 3D Secure Detection Result:', detection);
  return detection;
};

const CheckoutForm = ({ plan, isAnnual, onSuccess, onError, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Track component mount status
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Debug Stripe loading
  useEffect(() => {
    if (!isMounted) return;
    
    console.log('🔧 Stripe Debug Info:');
    console.log('  - Stripe object:', !!stripe);
    console.log('  - Elements object:', !!elements);
    console.log('  - Stripe ready:', stripe?.ready);
    
    if (stripe && elements) {
      setStripeReady(true);
      console.log('✅ Stripe Elements ready!');
    }
  }, [stripe, elements, isMounted]);

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
      if (isMounted && onError) {
        try {
          onError(errorMsg);
        } catch (err) {
          console.error('Error calling onError callback:', err);
        }
      }
      setLoading(false);
      return;
    }

    // Validate amount
    if (!amount || amount <= 0) {
      const errorMsg = 'Invalid payment amount. Free plans should not require payment processing.';
      console.error('❌ Invalid amount:', amount);
      setError(errorMsg);
      if (isMounted && onError) {
        try {
          onError(errorMsg);
        } catch (err) {
          console.error('Error calling onError callback:', err);
        }
      }
      setLoading(false);
      return;
    }

    try {
      console.log('Creating payment/session...', { amount, planId: plan.id, isAnnual });
      
      // Special daily-12 subscription flow
      let response;
      if (plan.id === 'daily-12') {
        let customerEmail = getUserEmail();
        if (!customerEmail) {
          console.log('⚠️ No valid user email found, using fallback');
          customerEmail = null;
        }
        
        // Create payment method first with enhanced billing details
        const cardElement = elements.getElement(CardElement);
        
        if (!cardElement) {
          console.error('❌ Card element not found');
          throw new Error('Card element not found. Please refresh the page and try again.');
        }
        
        console.log('🔄 Creating payment method...');
        const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: sessionStorage.getItem('userName') || 'Customer',
            email: customerEmail,
          }
        });

        if (pmError) {
          console.error('❌ Payment method creation failed:', pmError);
          console.error('❌ Payment method error details:', {
            type: pmError.type,
            code: pmError.code,
            message: pmError.message,
            decline_code: pmError.decline_code
          });
          
          // Enhanced error handling for payment method creation
          let errorMessage = pmError.message;
          
          if (pmError.type === 'card_error') {
            switch (pmError.code) {
              case 'card_declined':
                if (pmError.decline_code) {
                  switch (pmError.decline_code) {
                    case 'insufficient_funds':
                      errorMessage = '❌ Insufficient funds in your account. Please check your balance or try a different card.';
                      break;
                    case 'card_not_supported':
                      errorMessage = '❌ This card type is not supported. Please try a different card.';
                      break;
                    case 'currency_not_supported':
                      errorMessage = '❌ This card does not support USD transactions. Please try a different card.';
                      break;
                    case 'fraudulent':
                      errorMessage = '❌ This transaction was flagged as potentially fraudulent by your bank. Please contact your bank.';
                      break;
                    case 'generic_decline':
                      errorMessage = '❌ Your bank declined this transaction. Please contact your bank or try a different card.';
                      break;
                    default:
                      errorMessage = `❌ Your bank declined this transaction (${pmError.decline_code}). Please contact your bank or try a different card.`;
                  }
                } else {
                  errorMessage = '❌ Your card was declined by your bank. Please contact your bank or try a different card.';
                }
                break;
              case 'incorrect_number':
                errorMessage = '❌ Your card number is incorrect. Please check and try again.';
                break;
              case 'invalid_expiry_month':
                errorMessage = '❌ Your card\'s expiry month is invalid. Please check and try again.';
                break;
              case 'invalid_expiry_year':
                errorMessage = '❌ Your card\'s expiry year is invalid. Please check and try again.';
                break;
              case 'incorrect_cvc':
                errorMessage = '❌ Your card\'s security code (CVC) is incorrect. Please check and try again.';
                break;
              case 'expired_card':
                errorMessage = '❌ Your card has expired. Please use a different card.';
                break;
              default:
                errorMessage = `❌ Card error: ${pmError.message}. Please check your card details and try again.`;
            }
          } else if (pmError.type === 'validation_error') {
            errorMessage = '❌ Please check your card details and try again.';
          }
          
          setError(errorMessage);
          onError && onError(errorMessage);
          setLoading(false);
          return;
        }

        if (!paymentMethod) {
          console.error('❌ Payment method not created');
          throw new Error('Payment method creation failed. Please try again.');
        }

        console.log('✅ Payment method created successfully:', paymentMethod.id);
        console.log('📊 Payment method details:', {
          id: paymentMethod.id,
          type: paymentMethod.type,
          card: paymentMethod.card ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            exp_month: paymentMethod.card.exp_month,
            exp_year: paymentMethod.card.exp_year
          } : 'No card details'
        });
        
        // Now create subscription with payment method
        console.log('🔄 Creating subscription with payment method...');
        console.log('📊 Subscription request data:', {
          customerEmail,
          customerName: sessionStorage.getItem('userName') || 'Customer',
          planId: 'daily-12',
          paymentMethodId: paymentMethod.id
        });
        
        response = await fetch(`${API_BASE_URL}/api/create-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail,
            customerName: sessionStorage.getItem('userName') || 'Customer',
            planId: 'daily-12',
            paymentMethodId: paymentMethod.id
          }),
        });
        
        console.log('📡 Subscription response received:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });

        console.log('📡 Subscription response status:', response.status);
        console.log('📡 Subscription response ok:', response.ok);

        // Parse subscription response
        let subscriptionData;
        try {
          subscriptionData = await response.json();
        } catch (parseError) {
          console.error('❌ Error parsing subscription response:', parseError);
          throw new Error(`Failed to parse subscription response: ${response.status}`);
        }

        if (!response.ok) {
          console.error('❌ Subscription error response status:', response.status);
          console.error('❌ Subscription error response:', subscriptionData);
          
          // Check if it's a 3D Secure authentication requirement
          if (subscriptionData.requires_action && subscriptionData.client_secret) {
            console.log('🔐 3D Secure authentication required - handling...');
            // Don't throw error, handle 3D Secure below
          } else if (subscriptionData.message && subscriptionData.message.includes('3D Secure')) {
            console.log('🔐 3D Secure authentication required from error message');
            // Don't throw error, handle 3D Secure below
          } else {
            throw new Error(subscriptionData.message || `Subscription failed: ${response.status}`);
          }
        }
        
        // Also check for 3D Secure in successful responses
        if (response.ok && subscriptionData.requires_action && subscriptionData.client_secret) {
          console.log('🔐 3D Secure authentication required in successful response');
        }
        
        // Enhanced 3D Secure Detection and Authentication
        const detection = detect3DSecureRequirement(subscriptionData);
        
        // Check for 3D Secure requirement in multiple ways
        const requires3DSecure = (
          (subscriptionData.requires_action && subscriptionData.client_secret) ||
          (subscriptionData.message && subscriptionData.message.includes('3D Secure')) ||
          (subscriptionData.authentication_required) ||
          (detection.requires3DSecure && detection.hasClientSecret)
        );
        
        if (requires3DSecure && subscriptionData.client_secret) {
          console.log('🔐 3D Secure Authentication Required!');
          console.log('🔍 Detection Details:');
          console.log('  - Subscription ID:', subscriptionData.subscriptionId);
          console.log('  - Customer ID:', subscriptionData.customerId);
          console.log('  - Payment Intent ID:', subscriptionData.paymentIntentId);
          console.log('  - Invoice ID:', subscriptionData.invoiceId);
          console.log('  - Client Secret Available:', !!subscriptionData.client_secret);
          console.log('  - Authentication Required:', subscriptionData.authentication_required);
          console.log('  - Next Action:', subscriptionData.next_action);
          
          try {
            console.log('🔄 Starting 3D Secure Authentication Process...');
            console.log('🔑 Using client secret:', subscriptionData.client_secret.substring(0, 20) + '...');
            
            // Show user that 3D Secure is starting
            setError('🔐 3D Secure authentication required. Please complete the verification process...');
            
            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
              subscriptionData.client_secret
            );
            
            if (confirmError) {
              console.error('❌ 3D Secure authentication failed:', confirmError);
              
              // Enhanced 3D Secure error handling
              let errorMessage = `3D Secure authentication failed: ${confirmError.message}`;
              
              if (confirmError.type === 'card_error') {
                switch (confirmError.code) {
                  case 'card_declined':
                    if (confirmError.decline_code) {
                      switch (confirmError.decline_code) {
                        case 'insufficient_funds':
                          errorMessage = '❌ 3D Secure failed: Insufficient funds in your account. Please check your balance.';
                          break;
                        case 'fraudulent':
                          errorMessage = '❌ 3D Secure failed: Transaction flagged as fraudulent by your bank.';
                          break;
                        case 'generic_decline':
                          errorMessage = '❌ 3D Secure failed: Your bank declined the authentication.';
                          break;
                        default:
                          errorMessage = `❌ 3D Secure failed: ${confirmError.decline_code}. Please contact your bank.`;
                      }
                    } else {
                      errorMessage = '❌ 3D Secure authentication was declined by your bank.';
                    }
                    break;
                  case 'authentication_required':
                    errorMessage = '🔐 3D Secure authentication is required. Please complete the verification process.';
                    break;
                  default:
                    errorMessage = `❌ 3D Secure authentication failed: ${confirmError.message}`;
                }
              }
              
              setError(errorMessage);
              onError && onError(errorMessage);
              setLoading(false);
              return;
            }
            
            console.log('📊 Payment Intent status after 3D Secure:', paymentIntent.status);
            console.log('📊 Payment Intent details:', paymentIntent);
            
            if (paymentIntent.status === 'succeeded') {
              console.log('✅ 3D Secure authentication successful!');
              console.log('Payment Intent after 3D Secure:', paymentIntent);
              
              // After successful 3D Secure, show success
              console.log('🎉 Subscription created successfully with 3D Secure!');
              setLoading(false);
              onSuccess({
                subscriptionId: subscriptionData.subscriptionId,
                customerId: subscriptionData.customerId,
                status: 'active',
                paymentIntent: paymentIntent,
                message: '🎉 Subscription created successfully! Daily billing will start automatically. Your card has been verified with 3D Secure.'
              });
              return;
            } else if (paymentIntent.status === 'processing') {
              console.log('⏳ Payment is processing after 3D Secure');
              setLoading(false);
              onSuccess({
                subscriptionId: subscriptionData.subscriptionId,
                customerId: subscriptionData.customerId,
                status: 'processing',
                paymentIntent: paymentIntent,
                message: '🎉 Subscription created successfully! Payment is processing. You will receive confirmation once completed.'
              });
              return;
            } else {
              console.error('❌ Payment not completed after 3D Secure:', paymentIntent.status);
              setError(`Payment not completed. Status: ${paymentIntent.status}`);
              onError && onError(`Payment not completed. Status: ${paymentIntent.status}`);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('❌ 3D Secure authentication error:', error);
            setError(`3D Secure authentication failed: ${error.message}`);
            onError && onError(error.message);
            setLoading(false);
            return;
          }
        } else if (subscriptionData.authentication_required || (subscriptionData.message && subscriptionData.message.includes('3D Secure'))) {
          console.log('🔐 Authentication required but no client secret available');
          console.log('📊 Subscription data for debugging:', subscriptionData);
          
          // Try to get client secret from different possible locations
          const possibleClientSecret = subscriptionData.client_secret || 
                                     subscriptionData.paymentIntent?.client_secret ||
                                     subscriptionData.latest_invoice?.payment_intent?.client_secret;
          
          if (possibleClientSecret) {
            console.log('🔑 Found client secret in alternative location, retrying 3D Secure...');
            subscriptionData.client_secret = possibleClientSecret;
            subscriptionData.requires_action = true;
            
            // Retry 3D Secure authentication
            try {
              console.log('🔄 Retrying 3D Secure authentication...');
              const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(possibleClientSecret);
              
              if (confirmError) {
                console.error('❌ 3D Secure authentication failed on retry:', confirmError);
                
                // Enhanced error handling for retry
                let errorMessage = `3D Secure authentication failed: ${confirmError.message}`;
                
                if (confirmError.type === 'card_error') {
                  switch (confirmError.code) {
                    case 'card_declined':
                      if (confirmError.decline_code) {
                        switch (confirmError.decline_code) {
                          case 'insufficient_funds':
                            errorMessage = '❌ Payment failed: Insufficient funds in your account. Please check your balance or try a different card.';
                            break;
                          case 'fraudulent':
                            errorMessage = '❌ Payment failed: Transaction flagged as fraudulent by your bank. Please contact your bank.';
                            break;
                          case 'generic_decline':
                            errorMessage = '❌ Payment failed: Your bank declined this transaction. Please contact your bank or try a different card.';
                            break;
                          default:
                            errorMessage = `❌ Payment failed: ${confirmError.decline_code}. Please contact your bank.`;
                        }
                      } else {
                        errorMessage = '❌ Payment failed: Your bank declined this transaction.';
                      }
                      break;
                    default:
                      errorMessage = `❌ Payment failed: ${confirmError.message}`;
                  }
                }
                
                setError(errorMessage);
                onError && onError(errorMessage);
                setLoading(false);
                return;
              }
              
              if (paymentIntent.status === 'succeeded') {
                console.log('✅ 3D Secure authentication successful on retry!');
                setLoading(false);
                onSuccess({
                  subscriptionId: subscriptionData.subscriptionId,
                  customerId: subscriptionData.customerId,
                  status: 'active',
                  paymentIntent: paymentIntent,
                  message: '🎉 Subscription created successfully! Daily billing will start automatically. Your card has been verified with 3D Secure.'
                });
                return;
              }
            } catch (error) {
              console.error('❌ 3D Secure retry failed:', error);
            }
          }
          
          setError('🔐 3D Secure authentication required. Your bank needs to verify this payment. Please check for a popup window or complete the verification process.');
          onError && onError('3D Secure authentication required - please complete bank verification');
          setLoading(false);
          return;
        } else {
          // Subscription created successfully without 3D Secure
          console.log('✅ Subscription created successfully without 3D Secure');
          console.log('📊 Subscription data:', subscriptionData);
          
          setLoading(false);
          onSuccess({
            subscriptionId: subscriptionData.subscriptionId,
            customerId: subscriptionData.customerId,
            status: subscriptionData.status || 'active',
            message: '🎉 Subscription created successfully! Your card is saved and daily billing will start automatically. You will be charged $1.00 daily for 12 days.'
          });
          return;
        }
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
            customerEmail: sessionStorage.getItem('userEmail') || null
          }),
        });
      }

      console.log('📡 Payment intent response status:', response.status);
      console.log('📡 Payment intent response ok:', response.ok);

      // Parse response once
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        throw new Error(`Failed to parse server response: ${response.status}`);
      }

      if (!response.ok) {
        console.error('❌ Payment intent error response status:', response.status);
        console.error('❌ Payment intent error response:', responseData);
        throw new Error(responseData.message || `Payment failed: ${response.status}`);
      }
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
            name: sessionStorage.getItem('userName') || 'Customer',
            email: sessionStorage.getItem('userEmail') || null,
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
          console.log('💳 Card Error Details:', {
            code: paymentError.code,
            message: paymentError.message,
            decline_code: paymentError.decline_code,
            type: paymentError.type
          });
          
          switch (paymentError.code) {
            case 'card_declined':
              // Check for specific decline codes from bank
              if (paymentError.decline_code) {
                switch (paymentError.decline_code) {
                  case 'insufficient_funds':
                    errorMessage = '❌ Insufficient funds in your account. Please check your balance or try a different card.';
                    break;
                  case 'card_not_supported':
                    errorMessage = '❌ This card type is not supported. Please try a different card.';
                    break;
                  case 'currency_not_supported':
                    errorMessage = '❌ This card does not support USD transactions. Please try a different card.';
                    break;
                  case 'duplicate_transaction':
                    errorMessage = '❌ This transaction was already processed. Please try again in a few minutes.';
                    break;
                  case 'fraudulent':
                    errorMessage = '❌ This transaction was flagged as potentially fraudulent by your bank. Please contact your bank.';
                    break;
                  case 'generic_decline':
                    errorMessage = '❌ Your bank declined this transaction. Please contact your bank or try a different card.';
                    break;
                  case 'lost_card':
                    errorMessage = '❌ This card has been reported as lost. Please contact your bank.';
                    break;
                  case 'merchant_blacklist':
                    errorMessage = '❌ Your bank has blocked this merchant. Please contact your bank.';
                    break;
                  case 'new_account_information_available':
                    errorMessage = '❌ Please update your card information with your bank.';
                    break;
                  case 'no_action_taken':
                    errorMessage = '❌ Your bank did not process this transaction. Please try again.';
                    break;
                  case 'not_permitted':
                    errorMessage = '❌ This transaction is not permitted on your card. Please contact your bank.';
                    break;
                  case 'pickup_card':
                    errorMessage = '❌ Please contact your bank immediately. Your card may have been compromised.';
                    break;
                  case 'pin_try_exceeded':
                    errorMessage = '❌ Too many incorrect PIN attempts. Please contact your bank.';
                    break;
                  case 'restricted_card':
                    errorMessage = '❌ This card has restrictions. Please contact your bank.';
                    break;
                  case 'revocation_of_all_authorizations':
                    errorMessage = '❌ All authorizations for this card have been revoked. Please contact your bank.';
                    break;
                  case 'security_violation':
                    errorMessage = '❌ Security violation detected. Please contact your bank.';
                    break;
                  case 'service_not_allowed':
                    errorMessage = '❌ This service is not allowed on your card. Please contact your bank.';
                    break;
                  case 'stolen_card':
                    errorMessage = '❌ This card has been reported as stolen. Please contact your bank.';
                    break;
                  case 'stop_payment_order':
                    errorMessage = '❌ A stop payment order has been placed on this card. Please contact your bank.';
                    break;
                  case 'testmode_decline':
                    errorMessage = '❌ This is a test card and cannot be used for real transactions.';
                    break;
                  case 'transaction_not_allowed':
                    errorMessage = '❌ This type of transaction is not allowed on your card. Please contact your bank.';
                    break;
                  case 'try_again_later':
                    errorMessage = '❌ Please try again later. Your bank is temporarily unavailable.';
                    break;
                  case 'withdrawal_count_limit_exceeded':
                    errorMessage = '❌ You have exceeded your withdrawal limit. Please contact your bank.';
                    break;
                  default:
                    errorMessage = `❌ Your bank declined this transaction (${paymentError.decline_code}). Please contact your bank or try a different card.`;
                }
              } else {
                errorMessage = '❌ Your card was declined by your bank. Please contact your bank or try a different card.';
              }
              break;
            case 'insufficient_funds':
              errorMessage = '❌ Insufficient funds in your account. Please check your balance or try a different card.';
              break;
            case 'expired_card':
              errorMessage = '❌ Your card has expired. Please use a different card.';
              break;
            case 'incorrect_cvc':
              errorMessage = '❌ Your card\'s security code (CVC) is incorrect. Please check and try again.';
              break;
            case 'incorrect_number':
              errorMessage = '❌ Your card number is incorrect. Please check and try again.';
              break;
            case 'invalid_expiry_month':
              errorMessage = '❌ Your card\'s expiry month is invalid. Please check and try again.';
              break;
            case 'invalid_expiry_year':
              errorMessage = '❌ Your card\'s expiry year is invalid. Please check and try again.';
              break;
            case 'processing_error':
              errorMessage = '❌ An error occurred while processing your card. Please try again or contact your bank.';
              break;
            case 'authentication_required':
              errorMessage = '🔐 Your card requires additional authentication. Please complete the verification process.';
              break;
            default:
              errorMessage = `❌ Card error: ${paymentError.message}. Please contact your bank or try a different card.`;
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
          onSuccess && onSuccess({
            ...paymentIntent,
            message: '🎉 Subscription created successfully! Daily billing will start automatically. You will be charged $1.00 daily for 12 days.'
          });
          return;
        }
        
        onSuccess && onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment process error:', err);
      
      // Enhanced error handling for different error types
      let errorMessage = 'Payment failed. Please try again.';
      
      if (err.name === 'NetworkError' || err.message.includes('fetch')) {
        errorMessage = '❌ Network error. Please check your internet connection and try again.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = '❌ Server connection failed. Please try again in a few minutes.';
      } else if (err.message.includes('timeout')) {
        errorMessage = '❌ Request timeout. Please try again.';
      } else if (err.message.includes('CORS')) {
        errorMessage = '❌ Connection error. Please refresh the page and try again.';
      } else if (err.message) {
        errorMessage = `❌ ${err.message}`;
      }
      
      setError(errorMessage);
      onError && onError(errorMessage);
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

            {/* 3D Secure Status Indicator */}
            {loading && error && error.includes('3D Secure') && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">3D Secure Authentication</span>
                </div>
                <div className="text-sm">
                  <p>Your bank requires additional verification for this payment.</p>
                  <p className="mt-1">Please complete the authentication process in the popup window.</p>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Waiting for authentication...</span>
                </div>
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
  // Check if this is a free plan - should not render payment modal
  if (plan && plan.id === 'free') {
    console.log('❌ StripePayment component should not be used for free plans');
    onError && onError('Free plans should not require payment processing');
    onClose && onClose();
    return null;
  }

  // Check if Stripe is properly loaded
  if (!stripePromise) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment System Configuration Error</h2>
            <p className="text-gray-600 mb-4">
              Stripe payment system is not properly configured. The Stripe publishable key is missing or invalid.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
              <h3 className="font-semibold text-gray-800 mb-2">To fix this issue:</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Create a <code className="bg-gray-200 px-1 rounded">.env</code> file in your project root</li>
                <li>Add: <code className="bg-gray-200 px-1 rounded">REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here</code></li>
                <li>Replace with your actual Stripe test/live key</li>
                <li>Restart your development server</li>
              </ol>
            </div>
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
