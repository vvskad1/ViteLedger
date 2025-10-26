import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Trash2, CheckCircle, Clock, MapPin, User as UserIcon } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import './Appointments.css';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    appointment_type: 'lab_test',
    appointment_datetime: '',
    location: '',
    doctor_name: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const appointmentTypes = [
    { value: 'lab_test', label: 'Lab Test', icon: '🧪', color: '#3b82f6' },
    { value: 'doctor_visit', label: 'Doctor Visit', icon: '👨‍⚕️', color: '#10b981' },
    { value: 'checkup', label: 'Health Checkup', icon: '🏥', color: '#f59e0b' },
    { value: 'scan', label: 'Scan/Imaging', icon: '📸', color: '#8b5cf6' },
    { value: 'specialist', label: 'Specialist', icon: '🩺', color: '#ec4899' },
    { value: 'other', label: 'Other', icon: '📋', color: '#64748b' }
  ];

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/appointments/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchAppointments();
        resetForm();
        showNotification('Appointment created successfully!', 'success');
      }
    } catch (error) {
      showNotification('Failed to create appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchAppointments();
        showNotification('Appointment deleted', 'success');
      }
    } catch (error) {
      showNotification('Failed to delete appointment', 'error');
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/appointments/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchAppointments();
        showNotification('Appointment marked as complete', 'success');
      }
    } catch (error) {
      showNotification('Failed to update appointment', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      appointment_type: 'lab_test',
      appointment_datetime: '',
      location: '',
      doctor_name: '',
      notes: ''
    });
    setShowForm(false);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getAppointmentTypeInfo = (type) => {
    return appointmentTypes.find(t => t.value === type) || appointmentTypes[0];
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPastAppointment = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const upcomingAppointments = appointments.filter(apt => !apt.is_completed && !isPastAppointment(apt.appointment_datetime));
  const pastAppointments = appointments.filter(apt => apt.is_completed || isPastAppointment(apt.appointment_datetime));

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="appointments-header">
          <Calendar size={32} className="appointments-icon" />
          <h1>Medical Appointments</h1>
          <p>Manage your healthcare schedule</p>
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

        {/* Appointment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="card-header">
              <h2>Schedule Appointment</h2>
              <Button 
                onClick={() => setShowForm(!showForm)}
                variant="secondary"
              >
                <Plus size={20} />
                {showForm ? 'Cancel' : 'New Appointment'}
              </Button>
            </div>

            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="appointment-form"
              >
                <Input
                  label="Appointment Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Annual Blood Test"
                  required
                />

                <div className="form-field">
                  <label>Appointment Type</label>
                  <div className="type-selector">
                    {appointmentTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        className={`type-btn ${formData.appointment_type === type.value ? 'active' : ''}`}
                        style={{ '--type-color': type.color }}
                        onClick={() => setFormData({ ...formData, appointment_type: type.value })}
                      >
                        <span className="type-icon">{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Date & Time"
                  type="datetime-local"
                  value={formData.appointment_datetime}
                  onChange={(e) => setFormData({ ...formData, appointment_datetime: e.target.value })}
                  required
                />

                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Hospital/Clinic name"
                />

                <Input
                  label="Doctor/Professional Name"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                  placeholder="Dr. Name (optional)"
                />

                <Input
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special instructions or reminders..."
                />

                <div className="form-actions">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Scheduling...' : 'Schedule Appointment'}
                  </Button>
                </div>
              </motion.form>
            )}
          </Card>
        </motion.div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h2>Upcoming Appointments ({upcomingAppointments.length})</h2>
              <div className="appointments-list">
                {upcomingAppointments.map((appointment) => {
                  const typeInfo = getAppointmentTypeInfo(appointment.appointment_type);
                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="appointment-card upcoming"
                    >
                      <div className="appointment-header">
                        <div className="appointment-type-badge" style={{ background: typeInfo.color }}>
                          <span>{typeInfo.icon}</span>
                          <span>{typeInfo.label}</span>
                        </div>
                        <div className="appointment-actions">
                          <button
                            className="complete-btn"
                            onClick={() => handleMarkComplete(appointment.id)}
                            title="Mark as complete"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(appointment.id)}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <h3>{appointment.title}</h3>
                      
                      <div className="appointment-details">
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{formatDateTime(appointment.appointment_datetime)}</span>
                        </div>
                        {appointment.location && (
                          <div className="detail-item">
                            <MapPin size={16} />
                            <span>{appointment.location}</span>
                          </div>
                        )}
                        {appointment.doctor_name && (
                          <div className="detail-item">
                            <UserIcon size={16} />
                            <span>{appointment.doctor_name}</span>
                          </div>
                        )}
                      </div>

                      {appointment.notes && (
                        <p className="appointment-notes">{appointment.notes}</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <h2>Past Appointments ({pastAppointments.length})</h2>
              <div className="appointments-list">
                {pastAppointments.map((appointment) => {
                  const typeInfo = getAppointmentTypeInfo(appointment.appointment_type);
                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="appointment-card past"
                    >
                      <div className="appointment-header">
                        <div className="appointment-type-badge" style={{ background: typeInfo.color, opacity: 0.6 }}>
                          <span>{typeInfo.icon}</span>
                          <span>{typeInfo.label}</span>
                        </div>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(appointment.id)}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <h3>{appointment.title}</h3>
                      
                      <div className="appointment-details">
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{formatDateTime(appointment.appointment_datetime)}</span>
                        </div>
                        {appointment.location && (
                          <div className="detail-item">
                            <MapPin size={16} />
                            <span>{appointment.location}</span>
                          </div>
                        )}
                      </div>

                      {appointment.is_completed && (
                        <div className="completed-badge">
                          <CheckCircle size={16} />
                          <span>Completed</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {appointments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="empty-state">
              <Calendar size={48} className="empty-icon" />
              <h3>No Appointments Scheduled</h3>
              <p>Create your first appointment to track your healthcare schedule</p>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Appointments;
