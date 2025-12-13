import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Shield, FileText, Ban, CheckCircle, XCircle, Globe, Clock } from 'lucide-react';

const LegalDisclaimer = () => {
  const disclaimerPoints = [
    'BioPing provides access to business contact information and BD insights for professional use only.',
    'BioPing does not guarantee accuracy, completeness, or timeliness of any data.',
    'BioPing compiles business contact data from public, partner, licensed, and customer-contributed sources.',
    'Data is provided as-is, without warranties of any kind.',
    'Users are solely responsible for ensuring their outreach complies with privacy, marketing, and anti-spam laws, including CAN-SPAM, GDPR, CASL, and local regulations.',
    'BioPing does not endorse or validate any external websites or third-party data.',
    'BioPing is not liable for damages arising from the use of the platform or the inaccuracy of data.'
  ];

  const icons = [CheckCircle, AlertTriangle, FileText, Shield, Globe, XCircle, Ban];
  const colors = [
    'from-blue-500 to-indigo-500',
    'from-orange-500 to-red-500',
    'from-purple-500 to-pink-500',
    'from-gray-500 to-gray-600',
    'from-green-500 to-emerald-500',
    'from-red-500 to-rose-500',
    'from-orange-600 to-red-600'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors group"
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
            className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <AlertTriangle className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center space-x-4 text-gray-600 mb-4"
          >
            <Clock className="w-5 h-5" />
            <span className="text-lg">Date: Nov, 2025</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          >
            BioPing — Legal Disclaimer (Website + Platform)
          </motion.h1>
        </motion.div>
      </div>

      {/* Disclaimer Points */}
      <div className="container-custom pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {disclaimerPoints.map((point, index) => {
              const IconComponent = icons[index];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-orange-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${colors[index]} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{point}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimer;