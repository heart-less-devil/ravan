import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowRight, CheckCircle, AlertCircle, Info, Download, Eye, X } from 'lucide-react';

const QuickGuide = () => {
  const [showPdf, setShowPdf] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* Professional Header Section */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">BioPing Training Manual</h1>
            <p className="text-blue-200">Complete guide to mastering business development</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-medium">Comprehensive Guide</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Download className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-medium">Easy Download</div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-medium">Instant View</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="max-w-4xl mx-auto">
          
          {/* Professional PDF Display Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Training Manual</h2>
            <p className="text-gray-600 text-lg mb-8">Access the complete BioPing training documentation</p>
          </div>

          {/* Professional PDF Viewer */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Document Access</h3>
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPdf(!showPdf)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                  <span>{showPdf ? 'Hide PDF' : 'View PDF'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/pdf/BioPing Training Manual.pdf';
                    link.download = 'BioPing Training Manual.pdf';
                    link.click();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </motion.button>
              </div>
                          </div>
            
            {/* PDF Preview with Curtain Effect */}
            <div className="relative bg-gray-50 rounded-xl p-4 border border-gray-200 overflow-hidden">
              <AnimatePresence>
                {!showPdf ? (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -30, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-full h-96 rounded-lg border border-gray-300 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden"
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
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 shadow-lg">
                      <object
                        data="/pdf/BioPing Training Manual.pdf"
                        type="application/pdf"
                        className="w-full h-96 rounded-lg border border-gray-300 shadow-inner"
                      >
                        <div className="w-full h-96 rounded-lg border border-gray-300 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                          <div className="text-center">
                            <motion.div 
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                            >
                              <FileText className="w-8 h-8 text-white" />
                            </motion.div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Successfully Loaded</h3>
                            <p className="text-gray-600 mb-4">The training manual is now visible. Use the close button to hide it.</p>
                          </div>
                        </div>
                      </object>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Online</h3>
              <p className="text-gray-600 text-sm">Read the manual directly in your browser</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Download</h3>
              <p className="text-gray-600 text-sm">Save to your device for offline access</p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Guide</h3>
              <p className="text-gray-600 text-sm">Comprehensive training documentation</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Learn?</h3>
            <p className="text-gray-600 mb-4">Download the complete training manual to master BioPing platform</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/pdf/BioPing Training Manual.pdf';
                link.download = 'BioPing Training Manual.pdf';
                link.click();
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 mx-auto transition-all duration-200"
            >
              <Download className="w-5 h-5" />
              <span>Download Training Manual</span>
            </motion.button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuickGuide; 