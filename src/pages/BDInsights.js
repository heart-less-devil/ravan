import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Lock, Star, Users, Target, Award, ArrowRight, Eye, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import SimplePDFViewer from '../components/SimplePDFViewer';

const BDInsights = ({ user, userPaymentStatus }) => {
  const [selectedPDF, setSelectedPDF] = useState(null);

  const insights = [
    {
      id: 1,
      title: 'BD Conferences - Priority, Budgets and Smart ROI Tips',
      description: 'Strategic insights from 15+ years of experience in Large Pharma to Small Biotechs.',
      type: 'PDF',
      size: '2.5 MB',
      views: 1856,
      rating: 4.9,
      featured: true,
      pdfUrl: '/pdf/BD Conferences, Priority & Budgets.pdf'
    },
    {
      id: 2,
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
      id: 3,
      title: 'Big Pharma\'s BD Blueprint including Strategic Interest Areas',
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
      title: 'Winning BD Pitch Decks and Management Tips',
      description: 'Proven strategies and templates for creating compelling BD presentations.',
      type: 'PDF',
      size: '2.1 MB',
      views: 1560,
      rating: 4.9,
      featured: false,
      pdfUrl: '/pdf/Winning BD Pitch Deck.pdf'
    },
    {
      id: 5,
      title: 'BD Process and Tips',
      description: 'Comprehensive BD process guide and strategic tips for success.',
      type: 'PDF',
      size: '1.5 MB',
      views: 890,
      rating: 4.6,
      featured: false,
      pdfUrl: '/pdf/BD Process and Tips.pdf'
    },

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

  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  // Calculate total statistics
  const totalResources = insights.length;
  const totalViews = insights.reduce((sum, item) => sum + item.views, 0);
  const userViews = 0; // This would come from user data

  // Check if user has paid access or is universalx0242@gmail.com
  const hasAccess = userPaymentStatus?.hasPaid || user?.email === 'universalx0242@gmail.com';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">BD Insights</h1>
            <p className="text-blue-100">From 15+ Years of Experience in Large Pharma to Small Biotechs</p>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-blue-600">{totalResources}</h3>
            <p className="text-blue-700 font-medium">Total Resources</p>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-green-600">{formatViews(totalViews)}</h3>
            <p className="text-green-700 font-medium">Total Views</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-purple-600">{userViews}</h3>
            <p className="text-purple-700 font-medium">Your Views</p>
          </div>
        </div>

        {/* Lock Card for users without access */}
        {!hasAccess && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Paid Members Access Only</h2>
            <p className="text-gray-600 mb-6">
              This content is exclusively available to paid members. Upgrade your plan to access our premium BD Insights library.
            </p>
            
            <div className="flex flex-col space-y-3 max-w-xs mx-auto">
              <Link
                to="/dashboard"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all duration-200"
              >
                Go Back
              </Link>
              <Link
                to="/dashboard/pricing"
                className="bg-gradient-to-r from-purple-600 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-red-700 transition-all duration-200"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* Resources Grid - Only show for users with access */}
        {hasAccess && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className={`bg-gradient-to-r ${getColorClasses(insight.featured ? 'purple' : 'blue')} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">{insight.type}</span>
                    </div>
                    {insight.featured && (
                      <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                        FEATURED
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{insight.title}</h3>
                  <p className="text-blue-100 text-sm">{insight.description}</p>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>{formatViews(insight.views)} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700">{insight.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {insight.size}
                    </div>
                    <button
                      onClick={() => handleViewPDF(insight)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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

export default BDInsights; 