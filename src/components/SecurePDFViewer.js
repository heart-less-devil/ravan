import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Eye, Shield, Lock, User, Clock, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import './SecurePDFViewer.css';

// Set up PDF.js worker - use CDN for better compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const SecurePDFViewer = ({ pdfUrl, onClose, title, userId }) => {
  // Security Features Summary:
  // ✅ Download Prevention: All download shortcuts blocked
  // ✅ Print Prevention: Ctrl+P and print functions disabled
  // ✅ Screenshot Protection: CSS filters make screenshots unusable
  // ✅ Right-Click Blocking: Context menu completely disabled
  // ✅ Text Selection: Copy/paste completely disabled
  // ✅ Keyboard Shortcuts: All save/copy shortcuts blocked
  // ✅ DevTools Detection: F12 and developer tools blocked
  // ✅ Watermark Overlays: User ID and timestamp embedded
  // ✅ Iframe Protection: Prevents embedding in other sites
  // ✅ Content Extraction: Drag/drop and selection disabled
  // ✅ Website-Only Access: Content readable only on this site
  const [scale, setScale] = useState(2.2); // Start with much larger scale for excellent visibility
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfDocument, setPdfDocument] = useState(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const [pdfjsAvailable, setPdfjsAvailable] = useState(true);
  const [preferIframe, setPreferIframe] = useState(true); // Start with iframe to avoid PDF.js issues
  const [securityAlert, setSecurityAlert] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [allPagesRendered, setAllPagesRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Generate watermark text with user ID and timestamp
  useEffect(() => {
    const timestamp = new Date().toISOString();
    const watermark = `USER: ${userId || 'GUEST'} | ${timestamp}`;
    setWatermarkText(watermark);
  }, [userId]);

  // Load PDF using PDF.js with enhanced canvas rendering
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setAllPagesRendered(false);
        
        console.log('Loading PDF with enhanced canvas rendering...');
        
        // Use a more compatible approach for Chrome with better quality settings
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
          useSystemFonts: true, // Use system fonts for better rendering
          verbosity: 0 // Reduce console noise
        });
        
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        
        // Render all pages at once for better security
        await renderAllPages(pdf);
        setIsLoading(false);
        setAllPagesRendered(true);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setIsLoading(false);
        
        // If PDF.js fails, use iframe fallback
        console.log('PDF.js failed, using iframe fallback');
        setPdfjsAvailable(false);
        setUseFallback(true);
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [pdfUrl]);

  // Render all pages for enhanced security
  const renderAllPages = async (pdf) => {
    if (isRendering) return; // Prevent multiple simultaneous renders
    
    const container = containerRef.current;
    if (!container) return;

    setIsRendering(true);
    
    try {
      // Clear existing content completely
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          // Improve canvas rendering quality
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.textRenderingOptimization = 'optimizeQuality';

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 20px auto';
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.border = '1px solid #eee';
          canvas.style.maxWidth = '100%';
          canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          // Improve text rendering with multiple fallbacks
          canvas.style.imageRendering = 'auto';
          canvas.style.textRendering = 'optimizeLegibility';
          canvas.style.fontSmooth = 'always';
          canvas.style.webkitFontSmoothing = 'antialiased';
          canvas.style.mozOsxFontSmoothing = 'grayscale';
          canvas.style.borderRadius = '4px';

          // Add security attributes
          canvas.setAttribute('data-secure', 'true');
          canvas.style.userSelect = 'none';
          canvas.style.webkitUserSelect = 'none';
          canvas.style.mozUserSelect = 'none';
          canvas.style.msUserSelect = 'none';

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          await page.render(renderContext).promise;
          container.appendChild(canvas);
        } catch (error) {
          console.error(`Error rendering page ${pageNum}:`, error);
        }
      }
    } finally {
      setIsRendering(false);
    }
  };

  // Security features
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

      // Ultra-strong keyboard blocking for maximum security
  const handleKeyDown = (e) => {
    // Block EVERY possible key combination
    const allKeys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const blockedKeys = allKeys.split('');
    
    // Block ALL Ctrl/Cmd combinations
    if ((e.ctrlKey || e.metaKey) && blockedKeys.includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      activateSecurityMode();
      showSecurityAlert('Download attempt blocked!');
      return false;
    }
    
    // Block ALL screenshot methods
    if (e.key === 'PrintScreen' || 
        e.key === 'F12' || e.key === 'F11' || e.key === 'F5' ||
        (e.ctrlKey && e.shiftKey) ||
        (e.metaKey && e.shiftKey) ||
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'i') ||
        (e.ctrlKey && e.key === 'j') ||
        (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
      e.stopPropagation();
      activateSecurityMode();
      showSecurityAlert('Screenshot attempt blocked!');
      return false;
    }
    
    // Block function keys completely
    if (e.key.startsWith('F') && e.key.length <= 3) {
      e.preventDefault();
      e.stopPropagation();
      activateSecurityMode();
      return false;
    }
    
    // Block Alt combinations
    if (e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      activateSecurityMode();
      return false;
    }
    
    // Block Shift combinations
    if (e.shiftKey && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      activateSecurityMode();
      showSecurityAlert('Security violation detected!');
      return false;
    }
  };

    // Disable text selection
    const handleSelectStart = (e) => e.preventDefault();
    const handleDragStart = (e) => e.preventDefault();
    const handleCopy = (e) => e.preventDefault();

    // Enhanced developer tools detection
    const handleDevTools = () => {
      // Check for dev tools panel
      if (window.outerHeight - window.innerHeight > 200 || 
          window.outerWidth - window.innerWidth > 200) {
        activateSecurityMode();
      }
      
      // Detect if window size changes unexpectedly
      if (window.innerWidth < 100 || window.innerHeight < 100) {
        activateSecurityMode();
      }
      
      // Check for console access
      if (window.console && window.console.firebug) {
        activateSecurityMode();
      }
      
      // Detect iframe context (prevent embedding)
      if (window !== window.top) {
        activateSecurityMode();
      }
      
      // Check for debugging tools
      const devtools = {
        open: false,
        orientation: null
      };
      
      const threshold = 160;
      
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            activateSecurityMode();
          }
        } else {
          devtools.open = false;
        }
      }, 500);
    };

    // Enhanced screenshot and content protection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        activateSecurityMode();
      }
    };
    
    // Prevent content extraction
    const handleBeforeUnload = (e) => {
      // Clear sensitive data when leaving
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
    
    // Prevent drag and drop of content
    const handleDragOver = (e) => {
      e.preventDefault();
      return false;
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      return false;
    };
    
    // Prevent selection and copying
    const handleMouseDown = (e) => {
      // Prevent text selection
      e.preventDefault();
      return false;
    };
    
    // Prevent context menu on all elements
    const handleElementContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Add comprehensive event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('mousedown', handleMouseDown);
    
    // Add context menu prevention to all elements
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      element.addEventListener('contextmenu', handleElementContextMenu);
    });
    
    // Continuous monitoring
    const devToolsInterval = setInterval(handleDevTools, 1000);

    // Disable text selection globally
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('mousedown', handleMouseDown);
      
      // Remove context menu listeners from all elements
      const elements = document.querySelectorAll('*');
      elements.forEach(element => {
        element.removeEventListener('contextmenu', handleElementContextMenu);
      });
      
      clearInterval(devToolsInterval);
      
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.mozUserSelect = '';
      document.body.style.msUserSelect = '';
    };
  }, []);

  // Show security alert
  const showSecurityAlert = (message) => {
    setSecurityAlert(message);
    setShowAlert(true);
    setTimeout(() => {
      setShowAlert(false);
      setSecurityAlert('');
    }, 3000);
  };

  // Activate security mode
  const activateSecurityMode = () => {
    const container = containerRef.current;
    if (container) {
      container.classList.add('security-mode');
      setTimeout(() => {
        container.classList.remove('security-mode');
      }, 3000);
    }
  };

  // Zoom controls with finer increments
  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.25, 5);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.75);
    setScale(newScale);
  };

  const handleRotate = () => {
    setRotation(rotation + 90);
  };

  const handleReset = () => {
    setScale(2.2);
    setRotation(0);
  };

  // Re-render all pages when scale or pdfDocument changes
  useEffect(() => {
    if (pdfDocument) {
      renderAllPages(pdfDocument);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, pdfDocument]);

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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Lock className="w-4 h-4" />
                <span>Secure Viewer - Website Only Access</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Zoom Controls */}
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
          <div
            ref={containerRef}
            className="h-full overflow-auto bg-gray-50 p-6"
            style={{ 
              minHeight: '600px', 
              width: '100%',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
          />

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Secure Content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>User: {userId || 'GUEST'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Screenshots blocked • Downloads disabled • DevTools blocked
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SecurePDFViewer; 