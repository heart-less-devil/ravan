import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Plus, 
  Eye, 
  Trash2, 
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const PDFManagement = () => {
  const navigate = useNavigate();
  const [pdfs, setPdfs] = useState([]);
  const [newPdf, setNewPdf] = useState({ name: '', description: '', file: null });
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      console.log('🔍 API_BASE_URL:', API_BASE_URL);
      console.log('🔍 Full URL:', `${API_BASE_URL}/api/admin/pdfs`);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/pdfs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 PDF API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📄 PDFs data received:', data);
        setPdfs(data.pdfs || []);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('❌ PDF API Error:', errorText);
        throw new Error(`Failed to fetch PDFs: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    console.log('📤 Upload attempt:', { file: newPdf.file, name: newPdf.name, description: newPdf.description });
    
    if (!newPdf.file || !newPdf.name) {
      console.log('❌ Validation failed:', { hasFile: !!newPdf.file, hasName: !!newPdf.name });
      setError('Please select a PDF file and enter a name');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('name', newPdf.name);
    formData.append('description', newPdf.description);
    formData.append('pdf', newPdf.file);
    
    console.log('📋 FormData prepared:', {
      name: newPdf.name,
      description: newPdf.description,
      file: newPdf.file.name,
      fileSize: newPdf.file.size
    });

    try {
      const token = sessionStorage.getItem('token');
      console.log('🌐 Making API call to:', `${API_BASE_URL}/api/admin/pdfs/upload`);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/pdfs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('📡 API Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        setNewPdf({ name: '', description: '', file: null });
        await fetchPdfs();
        // Refresh BD Insights if available
        if (window.refreshBDInsights) {
          window.refreshBDInsights();
        }
        // Show success message
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('❌ Upload failed:', response.status, errorText);
        throw new Error(`Failed to upload PDF: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setError('Failed to upload PDF: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePdfDelete = async (pdfId) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/pdfs/${pdfId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchPdfs();
        // Refresh BD Insights if available
        if (window.refreshBDInsights) {
          window.refreshBDInsights();
        }
        setError(null);
      } else {
        throw new Error('Failed to delete PDF');
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      setError('Failed to delete PDF: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDFs...</p>
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
                <FileText className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">PDF Management</h1>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {pdfs.length} PDFs • {pdfs.filter(pdf => pdf.isExisting).length} System • {pdfs.filter(pdf => !pdf.isExisting).length} Uploaded
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        {!error && pdfs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <p className="text-green-800">PDFs loaded successfully!</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Upload New PDF
                </h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handlePdfUpload} className="space-y-4">
                  <div>
                    <label htmlFor="pdfName" className="block text-sm font-medium text-gray-700 mb-2">
                      PDF Name *
                    </label>
                    <input
                      type="text"
                      id="pdfName"
                      value={newPdf.name}
                      onChange={(e) => setNewPdf({ ...newPdf, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Company Overview"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="pdfDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="pdfDescription"
                      value={newPdf.description}
                      onChange={(e) => setNewPdf({ ...newPdf, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      rows="3"
                      placeholder="Brief description of the PDF content..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-2">
                      PDF File *
                    </label>
                    <input
                      type="file"
                      id="pdfFile"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        console.log('📁 File selected:', file);
                        setNewPdf({ ...newPdf, file: file });
                      }}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                      required
                    />
                    {newPdf.file && (
                      <p className="mt-2 text-sm text-green-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Selected: {newPdf.file.name}
                      </p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload PDF</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* PDFs List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <span className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    Existing PDFs ({pdfs.length})
                  </span>
                </h2>
              </div>
              
              <div className="p-6">
                {pdfs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No PDFs Available</h3>
                    <p className="text-gray-500">Start by uploading your first PDF resource</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(pdfs) && pdfs.map((pdf) => (
                      <motion.div
                        key={pdf._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg border ${
                          pdf.isExisting 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200'
                        } hover:shadow-md transition-all duration-200`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                pdf.isExisting ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                <FileText className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {pdf.name}
                                </h3>
                                {pdf.isExisting && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    System
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mb-2">{pdf.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-400">
                                <span>Uploaded: {new Date(pdf.uploadedAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{pdf.isExisting ? 'System PDF' : 'Uploaded PDF'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <a
                              href={pdf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View
                            </a>
                            <button
                              onClick={() => handlePdfDelete(pdf._id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors duration-200"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFManagement;
