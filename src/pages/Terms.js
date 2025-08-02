import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Users, Lock, CheckCircle, AlertCircle, Clock, BookOpen } from 'lucide-react';

const Terms = () => {
  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      icon: CheckCircle,
      content: 'By accessing and using BioPing\'s services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
    },
    {
      id: 'description',
      title: '2. Description of Service',
      icon: BookOpen,
      content: 'BioPing provides a comprehensive business development platform that connects biotech and pharmaceutical companies with potential partners, investors, and decision-makers.',
      features: [
        'Access to verified business development contacts',
        'Company and investor search capabilities',
        'Lead generation and qualification tools',
        'Analytics and reporting features',
        'Integration with CRM systems'
      ]
    },
    {
      id: 'user-obligations',
      title: '3. User Obligations',
      icon: Users,
      content: 'As a user of BioPing, you agree to:',
      features: [
        'Provide accurate and complete information',
        'Maintain the security of your account',
        'Use the service for lawful purposes only',
        'Respect intellectual property rights',
        'Not engage in any fraudulent activities'
      ]
    },
    {
      id: 'privacy-security',
      title: '4. Privacy and Security',
      icon: Shield,
      content: 'We are committed to protecting your privacy and maintaining the security of your data. Our privacy practices are outlined in our Privacy Policy.',
      features: [
        'Data encryption and secure transmission',
        'Regular security audits and updates',
        'Limited access to personal information',
        'Compliance with data protection regulations'
      ]
    },
    {
      id: 'intellectual-property',
      title: '5. Intellectual Property',
      icon: Lock,
      content: 'All content, features, and functionality of BioPing are owned by us and are protected by copyright, trademark, and other intellectual property laws.',
      features: [
        'BioPing trademarks and logos',
        'Platform design and user interface',
        'Proprietary algorithms and databases',
        'Content and materials provided by us'
      ]
    }
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
            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <FileText className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          >
            Terms of Service
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
            These terms govern your use of BioPing's business development platform. 
            Please read them carefully before using our services.
          </motion.p>
        </motion.div>
      </div>

      {/* Content Sections */}
      <div className="container-custom pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {section.content}
                  </p>
                  
                  {section.features && (
                    <div className="mt-6">
                      <ul className="space-y-3">
                        {section.features.map((feature, featureIndex) => (
                          <motion.li
                            key={featureIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.8 + index * 0.1 + featureIndex * 0.05 }}
                            className="flex items-start space-x-3"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
                            <span className="text-gray-700 leading-relaxed">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-4">Questions About These Terms?</h3>
            <p className="text-blue-100 mb-6 text-lg">
              If you have any questions about these terms, please contact us.
            </p>
            <Link
              to="/contact-us"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              <span>Contact Us</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Terms; 