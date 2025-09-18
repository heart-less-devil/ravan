import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const DirectPDFViewer = ({ pdfUrl, onClose, title }) => {
  console.log('DirectPDFViewer - PDF URL:', pdfUrl);
  console.log('DirectPDFViewer - Title:', title);
  
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
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{ minHeight: '600px' }}
            >
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-4">PDF couldn't be displayed. Please try:</p>
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Open PDF in new tab
                </a>
              </div>
            </object>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DirectPDFViewer; 