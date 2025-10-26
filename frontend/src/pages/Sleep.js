import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, TrendingUp, Clock, Star, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import './Sleep.css';

const Sleep = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    average_duration: 0,
    total_logs: 0,
    suggestion: '',
    quality_distribution: {}
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [sleepStartTime, setSleepStartTime] = useState(null);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [sleepQuality, setSleepQuality] = useState('good');
  const [sleepNotes, setSleepNotes] = useState('');

  useEffect(() => {
    fetchStats();
    fetchLogs();
    checkSleepStatus();
  }, []);

  const checkSleepStatus = () => {
    const savedSleepStart = localStorage.getItem('sleepStartTime');
    if (savedSleepStart) {
      setIsSleeping(true);
      setSleepStartTime(new Date(savedSleepStart));
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/sleep/stats?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/sleep/logs?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const createSleepLog = async () => {
    if (!sleepStartTime) {
      alert('No sleep session found');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const wakeTime = new Date();
      
      const response = await fetch('http://localhost:8000/sleep/log', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bed_time: sleepStartTime.toISOString(),
          wake_time: wakeTime.toISOString(),
          quality: sleepQuality,
          notes: sleepNotes
        })
      });

      if (response.ok) {
        setShowQualityModal(false);
        setSleepQuality('good');
        setSleepNotes('');
        setIsSleeping(false);
        setSleepStartTime(null);
        localStorage.removeItem('sleepStartTime');
        fetchStats();
        fetchLogs();
      }
    } catch (error) {
      console.error('Error creating sleep log:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSleep = () => {
    const now = new Date();
    setSleepStartTime(now);
    setIsSleeping(true);
    localStorage.setItem('sleepStartTime', now.toISOString());
    alert('💤 Sleep tracking started! Good night!');
  };

  const wakeUp = () => {
    setShowQualityModal(true);
  };

  const deleteSleepLog = async (logId) => {
    if (!window.confirm('Delete this sleep log?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/sleep/log/${logId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchStats();
        fetchLogs();
      }
    } catch (error) {
      console.error('Error deleting sleep log:', error);
    }
  };

  const getSleepQualityInfo = () => {
    const avg = stats.average_duration;
    if (avg >= 7 && avg <= 9) return { text: 'Optimal', color: '#10b981', emoji: '😴' };
    if (avg >= 6 && avg < 7) return { text: 'Fair', color: '#f59e0b', emoji: '😪' };
    if (avg > 9) return { text: 'Too Much', color: '#3b82f6', emoji: '😌' };
    return { text: 'Poor', color: '#ef4444', emoji: '😫' };
  };

  const qualityInfo = getSleepQualityInfo();
  const percentage = Math.min((stats.average_duration / 8) * 100, 125);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Layout>
      <div className="sleep-container">
        <div className="sleep-header">
          <div className="header-title">
            <Moon className="page-icon" />
            <h1>Sleep Tracker</h1>
          </div>
          <p className="header-subtitle">Track your sleep for better health 🌙</p>
        </div>

        <div className="sleep-content">
          {/* Progress Ring */}
          <motion.div 
            className="sleep-progress-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="circular-progress">
              <svg width="300" height="300" viewBox="0 0 300 300">
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                <motion.circle
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="none"
                  stroke={qualityInfo.color}
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 150 150)"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="progress-content">
                <motion.div 
                  className="progress-emoji"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  {qualityInfo.emoji}
                </motion.div>
                <div className="progress-amount">
                  {stats.average_duration.toFixed(1)} hrs
                </div>
                <div className="progress-goal">
                  Average Sleep
                </div>
                <div className="progress-status" style={{ color: qualityInfo.color }}>
                  {qualityInfo.text}
                </div>
                <div className="progress-logs">
                  {stats.total_logs} logs this week
                </div>
              </div>
            </div>
          </motion.div>

          {/* Suggestion Card */}
          {stats.suggestion && (
            <motion.div 
              className="suggestion-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Star className="suggestion-icon" />
              <p>{stats.suggestion}</p>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div 
            className="sleep-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {!isSleeping ? (
              <motion.button
                className="sleep-btn"
                onClick={startSleep}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Moon size={24} />
                <span>Sleep</span>
              </motion.button>
            ) : (
              <div className="sleeping-state">
                <motion.div 
                  className="sleeping-indicator"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Moon size={32} />
                  <p>Sleeping... 💤</p>
                  <small>Started: {sleepStartTime?.toLocaleTimeString()}</small>
                </motion.div>
                <motion.button
                  className="wake-btn"
                  onClick={wakeUp}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sun size={24} />
                  <span>Wake Up</span>
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* 7-Day History */}
          <motion.div 
            className="sleep-history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="history-header">
              <TrendingUp size={20} />
              <h3>7-Day Sleep History</h3>
            </div>
            
            {logs.length === 0 ? (
              <div className="no-logs">
                <Moon size={48} />
                <p>No sleep logs yet. Start tracking your sleep!</p>
              </div>
            ) : (
              <div className="sleep-logs-grid">
                {logs.map((log, index) => {
                  const bedTime = new Date(log.bed_time);
                  const wakeTime = new Date(log.wake_time);
                  const qualityColor = {
                    'excellent': '#10b981',
                    'good': '#3b82f6',
                    'fair': '#f59e0b',
                    'poor': '#ef4444'
                  }[log.quality] || '#6b7280';

                  return (
                    <motion.div
                      key={log.id}
                      className="sleep-log-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="log-date">
                        <CalendarIcon size={16} />
                        <span>{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="log-times">
                        <div className="time-item">
                          <Moon size={16} />
                          <span>{bedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="time-arrow">→</div>
                        <div className="time-item">
                          <Sun size={16} />
                          <span>{wakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="log-duration">
                        <Clock size={16} />
                        <span>{log.duration_hours.toFixed(1)} hours</span>
                      </div>

                      {log.quality && (
                        <div className="log-quality" style={{ borderColor: qualityColor }}>
                          <span style={{ color: qualityColor }}>{log.quality}</span>
                        </div>
                      )}

                      {log.notes && (
                        <div className="log-notes">
                          <p>{log.notes}</p>
                        </div>
                      )}

                      <button
                        className="delete-log-btn"
                        onClick={() => deleteSleepLog(log.id)}
                      >
                        Delete
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sleep Quality Modal */}
        {showQualityModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowQualityModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Good Morning! 🌅</h3>
              <p>How was your sleep?</p>
              
              <div className="form-group">
                <label>
                  <Star size={16} />
                  Sleep Quality
                </label>
                <select
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(e.target.value)}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  value={sleepNotes}
                  onChange={(e) => setSleepNotes(e.target.value)}
                  placeholder="How did you feel? Any issues?"
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowQualityModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={createSleepLog} className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : 'Complete Log'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Sleep;
