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
  Calendar,
  User,
  Building,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Clock,
  Bell,
  ArrowRight,
  FileText,
  ChevronLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BDTrackerPage = () => {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
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
    projectName: ''
  });

  // Load data from backend on component mount
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/bd-tracker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setEntries(prev => [...prev, result.data]);
        setFormData({
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
      } else {
        alert('Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry');
    }
  };

  const handleEdit = (entry) => {
    setFormData(entry);
    setEditingId(entry.id);
  };

  const handleSaveEdit = async () => {
    try {
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
        setEntries(prev => prev.map(entry => 
          entry.id === editingId ? { ...entry, ...formData } : entry
        ));
        setEditingId(null);
        setFormData({
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
        alert('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Error updating entry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
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
        alert('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    }
  };

  const handleDownloadExcel = () => {
    // Get project name from user
    const projectName = prompt('Enter project name for the Excel file:');
    if (!projectName) return;
    
    // Create CSV content
    const headers = columns.map(col => col.label).join(',');
    const rows = filteredEntries.map(entry => 
      columns.map(col => `"${entry[col.key] || ''}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
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
      entry.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.programPitched.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const columns = [
    { key: 'company', label: 'Company', icon: Building },
    { key: 'programPitched', label: 'Program', icon: FileSpreadsheet },
    { key: 'outreachDates', label: 'Outreach Dates', icon: Calendar },
    { key: 'contactFunction', label: 'Contact Function', icon: User },
    { key: 'contactPerson', label: 'Contact Person', icon: User },
    { key: 'cda', label: 'CDA', icon: CheckCircle },
    { key: 'feedback', label: 'Feedback', icon: MessageSquare },
    { key: 'nextSteps', label: 'Next Steps', icon: ArrowRight },
    { key: 'priority', label: 'Priority', icon: AlertCircle },
    { key: 'followUp', label: 'Follow Up', icon: Clock }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BD Tracker...</p>
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
                  placeholder="Search companies, contacts, or programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Entries</option>
              <option value="with-cda">With CDA</option>
              <option value="without-cda">Without CDA</option>
              <option value="pending">Pending Feedback</option>
              <option value="high-priority">High Priority</option>
            </select>
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
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Project Name:</strong> {formData.projectName || 'Not set'}
                <button 
                  onClick={() => {
                    const projectName = prompt('Enter project name:');
                    if (projectName) {
                      setFormData(prev => ({ ...prev, projectName }));
                    }
                  }}
                  className="ml-2 text-blue-600 underline hover:text-blue-800"
                >
                  {formData.projectName ? 'Change' : 'Set Project Name'}
                </button>
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns.map((column) => (
                <div key={column.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {column.label}
                  </label>
                  {column.key === 'cda' ? (
                    <select
                      value={formData[column.key]}
                      onChange={(e) => handleInputChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : column.key === 'priority' ? (
                    <select
                      value={formData[column.key]}
                      onChange={(e) => handleInputChange(column.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
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
        <div className="bg-white rounded-lg shadow-sm border">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <column.icon className="w-4 h-4 text-gray-600" />
                      {column.label}
                    </div>
                  </th>
                ))}
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50">
                  Actions
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
                    key={entry.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="border border-gray-200 px-4 py-3 text-sm text-gray-900"
                      >
                        {editingId === entry.id ? (
                          column.key === 'cda' ? (
                            <select
                              value={formData[column.key]}
                              onChange={(e) => handleInputChange(column.key, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select...</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : column.key === 'priority' ? (
                            <select
                              value={formData[column.key]}
                              onChange={(e) => handleInputChange(column.key, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select...</option>
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={formData[column.key]}
                              onChange={(e) => handleInputChange(column.key, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            />
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            {column.key === 'cda' && entry[column.key] ? (
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
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-2">
                        {editingId === entry.id ? (
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
                              onClick={() => handleDelete(entry.id)}
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