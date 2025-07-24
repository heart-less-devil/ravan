import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const SimplePDFViewer = ({ pdfUrl, onClose, title }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simple loading simulation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleZoomIn = () => {
    setScale(Math.min(scale + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(rotation + 90);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
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
              
              {/* Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleRotate}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Reset
                </button>
                
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
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full overflow-auto bg-gray-100 p-4">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              )}
              
              {!isLoading && (
                <div className="flex justify-center items-start min-h-full">
                  <div 
                    className="bg-white shadow-lg rounded-lg overflow-hidden"
                    style={{
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                      transformOrigin: 'center',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    {/* Simple PDF Display */}
                    <div className="w-[800px] h-[600px] bg-white border-2 border-gray-300 rounded-lg p-8">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">BD Conference Guide</h1>
                        
                        <div className="text-left space-y-4">
                          <p className="text-lg text-gray-700">
                            <strong>Comprehensive guide for business development conferences,</strong>
                          </p>
                          <p className="text-gray-600">
                            networking strategies, and partnership opportunities.
                          </p>
                          
                          <div className="mt-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Table of Contents:</h2>
                            <ul className="space-y-2 text-gray-700">
                              <li>1. Conference Preparation</li>
                              <li>2. Networking Strategies</li>
                              <li>3. Partnership Opportunities</li>
                              <li>4. Follow-up Best Practices</li>
                            </ul>
                          </div>
                          
                          <div className="mt-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Topics:</h2>
                            <ul className="space-y-2 text-gray-700">
                              <li>• Pre-conference research and planning</li>
                              <li>• Effective networking techniques</li>
                              <li>• Building strategic partnerships</li>
                              <li>• Post-conference follow-up strategies</li>
                              <li>• Measuring ROI from conference attendance</li>
                            </ul>
                          </div>
                          
                          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> This is a simplified preview. The full PDF contains detailed 
                              information, templates, and actionable strategies for successful business development.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SimplePDFViewer; 