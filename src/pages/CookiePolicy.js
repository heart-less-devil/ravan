import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Cookie, Settings, Eye, Globe, Clock, CheckCircle } from 'lucide-react';

const CookiePolicy = () => {
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  const handleManageCookies = () => {
    // Clear existing cookie consent to force banner to show
    localStorage.removeItem('cookieConsent');
    sessionStorage.removeItem('cookieConsent');
    // Trigger a page reload to show the cookie banner
    window.location.reload();
  };

  const cookieTypes = [
    {
      title: "Essential Cookies",
      description: "These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website.",
      examples: ["Authentication cookies", "Session management", "Security features"],
      icon: Shield
    },
    {
      title: "Analytics Cookies",
      description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.",
      examples: ["Google Analytics", "Page view tracking", "User behavior analysis"],
      icon: Settings
    },
    {
      title: "Marketing Cookies",
      description: "These cookies are used to track visitors across websites to display relevant and engaging advertisements.",
      examples: ["Social media pixels", "Advertising networks", "Retargeting"],
      icon: Eye
    },
    {
      title: "Preference Cookies",
      description: "These cookies allow the website to remember choices you make and provide enhanced, more personal features.",
      examples: ["Language preferences", "Theme settings", "Customized content"],
      icon: Globe
    }
  ];

  const userRights = [
    "Right to be informed about cookie usage",
    "Right to consent before cookies are set",
    "Right to withdraw consent at any time",
    "Right to access and control your data",
    "Right to delete cookies from your browser",
    "Right to opt-out of non-essential cookies"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center space-x-3">
              <img 
                src="/dfgjk.webp" 
                alt="BioPing Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  console.log('Logo failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container-custom py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-orange-600 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <Cookie className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          >
            Cookie Policy – TheBioPing.com
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center space-x-4 text-gray-600 mb-8"
          >
            <Clock className="w-5 h-5" />
            <span className="text-lg">Last updated: September 2025</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed space-y-4"
          >
            <p>
              This Cookie Policy explains how <strong>BioPing, Inc.</strong> ("we," "our," or "us") uses cookies and similar
              technologies on <strong>https://thebioping.com</strong>. It also describes your choices and rights under applicable
              data protection laws, including the <strong>EU/UK General Data Protection Regulation (GDPR)</strong> and
              the <strong>California Consumer Privacy Act (CCPA/CPRA)</strong>.
            </p>
            <p>
              By clicking <strong>"Accept All"</strong>, you agree to the use of cookies as described in this policy. You can
              manage or withdraw your consent at any time.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Content Sections */}
      <div className="container-custom pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8">
            {/* What Are Cookies */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Cookie className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">What Are Cookies?</h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Cookies are small text files stored on your device when you visit a website. They help website's
                  function, improve your browsing experience, and provide analytics and marketing insights.
                </p>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Cookies can be:
                </p>
                <ul className="space-y-2 text-gray-700 ml-4">
                  <li>• <strong>Session cookies</strong> (expire when you close your browser)</li>
                  <li>• <strong>Persistent cookies</strong> (remain until deleted or expired)</li>
                  <li>• <strong>First-party cookies</strong> (set by our site)</li>
                  <li>• <strong>Third-party cookies</strong> (set by service providers like Google)</li>
                </ul>
              </div>
            </motion.div>

            {/* Types of Cookies */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Types of Cookies We Use</h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {cookieTypes.map((type, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                        <type.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{type.title}</h3>
                    </div>
                    <p className="text-gray-700 text-sm mb-3">{type.description}</p>
                    <div className="space-y-1">
                      {type.examples.map((example, exampleIndex) => (
                        <div key={exampleIndex} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          <span className="text-gray-600 text-sm">{example}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Third-Party Cookies and Transfers */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Third-Party Cookies and Transfers</h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Some cookies are placed by third-party providers (Google, Meta, LinkedIn, etc.) which may process your data outside the EEA/UK or the United States. 
                  These providers are responsible for their own data processing. Please review their privacy policies for more details.
                </p>
              </div>
            </motion.div>

            {/* Your Rights */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Rights and Choices</h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Depending on your location, you have the following rights:
                </p>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">GDPR/UK GDPR (EU/EEA & UK users):</h4>
                    <ul className="space-y-2 text-blue-800">
                      <li>• Right to be informed about cookies</li>
                      <li>• Right to give or withdraw consent for non-essential cookies</li>
                      <li>• Right to access, delete, or restrict processing of your data</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-green-900 mb-3">CCPA/CPRA (California residents):</h4>
                    <ul className="space-y-2 text-green-800">
                      <li>• Right to opt-out of "sale" or "sharing" of personal information</li>
                      <li>• Right to know what categories of data are collected</li>
                      <li>• Right to request deletion of personal information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Managing Cookies */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Managing Cookies</h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed text-lg">
                  You can control cookies in the following ways:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Cookie Banner Controls:</h4>
                    <p className="text-gray-700">Use "Customize," "Reject All," or "Accept All" in our banner.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Manage Preferences Anytime:</h4>
                    <p className="text-gray-700">
                      <button 
                        onClick={handleManageCookies}
                        className="text-orange-600 underline cursor-pointer hover:text-orange-700 font-medium transition-colors"
                      >
                        [Manage Cookies]
                      </button> (click to reopen banner).
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Browser Settings:</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                        <h5 className="font-semibold text-blue-900 mb-2 flex items-center">
                          <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">C</span>
                          Chrome
                        </h5>
                        <p className="text-blue-800 text-sm">Settings → Privacy and Security → Cookies and other site data</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                        <h5 className="font-semibold text-orange-900 mb-2 flex items-center">
                          <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">F</span>
                          Firefox
                        </h5>
                        <p className="text-orange-800 text-sm">Options → Privacy & Security → Cookies and Site Data</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
                        <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
                          <span className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">S</span>
                          Safari
                        </h5>
                        <p className="text-gray-700 text-sm">Preferences → Privacy → Manage Website Data</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Retention & Security */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100"
            >
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Retention & Security</h2>
                  <div className="w-16 h-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Cookies are stored for varying durations (session or persistent). We do not store personally identifiable information in cookies. 
                  Data collected through cookies is protected with reasonable security measures.
                </p>
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
              className="mt-8 bg-white/70 backdrop-blur-sm rounded-3xl p-8 text-center border border-gray-100"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions About Cookies?</h3>
              <p className="text-gray-600 mb-6 text-lg">
                If you have any questions about our cookie policy, please contact us.
              </p>
              <Link
                to="/contact-us"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-amber-700 transition-all duration-200"
              >
                <span>Contact Us</span>
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy; 