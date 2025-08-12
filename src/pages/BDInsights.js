import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SecurePDFViewer from '../components/SecurePDFViewer';

const BDInsights = ({ user, userPaymentStatus }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewedContent, setViewedContent] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);

  const bdInsights = {
    'BD Insights': [
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
      {
        id: 6,
        title: 'Deal Comps Data',
        description: 'Comprehensive deal comparison data and analysis for business development strategies.',
        type: 'PDF',
        size: '2.8 MB',
        views: 750,
        rating: 4.7,
        featured: false,
        pdfUrl: '/pdf/Deal Comps Data.pdf'
      },
    ]
  };

  const categories = Object.keys(bdInsights);
  const filteredContent = selectedCategory === 'all' 
    ? Object.values(bdInsights).flat()
    : bdInsights[selectedCategory] || [];

  const handleViewPDF = (content) => {
    if (!viewedContent.includes(content.id)) {
      setViewedContent(prev => [...prev, content.id]);
    }
    
    setSelectedPDF(content);
    console.log('Viewing PDF:', content.title);
  };

  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  // Check if user has paid access or is universalx0242@gmail.com
  const hasAccess = userPaymentStatus?.hasPaid || user?.email === 'universalx0242@gmail.com';

  // If no access, show upgrade content
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Paid Members Access Only</h3>
            <p className="text-gray-600 mb-6">
              This content is exclusively available to paid members. Upgrade your plan to access our premium BD Insights library.
            </p>
            <div className="space-y-3">
              <Link
                to="/dashboard"
                className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Go Back
              </Link>
              <Link
                to="/dashboard/pricing"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">BD Insights</h2>
            <p className="text-gray-600">BD Insights from 15+ Years of Experience in Large Pharma to Small Biotechs</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">{filteredContent.length} resources</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Resources</p>
                <p className="text-2xl font-bold text-red-900">{Object.values(bdInsights).flat().length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Views</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatViews(2500)}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Your Views</p>
                <p className="text-2xl font-bold text-blue-900">{viewedContent.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="relative inline-block">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 pr-7 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContent.map((content) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-50 rounded-xl p-6 border-2 transition-all duration-200 hover:shadow-md ${
                content.featured ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              {content.featured && (
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-yellow-700">Featured</span>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{content.title}</h3>
                  <p className="text-gray-600 mb-3">{content.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{content.type}</span>
                    <span>{content.size}</span>
                    <span>{formatViews(content.views)} views</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{content.rating}</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleViewPDF(content)}
                  className={`ml-4 p-3 rounded-lg transition-colors duration-200 ${
                    viewedContent.includes(content.id)
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}
                >
                  {viewedContent.includes(content.id) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <SecurePDFViewer
          pdfUrl={selectedPDF.pdfUrl}
          title={selectedPDF.title}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </div>
  );
};

export default BDInsights; 