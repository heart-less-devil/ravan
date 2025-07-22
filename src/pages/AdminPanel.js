import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  RefreshCw
} from 'lucide-react';
import { API_BASE_URL, ADMIN_API_BASE_URL } from '../config';

const AdminPanel = () => {
  const [uploadedData, setUploadedData] = useState([]);
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    // Load data from backend
    fetchBiotechData();
    fetchUsers();
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
        setUsers(result.data.users);
      } else {
        throw new Error(result.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Don't set error for users, just log it
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

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchBiotechData(), fetchUsers()]);
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
                                <button className="text-blue-600 hover:text-blue-900">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="text-green-600 hover:text-green-900">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteRecord(item.id)}
                                  className="text-red-600 hover:text-red-900"
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
                  <div className="text-sm text-gray-500">
                    Total Users: {users.length}
                  </div>
                </div>

                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Registered</h3>
                    <p className="text-gray-600">Users will appear here once they sign up</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.email} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                    Save Settings
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 