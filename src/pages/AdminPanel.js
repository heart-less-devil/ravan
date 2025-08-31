import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Database, 
  Users, 
  FileText, 
  Settings, 
  Download,
  Trash2,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  BarChart3,
  DollarSign,
  RefreshCw,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { API_BASE_URL, ADMIN_API_BASE_URL } from '../config';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [uploadedData, setUploadedData] = useState([]);
  const [users, setUsers] = useState([]); // Force empty - no users to display
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalCompanies: 0,
    totalContacts: 0,
    totalRevenue: 0
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedItems, setSelectedItems] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [trialData, setTrialData] = useState([]);
  const [potentialCustomers, setPotentialCustomers] = useState([]);
  const [consultingSessions, setConsultingSessions] = useState([]);
  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [showPasswords, setShowPasswords] = useState(false);

  
  // User Management State
  const [suspensionModal, setSuspensionModal] = useState(false);
  const [selectedUserForSuspension, setSelectedUserForSuspension] = useState(null);
  const [suspensionForm, setSuspensionForm] = useState({
    reason: '',
    duration: '1',
    customDate: ''
  });

  // Credit Management State
  const [creditModal, setCreditModal] = useState(false);
  const [selectedUserForCredit, setSelectedUserForCredit] = useState(null);
  const [creditForm, setCreditForm] = useState({
    action: 'add', // 'add' or 'remove'
    credits: '',
    reason: ''
  });

  useEffect(() => {
    // Load data from backend
    fetchBiotechData();
    fetchUsers(); // Enable user fetching from MongoDB
    fetchUserActivity();
    fetchTrialData();
    fetchPotentialCustomers();
    fetchConsultingSessions();
    fetchContactSubmissions();
  }, []);

  const fetchBiotechData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/biotech-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      
      if (result.success) {
        setUploadedData(result.data);
        calculateStats(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching biotech data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const uniqueCompanies = new Set(data.map(item => item.companyName)).size;
    const uniqueContacts = new Set(data.map(item => item.email)).size;
    
    setStats({
      totalRecords: data.length,
      totalCompanies: uniqueCompanies,
      totalContacts: uniqueContacts,
      totalRevenue: data.length * 99 // Assuming $99 per record
    });
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      
      if (result.success) {
        setUsers(Array.isArray(result.data.users) ? result.data.users : []);
      } else {
        throw new Error(result.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/user-activity`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user activity');
      }

      const result = await response.json();
      
      if (result.success) {
        setUserActivity(Array.isArray(result.data) ? result.data : []);
      } else {
        throw new Error(result.message || 'Failed to fetch user activity');
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setError(error.message);
    }
  };

  const fetchTrialData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/trial-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trial data');
      }

      const result = await response.json();
      
      if (result.success) {
        setTrialData(Array.isArray(result.data) ? result.data : []);
      } else {
        throw new Error(result.message || 'Failed to fetch trial data');
      }
    } catch (error) {
      console.error('Error fetching trial data:', error);
      setError(error.message);
    }
  };

  const fetchPotentialCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/potential-customers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch potential customers');
      }

      const result = await response.json();
      
      if (result.success) {
        setPotentialCustomers(Array.isArray(result.data) ? result.data : []);
      } else {
        throw new Error(result.message || 'Failed to fetch potential customers');
      }
    } catch (error) {
      console.error('Error fetching potential customers:', error);
      setError(error.message);
    }
  };

  const fetchConsultingSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/consulting-sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Failed to fetch consulting sessions'}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setConsultingSessions(Array.isArray(result.sessions) ? result.sessions : []);
      } else {
        throw new Error(result.message || 'Failed to fetch consulting sessions');
      }
    } catch (error) {
      console.error('Error fetching consulting sessions:', error);
      setError(error.message);
    }
  };

  const fetchContactSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/contact-submissions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Failed to fetch contact submissions'}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setContactSubmissions(Array.isArray(result.data) ? result.data : []);
      } else {
        throw new Error(result.message || 'Failed to fetch contact submissions');
      }
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      setError(error.message);
    }
  };



  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

              const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/upload-excel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to upload file`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh data after successful upload
        await fetchBiotechData();
        alert(`Successfully uploaded ${result.data.newRecords} records`);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const handleExportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Company Name,Contact Person,Email,Phone,Website,Disease Area,Development Stage,Modality,Region,Function,Company Size,Revenue\n" +
      uploadedData.map(row => 
        `${row.companyName},${row.contactPerson},${row.email},${row.phone},${row.website},${row.diseaseArea},${row.developmentStage},${row.modality},${row.region},${row.function},${row.companySize},${row.revenue}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "biotech_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRecord = (id) => {
    const updatedData = uploadedData.filter(item => item.id !== id);
    setUploadedData(updatedData);
    calculateStats(updatedData);
  };

  // User Management Functions
  const openSuspensionModal = (user) => {
    setSelectedUserForSuspension(user);
    setSuspensionForm({
      reason: '',
      duration: '1',
      customDate: ''
    });
    setSuspensionModal(true);
  };

  const closeSuspensionModal = () => {
    setSuspensionModal(false);
    setSelectedUserForSuspension(null);
    setSuspensionForm({
      reason: '',
      duration: '1',
      customDate: ''
    });
  };

  const handleSuspensionSubmit = async () => {
    try {
      if (!suspensionForm.reason) {
        alert('Please provide a reason for suspension');
        return;
      }

      let suspendUntil;
      if (suspensionForm.duration === 'custom') {
        suspendUntil = suspensionForm.customDate;
      } else {
        const duration = parseInt(suspensionForm.duration);
        const now = new Date();
        suspendUntil = new Date(now.getTime() + (duration * 24 * 60 * 60 * 1000)).toISOString();
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/suspend-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserForSuspension.id,
          reason: suspensionForm.reason,
          suspendUntil: suspendUntil,
          duration: suspensionForm.duration === 'custom' ? 'custom' : `${suspensionForm.duration} days`
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('User suspended successfully');
        closeSuspensionModal();
        fetchUsers(); // Refresh users list
      } else {
        const error = await response.json();
        alert(`Failed to suspend user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      if (!window.confirm('Are you sure you want to unsuspend this user?')) {
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/unsuspend-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        alert('User unsuspended successfully');
        fetchUsers(); // Refresh users list
      } else {
        const error = await response.json();
        alert(`Failed to unsuspend user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Error unsuspending user');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('User deleted successfully');
        fetchUsers(); // Refresh users list
      } else {
        const error = await response.json();
        alert(`Failed to delete user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  // Credit Management Functions
  const openCreditModal = (user) => {
    setSelectedUserForCredit(user);
    setCreditForm({
      action: 'add',
      credits: '',
      reason: ''
    });
    setCreditModal(true);
  };

  const closeCreditModal = () => {
    setCreditModal(false);
    setSelectedUserForCredit(null);
    setCreditForm({
      action: 'add',
      credits: '',
      reason: ''
    });
  };

  const handleCreditSubmit = async () => {
    try {
      if (!creditForm.credits || creditForm.credits <= 0) {
        alert('Please enter a valid number of credits');
        return;
      }

      if (!creditForm.reason.trim()) {
        alert('Please provide a reason for this credit action');
        return;
      }

      const token = localStorage.getItem('token');
      const endpoint = creditForm.action === 'add' 
        ? `${ADMIN_API_BASE_URL}/api/admin/users/${selectedUserForCredit.id}/add-credits`
        : `${ADMIN_API_BASE_URL}/api/admin/users/${selectedUserForCredit.id}/remove-credits`;

      console.log('🔧 Credit Management Request:', {
        action: creditForm.action,
        userId: selectedUserForCredit.id,
        credits: creditForm.credits,
        reason: creditForm.reason,
        endpoint: endpoint
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          credits: parseInt(creditForm.credits),
          reason: creditForm.reason
        })
      });

      console.log('🔧 Credit Management Response:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Credit Management Success:', result);
        alert(result.message);
        closeCreditModal();
        fetchUsers(); // Refresh users list
      } else {
        const error = await response.json();
        console.log('❌ Credit Management Error:', error);
        alert(`Failed to ${creditForm.action} credits: ${error.message}`);
      }
    } catch (error) {
      console.error(`Error ${creditForm.action}ing credits:`, error);
      alert(`Error ${creditForm.action}ing credits`);
    }
  };



  const getSuspensionStatus = (user) => {
    if (!user.suspended) return null;
    
    const now = new Date();
    const suspendUntil = new Date(user.suspended.suspendedUntil);
    
    if (now < suspendUntil) {
      return {
        status: 'suspended',
        timeRemaining: Math.ceil((suspendUntil - now) / (24 * 60 * 60 * 1000))
      };
    } else {
      return {
        status: 'expired',
        timeRemaining: 0
      };
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchBiotechData(), fetchUsers()]); // Enable user fetching
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === uploadedData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(uploadedData.map(item => item.id));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`)) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/delete-records`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ ids: selectedItems })
        });

        if (response.ok) {
          // Remove deleted items from state
          setUploadedData(prev => prev.filter(item => !selectedItems.includes(item.id)));
          setSelectedItems([]);
          calculateStats(uploadedData.filter(item => !selectedItems.includes(item.id)));
        } else {
          throw new Error('Failed to delete records');
        }
      } catch (error) {
        console.error('Error deleting records:', error);
        setError('Failed to delete selected records');
      } finally {
        setLoading(false);
      }
    }
  };

  const downloadTemplate = () => {
    // Create sample data for template
    const templateData = [
      {
        'Company Name': 'Example Biotech Inc',
        'Contact Person': 'Dr. John Smith',
        'Email': 'john.smith@examplebiotech.com',
        'Phone': '+1-555-0101',
        'Website': 'https://examplebiotech.com',
        'Disease Area': 'Oncology',
        'Development Stage': 'Phase II',
        'Modality': 'Small Molecule',
        'Region': 'North America',
        'Function': 'Business Development',
        'Company Size': '50-200',
        'Revenue': '10M-50M'
      },
      {
        'Company Name': 'Sample Pharma Ltd',
        'Contact Person': 'Jane Doe',
        'Email': 'jane.doe@samplepharma.com',
        'Phone': '+1-555-0102',
        'Website': 'https://samplepharma.com',
        'Disease Area': 'Neurology',
        'Development Stage': 'Phase III',
        'Modality': 'Biologic',
        'Region': 'Europe',
        'Function': 'Licensing',
        'Company Size': '200-500',
        'Revenue': '50M-100M'
      }
    ];

    // Convert to CSV
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'biotech_data_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleViewRecord = (record) => {
    alert(`Viewing record: ${record.companyName}`);
    // In a real application, you would navigate to a detail page or modal
  };

  const handleEditRecord = (record) => {
    alert(`Editing record: ${record.companyName}`);
    // In a real application, you would navigate to an edit form or modal
  };

  const handleSaveSettings = () => {
    alert('Settings saved successfully!');
    // In a real application, you would save the settings to the backend
  };

  const handleViewSession = (session) => {
    const sessionDetails = `
Session Details:
---------------
User: ${session.userName}
Email: ${session.userEmail}
Company: ${session.userCompany}
Date: ${new Date(session.date).toLocaleDateString()}
Time: ${session.time}
Topic: ${session.topic}
Notes: ${session.notes || 'No notes'}
Status: ${session.status}
Created: ${new Date(session.createdAt).toLocaleString()}
    `;
    alert(sessionDetails);
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/complete-session/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Failed to complete session'}`);
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Session marked as completed!');
        // Refresh the sessions list
        fetchConsultingSessions();
      } else {
        throw new Error(result.message || 'Failed to complete session');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Error completing session: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <motion.div 
                className="w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Database className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                <p className="text-gray-300 text-lg">Advanced Biotech Database Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button 
                onClick={refreshData}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </motion.button>
              <motion.button 
                onClick={handleExportData}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-5 h-5 mr-2" />
                Export Data
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-blue-400/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2">Total Records</p>
                <p className="text-4xl font-bold text-white">{stats.totalRecords.toLocaleString()}</p>
                <p className="text-blue-200 text-xs mt-2">Database entries</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Database className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-2xl border border-green-400/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-2">Total Companies</p>
                <p className="text-4xl font-bold text-white">{stats.totalCompanies.toLocaleString()}</p>
                <p className="text-green-200 text-xs mt-2">Unique organizations</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-2xl border border-purple-400/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-2">Total Contacts</p>
                <p className="text-4xl font-bold text-white">{stats.totalContacts.toLocaleString()}</p>
                <p className="text-purple-200 text-xs mt-2">BD professionals</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 shadow-2xl border border-yellow-400/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium mb-2">Total Revenue</p>
                <p className="text-4xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
                <p className="text-yellow-200 text-xs mt-2">Estimated value</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Registered Users</p>
                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-2xl border border-indigo-400/20 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => navigate('/dashboard/pdf-management')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-2">PDF Management</p>
                <p className="text-3xl font-bold text-white">6</p>
                <p className="text-indigo-200 text-xs mt-2">BD Resources</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-2xl border bo
            rder-emerald-400/20 backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform duration-200"
            onClick={() => navigate('/dashboard/pricing-management')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-2">Pricing Management</p>
                <p className="text-3xl font-bold text-white">4</p>
                <p className="text-emerald-200 text-xs mt-2">Subscription Plans</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {uploadedData.length === 0 && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center mb-8"
          >
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-6">Upload your first Excel file to get started</p>
            <button
              onClick={() => setActiveTab('upload')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Upload Data
            </button>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'upload', name: 'Upload Data', icon: Upload },
                { id: 'manage', name: 'Manage Data', icon: FileText },
                { id: 'users', name: 'Users', icon: Users },
                { id: 'user-management', name: 'User Management', icon: Users },
                { id: 'activity', name: 'User Activity', icon: BarChart3 },
                { id: 'trials', name: 'Trial Data', icon: RefreshCw },
                { id: 'customers', name: 'Potential Customers', icon: Users },
                { id: 'consulting', name: 'Consulting Sessions', icon: Users },
                { id: 'contacts', name: 'Contact Submissions', icon: Mail },
                { id: 'settings', name: 'Settings', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'upload' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Excel Data</h3>
                  <p className="text-gray-600 mb-6">
                    Upload your Excel file containing biotech company data. The file should include columns for company name, contact person, email, phone, website, disease area, development stage, modality, region, function, company size, and revenue.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {loading ? (
                      <div>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Processing file...</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{uploadProgress}% complete</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Drag and drop your Excel file here, or</p>
                        <label className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          Choose File
                        </label>
                        {selectedFile && (
                          <p className="text-sm text-gray-500 mt-2">Selected: {selectedFile.name}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-2">Required Columns:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div>• Company Name</div>
                      <div>• Contact Person</div>
                      <div>• Email</div>
                      <div>• Phone</div>
                      <div>• Website</div>
                      <div>• Disease Area</div>
                      <div>• Development Stage</div>
                      <div>• Modality</div>
                      <div>• Region</div>
                      <div>• Function</div>
                      <div>• Company Size</div>
                      <div>• Revenue</div>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Excel Template</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'manage' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Manage Data</h3>
                  <div className="flex items-center space-x-4">
                    {selectedItems.length > 0 && (
                      <button 
                        onClick={handleDeleteSelected}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Selected ({selectedItems.length})</span>
                      </button>
                    )}
                    <button 
                      onClick={handleExportData}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export All Data</span>
                    </button>
                  </div>
                </div>

                {uploadedData.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-600 mb-4">Upload your first Excel file to see data here</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      Upload Data
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedItems.length === uploadedData.length && uploadedData.length > 0}
                              onChange={handleSelectAll}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disease Area</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uploadedData.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={() => handleSelectItem(item.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.companyName}</div>
                                <div className="text-sm text-gray-500">{item.website}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.contactPerson}</div>
                                <div className="text-sm text-gray-500">{item.phone}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.diseaseArea}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.developmentStage}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleViewRecord(item)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors duration-200 cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEditRecord(item)}
                                  className="text-green-600 hover:text-green-900 transition-colors duration-200 cursor-pointer"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRecord(item.id)}
                                  className="text-red-600 hover:text-red-900 transition-colors duration-200 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Registered Users</h3>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      Total Users: {users.length}
                    </div>
                    <button
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      <span>{showPasswords ? '👁️' : '🙈'}</span>
                      <span>{showPasswords ? 'Hide' : 'Show'} Passwords</span>
                    </button>
                    <button
                      onClick={() => {
                        const passwords = users.map(u => `${u.email}: ${u.password || 'N/A'}`).join('\n');
                        navigator.clipboard.writeText(passwords);
                        alert('All passwords copied to clipboard!');
                      }}
                      className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      <span>📋</span>
                      <span>Copy All</span>
                    </button>
                  </div>
                </div>

                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-600">No users have registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(users) && users.map((user) => (
                          <tr key={user.email} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {showPasswords ? (user.password || 'N/A') : (user.password ? '••••••••' : 'N/A')}
                              </span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(user.password || '');
                                  alert('Password copied to clipboard!');
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                                title="Copy password"
                              >
                                📋
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.company}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleDeleteUser(user.id || user._id)}
                                  className="text-red-600 hover:text-red-900 transition-colors duration-200 cursor-pointer"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity & Registration</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">Login & Registration Tracking</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(userActivity) && userActivity.map((activity, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {activity.userName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.action === 'login' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {activity.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.ipAddress || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'trials' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trial Management</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">Trial Start & End Dates</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Start</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial End</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(trialData) && trialData.map((trial, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {trial.userName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trial.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(trial.trialStart).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(trial.trialEnd).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                trial.status === 'active' ? 'bg-green-100 text-green-800' : 
                                trial.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {trial.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {trial.daysRemaining} days
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Potential Customers</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">Customer Details for Follow-up</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(potentialCustomers) && potentialCustomers.map((customer, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.company}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(customer.registrationDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(customer.lastActivity).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-blue-600 hover:text-blue-800 mr-2">Email</button>
                              <button className="text-green-600 hover:text-green-800">Call</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'consulting' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">BD Consulting Sessions</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">Scheduled and Completed Sessions</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(consultingSessions) && consultingSessions.map((session, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {session.userName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.userCompany}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(session.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.time}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.topic}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                session.status === 'scheduled' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {session.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                onClick={() => handleViewSession(session)}
                                className="text-blue-600 hover:text-blue-800 mr-2"
                              >
                                View
                              </button>
                              <button 
                                onClick={() => handleCompleteSession(session.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                Complete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'user-management' && (
              <motion.div
                key="user-management"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={refreshData}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                      </button>
                      <button
                        onClick={() => {
                          // Test suspension with a quick 1-minute suspension
                          const testUser = users.find(u => u.role !== 'admin');
                          if (testUser) {
                            setSelectedUserForSuspension(testUser);
                            setSuspensionForm({
                              reason: 'Test suspension - 1 minute',
                              duration: 'custom',
                              customDate: new Date(Date.now() + 60000).toISOString().slice(0, 16)
                            });
                            setSuspensionModal(true);
                          } else {
                            alert('No non-admin users found to test with');
                          }
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Test Suspension (1 min)
                      </button>
                    </div>
                  </div>

                  {users.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Credits
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => {
                              const suspensionStatus = getSuspensionStatus(user);
                              return (
                                <tr key={user.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-blue-600">
                                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                      </div>
                                      <div className="ml-3">
                                        <div className="text-sm font-medium text-gray-900">
                                          {user.name || 'Unknown'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          ID: {user.id}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      user.role === 'admin' 
                                        ? 'bg-purple-100 text-purple-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {user.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {suspensionStatus ? (
                                      <div className="flex items-center space-x-2">
                                        {suspensionStatus.status === 'suspended' ? (
                                          <>
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                            <span className="text-sm text-red-600 font-medium">
                                              Suspended ({suspensionStatus.timeRemaining} days left)
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <Clock className="w-4 h-4 text-yellow-500" />
                                            <span className="text-sm text-yellow-600 font-medium">
                                              Suspension Expired
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-green-600 font-medium">Active</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">{user.currentCredits || 0}</span>
                                      <span className="text-gray-500 text-xs">credits</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                      {suspensionStatus && suspensionStatus.status === 'suspended' ? (
                                        <button
                                          onClick={() => handleUnsuspendUser(user.id)}
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                                        >
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Unsuspend
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => openSuspensionModal(user)}
                                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                                        >
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          Suspend
                                        </button>
                                      )}
                                      <button
                                        onClick={() => openCreditModal(user)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                                        title="Manage credits"
                                      >
                                        <DollarSign className="w-3 h-3 mr-1" />
                                        Credits
                                      </button>
                                      <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                                        title="Delete user"
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                      <p className="text-gray-500">No users have registered yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}



            {activeTab === 'contacts' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Form Submissions</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">All Contact Form Submissions</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(contactSubmissions) && contactSubmissions.map((submission, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {submission.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{submission.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{submission.company}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">
                              {submission.message}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(submission.timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                submission.status === 'new' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {submission.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button 
                                onClick={() => alert(`Full Message:\n\n${submission.message}`)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Search Results Limit
                    </label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Number of results users can see without paying</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email Price
                    </label>
                    <input
                      type="number"
                      defaultValue="99"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Price per contact email in USD</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Premium Plan Price
                    </label>
                    <input
                      type="number"
                      defaultValue="199"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Monthly price for unlimited access</p>
                  </div>

                  <button 
                    onClick={handleSaveSettings}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Suspension Modal */}
      {suspensionModal && selectedUserForSuspension && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Suspend User: {selectedUserForSuspension.name || selectedUserForSuspension.email}
                </h3>
                <button
                  onClick={closeSuspensionModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Suspension *
                  </label>
                  <textarea
                    value={suspensionForm.reason}
                    onChange={(e) => setSuspensionForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter reason for suspension..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suspension Duration
                  </label>
                  <select
                    value={suspensionForm.duration}
                    onChange={(e) => setSuspensionForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">1 Week</option>
                    <option value="30">1 Month</option>
                    <option value="90">3 Months</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>

                {suspensionForm.duration === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={suspensionForm.customDate}
                      onChange={(e) => setSuspensionForm(prev => ({ ...prev, customDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={closeSuspensionModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSuspensionSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
                  >
                    Suspend User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Management Modal */}
      {creditModal && selectedUserForCredit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Credits: {selectedUserForCredit.name || selectedUserForCredit.email}
                </h3>
                <button
                  onClick={closeCreditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Credits
                  </label>
                  <div className="text-lg font-semibold text-blue-600">
                    {selectedUserForCredit.currentCredits || 0} credits
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={creditForm.action}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, action: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="add">Add Credits</option>
                    <option value="remove">Remove Credits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Credits *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={creditForm.credits}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, credits: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter number of credits"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason *
                  </label>
                  <textarea
                    value={creditForm.reason}
                    onChange={(e) => setCreditForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter reason for this credit action..."
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={closeCreditModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreditSubmit}
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg ${
                      creditForm.action === 'add' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {creditForm.action === 'add' ? 'Add Credits' : 'Remove Credits'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 