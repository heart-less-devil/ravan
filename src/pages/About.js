import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Target, TrendingUp, CheckCircle, ArrowRight, Award, Heart, Globe, Zap, Star, Calendar, MapPin, Phone, Mail, ChevronLeft, ChevronRight, Play, Download, FileText, Sparkles, Linkedin } from 'lucide-react';

const About = () => {
  const businessModelHighlights = [
    {
      icon: CheckCircle,
      title: "Deliver a low-cost, results-driven BD platform for strategy and deal execution"
    },
    {
      icon: CheckCircle,
      title: "Support the biotech community with free resources like pitch decks, deal comps, and BD tips"
    },
    {
      icon: CheckCircle,
      title: "Continuously grow the platform – regular updates to contacts database and evolving BD landscape"
    }
  ];

  const freeResources = [
    "Deal Comps",
    "Pitch Deck Templates", 
    "What is Pharma Looking For?",
    "BD Process and Tips",
    "Contact Mr. Vik for 1:1 Consulting (Free 1 Hour)"
  ];

  const founderExperience = [
    "15+ years of dealmaking experience across large pharma and biotech",
    "$20B+ in deals spanning oncology, inflammation, ophthalmology, and cell therapy",
    "Expertise in in/out-licensing, M&A, R&D partnerships, global expansion, and fundraising"
  ];

  const additionalBenefits = [
    "Paid Members receive 1 hour of free BD consulting with Mr. Vik",
    "Committed to giving back: In future, we plan to donate a portion of sales to biotech research through nonprofit partnerships and other collaborations"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section bg-gradient-to-br from-blue-50 to-indigo-50 -mt-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold mb-6" style={{color: '#3B82F6'}}>
              FOUNDER'S MESSAGE
            </h1>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              BioPing is part of <span className="text-orange-500 font-bold">CDS LifeSciences Group</span>, a boutique advisory firm specializing in licensing, divestitures, M&A, and fundraising for life sciences companies.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Business Model Highlights */}
      <section className="section bg-white -mt-32">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-5xl font-bold mb-2" style={{color: '#2c3d69'}}>
              Business Model Highlights
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {businessModelHighlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-900 shadow-large rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <highlight.icon className="w-6 h-6 text-white" />
                </div>
                                 <p className="text-gray-700 font-medium text-base">{highlight.title}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Resources Section */}
      <section className="section bg-white -mt-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Free Resources */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-large border-2 border-gray-200"
            >
              <h2 className="text-4xl font-bold mb-6" style={{color: '#2c3d69'}}>
                Free Resources
              </h2>
              <div className="space-y-4">
                {freeResources.map((resource, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200"
                  >
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{resource}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Privacy Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-large border-2 border-gray-200"
            >
              <h2 className="text-4xl font-bold mb-6" style={{color: '#2c3d69'}}>
                Data Privacy & Security
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                See our Privacy and Terms and Conditions section for details
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-blue-50 -mt-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Founder Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="p-8"
            >
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <div className="w-96 h-[460px] overflow-hidden rounded-tl-3xl rounded-tr-xl rounded-br-2xl rounded-bl-xl shadow-2xl border- border-gray-100 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                    <img 
                      src="/Gaurav.png" 
                      alt="Gaurav Vij (Vik) - Founder" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl" style={{display: 'none'}}>
                      GV
                    </div>
                  </div>
                  <a href="https://www.linkedin.com/authwall?trk=bf&trkInfo=AQHsSUdWIa2n9gAAAZhNs2ggRlwv1CQprDBxg7Y4mHSJqqF6Svq_pDo0Jv1AvSZ7a6EwnI_qXyMZMZYjgTwcKWO-c0RJPd8rl65--bUPQFGflkKQ7zQKH_JSMm-_lcR-JsTV7Ao=&original_referer=&sessionRedirect=https%3A%2F%2Fwww.linkedin.com%2Fin%2Fgauravvij1%3Futm_source%3Dshare%26utm_campaign%3Dshare_via%26utm_content%3Dprofile%26utm_medium%3Dios_app" target='_blank' className="absolute -bottom-3 -right-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110">
                    <Linkedin className="w-6 h-6 text-white" />
                  </a>
                </div>
                <div className="mt-8">
                  <h3 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Gaurav Vij (Vik)</h3>
                  <p className="text-xl text-gray-600 font-medium">Founder & CEO</p>
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mt-4 rounded-full"></div>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Founder Experience */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col justify-start h-full pt-8"
            >
              <div>
                <h2 className="text-5xl font-bold mb-8" style={{color: '#2c3d69'}}>
                   Founded by Gaurav Vij (Vik), a seasoned BD professional with:
                 </h2>
                <div className="space-y-6">
                  {founderExperience.map((experience, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      className="flex items-start space-x-4"
                    >
                      <CheckCircle className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
                      <span className="text-gray-700 text-lg leading-relaxed">{experience}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Benefits */}
      <section className="section bg-white -mt-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {additionalBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-900 shadow-large rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                                 <p className="text-gray-700 font-medium text-lg">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Message Section */}
      <section className="section bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
                         <p className="text-xl text-gray-700 leading-relaxed">
               We're a young, growing biotech service provider startup striving for excellence. Your feedback means a lot—help us make <span className="text-orange-500 font-bold">BioPing</span> even better.
             </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About; 