import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Building2, Users, Target, Zap, CreditCard, Calendar, Globe, Gift, Search, Lightbulb } from 'lucide-react';
import StripePayment from '../components/StripePayment';
import { API_BASE_URL } from '../config';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [userCurrentPlan, setUserCurrentPlan] = useState(() => {
    // Check if user is logged in first
    const token = sessionStorage.getItem('token');
    if (!token) {
      return null; // No current plan if not logged in
    }
    // Default to 'free' plan - will be fetched from backend
    return 'free';
  });

  // Fetch pricing plans from API with fallback
  const fetchPricingPlans = async () => {
    try {
      console.log('🔍 Fetching pricing plans from:', `${API_BASE_URL}/api/pricing-plans`);
      console.log('🌐 Current API_BASE_URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/pricing-plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      if (response.ok && isJson) {
        const data = await response.json();
        console.log('📊 Received pricing data:', data);
        console.log('📊 Plans count:', data.plans ? data.plans.length : 0);
        setPricingPlans(data.plans || []);
        setUsingFallback(false);
      } else {
        // Handle non-JSON responses (like 404 HTML pages) gracefully
        if (!isJson) {
          console.warn('⚠️ Server returned non-JSON response (likely HTML 404 page)');
          if (response.status === 404) {
            console.log('🔄 Endpoint not found (404), using fallback default plans');
          }
        } else {
          console.error('❌ API response not ok:', response.status, response.statusText);
        }
        console.log('🔄 Using fallback default plans');
        setPricingPlans(getDefaultPlans());
        setUsingFallback(true);
      }
    } catch (error) {
      // Handle network errors, timeouts, and other exceptions
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout while fetching pricing plans');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Network error: Cannot connect to server');
      } else {
        console.error('❌ Error fetching pricing plans:', error);
      }
      console.log('🔄 Using fallback default plans due to error');
      setPricingPlans(getDefaultPlans());
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  // Default plans fallback
  const getDefaultPlans = () => [
    {
      id: 'free',
      name: "Free",
      description: "Perfect for getting started",
      credits: "5 credits for 5 days only",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "1 Seat included",
        "Get 5 free contacts",
        "Credits expire after 5 days",
        "No BD Insights Access",
        "No BD TRACKER Access",
        "No credit card needed"
      ],
      icon: Gift,
      popular: false,
      buttonText: "Get Started",
      buttonStyle: "outline"
    },
    {
      id: 'basic',
      name: "Basic Plan",
      description: "Ideal for growing businesses",
      credits: "50 contacts/month",
      monthlyPrice: 390,
      annualPrice: 3750,
      planType: 'monthly',
      yearlyPlanType: 'yearly',
      features: [
        "1 Seat included",
        "50 contacts per month",
        "Access to BD Tracker",
        "1 hr. of BD Consulting with Mr. Vik"
      ],
      icon: Users,
      popular: false,
      buttonText: "Choose plan",
      buttonStyle: "primary"
    },
    {
      id: 'premium',
      name: "Premium Plan",
      description: "For advanced users and teams",
      credits: "100 contacts/month",
      monthlyPrice: 790,
      annualPrice: 7585,
      planType: 'monthly',
      yearlyPlanType: 'yearly',
      features: [
        "Everything in Basic, plus:",
        "1 Seat included",
        "100 contacts per month",
        "Access to BD Tracker",
        "Free Deal Comps & VC Contacts",
        "1 hr. of BD Consulting with Mr. Vik"
      ],
      icon: Target,
      popular: true,
      buttonText: "Choose plan",
      buttonStyle: "primary"
    },
    {
      id: 'budget-plan',
      name: "Budget Plan",
      description: "Affordable monthly access with BD Insights",
      credits: "10 credits/month",
      monthlyPrice: 1,
      annualPrice: 6,
      planType: 'monthly',
      yearlyPlanType: 'yearly',
      features: [
        "1 Seat included",
        "10 credits per month",
        "Access to BD Insights",
        "Monthly billing at $1",
        "Annual billing at $6 (50% savings)",
        "Pay by credit/debit card"
      ],
      icon: CreditCard,
      popular: false,
      buttonText: "Choose plan",
      buttonStyle: "primary"
    }
  ];

  // Check login status on component mount
  useEffect(() => {
    fetchPricingPlans();
    
    const token = sessionStorage.getItem('token');
    if (!token) {
      setUserCurrentPlan(null);
    } else {
      // Fetch user plan from backend
      const fetchUserPlan = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserCurrentPlan(data.user?.currentPlan || 'free');
          }
        } catch (error) {
          console.error('Error fetching user plan:', error);
          setUserCurrentPlan('free');
        }
      };
      
      fetchUserPlan();
    }
  }, []);

  // Safety check: prevent payment modal for free plans
  useEffect(() => {
    if (selectedPlan && selectedPlan.id === 'free' && showPayment) {
      console.log('🚨 Safety check: Free plan detected with showPayment=true, resetting...');
      setShowPayment(false);
      setSelectedPlan(null);
    }
  }, [selectedPlan, showPayment]);

  // Icon mapping for plans
  const iconMap = {
    'free': Gift,
    'basic': Users,
    'premium': Target,
    'pro': Target,
    'enterprise': Building2
  };

  // Get the correct icon component
  const getIcon = (plan) => {
    if (plan.icon && typeof plan.icon === 'function') {
      return plan.icon;
    }
    const iconKey = plan.id || plan.name?.toLowerCase();
    return iconMap[iconKey] || Building2;
  };

  // Use dynamic pricing plans from API and ensure features are arrays and icons are properly mapped
  const defaultPlans = getDefaultPlans();
  const plansToUse = pricingPlans.length > 0 ? pricingPlans : defaultPlans;
  
  const plans = plansToUse.map(plan => {
    return {
      ...plan,
      // Map yearlyPrice to annualPrice for consistency
      annualPrice: plan.annualPrice || plan.yearlyPrice || 0,
      // Ensure features are arrays
      features: Array.isArray(plan.features) ? plan.features : (plan.features ? plan.features.split('\n').filter(f => f.trim()) : []),
      // Map icon properly
      icon: getIcon(plan),
      // Ensure popular flag is boolean
      popular: Boolean(plan.popular || plan.isPopular),
      // Ensure button text exists
      buttonText: plan.buttonText || (plan.monthlyPrice === 0 ? 'Get Started' : 'Choose Plan'),
      // Ensure button style exists
      buttonStyle: plan.buttonStyle || (plan.monthlyPrice === 0 ? 'outline' : 'primary')
    };
  });

  const features = [
    {
      title: "Basic & Advanced Search",
      description: "Build BD strategy and find potential partners, & contacts with precision",
      icon: Zap
    },
    {
      title: "Real-time Data",
      description: "Monthly updates with the latest contacts and BD insights",
      icon: Target
    },
    {
      title: "Execute & Track",
      description: "Build your BD strategy, send outreach, and track progress-all in one platform",
      icon: Building2
    },
    {
      title: "BD Insights",
      description: "Tools, tips, deal comps, VC contacts, and conference guides to power your dealmaking",
      icon: Users
    }
  ];

  const handlePlanSelect = async (plan) => {
    console.log('🎯 Pricing handlePlanSelect called with plan:', plan);
    
    // Check if user is logged in
    const token = sessionStorage.getItem('token');
    if (!token) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }
    
    if (plan.id === 'free') {
      console.log('🆓 Free plan selected in Pricing - activating without payment');
      // Handle free plan - activate without payment
      try {
        setPaymentStatus('Activating free plan...');
        
        const response = await fetch(`${API_BASE_URL}/api/auth/activate-free-plan`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserCurrentPlan('free');
          sessionStorage.setItem('userCurrentPlan', 'free');
          setPaymentStatus('Free plan activated successfully!');
          
          // Show success message and redirect to dashboard after a delay
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          const errorData = await response.json();
          setPaymentStatus(`Error: ${errorData.message || 'Failed to activate free plan'}`);
        }
      } catch (error) {
        console.error('Error activating free plan:', error);
        setPaymentStatus('Error: Failed to activate free plan. Please try again.');
      }
      return;
    }
    
    console.log('💳 Paid plan selected in Pricing - showing payment modal');
    // Only show payment modal for paid plans
    if (plan.id !== 'free') {
      setSelectedPlan(plan);
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    // Update user's current plan after successful payment
    if (selectedPlan && selectedPlan.id !== 'free') {
      setUserCurrentPlan(selectedPlan.id);
      sessionStorage.setItem('userCurrentPlan', selectedPlan.id);
      sessionStorage.setItem('paymentCompleted', 'true');
      
      // Set initial credits based on plan
      let credits = 5; // Default
      if (selectedPlan.id === 'monthly') {
        credits = 50;
      } else if (selectedPlan.id === 'annual') {
        credits = 100;
      } else if (selectedPlan.id === 'test') {
        credits = 1;
      }
      sessionStorage.setItem('userCredits', credits.toString());
      
      // Sync with backend and set up subscription
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/auth/update-payment-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentCompleted: true,
            currentPlan: selectedPlan.id,
            currentCredits: credits,
            lastCreditRenewal: new Date().toISOString(),
            nextCreditRenewal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          })
        });
        
        if (response.ok) {
          console.log('Payment status and subscription synced with backend');
        }
      } catch (error) {
        console.error('Error syncing payment status:', error);
      }
    }
    setPaymentStatus('Payment successful! Plan activated.');
    setShowPayment(false);
    console.log('Payment successful:', paymentIntent);
  };

  const handlePaymentError = (error) => {
    setPaymentStatus('Payment failed: ' + error);
    console.error('Payment error:', error);
  };

  const getPlanPrice = (plan) => {
    return isAnnual ? plan.annualPrice : plan.monthlyPrice;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-primary-50/20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-2">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
              Choose the plan that best fits your business needs. All plans include 
              our core features with different usage limits and additional capabilities.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8 bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl shadow-lg border-2 border-primary-300">
              <span className={`text-lg font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Pay Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-300 focus:ring-offset-2 border-2 ${
                  isAnnual 
                    ? 'bg-primary-600 border-primary-600 shadow-lg' 
                    : 'bg-gray-200 border-gray-300 shadow-md'
                }`}
              >
                <span
                  className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    isAnnual ? 'translate-x-12' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-lg font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
                Pay Yearly <span className="text-green-600 font-bold">20% off</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section bg-white -mt-36">
        <div className="container-custom">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading pricing plans...</p>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <p className="text-gray-600">No pricing plans available</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id || plan._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`relative ${plan.popular ? 'lg:scale-105 z-20' : 'z-10'}`}
                    style={{ zIndex: plan.popular ? 20 : 10 }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30" style={{ pointerEvents: 'none' }}>
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1 shadow-lg">
                          <Star className="w-4 h-4" />
                          <span>Most Popular</span>
                        </div>
                      </div>
                    )}
                    
                    <div className={`card p-6 h-full bg-white border-2 ${
                      plan.popular ? 'border-transparent bg-gradient-to-r from-purple-50 to-pink-50 shadow-xl shadow-purple-200/50 ring-2 ring-purple-200' : 
                      plan.name === 'Free' ? 'border-green-200 hover:border-green-300 shadow-lg shadow-green-100/50 hover:ring-2 hover:ring-green-200' :
                      plan.name === 'Basic Plan' ? 'border-blue-200 hover:border-blue-300 shadow-lg shadow-blue-100/50 hover:ring-2 hover:ring-blue-200' :
                      'border-gray-200 hover:border-gray-300 shadow-lg hover:ring-2 hover:ring-gray-200'
                    } rounded-2xl flex flex-col hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden`}
                    style={{ position: 'relative', zIndex: plan.popular ? 15 : 5 }}
                    >
                      {plan.popular && (
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl" style={{ pointerEvents: 'none' }}></div>
                      )}
                      <div className="text-center mb-4 relative z-10">
                        <div className={`w-16 h-16 ${
                          plan.popular ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 
                          plan.name === 'Free' ? 'bg-gradient-to-br from-green-100 to-emerald-100' :
                          plan.name === 'Basic Plan' ? 'bg-gradient-to-br from-blue-100 to-indigo-100' :
                          'bg-gradient-to-br from-gray-100 to-slate-100'
                        } rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                          <plan.icon className={`w-8 h-8 ${
                            plan.popular ? 'text-purple-600' : 
                            plan.name === 'Free' ? 'text-green-600' :
                            plan.name === 'Basic Plan' ? 'text-blue-600' :
                            'text-gray-600'
                          }`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {plan.name}
                        </h3>
                        <p className="text-gray-600 mb-4 text-sm">
                          {plan.description}
                        </p>
                        <div className="mb-4">
                          <div className="text-sm text-gray-600 mb-2">{plan.credits}</div>
                          <div className="text-3xl font-bold text-gray-900">
                            {plan.monthlyPrice === 0 ? 'Free' : `$${isAnnual ? plan.annualPrice : plan.monthlyPrice} USD`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan.monthlyPrice === 0 ? '' : (isAnnual ? '/ yearly' : '/ monthly')}
                          </div>
                          {isAnnual && plan.monthlyPrice > 0 && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              Save ${(plan.monthlyPrice * 12) - plan.annualPrice}/year
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 mb-6 flex-grow relative z-10">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start space-x-3">
                            <Check className={`w-4 h-4 ${plan.popular ? 'text-purple-500' : 'text-green-500'} mt-0.5 flex-shrink-0`} />
                            <span className="text-gray-700 text-sm leading-relaxed">
                              {feature.includes('Mr. Vik') ? (
                                <>
                                  {feature.split('Mr. Vik')[0]}
                                  <a 
                                    href="https://www.linkedin.com/in/gauravvij1?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                                  >
                                    Mr. Vik
                                  </a>
                                  {feature.split('Mr. Vik')[1]}
                                </>
                              ) : (
                                feature
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={userCurrentPlan === plan.id}
                        style={{ 
                          pointerEvents: userCurrentPlan === plan.id ? 'none' : 'auto',
                          position: 'relative',
                          zIndex: 50
                        }}
                        className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 mt-auto cursor-pointer relative z-50 ${
                          (plan.id === 'free' && userCurrentPlan === 'free') || userCurrentPlan === plan.id
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-2 border-green-500 shadow-lg cursor-default'
                            : plan.popular
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg cursor-pointer'
                              : plan.buttonStyle === 'primary' 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg cursor-pointer' 
                                : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 cursor-pointer'
                        }`}
                        onClick={() => handlePlanSelect(plan)}
                      >
                        {(() => {
                          // Free plan logic
                          if (plan.id === 'free') {
                            return userCurrentPlan === 'free' ? 'Current Plan' : 'Get Started';
                          }
                          
                          // Other plans logic
                          if (userCurrentPlan === plan.id) {
                            return 'Current Plan';
                          }
                          
                          // Default: show plan's button text
                          return plan.buttonText;
                        })()}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>


      {/* FAQ Section */}
      <section className="section bg-white -mt-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get answers to common questions about our pricing and services.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I change my plan at any time?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards. All payments are processed securely.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How do free credits work?
              </h3>
              <p className="text-gray-600">
                Free plan users get 5 credits that expire after 5 days . This gives you a chance to test our platform before upgrading to a paid plan.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How often is the database updated?
              </h3>
              <p className="text-gray-600">
                We update contacts and BD insights regularly-at least once a month to keep information current and relevant.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How accurate are the contacts?
              </h3>
              <p className="text-gray-600">
                All contacts are verified, and if any email doesn't work, we credit it back to your account.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Is my data secure?
              </h3>
              <p className="text-gray-600">
                Yes. We use secure, encrypted systems to protect your information and never share your activity with third parties.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-gradient-to-r from-primary-600 to-secondary-600 py-20">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Choose the plan that's right for you and start connecting with the right partners today.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/signup'}
                className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-soft hover:shadow-medium transition-all duration-300 flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/contact-sales'}
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Contact Sales
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {showPayment && selectedPlan && selectedPlan.id !== 'free' && (
        <StripePayment
          plan={selectedPlan}
          isAnnual={isAnnual}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={() => setShowPayment(false)}
        />
      )}
      
      {paymentStatus && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {paymentStatus}
        </div>
      )}

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose <span className="text-orange-500">BioPing</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to accelerate your biotech business development
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Basic & Advanced Search
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Build BD strategy and find potential partners, & contacts with precision.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Real-time Data
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Monthly updates with the latest contacts and BD insights.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Execute & Track
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Build your BD strategy, send outreach, and track progress-all in one platform.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                BD Insights
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Tools, tips, deal comps, VC contacts, and conference guides to power your dealmaking.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing; 
