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
  ArrowRight
} from 'lucide-react';

const BDTracker = () => {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
        const data = await response.json();
        setEntries(prev => [data.data, ...prev]);
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
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding BD Tracker entry:', error);
      alert('Failed to add entry. Please try again.');
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setFormData(entry);
  };

  const handleSaveEdit = async () => {
    if (!validateForm()) {
      alert('Please fill in Company and Contact Person fields');
      return;
    }

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
        const data = await response.json();
        setEntries(prev => prev.map(entry => 
          entry.id === editingId ? data.data : entry
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
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating BD Tracker entry:', error);
      alert('Failed to update entry. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
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
          const errorData = await response.json();
          alert(errorData.message || 'Failed to delete entry');
        }
      } catch (error) {
        console.error('Error deleting BD Tracker entry:', error);
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  const handleDownloadExcel = () => {
    // Create CSV content
    const headers = [
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
    const matchesSearch = entry.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.programPitched.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'with-cda' && entry.cda.toLowerCase() === 'yes') return matchesSearch;
    if (filterStatus === 'without-cda' && entry.cda.toLowerCase() === 'no') return matchesSearch;
    if (filterStatus === 'pending' && !entry.feedback) return matchesSearch;
    
    return matchesSearch;
  });

  const columns = [
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            BD Tracker
          </h2>
          <p className="text-gray-600 mt-1">Track your business development outreach and partnerships</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
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
        </select>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200"
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 bg-white">
          {/* Header */}
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <column.icon className="w-4 h-4 text-gray-600" />
                    {column.label}
                  </div>
                </th>
              ))}
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-100">
                Actions
              </th>
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
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
                      className="border border-gray-300 px-4 py-3 text-sm text-gray-900"
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
                          {entry[column.key] ? (
                            <span>{entry[column.key]}</span>
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                          {column.key === 'cda' && entry[column.key] && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              entry[column.key].toLowerCase() === 'yes' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {entry[column.key]}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  
                  {/* Actions */}
                  <td className="border border-gray-300 px-4 py-3">
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
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4" />
          <span>Total Entries: {entries.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>With CDA: {entries.filter(e => e.cda?.toLowerCase() === 'yes').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span>Pending Feedback: {entries.filter(e => !e.feedback).length}</span>
        </div>
      </div>
    </div>
  );
};

export default BDTracker; 