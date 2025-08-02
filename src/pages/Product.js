import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Target, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Product = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section bg-gradient-to-br from-blue-50 to-indigo-50 -mt-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
            >
            <h1 className="text-5xl font-bold mb-8 text-blue-900">
              <span className="text-blue-900">BioPing</span> - "<span className="text-blue-900">Smarter</span> <span className="text-orange-400">Dealmaking</span><br /><span className="text-orange-400">for Life Science's</span> <span className="text-blue-900">Industry</span>"
            </h1>
            <p className="text-xl text-gray-600 max-w-1xl mx-auto">
              It is your go-to platform for smart biotech and pharma dealmaking. Backed by 15+ years of experience and a strong personal network, we help you connect with the right partners and create focused strategies that get deals done.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Step 1 */}
      <section className="section -mt-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 shadow-large rounded-2xl p-8 w-full max-w-md">
                <div className="text-center">
                  <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Target className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">What we do</h3>
                  <p className="text-gray-700">
                    Our algorithm delivers a tiered list of potential partners—plus a clear outreach plan showing who to contact, where, and how to start BD outreach process for your pipeline drug. Includes verified contact details

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
              <div className="space-y-1">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 pb-4 border-b border-black">
                    <CheckCircle className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-lg text-gray-700">Contacts across all functions like; Business Development, R&D, Management, Clinical, Regulatory, CEO and Staff</span>
                  </div>
                  <div className="flex items-start space-x-4 pb-4 border-b border-black">
                    <CheckCircle className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-lg text-gray-700">Therapeutic level match with pipeline drug</span>
                  </div>
                  <div className="flex items-start space-x-4 pb-4 border-b border-black">
                    <CheckCircle className="w-8 h-8 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-lg text-gray-700">Deal tips (from 1:1 interactions and public disclosures)</span>
                  </div>
                </div>
              </div>
              </motion.div>
          </div>
        </div>
      </section>

      {/* Our Edge */}
      <section className="section bg-gradient-to-br from-gray-50 to-blue-50 -mt-16 py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">Our Edge</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-blue-600 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-black hover:shadow-3xl hover:border-orange-500 transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-orange-600" />
                    </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Deep Industry Network</h3>
                <p className="text-gray-700 text-base leading-relaxed">Built through 1:1 relationships over 15+ years</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-black hover:shadow-3xl hover:border-orange-500 transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <FileText className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tailored Strategies</h3>
                <p className="text-gray-700 text-base leading-relaxed">Every client gets a custom plan, never off-the-shelf advice</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-black hover:shadow-3xl hover:border-orange-500 transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Target className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Operational Insight</h3>
                <p className="text-gray-700 text-base leading-relaxed">We've been in the trenches — we know what makes deals tick</p>
                  </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-black hover:shadow-3xl hover:border-orange-500 transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Users className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Hands-on Execution</h3>
                <p className="text-gray-700 text-base leading-relaxed">Not just strategy, we help drive outcomes</p>
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
              <Link to="/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-soft hover:shadow-medium transition-all duration-300 flex items-center space-x-2"
            >
                  <span>Get Started Today</span>
                  <ArrowRight className="w-5 h-5" />
              </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Product; 