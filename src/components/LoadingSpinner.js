import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  subMessage = '', 
  fullScreen = false,
  color = 'cyber',
  showProgress = false,
  progress = 0
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12', 
    large: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;

  const LoadingContent = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Simple Spinner */}
      <div className={`${spinnerSize} border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin`}></div>

      {/* Simple Text Display */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">
          {message}
        </h3>
        
        {subMessage && (
          <p className="text-sm text-gray-500">
            {subMessage}
          </p>
        )}
      </div>

      {/* Simple Progress Bar */}
      {showProgress && (
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <LoadingContent />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow-sm border">
      <LoadingContent />
    </div>
  );
};

// Compact loading spinner for buttons and small areas
export const CompactSpinner = ({ size = 'small', color = 'cyber' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`}></div>
  );
};

// Simple page loading
export const PageLoading = ({ message = "Loading page...", showSkeleton = true }) => (
  <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner 
        size="large" 
        message={message}
        subMessage="Please wait..."
      />
    </div>
  </div>
);

export default LoadingSpinner;
