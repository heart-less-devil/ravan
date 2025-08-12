import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

const SimplePDFViewer = ({ pdfUrl, onClose, title, fallbackUrls = [] }) => {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [pdfError, setPdfError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(pdfUrl);

  console.log('SimplePDFViewer - PDF URL:', pdfUrl);
  console.log('SimplePDFViewer - Title:', title);
  console.log('SimplePDFViewer - Fallback URLs:', fallbackUrls);

  useEffect(() => {
    setCurrentPdfUrl(pdfUrl);
    setPdfError(false);
    setIsLoading(true);
    setCurrentUrlIndex(0);
  }, [pdfUrl]);

  const handlePdfError = () => {
    console.log('PDF failed to load, trying fallback URLs...');
    setPdfError(true);
    
    if (fallbackUrls.length > 0 && currentUrlIndex < fallbackUrls.length) {
      const nextUrl = fallbackUrls[currentUrlIndex];
      console.log('Trying fallback URL:', nextUrl);
      setCurrentPdfUrl(nextUrl);
      setCurrentUrlIndex(prev => prev + 1);
      setPdfError(false);
      setIsLoading(true);
    }
  };

  const handlePdfLoad = () => {
    console.log('PDF loaded successfully with URL:', currentPdfUrl);
    setIsLoading(false);
    setPdfError(false);
  };

  const retryWithFallback = () => {
    if (fallbackUrls.length > 0 && currentUrlIndex < fallbackUrls.length) {
      const nextUrl = fallbackUrls[currentUrlIndex];
      console.log('Retrying with fallback URL:', nextUrl);
      setCurrentPdfUrl(nextUrl);
      setCurrentUrlIndex(prev => prev + 1);
      setPdfError(false);
      setIsLoading(true);
    }
  };

  const allUrls = [pdfUrl, ...fallbackUrls];
  const currentUrl = allUrls[currentUrlIndex] || pdfUrl;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">{title || 'PDF Viewer'}</h2>
                {isLoading && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Debug Info */}
                <div className="text-xs text-gray-500 mr-4">
                  <div>URL: {currentUrl}</div>
                  <div>Attempt: {currentUrlIndex + 1}/{allUrls.length}</div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              </div>
            </div>
          </div>

          {/* PDF Container */}
          <div className="p-6 h-full">
            {pdfError && fallbackUrls.length === 0 ? (
              // PDF Loading Failed - No fallbacks
              <div className="text-center py-12">
              <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Loading Failed</h3>
                <p className="text-gray-600 mb-6">Unable to load the PDF. Please try again later.</p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Open in New Tab
                </a>
                
                <a 
                  href={pdfUrl} 
                  download
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </a>
              </div>
              </div>
            ) : (
              // PDF Display with iframe
              <div className="h-full">
                {isLoading && (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span>Loading PDF...</span>
                    </div>
                  </div>
                )}
                
                <iframe
                  src={currentUrl}
                  title={title || 'PDF Document'}
                  className="w-full h-full min-h-[500px] border border-gray-200 rounded-lg"
                  onLoad={handlePdfLoad}
                  onError={handlePdfError}
                  style={{ display: isLoading ? 'none' : 'block' }}
                />
                
                {/* Fallback Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <a 
                    href={currentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </a>
                  
                <a 
                    href={currentUrl} 
                    download
                    className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </a>
                  
                  {fallbackUrls.length > 0 && currentUrlIndex < fallbackUrls.length && (
                    <button
                      onClick={retryWithFallback}
                      className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Alternative URL
                    </button>
                  )}
                </div>
                
                {/* Debug Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                  <div><strong>Current URL:</strong> {currentUrl}</div>
                  <div><strong>Attempt:</strong> {currentUrlIndex + 1}/{allUrls.length}</div>
                  <div><strong>Status:</strong> {isLoading ? 'Loading...' : pdfError ? 'Failed' : 'Loaded'}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimplePDFViewer; 