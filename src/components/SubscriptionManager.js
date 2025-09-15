import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Settings,
  Bell,
  Shield,
  DollarSign,
  FileText,
  Clock,
  User
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import LoadingSpinner, { CompactSpinner } from './LoadingSpinner';

const SubscriptionManager = ({ user, onClose, onPlanUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Load subscription data from backend
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      // Fetch user profile and subscription data
      const [profileResponse, subscriptionResponse, invoicesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/auth/subscription`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/auth/invoices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setSubscriptionData({
          currentPlan: profileData.user.currentPlan || 'free',
          currentCredits: profileData.user.currentCredits || 5,
          paymentCompleted: profileData.user.paymentCompleted || false,
          subscriptionStatus: profileData.user.subscriptionStatus || 'inactive',
          subscriptionEndAt: profileData.user.subscriptionEndAt,
          nextCreditRenewal: profileData.user.nextCreditRenewal,
          autoRenewal: profileData.user.autoRenewal || false,
          lastPaymentDate: profileData.user.lastPaymentDate
        });
      }

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setBillingHistory(invoicesData.data || []);
      }

    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Subscription cancelled successfully');
        await loadSubscriptionData();
        if (onPlanUpdate) onPlanUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      setError('Failed to cancel subscription');
    } finally {
      setLoading(false);
      setShowCancelConfirm(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/download-invoice/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess('Invoice downloaded successfully');
      } else {
        setError('Failed to download invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setError('Failed to download invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = () => {
    // This would integrate with Stripe to update payment method
    setError('Payment method update coming soon');
  };

  const getPlanDisplayName = (plan) => {
    const planNames = {
      'free': 'Free Plan',
      'daily-12': 'Daily Plan (12 days)',
      'monthly': 'Monthly Plan',
      'annual': 'Annual Plan',
      'basic': 'Basic Plan',
      'premium': 'Premium Plan'
    };
    return planNames[plan] || plan;
  };

  const getPlanStatus = () => {
    if (!subscriptionData) return 'Unknown';
    
    if (subscriptionData.subscriptionStatus === 'active') return 'Active';
    if (subscriptionData.subscriptionStatus === 'cancelled') return 'Cancelled';
    if (subscriptionData.subscriptionStatus === 'paused') return 'Paused';
    return 'Inactive';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'green',
      'Cancelled': 'red',
      'Paused': 'yellow',
      'Inactive': 'gray'
    };
    return colors[status] || 'gray';
  };

  if (loading && !subscriptionData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner
            size="medium"
            message="ACCESSING SUBSCRIPTION MATRIX..."
            subMessage="Decrypting payment protocols and billing history"
            color="cyber"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Manage Subscription</h2>
              <p className="text-blue-100">Manage your plan, billing, and settings</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: CreditCard },
              { id: 'billing', label: 'Billing', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="text-xl font-bold text-gray-900">
                      {getPlanDisplayName(subscriptionData?.currentPlan)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full bg-${getStatusColor(getPlanStatus())}-500`}></div>
                      <p className="text-xl font-bold text-gray-900">{getPlanStatus()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    <p className="text-xl font-bold text-gray-900">{subscriptionData?.currentCredits || 0}</p>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Plan Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan Type:</span>
                      <span className="font-medium">{getPlanDisplayName(subscriptionData?.currentPlan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auto Renewal:</span>
                      <span className="font-medium">
                        {subscriptionData?.autoRenewal ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {subscriptionData?.nextCreditRenewal && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Renewal:</span>
                        <span className="font-medium">
                          {new Date(subscriptionData.nextCreditRenewal).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => window.location.href = '/dashboard/pricing'}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Upgrade Plan
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
                <button
                  onClick={loadSubscriptionData}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {billingHistory.length > 0 ? (
                <div className="space-y-4">
                  {billingHistory.map((invoice, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Invoice #{invoice.id}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ${invoice.amount} {invoice.currency?.toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600">{invoice.planName}</p>
                          </div>
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No billing history found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Subscription Settings</h3>
              
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Payment Method</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Payment Method</p>
                      <p className="text-sm text-gray-600">Update your payment method</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpdatePaymentMethod}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Billing Alerts</p>
                        <p className="text-sm text-gray-600">Get notified about billing updates</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Usage Alerts</p>
                        <p className="text-sm text-gray-600">Get notified when credits are low</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Cancel Subscription</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel your subscription? This action cannot be undone and you will lose access to premium features.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SubscriptionManager;
