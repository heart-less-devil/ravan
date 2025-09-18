import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const OurValue = () => {
  const whoWeServe = [
    "Biotech & Pharma companies",
    "Academic and Tech Transfer offices", 
    "Venture Capital & Private Equity firms",
    "Investment Banking Firms",
    "Research institutions"
  ];

  const ourApproach = [
    "Leverage digital tools to keep costs low and pricing affordable",
    "Provide free resources to paid members: BD conference budgets, deal comps, pitch decks, BD process tips etc. ",
    "Make business development simple and accessible",
    
    "Reduce your BD and conference spend dramatically",
    "For 1:1 BD help, reach out directly to BioPing teams"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="section bg-white -mt-16 shadow-soft">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="hero-title mb-6 bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
              Our <span className="gradient-text">Value</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We deliver exceptional value through our comprehensive platform, 
              industry expertise, and proven track record of successful partnerships.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-blue-50 -mt-48">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Problem Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center bg-white rounded-2xl p-8 shadow-large border-2 border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">!</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Problem: Biotech companies often have promising drugs—but lack the time, strategy, and resources for effective pharma dealmaking.
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Without a dedicated BD team, clear outreach plan, or the right industry contacts, navigating licensing and partnerships can be slow and overwhelming.
              </p>
            </motion.div>

            {/* Solution Column */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center bg-white rounded-2xl p-8 shadow-large border-2 border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl">💡</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                BioPing Solution: We help biotech CEOs and teams save time and energy with a simple, effective BD platform.
              </h2>
              <p className="text-gray-700 leading-relaxed">
                BioPing is an easy-to-use, web-based tool that guides your BD strategy and execution—without the overhead.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="section bg-white -mt-24 shadow-soft">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 shadow-large"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
                Who We Serve
              </h2>
              <div className="space-y-2">
                {whoWeServe.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                  >
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center"
            >
              <div className="bg-white rounded-2xl p-6 shadow-large border-2 border-gray-200">
              <img 
                  src="/who-we-serve-image.png" 
                alt="Who We Serve" 
                  className="max-w-full h-auto rounded-lg shadow-medium"
                style={{maxHeight: '400px'}}
                onError={(e) => {
                  console.log('Image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                onLoad={(e) => {
                  console.log('Image loaded successfully:', e.target.src);
                }}
              />
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                Who We Serve Image
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-blue-50 -mt-24">
        <div className="container-custom">
          <div className="grid grid-cols- lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="bg-white rounded-2xl p-6 shadow-large border-2 border-gray-200">
              <img 
                  src="/our-approach-image.png" 
                alt="Our Approach" 
                  className="max-w-full h-auto rounded-lg shadow-medium"
                style={{maxHeight: '400px'}}
                onError={(e) => {
                  console.log('Image failed to load:', e.target.src);
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
                onLoad={(e) => {
                  console.log('Image loaded successfully:', e.target.src);
                }}
              />
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500" style={{display: 'none'}}>
                Our Approach Image
                </div>
              </div>
            </motion.div>

            {/* Right Side - Text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-2 border-gray-200 shadow-large"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-orange-500 to-blue-600 bg-clip-text text-transparent">
                Our Approach
              </h2>
              <div className="space-y-2">
                {ourApproach.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
                  >
                    <CheckCircle className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OurValue; 