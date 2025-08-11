import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertCircle, Info, Download, Eye, X, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

const QuickGuide = () => {
  const [showPdf, setShowPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfError, setPdfError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfLoadAttempts, setPdfLoadAttempts] = useState(0);
  const [componentLoaded, setComponentLoaded] = useState(false);

  // Get current domain and set appropriate PDF URL
  useEffect(() => {
    const currentDomain = window.location.hostname;
    let initialUrl = '/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0';
    
    // Set appropriate URL based on current domain
    if (currentDomain.includes('thebioping.com')) {
      // GoDaddy hosting - PDFs are on Render server
      initialUrl = 'https://bioping-backend.onrender.com/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0';
    } else if (currentDomain.includes('localhost')) {
      initialUrl = '/pdf/BioPing Training Manual.pdf#toolbar=0&navpanes=0&scrollbar=0';
    }
    
    setPdfUrl(initialUrl);
    setComponentLoaded(true);
    console.log('Current domain:', currentDomain, 'Setting PDF URL to:', initialUrl);
    
    // Test if the route is accessible
    console.log('QuickGuide component loaded successfully');
    console.log('Current URL path:', window.location.pathname);
    console.log('Component state initialized');
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
    console.log('PDF loading failed, trying alternative URL');
    setPdfError(true);
    
    if (pdfLoadAttempts < pdfUrls.length - 1) {
      setPdfLoadAttempts(prev => prev + 1);
      setPdfUrl(pdfUrls[pdfLoadAttempts + 1]);
      console.log('Trying URL:', pdfUrls[pdfLoadAttempts + 1]);
    } else {
      console.log('All PDF URLs failed. Current domain:', window.location.hostname);
      console.log('Available URLs tried:', pdfUrls);
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

  // Reset PDF state when toggling
  const togglePdf = async () => {
    if (!showPdf) {
      setPdfError(false);
      setPdfLoadAttempts(0);
      setPdfUrl(pdfUrls[0]);
      setIsLoading(true);
      
      // Check PDF health first
      const health = await checkPdfHealth();
      if (health) {
        console.log('Available PDFs:', health.availablePdfs);
        console.log('PDF exists:', health.pdfExists);
      }
    }
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
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-bounce"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-ping"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">BioPing Training Manual</h1>
              <p className="text-blue-200 text-lg">Complete guide to mastering business development</p>
            </div>
          </div>
          
          
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="max-w-7xl mx-auto">
          
          {/* Professional PDF Display Section */}
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <FileText className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Training Manual</h2>
            <p className="text-gray-600 text-xl mb-8">Access the complete BioPing training documentation</p>
          </div>

          {/* Professional PDF Viewer */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-10 shadow-2xl border border-gray-200 mb-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Document Access</h3>
                <p className="text-gray-600">Secure viewing with navigation controls</p>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePdf}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-3 transition-all duration-300 shadow-lg"
                >
                  <Eye className="w-5 h-5" />
                  <span>{showPdf ? 'Hide PDF' : 'View PDF'}</span>
                </motion.button>
              </div>
            </div>
            
            {/* PDF Preview with Curtain Effect */}
            <div className="relative bg-gray-50 rounded-xl p-6 border border-gray-200 overflow-hidden max-w-7xl mx-auto">
              <AnimatePresence>
                {!showPdf ? (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-full h-[600px] rounded-lg border border-gray-300 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden"
                  >
                    {/* Animated background elements */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-indigo-100/30 animate-pulse"></div>
                    <div className="absolute top-4 left-4 w-8 h-8 bg-blue-200 rounded-full opacity-60 animate-bounce"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 bg-indigo-200 rounded-full opacity-60 animate-ping"></div>
                    
                    <div className="text-center relative z-10">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                      >
                        <FileText className="w-12 h-12 text-white" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Training Manual Ready</h3>
                      <p className="text-gray-600 mb-8 text-lg">Click "View PDF" to reveal the complete training documentation</p>
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPdf(false)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white p-3 rounded-full shadow-xl transition-all duration-300 border-2 border-white"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-8 border-2 border-gray-200 shadow-lg relative w-full">
                      {/* Navigation Buttons */}
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                        <motion.button
                          whileHover={{ 
                            scale: 1.1,
                            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
                          }}
                          whileTap={{ 
                            scale: 0.9,
                            boxShadow: "0 0 30px rgba(59, 130, 246, 0.8)"
                          }}
                          onClick={(e) => {
                            console.log('Up button clicked');
                            
                            // Wait a bit for iframe to be ready
                            setTimeout(() => {
                              goToPreviousPage();
                            }, 100);
                            
                            // Add glowing effect
                            const button = e.target.closest('button');
                            if (button) {
                              button.style.boxShadow = "0 0 40px rgba(59, 130, 246, 1)";
                              button.style.transform = "scale(0.95)";
                              setTimeout(() => {
                                button.style.boxShadow = "0 0 20px rgba(59, 130, 246, 0.3)";
                                button.style.transform = "scale(1)";
                              }, 300);
                            }
                          }}
                          className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-700 p-4 rounded-full shadow-xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-blue-400/0 group-hover:from-blue-400/20 group-hover:to-blue-400/20 transition-all duration-300"></div>
                          <ChevronUp className="w-7 h-7 relative z-10" />
                        </motion.button>
                      </div>
                      
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                        <motion.button
                          whileHover={{ 
                            scale: 1.1,
                            boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
                          }}
                          whileTap={{ 
                            scale: 0.9,
                            boxShadow: "0 0 30px rgba(59, 130, 246, 0.8)"
                          }}
                          onClick={(e) => {
                            console.log('Down button clicked');
                            
                            // Wait a bit for iframe to be ready
                            setTimeout(() => {
                              goToNextPage();
                            }, 100);
                            
                            // Add glowing effect
                            const button = e.target.closest('button');
                            if (button) {
                              button.style.boxShadow = "0 0 40px rgba(59, 130, 246, 1)";
                              button.style.transform = "scale(0.95)";
                              setTimeout(() => {
                                button.style.boxShadow = "0 0 20px rgba(59, 130, 246, 0.3)";
                                button.style.transform = "scale(1)";
                              }, 300);
                            }
                          }}
                          className="bg-gradient-to-br from-white to-gray-50 backdrop-blur-md hover:from-blue-50 hover:to-indigo-50 text-gray-700 hover:text-blue-700 p-4 rounded-full shadow-xl border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-blue-400/0 group-hover:from-blue-400/20 group-hover:to-blue-400/20 transition-all duration-300"></div>
                          <ChevronDown className="w-7 h-7 relative z-10" />
                        </motion.button>
                      </div>
                      
                      {/* Loading State */}
                      {isLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30 rounded-lg">
                          <div className="text-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                            />
                            <p className="text-gray-600 font-medium">Loading PDF...</p>
                          </div>
                        </div>
                      )}

                      {/* Error State */}
                      {pdfError && pdfLoadAttempts >= pdfUrls.length - 1 && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-30 rounded-lg">
                          <div className="text-center p-6">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">PDF Loading Failed</h3>
                            <p className="text-gray-600 mb-4">The PDF could not be loaded. This might be due to hosting restrictions.</p>
                            
                            {/* Debug Info */}
                            <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left">
                              <h4 className="font-semibold text-gray-800 mb-2">Debug Information:</h4>
                              <p className="text-sm text-gray-600 mb-1">Current URL: {pdfUrl}</p>
                              <p className="text-sm text-gray-600 mb-1">Current Domain: {window.location.hostname}</p>
                              <p className="text-sm text-gray-600 mb-1">Attempt: {pdfLoadAttempts + 1}/{pdfUrls.length}</p>
                              <p className="text-sm text-gray-600">Total URLs tried: {pdfLoadAttempts + 1}</p>
                              <p className="text-sm text-gray-600">Protocol: {window.location.protocol}</p>
                              <p className="text-sm text-gray-600">Full URL: {window.location.href}</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setPdfError(false);
                                  setPdfLoadAttempts(0);
                                  setPdfUrl(pdfUrls[0]);
                                  setIsLoading(true);
                                }}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                              >
                                <RefreshCw className="w-5 h-5" />
                                <span>Retry</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  const currentDomain = window.location.hostname;
                                  let downloadUrl = '/pdf/BioPing Training Manual.pdf';
                                  
                                  if (currentDomain.includes('thebioping.com')) {
                                    // GoDaddy hosting - PDFs are on Render server
                                    downloadUrl = 'https://bioping-backend.onrender.com/pdf/BioPing Training Manual.pdf';
                                  } else if (currentDomain.includes('netlify.app')) {
                                    downloadUrl = `https://${currentDomain}/pdf/BioPing Training Manual.pdf`;
                                  }
                                  
                                  window.open(downloadUrl, '_blank');
                                }}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                              >
                                <Download className="w-5 h-5" />
                                <span>Download PDF</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.open('/api/pdf-health', '_blank')}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2"
                              >
                                <Info className="w-5 h-5" />
                                <span>Check Health</span>
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="relative w-full h-[600px]">
                        <div 
                          className="w-full h-[600px] rounded-lg border border-gray-300 shadow-inner relative overflow-hidden"
                          onContextMenu={handleContextMenu}
                          style={{ 
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            MozUserSelect: 'none'
                          }}
                        >
                          {/* Transparent overlay to block right-click */}
                          <div 
                            className="absolute inset-0 z-10"
                            onContextMenu={handleContextMenu}
                            onMouseDown={(e) => {
                              // Allow mouse events to pass through
                              e.stopPropagation();
                            }}
                            onMouseUp={(e) => {
                              // Allow mouse events to pass through
                              e.stopPropagation();
                            }}
                            onMouseMove={(e) => {
                              // Allow mouse events to pass through
                              e.stopPropagation();
                            }}
                            style={{ 
                              background: 'transparent',
                              pointerEvents: 'auto'
                            }}
                          />
                          
                          <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0"
                            onContextMenu={handleContextMenu}
                            onLoad={handleIframeLoad}
                            onError={handlePdfError}
                            title="BioPing Training Manual PDF Viewer"
                            style={{ 
                              userSelect: 'none',
                              WebkitUserSelect: 'none',
                              MozUserSelect: 'none'
                            }}
                            key={`${currentPage}-${pdfLoadAttempts}`} // Force re-render when page or URL changes
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>





        </div>
      </div>
    </div>
  );
};

export default QuickGuide; 