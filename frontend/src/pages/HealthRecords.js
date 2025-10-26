import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Sparkles, AlertCircle, CheckCircle, Loader, Trash2, X, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import './LabReports.css';

const HealthRecords = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportName, setReportName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [uploadAbortController, setUploadAbortController] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found - please login');
        return;
      }
      
      const response = await fetch('http://localhost:8000/nutrition/lab-reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else if (response.status === 401) {
        showNotification('Session expired - please login again', 'error');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      if (!reportName) {
        setReportName(file.name.replace('.pdf', ''));
      }
    } else {
      showNotification('Please select a PDF file', 'error');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('report_name', reportName);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    setUploadAbortController(abortController);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Please login first', 'error');
        setUploading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/nutrition/lab-reports/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: abortController.signal
      });

      if (response.ok) {
        await fetchReports();
        setSelectedFile(null);
        setReportName('');
        document.getElementById('file-input').value = '';
        showNotification('Lab report uploaded and analyzed!', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification(errorData.detail || 'Failed to upload report', 'error');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        showNotification('Upload cancelled', 'error');
      } else {
        showNotification('Upload error: ' + error.message, 'error');
      }
    } finally {
      setUploading(false);
      setUploadAbortController(null);
    }
  };

  const cancelUpload = () => {
    if (uploadAbortController) {
      uploadAbortController.abort();
      setUploading(false);
      showNotification('Upload cancelled', 'error');
    }
  };

  const deleteReport = async (reportId, reportName) => {
    if (!window.confirm(`Delete "${reportName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/nutrition/lab-reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchReports();
        showNotification('Lab report deleted', 'success');
      } else {
        showNotification('Failed to delete report', 'error');
      }
    } catch (error) {
      showNotification('Delete error: ' + error.message, 'error');
    }
  };

  const viewAnalysis = (reportId) => {
    navigate(`/analytics?report=${reportId}`);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="lab-reports-header">
          <FileText size={32} className="lab-icon" />
          <h1>Health Records</h1>
          <p>AI-powered analysis of your lab results</p>
        </div>

        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`notification notification-${notification.type}`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="upload-card">
            <h2>
              <Upload size={24} />
              Upload Lab Report
            </h2>
            <form onSubmit={handleUpload} className="upload-form">
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-input"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-input-label">
                  <Upload size={20} />
                  {selectedFile ? selectedFile.name : 'Choose PDF file'}
                </label>
              </div>

              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <Input
                    label="Report Name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g., Blood Test - January 2025"
                    required
                  />
                  <Button type="submit" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader size={20} className="spinning" />
                        Uploading & Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Upload & Analyze with AI
                      </>
                    )}
                  </Button>
                  {uploading && (
                    <Button 
                      type="button" 
                      onClick={cancelUpload}
                      style={{ background: '#ef4444' }}
                    >
                      <X size={20} />
                      Cancel Upload
                    </Button>
                  )}
                </motion.div>
              )}
            </form>
            <p className="upload-hint">
              📄 Upload your lab reports in PDF format. Our AI will analyze them and provide insights for personalized nutrition recommendations.
            </p>
          </Card>
        </motion.div>

        {/* Reports List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h2>Your Lab Reports ({reports.length})</h2>
            {reports.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} className="empty-icon" />
                <h3>No Lab Reports Yet</h3>
                <p>Upload your first lab report to get AI-powered health insights</p>
              </div>
            ) : (
              <div className="reports-list">
                {reports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="report-item"
                  >
                    <div className="report-info">
                      <FileText size={24} className="report-icon" />
                      <div className="report-details">
                        <h3>{report.report_name}</h3>
                        <span className="report-date">
                          Uploaded: {new Date(report.uploaded_at || report.created_at).toLocaleDateString()}
                        </span>
                        {report.next_test_date && (
                          <span className="next-test-date">
                            📅 Next Test: {new Date(report.next_test_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="report-status">
                      {report.analysis_status === 'completed' ? (
                        <>
                          <CheckCircle size={20} className="status-icon success" />
                          <Button 
                            variant="secondary"
                            onClick={() => viewAnalysis(report.id)}
                          >
                            <BarChart3 size={18} />
                            View Analysis
                          </Button>
                          <button
                            className="delete-btn"
                            onClick={() => deleteReport(report.id, report.report_name)}
                            title="Delete report"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      ) : report.analysis_status === 'failed' ? (
                        <>
                          <AlertCircle size={20} className="status-icon error" />
                          <span>Analysis Failed</span>
                          <button
                            className="delete-btn"
                            onClick={() => deleteReport(report.id, report.report_name)}
                            title="Delete report"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Loader size={20} className="status-icon spinning" />
                          <span>Analyzing...</span>
                          <button
                            className="delete-btn"
                            onClick={() => deleteReport(report.id, report.report_name)}
                            title="Cancel & delete"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default HealthRecords;
