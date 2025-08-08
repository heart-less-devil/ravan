import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Download, FileText, Eye, Star } from 'lucide-react';
import SimplePDFViewer from '../components/SimplePDFViewer';

const Resources = () => {
  const [selectedPDF, setSelectedPDF] = useState(null);

  const resources = [
    "Deal Comps",
    "Pitch Deck Templates", 
    "What is Pharma Looking For?",
    "BD Process and Tips",
    "Contact Mr. Vik for 1:1 Consulting (Free 1 Hour)"
  ];

  // Add all the PDFs
  const pdfResources = [
    {
      id: 1,
      title: 'Biopharma Industry News and Resources',
      description: 'Latest industry updates and strategic resources for business development.',
      type: 'PDF',
      size: '1.8 MB',
      views: 1240,
      rating: 4.7,
      featured: false,
      pdfUrl: '/pdf/Biopharma News & Resources.pdf'
    },
    {
      id: 2,
      title: 'BD Process and Tips',
      description: 'Comprehensive BD process guide and strategic tips for success.',
      type: 'PDF',
      size: '1.5 MB',
      views: 890,
      rating: 4.6,
      featured: false,
      pdfUrl: '/pdf/BD Process and Tips.pdf'
    },
    {
      id: 3,
      title: 'Big Pharma BD Playbook',
      description: 'Comprehensive blueprint for understanding large pharma business development strategies.',
      type: 'PDF',
      size: '3.2 MB',
      views: 980,
      rating: 4.8,
      featured: false,
      pdfUrl: '/pdf/Big Pharma BD Playbook.pdf'
    },
    {
      id: 4,
      title: 'Winning BD Pitch Deck',
      description: 'Proven strategies and templates for creating compelling BD presentations.',
      type: 'PDF',
      size: '2.1 MB',
      views: 1560,
      rating: 4.9,
      featured: false,
      pdfUrl: '/pdf/Winning BD Pitch Deck.pdf'
    }
  ];

  const handleViewPDF = (pdfData) => {
    setSelectedPDF(pdfData);
    console.log('Viewing PDF:', pdfData.title);
  };

  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Free Resources Available to <span className="text-orange-500">BioPing</span> Customers
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section -mt-28">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - Illustration */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 shadow-lg border border-blue-200">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Resources</h3>
                  <p className="text-gray-600">Access our comprehensive collection of BD resources and tools</p>
                </div>
              </div>
            </motion.div>

            {/* Right Side - Resources List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Free Resources</h2>
              
              {/* PDF Resource Cards */}
              {pdfResources.map((pdf, index) => (
                <motion.div
                  key={pdf.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className={`bg-gradient-to-r ${getColorClasses('blue')} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-5 h-5" />
                        <span className="text-sm font-medium">{pdf.type}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{pdf.title}</h3>
                    <p className="text-blue-100 text-sm">{pdf.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Eye className="w-4 h-4" />
                        <span>{formatViews(pdf.views)} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700">{pdf.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {pdf.size}
                      </div>
                      <button
                        onClick={() => handleViewPDF(pdf)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Original Resources List */}
              {resources.map((resource, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                  className="flex items-center space-x-4 p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-large border-2 border-orange-300 hover:shadow-md transition-shadow"
                >
                  <CheckCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{resource}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-5/6 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{selectedPDF.title}</h3>
              <button
                onClick={() => setSelectedPDF(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full">
              <SimplePDFViewer 
                pdfUrl={selectedPDF.pdfUrl} 
                title={selectedPDF.title}
                onClose={() => setSelectedPDF(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources; 