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
import SubscriptionManager from '../components/SubscriptionManager';
import creditTracker from '../utils/creditTracker';

const CustomerProfile = ({ user: propUser, onBack }) => {
  const [user, setUser] = useState({
    name: propUser?.name || 'Loading...',
    email: propUser?.email || 'Loading...',
    company: propUser?.company || 'Loading...',
    role: propUser?.role || 'Loading...',
    avatar: propUser?.name?.charAt(0) || 'L',
    plan: 'Free',
    planStatus: 'active',
    credits: 5,
    totalCredits: 5,
    usedCredits: 0,
    joinDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    subscription: {
      id: '',
      status: 'active',
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
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    company: ''
  });

    // Load user data and payment status
  const loadUserData = async () => {
    try {
      if (!user || !user.email) return;

      // Get authentication token
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        return;
      }

      // Get user profile
      const profileResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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

      // Get subscription status
      const subscriptionResponse = await fetch(`${API_BASE_URL}/api/auth/subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Get user invoices
      const invoicesResponse = await fetch(`${API_BASE_URL}/api/auth/invoices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Process subscription data
      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        console.log('Subscription data received:', subscriptionData);
        
        // Determine plan based on subscription status
        let planName = 'Free';
        let planStatus = 'active';
        let credits = 5;
        let totalCredits = 5;
        let subscriptionStatus = 'inactive';
        let amount = 0;
        let usedCredits = 0;
        let nextBillingDate = null;

        if (subscriptionData.paymentCompleted && subscriptionData.currentPlan !== 'free') {
          planName = subscriptionData.currentPlan === 'monthly' ? 'Monthly Plan' : 
                    subscriptionData.currentPlan === 'annual' ? 'Annual Plan' : 
                    subscriptionData.currentPlan === 'test' ? 'Test Plan' : 'Paid Plan';
          planStatus = 'active';
          credits = subscriptionData.currentCredits || (subscriptionData.currentPlan === 'monthly' ? 50 : 
                   subscriptionData.currentPlan === 'annual' ? 100 : 
                   subscriptionData.currentPlan === 'test' ? 1 : 5);
          totalCredits = subscriptionData.currentPlan === 'monthly' ? 50 : 
                        subscriptionData.currentPlan === 'annual' ? 100 : 
                        subscriptionData.currentPlan === 'test' ? 1 : 5;
          subscriptionStatus = 'active';
          amount = subscriptionData.currentPlan === 'test' ? 1 : 
                  subscriptionData.currentPlan === 'monthly' ? 500 : 
                  subscriptionData.currentPlan === 'annual' ? 4800 : 0;
          
          // Use backend calculated next billing date for subscription plans
          if (subscriptionData.isSubscriptionPlan && subscriptionData.nextBillingDate) {
            nextBillingDate = subscriptionData.nextBillingDate;
          } else {
            // One-time payment plans don't show next billing
            nextBillingDate = null;
          }
          
          // Calculate used credits based on total and remaining
          usedCredits = Math.max(0, totalCredits - credits);
        } else {
          // Free users - get actual credits from backend
          credits = subscriptionData.currentCredits || 5;
          totalCredits = 5;
          usedCredits = Math.max(0, totalCredits - credits);
          amount = 0;
          nextBillingDate = null;
        }

        // Get invoices data
        let invoices = [];
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          invoices = invoicesData.data || [];
          console.log('Invoices data received:', invoices);
        }

        // Get payment history from invoices
        let paymentHistory = [];
        if (invoices && invoices.length > 0) {
          paymentHistory = invoices.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount,
            currency: invoice.currency || 'USD',
            date: invoice.date,
            description: invoice.description || 'Plan subscription',
            status: invoice.status
          }));
        }

        setUser(prev => ({
          ...prev,
          plan: planName,
          planStatus: planStatus,
          credits: credits,
          totalCredits: totalCredits,
          usedCredits: usedCredits,
          invoices: invoices,
          paymentHistory: paymentHistory,
          subscription: {
            ...prev.subscription,
            status: subscriptionStatus,
            amount: amount,
            currentPeriodEnd: nextBillingDate || new Date().toISOString(),
            interval: amount > 0 ? 'month' : 'none'
          }
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    
    // Set up credit tracker listener
    const handleCreditChange = (newCredits) => {
      setUser(prev => ({
        ...prev,
        credits: newCredits,
        usedCredits: Math.max(0, prev.totalCredits - newCredits)
      }));
    };
    
    creditTracker.addListener(handleCreditChange);
    
    // No more periodic credit sync - credits should persist
    // const creditSyncInterval = setInterval(() => {
    //   syncCredits();
    // }, 5000);
    
    // Cleanup on component unmount
    return () => {
      // clearInterval(creditSyncInterval); // No more interval to clear
      creditTracker.removeListener(handleCreditChange);
    };
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

  const handleDownloadInvoice = async (invoice) => {
    try {
      // Add delay to prevent simultaneous downloads
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch(`${API_BASE_URL}/api/auth/download-invoice/${invoice.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      });

      if (response.ok) {
        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert(`Error downloading invoice: ${error.message}`);
    }
  };

  const handleDownloadAllInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/download-all-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `all-invoices-${user.email}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download all invoices. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading all invoices:', error);
      alert('Error downloading all invoices. Please try again.');
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Show success message
  };

  const handleEditProfile = () => {
    setEditForm({
      name: user.name,
      company: user.company
    });
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      console.log('Updating profile with:', editForm);
      console.log('User email:', user.email);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editForm,
          email: user.email
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        setUser(prev => ({
          ...prev,
          name: editForm.name,
          company: editForm.company
        }));
        setEditingProfile(false);
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        alert(`Failed to update profile: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProfile(false);
    setEditForm({
      name: user.name,
      company: user.company
    });
  };

  const handleManageSubscription = () => {
    setShowSubscriptionManager(true);
  };

  const handlePlanUpdate = () => {
    // Reload user data when plan is updated
    loadUserData();
  };

  // Function to update credits when they are used
  const updateCredits = (creditsUsed) => {
    setUser(prev => {
      const newCredits = Math.max(0, (prev.credits || 5) - creditsUsed);
      return {
        ...prev,
        credits: newCredits,
        usedCredits: Math.max(0, prev.totalCredits - newCredits)
      };
    });
    
    console.log(`Credits updated: ${creditsUsed} used, ${Math.max(0, (user.credits || 5) - creditsUsed)} remaining`);
  };

  // Function to get current credits from user state
  const getCurrentCredits = () => {
    return user.credits || 5;
  };

  // Sync functionality removed - credits are now managed by backend automatically

  // Function to refresh user data
  const refreshUserData = () => {
    // Reload user data from API
    loadUserData();
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
             <div className="flex items-center space-x-2">
               <button
                 onClick={refreshUserData}
                 className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                 title="Refresh Profile Data"
               >
                 <RefreshCw className="w-5 h-5" />
               </button>
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
                <p className="text-gray-600 mb-2 text-xs break-all max-w-full truncate" title={user.email}>{user.email}</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                          {user.subscription.amount > 0 ? 
                            `${formatCurrency(user.subscription.amount, user.subscription.currency)}/${user.subscription.interval}` : 
                            'Free plan'
                          }
                        </p>
                      </div>
                      {user.subscription.amount > 0 && user.subscription.currentPeriodEnd && user.subscription.currentPeriodEnd !== new Date().toISOString() && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">Next Billing</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatDate(user.subscription.currentPeriodEnd)}
                          </p>
                        </div>
                      )}
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
                      <button 
                        onClick={handleManageSubscription}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                      >
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
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Billing Cycle</span>
                              <span className="text-sm font-medium text-gray-900">
                                {user.subscription.amount > 0 ? 'Monthly' : 'None'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Amount</span>
                              <span className="text-sm font-medium text-gray-900">
                                {user.subscription.amount > 0 ? 
                                  formatCurrency(user.subscription.amount, user.subscription.currency) : 
                                  'Free plan'
                                }
                              </span>
                            </div>
                             {user.subscription.amount > 0 && user.subscription.currentPeriodEnd && user.subscription.currentPeriodEnd !== new Date().toISOString() && (
                               <div className="flex justify-between">
                                 <span className="text-sm text-gray-600">Next Billing</span>
                                 <span className="text-sm font-medium text-gray-900">
                                   {formatDate(user.subscription.currentPeriodEnd)}
                                 </span>
                               </div>
                             )}
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
                     <div className="flex items-center justify-between mb-6">
                       <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                       <button
                         onClick={refreshUserData}
                         className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                       >
                         <RefreshCw className="w-4 h-4" />
                         <span>Refresh</span>
                       </button>
                     </div>
                     <div className="space-y-4">
                       {user.paymentHistory && user.paymentHistory.length > 0 ? (
                         user.paymentHistory.map((payment) => (
                           <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                             <div className="flex items-center justify-between">
                               <div className="flex items-center space-x-4">
                                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                   payment.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
                                 }`}>
                                   {payment.status === 'paid' ? (
                                     <CheckCircle className="w-5 h-5 text-green-600" />
                                   ) : (
                                     <Clock className="w-5 h-5 text-yellow-600" />
                                   )}
                                 </div>
                                 <div>
                                   <p className="font-medium text-gray-900">{payment.description}</p>
                                   <p className="text-sm text-gray-600">Invoice ID: {payment.id}</p>
                                   <p className="text-xs text-gray-500 capitalize">Status: {payment.status}</p>
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
                           <button
                             onClick={refreshUserData}
                             className="mt-4 text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1 mx-auto"
                           >
                             <RefreshCw className="w-4 h-4" />
                             <span>Check for Updates</span>
                           </button>
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
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                      {user.invoices && user.invoices.length > 0 && (
                        <button
                          onClick={handleDownloadAllInvoices}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <DownloadIcon className="w-4 h-4" />
                          <span>Download All</span>
                        </button>
                      )}
                    </div>
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
                              value={editingProfile ? editForm.name : user.name}
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              disabled={!editingProfile}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              value={user.email}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                            <input
                              type="text"
                              value={editingProfile ? editForm.company : user.company}
                              onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                              disabled={!editingProfile}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                            <input
                              type="text"
                              value={user.role}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
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
                              <p className="font-medium text-gray-900">Monthly Payment Reminders</p>
                              <p className="text-sm text-gray-600">Get notified before monthly billing (disabled by default)</p>
                            </div>
                            <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                              <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1"></div>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">Plan Testing</h4>
                        <div className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-3">Test different pricing plans to see how they would affect your account:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <button 
                                onClick={() => setUser(prev => ({ ...prev, plan: 'Free', credits: 5, subscription: { ...prev.subscription, amount: 0, interval: 'none' } }))}
                                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                                  user.plan === 'Free' 
                                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                Free Plan<br/>
                                <span className="text-xs text-gray-500">5 credits, 5 days</span>
                              </button>
                              <button 
                                onClick={() => setUser(prev => ({ ...prev, plan: 'Basic', credits: 50, subscription: { ...prev.subscription, amount: 390, interval: 'month' } }))}
                                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                                  user.plan === 'Basic' 
                                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                Basic Plan<br/>
                                <span className="text-xs text-gray-500">$390/month, 50 contacts</span>
                              </button>
                              <button 
                                onClick={() => setUser(prev => ({ ...prev, plan: 'Premium', credits: 100, subscription: { ...prev.subscription, amount: 790, interval: 'month' } }))}
                                className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                                  user.plan === 'Premium' 
                                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                Premium Plan<br/>
                                <span className="text-xs text-gray-500">$790/month, 100 contacts</span>
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Note: This is for testing purposes only. Changes are not saved.</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        {editingProfile ? (
                          <>
                            <button 
                              onClick={handleSaveProfile}
                              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              Save Changes
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={handleEditProfile}
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                          >
                            Edit Profile
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Subscription Manager Modal */}
      {showSubscriptionManager && (
        <SubscriptionManager
          user={user}
          onClose={() => setShowSubscriptionManager(false)}
          onPlanUpdate={handlePlanUpdate}
        />
      )}
    </div>
  );
};

export default CustomerProfile; 
