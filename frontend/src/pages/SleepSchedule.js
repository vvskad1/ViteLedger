import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Clock, Save, Info } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import './SleepSchedule.css';

const SleepSchedule = () => {
  const [schedule, setSchedule] = useState(null);
  const [formData, setFormData] = useState({
    sleep_start: '',
    sleep_end: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/sleep/schedule', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSchedule(data);
          setFormData({
            sleep_start: data.sleep_start,
            sleep_end: data.sleep_end
          });
        }
      }
    } catch (error) {
      console.error('Error fetching sleep schedule:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/sleep/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
        setHasChanges(false);
        showNotification(schedule ? 'Sleep schedule updated!' : 'Sleep schedule saved!', 'success');
      }
    } catch (error) {
      showNotification('Failed to save sleep schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const calculateAwakeHours = () => {
    if (!formData.sleep_start || !formData.sleep_end) return null;
    
    const [sleepHour, sleepMin] = formData.sleep_start.split(':').map(Number);
    const [wakeHour, wakeMin] = formData.sleep_end.split(':').map(Number);
    
    let totalMinutes;
    const sleepMinutes = sleepHour * 60 + sleepMin;
    const wakeMinutes = wakeHour * 60 + wakeMin;
    
    if (wakeMinutes > sleepMinutes) {
      // Same day wake up
      totalMinutes = (24 * 60 - sleepMinutes) + wakeMinutes;
    } else {
      // Next day wake up
      totalMinutes = wakeMinutes + (24 * 60 - sleepMinutes);
    }
    
    const hours = Math.floor(totalMinutes / 60);
    return hours;
  };

  const awakeHours = calculateAwakeHours();

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="sleep-schedule-header">
          <Moon size={32} className="sleep-icon" />
          <h1>Sleep Schedule</h1>
          <p>Set your sleep times for smarter hydration reminders</p>
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
          <Card className="info-card">
            <div className="info-header">
              <Info size={20} />
              <h3>Why set a sleep schedule?</h3>
            </div>
            <p>
              Your sleep schedule helps VitaLedger understand when you're awake so hydration 
              reminders only notify you during active hours. This ensures you stay hydrated 
              without being disturbed during sleep. 💤💧
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <form onSubmit={handleSubmit} className="sleep-form">
              <div className="time-inputs-grid">
                <div className="time-input-card">
                  <div className="time-icon moon-icon">
                    <Moon size={24} />
                  </div>
                  <div className="time-input-content">
                    <Input
                      label="Sleep Time"
                      type="time"
                      value={formData.sleep_start}
                      onChange={(e) => handleChange('sleep_start', e.target.value)}
                      required
                    />
                    <span className="time-hint">When you usually go to bed</span>
                  </div>
                </div>

                <div className="time-arrow">→</div>

                <div className="time-input-card">
                  <div className="time-icon sun-icon">
                    <Sun size={24} />
                  </div>
                  <div className="time-input-content">
                    <Input
                      label="Wake Time"
                      type="time"
                      value={formData.sleep_end}
                      onChange={(e) => handleChange('sleep_end', e.target.value)}
                      required
                    />
                    <span className="time-hint">When you usually wake up</span>
                  </div>
                </div>
              </div>

              {awakeHours !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="awake-hours-display"
                >
                  <Clock size={20} />
                  <div>
                    <strong>Active Hours: {awakeHours} hours</strong>
                    <p>You'll receive hourly hydration reminders during this time</p>
                  </div>
                </motion.div>
              )}

              <div className="form-actions">
                <Button type="submit" disabled={loading || !hasChanges}>
                  <Save size={20} />
                  {loading ? 'Saving...' : (schedule ? 'Update Schedule' : 'Save Schedule')}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>

        {schedule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="current-schedule-card">
              <h3>Current Schedule</h3>
              <div className="schedule-display">
                <div className="schedule-time">
                  <Moon size={20} />
                  <div>
                    <span className="time-label">Sleep</span>
                    <span className="time-value">{schedule.sleep_start}</span>
                  </div>
                </div>
                <div className="schedule-divider"></div>
                <div className="schedule-time">
                  <Sun size={20} />
                  <div>
                    <span className="time-label">Wake</span>
                    <span className="time-value">{schedule.sleep_end}</span>
                  </div>
                </div>
              </div>
              <p className="schedule-hint">
                💧 Hydration reminders are active from {schedule.sleep_end} to {schedule.sleep_start}
              </p>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default SleepSchedule;
