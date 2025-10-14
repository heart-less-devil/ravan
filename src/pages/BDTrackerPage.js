import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';
import { 
  Plus, 
  Download, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  FileSpreadsheet,
  Building,
  CheckCircle,
  AlertCircle,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const BDTrackerPage = ({ user, userPaymentStatus }) => {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: '',
    company: '',
    programPitched: '',
    outreachDates: '',
    contactFunction: '',
    contactPerson: '',
    cda: '',
    feedback: '',
    nextSteps: '',
    priority: '',
    followUp: ''
  });

  // Load data from backend on component mount
  useEffect(() => {
    fetchEntries();
    fetchColumnHeadings();
  }, []);

  // Fetch column headings from backend
  const fetchColumnHeadings = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker/column-headings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.columnHeadings) {
          setColumnHeadings(prev => ({ ...prev, ...data.columnHeadings }));
          console.log('✅ Column headings loaded:', data.columnHeadings);
        }
      } else {
        console.log('Using default column headings');
      }
    } catch (error) {
      console.log('Using default column headings:', error);
    }
  };

  // Save column headings to backend
  const saveColumnHeadings = async (newHeadings) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker/column-headings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ columnHeadings: newHeadings })
      });
      
      if (response.ok) {
        console.log('✅ Column headings saved successfully');
      } else {
        console.error('Failed to save column headings');
      }
    } catch (error) {
      console.error('Error saving column headings:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data.data || []);
      } else {
        console.error('Failed to fetch BD Tracker entries');
      }
    } catch (error) {
      console.error('Error fetching BD Tracker entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    return formData.company.trim() !== '' && formData.contactPerson.trim() !== '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fill in Company and Contact Person fields');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      console.log('🔍 Submitting form data:', formData);
      console.log('🔍 API URL:', `${API_BASE_URL}/api/bd-tracker`);
      console.log('🔍 Token available:', !!token);
      
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Entry added successfully:', result);
        
        // Update local state immediately with the new entry
        if (result.data) {
          setEntries(prev => {
            const updated = [result.data, ...prev];
            console.log('🔄 Added new entry to local state:', updated.length, 'entries');
            return updated;
          });
        }
        
        setFormData({
          type: '',
          company: '',
          programPitched: '',
          outreachDates: '',
          contactFunction: '',
          contactPerson: '',
          cda: '',
          feedback: '',
          nextSteps: '',
          timelines: '',
          reminders: ''
        });
        setShowForm(false);
        
        // Show success message
        alert('Entry added successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to add entry:', errorData);
        alert(`Failed to add entry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry');
    }
  };

  const handleEdit = (entry) => {
    console.log('Editing entry:', entry);
    console.log('Entry ID:', entry.id);
    console.log('Entry _id:', entry._id);
    
    // Use the correct ID format (either id or _id)
    const entryId = entry.id || entry._id;
    console.log('Using entry ID for editing:', entryId);
    
    setFormData({
      type: entry.type || '',
      company: entry.company || '',
      programPitched: entry.programPitched || '',
      outreachDates: entry.outreachDates || '',
      contactFunction: entry.contactFunction || '',
      contactPerson: entry.contactPerson || '',
      cda: entry.cda || '',
      feedback: entry.feedback || '',
      nextSteps: entry.nextSteps || '',
      priority: entry.priority || '',
      followUp: entry.followUp || '',
      timelines: entry.timelines || '',
      reminders: entry.reminders || ''
    });
    setEditingId(entryId);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      type: '',
      company: '',
      programPitched: '',
      outreachDates: '',
      contactFunction: '',
      contactPerson: '',
      cda: '',
      feedback: '',
      nextSteps: '',
      priority: '',
      followUp: '',
      timelines: '',
      reminders: ''
    });
  };

  const handleSaveEdit = async () => {
    // Validate form before updating
    if (!validateForm()) {
      alert('Please fill in Company and Contact Person fields');
      return;
    }

    console.log('Attempting to update entry with ID:', editingId);
    console.log('Form data to update:', formData);

    try {
      const token = sessionStorage.getItem('token');
      console.log('Token available:', !!token);
      
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Update response status:', response.status);
      console.log('Update response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Update successful:', data);
        
        // Update local state immediately
        setEntries(prev => {
          const updated = prev.map(entry => {
            if (entry.id === editingId || entry._id === editingId) {
              const updatedEntry = { ...entry, ...formData, updatedAt: new Date().toISOString() };
              console.log('🔄 Updated entry in local state:', updatedEntry);
              return updatedEntry;
            }
            return entry;
          });
          console.log('🔄 Local state updated after edit:', updated.length, 'entries');
          return updated;
        });
        
        setEditingId(null);
        setFormData({
          projectName: '',
          company: '',
          programPitched: '',
          outreachDates: '',
          contactFunction: '',
          contactPerson: '',
          cda: '',
          feedback: '',
          nextSteps: '',
          priority: '',
          followUp: '',
          timelines: '',
          reminders: ''
        });
        
        // Show success message
        alert('Entry updated successfully!');
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert(`Failed to update entry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert(`Error updating entry: ${error.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    console.log('Attempting to delete entry with ID:', id);
    console.log('Entry to delete:', entries.find(entry => (entry.id === id || entry._id === id)));

    try {
      const token = sessionStorage.getItem('token');
      console.log('Token available:', !!token);
      
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Delete response status:', response.status);
      console.log('Delete response ok:', response.ok);

      if (response.ok) {
        // Update local state immediately by removing the deleted entry
        setEntries(prev => {
          const updated = prev.filter(entry => (entry.id !== id && entry._id !== id));
          console.log('🔄 Removed entry from local state:', updated.length, 'entries remaining');
          return updated;
        });
        
        console.log('✅ Entry deleted successfully');
        
        // Show success message
        alert('Entry deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert(`Failed to delete entry: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert(`Error deleting entry: ${error.message}`);
    }
  };

  const handleDownloadExcel = () => {
    // Get project name from user
    const projectName = prompt('Enter project name for the Excel file:');
    if (!projectName) return;
    
    // Create CSV content with proper headers (excluding Actions column)
    const headers = columns.map(col => col.label).join(',');
    const rows = filteredEntries.map(entry => {
      const rowData = columns.map(col => {
        const value = entry[col.key] || '';
        // Escape quotes and wrap in quotes for CSV
        return `"${value.toString().replace(/"/g, '""')}"`;
      });
      return rowData.join(',');
    }).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_BD_Tracker_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      (entry.projectName && entry.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.programPitched.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.type && entry.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.priority && entry.priority.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.cda && entry.cda.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.feedback && entry.feedback.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Debug logging
    console.log('Filtering entry:', {
      entry: entry.company,
      cda: entry.cda,
      feedback: entry.feedback,
      filterStatus: filterStatus,
      matchesSearch: matchesSearch
    });
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'with-cda' && entry.cda && entry.cda.toLowerCase() === 'yes') return matchesSearch;
    if (filterStatus === 'without-cda' && entry.cda && entry.cda.toLowerCase() === 'no') return matchesSearch;
    if (filterStatus === 'pending' && (!entry.feedback || entry.feedback.trim() === '')) return matchesSearch;
    if (filterStatus === 'high-priority' && entry.priority && entry.priority.toLowerCase() === 'high') return matchesSearch;
    
    return false; // Don't show entries that don't match any filter
  });

  const [columnHeadings, setColumnHeadings] = useState({
    type: 'Type',
    programPitched: 'Program',
    company: 'Target Co.',
    priority: 'Priority',
    contactPerson: 'Contact Person & Function',
    cda: 'CDA',
    outreachDates: 'Outreach Context & Dates',
    feedback: 'Feedback',
    actions: 'Actions'
  });

  const [editingColumn, setEditingColumn] = useState(null);

  const handleColumnHeadingEdit = (columnKey, newLabel) => {
    const newHeadings = {
      ...columnHeadings,
      [columnKey]: newLabel
    };
    
    setColumnHeadings(newHeadings);
    setEditingColumn(null);
    
    // Save to backend
    saveColumnHeadings(newHeadings);
  };

  const columns = [
    { key: 'type', label: columnHeadings.type, editable: true },
    { key: 'programPitched', label: columnHeadings.programPitched, editable: true },
    { key: 'company', label: columnHeadings.company, editable: true },
    { key: 'priority', label: columnHeadings.priority, editable: true },
    { key: 'contactPerson', label: columnHeadings.contactPerson, editable: true },
    { key: 'cda', label: columnHeadings.cda, editable: true },
    { key: 'outreachDates', label: columnHeadings.outreachDates, editable: true },
    { key: 'feedback', label: columnHeadings.feedback, editable: true }
  ];

  if (loading) {
    return (
      <LoadingSpinner
        size="xl"
        message="INITIALIZING BD TRACKER..."
        subMessage="Accessing business development neural networks"
        fullScreen={true}
        color="cyber"
      />
    );
  }

  // Check if user has paid access or is universalx0242@gmail.com
  console.log('🔍 BD Tracker Access Check:', {
    userEmail: user?.email,
    userPaymentStatus,
    hasPaid: userPaymentStatus?.hasPaid,
    currentPlan: userPaymentStatus?.currentPlan,
    userPaymentCompleted: user?.paymentCompleted,
    userCurrentPlan: user?.currentPlan
  });
  
  // Permanent access list for specific users
  const permanentAccessEmails = [
    'gauravvij1980@gmail.com',
    'universalx0242@gmail.com'
  ];
  
  // Check for permanent access first
  const hasPermanentAccess = permanentAccessEmails.includes(user?.email);
  
  // Check for paid plan access
  const hasPaidAccess = userPaymentStatus?.hasPaid || 
                        user?.paymentCompleted ||
                        (userPaymentStatus?.currentPlan && userPaymentStatus?.currentPlan !== 'free') ||
                        (user?.currentPlan && user?.currentPlan !== 'free');
  
  const hasAccess = hasPermanentAccess || hasPaidAccess;
  
  console.log('🔍 BD Tracker Access Result:', { 
    hasAccess,
    hasPermanentAccess,
    hasPaidAccess,
    userEmail: user?.email,
    checks: {
      userPaymentStatusHasPaid: userPaymentStatus?.hasPaid,
      userPaymentCompleted: user?.paymentCompleted,
      userPaymentStatusPlan: userPaymentStatus?.currentPlan,
      userCurrentPlan: user?.currentPlan
    }
  });

  // If no access, show upgrade content
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Paid Members Access Only</h3>
            <p className="text-gray-600 mb-6">
              BD Tracker is exclusively available to paid members. Upgrade your plan to access our premium business development tracking tools.
            </p>
            <div className="space-y-3">
              <Link
                to="/dashboard"
                className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Go Back
              </Link>
              <Link
                to="/dashboard/pricing"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">BD Tracker</h1>
                  <p className="text-sm text-gray-500">Business Development Outreach Tracker</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Entry</span>
              </button>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search companies, contacts, programs, type, priority, CDA, or feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
              >
                <option value="all">All Entries</option>
                <option value="with-cda">With CDA</option>
                <option value="without-cda">Without CDA</option>
                <option value="pending">Pending Feedback</option>
                <option value="high-priority">High Priority</option>
              </select>
            </div>
          </div>
          
          {/* Filter Status Indicator */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>
                {filterStatus === 'all' && 'Showing all entries'}
                {filterStatus === 'with-cda' && 'Showing entries with CDA'}
                {filterStatus === 'without-cda' && 'Showing entries without CDA'}
                {filterStatus === 'pending' && 'Showing entries pending feedback'}
                {filterStatus === 'high-priority' && 'Showing high priority entries'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Results: {filteredEntries.length} of {entries.length} entries</span>
            </div>
          </div>
        </div>

        {/* Add Entry Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-sm border p-6 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Entry</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.map((column) => (
                <div key={column.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column.label}
                  </label>
                  {column.key === 'type' ? (
                    <div className="relative">
                      <select
                        value={formData[column.key]}
                        onChange={(e) => handleInputChange(column.key, e.target.value)}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                      >
                        <option value="">Select Type</option>
                        <option value="Inbound / In-Lic.">Inbound / In-Lic.</option>
                        <option value="Outbound / Out-Lic.">Outbound / Out-Lic.</option>
                      </select>
                    </div>
                  ) : column.key === 'cda' ? (
                    <div className="relative">
                      <select
                        value={formData[column.key]}
                        onChange={(e) => handleInputChange(column.key, e.target.value)}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  ) : column.key === 'priority' ? (
                    <div className="relative">
                      <select
                        value={formData[column.key]}
                        onChange={(e) => handleInputChange(column.key, e.target.value)}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                      >
                        <option value="">Select</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData[column.key]}
                      onChange={(e) => handleInputChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={column.label}
                    />
                  )}
                </div>
              ))}
              
              <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Excel-like Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
            {/* Header */}
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 ${
                      column.key === 'contactPerson' ? 'min-w-[200px]' :
                      column.key === 'cda' ? 'w-20' : 
                      column.key === 'priority' ? 'w-24' : 
                      column.key === 'type' ? 'w-32' : 'min-w-[150px]'
                    }`}
                  >
                    {editingColumn === column.key ? (
                      <input
                        type="text"
                        value={columnHeadings[column.key]}
                        onChange={(e) => setColumnHeadings(prev => ({ ...prev, [column.key]: e.target.value }))}
                        onBlur={() => {
                          setEditingColumn(null);
                          saveColumnHeadings({ ...columnHeadings, [column.key]: columnHeadings[column.key] });
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setEditingColumn(null);
                            saveColumnHeadings({ ...columnHeadings, [column.key]: columnHeadings[column.key] });
                          }
                        }}
                        className="w-full bg-transparent border-none outline-none text-sm font-semibold text-gray-900"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className={`px-2 py-1 rounded border border-transparent transition-all duration-200 group ${
                          ['type', 'priority', 'cda'].includes(column.key) 
                            ? 'cursor-default' 
                            : 'cursor-pointer hover:bg-blue-50 hover:border-blue-200'
                        }`}
                        onClick={() => !['type', 'priority', 'cda'].includes(column.key) && setEditingColumn(column.key)}
                        title={['type', 'priority', 'cda'].includes(column.key) ? "This column heading cannot be edited" : "Click to edit column heading"}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">{column.label}</span>
                          {!['type', 'priority', 'cda'].includes(column.key) && (
                            <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          )}
                        </div>
                      </div>
                    )}
                  </th>
                ))}
                <th className="border border-gray-200 px-2 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 w-24">
                  <div className="px-2 py-1">
                    <span className="text-sm font-semibold text-gray-900">{columnHeadings.actions}</span>
                  </div>
                </th>
              </tr>
            </thead>
            
            {/* Body */}
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                    {entries.length === 0 ? 'No entries yet. Add your first BD entry!' : 'No entries match your search/filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => (
                  <tr
                    key={entry.id || entry._id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`border border-gray-200 px-4 py-3 text-sm text-gray-900 ${
                          column.key === 'type' ? 'min-w-[180px]' :
                          column.key === 'contactPerson' ? 'min-w-[200px]' :
                          column.key === 'programPitched' ? 'min-w-[120px]' :
                          column.key === 'outreachDates' ? 'min-w-[140px]' :
                          column.key === 'cda' ? 'w-24' : 
                          column.key === 'priority' ? 'w-28' : 'min-w-[120px]'
                        }`}
                      >
                        {editingId === (entry.id || entry._id) ? (
                          column.key === 'type' ? (
                            <div className="relative">
                              <select
                                value={formData[column.key] || ''}
                                onChange={(e) => handleInputChange(column.key, e.target.value)}
                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium min-w-[160px]"
                              >
                                <option value="">Select Type</option>
                                <option value="Inbound / In-Lic.">Inbound / In-Lic.</option>
                                <option value="Outbound / Out-Lic.">Outbound / Out-Lic.</option>
                              </select>
                            </div>
                          ) : column.key === 'cda' ? (
                            <div className="relative">
                              <select
                                value={formData[column.key] || ''}
                                onChange={(e) => handleInputChange(column.key, e.target.value)}
                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium min-w-[100px]"
                              >
                                <option value="">Select</option>
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                              </select>
                            </div>
                          ) : column.key === 'priority' ? (
                            <div className="relative">
                              <select
                                value={formData[column.key] || ''}
                                onChange={(e) => handleInputChange(column.key, e.target.value)}
                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium min-w-[120px]"
                              >
                                <option value="">Select</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                              </select>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={formData[column.key] || ''}
                              onChange={(e) => handleInputChange(column.key, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            {column.key === 'type' && entry[column.key] ? (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {entry[column.key]}
                              </span>
                            ) : column.key === 'cda' && entry[column.key] ? (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                entry[column.key].toLowerCase() === 'yes' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {entry[column.key]}
                              </span>
                            ) : column.key === 'priority' && entry[column.key] ? (
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                entry[column.key].toLowerCase() === 'high' 
                                  ? 'bg-red-100 text-red-800'
                                  : entry[column.key].toLowerCase() === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {entry[column.key]}
                              </span>
                            ) : entry[column.key] ? (
                              <span>{entry[column.key]}</span>
                            ) : (
                              <span className="text-gray-400 italic">-</span>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    
                    {/* Actions */}
                    <td className="border border-gray-200 px-2 py-2">
                      <div className="flex items-center gap-1">
                        {editingId === (entry.id || entry._id) ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:text-green-700"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-gray-600 hover:text-gray-700"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1 text-blue-600 hover:text-blue-700"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id || entry._id)}
                              className="p-1 text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
            </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>Total Entries: {entries.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>With CDA: {entries.filter(e => e.cda?.toLowerCase() === 'yes').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>High Priority: {entries.filter(e => e.priority?.toLowerCase() === 'high').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BDTrackerPage; 
