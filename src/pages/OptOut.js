import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Mail, FileText, CheckCircle, AlertCircle, Clock, Send, User, Building } from 'lucide-react';
import { API_BASE_URL } from '../config';

const OptOut = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    workEmail: '',
    corrections: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/opt-out/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        // Reset form after successful submission
        setFormData({
          fullName: '',
          company: '',
          workEmail: '',
          corrections: ''
        });
      } else {
        setError(data.message || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error('Opt-out submission error:', err);
      setError('An error occurred. Please try again or email us directly at privacy@thebioping.com');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const rights = ['Removed', 'Corrected', 'Updated', 'Restricted'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center space-x-3">
              <img 
                src="/dfgjk.webp" 
                alt="BioPing Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  console.log('Logo failed to load:', e.target.src);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container-custom py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-8"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center space-x-4 text-gray-600 mb-4"
          >
            <Clock className="w-5 h-5" />
            <span className="text-lg">Date: Nov, 2025</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-5xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          >
            BioPing — Do Not Sell or Share my Info / Opt-Out
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-3xl font-semibold text-gray-800 mb-8"
          >
            BioPing – Do Not Sell or Share My Personal Information
          </motion.h2>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container-custom pb-12">
        <div className="max-w-5xl mx-auto">
          {/* CCPA Information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100 mb-8"
          >
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Under the <strong className="text-blue-600">California Consumer Privacy Act (CCPA/CPRA)</strong>, 
              California residents have the right to opt out of the "sale" or "sharing" of their personal information.
            </p>
          </motion.div>

          {/* What Selling or Sharing Means */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-8 mb-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertCircle className="w-6 h-6 text-blue-600 mr-2" />
              What "Selling or Sharing" Means
            </h3>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>• BioPing <strong>does not sell consumer data for money</strong>.</p>
              <p>• However, because our service makes <strong>"professional business contact information available to subscribers"</strong>, 
              California law may consider this a "sale" or "sharing."</p>
              <p>• BioPing <strong>respects professional privacy choices</strong>.</p>
              <p className="mt-4">If your business contact information appears in our platform, you may request that it be:</p>
              <ul className="ml-6 space-y-2">
                {rights.map((right, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2 font-bold">•</span>
                    <span>{right}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Request Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100 mb-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">To Request Removal or Correction or To Opt Out / Remove My Profile</h2>
              <p className="text-gray-600 text-lg mb-2">
                Submit a request below:
              </p>
              <p className="text-gray-700 text-lg">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@thebioping.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                  privacy@thebioping.com
                </a>
              </p>
              <p className="text-gray-700 text-lg mt-2">
                <strong>Subject:</strong> Do Not Sell or Share My Info or Opt-Out
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Include:</h3>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">•</span>
                  <span className="text-gray-700 text-lg">Your full name</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">•</span>
                  <span className="text-gray-700 text-lg">Company (if applicable)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">•</span>
                  <span className="text-gray-700 text-lg">Work email to remove</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">•</span>
                  <span className="text-gray-700 text-lg">Any corrections or updates</span>
                </li>
              </ul>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      <User className="w-5 h-5 inline mr-2" />
                      Your full name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      <Building className="w-5 h-5 inline mr-2" />
                      Company (if applicable)
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <Mail className="w-5 h-5 inline mr-2" />
                    Work email to remove *
                  </label>
                  <input
                    type="email"
                    name="workEmail"
                    value={formData.workEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="email@company.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    <FileText className="w-5 h-5 inline mr-2" />
                    Any corrections or updates
                  </label>
                  <textarea
                    name="corrections"
                    value={formData.corrections}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Please describe any corrections or updates you'd like to make..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    We may require verification. <strong>BioPing will process your request within 15 business days</strong>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-lg shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted Successfully!</h3>
                <p className="text-gray-600 mb-4 text-lg">
                  Your opt-out request has been received. We will process your request within <strong>15 business days</strong>.
                </p>
                <p className="text-gray-600 mb-6 text-sm">
                  If you need to contact us, please email:{' '}
                  <a href="mailto:privacy@thebioping.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                    privacy@thebioping.com
                  </a>
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Submit Another Request
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OptOut;