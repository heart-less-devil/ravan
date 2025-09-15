import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Building2, Users, Target, Zap, CreditCard, Calendar, Globe } from 'lucide-react';
import StripePayment from '../components/StripePayment';
import { API_BASE_URL } from '../config';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCurrentPlan, setUserCurrentPlan] = useState(() => {
    // Check if user is logged in first
    const token = sessionStorage.getItem('token');
    if (!token) {
      return null; // No current plan if not logged in
    }
    // Default to 'free' plan - will be fetched from backend
    return 'free';
  });

  // Fetch pricing plans from API
  const fetchPricingPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pricing-plans`);
      if (response.ok) {
        const data = await response.json();
        setPricingPlans(data.plans || []);
      } else {
        // Fallback to default plans if API fails
        setPricingPlans(getDefaultPlans());
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      // Fallback to default plans
      setPricingPlans(getDefaultPlans());
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
        "Credits expire after 5 days (including weekends)",
        "No Credit Card Needed",
        "No BD Insights Access"
      ],
      icon: Building2,
      popular: false,
      buttonText: "Get started",
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
        "Pay by credit/debit card",
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
        "1 Seat included",
        "100 contacts per month",
        "Pay by credit/debit card",
        "Access to BD Tracker",
        "2 hrs. of BD Consulting with Mr. Vik"
      ],
      icon: Target,
      popular: true,
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

  // Icon mapping for plans
  const iconMap = {
    'free': Building2,
    'basic': Users,
    'premium': Target,
    'pro': Target,
    'enterprise': Building2
  };

  // Use dynamic pricing plans from API and ensure features are arrays and icons are properly mapped
  const plans = (pricingPlans.length > 0 ? pricingPlans : getDefaultPlans()).map(plan => {
    // Get the correct icon component
    const getIcon = () => {
      if (plan.icon && typeof plan.icon === 'function') {
        return plan.icon;
      }
      const iconKey = plan.id || plan.name?.toLowerCase();
      return iconMap[iconKey] || Building2;
    };

    return {
      ...plan,
      // Map yearlyPrice to annualPrice for consistency
      annualPrice: plan.annualPrice || plan.yearlyPrice || 0,
      // Ensure features are arrays
      features: Array.isArray(plan.features) ? plan.features : (plan.features ? plan.features.split('\n').filter(f => f.trim()) : []),
      // Map icon properly
      icon: getIcon(),
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
      title: "Advanced Search",
      description: "Find companies, contacts, and investors with precision",
      icon: Zap
    },
    {
      title: "Real-time Data",
      description: "Access the most up-to-date information available",
      icon: Target
    },
    {
      title: "Export Options",
      description: "Download your data in multiple formats",
      icon: Building2
    },
    {
      title: "Team Collaboration",
      description: "Share insights and collaborate with your team",
      icon: Users
    }
  ];

  const handlePlanSelect = (plan) => {
    // Check if user is logged in
    const token = sessionStorage.getItem('token');
    if (!token) {
      // Redirect to login if not logged in
      window.location.href = '/login';
      return;
    }
    
    if (plan.id === 'free') {
      // Handle free plan
      setPaymentStatus('Free plan activated!');
      return;
    }
    
    setSelectedPlan(plan);
    setShowPayment(true);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative ${plan.popular ? 'lg:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}
                
                <div className={`card p-8 h-full bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 shadow-large`}>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <plan.icon className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {plan.description}
                    </p>
                                         <div className="mb-4">
                       <div className="text-sm text-gray-600 mb-2">
                         {plan.credits}
                       </div>
                       <div className="text-3xl font-bold text-gray-900">
                         {plan.monthlyPrice === 0 ? 'Free' : `$${isAnnual ? plan.annualPrice : plan.monthlyPrice} USD`}
                       </div>
                       <div className="text-sm text-gray-500">
                         {plan.monthlyPrice === 0 ? '' : (isAnnual ? '/ yearly' : '/ monthly')}
                       </div>
                                               {/* Show yearly savings for Basic and Premium plans */}
                        {isAnnual && (plan.id === 'basic' || plan.id === 'premium') && (
                          <div className="mt-2">
                            <span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              Save ${plan.id === 'basic' ? '930' : '1895'}/year
                            </span>
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-accent-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-base">
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
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      userCurrentPlan === plan.id
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-2 border-green-500 shadow-lg'
                        : plan.buttonStyle === 'primary' 
                          ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-soft hover:shadow-medium' 
                          : 'border-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300'
                    }`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    {userCurrentPlan === plan.id 
                      ? 'Current Plan' 
                      : plan.buttonText
                    }
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-primary-50/20 -mt-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="section-title">
              All Plans Include
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every plan comes with our core features designed to help you find 
              and connect with the right business opportunities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
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
                We accept all major credit cards, debit cards, and bank transfers. All payments are processed securely.
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
                Free plan users get 5 credits that expire after 5 days (including weekends). This gives you a chance to test our platform before upgrading to a paid plan.
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
                className="bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-soft hover:shadow-medium transition-all duration-300 flex items-center space-x-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Contact Sales
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {showPayment && selectedPlan && (
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
    </div>
  );
};

export default Pricing; 
