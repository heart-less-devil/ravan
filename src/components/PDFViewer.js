import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import './PDFViewer.css';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const PDFViewer = ({ pdfUrl, onClose, title }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState(null);
  const canvasRef = useRef(null);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        console.log('Loading PDF:', pdfUrl);
        
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        
        // Render first page
        await renderPage(pdf, 1);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setIsLoading(false);
      }
    };

    if (pdfUrl) {
      loadPDF();
    }
  }, [pdfUrl]);

  // Render PDF page
  const renderPage = async (pdf, pageNumber) => {
    try {
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale: scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  // Handle page navigation
  const goToPage = async (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pdfDocument) {
      setCurrentPage(pageNumber);
      await renderPage(pdfDocument, pageNumber);
    }
  };

  const handleZoomIn = async () => {
    const newScale = Math.min(scale + 0.2, 3);
    setScale(newScale);
    if (pdfDocument) {
      await renderPage(pdfDocument, currentPage);
    }
  };

  const handleZoomOut = async () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    if (pdfDocument) {
      await renderPage(pdfDocument, currentPage);
    }
  };

  const handleRotate = () => {
    setRotation(prev => prev + 90);
  };

  const handleReset = async () => {
    setScale(1);
    setRotation(0);
    if (pdfDocument) {
      await renderPage(pdfDocument, currentPage);
    }
  };

  console.log('PDF URL:', pdfUrl); // Debug log

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Page Navigation */}
              {totalPages > 0 && (
            <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-600">{Math.round(scale * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              </div>
              
              {/* Rotate */}
              <button
                onClick={handleRotate}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              
              {/* Reset */}
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Reset
              </button>
              
              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Container */}
          <div className="flex-1 overflow-hidden relative pdf-viewer-container">
            <div className="h-full overflow-auto bg-gray-100 p-4">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
            
              <div className="flex justify-center items-start min-h-full">
                <div 
                  className="bg-white shadow-lg rounded-lg overflow-hidden"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  {/* PDF Canvas */}
                  <canvas
                    ref={canvasRef}
                    className="block"
                    style={{
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>


        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PDFViewer; 