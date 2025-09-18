import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';
import stateManager from '../utils/stateManager';
import SecurePDFViewer from '../components/SecurePDFViewer';
import BDTrackerPage from './BDTrackerPage';
import QuickGuide from './QuickGuide';
import BDInsights from './BDInsights';
// StripePayment will be imported dynamically when needed
import { 
  Grid, 
  Search, 
  FileText, 
  User, 
  DollarSign, 
  Heart, 
  Scale, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Lightbulb,
  Zap,
  Database,
  Target,
  Users,
  MapPin,
  Filter,
  Bell,
  Settings,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  Star,
  Eye,
  Share2,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Activity,
  Briefcase,
  Globe,
  Award,
  Sparkles,
  Info,
  Gift,
  Trash2,
  BookOpen,
  Circle,
  Download,
  Check,
  TrendingDown,
  Lock,
  RefreshCw,
  CreditCard,
  Tag,
  Mail
} from 'lucide-react';
import { 
  Card, 
  Group, 
  TextInput, 
  MultiSelect, 
  Select, 
  Textarea, 
  Button, 
  Divider,
  Flex,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoCircle } from '@tabler/icons-react';
import CustomerProfile from './CustomerProfile';
import SuspensionNotice from '../components/SuspensionNotice';
import SubscriptionManager from '../components/SubscriptionManager';
import LoadingSpinner, { CompactSpinner } from '../components/LoadingSpinner';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchType, setSearchType] = useState('Company Name');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [userCredits, setUserCredits] = useState(5);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showCustomerProfile, setShowCustomerProfile] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [userPaymentStatus, setUserPaymentStatus] = useState({ hasPaid: false, currentPlan: 'free' });
  const [error, setError] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(3);
  const [showError, setShowError] = useState(false);
  const [suspensionData, setSuspensionData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for user suspension
  const checkUserSuspension = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      console.log('🔍 Checking user suspension status...');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Suspension check response status:', response.status);

      if (response.status === 403) {
        const errorData = await response.json();
        console.log('🚫 Suspension check error data:', errorData);
        
        if (errorData.message === 'Account suspended' && errorData.suspended) {
          console.log('🚨 User is suspended! Setting suspension data:', errorData.suspended);
          setSuspensionData(errorData.suspended);
        } else if (errorData.message === 'Invalid token') {
          console.log('❌ Invalid token, redirecting to login');
          sessionStorage.removeItem('token');
          window.location.href = '/login';
        }
      } else if (response.ok) {
        console.log('✅ User is not suspended');
        // User is not suspended, clear any existing suspension data
        if (suspensionData) {
          console.log('🧹 Clearing existing suspension data');
          setSuspensionData(null);
        }
      }
    } catch (error) {
      console.error('❌ Error checking suspension:', error);
    }
  };

  // Fetch user data function - accessible throughout the component
  const fetchUserData = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      const token = sessionStorage.getItem('token');
      console.log('=== OPTIMIZED FETCH USER DATA ===');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      // Make all API calls in parallel for faster loading
      console.log('Making parallel API calls...');
      const [profileResponse, subscriptionResponse, invoicesResponse] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/auth/subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/api/auth/invoices`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      // Process profile data (most important)
      if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
        const profileData = await profileResponse.value.json();
        console.log('✅ Profile data loaded');
        
        setUser(profileData.user);
        
        // Update payment status
        if (profileData.user) {
          const hasPaid = profileData.user.paymentCompleted || false;
          const currentPlan = profileData.user.currentPlan || 'free';
          setUserPaymentStatus({ hasPaid, currentPlan });
        }
        
        // Handle credits
        const currentDate = new Date();
        const registrationDate = profileData.user.createdAt || profileData.user.registrationDate;
        
        if (registrationDate) {
          const regDate = new Date(registrationDate);
          const daysSinceRegistration = Math.floor((currentDate.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24));
          const trialExpired = daysSinceRegistration >= 5;
          
          if (trialExpired) {
            setUserCredits(0);
            setDaysRemaining(0);
          } else {
            const credits = profileData.user.currentCredits ?? 5;
            setUserCredits(credits);
            setDaysRemaining(5 - daysSinceRegistration);
          }
        } else {
          if (typeof profileData.user.currentCredits === 'number') {
            setUserCredits(profileData.user.currentCredits);
          }
        }
      } else {
        console.log('❌ Profile fetch failed');
      }
      
      // Process subscription data (optional)
      if (subscriptionResponse.status === 'fulfilled' && subscriptionResponse.value.ok) {
        const subscriptionData = await subscriptionResponse.value.json();
        console.log('✅ Subscription data loaded');
        
        if (subscriptionData) {
          const hasPaid = subscriptionData.paymentCompleted || false;
          const currentPlan = subscriptionData.currentPlan || 'free';
          setUserPaymentStatus({ hasPaid, currentPlan });
          
          // For paid users, update credits from subscription data
          if (subscriptionData.paymentCompleted && subscriptionData.currentPlan !== 'free') {
            if (typeof subscriptionData.currentCredits === 'number') {
              setUserCredits(subscriptionData.currentCredits);
            }
          }
        }
      } else {
        console.log('❌ Subscription fetch failed');
      }

      // Process invoices data (optional)
      if (invoicesResponse.status === 'fulfilled' && invoicesResponse.value.ok) {
        const invoicesData = await invoicesResponse.value.json();
        console.log('✅ Invoices data loaded');
        
        if (invoicesData.success && invoicesData.data) {
          setUser(prev => ({
            ...prev,
            invoices: invoicesData.data
          }));
        }
      } else {
        console.log('❌ Invoices fetch failed');
      }
      
      console.log('🎉 All data loaded successfully');
      
    } catch (err) {
      console.error('❌ Error fetching user data:', err);
      // Don't logout, user can still use the app with stored data
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // Manual refresh function for the refresh button
  const handleManualRefresh = useCallback(() => {
    console.log('Manual refresh: fetching updated user data');
    // ALWAYS fetch from backend for real-time credit accuracy
    fetchUserData();
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Fetch user data once on component mount
    fetchUserData();
  }, []);

  // Clear search query and global search results when navigating to other pages
  // Also refresh user data when navigating to search page to get updated credits
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Clear search query when navigating away from search page
    if (currentPath !== '/dashboard/search') {
      console.log('Clearing search query - navigating away from search page');
      setSearchQuery('');
      setSearchType('Company Name');
      setError(null);
    }
    
    // Clear global search results when navigating away from search page
    if (currentPath !== '/dashboard/search' && globalSearchResults) {
      console.log('Clearing global search results - navigating away from search page');
      setGlobalSearchResults(null);
    }
    
    // No more automatic refresh when navigating to search page
    // Credits should persist from previous usage
    // if (currentPath === '/dashboard/search') {
    //   console.log('Navigating to search page - refreshing user data to get updated credits');
    //   fetchUserData();
    // }
  }, [location.pathname, globalSearchResults]);

  // No more periodic refresh - credits should persist
  // useEffect(() => {
  //   let intervalId;
  //   
  //   if (location.pathname === '/dashboard/search') {
  //     console.log('Setting up periodic refresh for user data on search page');
  //     intervalId = setInterval(() => {
  //       console.log('Periodic refresh: fetching updated user data');
  //       fetchUserData();
  //     }, 30000); // Refresh every 30 seconds
  //   }
  //   
  //   return () => {
  //     if (intervalId) {
  //       console.log('Clearing periodic refresh interval');
  //       clearInterval(intervalId);
  //     }
  //   };
  // }, [location.pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const consumeCredit = async () => {
    console.log('💳 consumeCredit called with current credits:', userCredits);
    
    if (userCredits > 0) {
      try {
        const token = sessionStorage.getItem('token');
        
        // Call backend to use credit
        const response = await fetch(`${API_BASE_URL}/api/auth/use-credit`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const newCredits = data.remainingCredits;
          console.log(`✅ Backend credit update: ${userCredits} → ${newCredits}`);
          
          // Immediately update state
          setUserCredits(newCredits);
          
          console.log('💳 Frontend credits updated immediately:', newCredits);
          
          // Force dashboard refresh to show updated credits
          setTimeout(() => {
            console.log('🔄 Forcing dashboard refresh after credit consumption...');
            fetchUserData();
          }, 500); // Increased delay to ensure backend processes the update
          
          // Log credit usage for monitoring
          console.log(`💳 Credit used successfully. Remaining: ${newCredits}`);
          return true;
        } else {
          console.error('❌ Failed to use credit on backend');
          // Fallback to frontend-only update
          const newCredits = userCredits - 1;
          console.log(`🔄 Frontend fallback: ${userCredits} → ${newCredits}`);
          setUserCredits(newCredits);
          return true;
        }
      } catch (error) {
        console.error('❌ Error using credit:', error);
        // Fallback to frontend-only update
        const newCredits = userCredits - 1;
        console.log(`🔄 Frontend fallback (error): ${userCredits} → ${newCredits}`);
        setUserCredits(newCredits);
        return true;
      }
    } else {
      console.log('❌ No credits remaining, showing popup');
      setShowCreditPopup(true);
      return false;
    }
  };

  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

  const closeCreditPopup = () => {
    setShowCreditPopup(false);
  };

  const handleSettingsClick = () => {
    console.log('Profile button clicked, opening profile...');
    setShowCustomerProfile(true);
  };

  const handleBackFromProfile = () => {
    setShowCustomerProfile(false);
  };

  // Auto-close profile when navigating to other pages (but not when opening profile)
  useEffect(() => {
    // Only close profile if we're navigating away from dashboard pages entirely
    // Don't close when just switching between dashboard sub-pages
    if (showCustomerProfile && !location.pathname.startsWith('/dashboard')) {
      setShowCustomerProfile(false);
    }
  }, [location.pathname, showCustomerProfile]);


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Check for suspension before allowing search
    await checkUserSuspension();
    if (suspensionData) {
      setError('Your account is suspended. Please contact support.');
      return;
    }
    
    setSearchLoading(true);
    setError(null); // Clear any previous errors
    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        setError('Please login again to search.');
        return;
      }
      
      console.log('Searching with:', { searchType, searchQuery });
      console.log('Using token:', token);
      console.log('API URL:', `${API_BASE_URL}/search-biotech`);
      
      const response = await fetch(`${API_BASE_URL}/api/search-biotech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchType: searchType,
          searchQuery: searchQuery.trim()
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Search result:', result);
      console.log('Result success:', result.success);
      console.log('Result data:', result.data);
      console.log('Results length:', result.data?.results?.length);
      
      if (result.success) {
        // Check if no results found
        if (result.data.results.length === 0) {
          setError(`No results found for "${searchQuery}"`);
          setShowError(true);
          setGlobalSearchResults(null); // Clear any previous results
          // Still redirect to search page to show the error message
          navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(searchType)}`);
          
          // Auto hide after 4 seconds
          setTimeout(() => {
            setShowError(false);
          }, 4000);
          
          return;
        }
        
        // Set global search results for immediate access
        const globalResults = {
          results: result.data.results,
          searchType: searchType,
          searchQuery: searchQuery,
          isGlobalSearch: true // All global searches should hide the form
        };
        
        console.log('Setting global search results:', globalResults);
        console.log('Results count:', result.data.results.length);
        console.log('First result:', result.data.results[0]);
        setGlobalSearchResults(globalResults);
        
        // Clear any existing error
        setError(null);
        
        // Navigate to search page with search query as URL parameter
        console.log('Navigating to search page...');
        navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(searchType)}`);
      } else {
        throw new Error(result.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching data:', error);
      setSearchResults([]);
      setError('Search failed. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Grid, section: 'MAIN' },
    { name: 'Advanced Search', path: '/dashboard/search', icon: Search, section: 'DATA' },
    { name: 'BD Tracker', path: '/dashboard/bd-tracker', icon: TrendingUp, section: 'MY DEALS' },
    { name: 'Definitions', path: '/dashboard/resources/definitions', icon: FileText, section: 'RESOURCES' },
    { name: 'Quick Guide', path: '/dashboard/resources/quick-guide', icon: FileText, section: 'RESOURCES' },
    { name: 'Pricing', path: '/dashboard/pricing', icon: DollarSign, section: 'RESOURCES' },
                      { name: 'BD Insights', path: '/dashboard/resources/bd-insights', icon: TrendingUp, section: 'RESOURCES' },
    { name: 'Legal Disclaimer', path: '/dashboard/legal', icon: Scale, section: 'RESOURCES' },
    { name: 'Contact Us', path: '/dashboard/contact', icon: User, section: 'RESOURCES' },
  ];

  const getSectionItems = (section) => {
    return navItems.filter(item => item.section === section);
  };

  const renderContent = () => {
    const path = location.pathname;
    
    switch(path) {
      case '/dashboard':
        return <DashboardHome user={user} userPaymentStatus={userPaymentStatus} userCredits={userCredits} daysRemaining={daysRemaining} onManageSubscription={() => setShowSubscriptionManager(true)} />;
      case '/dashboard/search':
        // Check for suspension before allowing access to Search
        if (suspensionData) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-200">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-800 mb-2">Access Restricted</h2>
                <p className="text-red-600 mb-4">Your account is currently suspended.</p>
                <p className="text-sm text-gray-600 mb-6">
                  Reason: {suspensionData.reason}<br/>
                  Suspended until: {new Date(suspensionData.suspendedUntil).toLocaleString()}
                </p>
                <button
                  onClick={() => checkUserSuspension()}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Check Status
                </button>
              </div>
            </div>
          );
        }
        return <SearchPage 
          searchType={searchType} 
          useCredit={consumeCredit} 
          userCredits={userCredits}
          globalSearchResults={globalSearchResults}
          setGlobalSearchResults={setGlobalSearchResults}
          handleManualRefresh={handleManualRefresh}
          userPaymentStatus={userPaymentStatus}
        />;
      case '/dashboard/bd-tracker':
        // Check for suspension before allowing access to BD Tracker
        if (suspensionData) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-red-200">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-800 mb-2">Access Restricted</h2>
                <p className="text-red-600 mb-4">Your account is currently suspended.</p>
                <p className="text-sm text-gray-600 mb-6">
                  Reason: {suspensionData.reason}<br/>
                  Suspended until: {new Date(suspensionData.suspendedUntil).toLocaleString()}
                </p>
                <button
                  onClick={() => checkUserSuspension()}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Check Status
                </button>
              </div>
            </div>
          );
        }
        return <BDTrackerPage />;

      case '/dashboard/resources/definitions':
        return <Definitions />;
      case '/dashboard/resources/quick-guide':
        return <QuickGuide />;
      case '/dashboard/resources/bd-insights':
        return <BDInsights user={user} userPaymentStatus={userPaymentStatus} />;
      case '/dashboard/resources/free-content':
        return <FreeContent user={user} userPaymentStatus={userPaymentStatus} />;
      case '/dashboard/legal':
        return <LegalDisclaimer />;
      case '/dashboard/contact':
        return <Contact />;
      case '/dashboard/pricing':
        return <PricingPage />;
      case '/dashboard/pricing-management':
        return <PricingManagementPage />;
          
      default:
        return <DashboardHome user={user} userPaymentStatus={userPaymentStatus} userCredits={userCredits} daysRemaining={daysRemaining} onManageSubscription={() => setShowSubscriptionManager(true)} />;
    }
  };

  if (!user || isInitialLoading) {
    return (
      <LoadingSpinner
        size="xl"
        message="Loading Dashboard..."
        subMessage="Please wait while we load your data"
        fullScreen={true}
        color="cyber"
        showProgress={false}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Suspension Notice */}
      {suspensionData && (
        <SuspensionNotice 
          suspension={suspensionData} 
          onClose={() => setSuspensionData(null)}
        />
      )}
      
      {/* Enhanced Sidebar */}
      <motion.div 
        className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-500 overflow-y-auto ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        }`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Expand Arrow - Only visible when collapsed */}
        {sidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-50 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </motion.button>
        )}
        <div className={`h-full flex flex-col ${sidebarCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          {/* Enhanced Logo */}
          <div className="flex items-center justify-between mb-8 p-6">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-xl">B</span>
            </motion.div>
            {!sidebarCollapsed ? (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-white/70 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-white/70 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 space-y-6 px-6">
            {['MAIN', 'DATA', 'MY DEALS', 'RESOURCES'].map(section => (
              <div key={section}>
                {!sidebarCollapsed && (
                  <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 px-3">
                    {section}
                  </div>
                )}
                {getSectionItems(section).map((item) => {
                  // Hide paid-only items for free users
                  if (item.paidOnly && !userPaymentStatus.hasPaid) {
                    return null;
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={(e) => {
                        // Close profile when navigating to any page
                        if (showCustomerProfile) {
                          setShowCustomerProfile(false);
                        }
                        
                        if (item.path === '/dashboard/search' && location.pathname === '/dashboard/search') {
                          e.preventDefault();
                          const version = Date.now();
                          window.location.href = `/dashboard/search?v=${version}`;
                        }
                      }}
                      className={`group flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg transition-all duration-200 mb-1 ${
                        location.pathname === item.path 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className={`w-10 h-10 ${location.pathname === item.path ? 'text-white' : 'text-white/60 group-hover:text-white'}`} strokeWidth={1.5} />
                      {!sidebarCollapsed && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Enhanced Footer */}
          {!sidebarCollapsed && (
            <div className="text-xs text-white/40 px-9 py-4 border-t border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">BioPing Pro</span>
              </div>
              <p>2025 BioPing, Inc.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Enhanced Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Enhanced Top Bar */}
        <motion.div 
          className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-8 py-6 shadow-sm flex-shrink-0"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-600">Quick Search</div>
              <select 
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 text-base font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-80"
              >
                <option value="Company Name">Company Name</option>
                <option value="Contact Name">Contact Name</option>
              </select>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (error) setError(null); // Clear error when user starts typing
                    // Don't clear global search results when typing
                  }}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Type Keywords"
                  className="bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-2xl pl-14 pr-6 py-3 text-base font-medium focus:ring-4 focus:ring-blue-500/50 focus:border-blue-600 focus:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all duration-300 w-80 shadow-lg"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                >
                  {searchLoading ? (
                    <CompactSpinner size="small" color="cyber" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Global Search Error Display - Only show on search page */}
            {error && showError && location.pathname === '/dashboard/search' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm text-red-700 font-semibold">{error}</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="flex items-center space-x-4">
              {/* Enhanced Settings */}
              <button 
                onClick={handleSettingsClick}
                className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <Settings className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>

              {/* Enhanced User Profile */}
              <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSettingsClick}
                    title="Open Profile"
                  >
                    <span className="text-white font-bold text-xl">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </motion.div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-semibold text-gray-900">{user.name || 'User'}</div>
                </div>
              </div>
                <motion.button
                onClick={handleLogout}
                  className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                  title="Logout"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
              >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                </motion.button>
            </div>
          </div>
        </div>
        </motion.div>



        {/* Enhanced Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {showCustomerProfile ? (
                <CustomerProfile user={user} onBack={handleBackFromProfile} />
              ) : (
                renderContent()
              )}
              {/* Debug info */}
              {console.log('showCustomerProfile state:', showCustomerProfile)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Welcome Popup */}
      <AnimatePresence>
        {showWelcomePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
    </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Your Dashboard!</h2>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {userPaymentStatus?.hasPaid ? '💎 Premium Credits' : '🎁 Free Trial Credits'}
                  </h3>
                  <p className="text-gray-600 mb-3">
                    {userPaymentStatus?.hasPaid ? (
                      `You have <span className="font-bold text-blue-600">${userCredits} premium credits</span> to explore our platform!`
                    ) : (
                      `You have <span className="font-bold text-blue-600">${userCredits || 5} free credits</span> to explore our platform!`
                    )}
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Credits Remaining:</span>
                      <span className="text-lg font-bold text-blue-600">{userCredits || 5}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-gray-600">Expires in:</span>
                      <span className="text-sm font-medium text-orange-600">{daysRemaining || 5} days</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  Use these credits to view contact details and explore our biotech database. 
                  Each "Get Contact Info" action uses 1 credit.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={closeWelcomePopup}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    Get Started
                  </button>
                  <Link
                    to="/dashboard/pricing"
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 text-center"
                  >
                    View Plans
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit Exhausted Popup */}
      <AnimatePresence>
        {showCreditPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-white" />
          </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Free Credits Exhausted!</h2>
          <p className="text-gray-600 mb-6">
                  You've used all your free credits. Upgrade to a paid plan to continue accessing contact details and other features.
                </p>
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <Lock className="w-5 h-5 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-orange-700">Premium Features Locked</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Access to more contacts</li>
                    <li>• Access to free resources</li>
                    <li>• Enhanced support from BD experts</li>
          </ul>
        </div>
                <div className="flex space-x-3">
                  <Link
                    to="/dashboard/pricing"
                    onClick={closeCreditPopup}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 transition-all duration-200"
                  >
                    Upgrade Now
                  </Link>
                  <button
                    onClick={closeCreditPopup}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
                  >
                    Maybe Later
                  </button>
          </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Manager Modal */}
      {showSubscriptionManager && (
        <SubscriptionManager
          user={user}
          onClose={() => setShowSubscriptionManager(false)}
          onPlanUpdate={() => {
            // Refresh user data when plan is updated
            fetchUserData();
          }}
        />
      )}
              </div>
  );
};

// Enhanced Dashboard Home Component
const DashboardHome = ({ user, userPaymentStatus, userCredits, daysRemaining, onManageSubscription }) => {
  const stats = [
    { 
      label: 'Total Searches', 
      value: '1,247', 
      change: '+12%', 
      icon: Search, 
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    { 
      label: 'Saved Contacts', 
      value: '89', 
      change: '+5%', 
      icon: Users, 
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100'
    },
    { 
      label: 'Active Deals', 
      value: '23', 
      change: '+8%', 
      icon: TrendingUp, 
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100'
    },
    { 
      label: 'Response Rate', 
      value: '78%', 
      change: '+3%', 
      icon: BarChart3, 
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100'
    }
  ];

  const recentActivity = [
    { 
      type: 'search', 
      text: 'Searched for "oncology partnerships"', 
      time: '2 hours ago', 
      icon: Search,
      status: 'completed',
      color: 'blue'
    },
    { 
      type: 'contact', 
      text: 'Saved contact: Sarah Johnson at Moderna', 
      time: '4 hours ago', 
      icon: User,
      status: 'completed',
      color: 'green'
    },
    { 
      type: 'deal', 
      text: 'Updated deal status: Pfizer partnership', 
      time: '1 day ago', 
      icon: TrendingUp,
      status: 'pending',
      color: 'orange'
    },
    { 
      type: 'resource', 
      text: 'Downloaded BD Playbook', 
      time: '2 days ago', 
      icon: FileText,
      status: 'completed',
      color: 'purple'
    }
  ];

  const quickActions = [
    { 
      name: 'Search Database', 
      description: 'Find biotech companies and contacts',
      icon: Search, 
      path: '/dashboard/search', 
      color: 'blue', 
      gradient: 'from-blue-500 to-blue-600' 
    },
    { 
      name: 'Quick Guide', 
      description: 'Learn how to use the platform',
      icon: FileText, 
      path: '/dashboard/resources/quick-guide', 
      color: 'purple', 
      gradient: 'from-purple-500 to-purple-600' 
    },
    { 
      name: 'Free Resources', 
      description: 'Access free BD materials',
      icon: Heart, 
      path: '/dashboard/resources/free-content', 
      color: 'pink', 
      gradient: 'from-pink-500 to-pink-600' 
    },
    { 
      name: 'Request Demo', 
      description: 'Get personalized walkthrough',
      icon: Zap, 
      path: '/request-demo', 
      color: 'yellow', 
      gradient: 'from-yellow-500 to-yellow-600' 
    }
  ];

  return (
    <div className="space-y-8">
      {/* Enhanced Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName || user?.name?.split(' ')[0] || 'User'} 👋</h1>
            <div className="flex items-center space-x-6 mt-4">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                <Gift className="w-5 h-5" />
                <span className="font-medium">
                  Credits: {userPaymentStatus?.hasPaid ? `${userCredits} premium` : `${userCredits || 5} / ${daysRemaining || 5} days`}
                </span>
              </div>
            </div>
            
            {/* Upgrade Banner - Only show if user hasn't paid */}
            {userPaymentStatus && !userPaymentStatus.hasPaid && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between w-[350px]"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-4 h-4 text-white" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Upgrade Your Plan</h3>
                    <p className="text-xs text-blue-100">Get access to premium features</p>
                  </div>
                </div>
                <Link to="/dashboard/pricing">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 transition-all duration-200"
                  >
                    View Plans
                  </motion.button>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Manage Plan Button - Top Right Corner */}
          {userPaymentStatus && userPaymentStatus.hasPaid && userPaymentStatus.currentPlan !== 'free' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onManageSubscription}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-all duration-200 shadow-lg"
            >
              Manage Plan
            </motion.button>
          )}

        </div>
      </motion.div>

      {/* Enhanced Stats Grid - Hidden */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
          >
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                <p className="text-sm text-green-600 flex items-center font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stat.change}
                </p>
                </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.bgGradient} rounded-2xl flex items-center justify-center`}>
                <stat.icon className={`w-7 h-7 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
          </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
        </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path}>
                <motion.div 
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 border border-gray-200"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1 text-sm">{action.name}</p>
                  <p className="text-xs text-gray-600 leading-tight">{action.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-xl p-4 shadow-lg border border-gray-100"
        >
                      <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{user?.name || 'User'}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
            </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${userPaymentStatus?.hasPaid ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <span className="text-xs font-medium text-gray-700">Current Plan</span>
              </div>
              <div className="flex items-center space-x-1">
                {userPaymentStatus?.hasPaid ? (
                  <>
                    <CreditCard className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">{userPaymentStatus.currentPlan || 'Premium'}</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-700">Free Trial</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-xs font-medium text-gray-700">Credits Status</span>
              <span className="text-sm font-bold text-blue-600">
                {userPaymentStatus?.hasPaid ? (
                  `${userCredits} credits`
                ) : (
                  daysRemaining > 0 ? `${userCredits} / ${daysRemaining} days` : '0 credits (trial expired)'
                )}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-xs font-medium text-gray-700">Trial Status</span>
              <span className="text-xs font-semibold text-orange-600">
                {userPaymentStatus?.hasPaid ? (
                  'Paid Plan'
                ) : (
                  daysRemaining > 0 ? `${daysRemaining} days left` : 'Trial Expired'
                )}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-xs font-medium text-gray-700">Credits Used</span>
              <span className="text-xs font-semibold text-purple-600">
                {userPaymentStatus?.hasPaid ? (
                  `${Math.max(0, (userPaymentStatus.currentPlan === 'monthly' ? 50 : 100) - userCredits)} / ${userPaymentStatus.currentPlan === 'monthly' ? 50 : 100}`
                ) : (
                  `${Math.max(0, 5 - userCredits)} / 5`
                )}
              </span>
            </div>
          </div>
          
        </motion.div>
      </div>

    </div>
  );
};

// Enhanced Search Page Component
const SearchPage = ({ searchType = 'Company Name', useCredit: consumeCredit, userCredits, globalSearchResults, setGlobalSearchResults, handleManualRefresh, userPaymentStatus }) => {
  const [formData, setFormData] = useState({
    drugName: '',
    diseaseArea: '',
    stageOfDevelopment: '',
      modality: '',
    lookingFor: '',
    region: '',
    function: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactDetails, setContactDetails] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [revealedEmails, setRevealedEmails] = useState(new Set());
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [allContactsData, setAllContactsData] = useState([]);
  const [expandedContactDetails, setExpandedContactDetails] = useState(new Set());
  const [currentSearchType, setCurrentSearchType] = useState(searchType);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [groupedResults, setGroupedResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [daysRemaining, setDaysRemaining] = useState(3);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [allContactsCurrentPage, setAllContactsCurrentPage] = useState(1);
  const [allContactsItemsPerPage] = useState(25);

  // Function to perform search from URL parameters
  const performSearchFromURL = async (searchQuery, searchType) => {
    setLoading(true);
    setError(null);
    setIsGlobalSearch(true);
    
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/search-biotech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchType: searchType,
          searchQuery: searchQuery.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSearchResults(result.data?.results || []);
          setCurrentSearchType(searchType);
          setCurrentSearchQuery(searchQuery);
          setError(null);
        } else {
          setError(result.message || 'Search failed');
        }
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle URL parameters for auto-filling form and showing results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    const searchType = urlParams.get('type') || 'Company Name';
    
    if (searchQuery) {
      console.log('URL parameters found:', { searchQuery, searchType });
      // Auto-fill the form with the search query
      setFormData(prev => ({
        ...prev,
        drugName: searchQuery
      }));
      setCurrentSearchType(searchType);
      setCurrentSearchQuery(searchQuery);
    }
  }, []); // Run only once on component mount

  // Load search results from global state, sessionStorage and location state on component mount
  useEffect(() => {
    const checkForStoredResults = () => {
      console.log('SearchPage: Checking for stored results:', { globalSearchResults });
      console.log('SearchPage: globalSearchResults type:', typeof globalSearchResults);
      console.log('SearchPage: globalSearchResults.results:', globalSearchResults?.results);
      console.log('SearchPage: globalSearchResults.results length:', globalSearchResults?.results?.length);
      
      if (globalSearchResults && globalSearchResults.results && globalSearchResults.results.length > 0) {
        // GLOBAL SEARCH: hide form after results
        console.log('SearchPage: Setting global search results:', globalSearchResults);
        console.log('SearchPage: Results count:', globalSearchResults.results?.length);
        console.log('SearchPage: First result:', globalSearchResults.results[0]);
        setSearchResults(globalSearchResults.results);
        setCurrentSearchType(globalSearchResults.searchType || 'Company Name');
        setCurrentSearchQuery(globalSearchResults.searchQuery || '');
        setIsGlobalSearch(globalSearchResults.isGlobalSearch);
        setCurrentPage(1); // Reset to first page
        setError(null); // Clear any existing error
        console.log('SearchPage: Results set successfully');
        return;
      }
      
      // If no global results but we have URL parameters, try to perform search
      const urlParams = new URLSearchParams(window.location.search);
      const searchQuery = urlParams.get('q');
      const searchType = urlParams.get('type') || 'Company Name';
      
      if (searchQuery && !globalSearchResults) {
        console.log('No global results but URL parameters found, performing search:', { searchQuery, searchType });
        // Perform search with URL parameters
        performSearchFromURL(searchQuery, searchType);
        return;
      }
      
      // Clear search results when navigating to search page without results
      setSearchResults([]);
      setCurrentSearchType('Company Name');
      setCurrentSearchQuery('');
      setIsGlobalSearch(false);
      // DRUG SEARCH: always show form
      const location = window.location;
      const state = window.history.state;
      if (state && state.searchResults) {
        setSearchResults(state.searchResults);
        setCurrentSearchType(state.searchType || 'Company Name');
        setCurrentSearchQuery(state.searchQuery || '');
        setIsGlobalSearch(false);
        return;
      }
      // Search results are now loaded from global state only
      // No more sessionStorage dependency
    };
    checkForStoredResults();
    const timer = setTimeout(checkForStoredResults, 50);
    return () => clearTimeout(timer);
  }, [globalSearchResults, setGlobalSearchResults]);

  // Process search results to group by company
  useEffect(() => {
    console.log('Processing search results:', { searchResults: searchResults.length, isGlobalSearch, currentSearchType });
    
    // For Contact Name searches, don't group - show individual contacts
    if (searchResults.length > 0 && isGlobalSearch && currentSearchType === 'Contact Name') {
      console.log('Contact Name search - showing individual contacts');
      setGroupedResults({}); // Don't group for contact searches
    } else if (searchResults.length > 0 && isGlobalSearch) {
      // Group ONLY for Company Name searches
      const grouped = searchResults.reduce((acc, item) => {
        if (!acc[item.companyName]) {
          acc[item.companyName] = {
            companyInfo: {
              name: item.companyName,
              region: item.region,
              tier: item.tier,
              modality: item.modality
            },
            contacts: []
          };
        }
        acc[item.companyName].contacts.push(item);
        return acc;
      }, {});
      console.log('Grouped results:', grouped);
      setGroupedResults(grouped);
      
      // Auto-populate Contact Name field with first contact when searching by company
      if (currentSearchType === 'Company Name' && searchResults.length > 0) {
        const firstContact = searchResults[0];
        if (firstContact.contactPerson) {
          setFormData(prev => ({
            ...prev,
            contactPerson: firstContact.contactPerson
          }));
          console.log('Auto-populated Contact Name field with:', firstContact.contactPerson);
        }
      }
    } else {
      setGroupedResults({});
    }
  }, [searchResults, currentSearchType, isGlobalSearch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Don't reset isGlobalSearch here - let it persist
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // DRUG SEARCH: explicitly set isGlobalSearch to false
    setIsGlobalSearch(false);
    // Set search type to Advanced Search when using the form
    setCurrentSearchType('Advanced Search');

    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/search-biotech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          drugName: formData.drugName,
          diseaseArea: formData.diseaseArea,
          developmentStage: formData.stageOfDevelopment,
          modality: formData.modality,
          partnerType: formData.lookingFor,
          region: formData.region,
          function: formData.function
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search data');
      }

      const result = await response.json();
      
      if (result.success) {
        setSearchResults(result.data.results);
        // Don't change form visibility here - let useEffect handle it
        console.log('Search results set, form visibility will be handled by useEffect');
        if (result.data.message) {
          setError(result.data.message);
        } else {
          setError(null);
        }
      } else {
        throw new Error(result.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error searching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };





  const handleViewMore = (company) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(company.id)) {
        newSet.delete(company.id);
      } else {
        newSet.add(company.id);
      }
      return newSet;
    });
  };

  const handleRevealEmail = async (companyId) => {
    console.log('🔍 handleRevealEmail called for company:', companyId);
    
    // Check if we have credits before proceeding
    if (userCredits <= 0) {
      console.log('❌ No credits remaining, showing popup');
      setShowCreditPopup(true);
      return;
    }
    
    try {
      // Consume credit first
      const creditConsumed = await consumeCredit();
      
      if (creditConsumed) {
        console.log('✅ Credit consumed successfully, revealing email');
        // Only reveal email if credit was successfully consumed
        setRevealedEmails(prev => {
          const newSet = new Set(prev);
          if (newSet.has(companyId)) {
            newSet.delete(companyId);
          } else {
            newSet.add(companyId);
          }
          return newSet;
        });
        
        // Force immediate UI update to show reduced credits
        console.log('🔄 Credit consumed, email revealed, waiting for backend refresh...');
      } else {
        console.log('❌ Failed to consume credit');
      }
    } catch (error) {
      console.error('❌ Error in handleRevealEmail:', error);
    }
  };

  const handleViewMoreDetails = (contactId) => {
    setExpandedContactDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email).then(() => {
      // Optional: Show a success message
      console.log('Email copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy email:', err);
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = searchResults.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const closeCreditPopup = () => {
    setShowCreditPopup(false);
  };

  // daysRemaining is passed as a prop from parent component



  const diseaseAreas = [
    'Oncology',
    'Cardiovascular',
    'Neurology',
    'Immunology',
    'Rare Diseases',
    'Infectious Diseases',
    'Metabolic Disorders'
  ];

  const developmentStages = [
    'Preclinical',
    'Phase I',
    'Phase II',
    'Phase III',
    'Approved',
    'Market'
  ];

  const modalities = [
    'Small Molecule',
    'Biologic',
    'Cell Therapy',
    'Gene Therapy',
    'Antibody',
    'Vaccine'
  ];

  // Partner types available for future use
  // const partnerTypes = [
  //   'Licensing Partner',
  //   'Co-development Partner',
  //   'Merger & Acquisition',
  //   'Investment Partner',
  //   'Manufacturing Partner',
  //   'Distribution Partner'
  // ];

  // Regions available for future use
  // const regions = [
  //   'North America',
  //   'Europe',
  //   'Asia-Pacific',
  //   'Latin America',
  //   'Middle East & Africa'
  // ];

  // Functions available for future use
  // const functions = [
  //   'Business Development',
  //   'R&D',
  //   'Clinical Development',
  //   'Regulatory Affairs',
  //   'Manufacturing',
  //   'Commercial',
  //   'Executive'
  // ];

  return (
    <div className="space-y-6">

      
      {(() => {
        console.log('SearchPage Render:', { 
          isGlobalSearch, 
          currentSearchType, 
          searchResultsLength: searchResults.length,
          hasResults: searchResults.length > 0
        });
        const shouldHideForm = searchResults.length > 0;
        console.log('Should hide form:', shouldHideForm);
        return !shouldHideForm;
      })() && (
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Criteria</h2>
          
          <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Asset Profile Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">A</span>
              </span>
              Asset Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Drug Name */}
            <div>
              <label htmlFor="drugName" className="block text-sm font-semibold text-gray-900 mb-2">
                Drug Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="drugName"
                name="drugName"
                value={formData.drugName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            placeholder="Drug Name"
                required
              />
              <p className="text-xs text-gray-500 mt-1">About Your Pipeline Drug</p>
            </div>



            {/* Disease Area */}
            <div>
              <label htmlFor="diseaseArea" className="block text-sm font-semibold text-gray-900 mb-2">
                Disease Area <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="diseaseArea"
                  name="diseaseArea"
                  value={formData.diseaseArea}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
                  required
                >
                  <option value="">Select Disease Area</option>
                  <option value="TA1 - Oncology">TA1 - Oncology</option>
                  <option value="TA2 - Cardiovascular">TA2 - Cardiovascular</option>
                  <option value="TA3 - Neuroscience">TA3 - Neuroscience</option>
                  <option value="TA4 - Immunology & Autoimmune">TA4 - Immunology & Autoimmune</option>
                  <option value="TA5 - Infectious Diseases">TA5 - Infectious Diseases</option>
                  <option value="TA6 - Respiratory">TA6 - Respiratory</option>
                  <option value="TA7 - Endocrinology & Metabolic">TA7 - Endocrinology & Metabolic</option>
                  <option value="TA8 - Rare / Orphan">TA8 - Rare / Orphan</option>
                  <option value="TA9 - Hematology">TA9 - Hematology</option>
                  <option value="TA10 - Gastroenterology">TA10 - Gastroenterology</option>
                  <option value="TA11 - Dermatology">TA11 - Dermatology</option>
                  <option value="TA12 - Ophthalmology">TA12 - Ophthalmology</option>
                  <option value="TA13 - Kidney / Renal">TA13 - Kidney / Renal</option>
                  <option value="TA14 - MSK Disease">TA14 - MSK Disease</option>
                  <option value="TA15 - Women's Health">TA15 - Women's Health</option>
                  <option value="TA16 - Pain">TA16 - Pain</option>
                  <option value="TA17 - Urology">TA17 - Urology</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Max. 1 Selection Allowed.</p>
            </div>

            {/* Stage of Development */}
            <div>
              <label htmlFor="stageOfDevelopment" className="block text-sm font-semibold text-gray-900 mb-2">
                Stage of Development
              </label>
              <div className="relative">
                <select
                  id="stageOfDevelopment"
                  name="stageOfDevelopment"
                  value={formData.stageOfDevelopment}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
                >
                  <option value="">Select Stage</option>
                  <option value="Preclinical">Preclinical</option>
                  <option value="Phase 1">Phase 1</option>
                  <option value="Phase 2">Phase 2</option>
                  <option value="Phase 3">Phase 3</option>
                  <option value="Approved">Approved</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Optional</p>
            </div>

            {/* Modality */}
            <div>
              <label htmlFor="modality" className="block text-sm font-semibold text-gray-900 mb-2">
                Modality
              </label>
              <div className="relative">
                <select
                  id="modality"
                  name="modality"
                  value={formData.modality}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
                >
                  <option value="">Select Modality</option>
                  <option value="Small Molecule">Small Molecule</option>
                  <option value="Large Molecule">Large Molecule</option>
                  <option value="Cell Therapy">Cell Therapy</option>
                  <option value="Gene Therapy">Gene Therapy</option>
                  <option value="Biologics">Biologics</option>
                  <option value="Monoclonal Antibodies">Monoclonal Antibodies</option>
                  <option value="Vaccine">Vaccine</option>
                  <option value="Recombinant Protein">Recombinant Protein</option>
                  <option value="Peptide">Peptide</option>
                  <option value="RNA Therapy">RNA Therapy</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Optional</p>
            </div>
          </div>
          </div>
          
          {/* Partner Match Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">P</span>
              </span>
              Partner Match
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Looking For */}
            <div>
              <label htmlFor="lookingFor" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
                Looking for <span className="text-red-500 ml-1">*</span>
                <div className="relative group">
                  <Info className="w-4 h-4 ml-2 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Max. 1 Selection Allowed.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </label>
              <div className="relative">
                <select
                  id="lookingFor"
                  name="lookingFor"
                  value={formData.lookingFor}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
                  required
                >
                  <option value="">Select Partner Type</option>
                  <option value="Tier 1 - Large Pharma">Tier 1 - Large Pharma</option>
                  <option value="Tier 2 - Mid-Size">Tier 2 - Mid-Size</option>
                  <option value="Tier 3 - Small Biotech's">Tier 3 - Small Biotech's</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Potential Partner Search Criterion</p>
            </div>

            {/* Region */}
            <div>
              <label htmlFor="region" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
                Region
                <div className="relative group">
                  <Info className="w-4 h-4 ml-2 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Max. 1 Selection Allowed.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </label>
              <div className="relative">
                <select
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
                >
                  <option value="">Select Region</option>
                  <option value="Africa">Africa</option>
                  <option value="Asia">Asia</option>
                  <option value="Europe">Europe</option>
                  <option value="North America">North America</option>
                  <option value="South America">South America</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">HQ Country of Partner</p>
            </div>

            {/* Function */}
            <div>
              <label htmlFor="function" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
                Function
                <div className="relative group">
                  <Info className="w-4 h-4 ml-2 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Max. 1 Selection Allowed.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </label>
              <div className="relative">
                <select
                  id="function"
                  name="function"
                  value={formData.function}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 appearance-none bg-white"
                >
                  <option value="">Select Function</option>
                  <option value="Business Development">Business Development</option>
                  <option value="Non-BD">Non-BD</option>
                  <option value="All">All</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Contact Person Function</p>
            </div>
          </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-end pt-6">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <CompactSpinner size="small" color="cyber" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </motion.button>
          </div>
        </form>
        </div>
      )}

      {/* Search Results */}
      {error && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-6 shadow-lg">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-700 mb-3">No Results Found</h3>
              <p className="text-blue-600 font-semibold text-lg mb-4">{error}</p>
              <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Quick Tip</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Try searching for <span className="font-semibold text-blue-600">"UCB"</span> in the Company Name field to see available companies in our database.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          {/* Search Results Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Search Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Number of Unique Companies</div>
                <div className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const uniqueCompanies = new Set(searchResults.map(result => result.companyName));
                    return uniqueCompanies.size;
                  })()}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-gray-600">Number of Unique Contacts</div>
                  {currentSearchType === 'Company Name' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (searchResults.length > 0) {
                          setAllContactsData(searchResults);
                          setShowAllContacts(true);
                        }
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Show All Contacts
                    </motion.button>
                  )}
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {searchResults.length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Search Results</h3>
              <p className="text-gray-600">
                Showing {startIndex + 1} - {Math.min(endIndex, searchResults.length)} of {searchResults.length} results
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Gift className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Credits Left</div>
                    <div className="text-lg font-bold text-blue-600">
                      {userPaymentStatus.hasPaid ? (
                        `${userCredits} credits`
                      ) : (
                        daysRemaining > 0 ? `${userCredits} / ${daysRemaining} days` : '0 credits (trial expired)'
                      )}
                    </div>

                  </div>
                </div>
              </div>
              

            </div>
          </div>

          <div className="w-full">
            {isGlobalSearch && currentSearchType === 'Company Name' ? (
                // GLOBAL SEARCH: Simple grouped table for Company Name searches
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COMPANY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COUNTRY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIER</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MODALITY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACTS</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedResults).map(([companyName, companyData]) => (
                    <tr key={companyName} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{companyName}</div>
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">PUBLIC</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{companyData.companyInfo.region || 'United States'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-blue-600 font-medium">{companyData.companyInfo.tier || 'Large Pharma'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-blue-600 font-medium">{companyData.companyInfo.modality || 'SM, LM, CT, GT'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-600">{companyData.contacts.length}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              // CONTACT SEARCH OR DRUG SEARCH: Detailed contact table
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COMPANY</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT INFORMATION</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentResults.map((result) => (
                    <Fragment key={result.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                              <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{result.companyName}</div>
                              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">PUBLIC</div>
                          </div>
                      </div>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-semibold text-blue-600">
                            {result.contactPerson ? result.contactPerson.charAt(0).toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{result.contactPerson}</div>
                          <div className="text-sm text-gray-500">{result.contactTitle || 'Exec. Director'}</div>
                          <div className="text-sm text-gray-500">{result.contactFunction || 'Business Development'}</div>
                        </div>
                      </div>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-900">
                            {revealedEmails.has(result.id) 
                              ? (result.email || `${result.contactPerson?.toLowerCase().replace(' ', '.')}@${result.companyName?.toLowerCase()}.com`)
                              : `@${result.companyName?.toLowerCase()}.com`
                            }
                          </span>
                          {revealedEmails.has(result.id) && (
                            <button
                              onClick={() => handleCopyEmail(result.email || `${result.contactPerson?.toLowerCase().replace(' ', '.')}@${result.companyName?.toLowerCase()}.com`)}
                              className="ml-1 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                              title="Copy email"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 underline decoration-dotted cursor-pointer" onClick={() => handleViewMoreDetails(result.id)}>
                          {expandedContactDetails.has(result.id) ? 'VIEW LESS' : 'VIEW MORE'}
                          <svg className={`w-3 h-3 inline ml-1 transition-transform ${expandedContactDetails.has(result.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <button
                          onClick={() => handleRevealEmail(result.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Get Contact Info
                        </button>
                      </div>
                    </td>
                  </tr>
                      {/* Expanded Details Section */}
                      {expandedContactDetails.has(result.id) && (
                        <tr className="bg-gray-50">
                          <td colSpan="5" className="px-6 py-4">
                            <div className="bg-white rounded-lg p-4 space-y-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Contact Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">TIER:</span>
                                    <span className="text-sm text-gray-900">{result.tier || 'Large Pharma'}</span>
          </div>
            <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">MODALITY:</span>
                                    <span className="text-sm text-gray-900">{result.modality || 'SM, LM, CT, GT, Bx, RNA'}</span>
            </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">BD FOCUS AREA:</span>
                                    <span className="text-sm text-gray-900">{result.bdPersonTAFocus || 'NULL'}</span>
            </div>
          </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-500">REGION:</span>
                                    <span className="text-sm text-gray-900">{result.region || 'United States'}</span>
        </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                                             )}
                     </Fragment>
                  ))}
                </tbody>
                              </table>
              )}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          

        </div>
      )}

      {/* All Contacts Section */}
      {showAllContacts && allContactsData.length > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">All Contacts</h3>
              <p className="text-gray-600">
                Showing all {allContactsData.length} contacts from your search
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAllContacts(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Hide Contacts
            </motion.button>
          </div>

          {/* Pagination for All Contacts */}
          {allContactsData.length > allContactsItemsPerPage && (
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                Showing {((allContactsCurrentPage - 1) * allContactsItemsPerPage) + 1} - {Math.min(allContactsCurrentPage * allContactsItemsPerPage, allContactsData.length)} of {allContactsData.length} contacts
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAllContactsCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={allContactsCurrentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.ceil(allContactsData.length / allContactsItemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setAllContactsCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === allContactsCurrentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setAllContactsCurrentPage(prev => Math.min(prev + 1, Math.ceil(allContactsData.length / allContactsItemsPerPage)))}
                  disabled={allContactsCurrentPage === Math.ceil(allContactsData.length / allContactsItemsPerPage)}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {allContactsData
              .slice((allContactsCurrentPage - 1) * allContactsItemsPerPage, allContactsCurrentPage * allContactsItemsPerPage)
              .map((contact, index) => (
              <div key={contact.id || index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {contact.contactPerson ? contact.contactPerson.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {contact.contactPerson || 'Contact Person'}
                        </h4>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {contact.position || 'Position'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-4 h-4" />
                          <span>{contact.companyName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{contact.country || 'Country'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          <span>{contact.tier || 'Tier'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        // Check if we have credits before proceeding
                        if (userCredits <= 0) {
                          setShowCreditPopup(true);
                          return;
                        }
                        
                        try {
                          // Consume credit first
                          const creditConsumed = await consumeCredit();
                          
                          if (creditConsumed) {
                            // Only reveal email if credit was successfully consumed
                            setRevealedEmails(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(contact.id)) {
                                newSet.delete(contact.id);
                              } else {
                                newSet.add(contact.id);
                              }
                              return newSet;
                            });
                            
                            // Show contact details
                            setContactDetails([contact]);
                            setShowContactModal(true);
                          } else {
                            console.log('❌ Failed to consume credit');
                          }
                        } catch (error) {
                          console.error('❌ Error in handleRevealEmail:', error);
                        }
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Get Contact Info</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Contact Details</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {contactDetails.map((contact) => (
                <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{contact.companyName}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Contact:</span>
                      <span className="ml-2 font-medium">{contact.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      {revealedEmails.has(contact.id) ? (
                        <span className="ml-2 text-blue-600 font-medium">{contact.email}</span>
                      ) : (
                        <span className="ml-2 text-gray-400 italic">Click "Get Contact Info" to reveal</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      {revealedEmails.has(contact.id) ? (
                        <span className="ml-2 font-medium">{contact.phone}</span>
                      ) : (
                        <span className="ml-2 text-gray-400 italic">Click "Get Contact Info" to reveal</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Website:</span>
                      <span className="ml-2 text-blue-600 font-medium">{contact.website}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contacts: {contactDetails.length}</p>
                  <p className="text-sm text-gray-600">Price: ${contactDetails.length * 99}</p>
                </div>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Credit Exhausted Popup */}
      <AnimatePresence>
        {showCreditPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Free Credits Exhausted!</h2>
                <p className="text-gray-600 mb-6">
                  You've used all your free credits. Upgrade to a paid plan to continue accessing contact details and other premium features.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-700">
                      Current Status: {userCredits} credits remaining
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-medium text-orange-700">Premium Features Locked</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Access to unlimited contacts</li>
                    <li>• Advanced search filters</li>
                    <li>• Priority support</li>
                    <li>• Export capabilities</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3">
                  <Link
                    to="/dashboard/pricing"
                    onClick={closeCreditPopup}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 transition-all duration-200 text-center"
                  >
                    Upgrade Now
                  </Link>
                  <button
                    onClick={closeCreditPopup}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={closeCreditPopup}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Saved Searches Component
const SavedSearches = () => {
  const [savedSearches, setSavedSearches] = useState([
    {
      id: 1,
      name: 'Oncology Partnerships',
      criteria: 'Disease Area: Oncology, Stage: Phase II-III',
      lastUsed: '2 hours ago',
      results: 24,
      status: 'active'
    },
    {
      id: 2,
      name: 'Neurology Collaborations',
      criteria: 'Disease Area: Neurology, Modality: Small Molecule',
      lastUsed: '1 day ago',
      results: 18,
      status: 'active'
    },
    {
      id: 3,
      name: 'Rare Disease Partners',
      criteria: 'Disease Area: Rare Diseases, Region: Europe',
      lastUsed: '3 days ago',
      results: 12,
      status: 'inactive'
    }
  ]);

  const handleDeleteSearch = (id) => {
    setSavedSearches(prev => prev.filter(search => search.id !== id));
  };

  const handleRunSearch = (search) => {
    console.log('Running search:', search);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved Searches</h2>
            <p className="text-gray-600">Manage your saved search criteria and results</p>
      </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Search</span>
          </motion.button>
        </div>

        {/* Search Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Searches</p>
                <p className="text-2xl font-bold text-blue-900">{savedSearches.length}</p>
              </div>
              <Search className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Searches</p>
                <p className="text-2xl font-bold text-green-900">{savedSearches.filter(s => s.status === 'active').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Results</p>
                <p className="text-2xl font-bold text-purple-900">{savedSearches.reduce((sum, s) => sum + s.results, 0)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Saved Searches List */}
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <motion.div
              key={search.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${search.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <h3 className="font-semibold text-gray-900">{search.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRunSearch(search)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    Run Search
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteSearch(search.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              <p className="text-gray-600 mb-3">{search.criteria}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Last used: {search.lastUsed}</span>
                <span>{search.results} results found</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced Definitions Component
const Definitions = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTerm, setExpandedTerm] = useState(null);

  const definitions = {
    'Drug Development': [
      {
        term: 'Modality of Drug',
        definition: 'The type of therapeutic approach used to treat a disease (e.g., small molecule, antibody, gene therapy, cell therapy)',
        examples: ['Small molecule', 'Antibody', 'Gene therapy', 'Cell therapy'],
        details: 'Drug modality refers to the molecular structure and mechanism of action of a therapeutic compound.',
        icon: '💊'
      },
      {
        term: 'Disease Area',
        definition: 'The specific category of medical conditions a drug targets (e.g., oncology, neurology, autoimmune)',
        examples: ['Oncology', 'Neurology', 'Autoimmune'],
        details: 'Disease areas help categorize drugs by their therapeutic focus and target patient population.',
        icon: '🩺'
      }
    ],
    'Medical Conditions': [
      {
        term: 'MSK Musculoskeletal disease',
        definition: 'Musculoskeletal disease; includes conditions affecting bones, muscles, joints, ligaments, and tendons (e.g., arthritis, osteoporosis, back pain)',
        examples: ['Arthritis', 'Osteoporosis', 'Back pain'],
        details: 'MSK disorders are among the most common causes of disability and chronic pain worldwide.',
        icon: '🦴'
      }
    ],
    'Partner Search Criteria': [
      {
        term: 'Large Pharma',
        definition: 'Established, global pharmaceutical companies with broad pipelines, significant revenues, and commercial infrastructure, market cap generally >$10B (e.g., Pfizer, Novartis, Roche)',
        examples: ['Pfizer', 'Novartis', 'Roche'],
        details: 'Large pharma companies typically have extensive global operations, established commercial infrastructure, and diverse therapeutic portfolios.',
        icon: '🏢'
      },
      {
        term: 'Mid-Size Pharma',
        definition: 'Pharmaceutical companies with moderate revenues and pipelines—larger than biotech startups but smaller than global pharma, market cap generally ~$2-$10B (e.g., Jazz, Incyte, Ipsen)',
        examples: ['Jazz', 'Incyte', 'Ipsen'],
        details: 'Mid-size pharma companies often focus on specific therapeutic areas and have more targeted commercial strategies.',
        icon: '🏛️'
      },
      {
        term: 'Small Biotech',
        definition: 'Companies focused on developing drugs using biological or genetic technologies—often early-stage and innovation-driven, mostly private and venture backed',
        examples: ['Early-stage biotech', 'Venture-backed companies', 'Innovation-driven startups'],
        details: 'Small biotech companies are typically focused on breakthrough technologies and often partner with larger companies for commercialization.',
        icon: '🧬'
      },
      {
        term: 'HQ',
        definition: 'Headquarter location of the partner company (search criterion)',
        examples: ['North America', 'Europe', 'Asia-Pacific'],
        details: 'Headquarters location is an important factor in partnership decisions due to regulatory, commercial, and strategic considerations.',
        icon: '📍'
      }
    ]
  };

  const categories = Object.keys(definitions);
  const filteredDefinitions = selectedCategory === 'all' 
    ? Object.values(definitions).flat()
    : definitions[selectedCategory] || [];

  const searchFiltered = filteredDefinitions.filter(def => 
    def.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    def.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = (term) => {
    setExpandedTerm(expandedTerm === term ? null : term);
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
              >
                Terms & Abbreviations
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-blue-100 text-xl font-medium"
              >
                A quick guide to commonly used names and shortcuts
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">{searchFiltered.length} terms</span>
            </motion.div>
          </div>

          {/* Enhanced Search and Filter */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search definitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 pl-12 border-0 rounded-2xl focus:ring-4 focus:ring-white focus:ring-opacity-30 bg-white/20 backdrop-blur-sm text-white placeholder-blue-100 text-lg transition-all duration-300"
              />
              <Search className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-200" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-4 border-0 rounded-2xl focus:ring-4 focus:ring-white focus:ring-opacity-30 bg-white/20 backdrop-blur-sm text-white text-lg font-medium transition-all duration-300"
            >
              <option value="all" className="text-gray-800">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category} className="text-gray-800">{category}</option>
              ))}
            </select>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Definitions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {searchFiltered.map((def, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group bg-white rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-500 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">{def.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-2xl mb-1">{def.term}</h3>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleExpanded(def.term)}
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {expandedTerm === def.term ? '−' : '+'}
                </motion.button>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed text-base">{def.definition}</p>
              
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Examples:</p>
                <div className="flex flex-wrap gap-3">
                  {def.examples.map((example, idx) => (
                    <motion.span 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200 hover:from-blue-200 hover:to-purple-200 transition-all duration-300"
                    >
                      {example}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Enhanced Expandable Details */}
              {expandedTerm === def.term && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 pt-6 mt-6"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Additional Details:</p>
                    <p className="text-gray-600 text-base leading-relaxed">{def.details}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced No Results Message */}
      {searchFiltered.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Search className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No definitions found</h3>
          <p className="text-gray-600 text-lg">Try adjusting your search terms or browse all categories</p>
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Coaching Tips Component
const CoachingTips = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [completedTips, setCompletedTips] = useState([]);

  const coachingTips = {
    'Communication': [
      {
        id: 1,
        title: 'Crafting the Perfect Pitch',
        description: 'Learn how to create compelling presentations that resonate with potential partners.',
        duration: '15 min',
        difficulty: 'Intermediate',
        completed: false
      },
      {
        id: 2,
        title: 'Active Listening Techniques',
        description: 'Master the art of listening to understand partner needs and concerns.',
        duration: '10 min',
        difficulty: 'Beginner',
        completed: false
      }
    ],
    'Negotiation': [
      {
        id: 3,
        title: 'Win-Win Deal Structures',
        description: 'Create partnership agreements that benefit all parties involved.',
        duration: '20 min',
        difficulty: 'Advanced',
        completed: false
      },
      {
        id: 4,
        title: 'Handling Objections',
        description: 'Learn effective strategies for addressing partner concerns and objections.',
        duration: '12 min',
        difficulty: 'Intermediate',
        completed: false
      }
    ],
    'Strategy': [
      {
        id: 5,
        title: 'Market Analysis Framework',
        description: 'Develop a systematic approach to analyzing potential partnership opportunities.',
        duration: '25 min',
        difficulty: 'Advanced',
        completed: false
      },
      {
        id: 6,
        title: 'Building Long-term Relationships',
        description: 'Strategies for maintaining and growing partner relationships over time.',
        duration: '18 min',
        difficulty: 'Intermediate',
        completed: false
      }
    ]
  };

  const categories = Object.keys(coachingTips);
  const filteredTips = selectedCategory === 'all' 
    ? Object.values(coachingTips).flat()
    : coachingTips[selectedCategory] || [];

  const handleCompleteTip = (tipId) => {
    if (completedTips.includes(tipId)) {
      setCompletedTips(prev => prev.filter(id => id !== tipId));
    } else {
      setCompletedTips(prev => [...prev, tipId]);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Self Coaching Tips</h2>
            <p className="text-gray-600">Improve your business development skills with our expert tips</p>
          </div>
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">{completedTips.length} completed</span>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Tips</p>
                <p className="text-2xl font-bold text-blue-900">{Object.values(coachingTips).flat().length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{completedTips.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Progress</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round((completedTips.length / Object.values(coachingTips).flat().length) * 100)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTips.map((tip) => (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-50 rounded-xl p-6 border-2 transition-all duration-200 hover:shadow-md ${
                completedTips.includes(tip.id) 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{tip.title}</h3>
                  <p className="text-gray-600 mb-3">{tip.description}</p>
                <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500">{tip.duration}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tip.difficulty)}`}>
                      {tip.difficulty}
                    </span>
                </div>
              </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCompleteTip(tip.id)}
                  className={`ml-4 p-2 rounded-lg transition-colors duration-200 ${
                    completedTips.includes(tip.id)
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {completedTips.includes(tip.id) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </motion.button>
          </div>
            </motion.div>
        ))}
        </div>
      </div>
    </div>
  );
};



// Enhanced Free Content Component
const FreeContent = ({ user, userPaymentStatus }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewedContent, setViewedContent] = useState([]);
  const [selectedPDF, setSelectedPDF] = useState(null);

  const bdInsights = {
    'BD Insights': [
      {
        id: 1,
        title: 'BD Conferences - Priority, Budgets and Smart ROI Tips',
        description: 'Strategic insights from 15+ years of experience in Large Pharma to Small Biotechs.',
        type: 'PDF',
        size: '2.5 MB',
        views: 1856,
        rating: 4.9,
        featured: true,
        pdfUrl: '/pdf/BD Conferences, Priority & Budgets.pdf'
      },
      {
        id: 2,
        title: 'Biopharma Industry News and Resources',
        description: 'Latest industry updates and strategic resources for business development.',
        type: 'PDF',
        size: '1.8 MB',
        views: 1240,
        rating: 4.7,
        featured: false,
        pdfUrl: '/pdf/Biopharma News & Resources.pdf'
      },
      {
        id: 3,
        title: 'Big Pharma\'s BD Blueprint including Strategic Interest Areas',
        description: 'Comprehensive blueprint for understanding large pharma business development strategies.',
        type: 'PDF',
        size: '3.2 MB',
        views: 980,
        rating: 4.8,
        featured: false,
        pdfUrl: '/pdf/Big Pharma BD Playbook.pdf'
      },
      {
        id: 4,
        title: 'Winning BD Pitch Decks and Management Tips',
        description: 'Proven strategies and templates for creating compelling BD presentations.',
        type: 'PDF',
        size: '2.1 MB',
        views: 1560,
        rating: 4.9,
        featured: false,
        pdfUrl: '/pdf/Winning BD Pitch Deck.pdf'
      },
      {
        id: 5,
        title: 'BD Process and Tips',
        description: 'Comprehensive BD process guide and strategic tips for success.',
        type: 'PDF',
        size: '1.5 MB',
        views: 890,
        rating: 4.6,
        featured: false,
        pdfUrl: '/pdf/BD Process and Tips.pdf'
      },

    ]
  };

  const categories = Object.keys(bdInsights);
  const filteredContent = selectedCategory === 'all' 
    ? Object.values(bdInsights).flat()
    : bdInsights[selectedCategory] || [];

  const handleViewPDF = (content) => {
    if (!viewedContent.includes(content.id)) {
      setViewedContent(prev => [...prev, content.id]);
    }
    
    setSelectedPDF(content);
    console.log('Viewing PDF:', content.title);
  };

  const formatViews = (views) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  // If free user, show only the upgrade content
  if (!userPaymentStatus?.hasPaid) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Paid Members Access Only</h3>
            <p className="text-gray-600 mb-6">
              This content is exclusively available to paid members. Upgrade your plan to access our premium BD Insights library.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.href = '/dashboard/pricing'}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">BD Insights</h2>
            <p className="text-gray-600">BD Insights from 15+ Years of Experience in Large Pharma to Small Biotechs</p>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">{filteredContent.length} resources</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Resources</p>
                <p className="text-2xl font-bold text-red-900">{Object.values(bdInsights).flat().length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Views</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatViews(2500)}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Your Views</p>
                <p className="text-2xl font-bold text-blue-900">{viewedContent.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="relative inline-block">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 pr-7 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContent.map((content) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gray-50 rounded-xl p-6 border-2 transition-all duration-200 hover:shadow-md ${
                content.featured ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
              }`}
            >
              {content.featured && (
                <div className="flex items-center space-x-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-yellow-700">Featured</span>
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{content.title}</h3>
                  <p className="text-gray-600 mb-3">{content.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{content.type}</span>
                    <span>{content.size}</span>
                    <span>{formatViews(content.views)} views</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{content.rating}</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleViewPDF(content)}
                  className={`ml-4 p-3 rounded-lg transition-colors duration-200 ${
                    viewedContent.includes(content.id)
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}
                >
                  {viewedContent.includes(content.id) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <SecurePDFViewer
          pdfUrl={selectedPDF.pdfUrl}
          title={selectedPDF.title}
          onClose={() => setSelectedPDF(null)}
        />
      )}



    </div>
  );
};

// Enhanced Terms and Legal Disclaimer Component
const LegalDisclaimer = () => {
  const legalSections = [
    {
      id: 1,
      title: 'Terms of Use',
      content: 'Last Updated: [Insert Date]. By accessing the BioPing website and Services, you agree to be bound by these Terms of Use. The Services are provided for business development, research, and investment diligence purposes.',
      icon: '📋',
      priority: 'high'
    },
    {
      id: 2,
      title: 'Privacy Policy',
      content: 'We collect and process data as described in our Privacy Policy. For data requests, contact privacy@bioping.com. We comply with GDPR and CCPA requirements.',
      icon: '🔒',
      priority: 'high'
    },
    {
      id: 3,
      title: 'Data Disclaimer',
      content: 'Data is compiled from public and proprietary sources. BioPing does not warrant the accuracy, completeness, or timeliness of any data provided through our Services.',
      icon: '⚠️',
      priority: 'high'
    },
    {
      id: 4,
      title: 'Permitted Use / License Restrictions',
      content: 'You are granted a limited, non-exclusive, non-transferable license for internal business development, research, or investment diligence. Copying, scraping, reselling, or redistributing data without permission is prohibited.',
      icon: '⚖️',
      priority: 'high'
    },
    {
      id: 5,
      title: 'No Guarantees or Endorsements',
      content: 'BioPing does not guarantee contact success or deal outcomes. Inclusion in our database does not constitute an endorsement or recommendation.',
      icon: '📋',
      priority: 'medium'
    },
    {
      id: 6,
      title: 'Limitation of Liability',
      content: 'BioPing and its affiliates shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from use of our Services.',
      icon: '🛡️',
      priority: 'high'
    },
    {
      id: 7,
      title: 'Refund & Cancellation Policy',
      content: 'Fees are non-refundable. Cancellations are effective at the end of the current billing period. No refunds for partial months.',
      icon: '💰',
      priority: 'medium'
    },
    {
      id: 8,
      title: 'Intellectual Property',
      content: 'All content, including but not limited to text, graphics, logos, and software, is the exclusive property of BioPing and is protected by copyright laws.',
      icon: '🔒',
      priority: 'medium'
    },
    {
      id: 9,
      title: 'Jurisdiction & Governing Law',
      content: 'These terms are governed by the laws of California, USA. Any disputes shall be resolved in the courts of San Francisco County, California.',
      icon: '⚖️',
      priority: 'medium'
    }
  ];

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
      <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Terms and Legal Disclaimer</h2>
            <p className="text-gray-600">Important legal information about our services and data usage</p>
          </div>
          <div className="flex items-center space-x-2">
            <Scale className="w-6 h-6 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Legal Sections */}
        <div className="space-y-6">
          {legalSections.map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-6 border-2 ${getPriorityColor(section.priority)}`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-2xl">{section.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{section.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{section.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-bold text-gray-900 mb-2">Contact for Legal Inquiries</h3>
          <p className="text-gray-700 mb-3">
            For legal inquiries or questions about these terms, please contact our legal team.
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Email: legal@bioping.com</span>
            <span className="text-sm text-gray-600">Address: [Insert Business Address Here]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Contact Component
const Contact = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          company: '', // Dashboard form doesn't have company field
          message: `Subject: ${contactForm.subject}\n\nMessage: ${contactForm.message}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Message sent successfully! We\'ll get back to you soon.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        alert(result.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Support',
      description: 'Get quick responses to your questions',
      contact: 'support@thebioping.com',
      responseTime: 'Within ~24 hrs'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Speak directly with our team',
      contact: '+1 650 455 5850',
      responseTime: 'Call during business hours (8 AM – 5 PM PST)'
    }
  ];

  const teamMembers = [
    {
      name: 'Vik',
      role: 'Business Development Lead',
      email: 'support@thebioping.com',
      expertise: 'Partnership Strategy, Deal Structuring',
      avatar: 'V'
    }
  ];

  return (
      <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Us</h2>
          <p className="text-gray-600">Get in touch with our support team for assistance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  name="message"
                  value={contactForm.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                ></textarea>
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                className={`font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </motion.button>
            </form>
          </div>

          {/* Contact Methods */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Other Ways to Reach Us</h3>
            <div className="space-y-4">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{method.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{method.title}</h4>
                      <p className="text-gray-600 text-sm mb-1">{method.description}</p>
                      <p className="text-blue-600 font-medium">{method.contact}</p>
                      <p className="text-xs text-gray-500">Response time: {method.responseTime}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Team Members */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Our Team</h3>
              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {member.avatar}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <p className="text-xs text-blue-600">{member.email}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Pricing Page Component - BioPing Style
const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [StripePaymentComponent, setStripePaymentComponent] = useState(null);
  const [userCurrentPlan, setUserCurrentPlan] = useState('free');
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pricing plans from API
  const fetchPricingPlans = async () => {
    try {
      console.log('🔍 Dashboard: Fetching pricing plans from:', `${API_BASE_URL}/api/pricing-plans`);
      const response = await fetch(`${API_BASE_URL}/api/pricing-plans`);
      
      console.log('📡 Dashboard: Response status:', response.status);
      console.log('📡 Dashboard: Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard: Received pricing data:', data);
        console.log('📊 Dashboard: Plans count:', data.plans ? data.plans.length : 0);
        setPricingPlans(data.plans || []);
      } else {
        console.error('❌ Dashboard: API response not ok:', response.status, response.statusText);
        // Fallback to default plans if API fails
        setPricingPlans(getDefaultPlans());
      }
    } catch (error) {
      console.error('❌ Dashboard: Error fetching pricing plans:', error);
      // Fallback to default plans
      setPricingPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  // Default plans fallback
  const getDefaultPlans = () => [
    {
      id: 'free',
      name: "Free",
      description: "Perfect for getting started",
      credits: "5 credits for 5 days only",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "1 Seat included",
        "Get 5 free contacts",
        "Credits expire after 5 days (including weekends)",
        "No Credit Card Needed",
        "No BD Insights Access"
      ],
      icon: Gift,
      popular: false,
      buttonStyle: "outline"
    },
    {
      id: 'basic',
      name: "Basic Plan",
      description: "Ideal for growing businesses",
      credits: "50 contacts/month",
      monthlyPrice: 390,
      annualPrice: 3750,
      features: [
        "1 Seat included",
        "50 contacts per month",
        "Pay by credit/debit card",
        "Access to BD Tracker",
        "1 hr. of BD Consulting with Mr. Vik"
      ],
      icon: Users,
      popular: false,
      buttonText: "Choose plan",
      buttonStyle: "primary"
    },
    {
      id: 'premium',
      name: "Premium Plan",
      description: "For advanced users and teams",
      credits: "100 contacts/month",
      monthlyPrice: 790,
      annualPrice: 7585,
      features: [
        "Everything in Basic, plus:",
        "1 Seat included",
        "100 contacts per month",
        "Pay by credit/debit card",
        "Access to BD Tracker",
        "1 hr. of BD Consulting with Mr. Vik"
      ],
      icon: Target,
      popular: true,
      buttonText: "Choose plan",
      buttonStyle: "primary"
    }
  ];

  // Load pricing plans on component mount
  useEffect(() => {
    fetchPricingPlans();
  }, []);

  // Dynamically load StripePayment component when needed
  const loadStripePayment = async () => {
    if (!StripePaymentComponent) {
      try {
        const { default: StripePayment } = await import('../components/StripePayment');
        setStripePaymentComponent(() => StripePayment);
      } catch (error) {
        console.error('Failed to load StripePayment component:', error);
      }
    }
  };

  // Icon mapping for plans
  const iconMap = {
    'free': Gift,
    'basic': Users,
    'premium': Target,
    'pro': Target,
    'enterprise': Building2
  };

  // Get the correct icon component
  const getIcon = (plan) => {
    if (plan.icon && typeof plan.icon === 'function') {
      return plan.icon;
    }
    const iconKey = plan.id || plan.name?.toLowerCase();
    return iconMap[iconKey] || Building2;
  };

  // Use dynamic pricing plans from API and ensure features are arrays and icons are properly mapped
  const plans = (pricingPlans.length > 0 ? pricingPlans : getDefaultPlans()).map(plan => {
    return {
      ...plan,
      // Map yearlyPrice to annualPrice for consistency
      annualPrice: plan.annualPrice || plan.yearlyPrice || 0,
      // Ensure features are arrays
      features: Array.isArray(plan.features) ? plan.features : (plan.features ? plan.features.split('\n').filter(f => f.trim()) : []),
      // Map icon properly
      icon: getIcon(plan),
      // Ensure popular flag is boolean
      popular: Boolean(plan.popular || plan.isPopular),
      // Ensure button text exists
      buttonText: plan.buttonText || (plan.monthlyPrice === 0 ? 'Get Started' : 'Choose Plan'),
      // Ensure button style exists
      buttonStyle: plan.buttonStyle || (plan.monthlyPrice === 0 ? 'outline' : 'primary')
    };
  });

  // Safety check: prevent payment modal for free plans
  useEffect(() => {
    if (selectedPlan && selectedPlan.id === 'free' && showPayment) {
      console.log('🚨 Safety check: Free plan detected with showPayment=true, resetting...');
      setShowPayment(false);
      setSelectedPlan(null);
    }
  }, [selectedPlan, showPayment]);

  const features = [
    {
      title: "Advanced Search",
      description: "Find companies, contacts, and investors with precision",
      icon: Zap
    },
    {
      title: "Real-time Data",
      description: "Access the most up-to-date information available",
      icon: Target
    },
    {
      title: "Export Options",
      description: "Download your data in multiple formats",
      icon: Building2
    },
    {
      title: "Team Collaboration",
      description: "Share insights and collaborate with your team",
      icon: Users
    }
  ];

  const handleSelectPlan = async (plan) => {
    console.log('🎯 handleSelectPlan called with plan:', plan);
    
    if (plan.id === 'free') {
      console.log('🆓 Free plan selected - activating without payment');
      
      // Reset payment modal state
      setSelectedPlan(null);
      setShowPayment(false);
      
      // Handle free plan - activate without payment
      try {
        setPaymentStatus('Activating free plan...');
        
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/auth/activate-free-plan`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserCurrentPlan('free');
          sessionStorage.setItem('userCurrentPlan', 'free');
          setPaymentStatus('Free plan activated successfully!');
          
          // Refresh user data
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          const errorData = await response.json();
          setPaymentStatus(`Error: ${errorData.message || 'Failed to activate free plan'}`);
        }
      } catch (error) {
        console.error('Error activating free plan:', error);
        setPaymentStatus('Error: Failed to activate free plan. Please try again.');
      }
      return;
    }
    
    console.log('💳 Paid plan selected - loading payment modal');
    
    // Double check - don't show payment modal for free plans
    if (plan.id === 'free') {
      console.log('❌ Free plan detected in paid plan section - this should not happen');
      return;
    }
    
    // Load StripePayment component dynamically before showing payment modal
    await loadStripePayment();
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    console.log('🎉 Payment success handler called:', paymentIntent);
    
    // Update user's current plan after successful payment
    if (selectedPlan && selectedPlan.id !== 'free') {
      setUserCurrentPlan(selectedPlan.id);
      
      // Set credits based on plan
      let credits = 5; // Default
      if (selectedPlan.id === 'basic') {
        credits = 50;
      } else if (selectedPlan.id === 'premium') {
        credits = 100;
      } else if (selectedPlan.id === 'daily-12') {
        credits = 50; // Daily credits
      }
      // Credits will be updated via backend sync
      
      // Sync with backend
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/auth/update-payment-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentCompleted: true,
            currentPlan: selectedPlan.id,
            currentCredits: credits
          })
        });
        
        if (response.ok) {
          console.log('Payment status synced with backend');
        }
      } catch (error) {
        console.error('Error syncing payment status:', error);
      }
    }
    
    // Show success message with custom message if available
    const successMessage = paymentIntent.message || 'Payment successful! Plan activated.';
    setPaymentStatus(successMessage);
    setShowPayment(false);
    console.log('Payment successful:', paymentIntent);
    
    // Refresh the page to get updated data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handlePaymentError = (error) => {
    setPaymentStatus('Payment failed: ' + error);
    console.error('Payment error:', error);
  };

  const getColorClasses = (color) => {
    switch(color) {
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      case 'green': return 'from-green-500 to-green-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Debug Info - Hidden */}
      {false && (
        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-yellow-800">Debug Info:</h3>
          <p className="text-yellow-700">Current User Plan: {userCurrentPlan || 'Not set'}</p>
          <p className="text-yellow-700">Plans loaded: {plans.length}</p>
          {plans.map(plan => (
            <p key={plan.id} className="text-yellow-700 text-sm">
              {plan.name} (ID: {plan.id}) - Button: {plan.buttonText}
            </p>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Choose the plan that best fits your business needs. All plans include 
            our core features with different usage limits and additional capabilities.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8 bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-xl shadow-lg border-2 border-primary-300">
            <span className={`text-lg font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Pay Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-12 w-24 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-300 focus:ring-offset-2 border-2 ${
                isAnnual 
                  ? 'bg-primary-600 border-primary-600 shadow-lg' 
                  : 'bg-gray-200 border-gray-300 shadow-md'
              }`}
            >
              <span
                className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                  isAnnual ? 'translate-x-12' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Pay Yearly <span className="text-green-600 font-bold">20% off</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id || plan._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`relative ${plan.popular ? 'lg:scale-105 z-20' : 'z-10'}`}
            style={{ zIndex: plan.popular ? 20 : 10 }}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30" style={{ pointerEvents: 'none' }}>
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1 shadow-lg">
                  <Star className="w-4 h-4" />
                  <span>Most Popular</span>
                </div>
              </div>
            )}
            
                 <div className={`card p-6 h-full bg-white border-2 ${
                   plan.popular ? 'border-transparent bg-gradient-to-r from-purple-50 to-pink-50 shadow-xl shadow-purple-200/50 ring-2 ring-purple-200' : 
                   plan.name === 'Free' ? 'border-green-200 hover:border-green-300 shadow-lg shadow-green-100/50 hover:ring-2 hover:ring-green-200' :
                   plan.name === 'Basic Plan' ? 'border-blue-200 hover:border-blue-300 shadow-lg shadow-blue-100/50 hover:ring-2 hover:ring-blue-200' :
                   'border-gray-200 hover:border-gray-300 shadow-lg hover:ring-2 hover:ring-gray-200'
                 } rounded-2xl flex flex-col hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden`}
                 style={{ position: 'relative', zIndex: plan.popular ? 15 : 5 }}
                >
                   {plan.popular && (
                     <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded-2xl" style={{ pointerEvents: 'none' }}></div>
                   )}
                   <div className="text-center mb-4 relative z-10">
                     <div className={`w-16 h-16 ${
                       plan.popular ? 'bg-gradient-to-br from-purple-100 to-pink-100' : 
                       plan.name === 'Free' ? 'bg-gradient-to-br from-green-100 to-emerald-100' :
                       plan.name === 'Basic Plan' ? 'bg-gradient-to-br from-blue-100 to-indigo-100' :
                       'bg-gradient-to-br from-gray-100 to-slate-100'
                     } rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                       <plan.icon className={`w-8 h-8 ${
                         plan.popular ? 'text-purple-600' : 
                         plan.name === 'Free' ? 'text-green-600' :
                         plan.name === 'Basic Plan' ? 'text-blue-600' :
                         'text-gray-600'
                       }`} />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-2">
                       {plan.name}
                     </h3>
                     <p className="text-gray-600 mb-4 text-sm">
                       {plan.description}
                     </p>
                     <div className="mb-4">
                       <div className="text-sm text-gray-600 mb-2">{plan.credits}</div>
                       <div className="text-3xl font-bold text-gray-900">
                         {plan.monthlyPrice === 0 ? 'Free' : `$${isAnnual ? plan.annualPrice : plan.monthlyPrice} USD`}
                       </div>
                       <div className="text-sm text-gray-500">
                         {plan.monthlyPrice === 0 ? '' : (isAnnual ? '/ yearly' : '/ monthly')}
                       </div>
                       {isAnnual && plan.monthlyPrice > 0 && (
                         <div className="text-xs text-green-600 font-medium mt-1">
                           Save ${(plan.monthlyPrice * 12) - plan.annualPrice}/year
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="space-y-3 mb-6 flex-grow relative z-10">
                     {plan.features.map((feature, featureIndex) => (
                       <div key={featureIndex} className="flex items-start space-x-3">
                         <Check className={`w-4 h-4 ${plan.popular ? 'text-purple-500' : 'text-green-500'} mt-0.5 flex-shrink-0`} />
                         <span className="text-gray-700 text-sm leading-relaxed">
                           {feature.includes('Mr. Vik') ? (
                             <>
                               {feature.split('Mr. Vik')[0]}
                               <a 
                                 href="https://www.linkedin.com/in/gauravvij1?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" 
                                 target="_blank" 
                                 rel="noopener noreferrer"
                                 className="text-blue-600 hover:text-blue-800 underline font-medium"
                               >
                                 Mr. Vik
                               </a>
                               {feature.split('Mr. Vik')[1]}
                             </>
                           ) : (
                             feature
                           )}
                         </span>
                       </div>
                     ))}
                   </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={userCurrentPlan === plan.id}
                style={{ 
                  pointerEvents: userCurrentPlan === plan.id ? 'none' : 'auto',
                  position: 'relative',
                  zIndex: 50
                }}
                className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 mt-auto cursor-pointer relative z-50 ${
                  (plan.id === 'free' && userCurrentPlan === 'free') || userCurrentPlan === plan.id
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-2 border-green-500 shadow-lg cursor-default'
                    : plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg cursor-pointer'
                      : plan.buttonStyle === 'primary' 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg cursor-pointer' 
                        : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 cursor-pointer'
                }`}
                onMouseDown={(e) => {
                  console.log('🖱️ MOUSEDOWN on plan:', plan.name, plan.id);
                }}
                onMouseUp={(e) => {
                  console.log('🖱️ MOUSEUP on plan:', plan.name, plan.id);
                }}
                onClick={(e) => {
                  console.log('🖱️ CLICK EVENT on plan:', plan.name, plan.id);
                  
                  // Special debug for Premium Plan
                  if (plan.id === 'premium') {
                    console.log('🎯 PREMIUM PLAN CLICKED!');
                    console.log('🎯 Premium plan object:', plan);
                  }
                  
                  // Don't allow clicking on current plan
                  if (plan.id === 'free' && userCurrentPlan === 'free') {
                    console.log('❌ Free plan already active, ignoring click');
                    return;
                  }
                  
                  // Don't allow clicking on current plan for any plan
                  if (userCurrentPlan === plan.id) {
                    console.log('❌ Current plan clicked, ignoring');
                    return;
                  }
                  
                  console.log('✅ Proceeding with plan selection');
                  handleSelectPlan(plan);
                }}
              >
                {(() => {
                  // Free plan logic
                  if (plan.id === 'free') {
                    return userCurrentPlan === 'free' ? 'Current Plan' : 'Get Started';
                  }
                  
                  // Daily Test plan logic
                  if (plan.id === 'daily-12') {
                    return userCurrentPlan === 'daily-12' ? 'Current Plan' : 'Start Testing';
                  }
                  
                  // Other plans logic
                  if (userCurrentPlan === plan.id) {
                    return 'Current Plan';
                  }
                  
                  // Default: show plan's button text
                  return plan.buttonText;
                })()}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>



      {/* FAQ Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h3>
            <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. New plan starts and new charges activated for next 30 days.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit and debit cards and bank payments.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-2">How do free credits work?</h3>
            <p className="text-gray-600">Free plan users get 5 credits that expire after 5 days (including weekends). This gives you a chance to test our platform before upgrading to a paid plan.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What kind of support do you provide?</h3>
            <p className="text-gray-600">All plans include email and phone support during PST time hours in USA. Basic and Premium Plans have enhanced customer and BD support.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Join several business development professionals who trust BioPing to find their next partnership opportunities.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200"
        >
          Start Free Trial
        </motion.button>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedPlan && selectedPlan.id !== 'free' && StripePaymentComponent && (
        <StripePaymentComponent
          plan={selectedPlan}
          isAnnual={isAnnual}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={() => setShowPayment(false)}
        />
      )}
      
      {/* Debug info for free plan */}
      {selectedPlan && selectedPlan.id === 'free' && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg z-50">
          Debug: Free plan selected - should not show payment modal
        </div>
      )}
      
      {/* Payment Status */}
      {paymentStatus && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {paymentStatus}
        </div>
      )}
    </div>
  );
};

// Enhanced Analytics Page Component
const AnalyticsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Mock data for analytics
  const membershipData = {
    totalMembers: 1247,
    activeMembers: 892,
    newMembersThisMonth: 156,
    churnRate: 2.3,
    revenue: {
      monthly: 45600,
      annual: 547200,
      growth: 12.5
    },
    plans: {
      starter: 456,
      professional: 623,
      enterprise: 168
    },
    monthlyRevenue: [
      { month: 'Jan', revenue: 42000, members: 1100 },
      { month: 'Feb', revenue: 43500, members: 1150 },
      { month: 'Mar', revenue: 44800, members: 1180 },
      { month: 'Apr', revenue: 46200, members: 1210 },
      { month: 'May', revenue: 47800, members: 1240 },
      { month: 'Jun', revenue: 45600, members: 1247 }
    ],
    topRegions: [
      { region: 'North America', members: 456, revenue: 18240 },
      { region: 'Europe', members: 389, revenue: 15560 },
      { region: 'Asia-Pacific', members: 234, revenue: 9360 },
      { region: 'Latin America', members: 98, revenue: 3920 },
      { region: 'Middle East', members: 70, revenue: 2800 }
    ],
    recentSignups: [
      { name: 'John Smith', company: 'TechCorp Inc.', plan: 'Professional', date: '2024-01-15', amount: 199 },
      { name: 'Sarah Johnson', company: 'BioTech Solutions', plan: 'Enterprise', date: '2024-01-14', amount: 399 },
      { name: 'Mike Chen', company: 'Pharma Innovations', plan: 'Starter', date: '2024-01-13', amount: 99 },
      { name: 'Emily Davis', company: 'Life Sciences Co.', plan: 'Professional', date: '2024-01-12', amount: 199 },
      { name: 'David Wilson', company: 'Research Labs', plan: 'Enterprise', date: '2024-01-11', amount: 399 }
    ]
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Growth icon function available for future use
  // const getGrowthIcon = (growth) => {
  //   return growth >= 0 ? TrendingUp : TrendingDown;
  // };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track membership growth, revenue, and business insights</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="revenue">Revenue</option>
              <option value="members">Members</option>
              <option value="growth">Growth</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Members</p>
              <p className="text-3xl font-bold">{formatNumber(membershipData.totalMembers)}</p>
              <p className="text-blue-200 text-sm mt-1">+{membershipData.newMembersThisMonth} this month</p>
            </div>
            <Users className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(membershipData.revenue.monthly)}</p>
              <p className={`text-green-200 text-sm mt-1 ${getGrowthColor(membershipData.revenue.growth)}`}>
                +{membershipData.revenue.growth}% vs last month
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Active Members</p>
              <p className="text-3xl font-bold">{formatNumber(membershipData.activeMembers)}</p>
              <p className="text-purple-200 text-sm mt-1">{((membershipData.activeMembers / membershipData.totalMembers) * 100).toFixed(1)}% active rate</p>
            </div>
            <Activity className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Churn Rate</p>
              <p className="text-3xl font-bold">{membershipData.churnRate}%</p>
              <p className="text-orange-200 text-sm mt-1">Monthly average</p>
            </div>
            <TrendingDown className="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Starter</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-semibold">{membershipData.plans.starter}</span>
                <span className="text-gray-500">({((membershipData.plans.starter / membershipData.totalMembers) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Professional</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-semibold">{membershipData.plans.professional}</span>
                <span className="text-gray-500">({((membershipData.plans.professional / membershipData.totalMembers) * 100).toFixed(1)}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Enterprise</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-900 font-semibold">{membershipData.plans.enterprise}</span>
                <span className="text-gray-500">({((membershipData.plans.enterprise / membershipData.totalMembers) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Regions</h3>
          <div className="space-y-4">
            {membershipData.topRegions.map((region, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-purple-500' :
                    index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-gray-700">{region.region}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-semibold">{region.members}</span>
                  <span className="text-gray-500">({formatCurrency(region.revenue)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Signups</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Company</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Plan</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {membershipData.recentSignups.map((signup, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{signup.name}</td>
                  <td className="py-3 px-4 text-gray-600">{signup.company}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      signup.plan === 'Starter' ? 'bg-blue-100 text-blue-800' :
                      signup.plan === 'Professional' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {signup.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{new Date(signup.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-gray-900 font-semibold">{formatCurrency(signup.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple Pricing Analytics Page
const PricingAnalyticsPage = () => {
  const [pricingData, setPricingData] = useState({
    plans: [],
    recentPurchases: [],
    monthlyStats: [],
    topCompanies: [],
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPricingAnalytics();
  }, []);

  const fetchPricingAnalytics = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/pricing-analytics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pricing analytics data');
      }

      const result = await response.json();
      
      if (result.success) {
        setPricingData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching pricing analytics:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add new purchase function available for future use
  // const addNewPurchase = async (purchaseData) => {
  //   try {
  //     const token = sessionStorage.getItem('token');
  //     
  //     const response = await fetch('http://localhost:5000/api/pricing-analytics/purchases', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(purchaseData)
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to add purchase');
  //     }

  //     const result = await response.json();
  //     
  //     if (result.success) {
  //       // Refresh data after adding purchase
  //       await fetchPricingAnalytics();
  //       return result;
  //     } else {
  //       throw new Error(result.message || 'Failed to add purchase');
  //     }
  //   } catch (error) {
  //     console.error('Error adding purchase:', error);
  //     throw error;
  //   }
  // };

  // Update plan stats function available for future use
  // const updatePlanStats = async (planId, updates) => {
  //   try {
  //     const token = sessionStorage.getItem('token');
  //     
  //     const response = await fetch(`http://localhost:5000/api/pricing-analytics/plans/${planId}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(updates)
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to update plan');
  //     }

  //     const result = await response.json();
  //     
  //     if (result.success) {
  //       // Refresh data after updating plan
  //       await fetchPricingAnalytics();
  //       return result;
  //     } else {
  //       throw new Error(result.message || 'Failed to update plan');
  //     }
  //   } catch (error) {
  //     console.error('Error updating plan:', error);
  //     throw error;
  //   }
  // };

  const exportAnalyticsData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/pricing-analytics/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const data = await response.json();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pricing-analytics.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
      purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
      green: 'bg-gradient-to-br from-green-500 to-green-600'
    };
    return colors[color] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <LoadingSpinner
        size="xl"
        message="Loading Market Data..."
        subMessage="Please wait while we analyze the data"
        fullScreen={true}
        color="cyber"
      />
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchPricingAnalytics}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalRevenue = pricingData.plans.reduce((sum, plan) => sum + plan.revenue, 0);

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Pricing Analytics Dashboard</h1>
            <p className="text-blue-100 text-lg">Comprehensive insights into your pricing strategy and revenue performance</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="text-blue-100">Total Revenue</div>
            <button 
              onClick={exportAnalyticsData}
              className="mt-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Members', value: formatNumber(pricingData.summary.totalMembers || 0), icon: Users, color: 'blue' },
          { label: 'Total Revenue', value: formatCurrency(pricingData.summary.totalRevenue || 0), icon: DollarSign, color: 'green' },
          { label: 'Avg. Revenue/Member', value: formatCurrency(pricingData.summary.avgRevenuePerMember || 0), icon: TrendingUp, color: 'purple' },
          { label: 'Conversion Rate', value: `${pricingData.summary.conversionRate || 0}%`, icon: Target, color: 'orange' }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`w-12 h-12 ${getColorClasses(metric.color)} rounded-xl flex items-center justify-center`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Plan Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {pricingData.plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${getColorClasses(plan.color)} rounded-xl flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{plan.name.charAt(0)}</span>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  {getGrowthIcon(plan.growth)}
                  <span className={`text-sm font-medium ${getGrowthColor(plan.growth)}`}>
                    {plan.growth}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">Growth</p>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(plan.price)}</p>
            <p className="text-gray-600 mb-4">per month</p>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Members</span>
                <span className="font-semibold">{formatNumber(plan.members)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-green-600">{formatCurrency(plan.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversion</span>
                <span className="font-semibold">{plan.conversion}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Lifetime</span>
                <span className="font-semibold">{plan.avgLifetime} months</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Trends Chart */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Revenue Trends</h3>
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="space-y-4">
          {pricingData.monthlyStats.map((month, index) => (
            <div key={month.month} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{month.month}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{formatCurrency(month.revenue)}</span>
                  <div className={`flex items-center space-x-1 ${getGrowthColor(month.growth)}`}>
                    {getGrowthIcon(month.growth)}
                    <span className="text-xs font-medium">{month.growth}%</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(month.revenue / 20000) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Companies & Recent Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Top Revenue Companies</h3>
          <div className="space-y-4">
            {pricingData.topCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{company.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p className="text-sm text-gray-600">{company.plan} • {company.members} members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatCurrency(company.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Purchases */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Purchases</h3>
          <div className="space-y-4">
            {pricingData.recentPurchases.slice(0, 5).map((purchase, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{purchase.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{purchase.name}</p>
                    <p className="text-sm text-gray-600">{purchase.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{purchase.plan}</p>
                  <p className="text-sm text-green-600 font-semibold">{formatCurrency(purchase.amount)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(purchase.status)}`}>
                    {purchase.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Monthly Growth Visualization */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Plan Growth</h3>
        <div className="space-y-6">
          {pricingData.monthlyStats.map((month, index) => (
            <div key={month.month} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{month.month}</span>
                <span className="text-sm text-gray-600">
                  Total: {formatNumber(month.total)} members
                </span>
              </div>
              <div className="flex h-10 bg-gray-100 rounded-xl overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full flex items-center justify-center transition-all duration-500"
                  style={{ width: `${(month.starter / month.total) * 100}%` }}
                >
                  <span className="text-white text-xs font-medium">{month.starter}</span>
                </div>
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-full flex items-center justify-center transition-all duration-500"
                  style={{ width: `${(month.professional / month.total) * 100}%` }}
                >
                  <span className="text-white text-xs font-medium">{month.professional}</span>
                </div>
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full flex items-center justify-center transition-all duration-500"
                  style={{ width: `${(month.enterprise / month.total) * 100}%` }}
                >
                  <span className="text-white text-xs font-medium">{month.enterprise}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Starter: {month.starter}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span>Professional: {month.professional}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Enterprise: {month.enterprise}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Pricing Management Page Component
const PricingManagementPage = () => {
  const navigate = useNavigate();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    credits: '',
    monthlyPrice: '',
    annualPrice: '',
    features: ''
  });

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing-plans`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPricingPlans(data.pricingPlans || []);
        setError(null);
      } else {
        throw new Error('Failed to fetch pricing plans');
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const url = editingPlan 
        ? `${API_BASE_URL}/api/admin/pricing-plans/${editingPlan._id}`
        : `${API_BASE_URL}/api/admin/pricing-plans`;
      
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          features: formData.features.split(',').map(f => f.trim()).filter(f => f)
        })
      });

      if (response.ok) {
        await fetchPricingPlans();
        setShowAddModal(false);
        setEditingPlan(null);
        setFormData({
          name: '',
          description: '',
          credits: '',
          monthlyPrice: '',
          annualPrice: '',
          features: ''
        });
        setError(null);
      } else {
        throw new Error('Failed to save pricing plan');
      }
    } catch (error) {
      console.error('Error saving pricing plan:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this pricing plan?')) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/pricing-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchPricingPlans();
        setError(null);
      } else {
        throw new Error('Failed to delete pricing plan');
      }
    } catch (error) {
      console.error('Error deleting pricing plan:', error);
      setError(error.message);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      credits: plan.credits.toString(),
      monthlyPrice: plan.monthlyPrice.toString(),
      annualPrice: plan.annualPrice.toString(),
      features: plan.features.join(', ')
    });
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/admin-panel')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Pricing Plan</span>
              </button>
              <button
                onClick={() => navigate('/dashboard/admin-panel')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                ← Back to Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Pricing Plans List */}
        {pricingPlans.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pricing Plans Yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first pricing plan</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create First Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div key={plan._id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    plan.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Credits:</span>
                    <span className="text-sm font-medium">{plan.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Monthly:</span>
                    <span className="text-sm font-medium">${plan.monthlyPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Annual:</span>
                    <span className="text-sm font-medium">${plan.annualPrice}</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="flex-1 bg-blue-100 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan._id)}
                    className="flex-1 bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPlan ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                <input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.annualPrice}
                  onChange={(e) => setFormData({ ...formData, annualPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Feature 1, Feature 2, Feature 3"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPlan(null);
                    setFormData({
                      name: '',
                      description: '',
                      credits: '',
                      monthlyPrice: '',
                      annualPrice: '',
                      features: ''
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard; 
