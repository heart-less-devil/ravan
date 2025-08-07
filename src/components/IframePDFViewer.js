import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const IframePDFViewer = ({ pdfUrl, onClose, title }) => {
  console.log('IframePDFViewer - PDF URL:', pdfUrl);
  console.log('IframePDFViewer - Title:', title);
  
  // Add error handling for iframe
  const handleIframeError = () => {
    console.log('Iframe failed to load PDF');
  };

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
  };
  
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

          {/* PDF Container */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={title || 'PDF Document'}
              style={{ minHeight: '600px' }}
              onError={handleIframeError}
              onLoad={handleIframeLoad}
            />
            
            {/* Fallback if iframe fails */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">If PDF doesn't load properly, try:</p>
              <a 
                href={pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm mr-4"
              >
                Open PDF in new tab
              </a>
              <a 
                href={pdfUrl} 
                download
                className="text-green-600 hover:text-green-800 underline text-sm"
              >
                Download PDF
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IframePDFViewer; 