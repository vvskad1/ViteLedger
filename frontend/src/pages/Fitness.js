import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, Target, TrendingUp, Calendar, CheckCircle, 
  AlertTriangle, RefreshCw, Play, Clock, Award, Search, ExternalLink, Lightbulb
} from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { fitnessSearch, fitnessAdvice } from '../utils/api';
import './Fitness.css';

const Fitness = () => {
  const [currentGoal, setCurrentGoal] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [progress, setProgress] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // RAG search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adviceQuery, setAdviceQuery] = useState('');
  const [adviceResponse, setAdviceResponse] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    fetchCurrentGoal();
    fetchCurrentPlan();
    fetchProgress();
  }, []);

  useEffect(() => {
    if (currentPlan) {
      // Calculate current day based on plan creation date
      const daysActive = progress?.days_active || 1;
      setSelectedDay(Math.min(daysActive, 30));
      fetchWorkoutLogs(Math.min(daysActive, 30));
    }
  }, [currentPlan, progress]);

  const fetchCurrentGoal = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/fitness/current-goal', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.id) setCurrentGoal(data);
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/fitness/current-plan', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.plan) {
          // Parse plan_data if it's a JSON string
          if (typeof data.plan.plan_data === 'string') {
            data.plan.plan_data = JSON.parse(data.plan.plan_data);
          }
          setCurrentPlan(data.plan);
        }
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/fitness/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchWorkoutLogs = async (dayNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/fitness/workout-logs?day_number=${dayNumber}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWorkoutLogs(data);
      }
    } catch (error) {
      console.error('Error fetching workout logs:', error);
    }
  };

  const handleSetGoal = async (goalType) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/fitness/set-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ goal_type: goalType })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentGoal(data.goal);
        setShowGoalModal(false);
        showNotification('Goal set! Now generating your personalized plan...', 'success');
        
        // Auto-generate plan after setting goal
        setTimeout(() => handleGeneratePlan(), 1000);
      }
    } catch (error) {
      showNotification('Failed to set goal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/fitness/generate-plan', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Parse plan_data if it's a JSON string
        if (data.plan && typeof data.plan.plan_data === 'string') {
          data.plan.plan_data = JSON.parse(data.plan.plan_data);
        }
        
        // Set the plan first
        setCurrentPlan(data.plan);
        
        // Set selected day to 1 for new plans
        setSelectedDay(1);
        
        // Refresh all data
        await fetchProgress();
        await fetchWorkoutLogs(1);
        
        if (data.health_warnings && data.health_warnings.length > 0) {
          showNotification('⚠️ Plan adjusted for your health conditions', 'warning');
        } else {
          showNotification('✨ Your personalized plan is ready!', 'success');
        }
      }
    } catch (error) {
      showNotification('Failed to generate plan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // RAG Search & Advice functions
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const data = await fitnessSearch(searchQuery);
      setSearchResults(data.results || []);
    } catch (error) {
      showNotification('Search failed. Please try again.', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGetAdvice = async () => {
    if (!adviceQuery.trim()) return;
    
    setAdviceLoading(true);
    try {
      const data = await fitnessAdvice(adviceQuery, true);
      setAdviceResponse(data);
    } catch (error) {
      showNotification('Failed to get advice. Please try again.', 'error');
    } finally {
      setAdviceLoading(false);
    }
  };

  const handleCompleteWorkout = async (logId, completed) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/fitness/log-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workout_log_id: logId,
          completed: completed
        })
      });

      if (response.ok) {
        fetchWorkoutLogs(selectedDay);
        fetchProgress();
        if (completed) {
          showNotification('🎉 Workout completed!', 'success');
        }
      }
    } catch (error) {
      console.error('Error logging workout:', error);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getDayData = (dayNumber) => {
    if (!currentPlan || !currentPlan.plan_data || !currentPlan.plan_data.days) return null;
    return currentPlan.plan_data.days.find(d => d.day === dayNumber);
  };

  const goalTypes = [
    { value: 'weight_loss', label: 'Weight Loss', icon: '🔥', color: '#ef4444' },
    { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪', color: '#8b5cf6' },
    { value: 'stamina', label: 'Build Stamina', icon: '⚡', color: '#f59e0b' },
    { value: 'flexibility', label: 'Flexibility', icon: '🧘', color: '#10b981' },
    { value: 'disease_management', label: 'Disease Management', icon: '🏥', color: '#06b6d4' }
  ];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fitness-container"
      >
        <div className="fitness-header">
          <div className="header-title">
            <Dumbbell size={36} className="page-icon" />
            <h1>Fitness Companion</h1>
          </div>
          <p className="header-subtitle">AI-powered workout plans tailored to your health</p>
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

        {/* Health Warning Banner */}
        {currentPlan && currentPlan.plan_data?.health_warnings && currentPlan.plan_data.health_warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="health-warning-banner"
          >
            <AlertTriangle size={24} />
            <div>
              <strong>Health Priority Mode</strong>
              <p>{currentPlan.plan_data.priority_message || 'Your plan has been adjusted based on your current health status.'}</p>
            </div>
          </motion.div>
        )}

        <div className="fitness-grid">
          {/* Goal Card */}
          <Card className="goal-card">
            <div className="card-header">
              <Target size={24} />
              <h3>Your Goal</h3>
            </div>
            {currentGoal ? (
              <div className="goal-display">
                <div className="goal-type">
                  {goalTypes.find(g => g.value === currentGoal.goal_type)?.icon || '🎯'}
                  <span>{goalTypes.find(g => g.value === currentGoal.goal_type)?.label || currentGoal.goal_type}</span>
                </div>
                <Button onClick={() => setShowGoalModal(true)} variant="secondary">
                  Change Goal
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowGoalModal(true)} className="set-goal-btn">
                <Target size={20} />
                Set Your Fitness Goal
              </Button>
            )}
          </Card>

          {/* Progress Card */}
          {progress && (
            <Card className="progress-card">
              <h3 className="progress-title">Weekly Progress</h3>
              <div className="stats-horizontal">
                <div className="stat-item">
                  <div className="stat-value">{progress.days_active}/7</div>
                  <div className="stat-label">Days</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{progress.completed_workouts}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{Math.round(progress.completion_percentage)}%</div>
                  <div className="stat-label">Progress</div>
                </div>
              </div>
            </Card>
          )}

          {/* Generate Plan Button */}
          {currentGoal && !currentPlan && (
            <Card className="generate-card">
              <Button onClick={handleGeneratePlan} disabled={loading} className="generate-btn">
                {loading ? (
                  <>
                    <RefreshCw size={20} className="spin" />
                    Generating Your Plan...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Generate My 7-Day Plan
                  </>
                )}
              </Button>
              <p className="generate-info">Based on your health data and fitness goal</p>
            </Card>
          )}
        </div>

        {/* 7-Day Calendar & Workouts */}
        {currentPlan && currentPlan.plan_data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="workout-section"
          >
            <Card>
              <div className="card-header">
                <Calendar size={24} />
                <h3>7-Day Workout Plan</h3>
              </div>

              {/* Day Selector */}
              <div className="day-selector">
                {[...Array(7)].map((_, i) => {
                  const day = i + 1;
                  const dayLogs = workoutLogs.filter(log => log.day_number === day);
                  const allCompleted = dayLogs.length > 0 && dayLogs.every(log => log.completed);
                  const currentDay = progress?.current_day || 1;
                  
                  return (
                    <button
                      key={day}
                      className={`day-btn ${selectedDay === day ? 'active' : ''} ${allCompleted ? 'completed' : ''} ${day === currentDay ? 'current' : ''}`}
                      onClick={() => {
                        setSelectedDay(day);
                        fetchWorkoutLogs(day);
                      }}
                    >
                      {day}
                      {allCompleted && <CheckCircle size={14} className="check-icon" />}
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Workout */}
              {getDayData(selectedDay) && (
                <div className="day-workout">
                  <div className="day-header">
                    <h4>Day {selectedDay} - {getDayData(selectedDay).focus}</h4>
                    {getDayData(selectedDay).notes && (
                      <p className="day-notes">{getDayData(selectedDay).notes}</p>
                    )}
                  </div>

                  <div className="exercises-grid">
                    {getDayData(selectedDay).exercises?.map((exercise, idx) => {
                      const log = workoutLogs.find(l => l.workout_name === exercise.name);
                      
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`exercise-card ${log?.completed ? 'completed' : ''}`}
                        >
                          <div className="exercise-header">
                            <h5>{exercise.name}</h5>
                            <span className={`exercise-type type-${exercise.type}`}>
                              {exercise.type}
                            </span>
                          </div>

                          <div className="exercise-details">
                            {exercise.duration_minutes > 0 && (
                              <div className="detail-item">
                                <Clock size={16} />
                                <span>{exercise.duration_minutes} min</span>
                              </div>
                            )}
                            {exercise.sets && exercise.sets > 0 && (
                              <div className="detail-item">
                                <span>{exercise.sets} sets × {exercise.reps} reps</span>
                              </div>
                            )}
                          </div>

                          <p className="exercise-instructions">{exercise.instructions}</p>

                          {exercise.modifications && (
                            <p className="exercise-modifications">
                              💡 {exercise.modifications}
                            </p>
                          )}

                          {exercise.benefits && (
                            <p className="exercise-benefits">
                              ✨ {exercise.benefits}
                            </p>
                          )}

                          {log && (
                            <div className="completion-section">
                              <label className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={log.completed}
                                  onChange={(e) => handleCompleteWorkout(log.id, e.target.checked)}
                                />
                                <span>{log.completed ? 'Completed!' : 'Mark as completed'}</span>
                              </label>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
            
            {/* Small Regenerate Button at bottom */}
            <div className="regenerate-section">
              <button 
                onClick={handleGeneratePlan} 
                disabled={loading} 
                className="regenerate-btn-small"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Regenerate Plan
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* RAG Knowledge Search Section */}
        {currentGoal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rag-section"
          >
            <Card>
              <div className="rag-header">
                <Search size={24} />
                <h3>Find Latest Fitness Techniques</h3>
              </div>
              
              <div className="rag-search-box">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for workout tips, nutrition advice, recovery techniques..."
                  className="rag-search-input"
                />
                <Button onClick={handleSearch} disabled={searchLoading}>
                  {searchLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="rag-results">
                  <h4 className="rag-results-title">Web Results:</h4>
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="rag-result-card">
                      <h5>{result.title}</h5>
                      <p>{result.text}</p>
                      <a href={result.url} target="_blank" rel="noreferrer" className="rag-result-link">
                        Read more <ExternalLink size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="rag-header">
                <Lightbulb size={24} />
                <h3>Get Expert Advice</h3>
              </div>
              
              <div className="rag-advice-box">
                <textarea
                  value={adviceQuery}
                  onChange={(e) => setAdviceQuery(e.target.value)}
                  placeholder="Ask about your training, recovery, nutrition, or any fitness topic..."
                  className="rag-advice-textarea"
                  rows={3}
                />
                <Button onClick={handleGetAdvice} disabled={adviceLoading}>
                  {adviceLoading ? 'Generating...' : 'Generate Advice'}
                </Button>
              </div>

              {adviceResponse && (
                <div className="rag-advice-response">
                  <div className="advice-text">{adviceResponse.response}</div>
                  
                  {adviceResponse.sources && adviceResponse.sources.length > 0 && (
                    <div className="advice-sources">
                      <div className="sources-label">Sources:</div>
                      <div className="sources-links">
                        {adviceResponse.sources.map((source, idx) => (
                          <a 
                            key={idx}
                            href={source.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="source-pill"
                          >
                            {source.title || new URL(source.url).hostname}
                            <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Goal Modal */}
        <AnimatePresence>
          {showGoalModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              onClick={() => setShowGoalModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>Choose Your Fitness Goal</h3>
                <p>Your plan will be personalized based on your selection</p>

                <div className="goal-options">
                  {goalTypes.map(goal => (
                    <button
                      key={goal.value}
                      className="goal-option"
                      onClick={() => handleSetGoal(goal.value)}
                      disabled={loading}
                    >
                      <span className="goal-icon">{goal.icon}</span>
                      <span className="goal-label">{goal.label}</span>
                    </button>
                  ))}
                </div>

                <Button onClick={() => setShowGoalModal(false)} variant="secondary">
                  Cancel
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
};

export default Fitness;
