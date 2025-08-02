import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, Users, CheckCircle, Clock, Globe, Server, Key, Bell } from 'lucide-react';

const Privacy = () => {
  const sections = [
    {
      id: 'information-collection',
      title: '1. Information We Collect',
      icon: Database,
      content: 'We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.',
      features: [
        'Personal information (name, email address, company details)',
        'Account credentials and profile information',
        'Usage data and analytics',
        'Communication preferences',
        'Payment information (processed securely through third-party providers)'
      ]
    },
    {
      id: 'how-we-use',
      title: '2. How We Use Your Information',
      icon: CheckCircle,
      content: 'We use the information we collect to provide, maintain, and improve our services.',
      features: [
        'Provide and maintain our business development platform',
        'Process transactions and send related information',
        'Send technical notices, updates, and support messages',
        'Respond to your comments and questions',
        'Develop new products and services'
      ]
    },
    {
      id: 'information-sharing',
      title: '3. Information Sharing and Disclosure',
      icon: Users,
      content: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.',
      features: [
        'Service providers who assist in our operations',
        'Legal requirements and law enforcement',
        'Business transfers in case of merger or acquisition',
        'With your explicit consent',
        'Aggregated, anonymized data for analytics'
      ]
    },
    {
      id: 'data-security',
      title: '4. Data Security and Protection',
      icon: Shield,
      content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
      features: [
        'Encryption of data in transit and at rest',
        'Regular security audits and vulnerability assessments',
        'Access controls and authentication measures',
        'Employee training on data protection',
        'Incident response and breach notification procedures'
      ]
    },
    {
      id: 'your-rights',
      title: '5. Your Rights and Choices',
      icon: Key,
      content: 'You have certain rights regarding your personal information, including the right to access, correct, or delete your data.',
      features: [
        'Access and review your personal information',
        'Correct inaccurate or incomplete data',
        'Request deletion of your personal information',
        'Opt-out of marketing communications',
        'Data portability and transfer rights'
      ]
    },
    {
      id: 'cookies-tracking',
      title: '6. Cookies and Tracking Technologies',
      icon: Globe,
      content: 'We use cookies and similar tracking technologies to enhance your experience and analyze our service usage.',
      features: [
        'Essential cookies for service functionality',
        'Analytics cookies to understand usage patterns',
        'Marketing cookies for personalized content',
        'Third-party cookies from our partners',
        'Options to manage cookie preferences'
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
            className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          >
            Privacy Policy
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
            We are committed to protecting your privacy and ensuring the security of your personal information. 
            This policy explains how we collect, use, and safeguard your data.
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
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
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
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-3 flex-shrink-0"></div>
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

          {/* Security Commitment Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 text-white"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Security Commitment</h3>
              <p className="text-green-100 text-lg max-w-2xl mx-auto">
                We implement industry-standard security measures to protect your data and maintain the highest levels of privacy protection.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Server className="w-8 h-8 text-white mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Secure Infrastructure</h4>
                <p className="text-green-100 text-sm">Enterprise-grade security with encryption at rest and in transit</p>
              </div>
              <div className="text-center">
                <Eye className="w-8 h-8 text-white mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Transparent Practices</h4>
                <p className="text-green-100 text-sm">Clear policies and regular updates on our data practices</p>
              </div>
              <div className="text-center">
                <Bell className="w-8 h-8 text-white mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Proactive Monitoring</h4>
                <p className="text-green-100 text-sm">24/7 security monitoring and incident response</p>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions About Privacy?</h3>
            <p className="text-gray-600 mb-6 text-lg">
              If you have any questions about our privacy practices, please contact us.
            </p>
            <Link
              to="/contact-us"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
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

export default Privacy; 