import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Settings, Shield, Eye, Globe, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always true, can't be disabled
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookieConsent');
    if (!cookieChoice) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const preferences = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    setCookiePreferences(preferences);
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const preferences = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    setCookiePreferences(preferences);
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(cookiePreferences));
    setShowBanner(false);
  };

  const handlePreferenceChange = (type) => {
    if (type === 'essential') return; // Essential cookies can't be disabled
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const cookieTypes = [
    {
      key: 'essential',
      title: 'Essential Cookies',
      description: 'Required for the website to function properly',
      icon: Shield,
      disabled: true
    },
    {
      key: 'analytics',
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors use our website',
      icon: Settings,
      disabled: false
    },
    {
      key: 'marketing',
      title: 'Marketing Cookies',
      description: 'Used to deliver personalized advertisements',
      icon: Eye,
      disabled: false
    },
    {
      key: 'preferences',
      title: 'Preference Cookies',
      description: 'Remember your choices and provide enhanced features',
      icon: Globe,
      disabled: false
    }
  ];

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
      >
        <div className="container-custom py-6">
          <div className="max-w-6xl mx-auto">
            {!showDetails ? (
              // Simple Banner
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      We use cookies to enhance your experience
                    </h3>
                    <p className="text-gray-600 text-sm">
                      We use cookies to analyze site traffic, personalize content, and provide social media features. 
                      By continuing to use our site, you consent to our use of cookies.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowDetails(true)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Customize
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-200 text-sm font-medium"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              // Detailed Preferences
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Cookie Preferences
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="grid gap-4">
                  {cookieTypes.map((type) => (
                    <div key={type.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                          <type.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{type.title}</h4>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cookiePreferences[type.key]}
                            onChange={() => handlePreferenceChange(type.key)}
                            disabled={type.disabled}
                            className="sr-only peer"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 ${type.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                        </label>
                        {type.disabled && (
                          <span className="text-xs text-gray-500">Required</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <Link to="/cookie-policy" className="text-orange-600 hover:text-orange-700 underline">
                      Learn more about our cookie policy
                    </Link>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRejectAll}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      Reject All
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-200 text-sm font-medium"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsent; 