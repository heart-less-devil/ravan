import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  CreditCard, 
  Calendar, 
  Download, 
  Settings, 
  Bell, 
  Shield, 
  Star,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  Building2,
  Gift,
  Zap,
  Database,
  MessageSquare,
  BarChart3,
  Users2,
  Download as DownloadIcon,
  Mail,
  Phone,
  MapPin,
  Globe,
  Award,
  Sparkles,
  Info,
  Lock,
  Unlock,
  Key,
  Heart,
  BookOpen,
  Activity,
  Briefcase,
  Circle,
  Check,
  X,
  ArrowRight
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';

const CustomerProfile = ({ user: propUser, onBack }) => {
  const [user, setUser] = useState({
    name: 'Loading...',
    email: 'Loading...',
    company: 'Loading...',
    role: 'Loading...',
    avatar: 'L',
    plan: 'Free',
    planStatus: 'active',
    credits: 5,
    totalCredits: 5,
    usedCredits: 0,
    joinDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    subscription: {
      id: '',
      status: 'inactive',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date().toISOString(),
      amount: 0,
      currency: 'USD',
      interval: 'month'
    },
    paymentHistory: [],
    invoices: []
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user data and payment status
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Get user profile
        const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.user) {
            setUser(prev => ({
              ...prev,
              name: profileData.user.name || 'User',
              email: profileData.user.email || 'user@example.com',
              company: profileData.user.company || 'Company',
              role: profileData.user.role || 'User',
              avatar: (profileData.user.name || 'U').charAt(0).toUpperCase(),
              joinDate: profileData.user.createdAt || new Date().toISOString(),
              lastLogin: new Date().toISOString()
            }));
          }
        }

        // Get payment status
        const paymentResponse = await fetch(`${API_BASE_URL}/api/auth/payment-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          
          // Determine plan based on payment status
          let planName = 'Free';
          let planStatus = 'active';
          let credits = 5;
          let totalCredits = 5;
          let subscriptionStatus = 'inactive';
          let amount = 0;

          if (paymentData.paymentCompleted && paymentData.currentPlan !== 'free') {
            planName = paymentData.currentPlan === 'monthly' ? 'Monthly Plan' : 
                      paymentData.currentPlan === 'annual' ? 'Annual Plan' : 
                      paymentData.currentPlan === 'test' ? 'Test Plan' : 'Paid Plan';
            planStatus = 'active';
            credits = paymentData.currentPlan === 'monthly' ? 50 : 
                     paymentData.currentPlan === 'annual' ? 100 : 
                     paymentData.currentPlan === 'test' ? 1 : 5;
            totalCredits = credits;
            subscriptionStatus = 'active';
            amount = paymentData.currentPlan === 'monthly' ? 400 : 
                    paymentData.currentPlan === 'annual' ? 4800 : 
                    paymentData.currentPlan === 'test' ? 1 : 0;
            
            // Update localStorage with new credits
            localStorage.setItem('userCredits', credits.toString());
          } else {
            // Free users - don't reset credits, keep existing credits
            const existingCredits = localStorage.getItem('userCredits');
            credits = existingCredits ? parseInt(existingCredits) : 5;
            totalCredits = 5;
            // Only set to 5 if no existing credits (new user)
            if (!existingCredits) {
              localStorage.setItem('userCredits', '5');
            }
          }

          setUser(prev => ({
            ...prev,
            plan: planName,
            planStatus: planStatus,
            credits: credits,
            totalCredits: totalCredits,
            subscription: {
              ...prev.subscription,
              status: subscriptionStatus,
              amount: amount
            }
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'payments', name: 'Payment History', icon: DollarSign },
    { id: 'invoices', name: 'Invoices', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'Test Plan': return Star;
      case 'Free': return Gift;
      case 'Monthly Plan': return Users;
      case 'Annual Plan': return Target;
      case 'Basic Plan': return Users;
      case 'Premium Plan': return Target;
      default: return Gift; // Default to Free plan icon
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'Test Plan': return 'yellow';
      case 'Free': return 'gray';
      case 'Monthly Plan': return 'blue';
      case 'Annual Plan': return 'purple';
      case 'Basic Plan': return 'blue';
      case 'Premium Plan': return 'orange';
      default: return 'gray'; // Default to Free plan color
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleDownloadInvoice = (invoice) => {
    // Simulate invoice download
    console.log('Downloading invoice:', invoice.id);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Show success message
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading customer profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  {user.avatar}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <p className="text-sm text-gray-500">{user.company}</p>
                <p className="text-sm text-gray-500">{user.role}</p>
              </div>

              {/* Plan Status */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-3 h-3 rounded-full bg-${getStatusColor(user.planStatus)}-500`}></div>
                  <span className="text-sm font-medium text-gray-700">Current Plan</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    {React.createElement(getPlanIcon(user.plan), { 
                      className: `w-5 h-5 text-${getPlanColor(user.plan)}-600` 
                    })}
                    <span className="font-semibold text-gray-900">{user.plan}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.credits} credits remaining
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Credits Used</p>
                          <p className="text-2xl font-bold text-gray-900">{user.usedCredits}/{user.totalCredits}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Database className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Member Since</p>
                          <p className="text-2xl font-bold text-gray-900">{formatDate(user.joinDate)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Last Login</p>
                          <p className="text-2xl font-bold text-gray-900">{formatDate(user.lastLogin)}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Activity className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Current Plan</p>
                        <div className="flex items-center space-x-3">
                          {React.createElement(getPlanIcon(user.plan), { 
                            className: `w-6 h-6 text-${getPlanColor(user.plan)}-600` 
                          })}
                          <span className="text-lg font-semibold text-gray-900">{user.plan}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Billing Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(user.subscription.amount, user.subscription.currency)}/{user.subscription.interval}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Next Billing</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(user.subscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Status</p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full bg-${getStatusColor(user.subscription.status)}-500`}></div>
                          <span className="text-lg font-semibold text-gray-900 capitalize">{user.subscription.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {user.paymentHistory && user.paymentHistory.length > 0 ? (
                        user.paymentHistory.map((payment, index) => (
                          <div key={payment.id || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">Payment Successful</p>
                              <p className="text-sm text-gray-600">{payment.description || 'Plan subscription activated'}</p>
                            </div>
                            <span className="text-sm text-gray-500">{formatDate(payment.date)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Info className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Account Created</p>
                            <p className="text-sm text-gray-600">Welcome to BioPing! Your account is now active.</p>
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(user.joinDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'subscription' && (
                <motion.div
                  key="subscription"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Subscription Management</h3>
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                        Manage Subscription
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Current Plan</h4>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            {React.createElement(getPlanIcon(user.plan), { 
                              className: `w-8 h-8 text-${getPlanColor(user.plan)}-600` 
                            })}
                            <div>
                              <p className="font-semibold text-gray-900">{user.plan}</p>
                              <p className="text-sm text-gray-600">{user.credits} credits per month</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Billing Cycle</span>
                              <span className="text-sm font-medium text-gray-900">Monthly</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Amount</span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(user.subscription.amount, user.subscription.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Next Billing</span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(user.subscription.currentPeriodEnd)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Usage</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">Credits Used</span>
                              <span className="text-sm font-medium text-gray-900">{user.usedCredits}/{user.totalCredits}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: `${(user.usedCredits / user.totalCredits) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.totalCredits - user.usedCredits} credits remaining this month
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment History</h3>
                    <div className="space-y-4">
                      {user.paymentHistory && user.paymentHistory.length > 0 ? (
                        user.paymentHistory.map((payment) => (
                          <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{payment.description}</p>
                                  <p className="text-sm text-gray-600">Transaction ID: {payment.id}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </p>
                                <p className="text-sm text-gray-600">{formatDate(payment.date)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <CreditCard className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                          <p className="text-gray-600">You haven't made any payments yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'invoices' && (
                <motion.div
                  key="invoices"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Invoices</h3>
                    <div className="space-y-4">
                      {user.invoices && user.invoices.length > 0 ? (
                        user.invoices.map((invoice) => (
                          <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Invoice #{invoice.id}</p>
                                  <p className="text-sm text-gray-600">{formatDate(invoice.date)}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    {formatCurrency(invoice.amount, invoice.currency)}
                                  </p>
                                  <p className="text-sm text-gray-600 capitalize">{invoice.status}</p>
                                </div>
                                <button
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <DownloadIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices</h3>
                          <p className="text-gray-600">You don't have any invoices yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={user.name}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              value={user.email}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                            <input
                              type="text"
                              value={user.company}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <input
                              type="text"
                              value={user.role}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Notifications</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Email Notifications</p>
                              <p className="text-sm text-gray-600">Receive updates about your account</p>
                            </div>
                            <button className="w-12 h-6 bg-primary-600 rounded-full relative">
                              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">Payment Reminders</p>
                              <p className="text-sm text-gray-600">Get notified before billing</p>
                            </div>
                            <button className="w-12 h-6 bg-primary-600 rounded-full relative">
                              <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                          Save Changes
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile; 