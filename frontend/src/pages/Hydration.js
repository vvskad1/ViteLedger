import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Droplet, Target, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import './Hydration.css';

const Hydration = () => {
  const navigate = useNavigate();
  const [hydrationData, setHydrationData] = useState({
    amount_ml: 0,
    daily_goal_ml: 2000,
    date: new Date().toLocaleDateString()
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    fetchTodayHydration();
    fetchHistory();
  }, []);

  const fetchTodayHydration = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/hydration/today', {
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
        setHydrationData(data);
      }
    } catch (error) {
      console.error('Error fetching hydration:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/hydration/history?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const addWater = async (amount) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/hydration/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount_ml: amount })
      });

      if (response.ok) {
        const data = await response.json();
        setHydrationData(data);
        setCustomAmount('');
        fetchHistory(); // Refresh history
      }
    } catch (error) {
      console.error('Error adding water:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async () => {
    const goal = parseInt(newGoal);
    if (!goal || goal < 500 || goal > 10000) {
      alert('Please enter a valid goal between 500ml and 10000ml');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/hydration/goal', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ daily_goal_ml: goal })
      });

      if (response.ok) {
        const data = await response.json();
        setHydrationData(data);
        setShowGoalModal(false);
        setNewGoal('');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const resetToday = async () => {
    if (!window.confirm('Reset today\'s water intake to 0?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/hydration/reset', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchTodayHydration();
        fetchHistory();
      }
    } catch (error) {
      console.error('Error resetting hydration:', error);
    }
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount);
    if (amount && amount > 0 && amount <= 5000) {
      addWater(amount);
    } else {
      alert('Please enter a valid amount (1-5000ml)');
    }
  };

  const percentage = Math.min((hydrationData.amount_ml / hydrationData.daily_goal_ml) * 100, 100);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getHydrationStatus = () => {
    if (percentage >= 100) return { text: 'Excellent!', color: '#10b981', emoji: '🎉' };
    if (percentage >= 75) return { text: 'Great Progress', color: '#3b82f6', emoji: '💪' };
    if (percentage >= 50) return { text: 'Keep Going', color: '#f59e0b', emoji: '👍' };
    return { text: 'Stay Hydrated', color: '#ef4444', emoji: '💧' };
  };

  const status = getHydrationStatus();

  return (
    <Layout>
      <div className="hydration-container">
        <div className="hydration-header">
          <div className="header-title">
            <Droplet className="page-icon" />
            <h1>Hydration Tracker</h1>
          </div>
          <p className="header-subtitle">Stay hydrated, stay healthy 💧</p>
        </div>

        <div className="hydration-content">
          {/* Main Progress Ring */}
          <motion.div 
            className="progress-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="circular-progress">
              <svg width="300" height="300" viewBox="0 0 300 300">
                {/* Background circle */}
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="150"
                  cy="150"
                  r={radius}
                  fill="none"
                  stroke={status.color}
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
                  {status.emoji}
                </motion.div>
                <div className="progress-amount">
                  {hydrationData.amount_ml} ml
                </div>
                <div className="progress-goal">
                  of {hydrationData.daily_goal_ml} ml
                </div>
                <div className="progress-percentage" style={{ color: status.color }}>
                  {percentage.toFixed(0)}%
                </div>
                <div className="progress-status" style={{ color: status.color }}>
                  {status.text}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Add Buttons */}
          <motion.div 
            className="quick-add-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3>Quick Add</h3>
            <div className="quick-buttons">
              <motion.button
                className="quick-btn glass-btn"
                onClick={() => addWater(250)}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Droplet size={20} />
                <span>250ml</span>
                <small>Glass</small>
              </motion.button>
              <motion.button
                className="quick-btn bottle-btn"
                onClick={() => addWater(500)}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Droplet size={24} />
                <span>500ml</span>
                <small>Bottle</small>
              </motion.button>
              <motion.button
                className="quick-btn jug-btn"
                onClick={() => addWater(1000)}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Droplet size={28} />
                <span>1000ml</span>
                <small>Jug</small>
              </motion.button>
            </div>

            <div className="custom-add">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Custom amount (ml)"
                min="1"
                max="5000"
              />
              <motion.button
                onClick={handleCustomAdd}
                disabled={loading || !customAmount}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Add
              </motion.button>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div 
            className="actions-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.button
              className="action-btn goal-btn"
              onClick={() => setShowGoalModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Target size={20} />
              <span>Set Goal</span>
            </motion.button>
            <motion.button
              className="action-btn reset-btn"
              onClick={resetToday}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calendar size={20} />
              <span>Reset Today</span>
            </motion.button>
          </motion.div>

          {/* 7-Day History */}
          <motion.div 
            className="history-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="history-header">
              <TrendingUp size={20} />
              <h3>7-Day History</h3>
            </div>
            <div className="history-chart">
              {history.map((day, index) => {
                const dayPercentage = Math.min((day.amount_ml / day.daily_goal_ml) * 100, 100);
                const date = new Date(day.date);
                return (
                  <motion.div
                    key={day.id}
                    className="history-bar"
                    initial={{ height: 0 }}
                    animate={{ height: `${dayPercentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div 
                      className="bar-fill" 
                      style={{ 
                        height: '100%',
                        backgroundColor: dayPercentage >= 100 ? '#10b981' : 
                                       dayPercentage >= 75 ? '#3b82f6' : 
                                       dayPercentage >= 50 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      <span className="bar-amount">{day.amount_ml}ml</span>
                    </div>
                    <div className="bar-label">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Goal Modal */}
        {showGoalModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowGoalModal(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Set Daily Goal</h3>
              <p>Current goal: {hydrationData.daily_goal_ml} ml</p>
              <div className="modal-input">
                <input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Enter new goal (ml)"
                  min="500"
                  max="10000"
                  autoFocus
                />
              </div>
              <div className="goal-suggestions">
                <button onClick={() => setNewGoal('1500')}>1.5L</button>
                <button onClick={() => setNewGoal('2000')}>2L</button>
                <button onClick={() => setNewGoal('2500')}>2.5L</button>
                <button onClick={() => setNewGoal('3000')}>3L</button>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowGoalModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={updateGoal} className="save-btn">
                  Save Goal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Hydration;
