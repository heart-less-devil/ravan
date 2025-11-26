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

  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [subscriptionDetails, setSubscriptionDetails] = useState([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [comprehensiveData, setComprehensiveData] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  
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
  const [selectedUserForCredits, setSelectedUserForCredits] = useState(null);
  const [creditForm, setCreditForm] = useState({
    credits: '',
    reason: ''
  });
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  useEffect(() => {
    // Load data from backend
    fetchBiotechData();
    fetchUsers(); // Enable user fetching from MongoDB
    fetchComprehensiveData(); // Fetch all data in one call
    fetchContactSubmissions();
    fetchSubscriptionDetails();
  }, []);

  // Auto-refresh data every 4 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing MongoDB data...');
      fetchComprehensiveData();
    }, 4 * 60 * 1000); // 4 minutes

    return () => clearInterval(interval);
  }, []);

  const fetchBiotechData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
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
      const token = sessionStorage.getItem('token');
      
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
        const fetchedUsers = Array.isArray(result.data.users) ? result.data.users : [];
        setUsers(fetchedUsers);

        setComprehensiveData(prev => {
          if (prev) {
            return {
              ...prev,
              users: fetchedUsers,
              summary: {
                ...prev.summary,
                pendingApprovals: fetchedUsers.filter(u => !u.isApproved).length,
                totalUsers: fetchedUsers.length,
                activeUsers: fetchedUsers.filter(u => u.isActive).length,
                verifiedUsers: fetchedUsers.filter(u => u.isVerified).length,
                trialUsers: fetchedUsers.filter(u => u.currentPlan === 'trial' || u.plan === 'trial').length,
              }
            };
          }
          return {
            users: fetchedUsers,
            summary: {
              pendingApprovals: fetchedUsers.filter(u => !u.isApproved).length,
              totalUsers: fetchedUsers.length,
              activeUsers: fetchedUsers.filter(u => u.isActive).length,
              verifiedUsers: fetchedUsers.filter(u => u.isVerified).length,
              trialUsers: fetchedUsers.filter(u => u.currentPlan === 'trial' || u.plan === 'trial').length,
            }
          };
        });
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
      const token = sessionStorage.getItem('token');
      
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
      const token = sessionStorage.getItem('token');
      
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
      const token = sessionStorage.getItem('token');
      
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

  // Fetch comprehensive data from MongoDB Atlas
  const fetchComprehensiveData = async () => {
    try {
      setIsRefreshing(true);
      const token = sessionStorage.getItem('token');
      
      console.log('🔍 Fetching comprehensive data from MongoDB Atlas...');
      
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/comprehensive-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comprehensive data');
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Comprehensive data fetched successfully:', result.data);
        setComprehensiveData(result.data);
        
        // Update individual state variables
        setUserActivity(result.data.userActivity || []);
        setTrialData(result.data.trialData || []);
        setPotentialCustomers(result.data.potentialCustomers || []);
        setSubscriptionDetails(result.data.subscriptions || []);
        
        // Update users if not already set
        if (!users.length && result.data.users) {
          setUsers(result.data.users);
        }
        
        setLastRefresh(new Date());
        console.log('🕒 Data refreshed at:', new Date().toLocaleString());
      } else {
        throw new Error(result.message || 'Failed to fetch comprehensive data');
      }
    } catch (error) {
      console.error('Error fetching comprehensive data:', error);
      setError(error.message);
      
      // Fallback to individual endpoints if comprehensive fails
      console.log('🔄 Falling back to individual endpoints...');
      fetchUserActivity();
      fetchTrialData();
      fetchPotentialCustomers();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Refresh all data
  const refreshAllData = async () => {
    await fetchComprehensiveData();
  };



  const fetchContactSubmissions = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
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

  const fetchSubscriptionDetails = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/subscription-details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || 'Failed to fetch subscription details'}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSubscriptionDetails(Array.isArray(result.subscriptions) ? result.subscriptions : []);
      } else {
        throw new Error(result.message || 'Failed to fetch subscription details');
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error);
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
      const token = sessionStorage.getItem('token');
      
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
    const updatedData = uploadedData.filter(item => (item.id || '') !== id);
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

      const token = sessionStorage.getItem('token');
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

      const token = sessionStorage.getItem('token');
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

      const token = sessionStorage.getItem('token');
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

  // User Approval Functions
  const handleApproveUser = async (userId) => {
    try {
      if (!window.confirm('Are you sure you want to approve this user?')) {
        return;
      }

      const normalizedId = userId ? String(userId) : '';
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/approve-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('User approved successfully');
        setUsers(prevUsers => prevUsers.map(user => {
          const candidateId = user.id || user._id;
          if (candidateId && String(candidateId) === normalizedId) {
            return { ...user, isApproved: true };
          }
          return user;
        }));

        setComprehensiveData(prev => {
          if (!prev) return prev;

          const updatedUsers = (prev.users || []).map(user => {
            const candidateId = user.id || user._id;
            if (candidateId && String(candidateId) === normalizedId) {
              return { ...user, isApproved: true };
            }
            return user;
          });

          const pendingApprovals = updatedUsers.filter(u => !u.isApproved).length;

          return {
            ...prev,
            users: updatedUsers,
            summary: prev.summary ? {
              ...prev.summary,
              pendingApprovals,
              totalUsers: updatedUsers.length,
              activeUsers: updatedUsers.filter(u => u.isActive).length,
              verifiedUsers: updatedUsers.filter(u => u.isVerified).length,
              trialUsers: updatedUsers.filter(u => u.currentPlan === 'trial' || u.plan === 'trial').length,
            } : prev.summary,
          };
        });

        fetchUsers(); // Refresh the users list
      } else {
        const error = await response.json();
        alert(`Failed to approve user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    }
  };

  const handleRejectUser = async (userId) => {
    try {
      if (!window.confirm('Are you sure you want to reject this user? This will delete their account.')) {
        return;
      }

      const normalizedId = userId ? String(userId) : '';
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/reject-user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('User rejected and account deleted');
        setUsers(prevUsers => prevUsers.filter(user => {
          const candidateId = user.id || user._id;
          return !(candidateId && String(candidateId) === normalizedId);
        }));

        setComprehensiveData(prev => {
          if (!prev) return prev;

          const updatedUsers = (prev.users || []).filter(user => {
            const candidateId = user.id || user._id;
            return !(candidateId && String(candidateId) === normalizedId);
          });

          const pendingApprovals = updatedUsers.filter(u => !u.isApproved).length;

          return {
            ...prev,
            users: updatedUsers,
            summary: prev.summary ? {
              ...prev.summary,
              pendingApprovals,
              totalUsers: updatedUsers.length,
              activeUsers: updatedUsers.filter(u => u.isActive).length,
              verifiedUsers: updatedUsers.filter(u => u.isVerified).length,
              trialUsers: updatedUsers.filter(u => u.currentPlan === 'trial' || u.plan === 'trial').length,
            } : prev.summary,
          };
        });

        fetchUsers(); // Refresh the users list
      } else {
        const error = await response.json();
        alert(`Failed to reject user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user');
    }
  };

  const handleViewUserDetails = (user) => {
    // Open a modal or navigate to user details page
    const userDetails = `
User ID: ${user.id || user._id}
Name: ${user.name || `${user.firstName || ''} ${user.lastName || ''}`}
Email: ${user.email}
Company: ${user.company || 'Not specified'}
Role: ${user.role || 'other'}
Status: ${user.isActive ? 'Active' : 'Inactive'}
Verified: ${user.isVerified ? 'Yes' : 'No'}
Approved: ${user.isApproved ? 'Yes' : 'No'}
Plan: ${user.currentPlan || 'free'}
Credits: ${user.currentCredits || 0}
Last Login: ${user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}
    `;
    
    alert(userDetails);
  };

  // Credit Management Functions
  const openCreditModal = (user) => {
    setSelectedUserForCredits(user);
    setCreditForm({
      credits: '',
      reason: ''
    });
    setCreditModal(true);
  };

  const closeCreditModal = () => {
    setCreditModal(false);
    setSelectedUserForCredits(null);
    setCreditForm({
      credits: '',
      reason: ''
    });
  };

  const handleAddCredits = async () => {
    if (!creditForm.credits || creditForm.credits < 1 || creditForm.credits > 10000) {
      setError('Please enter valid credits (1-10000)');
      return;
    }

    setIsAddingCredits(true);
    setError(null);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL || API_BASE_URL}/api/admin/add-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: selectedUserForCredits.email,
          credits: parseInt(creditForm.credits),
          reason: creditForm.reason || `Admin credit addition`
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ Successfully added ${creditForm.credits} credits to ${selectedUserForCredits.email}\n\nOld Credits: ${data.data.oldCredits}\nNew Credits: ${data.data.newCredits}`);
        closeCreditModal();
        fetchUsers(); // Refresh user list
        fetchComprehensiveData(); // Refresh comprehensive data
      } else {
        setError(data.message || 'Failed to add credits');
      }
    } catch (err) {
      console.error('Error adding credits:', err);
      setError('Error adding credits. Please try again.');
    } finally {
      setIsAddingCredits(false);
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
      setSelectedItems(uploadedData.map(item => item.id || '').filter(id => id !== ''));
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
        const token = sessionStorage.getItem('token');
        
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
          setUploadedData(prev => prev.filter(item => !selectedItems.includes(item.id || '')));
          setSelectedItems([]);
          calculateStats(uploadedData.filter(item => !selectedItems.includes(item.id || '')));
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

  const handleViewSubscription = (subscription) => {
    const subscriptionDetails = `
Subscription Details:
-------------------
User: ${subscription.name || `${subscription.firstName} ${subscription.lastName}`}
Email: ${subscription.email}
Plan: ${subscription.currentPlan}
Status: ${subscription.paymentCompleted ? 'Active' : 'Inactive'}
Credits: ${subscription.currentCredits || 0}
Next Renewal: ${subscription.nextCreditRenewal ? new Date(subscription.nextCreditRenewal).toLocaleDateString() : 'N/A'}
Subscription ID: ${subscription.subscriptionId || 'N/A'}
Subscription End: ${subscription.subscriptionEndAt ? new Date(subscription.subscriptionEndAt).toLocaleDateString() : 'N/A'}
On Hold: ${subscription.subscriptionOnHold ? 'Yes' : 'No'}
Created: ${new Date(subscription.createdAt).toLocaleString()}
    `;
    alert(subscriptionDetails);
  };

  const handleEditSubscription = (subscription) => {
    const newPlan = prompt(`Edit subscription for ${subscription.email}:\n\nCurrent Plan: ${subscription.currentPlan}\nEnter new plan (free, daily-12, monthly, annual):`, subscription.currentPlan);
    
    if (newPlan && newPlan !== subscription.currentPlan) {
      // In a real application, you would make an API call to update the subscription
      alert(`Subscription plan updated to: ${newPlan}\n\nNote: This is a demo. In production, this would update the database and Stripe.`);
    }
  };

  const handleCancelSubscription = async (subscription) => {
    if (window.confirm(`Are you sure you want to cancel the subscription for ${subscription.email}?`)) {
      try {
        const token = sessionStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/api/admin/cancel-subscription/${subscription.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || 'Failed to cancel subscription'}`);
        }

        const result = await response.json();
        
        if (result.success) {
          alert('Subscription cancelled successfully!');
          fetchSubscriptionDetails(); // Refresh the list
        } else {
          throw new Error(result.message || 'Failed to cancel subscription');
        }
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        alert('Error cancelling subscription: ' + error.message);
      }
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
              {/* MongoDB Atlas Data Status */}
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20" style={{ display: 'none' }}>
                <div className={`w-3 h-3 rounded-full ${comprehensiveData ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                <span className="text-white text-sm font-medium">
                  {comprehensiveData ? 'MongoDB Atlas' : 'Loading...'}
                </span>
                {lastRefresh && (
                  <span className="text-gray-300 text-xs">
                    {new Date(lastRefresh).toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              <motion.button 
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh MongoDB Data'}
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
        {/* Enhanced Stats Cards - Only Important Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {comprehensiveData?.summary?.totalUsers || users.length || 0}
                </p>
                <p className="text-gray-500 text-xs mt-1">Registered accounts</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          {/* Active Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">
                  {comprehensiveData?.summary?.activeUsers || users.filter(u => u.isActive).length || 0}
                </p>
                <p className="text-gray-500 text-xs mt-1">Currently active</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">$485,199</p>
                <p className="text-gray-500 text-xs mt-1">Monthly recurring</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </motion.div>

          {/* Pending Approvals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900">
                  {comprehensiveData?.users?.filter(u => !u.isApproved).length || 0}
                </p>
                <p className="text-gray-500 text-xs mt-1">Awaiting review</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>





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
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-2xl border border-orange-400/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-2">Trial Users</p>
                <p className="text-4xl font-bold text-white">
                  {comprehensiveData?.summary?.trialUsers || trialData.length || 0}
                </p>
                <p className="text-orange-200 text-xs mt-2">Free & test accounts</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-8 h-8 text-white" />
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
            style={{ display: 'none' }}
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

        {/* MongoDB Atlas Connection Status */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-6 p-6" style={{ display: 'none' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${comprehensiveData ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                <span className="text-white font-medium">
                  {comprehensiveData ? 'Connected to MongoDB Atlas' : 'Connecting to MongoDB Atlas...'}
                </span>
              </div>
              {comprehensiveData && (
                <div className="text-gray-300 text-sm">
                  Database: <span className="text-white font-mono">bioping</span> | 
                  Collection: <span className="text-white font-mono">users</span> | 
                  Last Updated: <span className="text-white">{lastRefresh ? new Date(lastRefresh).toLocaleString() : 'Never'}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshAllData}
                disabled={isRefreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
              </button>
              {comprehensiveData && (
                <div className="text-green-400 text-sm font-medium">
                  ✅ Live Data
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MongoDB Atlas Data Summary - HIDDEN */}
        {false && comprehensiveData && comprehensiveData.summary && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-6 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📊 MongoDB Atlas Data Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{comprehensiveData?.summary?.totalUsers || 0}</div>
                <div className="text-gray-300 text-sm">Total Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{comprehensiveData?.summary?.activeUsers || 0}</div>
                <div className="text-gray-300 text-sm">Active Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{comprehensiveData?.summary?.verifiedUsers || 0}</div>
                <div className="text-gray-300 text-sm">Verified Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{comprehensiveData?.summary?.paidUsers || 0}</div>
                <div className="text-gray-300 text-sm">Paid Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{comprehensiveData?.summary?.trialUsers || 0}</div>
                <div className="text-gray-300 text-sm">Trial Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{comprehensiveData?.summary?.potentialCustomers || 0}</div>
                <div className="text-gray-300 text-sm">Potential Customers</div>
              </div>
            </div>
            <div className="mt-4 text-center text-gray-300 text-sm">
              🔄 Auto-refreshing every 4 minutes | 📍 Data source: MongoDB Atlas Cloud Database
            </div>
          </div>
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
                { id: 'pending-approvals', name: 'Pending Approvals', icon: Clock, badge: comprehensiveData?.users?.filter(u => !u.isApproved).length || 0 },
                { id: 'activity', name: 'User Activity', icon: BarChart3 },
                { id: 'trials', name: 'Trial Data', icon: RefreshCw },
                { id: 'customers', name: 'Potential Customers', icon: Users },
                { id: 'contacts', name: 'Contact Submissions', icon: Mail },
                { id: 'subscriptions', name: 'Subscription Details', icon: DollarSign },
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
                  {tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {tab.badge}
                    </span>
                  )}
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
                  <div className="text-center py-12" style={{ display: 'none' }}>
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
                                checked={selectedItems.includes(item.id || '')}
                                onChange={() => handleSelectItem(item.id || '')}
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
                                  onClick={() => handleDeleteRecord(item.id || '')}
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

            {/* Pending Approvals Tab */}
            {activeTab === 'pending-approvals' && (
              <motion.div
                key="pending-approvals"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Pending Account Approvals</h3>
                        <p className="text-orange-100">Review and approve new user registrations</p>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          {comprehensiveData?.users?.filter(u => !u.isApproved).length || 0}
                        </div>
                        <div className="text-sm text-orange-100">Pending Review</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-900">Quick Actions</h4>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            const pendingUsers = comprehensiveData?.users?.filter(u => !u.isApproved) || [];
                            if (pendingUsers.length === 0) {
                              alert('No pending approvals');
                              return;
                            }
                            if (window.confirm(`Approve all ${pendingUsers.length} pending users?`)) {
                              // Handle bulk approval
                              alert('Bulk approval feature coming soon');
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve All</span>
                        </button>
                        <button
                          onClick={refreshData}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Refresh</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pending Users List */}
                  {comprehensiveData?.users?.filter(u => !u.isApproved).length > 0 ? (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                User Details
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Company & Role
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Registration Date
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {comprehensiveData?.users?.filter(u => !u.isApproved).map((user) => {
                              const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
                              const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
                              
                              return (
                                <tr key={user.id || user._id} className="hover:bg-orange-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-sm font-bold text-white">
                                          {initials}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {fullName}
                                        </div>
                                        <div className="text-sm text-gray-600">{user.email}</div>
                                        <div className="text-xs text-gray-500">
                                          ID: {user.id || user._id}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.company || 'Not specified'}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {user.role?.replace('-', ' ') || 'other'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleApproveUser(user.id || user._id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Approve</span>
                                      </button>
                                      <button
                                        onClick={() => handleRejectUser(user.id || user._id)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                                      >
                                        <X className="w-4 h-4" />
                                        <span>Reject</span>
                                      </button>
                                      <button
                                        onClick={() => handleViewUserDetails(user)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                                      >
                                        <Eye className="w-4 h-4" />
                                        <span>View</span>
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
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
                      <p className="text-gray-600">All user accounts have been reviewed and approved.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Activity & Registration</h3>
                  <div className="flex items-center space-x-2">
                    {comprehensiveData && (
                      <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        📊 MongoDB Atlas Data
                      </span>
                    )}
                    <button
                      onClick={refreshAllData}
                      disabled={isRefreshing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      {isRefreshing ? '🔄' : '🔄'}
                    </button>
                  </div>
                </div>
                
                {isRefreshing ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Fetching latest data from MongoDB Atlas...</p>
                  </div>
                ) : !comprehensiveData ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center" style={{ display: 'none' }}>
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <p className="text-gray-600 mb-2">Connecting to MongoDB Atlas...</p>
                    <p className="text-sm text-gray-500">Click refresh to load data</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">Login & Registration Tracking (Last 30 Days)</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Total Activities: {userActivity.length} | Last Updated: {lastRefresh ? new Date(lastRefresh).toLocaleString() : 'Never'}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(userActivity) && userActivity.length > 0 ? (
                            userActivity.map((activity, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {activity.userName || activity.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    activity.action && activity.action.includes('Login') ? 'bg-green-100 text-green-800' : 
                                    activity.action && activity.action.includes('Registration') ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {activity.action || 'N/A'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(activity.timestamp || activity.registrationDate).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.company || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.role || 'N/A'}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                No recent user activity found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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



            {activeTab === 'user-management' && (
              <motion.div
                key="user-management"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  {/* Enhanced Header with Professional Stats */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Advanced User Management</h3>
                        <p className="text-blue-100">Comprehensive user control and analytics dashboard</p>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold">{comprehensiveData?.users?.length || 0}</div>
                          <div className="text-sm text-blue-100">Total Users</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-300">
                            {comprehensiveData?.users?.filter(u => u.isActive).length || 0}
                          </div>
                          <div className="text-sm text-blue-100">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-yellow-300">
                            {comprehensiveData?.users?.filter(u => !u.isVerified).length || 0}
                          </div>
                          <div className="text-sm text-blue-100">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-300">
                            {comprehensiveData?.users?.filter(u => !u.isActive).length || 0}
                          </div>
                          <div className="text-sm text-blue-100">Suspended</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Filter and Search Bar */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search users by name, email..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending Approval</option>
                        <option value="suspended">Suspended</option>
                      </select>
                      <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">All Plans</option>
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                        <option value="annual">Annual</option>
                      </select>
                      <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">All Roles</option>
                        <option value="business-development">Business Development</option>
                        <option value="sales">Sales</option>
                        <option value="marketing">Marketing</option>
                        <option value="executive">Executive</option>
                        <option value="investor">Investor</option>
                      </select>
                      <div className="flex space-x-2">
                        <button
                          onClick={refreshData}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Refresh</span>
                        </button>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {users.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                User Profile
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Contact Info
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Professional Role
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Account Status
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Subscription Plan
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Credits & Usage
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Last Activity
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => {
                              const suspensionStatus = getSuspensionStatus(user);
                              const isPendingApproval = !user.isApproved;
                              const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
                              const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
                              
                              return (
                                <tr key={user.id || user._id} className="hover:bg-gray-50 transition-colors">
                                  {/* User Profile */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-sm font-bold text-white">
                                          {initials}
                                        </span>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {fullName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ID: {user.id || user._id}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          Company: {user.company || 'Not specified'}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  
                                  {/* Contact Info */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.email}</div>
                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                      <Mail className="w-3 h-3 mr-1" />
                                      {user.isVerified ? 'Verified' : 'Unverified'}
                                    </div>
                                  </td>
                                  
                                  {/* Professional Role */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                      user.role === 'admin' 
                                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                        : user.role === 'business-development'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : user.role === 'executive'
                                        ? 'bg-green-100 text-green-800 border border-green-200'
                                        : user.role === 'investor'
                                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                      {user.role?.replace('-', ' ') || 'other'}
                                    </span>
                                  </td>
                                  
                                  {/* Account Status */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {isPendingApproval ? (
                                      <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-orange-500" />
                                        <span className="text-sm text-orange-600 font-medium">Pending Approval</span>
                                      </div>
                                    ) : suspensionStatus ? (
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
                                        <span className="text-sm text-green-600 font-medium">Active & Approved</span>
                                      </div>
                                    )}
                                  </td>
                                  
                                  {/* Subscription Plan */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-1 ${
                                        user.currentPlan === 'free' 
                                          ? 'bg-gray-100 text-gray-800'
                                          : user.currentPlan === 'premium'
                                          ? 'bg-purple-100 text-purple-800'
                                          : user.currentPlan === 'annual'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {user.currentPlan || 'free'}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        {user.paymentCompleted ? 'Paid' : 'Trial'}
                                      </div>
                                    </div>
                                  </td>
                                  
                                  {/* Credits & Usage */}
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full" 
                                          style={{ width: `${Math.min(100, ((user.currentCredits || 0) / 10) * 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">{user.currentCredits || 0}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Last used: {user.lastCreditUsage ? new Date(user.lastCreditUsage).toLocaleDateString() : 'Never'}
                                    </div>
                                  </td>
                                  
                                  {/* Last Activity */}
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col">
                                      <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
                                      <span className="text-xs text-gray-400">
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : ''}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                      {isPendingApproval ? (
                                        <>
                                          <button
                                            onClick={() => handleApproveUser(user.id || user._id)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1"
                                          >
                                            <CheckCircle className="w-3 h-3" />
                                            <span>Approve</span>
                                          </button>
                                          <button
                                            onClick={() => handleRejectUser(user.id || user._id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1"
                                          >
                                            <X className="w-3 h-3" />
                                            <span>Reject</span>
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleViewUserDetails(user)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1"
                                          >
                                            <Eye className="w-3 h-3" />
                                            <span>View</span>
                                          </button>
                                          <button
                                            onClick={() => openCreditModal(user)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>Add Credits</span>
                                          </button>
                                          {suspensionStatus && suspensionStatus.status === 'suspended' ? (
                                            <button
                                              onClick={() => handleUnsuspendUser(user.id || user._id)}
                                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                                            >
                                              Unsuspend
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => openSuspensionModal(user)}
                                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                                            >
                                              Suspend
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteUser(user.id || user._id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
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

            {activeTab === 'subscriptions' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Details</h3>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900">User Subscription Information</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Renewal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(subscriptionDetails) && subscriptionDetails.map((subscription, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {subscription.name || `${subscription.firstName} ${subscription.lastName}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscription.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                subscription.currentPlan === 'free' 
                                  ? 'bg-gray-100 text-gray-800' 
                                  : subscription.currentPlan === 'daily-12'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {subscription.currentPlan}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                subscription.paymentCompleted 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {subscription.paymentCompleted ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {subscription.currentCredits || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {subscription.nextCreditRenewal 
                                ? new Date(subscription.nextCreditRenewal).toLocaleDateString()
                                : 'N/A'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {subscription.subscriptionId ? subscription.subscriptionId.substring(0, 20) + '...' : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleViewSubscription(subscription)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors duration-200 cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleEditSubscription(subscription)}
                                  className="text-green-600 hover:text-green-900 transition-colors duration-200 cursor-pointer"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {subscription.paymentCompleted && (
                                  <button 
                                    onClick={() => handleCancelSubscription(subscription)}
                                    className="text-red-600 hover:text-red-900 transition-colors duration-200 cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!subscriptionDetails || subscriptionDetails.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        No subscription details found
                      </div>
                    )}
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

        {/* Credit Addition Modal */}
        {creditModal && selectedUserForCredits && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add Credits</h3>
                <button
                  onClick={closeCreditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Email
                  </label>
                  <input
                    type="email"
                    value={selectedUserForCredits.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Credits
                  </label>
                  <input
                    type="text"
                    value={selectedUserForCredits.currentCredits || 0}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits to Add <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={creditForm.credits}
                    onChange={(e) => setCreditForm({ ...creditForm, credits: e.target.value })}
                    placeholder="Enter credits (1-10000)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum: 1, Maximum: 10000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={creditForm.reason}
                    onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                    placeholder="e.g., Partner bonus, Customer support, etc."
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={closeCreditModal}
                    disabled={isAddingCredits}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCredits}
                    disabled={isAddingCredits || !creditForm.credits}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isAddingCredits ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add Credits</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
            </div>
  );
};

export default AdminPanel; 