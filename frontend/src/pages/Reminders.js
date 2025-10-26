import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, Edit2, Clock, Calendar, Pill, Coffee, Droplet, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import './Reminders.css';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sleepSchedule, setSleepSchedule] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    reminder_type: 'medication',
    time: '',
    days: 'mon,tue,wed,thu,fri,sat,sun',
    enabled: true,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const reminderTypes = [
    { value: 'medication', label: 'Medication', icon: <Pill size={20} />, color: '#ec4899' },
    { value: 'meal', label: 'Meal', icon: <Coffee size={20} />, color: '#f59e0b' },
    { value: 'hydration', label: 'Hydration', icon: <Droplet size={20} />, color: '#3b82f6' },
    { value: 'appointment', label: 'Appointment', icon: <Calendar size={20} />, color: '#8b5cf6' },
    { value: 'other', label: 'Other', icon: <Bell size={20} />, color: '#14b8a6' }
  ];

  useEffect(() => {
    fetchReminders();
    fetchSleepSchedule();
  }, []);

  const fetchSleepSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/sleep/schedule', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSleepSchedule(data);
      }
    } catch (error) {
      console.error('Error fetching sleep schedule:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/reminders/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `http://localhost:8000/reminders/${editingId}`
        : 'http://localhost:8000/reminders/';
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchReminders();
        resetForm();
        showNotification(editingId ? 'Reminder updated!' : 'Reminder created!', 'success');
      }
    } catch (error) {
      showNotification('Failed to save reminder', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reminder) => {
    setFormData({
      title: reminder.title,
      reminder_type: reminder.reminder_type,
      time: reminder.time,
      days: reminder.days || 'mon,tue,wed,thu,fri,sat,sun',
      enabled: reminder.enabled,
      description: reminder.description || ''
    });
    setEditingId(reminder.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/reminders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchReminders();
        showNotification('Reminder deleted', 'success');
      }
    } catch (error) {
      showNotification('Failed to delete reminder', 'error');
    }
  };

  const handleToggle = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/reminders/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchReminders();
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      reminder_type: 'medication',
      time: '',
      days: 'mon,tue,wed,thu,fri,sat,sun',
      enabled: true,
      description: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getTypeInfo = (type) => {
    return reminderTypes.find(t => t.value === type) || reminderTypes[0];
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="reminders-header">
          <Bell size={32} className="reminders-icon" />
          <h1>Reminders & Scheduler</h1>
          <p>Never miss a dose, meal, or appointment</p>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="card-header">
              <h2>Your Reminders ({reminders.length})</h2>
              <Button 
                onClick={() => setShowForm(!showForm)}
                variant="secondary"
              >
                <Plus size={20} />
                {showForm ? 'Cancel' : 'Add Reminder'}
              </Button>
            </div>

            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="reminder-form"
              >
                <Input
                  label="Reminder Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Take morning medication"
                  required
                />

                <div className="form-row">
                  <div className="form-field">
                    <label>Type</label>
                    <div className="type-selector">
                      {reminderTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          className={`type-btn ${formData.reminder_type === type.value ? 'active' : ''}`}
                          style={{ '--type-color': type.color }}
                          onClick={() => setFormData({ ...formData, reminder_type: type.value })}
                        >
                          {type.icon}
                          <span>{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <Input
                    label="Time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>

                {formData.reminder_type === 'hydration' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="sleep-schedule-section"
                  >
                    <h3 className="section-title">
                      <Clock size={20} />
                      Sleep Schedule Integration
                    </h3>
                    {sleepSchedule ? (
                      <div className="sleep-schedule-info">
                        <div className="sleep-info-row">
                          <span className="sleep-label">💤 Sleep:</span>
                          <span className="sleep-value">{sleepSchedule.sleep_start}</span>
                        </div>
                        <div className="sleep-info-row">
                          <span className="sleep-label">☀️ Wake:</span>
                          <span className="sleep-value">{sleepSchedule.sleep_end}</span>
                        </div>
                        <p className="sleep-schedule-hint">
                          💧 Hourly hydration reminders will be active from {sleepSchedule.sleep_end} to {sleepSchedule.sleep_start}
                        </p>
                      </div>
                    ) : (
                      <div className="no-sleep-schedule">
                        <p>No sleep schedule set yet.</p>
                        <a href="/sleep" className="setup-link">Set up your sleep schedule →</a>
                      </div>
                    )}
                  </motion.div>
                )}

                <Input
                  label="Description (Optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes..."
                />

                <div className="form-actions">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (editingId ? 'Update Reminder' : 'Create Reminder')}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="secondary" onClick={resetForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </motion.form>
            )}
          </Card>
        </motion.div>

        <div className="reminders-grid">
          {reminders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="empty-state">
                <Bell size={48} className="empty-icon" />
                <h3>No Reminders Yet</h3>
                <p>Create your first reminder to stay on track</p>
              </Card>
            </motion.div>
          ) : (
            reminders.map((reminder, index) => {
              const typeInfo = getTypeInfo(reminder.reminder_type);
              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 2) }}
                >
                  <Card className={`reminder-card ${!reminder.enabled ? 'disabled' : ''}`}>
                    <div className="reminder-header-row">
                      <div className="reminder-type" style={{ color: typeInfo.color }}>
                        {typeInfo.icon}
                      </div>
                      <div className="reminder-actions">
                        <button 
                          className={`toggle-btn ${reminder.enabled ? 'enabled' : 'disabled'}`}
                          onClick={() => handleToggle(reminder.id)}
                          title={reminder.enabled ? 'Disable' : 'Enable'}
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(reminder)}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(reminder.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <h3>{reminder.title}</h3>
                    
                    <div className="reminder-details">
                      <div className="detail-item">
                        <Clock size={16} />
                        <span>{reminder.time}</span>
                      </div>
                      <div className="detail-item">
                        <span className="type-badge" style={{ borderColor: typeInfo.color, color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>

                    {reminder.reminder_type === 'hydration' && sleepSchedule && (
                      <div className="sleep-schedule-display">
                        💤 Active from {sleepSchedule.sleep_end} to {sleepSchedule.sleep_start}
                      </div>
                    )}

                    {reminder.description && (
                      <p className="reminder-description">{reminder.description}</p>
                    )}
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </Layout>
  );
};

export default Reminders;
