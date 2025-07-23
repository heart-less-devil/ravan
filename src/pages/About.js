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
      title: "Continuously grow the platform—regular database contact updates, VC contacts coming soon!"
    }
  ];

  const founderExperience = [
    "15+ years of dealmaking experience across large pharma and biotech",
    "$20B+ in deals spanning oncology, inflammation, ophthalmology, and cell therapy",
    "Expertise in in/out-licensing, M&A, R&D partnerships, global expansion, and fundraising"
  ];

  const additionalBenefits = [
    "Members receive 1 hour of free BD consulting with Mr. Vik",
    "Committed to giving back: In future, we plan to donate a portion of sales to biotech research through nonprofit partnerships and other collaborations"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="section bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-2xl font-bold mb-6" style={{color: '#3B82F6'}}>
              FOUNDER'S MESSAGE
            </h1>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              BioPing is part of <span className="text-orange-500 font-bold">CDS LifeSciences Group</span>, a boutique advisory firm specializing in licensing, divestitures, M&A, and fundraising for life sciences companies.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Business Model Highlights */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl font-bold mb-6" style={{color: '#2c3d69'}}>
              Business Model Highlights
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {businessModelHighlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 text-center"
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

      {/* Founder Section */}
      <section className="section bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Founder Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              <div className="flex items-start space-x-6 mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 flex-shrink-0">
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
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gaurav Vij (Vik) - Founder</h3>
                  <a href="#" className="text-blue-600 hover:text-blue-700 text-lg">
                    <Linkedin className="w-6 h-6 inline mr-2" />
                    LinkedIn
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Founder Experience */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
                             <h2 className="text-5xl font-bold mb-6" style={{color: '#2c3d69'}}>
                 Founded by Gaurav Vij (Vik), a seasoned BD professional with:
               </h2>
              <div className="space-y-4">
                {founderExperience.map((experience, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                                         <span className="text-gray-700 text-base">{experience}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Benefits */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {additionalBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-2xl p-6 text-center"
              >
                <div className="w-12 h-12 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                                 <p className="text-gray-700 font-medium text-base">{benefit}</p>
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
               We're a young, growing biotech startup striving for excellence. Your feedback means a lot—help us make <span className="text-orange-500 font-bold">BioPing</span> even better.
             </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About; 