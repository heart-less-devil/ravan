import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { 
  Grid, 
  Search, 
  FileText, 
  User, 
  DollarSign, 
  Heart, 
  Scale, 
  ChevronLeft,
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
  CheckCircle,
  AlertCircle,
  Activity,
  Briefcase,
  Globe,
  Award,
  Sparkles,
  Info,
  Trash2,
  BookOpen,
  Circle,
  Download,
  Check,
  TrendingDown
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

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user profile
    fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        navigate('/login');
      }
    })
    .catch(err => {
      console.error('Error fetching profile:', err);
      localStorage.removeItem('token');
      navigate('/login');
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Grid, section: 'MAIN' },
    { name: 'Search', path: '/dashboard/search', icon: Search, section: 'DATA' },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3, section: 'DATA' },
    { name: 'Pricing Analytics', path: '/dashboard/pricing-analytics', icon: DollarSign, section: 'DATA' },
    { name: 'Saved Searches', path: '/dashboard/saved-searches', icon: FileText, section: 'MY DEALS' },
    { name: 'Definitions', path: '/dashboard/resources/definitions', icon: FileText, section: 'RESOURCES' },
    { name: 'Self Coaching Tips', path: '/dashboard/resources/coaching-tips', icon: User, section: 'RESOURCES' },
    { name: 'Pricing', path: '/dashboard/pricing', icon: DollarSign, section: 'RESOURCES' },
    { name: 'Free Content', path: '/dashboard/resources/free-content', icon: Heart, section: 'RESOURCES' },
    { name: 'Legal Disclaimer', path: '/dashboard/legal', icon: Scale, section: 'RESOURCES' },
    { name: 'Contact', path: '/dashboard/contact', icon: User, section: 'RESOURCES' },
  ];

  const getSectionItems = (section) => {
    return navItems.filter(item => item.section === section);
  };

  const renderContent = () => {
    const path = location.pathname;
    
    switch(path) {
      case '/dashboard':
        return <DashboardHome user={user} />;
      case '/dashboard/search':
        return <SearchPage />;
      case '/dashboard/saved-searches':
        return <SavedSearches />;
      case '/dashboard/resources/definitions':
        return <Definitions />;
      case '/dashboard/resources/coaching-tips':
        return <CoachingTips />;
      case '/dashboard/resources/free-content':
        return <FreeContent />;
      case '/dashboard/legal':
        return <LegalDisclaimer />;
      case '/dashboard/contact':
        return <Contact />;
      case '/dashboard/pricing':
        return <PricingPage />;
      case '/dashboard/analytics':
        return <AnalyticsPage />;
      case '/dashboard/pricing-analytics':
        return <PricingAnalyticsPage />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="spinner-lg mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Sidebar */}
      <motion.div 
        className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white transition-all duration-500 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Enhanced Logo */}
          <div className="flex items-center justify-between mb-8">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-xl">B</span>
            </motion.div>
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-white/70 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 space-y-8">
            {['MAIN', 'DATA', 'MY DEALS', 'RESOURCES'].map(section => (
              <div key={section}>
                {!sidebarCollapsed && (
                  <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 px-3">
                    {section}
                  </div>
                )}
                {getSectionItems(section).map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 mb-2 ${
                      location.pathname === item.path 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          {/* Enhanced Footer */}
          {!sidebarCollapsed && (
            <div className="text-xs text-white/40 px-3 py-4 border-t border-white/10">
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
      <div className="flex-1 flex flex-col">
        {/* Enhanced Top Bar */}
        <motion.div 
          className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-8 py-6 shadow-sm"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <select className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-48">
                  <option>Company Name</option>
                  <option>Contact Name</option>
                </select>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search anything..."
                    className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl pl-12 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-80"
                  />
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Enhanced Notifications */}
              <button className="relative p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Enhanced Settings */}
              <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
                <Settings className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>

              {/* Enhanced Help */}
              <button className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group">
                <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>

              {/* Enhanced User Profile */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-white font-bold text-lg">{user.name?.charAt(0) || 'U'}</span>
                  </motion.div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-semibold text-gray-900">{user.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
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
        <div className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Enhanced Dashboard Home Component
const DashboardHome = ({ user }) => {
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
    { name: 'Search Database', icon: Search, path: '/dashboard/search', color: 'blue', gradient: 'from-blue-500 to-blue-600' },
    { name: 'Saved Searches', icon: FileText, path: '/dashboard/saved-searches', color: 'purple', gradient: 'from-purple-500 to-purple-600' },
    { name: 'Free Resources', icon: Heart, path: '/dashboard/resources/free-content', color: 'pink', gradient: 'from-pink-500 to-pink-600' },
    { name: 'Request Demo', icon: Zap, path: '/request-demo', color: 'yellow', gradient: 'from-yellow-500 to-yellow-600' }
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
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'User'}! 👋</h1>
            <p className="text-blue-100 text-lg">Here's what's happening with your BD activities today.</p>
          </div>
          <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.path}>
                <motion.div 
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300 border border-gray-200"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900">{action.name}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div 
                key={index} 
                className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200"
                whileHover={{ x: 4 }}
              >
                <div className={`w-10 h-10 bg-gradient-to-br from-${activity.color}-100 to-${activity.color}-200 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <activity.icon className={`w-5 h-5 text-${activity.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                    {activity.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {activity.status === 'pending' && (
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Enhanced Search Page Component
const SearchPage = () => {
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
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactDetails, setContactDetails] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [revealedEmails, setRevealedEmails] = useState(new Set());

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSelectedCompanies([]);

    try {
      const token = localStorage.getItem('token');
      
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

  const handleGetContacts = async () => {
    if (selectedCompanies.length === 0) {
      alert('Please select companies to get contacts');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/get-contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyIds: selectedCompanies
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get contacts');
      }

      const result = await response.json();
      
      if (result.success) {
        setContactDetails(result.data.contacts);
        setShowContactModal(true);
      } else {
        throw new Error(result.message || 'Failed to get contacts');
      }
    } catch (error) {
      console.error('Error getting contacts:', error);
      alert('Failed to get contacts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (companyId) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
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

  const handleRevealEmail = (companyId) => {
    setRevealedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };



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

  const partnerTypes = [
    'Licensing Partner',
    'Co-development Partner',
    'Merger & Acquisition',
    'Investment Partner',
    'Manufacturing Partner',
    'Distribution Partner'
  ];

  const regions = [
    'North America',
    'Europe',
    'Asia-Pacific',
    'Latin America',
    'Middle East & Africa'
  ];

  const functions = [
    'Business Development',
    'R&D',
    'Clinical Development',
    'Regulatory Affairs',
    'Manufacturing',
    'Commercial',
    'Executive'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Criteria</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top Row */}
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

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Looking For */}
            <div>
              <label htmlFor="lookingFor" className="block text-sm font-semibold text-gray-900 mb-2 flex items-center">
                Looking for <span className="text-red-500 ml-1">*</span>
                <Info className="w-4 h-4 ml-2 text-gray-400" />
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
                  <option value="Tier 1 - Mostly Large Pharma">Tier 1 - Mostly Large Pharma</option>
                  <option value="Tier 2 - Mid Cap">Tier 2 - Mid Cap</option>
                  <option value="Tier 3 - Small Cap">Tier 3 - Small Cap</option>
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
                <Info className="w-4 h-4 ml-2 text-gray-400" />
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
                <Info className="w-4 h-4 ml-2 text-gray-400" />
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
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </motion.button>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
                          <div>
                <h3 className="text-xl font-bold text-gray-900">Search Results</h3>
                <p className="text-gray-600">
                  Found {searchResults.length} companies matching your criteria
                  {formData.drugName && (
                    <span className="ml-2 text-blue-600 font-medium">
                      for "{formData.drugName}"
                    </span>
                  )}
                </p>
              </div>
            {selectedCompanies.length > 0 && (
              <button
                onClick={handleGetContacts}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Users className="w-4 h-4" />
                )}
                <span>Get Contacts ({selectedCompanies.length})</span>
              </button>
            )}
          </div>

          <div className="w-full">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COMPANY</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CONTACT INFORMATION</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {searchResults.map((company) => [
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCompanies.includes(company.id)}
                        onChange={() => handleCompanySelect(company.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{company.companyName}</div>
                          <div className="text-sm text-gray-500">{company.region}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              PUBLIC
                            </span>
                          </div>

                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {company.contactPerson ? company.contactPerson.charAt(0).toUpperCase() : 'C'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{company.contactPerson}</div>
                          <div className="text-sm text-gray-500">{company.contactTitle || 'Sr. Director'}</div>
                          <div className="text-sm text-gray-500">{company.contactFunction}</div>
                          {/* Show BD Person TA Focus if available */}
                          {company.bdPersonTAFocus && (
                            <div className="text-xs text-blue-600 mt-1">
                              BD Focus: {company.bdPersonTAFocus}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-900">
                          {revealedEmails.has(company.id) 
                            ? (company.email || `${company.contactPerson?.toLowerCase().replace(' ', '.')}@${company.companyName?.toLowerCase()}.com`)
                            : `@${company.companyName?.toLowerCase()}.com`
                          }
                        </span>
                        <button 
                          onClick={() => handleViewMore(company)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 border-b border-dotted border-blue-600"
                        >
                          <span>{expandedRows.has(company.id) ? 'VIEW LESS' : 'VIEW MORE'}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={expandedRows.has(company.id) ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button 
                        onClick={() => handleRevealEmail(company.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
                      >
                        Get Contact Info
                      </button>
                    </td>
                  </tr>,
                  expandedRows.has(company.id) && (
                    <tr key={`expanded-${company.id}`} className="bg-gray-50">
                      <td colSpan="5" className="px-6 py-4">
                        <div className="space-y-4">
                                                    {/* Simple Data Section */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">TIER:</span>
                                <div className="text-gray-900 font-medium">{company.tier || 'Large Pharma'}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">MODALITY:</span>
                                <div className="text-gray-900 font-medium">{company.modality || 'SM, LM, CT, GT, Bx, RNA'}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">BD Focus Area:</span>
                                <div className="text-gray-900 font-medium">{company.bdPersonTAFocus || 'NULL'}</div>
                              </div>
                            </div>
                          </div>
                          

                          
                          
                        </div>
                      </td>
                    </tr>
                  )
                ].filter(Boolean))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchResults && searchResults.length === 0 && !loading && (
        <div className="text-center py-12 px-6">
          <div className="max-w-2xl mx-auto">
            {/* Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Main Message */}
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🔍 No Results Found
            </h3>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
              <p className="text-gray-700 text-lg mb-4">
                We couldn't find any companies matching your specific criteria.
              </p>
              
              {/* Search Criteria Display */}
              <div className="bg-white rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-3">Your Search Criteria:</h4>
                <div className="space-y-2">
                  {Object.entries(formData).map(([key, value]) => {
                    if (value && value !== 'Select Disease Area' && value !== 'Select Stage' && value !== 'Select Modality' && value !== 'Select Region' && value !== 'Select Function') {
                      return (
                        <div key={key} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}: <span className="text-blue-600">{value}</span>
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
              
              {/* Suggestions */}
              <div className="bg-white rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">💡 Suggestions to broaden your search:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Try different Disease Areas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Consider other Partner Tiers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Adjust Modality preferences</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Explore different Regions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Review Function filters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Start with broader criteria</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Button */}
            <button
              onClick={() => {
                setFormData({
                  drugName: '',
                  diseaseArea: 'Select Disease Area',
                  developmentStage: 'Select Stage',
                  modality: 'Select Modality',
                  partnerType: 'Select Looking For',
                  region: 'Select Region',
                  contactFunction: 'Select Function'
                });
                setSearchResults(null);
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start New Search
            </button>
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
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
                      <span className="ml-2 text-blue-600 font-medium">{contact.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="ml-2 font-medium">{contact.phone}</span>
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

  const definitions = {
    'Disease Area': [
      {
        term: 'Oncology',
        definition: 'The study and treatment of cancer. Includes various types of cancer such as solid tumors, hematological malignancies, and rare cancers.',
        examples: ['Solid tumors', 'Blood cancers', 'Rare cancers']
      },
      {
        term: 'Neurology',
        definition: 'The branch of medicine dealing with disorders of the nervous system, including the brain, spinal cord, and nerves.',
        examples: ['Alzheimer\'s disease', 'Parkinson\'s disease', 'Multiple sclerosis']
      },
      {
        term: 'Cardiovascular',
        definition: 'Relating to the heart and blood vessels. Includes conditions affecting the circulatory system.',
        examples: ['Heart failure', 'Hypertension', 'Arrhythmias']
      }
    ],
    'Development Stage': [
      {
        term: 'Preclinical',
        definition: 'Research and testing that occurs before human clinical trials, including laboratory and animal studies.',
        examples: ['In vitro studies', 'Animal models', 'Safety testing']
      },
      {
        term: 'Phase I',
        definition: 'First human clinical trials focusing on safety, dosage, and side effects in a small group of healthy volunteers.',
        examples: ['Safety assessment', 'Dose finding', 'Pharmacokinetics']
      },
      {
        term: 'Phase II',
        definition: 'Clinical trials to evaluate effectiveness and further assess safety in a larger group of patients.',
        examples: ['Efficacy studies', 'Side effect monitoring', 'Dose optimization']
      }
    ],
    'Modality': [
      {
        term: 'Small Molecule',
        definition: 'Low molecular weight organic compounds that can modulate biological processes, typically administered orally.',
        examples: ['Tablets', 'Capsules', 'Oral solutions']
      },
      {
        term: 'Biologic',
        definition: 'Large, complex molecules derived from living organisms, typically administered by injection.',
        examples: ['Monoclonal antibodies', 'Proteins', 'Peptides']
      },
      {
        term: 'Cell Therapy',
        definition: 'Treatment using cells to restore or improve biological function, often involving stem cells.',
        examples: ['CAR-T cells', 'Stem cell therapy', 'Gene therapy']
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Definitions</h2>
            <p className="text-gray-600">Browse our comprehensive glossary of business development terms</p>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">{searchFiltered.length} terms</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
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

        {/* Definitions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {searchFiltered.map((def, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-900 text-lg">{def.term}</h3>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">{def.definition}</p>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {def.examples.map((example, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
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
const FreeContent = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [downloadedContent, setDownloadedContent] = useState([]);

  const freeContent = {
    'Templates': [
      {
        id: 1,
        title: 'BD Playbook Template',
        description: 'Comprehensive guide for business development strategies and best practices.',
        type: 'PDF',
        size: '2.3 MB',
        downloads: 1247,
        rating: 4.8,
        featured: true
      },
      {
        id: 2,
        title: 'Partnership Agreement Template',
        description: 'Standard template for partnership agreements with customizable clauses.',
        type: 'DOCX',
        size: '1.8 MB',
        downloads: 892,
        rating: 4.6,
        featured: false
      }
    ],
    'Guides': [
      {
        id: 3,
        title: 'Deal Comparables by Therapeutic Area',
        description: 'Curated deal comps segmented by therapeutic area for benchmarking.',
        type: 'XLSX',
        size: '3.1 MB',
        downloads: 2156,
        rating: 4.9,
        featured: true
      },
      {
        id: 4,
        title: 'Conference Strategy Guide',
        description: 'Ranked and reviewed BD conferences with attendance recommendations.',
        type: 'PDF',
        size: '1.5 MB',
        downloads: 678,
        rating: 4.4,
        featured: false
      }
    ],
    'Consulting': [
      {
        id: 5,
        title: '1:1 Business Development Consulting',
        description: 'Book personalized sessions with Vik for strategy and partnership discussions.',
        type: 'Session',
        size: '60 min',
        downloads: 45,
        rating: 5.0,
        featured: true
      }
    ]
  };

  const categories = Object.keys(freeContent);
  const filteredContent = selectedCategory === 'all' 
    ? Object.values(freeContent).flat()
    : freeContent[selectedCategory] || [];

  const handleDownload = (contentId) => {
    if (!downloadedContent.includes(contentId)) {
      setDownloadedContent(prev => [...prev, contentId]);
    }
    console.log('Downloading content:', contentId);
  };

  const formatDownloads = (downloads) => {
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}k`;
    }
    return downloads.toString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Free Content</h2>
            <p className="text-gray-600">Access our library of free business development resources</p>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium text-gray-600">{filteredContent.length} resources</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Resources</p>
                <p className="text-2xl font-bold text-red-900">{Object.values(freeContent).flat().length}</p>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Downloads</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatDownloads(Object.values(freeContent).flat().reduce((sum, c) => sum + c.downloads, 0))}
                </p>
              </div>
              <Download className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Your Downloads</p>
                <p className="text-2xl font-bold text-blue-900">{downloadedContent.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
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
                    <span>{formatDownloads(content.downloads)} downloads</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{content.rating}</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownload(content.id)}
                  className={`ml-4 p-3 rounded-lg transition-colors duration-200 ${
                    downloadedContent.includes(content.id)
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {downloadedContent.includes(content.id) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Download className="w-5 h-5" />
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

// Enhanced Legal Disclaimer Component
const LegalDisclaimer = () => {
  const legalSections = [
    {
      id: 1,
      title: 'Information Only - No Guarantees',
      content: 'The information in the database (contact details, affiliations) is for general informational and business development purposes only, and accuracy, completeness, timeliness, or usefulness is not guaranteed.',
      icon: '⚠️',
      priority: 'high'
    },
    {
      id: 2,
      title: 'No Endorsement or Representation',
      content: 'Inclusion of any individual or company does not constitute an endorsement or recommendation, and the platform does not represent or act on behalf of listed individuals or companies.',
      icon: '📋',
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Use at Your Own Risk',
      content: 'Users are solely responsible for how they use the information, including outreach, communication, and follow-up, and the platform is not responsible for the outcome of contact attempts or partnerships.',
      icon: '⚖️',
      priority: 'high'
    },
    {
      id: 4,
      title: 'No Liability',
      content: 'The platform shall not be held liable for any direct, indirect, incidental, or consequential damages arising from use of the database, including errors, omissions, inaccuracies, or actions taken based on the information.',
      icon: '🛡️',
      priority: 'high'
    },
    {
      id: 5,
      title: 'Compliance',
      content: 'By accessing and using the database, users agree to comply with applicable data privacy laws (such as GDPR, CAN-SPAM) and ethical outreach practices, with the user solely responsible for compliance.',
      icon: '📜',
      priority: 'medium'
    },
    {
      id: 6,
      title: 'Intellectual Property',
      content: 'All content and materials on this platform are protected by intellectual property rights.',
      icon: '🔒',
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal Disclaimer</h2>
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
          <h3 className="font-bold text-gray-900 mb-2">Questions or Concerns?</h3>
          <p className="text-gray-700 mb-3">
            If you have any questions about these terms or our data usage practices, please contact us.
          </p>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Contact Legal Team
            </motion.button>
            <span className="text-sm text-gray-600">or email: legal@bioping.com</span>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactForm);
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
      contact: 'support@bioping.com',
      responseTime: 'Within 24 hours'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Real-time assistance during business hours',
      contact: 'Available 9 AM - 6 PM EST',
      responseTime: 'Immediate'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      description: 'Speak directly with our team',
      contact: '+1 (555) 123-4567',
      responseTime: 'During business hours'
    }
  ];

  const teamMembers = [
    {
      name: 'Vik Vij',
      role: 'Business Development Lead',
      email: 'gvij@cdslifescigroup.com',
      expertise: 'Partnership Strategy, Deal Structuring',
      avatar: 'V'
    },
    {
      name: 'Sarah Johnson',
      role: 'Customer Success Manager',
      email: 'sarah@bioping.com',
      expertise: 'Platform Support, User Training',
      avatar: 'S'
    },
    {
      name: 'Mike Chen',
      role: 'Technical Support',
      email: 'mike@bioping.com',
      expertise: 'Technical Issues, Data Queries',
      avatar: 'M'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Us</h2>
            <p className="text-gray-600">Get in touch with our support team for assistance</p>
          </div>
          <div className="flex items-center space-x-2">
            <User className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">24/7 Support</span>
          </div>
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Send Message
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

// Enhanced Pricing Page Component
const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'starter',
      name: "Starter",
      description: "Perfect for small businesses getting started with BD",
      monthlyPrice: 99,
      annualPrice: 79,
      features: [
        "Up to 100 company searches per month",
        "Basic contact information",
        "Email support",
        "Standard search filters",
        "Export to CSV",
        "Basic analytics dashboard",
        "5 saved searches",
        "Standard API access"
      ],
      icon: Building2,
      popular: false,
      color: 'blue'
    },
    {
      id: 'professional',
      name: "Professional",
      description: "Ideal for growing businesses and BD teams",
      monthlyPrice: 199,
      annualPrice: 159,
      features: [
        "Up to 500 company searches per month",
        "Advanced contact information",
        "Priority email support",
        "Advanced search filters",
        "Export to multiple formats",
        "Advanced analytics & reporting",
        "Team collaboration tools",
        "Unlimited saved searches",
        "Custom integrations",
        "Dedicated account manager"
      ],
      icon: Users,
      popular: true,
      color: 'purple'
    },
    {
      id: 'enterprise',
      name: "Enterprise",
      description: "For large organizations with advanced BD needs",
      monthlyPrice: 399,
      annualPrice: 319,
      features: [
        "Unlimited company searches",
        "Complete contact information",
        "Dedicated account manager",
        "Custom search filters",
        "Full API access",
        "Advanced analytics & reporting",
        "White-label options",
        "Custom integrations",
        "Training & onboarding",
        "SLA guarantees",
        "Custom data feeds",
        "24/7 phone support"
      ],
      icon: Target,
      popular: false,
      color: 'green'
    }
  ];

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

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    console.log('Selected plan:', plan);
  };

  const getColorClasses = (color) => {
    switch(color) {
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      case 'green': return 'from-green-500 to-green-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, Transparent <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that best fits your business development needs. All plans include 
            our core features with different usage limits and additional capabilities.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <span className={`text-lg ${!isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isAnnual ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-lg ${isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Annual
            </span>
            {isAnnual && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                Save 20%
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`relative ${plan.popular ? 'lg:scale-105' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>Most Popular</span>
                </div>
              </div>
            )}
            
            <div className={`bg-white rounded-2xl p-8 h-full border-2 transition-all duration-300 hover:shadow-xl ${
              plan.popular ? 'border-purple-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <div className="text-center mb-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${getColorClasses(plan.color)} rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                  <plan.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500">/month</span>
                </div>
                {isAnnual && (
                  <p className="text-sm text-green-600 font-medium mb-6">
                    Billed annually (${plan.annualPrice * 12})
                  </p>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlan(plan)}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {selectedPlan?.id === plan.id ? 'Selected' : 'Choose Plan'}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">All Plans Include</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h3>
            <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated based on your current billing cycle.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely.</p>
          </div>
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial available?</h3>
            <p className="text-gray-600">Yes, we offer a 14-day free trial for all plans. No credit card required to start your trial.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What kind of support do you provide?</h3>
            <p className="text-gray-600">All plans include email support. Professional and Enterprise plans include priority support and dedicated account managers.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Join thousands of business development professionals who trust BioPing to find their next partnership opportunities.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all duration-200"
        >
          Start Free Trial
        </motion.button>
      </div>
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

  const getGrowthIcon = (growth) => {
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(membershipData.totalMembers)}</p>
              <p className={`text-sm font-medium flex items-center ${getGrowthColor(12.5)}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5% from last month
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(membershipData.revenue.monthly)}</p>
              <p className={`text-sm font-medium flex items-center ${getGrowthColor(membershipData.revenue.growth)}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                +{membershipData.revenue.growth}% from last month
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Members</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(membershipData.newMembersThisMonth)}</p>
              <p className={`text-sm font-medium flex items-center ${getGrowthColor(8.2)}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                +8.2% from last month
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Churn Rate</p>
              <p className="text-3xl font-bold text-gray-900">{membershipData.churnRate}%</p>
              <p className={`text-sm font-medium flex items-center ${getGrowthColor(-0.5)}`}>
                <TrendingDown className="w-4 h-4 mr-1" />
                -0.5% from last month
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h3>
          <div className="space-y-4">
            {membershipData.monthlyRevenue.map((data, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{data.month}</p>
                    <p className="text-sm text-gray-600">{formatNumber(data.members)} members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(data.revenue)}</p>
                  <p className="text-sm text-green-600">+{Math.round((data.revenue / 42000 - 1) * 100)}%</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Plan Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Starter</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatNumber(membershipData.plans.starter)}</p>
                <p className="text-sm text-gray-600">{Math.round((membershipData.plans.starter / membershipData.totalMembers) * 100)}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                <span className="font-medium">Professional</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatNumber(membershipData.plans.professional)}</p>
                <p className="text-sm text-gray-600">{Math.round((membershipData.plans.professional / membershipData.totalMembers) * 100)}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium">Enterprise</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatNumber(membershipData.plans.enterprise)}</p>
                <p className="text-sm text-gray-600">{Math.round((membershipData.plans.enterprise / membershipData.totalMembers) * 100)}%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Regional Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Regional Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {membershipData.topRegions.map((region, index) => (
            <div key={index} className="p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{region.region}</h4>
                  <p className="text-sm text-gray-600">{formatNumber(region.members)} members</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-medium text-gray-900">{formatCurrency(region.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. per member</span>
                  <span className="font-medium text-gray-900">{formatCurrency(region.revenue / region.members)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Signups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Signups</h3>
        <div className="space-y-4">
          {membershipData.recentSignups.map((signup, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{signup.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{signup.name}</p>
                  <p className="text-sm text-gray-600">{signup.company}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{signup.plan}</p>
                <p className="text-sm text-gray-600">{formatCurrency(signup.amount)}</p>
                <p className="text-xs text-gray-500">{new Date(signup.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
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
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/pricing-analytics', {
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

  const addNewPurchase = async (purchaseData) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/pricing-analytics/purchases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(purchaseData)
      });

      if (!response.ok) {
        throw new Error('Failed to add purchase');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh data after adding purchase
        await fetchPricingAnalytics();
        return result;
      } else {
        throw new Error(result.message || 'Failed to add purchase');
      }
    } catch (error) {
      console.error('Error adding purchase:', error);
      throw error;
    }
  };

  const updatePlanStats = async (planId, updates) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/pricing-analytics/plans/${planId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh data after updating plan
        await fetchPricingAnalytics();
        return result;
      } else {
        throw new Error(result.message || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  };

  const exportAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/pricing-analytics/export', {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Pricing Analytics...</p>
        </div>
      </div>
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

export default Dashboard; 