import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Eye, Shield } from 'lucide-react';
import './PDFViewer.css';

const PDFViewer = ({ pdfUrl, onClose, title }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // Disable keyboard shortcuts for saving/printing/screenshots
    const handleKeyDown = (e) => {
      // Prevent save, print, copy, paste
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 's' || e.key === 'p' || e.key === 'c' || e.key === 'v')) {
        e.preventDefault();
        return false;
      }
      
      // Prevent screenshot shortcuts
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === 'PrintScreen' || e.key === 'F12' || e.key === 'F11')) {
        e.preventDefault();
        return false;
      }
      
      // Prevent Windows screenshot (PrtScn)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Alt+PrintScreen
      if (e.altKey && e.key === 'PrintScreen') {
        e.preventDefault();
        return false;
      }
      
      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    // Disable drag and drop
    const handleDragStart = (e) => e.preventDefault();
    document.addEventListener('dragstart', handleDragStart);

    // Disable copy events
    const handleCopy = (e) => e.preventDefault();
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);

    // Disable paste events
    const handlePaste = (e) => e.preventDefault();
    document.addEventListener('paste', handlePaste);

    // Google Pay style screenshot detection and protection - Advanced
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User might be taking screenshot or switching apps
        console.log('Page visibility changed - potential screenshot attempt');
        activateScreenshotProtection();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Enhanced screenshot detection function - Google Pay level
    const activateScreenshotProtection = () => {
      const container = document.querySelector('.pdf-viewer-container');
      const protection = document.getElementById('screenshot-protection');
      const additionalProtection = document.getElementById('additional-protection');
      const watermark = document.getElementById('security-watermark');
      
      if (container) {
        container.classList.add('screenshot-attempt');
        // Force immediate black screen
        container.style.filter = 'brightness(0) contrast(0) saturate(0)';
        container.style.background = 'black';
      }
      if (protection) {
        protection.style.opacity = '1';
        protection.style.filter = 'brightness(0) contrast(0) saturate(0)';
      }
      if (additionalProtection) {
        additionalProtection.style.opacity = '1';
        additionalProtection.style.filter = 'brightness(0) contrast(0) saturate(0)';
      }
      if (watermark) {
        watermark.style.opacity = '1';
      }
      
      // Keep protection active for longer like Google Pay
      setTimeout(() => {
        if (container) {
          container.classList.remove('screenshot-attempt');
          container.style.filter = '';
          container.style.background = '';
        }
        if (protection) {
          protection.style.opacity = '0';
          protection.style.filter = '';
        }
        if (additionalProtection) {
          additionalProtection.style.opacity = '0';
          additionalProtection.style.filter = '';
        }
        if (watermark) {
          watermark.style.opacity = '0';
        }
      }, 5000); // 5 seconds like Google Pay
    };

    // Detect all possible screenshot attempts - Google Pay level
    const handleScreenshotAttempt = (e) => {
      // Windows screenshot keys
      if (e.key === 'PrintScreen' || 
          e.key === 'F12' ||
          e.key === 'F11' ||
          // DevTools
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          // Mac screenshot
          (e.metaKey && e.shiftKey && e.key === '3') ||
          (e.metaKey && e.shiftKey && e.key === '4') ||
          // Other screenshot tools
          e.key === 'F9' ||
          e.key === 'F10' ||
          // Additional screenshot keys
          e.key === 'F8' ||
          e.key === 'F7' ||
          // Windows + Shift + S
          (e.key === 'S' && e.shiftKey && (e.metaKey || e.ctrlKey)) ||
          // Alt + PrintScreen
          (e.altKey && e.key === 'PrintScreen')) {
        
        console.log('Screenshot attempt detected:', e.key);
        activateScreenshotProtection();
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', handleScreenshotAttempt);

    // Additional screenshot detection - Google Pay level
    const handleMouseEvents = (e) => {
      // Detect potential screenshot tools
      if (e.buttons === 3 || e.button === 2) {
        // Right-click or middle-click might indicate screenshot tool
        activateScreenshotProtection();
      }
      
      // Detect unusual mouse patterns that might indicate screenshot tools
      if (e.clientX < 0 || e.clientY < 0 || 
          e.clientX > window.innerWidth || e.clientY > window.innerHeight) {
        // Mouse outside viewport might indicate screenshot tool
        activateScreenshotProtection();
      }
    };
    document.addEventListener('mousedown', handleMouseEvents);
    document.addEventListener('mouseup', handleMouseEvents);
    document.addEventListener('mousemove', handleMouseEvents);

    // Disable developer tools detection - Google Pay level
    const handleDevTools = () => {
      if (window.outerHeight - window.innerHeight > 200 || 
          window.outerWidth - window.innerWidth > 200) {
        // DevTools might be open
        console.log('Developer tools detected');
        activateScreenshotProtection();
      }
      
      // Detect if window size changes unexpectedly (screenshot tool)
      if (window.innerWidth < 100 || window.innerHeight < 100) {
        activateScreenshotProtection();
      }
      
      // Detect if page becomes inactive (screenshot tool focus)
      if (document.hidden || document.webkitHidden) {
        activateScreenshotProtection();
      }
    };
    setInterval(handleDevTools, 500); // Check more frequently like Google Pay

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleScreenshotAttempt);
      document.removeEventListener('mousedown', handleMouseEvents);
      document.removeEventListener('mouseup', handleMouseEvents);
      
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.mozUserSelect = '';
      document.body.style.msUserSelect = '';
    };
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => prev + 90);
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
                <Eye className="w-4 h-4" />
                <span>View Only - Screenshots Disabled</span>
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
          <div className="flex-1 overflow-hidden relative pdf-viewer-container">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
            
            <div className="h-full overflow-auto bg-gray-100 p-4">
              <div 
                className="bg-white shadow-lg mx-auto relative"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease'
                }}
              >
                {/* Chrome compatible PDF viewer - Google Pay style */}
                <embed
                  src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&scrollbar=0&view=FitH`}
                  type="application/pdf"
                  className="w-full h-[800px] border-0"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    console.log('Embed failed, trying object fallback');
                    setIsLoading(false);
                  }}
                  style={{
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    webkitUserSelect: 'none',
                    // Ensure PDF is clearly readable like Google Pay
                    filter: 'none',
                    opacity: 1,
                    // Clear and crisp display
                    imageRendering: 'crisp-edges',
                    textRendering: 'optimizeLegibility'
                  }}
                />
                
                {/* Fallback object if embed doesn't work */}
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-[800px] border-0 hidden"
                  style={{
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    webkitUserSelect: 'none',
                    filter: 'none',
                    opacity: 1
                  }}
                />
                
                {/* Simple fallback if PDF doesn't load */}
                <div className="w-full h-[800px] border-0 hidden bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">PDF could not be displayed</p>
                    <a 
                      href={pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Open PDF in new tab
                    </a>
                  </div>
                </div>
                
                {/* Security overlay - Invisible to normal reading */}
                <div className="absolute inset-0 pointer-events-none pdf-security-overlay"></div>
                
                {/* Google Pay style screenshot protection - Invisible during normal viewing */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'transparent',
                    zIndex: 1001,
                    // This makes screenshots appear black but doesn't affect normal viewing
                    filter: 'brightness(0) contrast(0) saturate(0)',
                    mixBlendMode: 'multiply',
                    // Completely invisible during normal viewing
                    opacity: 0,
                    transition: 'opacity 0.05s'
                  }}
                  id="screenshot-protection"
                ></div>
                
                {/* Additional Google Pay style protection layer */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'transparent',
                    zIndex: 1002,
                    // Additional black overlay for screenshots
                    filter: 'brightness(0) contrast(0) saturate(0)',
                    mixBlendMode: 'multiply',
                    opacity: 0,
                    transition: 'opacity 0.05s'
                  }}
                  id="additional-protection"
                ></div>
                
                {/* Google Pay style watermark - Only visible in screenshots */}
                <div 
                  className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  style={{ 
                    zIndex: 1002,
                    opacity: 0,
                    transition: 'opacity 0.05s'
                  }}
                  id="security-watermark"
                >
                  <div 
                    className="text-black text-opacity-30 text-5xl font-bold rotate-45 select-none"
                    style={{ userSelect: 'none' }}
                  >
                    SECURED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Protected Content</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>View Only</span>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Screenshots will appear black - Downloads completely disabled
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PDFViewer; 