import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertCircle, Info, Download, Eye, X, ChevronUp, ChevronDown, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SecurePDFViewer from '../components/SecurePDFViewer';

const QuickGuide = () => {
  const navigate = useNavigate();
  const [showPdf, setShowPdf] = useState(true); // Auto-open PDF on load
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfError, setPdfError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfLoadAttempts, setPdfLoadAttempts] = useState(0);
  const [componentLoaded, setComponentLoaded] = useState(false);

  // Get current domain and set appropriate PDF URL
  useEffect(() => {
    const currentDomain = window.location.hostname;
    const currentProtocol = window.location.protocol;
    let initialUrl = '/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0';
    
    // Set appropriate URL based on current domain
    if (currentDomain.includes('thebioping.com')) {
      // GoDaddy hosting - PDFs are on Render server
      initialUrl = 'https://bioping-backend.onrender.com/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0';
    } else if (currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')) {
      // Local development
      initialUrl = '/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0';
    } else {
      // Default hosting
      initialUrl = '/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0';
    }
    
    setPdfUrl(initialUrl);
    setComponentLoaded(true);
    console.log('🔍 PDF URL Configuration:');
    console.log('  Current domain:', currentDomain);
    console.log('  Current protocol:', currentProtocol);
    console.log('  Setting PDF URL to:', initialUrl);
    console.log('  Full current URL:', window.location.href);
    
    // Test if the route is accessible
    console.log('✅ QuickGuide component loaded successfully');
    console.log('📍 Current URL path:', window.location.pathname);
    console.log('🚀 Component state initialized');
  }, []);

  // Try different PDF URLs for different hosting scenarios
  const pdfUrls = [
    // Render server URLs (where PDFs actually are for GoDaddy hosting)
    'https://bioping-backend.onrender.com/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0',
    'https://bioping-backend.onrender.com/api/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0',
    'https://bioping-backend.onrender.com/api/test-pdf#toolbar=0&navpanes=0&scrollbar=0',
    
    // Direct file paths (for localhost)
    '/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0',
    '/pdf/BioPing%20Training%20Manual.pdf#toolbar=0&navpanes=0&scrollbar=0',
    '/pdf/BioPing Training Manual.pdf',
    
    // API routes (for localhost)
    '/api/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0',
    '/api/pdf/BioPing%20Training%20Manual.pdf#toolbar=0&navpanes=0&scrollbar=0',
    '/api/test-pdf#toolbar=0&navpanes=0&scrollbar=0',
    
    // Alternative approaches
    '/static/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0',
    '/public/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0'
  ];

  // Handle PDF loading errors
  const handlePdfError = () => {
    console.log('❌ PDF loading failed, trying alternative URL');
    console.log('🔍 Current attempt:', pdfLoadAttempts + 1, 'of', pdfUrls.length);
    console.log('📍 Failed URL:', pdfUrl);
    setPdfError(true);
    
    if (pdfLoadAttempts < pdfUrls.length - 1) {
      setPdfLoadAttempts(prev => prev + 1);
      const nextUrl = pdfUrls[pdfLoadAttempts + 1];
      setPdfUrl(nextUrl);
      console.log('🔄 Trying next URL:', nextUrl);
    } else {
      console.log('💥 All PDF URLs failed!');
      console.log('🌐 Current domain:', window.location.hostname);
      console.log('📋 All URLs attempted:', pdfUrls);
      console.log('🔧 Consider checking:');
      console.log('   - PDF file exists in public/pdf/');
      console.log('   - Server configuration for PDF serving');
      console.log('   - CORS settings for cross-origin requests');
    }
  };

  // Check PDF health
  const checkPdfHealth = async () => {
    try {
      const response = await fetch('/api/pdf-health');
      const data = await response.json();
      console.log('PDF Health Check:', data);
      return data;
    } catch (error) {
      console.error('PDF Health Check failed:', error);
      return null;
    }
  };

  // Toggle PDF viewer
  const togglePdf = () => {
    setShowPdf(!showPdf);
  };

  // PDF navigation functions
  const goToNextPage = () => {
    console.log('goToNextPage called');
    
    // Method 1: Change URL to next page
    setCurrentPage(prev => {
      const nextPage = prev + 1;
      const newUrl = `${pdfUrl.split('#')[0]}#page=${nextPage}&toolbar=0&navpanes=0&scrollbar=0`;
      setPdfUrl(newUrl);
      console.log('Changed to page:', nextPage);
      return nextPage;
    });
    
    // Method 2: Try iframe scrolling as backup
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.scrollBy(0, 500);
        console.log('Scroll down successful');
      } catch (error) {
        console.log('Scroll failed:', error);
      }
    }
  };

  const goToPreviousPage = () => {
    console.log('goToPreviousPage called');
    
    // Method 1: Change URL to previous page
    setCurrentPage(prev => {
      const prevPage = Math.max(1, prev - 1);
      const newUrl = `${pdfUrl.split('#')[0]}#page=${prevPage}&toolbar=0&navpanes=0&scrollbar=0`;
      setPdfUrl(newUrl);
      console.log('Changed to page:', prevPage);
      return prevPage;
    });
    
    // Method 2: Try iframe scrolling as backup
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.scrollBy(0, -500);
        console.log('Scroll up successful');
      } catch (error) {
        console.log('Scroll failed:', error);
      }
    }
  };

  // Disable right-click and context menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };
  
  // Disable keyboard shortcuts for save/print
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'u')) {
      e.preventDefault();
      return false;
    }
  };
  
  // Disable drag and other interactions
  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  };
  
  const handleSelectStart = (e) => {
    e.preventDefault();
    return false;
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setPdfError(false);
    console.log('PDF iframe loaded successfully with URL:', pdfUrl);
  };

  // Add global right-click protection when PDF is shown
  React.useEffect(() => {
    if (showPdf) {
      const preventRightClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      };
      
      const preventKeyboardShortcuts = (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'u' || e.key === 'c')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      };
      
      // Add listeners to document and window
      document.addEventListener('contextmenu', preventRightClick, true);
      document.addEventListener('keydown', preventKeyboardShortcuts, true);
      window.addEventListener('contextmenu', preventRightClick, true);
      window.addEventListener('keydown', preventKeyboardShortcuts, true);
      
      return () => {
        document.removeEventListener('contextmenu', preventRightClick, true);
        document.removeEventListener('keydown', preventKeyboardShortcuts, true);
        window.removeEventListener('contextmenu', preventRightClick, true);
        window.removeEventListener('keydown', preventKeyboardShortcuts, true);
      };
    }
  }, [showPdf]);

  // Auto-retry PDF loading after a delay
  useEffect(() => {
    if (pdfError && pdfLoadAttempts < pdfUrls.length - 1) {
      const timer = setTimeout(() => {
        setPdfUrl(pdfUrls[pdfLoadAttempts + 1]);
        setPdfError(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pdfError, pdfLoadAttempts, pdfUrls]);

  // Show loading state while component initializes
  if (!componentLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Quick Guide...</h2>
          <p className="text-gray-600">Please wait while we prepare the training manual</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="space-y-6 select-none" 
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onSelectStart={handleSelectStart}
      style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}
    >
      {/* Professional Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-ping"></div>
        
        <div className="relative z-10">
          {/* Back Button - Top Left */}
          <div className="flex items-start justify-between mb-6">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/dashboard';
                }
              }}
              className="bg-gradient-to-r from-white/25 to-white/15 hover:from-white/35 hover:to-white/25 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-3 transition-all duration-300 border border-white/40 hover:border-white/60 shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-lg">Back</span>
            </motion.button>
            <div></div> {/* Spacer for balance */}
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-2xl mx-auto mb-1">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-0">BioPing Training Manual</h1>
            <p className="text-blue-200 text-base">Complete guide to mastering business development</p>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="max-w-7xl mx-auto">

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200 transition-all duration-200 hover:shadow-md"
            >
              <div className="mb-3">
                <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">Featured</span>
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">BioPing Training Manual</h3>
                  <p className="text-gray-600 mb-3">Complete guide to mastering business development with BioPing platform.</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePdf}
                  className="ml-4 p-3 rounded-lg transition-colors duration-200 bg-purple-100 text-purple-600 hover:bg-purple-200"
                >
                  <Eye className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {showPdf && (
        <SecurePDFViewer
          pdfUrl={pdfUrl}
          title="BioPing Training Manual"
          onClose={() => navigate('/dashboard')}
        />
      )}
    </div>
  );
};

export default QuickGuide; 