import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const VerificationModal = ({ 
  isOpen, 
  onClose, 
  email, 
  onVerify, 
  onResend, 
  isLoading, 
  isVerifying, 
  error, 
  countdown 
}) => {
  const [verificationCode, setVerificationCode] = useState('');

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      onVerify(verificationCode);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      handleVerify();
    }
  };

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('verification-code-input');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          {/* Enhanced Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 backdrop-blur-xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>

            {/* Enhanced Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                <CheckCircle className="w-10 h-10 text-white relative z-10" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Verify Your Email
              </h2>
              <p className="text-gray-300 text-lg">
                We've sent a verification code to{' '}
                <span className="font-medium text-purple-300">{email}</span>
              </p>
            </div>

            {/* Enhanced Verification Code Input */}
            <div className="space-y-6">
              <div>
                <label htmlFor="verification-code-input" className="block text-sm font-medium text-white mb-3">
                  Verification Code <span className="text-red-400">*</span>
                </label>
                <input
                  id="verification-code-input"
                  type="text"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  className={`w-full px-6 py-4 text-center text-3xl font-mono tracking-widest bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-400 ${
                    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="000000"
                  maxLength={6}
                  disabled={isVerifying}
                />
              </div>

              {error && (
                <div className="flex items-center text-sm text-red-300 bg-red-500/20 p-4 rounded-xl border border-red-500/30">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <p className="text-sm text-gray-300 text-center">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="space-y-4 mt-8">
              <motion.button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isVerifying}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg"
              >
                {isVerifying ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="text-lg">Verify & Create Account</span>
                    <CheckCircle className="w-6 h-6" />
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={onResend}
                disabled={countdown > 0 || isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white/10 border border-white/20 text-white font-semibold py-4 px-6 rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <RefreshCw className="w-6 h-6" />
                    <span className="text-lg">
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                    </span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VerificationModal; 