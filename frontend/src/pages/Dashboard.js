import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Activity, Calendar, TrendingUp, Flame, Target, Bell, Apple, FileText, Droplet, Moon, Dumbbell, Brain, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { apiRequest } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    calories: 0,
    activeMinutes: 0,
    waterGlasses: 0,
    waterGoal: 8,
    sleepHours: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchDashboardStats();

    // Refresh stats when user returns to dashboard
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardStats();
      }
    };

    // Refresh stats periodically (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchDashboardStats);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchDashboardStats);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch nutrition data for calories
      const nutritionRes = await apiRequest('http://localhost:8000/nutrition/meals', {
        method: 'GET'
      });
      const nutritionData = await nutritionRes.json();
      const todayMeals = nutritionData.filter(meal => 
        meal.logged_at && meal.logged_at.startsWith(today)
      );
      const totalCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

      // Fetch hydration data (today's log)
      const hydrationRes = await apiRequest('http://localhost:8000/hydration/today', {
        method: 'GET'
      });
      const hydrationData = await hydrationRes.json();
      const totalWater = Math.round((hydrationData.amount_ml || 0) / 250); // Convert ml to glasses (250ml each)

      // Fetch sleep data
      const sleepRes = await apiRequest('http://localhost:8000/sleep/logs', {
        method: 'GET'
      });
      const sleepData = await sleepRes.json();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const lastSleep = sleepData.find(log => 
        log.sleep_date && (log.sleep_date.startsWith(today) || log.sleep_date.startsWith(yesterdayStr))
      );
      const sleepHours = lastSleep ? lastSleep.hours : 0;

      // Fetch fitness data for active minutes (if you have a fitness endpoint)
      // For now, we'll calculate from meal data as a placeholder
      const activeMinutes = todayMeals.length * 15; // Rough estimate

      setStats({
        calories: Math.round(totalCalories),
        activeMinutes: activeMinutes,
        waterGlasses: totalWater,
        waterGoal: 8,
        sleepHours: sleepHours
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      icon: <Flame size={24} />,
      value: loading ? '...' : stats.calories.toLocaleString(),
      label: 'Calories',
      color: '#f59e0b',
      subtext: 'Today'
    },
    {
      icon: <Dumbbell size={24} />,
      value: loading ? '...' : stats.activeMinutes,
      label: 'Active Min',
      color: '#ec4899',
      subtext: 'This week'
    },
    {
      icon: <Droplet size={24} />,
      value: loading ? '...' : `${stats.waterGlasses}/${stats.waterGoal}`,
      label: 'Water',
      color: '#06b6d4',
      subtext: 'Glasses'
    },
    {
      icon: <Moon size={24} />,
      value: loading ? '...' : `${stats.sleepHours}h`,
      label: 'Sleep',
      color: '#8b5cf6',
      subtext: 'Last night'
    }
  ];

  const quickActions = [
    {
      icon: <Apple size={28} />,
      title: 'Nutrition',
      color: '#10b981',
      route: '/nutrition'
    },
    {
      icon: <Dumbbell size={28} />,
      title: 'Fitness',
      color: '#ec4899',
      route: '/fitness'
    },
    {
      icon: <Droplet size={28} />,
      title: 'Hydration',
      color: '#06b6d4',
      route: '/hydration'
    },
    {
      icon: <Moon size={28} />,
      title: 'Sleep',
      color: '#8b5cf6',
      route: '/sleep-tracker'
    },
    {
      icon: <Brain size={28} />,
      title: 'Mindfulness',
      color: '#14b8a6',
      route: '/mindfulness'
    },
    {
      icon: <Bell size={28} />,
      title: 'Reminders',
      color: '#f59e0b',
      route: '/reminders'
    },
    {
      icon: <Calendar size={28} />,
      title: 'Appointments',
      color: '#14b8a6',
      route: '/appointments'
    },
    {
      icon: <TrendingUp size={28} />,
      title: 'Analytics',
      color: '#6366f1',
      route: '/analytics'
    },
    {
      icon: <Heart size={28} />,
      title: 'Health Records',
      color: '#ef4444',
      route: '/health-records'
    }
  ];

  return (
    <Layout>
      <div className="dashboard-container">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="dashboard-header"
        >
          <h1>Welcome back, {user?.name || 'User'}! 👋</h1>
          <p className="date-info">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="daily-goals-card">
            <div className="goals-header">
              <Target size={24} />
              <h2>Today's Progress</h2>
              <button 
                className="refresh-btn" 
                onClick={fetchDashboardStats}
                disabled={loading}
                title="Refresh stats"
              >
                <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              </button>
            </div>
            <div className="stats-grid">
              {statsData.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="stat-item"
                >
                  <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-subtext">{stat.subtext}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="quick-actions-section"
        >
          <h3 className="section-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                className="quick-action-item"
                onClick={() => navigate(action.route)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="action-icon" style={{ color: action.color }}>
                  {action.icon}
                </div>
                <div className="action-title">{action.title}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Dashboard;
