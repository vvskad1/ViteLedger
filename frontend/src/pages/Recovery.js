import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Activity, Thermometer, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import './Recovery.css';

const Recovery = () => {
  const [status, setStatus] = useState({
    is_active: false,
    reason: '',
    temperature: '',
    has_fracture: false,
    fracture_details: '',
    recent_surgery: false,
    surgery_details: '',
    injury_type: '',
    recovery_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/status/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleStatusUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/status/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(status)
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        showNotification(
          status.is_active ? 'Recovery mode activated!' : 'Status updated',
          'success'
        );
      }
    } catch (error) {
      showNotification('Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateRecovery = async () => {
    const updatedStatus = { ...status, is_active: true };
    setStatus(updatedStatus);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/status/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedStatus)
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        showNotification('🚨 Recovery mode activated! Emergency contacts notified.', 'warning');
      }
    } catch (error) {
      showNotification('Failed to activate recovery mode', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateRecovery = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/status/recovery/deactivate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setStatus({ ...status, is_active: false });
        showNotification('Recovery mode deactivated', 'success');
      }
    } catch (error) {
      showNotification('Failed to deactivate recovery mode', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="recovery-header">
          <Activity size={32} className="recovery-icon" />
          <h1>Recovery Mode</h1>
          <p>Manage your health status and emergency notifications</p>
        </div>

        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`notification notification-${notification.type}`}
          >
            {notification.message}
          </motion.div>
        )}

        <div className="recovery-grid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="status-card">
              <div className="status-header">
                <div className={`status-indicator ${status.is_active ? 'active' : 'inactive'}`}>
                  {status.is_active ? (
                    <AlertCircle size={24} />
                  ) : (
                    <CheckCircle size={24} />
                  )}
                </div>
                <div>
                  <h2>Current Status</h2>
                  <p className={status.is_active ? 'status-active' : 'status-inactive'}>
                    {status.is_active ? 'Recovery Mode Active' : 'Normal'}
                  </p>
                </div>
              </div>

              {status.is_active && (
                <div className="status-details">
                  <div className="status-info">
                    <strong>Reason:</strong> {status.reason || 'Not specified'}
                  </div>
                  <div className="status-info">
                    <strong>Temperature:</strong> {status.temperature || 'Not recorded'}
                  </div>
                  {status.has_fracture && (
                    <div className="status-info">
                      <strong>Fracture:</strong> {status.fracture_details || 'Yes'}
                    </div>
                  )}
                  {status.recent_surgery && (
                    <div className="status-info">
                      <strong>Surgery:</strong> {status.surgery_details || 'Yes'}
                    </div>
                  )}
                  {status.injury_type && (
                    <div className="status-info">
                      <strong>Injury Type:</strong> {status.injury_type}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h2>Update Status</h2>
              <p className="card-subtitle">Log your current health condition</p>

              <div className="form-section">
                <Input
                  label="Reason for Recovery"
                  value={status.reason || ''}
                  onChange={(e) => setStatus({ ...status, reason: e.target.value })}
                  placeholder="e.g., Flu, Fever, Surgery recovery"
                />

                <div className="temperature-input">
                  <Thermometer size={20} className="temp-icon" />
                  <Input
                    label="Temperature (°F)"
                    type="text"
                    value={status.temperature || ''}
                    onChange={(e) => setStatus({ ...status, temperature: e.target.value })}
                    placeholder="98.6"
                  />
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={status.has_fracture}
                      onChange={(e) => setStatus({ ...status, has_fracture: e.target.checked })}
                    />
                    <span>I have a fracture</span>
                  </label>
                </div>

                {status.has_fracture && (
                  <Input
                    label="Fracture Details"
                    value={status.fracture_details || ''}
                    onChange={(e) => setStatus({ ...status, fracture_details: e.target.value })}
                    placeholder="e.g., Left arm fracture, healing for 4 weeks"
                  />
                )}

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={status.recent_surgery}
                      onChange={(e) => setStatus({ ...status, recent_surgery: e.target.checked })}
                    />
                    <span>I had recent surgery</span>
                  </label>
                </div>

                {status.recent_surgery && (
                  <Input
                    label="Surgery Details"
                    value={status.surgery_details || ''}
                    onChange={(e) => setStatus({ ...status, surgery_details: e.target.value })}
                    placeholder="e.g., Appendectomy on Oct 1, no heavy lifting for 6 weeks"
                  />
                )}

                <Input
                  label="Injury Type (if any)"
                  value={status.injury_type || ''}
                  onChange={(e) => setStatus({ ...status, injury_type: e.target.value })}
                  placeholder="e.g., Sprain, Strain, Contusion"
                />

                <div className="textarea-group">
                  <label>Recovery Notes</label>
                  <textarea
                    value={status.recovery_notes || ''}
                    onChange={(e) => setStatus({ ...status, recovery_notes: e.target.value })}
                    placeholder="Any doctor's instructions or restrictions..."
                    rows="3"
                  />
                </div>

                <div className="button-group">
                  {!status.is_active ? (
                    <Button onClick={handleActivateRecovery} disabled={loading}>
                      {loading ? 'Activating...' : '🚨 Activate Recovery Mode'}
                    </Button>
                  ) : (
                    <Button onClick={handleDeactivateRecovery} disabled={loading} variant="secondary">
                      {loading ? 'Deactivating...' : 'Deactivate Recovery Mode'}
                    </Button>
                  )}
                  
                  <Button onClick={handleStatusUpdate} disabled={loading} variant="secondary">
                    {loading ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="info-card">
            <h3>💡 How Recovery Mode Works</h3>
            <ul className="info-list">
              <li>When activated, your emergency contacts will be notified</li>
              <li>Your caretakers can access your health status</li>
              <li>Medical history is shared with authorized contacts</li>
              <li>Deactivate when you've recovered</li>
            </ul>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Recovery;
