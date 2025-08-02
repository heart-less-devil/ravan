import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Lock, Star, Users, Target, Award, ArrowRight, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import IframePDFViewer from '../components/IframePDFViewer';

const BDInsights = ({ user, userPaymentStatus }) => {
  const [selectedPDF, setSelectedPDF] = useState(null);
  const insights = [
    {
      title: "BD Strategy Playbook",
      description: "Comprehensive guide for business development strategies in big pharma companies",
      icon: TrendingUp,
      color: "blue",
      premium: true
    },
    {
      title: "Pitch Deck Mastery",
      description: "Templates and strategies for creating compelling business development presentations",
      icon: Target,
      color: "green",
      premium: true
    },
    {
      title: "Process & Best Practices",
      description: "Step-by-step process and expert tips for successful business development",
      icon: Award,
      color: "purple",
      premium: true
    },
    {
      title: "Conference Strategy",
      description: "Guide to key conferences, prioritization strategies, and budget planning",
      icon: Users,
      color: "orange",
      premium: true
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colors[color] || colors.blue;
  };

  const handleViewPDF = (pdfData) => {
    setSelectedPDF(pdfData);
    console.log('Viewing PDF:', pdfData.title);
  };

  // Check if user has paid access
  if (!userPaymentStatus.hasPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Premium Content</h2>
          <p className="text-gray-600 mb-6">
            BD Insights is exclusively available for paid members. Upgrade to access exclusive market intelligence and strategic insights.
          </p>
          
          <div className="space-y-4 mb-6">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Market trend analysis</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Deal flow patterns</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Industry benchmarks</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Network intelligence</span>
            </div>
          </div>
          
          <Link
            to="/dashboard/pricing"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <span>Upgrade Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">BD Insights</h1>
                  <p className="text-sm text-gray-500">Exclusive market intelligence for paid members</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">Premium Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className={`bg-gradient-to-r ${getColorClasses(insight.color)} p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <insight.icon className="w-6 h-6 text-white" />
                    <h3 className="text-lg font-bold text-white">{insight.title}</h3>
                  </div>
                  {insight.premium && (
                    <Star className="w-4 h-4 text-yellow-300" />
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-700 mb-4">{insight.description}</p>
                <button className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* PDF Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">BD Resources & Guides</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Big Pharma BD Playbook</h4>
              <p className="text-blue-700 text-sm mb-3">
                Comprehensive guide for business development strategies in big pharma companies.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewPDF({
                  title: 'Big Pharma BD Playbook',
                  pdfUrl: '/pdf/Big%20Pharma%20BD%20Playbook.pdf'
                })}
                className="inline-flex items-center space-x-2 text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View PDF</span>
              </motion.button>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Biopharma News & Resources</h4>
              <p className="text-green-700 text-sm mb-3">
                Latest news, trends, and resources for biopharma business development.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewPDF({
                  title: 'Biopharma News & Resources',
                  pdfUrl: '/pdf/Biopharma%20News%20%26%20Resources.pdf'
                })}
                className="inline-flex items-center space-x-2 text-green-600 text-sm font-medium hover:text-green-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View PDF</span>
              </motion.button>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Winning BD Pitch Deck</h4>
              <p className="text-purple-700 text-sm mb-3">
                Templates and strategies for creating compelling business development presentations.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewPDF({
                  title: 'Winning BD Pitch Deck',
                  pdfUrl: '/pdf/Winning%20BD%20Pitch%20Deck.pdf'
                })}
                className="inline-flex items-center space-x-2 text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View PDF</span>
              </motion.button>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">BD Process and Tips</h4>
              <p className="text-orange-700 text-sm mb-3">
                Step-by-step process and expert tips for successful business development.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewPDF({
                  title: 'BD Process and Tips',
                  pdfUrl: '/pdf/BD%20Process%20and%20Tips.pdf'
                })}
                className="inline-flex items-center space-x-2 text-orange-600 text-sm font-medium hover:text-orange-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View PDF</span>
              </motion.button>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">BD Conferences, Priority & Budgets</h4>
              <p className="text-red-700 text-sm mb-3">
                Guide to key conferences, prioritization strategies, and budget planning for BD activities.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewPDF({
                  title: 'BD Conferences, Priority & Budgets',
                  pdfUrl: '/pdf/BD%20Conferences%2C%20Priority%20%26%20Budgets.pdf'
                })}
                className="inline-flex items-center space-x-2 text-red-600 text-sm font-medium hover:text-red-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View PDF</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <IframePDFViewer
          pdfUrl={selectedPDF.pdfUrl}
          title={selectedPDF.title}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </div>
  );
};

export default BDInsights; 