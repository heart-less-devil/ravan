import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Building2, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, RefreshCw, Users, Shield, BarChart3, X } from 'lucide-react';
import VerificationModal from '../components/VerificationModal';
import { API_BASE_URL } from '../config';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' or 'terms'
  const [isEmailBlocked, setIsEmailBlocked] = useState(false);
  

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear blocked email state when user changes email
    if (name === 'email' && isEmailBlocked) {
      setIsEmailBlocked(false);
    }
  };



  const validateForm = () => {
    console.log('Validating form...');
    console.log('Current formData:', formData);
    
    const newErrors = {};

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
      console.log('First name missing');
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
      console.log('Last name missing');
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      console.log('Email missing');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      console.log('Invalid email format');
    }

    if (!formData.company) {
      newErrors.company = 'Company name is required';
      console.log('Company name missing');
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      console.log('Password missing');
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      console.log('Password too short');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      console.log('Password complexity requirements not met');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      console.log('Confirm password missing');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      console.log('Passwords do not match');
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      console.log('Terms not agreed to');
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  const sendVerificationCode = async () => {
    console.log('sendVerificationCode called');
    console.log('formData:', formData);
    
    if (!formData.email) {
      console.log('No email provided');
      setErrors(prev => ({ ...prev, email: 'Email is required to send verification code' }));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      console.log('Invalid email format');
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    console.log('Email validation passed, making API call...');
    setIsLoading(true);
    
    try {
      console.log('Making API call to send verification code...');
      console.log('Server URL:', `${API_BASE_URL}/api/auth/send-verification`);
      
      // Call real API to send verification code
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for email sending
      
              const response = await fetch(`${API_BASE_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('API response status:', response.status);
      console.log('API response headers:', response.headers);
      
      if (!response.ok) {
        // Try to get error details
        try {
          const errorData = await response.json();
          console.log('Error response:', errorData);
          
          // Handle blocked email specifically
          if (errorData.errorType === 'EMAIL_BLOCKED') {
            setIsEmailBlocked(true);
            setErrors(prev => ({ 
              ...prev, 
              email: 'This email address is not allowed on our platform. Please use a different email address to create your account.' 
            }));
            return;
          }
          
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (parseError) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error(`Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);

      if (data.success) {
        setShowVerificationModal(true);
        setCountdown(60);
        
        // OTP sent successfully via email
        console.log('📧 Verification code sent to email successfully');
        
        // If email service is slow, show note to user
        if (data.note && data.verificationCode) {
          console.log('📧 Email service slow, verification code:', data.verificationCode);
          // Don't show alert, just log for debugging
        }
        
        // Start countdown
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrors(prev => ({ ...prev, email: data.message || 'Failed to send verification code' }));
      }
      
    } catch (error) {
      console.error('Error sending verification code:', error);
      
      if (error.name === 'AbortError') {
        setErrors(prev => ({ ...prev, email: 'Request timeout. Email service may be slow. Please try again or contact support.' }));
      } else if (error.message.includes('Failed to fetch')) {
        setErrors(prev => ({ ...prev, email: 'Cannot connect to server. Please make sure the server is running.' }));
      } else {
        setErrors(prev => ({ ...prev, email: `Network error: ${error.message}` }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (code) => {
    if (!code || code.length !== 6) {
      setVerificationError('Please enter the 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    
    try {
      // Call real API to verify code
              const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          code: code 
        })
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        throw new Error(`Server returned non-JSON response (${response.status}): ${textResponse.substring(0, 100)}...`);
      }

      const data = await response.json();

      if (data.success) {
        // Success - proceed with account creation
        console.log('Verification successful, creating account...');
        
        // Create the account
        const accountResponse = await fetch(`${API_BASE_URL}/api/auth/create-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            company: formData.company,
            password: formData.password
          })
        });

        const accountData = await accountResponse.json();

        if (accountData.success) {
          // Auto login after successful account creation
          sessionStorage.setItem('token', accountData.token);
          
          // Redirect to dashboard (payment check is now optional)
          alert('Account created successfully! Redirecting to dashboard...');
          setShowVerificationModal(false);
          setVerificationError('');
          window.location.href = '/dashboard';
        } else {
          setVerificationError(accountData.message || 'Failed to create account. Please try again.');
        }
      } else {
        setVerificationError(data.message || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setVerificationError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted!');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, sending verification code...');
    // Send verification code instead of creating account directly
    await sendVerificationCode();
  };

  const passwordStrength = () => {
    if (!formData.password) return { score: 0, color: 'gray', text: '' };
    
    let score = 0;
    if (formData.password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(formData.password)) score++;
    if (/(?=.*[A-Z])/.test(formData.password)) score++;
    if (/(?=.*\d)/.test(formData.password)) score++;
    if (/(?=.*[!@#$%^&*])/.test(formData.password)) score++;

    const colors = ['red', 'orange', 'yellow', 'lightgreen', 'green'];
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    
    return {
      score: Math.min(score, 4),
      color: colors[score - 1] || 'gray',
      text: texts[score - 1] || ''
    };
  };

  const strength = passwordStrength();

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
              x: [0, 150, 0],
              y: [0, -150, 0],
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Signup Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="w-full max-w-xl">
                {/* Enhanced Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex items-center justify-center mb-8"
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
                    <div className="w-48 h-48 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden" style={{display: 'none'}}>
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
                    className="text-4xl font-bold text-black mb-3"
                  >
                    {isVerificationSent ? 'Verify Your Email' : 'Join BioPing'}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-black text-lg"
                  >
                    {isVerificationSent ? (
                      <>
                        We've sent a verification code to <span className="font-medium text-black">{formData.email}</span>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-black hover:text-gray-700 transition-colors duration-200">
                          Sign in
                        </Link>
                      </>
                    )}
                  </motion.p>
                </div>

                {/* Enhanced Form */}
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  onSubmit={handleSubmit}
                  className="bg-white/10 backdrop-blur-xl border border-black rounded-3xl p-12 shadow-2xl focus-within:border-purple-500 focus-within:shadow-purple-500/25 transition-all duration-300"
                >
                  {/* Enhanced Name Fields */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-black mb-3">
                        First name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-black" />
                        </div>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full bg-white/10 border border-black rounded-xl px-4 py-5 pl-12 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-300 ${
                            errors.firstName ? 'border-red-400 focus:ring-red-500' : ''
                          }`}
                          placeholder="First name"
                        />
                        {errors.firstName && (
                          <div className="flex items-center mt-2 text-sm text-red-300">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.firstName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-black mb-3">
                        Last name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-black" />
                        </div>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`w-full bg-white/10 border border-black rounded-xl px-4 py-5 pl-12 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-300 ${
                            errors.lastName ? 'border-red-400 focus:ring-red-500' : ''
                          }`}
                          placeholder="Last name"
                        />
                        {errors.lastName && (
                          <div className="flex items-center mt-2 text-sm text-red-300">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Email Field */}
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-black mb-3">
                      Email <span className="text-red-400">*</span>
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
                        className={`w-full bg-white/10 border rounded-xl px-4 py-5 pl-12 text-black placeholder-black focus:outline-none focus:ring-2 focus:shadow-lg transition-all duration-300 ${
                          isEmailBlocked 
                            ? 'border-red-500 bg-red-50/20 focus:ring-red-500 focus:border-red-500 focus:shadow-red-500/25' 
                            : errors.email 
                              ? 'border-red-400 focus:ring-red-500' 
                              : 'border-black focus:ring-purple-500 focus:border-purple-500 focus:shadow-purple-500/25'
                        }`}
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <div className={`flex items-center mt-2 text-sm ${
                          isEmailBlocked ? 'text-red-500' : 'text-red-300'
                        }`}>
                          {isEmailBlocked ? (
                            <X className="w-4 h-4 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mr-1" />
                          )}
                          {errors.email}
                        </div>
                      )}
                      
                      {/* Blocked Email Warning */}
                      {isEmailBlocked && (
                        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <X className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Email Not Allowed
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>This email address has been blocked from our platform. Please use a different email address to create your account.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Company Field */}
                  <div className="mb-6">
                    <label htmlFor="company" className="block text-sm font-medium text-black mb-3">
                      Company Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-black" />
                      </div>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        className={`w-full bg-white/10 border border-black rounded-xl px-4 py-5 pl-12 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-300 ${
                          errors.company ? 'border-red-400 focus:ring-red-500' : ''
                        }`}
                        placeholder="Enter your company name"
                      />
                      {errors.company && (
                        <div className="flex items-center mt-2 text-sm text-red-300">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.company}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Password Field */}
                  <div className="mb-6">
                    <label htmlFor="password" className="block text-sm font-medium text-black mb-3">
                      Password <span className="text-red-400">*</span>
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
                        className={`w-full bg-white/10 border border-black rounded-xl px-4 py-5 pl-12 pr-12 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-300 ${
                          errors.password ? 'border-red-400 focus:ring-red-500' : ''
                        }`}
                        placeholder="Create a password"
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
                      {errors.password && (
                        <div className="flex items-center mt-2 text-sm text-red-300">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.password}
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Password Strength */}
                    {formData.password && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-black">Password strength:</span>
                          <span className={`text-sm font-medium ${
                            strength.color === 'red' ? 'text-red-400' :
                            strength.color === 'yellow' ? 'text-yellow-400' :
                            strength.color === 'green' ? 'text-green-400' :
                            'text-black'
                          }`}>
                            {strength.text}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              strength.color === 'red' ? 'bg-red-500' :
                              strength.color === 'yellow' ? 'bg-yellow-500' :
                              strength.color === 'green' ? 'bg-green-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${(strength.score / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Confirm Password Field */}
                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-3">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-black" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`w-full bg-white/10 border border-black rounded-xl px-4 py-5 pl-12 pr-12 text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/25 transition-all duration-300 ${
                          errors.confirmPassword ? 'border-red-400 focus:ring-red-500' : ''
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-black transition-colors duration-200"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-black" />
                        ) : (
                          <Eye className="h-5 w-5 text-black" />
                        )}
                      </button>
                      {errors.confirmPassword && (
                        <div className="flex items-center mt-2 text-sm text-red-300">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.confirmPassword}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Terms Checkbox */}
                  <div className="mb-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={(e) => {
                          if (!formData.agreeToTerms) {
                            // If checkbox is being checked, show the modal first
                            e.preventDefault();
                            setActiveTab('privacy');
                            setShowTermsModal(true);
                          } else {
                            // If unchecking, allow it
                            handleChange(e);
                          }
                        }}
                        className="mt-1 w-4 h-4 text-purple-600 bg-white/10 border-black rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <div className="text-sm text-black">
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('terms');
                            setShowTermsModal(true);
                          }}
                          className="text-black hover:text-gray-700 underline"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('privacy');
                            setShowTermsModal(true);
                          }}
                          className="text-black hover:text-gray-700 underline"
                        >
                          Privacy Policy
                        </button>
                        <span className="text-red-400">*</span>
                      </div>
                    </label>
                    {errors.agreeToTerms && (
                      <div className="flex items-center mt-2 text-sm text-red-300">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.agreeToTerms}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || isEmailBlocked}
                    whileHover={{ scale: isEmailBlocked ? 1 : 1.02 }}
                    whileTap={{ scale: isEmailBlocked ? 1 : 0.98 }}
                    className={`w-full font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      isEmailBlocked 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isEmailBlocked ? (
                      <>
                        <span className="text-lg">Email Not Allowed</span>
                        <X className="w-6 h-6" />
                      </>
                    ) : (
                      <>
                        <span className="text-lg">Create Account</span>
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              </div>
            </motion.div>

            {/* Enhanced Right Side - Benefits */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="max-w-md">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-8"
                >
                  <h3 className="text-3xl font-bold text-black mb-6">
                    Join the BioTech Revolution
                  </h3>
                  <p className="text-black text-lg leading-relaxed">
                    Connect with the most innovative biotech companies and accelerate your business development with our comprehensive database.
                  </p>
                </motion.div>

                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-black text-lg mb-2">Verified Contacts</h4>
                      <p className="text-black leading-relaxed">Access to validated BD contacts and decision-makers from top biotech companies</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-black text-lg mb-2">Secure Platform</h4>
                      <p className="text-black leading-relaxed">Enterprise-grade security for your business data and communications</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <BarChart3 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-black text-lg mb-2">Advanced Analytics</h4>
                      <p className="text-black leading-relaxed">Get insights and analytics to optimize your BD strategy</p>
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="mt-8 p-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-3xl border border-white/10"
                >
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-black">500+</div>
                      <div className="text-black text-sm">Pharma & Biotech's
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-black">5000+</div>
                      <div className="text-black text-sm">BD and Other Contacts</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-black">200+</div>
                      <div className="text-black text-sm">Investors</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Terms and Privacy Policy Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowTermsModal(false)}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/20 backdrop-blur-xl"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-300" />
            </button>

            {/* Header */}
            <div className="p-8 border-b border-white/10">
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'privacy'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setActiveTab('terms')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'terms'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Terms of Service
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Privacy Policy - BioPing</h2>
                  <div className="text-gray-300 leading-relaxed space-y-4">
                    <p>
                      At BioPing, your privacy is important to us. This Privacy Policy outlines how we collect, use, and share personal and business-related information through our website and services. By accessing our platform, you agree to this policy.
                    </p>
                    <p>
                      We collect information that you provide directly to us, such as when you create an account, use our services, or contact us. This may include your name, email address, company information, and other business-related data.
                    </p>
                    <p>
                      We use the information we collect to provide, maintain, and improve our services, communicate with you, and ensure the security of our platform. We may also use your information to send you updates about our services and relevant industry information.
                    </p>
                    <p>
                      We do not sell your personal information to third parties. We may share your information with trusted service providers who assist us in operating our platform, and we require these providers to maintain the confidentiality of your information.
                    </p>
                    <p>
                      We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                    </p>
                    <p>
                      You have the right to access, update, or delete your personal information. You can also opt out of certain communications from us. To exercise these rights, please contact us.
                    </p>
                    <p>
                      This Privacy Policy may be updated from time to time. We will notify you of any material changes by posting the new policy on our website and updating the effective date.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'terms' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6">Terms of Use - BioPing</h2>
                  <div className="text-gray-300 leading-relaxed space-y-4">
                    <p>
                      Welcome to BioPing. These Terms & Conditions ("Terms") govern your use of our website, platform, and services ("Services"). By using BioPing, you agree to be bound by these Terms.
                    </p>
                    <p>
                      You must be at least 18 years old to use our Services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                    </p>
                    <p>
                      Our Services provide access to business development information, contacts, and tools. You agree to use this information responsibly and in compliance with applicable laws and regulations.
                    </p>
                    <p>
                      You may not use our Services for any illegal or unauthorized purpose. You agree not to violate any laws, regulations, or third-party rights in connection with your use of our platform.
                    </p>
                    <p>
                      We reserve the right to modify, suspend, or discontinue our Services at any time. We may also update these Terms from time to time, and continued use of our Services constitutes acceptance of any changes.
                    </p>
                    <p>
                      Our Services are provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of our Services, except as required by law.
                    </p>
                    <p>
                      These Terms constitute the entire agreement between you and BioPing regarding your use of our Services. If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/10 -mt-8">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, agreeToTerms: true }));
                    setShowTermsModal(false);
                  }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  I Agree
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setVerificationError('');
        }}
        email={formData.email}
        onVerify={verifyCode}
        onResend={sendVerificationCode}
        isLoading={isLoading}
        isVerifying={isVerifying}
        error={verificationError}
        countdown={countdown}
      />
    </div>
  );
};

export default Signup; 
