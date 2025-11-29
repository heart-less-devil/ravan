import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Target, Users, FileText } from 'lucide-react';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section bg-gradient-to-br from-blue-50 to-indigo-50 -mt-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="hero-title mb-4">
              Simple steps for smarter pharma/biotech deal making
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We keep it easy — just a few quick inputs to get you started.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Step 1 */}
      <section className="section">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-900 shadow-large rounded-2xl p-8 w-full max-w-md">
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Tell Us About Your Drug & Partnering Goals</h3>
                  <p className="text-gray-700">
                    Just share some basic info about your company's drug and what kind of partner are you looking for?
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center"
            >
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  <span className="text-orange-500">Step 1:</span> Tell Us About Your Drug & Partnering Goals
                </h2>
                <p className="text-lg text-gray-700">
                  Just share some basic info about your company's drug and what kind of partner are you looking for?
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Share your drug's mechanism of action</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Describe your target partner profile</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Outline your partnering goals</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="section bg-gradient-to-br from-gray-50 to-blue-50 -mt-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center order-2 md:order-1"
            >
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  <span className="text-orange-500">Step 2:</span> We Create Your Outreach Plan & Target List
                </h2>
                <p className="text-lg text-gray-700">
                  Our system builds a clear, tailored business development plan for you. It targets the right partner types and ranks them by priority.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Automated partner identification</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Priority ranking system</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Customized outreach strategy</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center order-1 md:order-2"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-900 shadow-large rounded-2xl p-8 w-full max-w-md">
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">We Create Your Outreach Plan & Target List</h3>
                  <p className="text-gray-700">
                    Our system builds a clear, tailored business development plan for you.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section className="section -mt-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-900 shadow-large rounded-2xl p-8 w-full max-w-md">
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">You Get the Contacts</h3>
                  <p className="text-gray-700">
                    Get verified contact details for key decision-makers at each potential partner company.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center"
            >
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  <span className="text-orange-500">Step 3:</span> You Get the Contacts
                </h2>
                <p className="text-lg text-gray-700">
                  Get verified contact details for key decision-makers at each potential partner company. We provide validated emails and continually update our core database to keep it accurate.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Verified contact information</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Key decision-maker details</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">Regularly updated database</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-blue-50 -mt-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              We call this a simple, actionable deal-making process - designed to save you time and get results.
            </h2>
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-soft hover:shadow-medium transition-all duration-300 flex items-center space-x-2"
              >
                <span>Get Started Today</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks; 