import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Calendar,
  User,
  Building,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Bell,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  Star,
  Heart,
  Target,
  Award,
  Rocket,
  Crown
} from 'lucide-react';

const BDTrackerPanel = () => {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
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

  // Load data from backend on component mount
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        setEntries([]);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data.data || []);
      } else if (response.status === 401) {
        console.error('Authentication failed - please log in again');
        setEntries([]);
      } else {
        console.error('Failed to fetch BD Tracker entries');
        setEntries([]);
      }
    } catch (error) {
      console.error('Error fetching BD Tracker entries:', error);
      setEntries([]);
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
    return formData.projectName.trim() !== '' && formData.company.trim() !== '' && formData.contactPerson.trim() !== '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fill in Project Name, Company, and Contact Person fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in to add entries');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(prev => [data.data, ...prev]);
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
          timelines: '',
          reminders: ''
        });
        setShowForm(false);
        
        // Success animation trigger
        setTimeout(() => {
          // You could add a toast notification here
        }, 100);
      } else if (response.status === 401) {
        alert('Authentication failed - please log in again');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding BD Tracker entry:', error);
      alert('Failed to add entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setFormData(entry);
  };

  const handleSaveEdit = async () => {
    if (!validateForm()) {
      alert('Please fill in Project Name, Company, and Contact Person fields');
      return;
    }

    try {
      setIsEditing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(prev => prev.map(entry => 
          entry.id === editingId ? data.data : entry
        ));
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
          timelines: '',
          reminders: ''
        });
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating BD Tracker entry:', error);
      alert('Failed to update entry. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        setIsDeleting(id);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/bd-tracker/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setEntries(prev => prev.filter(entry => entry.id !== id));
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to delete entry');
        }
      } catch (error) {
        console.error('Error deleting BD Tracker entry:', error);
        alert('Failed to delete entry. Please try again.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleDownloadExcel = () => {
    // Create CSV content
    const headers = [
      'Project Name',
      'Company',
      'Program Pitched',
      'Outreach Dates',
      'Contact Function',
      'Contact Person',
      'CDA (Yes or No)',
      'Feedback',
      'Next Steps',
      'Timelines to Remember (if applicable)',
      'Reminders (if any)'
    ];

    const csvContent = [
      headers.join(','),
      ...entries.map(entry => [
        `"${entry.projectName || ''}"`,
        `"${entry.company}"`,
        `"${entry.programPitched}"`,
        `"${entry.outreachDates}"`,
        `"${entry.contactFunction}"`,
        `"${entry.contactPerson}"`,
        `"${entry.cda}"`,
        `"${entry.feedback}"`,
        `"${entry.nextSteps}"`,
        `"${entry.timelines}"`,
        `"${entry.reminders}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BD_Tracker_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.programPitched.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'with-cda' && entry.cda.toLowerCase() === 'yes') return matchesSearch;
    if (filterStatus === 'without-cda' && entry.cda.toLowerCase() === 'no') return matchesSearch;
    if (filterStatus === 'pending' && !entry.feedback) return matchesSearch;
    
    return matchesSearch;
  });

  const columns = [
    { key: 'projectName', label: 'Project Name', icon: FileSpreadsheet },
    { key: 'company', label: 'Company', icon: Building },
    { key: 'programPitched', label: 'Program Pitched', icon: FileSpreadsheet },
    { key: 'outreachDates', label: 'Outreach Dates', icon: Calendar },
    { key: 'contactFunction', label: 'Contact Function', icon: User },
    { key: 'contactPerson', label: 'Contact Person', icon: User },
    { key: 'cda', label: 'CDA (Yes or No)', icon: CheckCircle },
    { key: 'feedback', label: 'Feedback', icon: MessageSquare },
    { key: 'nextSteps', label: 'Next Steps', icon: ArrowRight },
    { key: 'timelines', label: 'Timelines to Remember', icon: Clock },
    { key: 'reminders', label: 'Reminders', icon: Bell }
  ];



  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            </motion.div>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-lg font-semibold text-gray-700"
          >
            Loading BD Tracker...
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 flex justify-center space-x-1"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-blue-600 rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 relative">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"
        animate={{
          background: [
            "linear-gradient(45deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 50%, rgba(236, 72, 153, 0.05) 100%)",
            "linear-gradient(45deg, rgba(236, 72, 153, 0.05) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(147, 51, 234, 0.05) 100%)",
            "linear-gradient(45deg, rgba(147, 51, 234, 0.05) 0%, rgba(236, 72, 153, 0.05) 50%, rgba(59, 130, 246, 0.05) 100%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-8 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <motion.div 
            animate={{ 
              x: [0, 20, 0],
              y: [0, -20, 0],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"
          />
          <motion.div 
            animate={{ 
              x: [0, -15, 0],
              y: [0, 25, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-8 right-8 w-24 h-24 bg-white rounded-full"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute bottom-4 left-1/4 w-16 h-16 bg-white rounded-full"
          />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center space-x-4">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30"
              >
                <FileSpreadsheet className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
                >
                  BD Tracker
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-blue-100 text-sm"
                >
                  Manage your business development pipeline
                </motion.p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
                Add Entry
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-6 py-3 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl hover:bg-green-500/30 transition-all duration-300 font-semibold"
              >
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Download className="w-5 h-5" />
                </motion.div>
                Export
              </motion.button>
            </div>
          </motion.div>
          
          {/* Enhanced Search and Filter */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="relative flex-1">
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(59, 130, 246, 0)",
                    "0 0 0 4px rgba(59, 130, 246, 0.1)",
                    "0 0 0 0 rgba(59, 130, 246, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur opacity-0"
              />
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies, contacts, or programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(147, 51, 234, 0)",
                    "0 0 0 4px rgba(147, 51, 234, 0.1)",
                    "0 0 0 0 rgba(147, 51, 234, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur opacity-0"
              />
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-12 pr-10 py-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 appearance-none"
                >
                  <option value="all">All Entries</option>
                  <option value="with-cda">With CDA</option>
                  <option value="without-cda">Without CDA</option>
                  <option value="pending">Pending Feedback</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Add Entry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 border-b border-gray-200 relative overflow-hidden"
          >
            {/* Animated Background Elements */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-12 translate-x-12"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -15, 15, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full translate-y-10 -translate-x-10"
            />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-3"
                >
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <Plus className="w-6 h-6 text-white" />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  >
                    Add New Entry
                  </motion.h3>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </motion.button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {columns.map((column) => (
              <div key={column.key} className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <column.icon className="w-4 h-4 text-blue-600" />
                  {column.label}
                </label>
                {column.key === 'cda' ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <select
                      value={formData[column.key]}
                      onChange={(e) => handleInputChange(column.key, e.target.value)}
                      className="relative w-full px-4 py-3 pr-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-lg appearance-none"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">✅ Yes</option>
                      <option value="No">❌ No</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <input
                      type="text"
                      value={formData[column.key]}
                      onChange={(e) => handleInputChange(column.key, e.target.value)}
                      className="relative w-full px-4 py-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-lg"
                      placeholder={column.label}
                    />
                  </div>
                )}
              </div>
            ))}
            
            <div className="md:col-span-2 lg:col-span-3 flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-3 px-8 py-4 text-white rounded-xl transition-all duration-300 shadow-lg font-semibold ${
                  isSubmitting 
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    </motion.div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Entry</span>
                  </>
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setShowForm(false)}
                className="px-8 py-4 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-all duration-300 shadow-lg font-semibold"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Enhanced Excel-like Table */}
      <div className="flex-1 overflow-auto bg-white/50 backdrop-blur-sm">
        <div className="p-6">
          {filteredEntries.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-6 flex items-center justify-center"
              >
                <FileSpreadsheet className="w-12 h-12 text-white" />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold text-gray-700 mb-2"
              >
                No entries found
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 mb-6"
              >
                Start by adding your first BD tracker entry
              </motion.p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold"
              >
                Add First Entry
              </motion.button>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <motion.table 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
              >
                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <motion.tr
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    {columns.map((column, index) => (
                      <motion.th
                        key={column.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + index * 0.1 }}
                        className="px-6 py-4 text-left font-semibold text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <column.icon className="w-4 h-4" />
                          {column.label}
                        </div>
                      </motion.th>
                    ))}
                    <motion.th
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.6 }}
                      className="px-6 py-4 text-left font-semibold text-sm"
                    >
                      Actions
                    </motion.th>
                  </motion.tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredEntries.map((entry, index) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ 
                          delay: 1.8 + index * 0.1,
                          type: "spring",
                          stiffness: 100
                        }}
                        whileHover={{ 
                          scale: 1.02,
                          backgroundColor: "rgba(59, 130, 246, 0.05)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                        }}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition-all duration-300 group"
                      >
                        {columns.map((column) => (
                          <motion.td
                            key={column.key}
                            whileHover={{ scale: 1.05 }}
                            className="px-6 py-4 text-sm text-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              {column.key === 'cda' ? (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  entry[column.key]?.toLowerCase() === 'yes' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {entry[column.key] || 'Not specified'}
                                </span>
                              ) : (
                                <span className="truncate max-w-xs">
                                  {entry[column.key] || '-'}
                                </span>
                              )}
                            </div>
                          </motion.td>
                        ))}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(entry)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: -5 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(entry.id)}
                              disabled={isDeleting === entry.id}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isDeleting === entry.id ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                                </motion.div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </motion.table>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 relative overflow-hidden"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-10 translate-x-10"
            />
            <div className="flex items-center gap-4 relative z-10">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center"
              >
                <Activity className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.p 
                  key={entries.length}
                  initial={{ scale: 1.2, color: "#3B82F6" }}
                  animate={{ scale: 1, color: "#111827" }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold"
                >
                  {entries.length}
                </motion.p>
                <p className="text-sm text-gray-600 font-medium">Total Entries</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 relative overflow-hidden"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full -translate-y-10 translate-x-10"
            />
            <div className="flex items-center gap-4 relative z-10">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center"
              >
                <CheckCircle className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.p 
                  key={entries.filter(e => e.cda?.toLowerCase() === 'yes').length}
                  initial={{ scale: 1.2, color: "#10B981" }}
                  animate={{ scale: 1, color: "#111827" }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold"
                >
                  {entries.filter(e => e.cda?.toLowerCase() === 'yes').length}
                </motion.p>
                <p className="text-sm text-gray-600 font-medium">With CDA</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 relative overflow-hidden"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full -translate-y-10 translate-x-10"
            />
            <div className="flex items-center gap-4 relative z-10">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, -15, 15, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center"
              >
                <AlertCircle className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.p 
                  key={entries.filter(e => !e.feedback).length}
                  initial={{ scale: 1.2, color: "#F59E0B" }}
                  animate={{ scale: 1, color: "#111827" }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold"
                >
                  {entries.filter(e => !e.feedback).length}
                </motion.p>
                <p className="text-sm text-gray-600 font-medium">Pending Feedback</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default BDTrackerPanel; 