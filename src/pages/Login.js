import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, Shield, CheckCircle, X, RefreshCw, AlertCircle } from 'lucide-react';
import PasswordStrength from '../components/PasswordStrength';
import { API_BASE_URL } from '../config';
import { CompactSpinner } from '../components/LoadingSpinner';
import stateManager from '../utils/stateManager';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminAccess, setIsAdminAccess] = useState(false);
  const navigate = useNavigate();

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // No more auto-login from sessionStorage

  // Check if admin access is required
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setIsAdminAccess(true);
      setError('Admin access required. Please login with admin credentials.');
    }
  }, []);

  // Countdown timer for resend
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // First test server connectivity with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const healthCheck = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!healthCheck.ok) {
        throw new Error('Server is not responding');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error(`Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...`);
      }

      const data = await response.json();

      if (response.ok) {
        // Clear any existing cached data to ensure fresh data
        stateManager.clear();
        
        // Store token in sessionStorage
        sessionStorage.setItem('token', data.token);
        
        // Store user data in stateManager BUT DO NOT persist to sessionStorage
        // This ensures fresh data is fetched from backend on page refresh
        if (data.user) {
          stateManager.set('user', data.user, false); // Changed from true to false
        }
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Cannot connect to server. Please check if the server is running. If this persists, please contact support.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Server is currently unavailable. Please try again in a few minutes.');
      } else if (err.message.includes('Non-JSON response')) {
        setError('Server configuration error. Please contact support or try again later.');
      } else if (err.message.includes('SyntaxError') && err.message.includes('JSON')) {
        setError('Server returned invalid response. Please contact support.');
      } else {
        setError(err.message || 'Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Functions
  const sendForgotPasswordCode = async () => {
    if (!forgotEmail) {
      setForgotError('Please enter your email address');
      return;
    }

    setIsForgotLoading(true);
    setForgotError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error(`Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...`);
      }

      const data = await response.json();

      if (response.ok) {
        setIsVerificationSent(true);
        setCountdown(60); // 60 seconds countdown
      } else {
        setForgotError(data.message || 'Failed to send verification code');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotError('Network error. Please try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const verifyForgotPasswordCode = async () => {
    if (verificationCode.length !== 6) {
      setForgotError('Please enter a 6-digit verification code');
      return;
    }

    if (!newPassword) {
      setForgotError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setForgotError('Password must be at least 8 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(newPassword)) {
      setForgotError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    // Note: We can't check current password on frontend for security reasons
    // Backend will validate that new password is different from current password

    setIsVerifying(true);
    setForgotError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail,
          code: verificationCode,
          newPassword: newPassword
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error(`Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...`);
      }

      const data = await response.json();

      if (response.ok) {
        alert('Password reset successfully! Please login with your new password.');
        setShowForgotPassword(false);
        resetForgotPasswordForm();
      } else {
        setForgotError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setForgotError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetForgotPasswordForm = () => {
    setForgotEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsVerificationSent(false);
    setForgotError('');
    setCountdown(0);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  const benefits = [
    {
      icon: Shield,
      title: "Secure Access",
      description: "Enterprise-grade security for your business data"
    }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '6s' }}></div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(150)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-black/30 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 flex items-start justify-center min-h-screen p-4 pt-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="w-full max-w-md">
                {/* Enhanced Logo */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex items-center justify-center mb-2"
                  >
                    <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity duration-300">
                      <img 
                        src="/image.webp" 
                        alt="BioPing Logo" 
                        className="w-80 h-80 object-contain"
                        onError={(e) => {
                          console.log('Logo failed to load:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    </Link>
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden" style={{display: 'none'}}>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                      <svg className="w-12 h-12 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="6" cy="6" r="2" />
                        <circle cx="18" cy="6" r="2" />
                        <circle cx="6" cy="18" r="2" />
                        <circle cx="18" cy="18" r="2" />
                        <line x1="6" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1" />
                        <line x1="18" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1" />
                        <line x1="6" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1" />
                        <line x1="18" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    </div>
                  </motion.div>
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-4xl font-bold text-black mb-2"
                  >
                    Welcome Back
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-black text-lg"
                  >
                    Sign in to your BioPing account
                  </motion.p>
                </div>

                {/* Enhanced Login Form */}
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  onSubmit={handleSubmit}
                  className="bg-white/10 backdrop-blur-xl border border-black rounded-3xl p-8 shadow-2xl focus-within:border-purple-500 focus-within:shadow-purple-500/25 transition-all duration-300"
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-red-200"
                    >
                      {error}
                    </motion.div>
                  )}

                  {isAdminAccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6"
                    >
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-blue-300 mr-2" />
                        <p className="text-blue-200 text-sm">
                          <strong>Admin Access Required:</strong> Please login with admin credentials to access the data management panel.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-6">
                    {/* Enhanced Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-black mb-3">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-black" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full bg-white/10 border border-black rounded-xl px-4 py-4 pl-12 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-300"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    {/* Enhanced Password Field */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-black mb-3">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-black" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full bg-white/10 border border-black rounded-xl px-4 py-4 pl-12 pr-12 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-300"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-black transition-colors duration-200"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-black" />
                          ) : (
                            <Eye className="h-5 w-5 text-black" />
                          )}
                        </button>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-black hover:text-gray-700 transition-colors duration-200 cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <CompactSpinner size="medium" color="cyber" />
                      ) : (
                        <>
                          <span className="text-lg">Sign In</span>
                          <ArrowRight className="w-6 h-6" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.form>

                {/* Enhanced Footer */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-center mt-8"
                >
                  <p className="text-sm text-black">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-black hover:text-gray-700 transition-colors duration-200 cursor-pointer">
                      Sign up
                    </Link>
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Enhanced Right Side - Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:block flex justify-end"
            >
              <div className="max-w-md mt-36">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-8"
                >
                  <h3 className="text-3xl font-bold text-black mb-6">
                    Unlock Your BD Potential
                  </h3>
                  <p className="text-black text-lg leading-relaxed">
                    Access a full BD platform — precise strategy, verified biotech/pharma contacts, and execution tools to accelerate deals
                  </p>
                </motion.div>

                <div className="space-y-8">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                      className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                    >
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <benefit.icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-black text-lg mb-2">{benefit.title}</h4>
                        <p className="text-black leading-relaxed">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Enhanced Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="mt-8 p-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-3xl border border-white/10"
                >
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-black">1500+</div>
                      <div className="text-black text-sm">Pharma & Biotech's</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-black">5000+</div>
                      <div className="text-black text-sm">CEO, CFO, BD & Other Contacts</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-black">320+</div>
                      <div className="text-black text-sm">Investors, VCs, PE & Corporate Ventures</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowForgotPassword(false)}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 backdrop-blur-xl"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowForgotPassword(false);
                resetForgotPasswordForm();
              }}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Reset Password
              </h2>
              <p className="text-gray-300 text-lg">
                {!isVerificationSent 
                  ? "Enter your email to receive a verification code"
                  : `We've sent a verification code to ${forgotEmail}`
                }
              </p>
            </div>

            {/* Error Message */}
            {forgotError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-3 text-sm text-red-400 bg-red-500/20 border border-red-500/30 rounded-lg mb-6"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {forgotError}
              </motion.div>
            )}

            {/* Step 1: Email Input */}
            {!isVerificationSent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-white/10 border border-black rounded-xl px-4 py-4 pl-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/25 transition-all duration-300"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <button
                  onClick={sendForgotPasswordCode}
                  disabled={isForgotLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-medium py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
                >
                  {isForgotLoading ? (
                    <CompactSpinner size="small" color="cyber" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step 2: Verification Code and New Password */}
            {isVerificationSent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Verification Code */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Verification Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    className="w-full bg-white/10 border border-black rounded-xl px-4 py-4 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/25 transition-all duration-300 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength="6"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    New Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/10 border border-black rounded-xl px-4 py-4 pl-12 pr-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/25 transition-all duration-300"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-white transition-colors duration-200"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-300" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-300" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <PasswordStrength password={newPassword} />
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Confirm New Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-white/10 border border-black rounded-xl px-4 py-4 pl-12 pr-12 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/25 transition-all duration-300"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-white transition-colors duration-200"
                    >
                      {showConfirmNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-300" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Resend Code */}
                <div className="text-center">
                  <button
                    onClick={sendForgotPasswordCode}
                    disabled={countdown > 0}
                    className="text-sm text-purple-300 hover:text-purple-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                  </button>
                </div>

                {/* Reset Password Button */}
                <button
                  onClick={verifyForgotPasswordCode}
                  disabled={isVerifying || verificationCode.length !== 6 || !newPassword || !confirmNewPassword}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-medium py-3 px-4 rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-200"
                >
                  {isVerifying ? (
                    <CompactSpinner size="small" color="cyber" />
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Login; 
