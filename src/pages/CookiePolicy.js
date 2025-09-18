import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Cookie, Settings, Eye, Globe, Clock, CheckCircle } from 'lucide-react';

const CookiePolicy = () => {
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
            Cookie Policy
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center space-x-4 text-gray-600 mb-8"
          >
            <Clock className="w-5 h-5" />
            <span className="text-lg">Last updated: December 2024</span>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            We use cookies to enhance your browsing experience, analyze site traffic, and understand where our visitors are coming from. 
            This policy explains how we use cookies and your rights regarding them.
          </motion.p>
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
                  Cookies are small text files that are stored on your device when you visit a website. They help websites remember information about your visit, 
                  such as your preferred language and other settings. This can make your next visit easier and the site more useful to you.
                </p>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Cookies play an important role in making the web work more efficiently and providing information to website owners about how their sites are used.
                </p>
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

            {/* Your Rights */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
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
              
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Under GDPR and other privacy laws, you have several rights regarding cookies and your personal data:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {userRights.map((right, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 1.1 + index * 0.05 }}
                      className="flex items-start space-x-3"
                    >
                      <CheckCircle className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{right}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* How to Manage Cookies */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-8 text-white"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">How to Manage Cookies</h3>
                <p className="text-orange-100 text-lg max-w-2xl mx-auto">
                  You can control and manage cookies through your browser settings. Here's how to manage cookies in popular browsers:
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Chrome</h4>
                  <p className="text-orange-100 text-sm">Settings → Privacy and Security → Cookies and other site data</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Firefox</h4>
                  <p className="text-orange-100 text-sm">Options → Privacy & Security → Cookies and Site Data</p>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Safari</h4>
                  <p className="text-orange-100 text-sm">Preferences → Privacy → Manage Website Data</p>
                </div>
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
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