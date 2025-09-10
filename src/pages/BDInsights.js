import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SecurePDFViewer from '../components/SecurePDFViewer';
import { API_BASE_URL } from '../config';

const BDInsights = ({ user, userPaymentStatus }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewedContent, setViewedContent] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);
  const [dynamicPDFs, setDynamicPDFs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch PDFs from API
  const fetchPDFs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/pdfs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDynamicPDFs(data.pdfs || []);
      } else {
        console.error('Failed to fetch PDFs');
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load PDFs on component mount
  useEffect(() => {
    fetchPDFs();
  }, []);

  // Expose refresh function to parent component
  useEffect(() => {
    if (window.refreshBDInsights) {
      window.refreshBDInsights = fetchPDFs;
    } else {
      window.refreshBDInsights = fetchPDFs;
    }
  }, []);

  // Get current domain and set appropriate PDF base URL
  const getPdfUrl = (filename) => {
    const currentDomain = window.location.hostname;
    
    if (currentDomain.includes('localhost')) {
      // Local development - use static PDF directory
      return `/pdf/${filename}`;
    } else {
      // Render hosting - use Render server URLs
      return `https://bioping-backend.onrender.com/pdf/${filename}`;
    }
  };

  // Convert dynamic PDFs to the format expected by the component
  const convertPDFsToInsights = (pdfs) => {
    return pdfs.map((pdf, index) => ({
      id: pdf._id || index + 1,
      title: pdf.name,
      description: pdf.description || 'PDF resource from BioPing',
      type: 'PDF',
      size: '2.5 MB', // Default size since we don't store this
      featured: index === 0, // First PDF is featured
      pdfUrl: pdf.url
    }));
  };

  // Create bdInsights object with dynamic PDFs
  const bdInsights = {
    'BD Insights': loading ? [] : convertPDFsToInsights(dynamicPDFs)
  };

  const categories = Object.keys(bdInsights);
  const filteredContent = selectedCategory === 'all' 
    ? Object.values(bdInsights).flat()
    : bdInsights[selectedCategory] || [];

  // Add error handling for PDF loading
  const handleViewPDF = (content) => {
    if (!viewedContent.includes(content.id)) {
      setViewedContent(prev => [...prev, content.id]);
    }
    
    // Log the PDF URL for debugging
    console.log('Attempting to load PDF:', content.pdfUrl);
    console.log('Current domain:', window.location.hostname);
    
    setSelectedPDF(content);
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
            <p className="text-gray-600">Strategic guidance drawn from 15+ years in large pharma to biotechs</p>
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
                <div className="mb-3">
                  <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">Featured</span>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{content.title}</h3>
                  <p className="text-gray-600 mb-3">{content.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{content.type}</span>
                    <span>{content.size}</span>
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
