import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';

const TrialExpired = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '$390',
      period: '/month',
      features: [
        '1 Seat included',
        '50 contacts per month',
        'AI Deal Scanner',
        'Access to BD Tracker',
        '1 hr. of BD Consulting with Mr. Vik'
      ],
      buttonText: 'Choose Basic Plan',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '$790',
      period: '/month',
      features: [
        'Everything in Basic, plus:',
        '1 Seat included',
        '100 contacts per month',
        'AI Deal Scanner',
        'Access to BD Tracker',
        'Free Deal Comps & VC Contacts',
        '1 hr. of BD Consulting with Mr. Vik'
      ],
      buttonText: 'Choose Premium Plan',
      popular: true
    }
  ];

  const handlePlanSelect = (planId) => {
    // Store email in sessionStorage for pricing page
    if (email) {
      sessionStorage.setItem('trialExpiredEmail', email);
    }
    // Navigate to pricing page
    navigate('/pricing', { state: { selectedPlan: planId } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full"
      >
        {/* Main Message Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Clock className="w-10 h-10 text-orange-600" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your Trial Period is Over
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Thank you for trying BioPing! Your 5-day free trial has ended. 
            To continue accessing all features, please choose a paid plan below.
          </p>

          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 inline-block">
              <p className="text-sm text-blue-800">
                <strong>Account:</strong> {email}
              </p>
            </div>
          )}
        </div>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={`bg-white rounded-2xl shadow-lg border-2 ${
                plan.popular 
                  ? 'border-purple-500 ring-2 ring-purple-200' 
                  : 'border-gray-200'
              } p-6 hover:shadow-xl transition-all duration-300`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-600 ml-2">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelect(plan.id)}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                } flex items-center justify-center gap-2`}
              >
                {plan.buttonText}
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help choosing a plan?{' '}
            <a href="/contact-sales" className="text-blue-600 hover:text-blue-800 font-medium">
              Contact Sales
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TrialExpired;

