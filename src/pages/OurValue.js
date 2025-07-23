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
    "Make business development simple and accessible",
    "Provide free resources: deal comps, pitch decks, BD tips etc.",
    "Reduce your BD and conference spend dramatically",
    "For 1:1 BD help, reach out directly to BioPing teams"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="hero-title mb-6">
              Our <span className="gradient-text">Value</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We deliver exceptional value through our comprehensive platform, 
              industry expertise, and proven track record of successful partnerships.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Problem Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">!</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Problem: Biotech companies often have promising drugs—but lack the time, strategy, and resources for effective pharma dealmaking.
              </h2>
              <p className="text-gray-700">
                Without a dedicated BD team, clear outreach plan, or the right industry contacts, navigating licensing and partnerships can be slow and overwhelming.
              </p>
            </motion.div>

            {/* Solution Column */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-3xl">💡</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                BioPing Solution: We help biotech CEOs and teams save time and energy with a simple, effective BD platform.
              </h2>
              <p className="text-gray-700">
                BioPing is an easy-to-use, web-based tool that guides your BD strategy and execution—without the overhead.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Who We Serve
              </h2>
              <div className="space-y-4">
                {whoWeServe.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start space-x-3"
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
              <img 
                src="/who-we-serve.png" 
                alt="Who We Serve" 
                className="max-w-full h-auto"
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <img 
                src="/our-approach.png" 
                alt="Our Approach" 
                className="max-w-full h-auto"
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
            </motion.div>

            {/* Right Side - Text */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Our Approach
              </h2>
              <div className="space-y-4">
                {ourApproach.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-start space-x-3"
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