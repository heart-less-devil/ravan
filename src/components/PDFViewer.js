import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import './PDFViewer.css';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const PDFViewer = ({ pdfUrl, onClose, title }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [error, setError] = useState(null);
  const [currentRenderTask, setCurrentRenderTask] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Simple PDF loading function
  const loadPDF = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('PDFViewer - Starting to load PDF:', pdfUrl);
      
      // Test if the PDF URL is accessible
      try {
        const response = await fetch(pdfUrl);
        console.log('PDFViewer - Fetch response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        console.log('PDFViewer - PDF file size:', arrayBuffer.byteLength, 'bytes');
        
        // Verify it's a PDF by checking the header
        const header = new TextDecoder().decode(arrayBuffer.slice(0, 4));
        if (header !== '%PDF') {
          throw new Error('File is not a valid PDF');
        }
      } catch (fetchError) {
        console.error('PDFViewer - Fetch error:', fetchError);
        setError(`Failed to fetch PDF: ${fetchError.message}`);
        setIsLoading(false);
        return;
      }
      
      // Simple PDF loading
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        disableAutoFetch: false,
        disableStream: false,
        disableRange: false,
      });
      
      console.log('PDFViewer - Loading task created, waiting for promise...');
      const pdf = await loadingTask.promise;
      console.log('PDFViewer - PDF loaded successfully:', pdf.numPages, 'pages');
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      
      // Wait a bit before rendering first page to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Render first page
      console.log('PDFViewer - Rendering first page...');
      await renderPage(pdf, 1);
      console.log('PDFViewer - First page rendered successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('PDFViewer - Error loading PDF:', error);
      setError(`Failed to load PDF: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Simple PDF loading
  useEffect(() => {
    if (pdfUrl) {
      loadPDF();
    }
  }, [pdfUrl]);

  // Simple PDF page rendering with new canvas approach
  const renderPage = async (pdf, pageNumber) => {
    try {
      // Cancel any previous render task
      if (currentRenderTask) {
        try {
          await currentRenderTask.cancel();
        } catch (cancelError) {
          console.log('PDFViewer - Previous render task already completed');
        }
        setCurrentRenderTask(null);
      }

      console.log(`PDFViewer - Getting page ${pageNumber}...`);
      const page = await pdf.getPage(pageNumber);
      console.log(`PDFViewer - Page ${pageNumber} retrieved, dimensions:`, page.getViewport({ scale: 1 }));
      
      const container = containerRef.current;
      if (!container) {
        console.error('PDFViewer - Container ref is null');
        return;
      }
      
      // Clear the container
      container.innerHTML = '';
      
      // Create a new canvas element for each render
      const canvas = document.createElement('canvas');
      canvas.className = 'block';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.onContextMenu = (e) => e.preventDefault();
      
      // Add the new canvas to the container
      container.appendChild(canvas);
      
      // Create a fresh canvas context
      const context = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
      console.log('PDFViewer - Canvas context obtained');

      const viewport = page.getViewport({ scale: scale });
      console.log('PDFViewer - Viewport created with scale:', scale, 'dimensions:', viewport);
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      console.log('PDFViewer - Canvas dimensions set:', canvas.width, 'x', canvas.height);

      // Clear canvas completely
      context.clearRect(0, 0, canvas.width, canvas.height);
      console.log('PDFViewer - Canvas cleared');

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      console.log('PDFViewer - Starting page render...');
      
      // Wait a bit to ensure any previous operations are complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Create new render task with error handling
      const renderTask = page.render(renderContext);
      setCurrentRenderTask(renderTask);
      
      try {
        await renderTask.promise;
        console.log(`PDFViewer - Page ${pageNumber} rendered successfully`);
      } catch (renderError) {
        console.error('PDFViewer - Render task failed:', renderError);
        throw renderError;
      } finally {
        setCurrentRenderTask(null);
      }
    } catch (error) {
      console.error('PDFViewer - Error rendering page:', error);
      setError(`Failed to render PDF page: ${error.message}`);
      setCurrentRenderTask(null);
    }
  };

  // Handle page navigation
  const goToPage = async (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages && pdfDocument) {
      try {
        setCurrentPage(pageNumber);
        console.log(`PDFViewer - Navigating to page ${pageNumber}`);
        await renderPage(pdfDocument, pageNumber);
      } catch (error) {
        console.error('PDFViewer - Error navigating to page:', error);
        setError(`Failed to navigate to page ${pageNumber}: ${error.message}`);
      }
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
    setRotation(rotation + 90);
  };

  const handleReset = async () => {
    setScale(1);
    setRotation(0);
    if (pdfDocument) {
      await renderPage(pdfDocument, currentPage);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        onContextMenu={(e) => e.preventDefault()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">{title || 'PDF Viewer'}</h2>
                {totalPages > 0 && (
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
                
                {/* Page Navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="p-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="p-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
            <div className="h-full overflow-auto bg-gray-100 p-4" style={{ maxHeight: '70vh' }}>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                  <div className="text-center max-w-md mx-auto p-6">
                    <p className="text-red-600 font-medium mb-2">{error}</p>
                    <p className="text-gray-500 text-sm mb-4">The PDF could not be loaded.</p>
                    
                    <div className="mt-4 flex justify-center space-x-3">
                      <button
                        onClick={() => {
                          setError(null);
                          setIsLoading(true);
                          // Reload the PDF
                          if (pdfUrl) {
                            loadPDF();
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Retry
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Close
                      </button>
                    </div>
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
                  {/* PDF Canvas Container */}
                  <div ref={containerRef} className="pdf-canvas-container">
                    {/* Canvas will be dynamically created here */}
                  </div>
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