import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Plus, Trash2, Calendar, Globe, ExternalLink, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { generateMealPlan, getActiveMealPlan } from '../utils/api';
import './Nutrition_new.css';

const Nutrition = () => {
  const [meals, setMeals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    meal_name: '',
    meal_type: 'breakfast',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // New 7-day meal plan state
  const [showMealPlanGenerator, setShowMealPlanGenerator] = useState(false);
  const [expectations, setExpectations] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [fullMealPlan, setFullMealPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅', color: '#f59e0b' },
    { value: 'lunch', label: 'Lunch', icon: '☀️', color: '#3b82f6' },
    { value: 'dinner', label: 'Dinner', icon: '🌙', color: '#8b5cf6' },
    { value: 'snack', label: 'Snack', icon: '🍎', color: '#ec4899' }
  ];

  useEffect(() => {
    fetchMeals();
    loadActiveMealPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMeals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/nutrition/meals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeals(data);
      }
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/nutrition/meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          calories: formData.calories ? parseFloat(formData.calories) : null,
          protein: formData.protein ? parseFloat(formData.protein) : null,
          carbs: formData.carbs ? parseFloat(formData.carbs) : null,
          fats: formData.fats ? parseFloat(formData.fats) : null
        })
      });

      if (response.ok) {
        await fetchMeals();
        resetForm();
        showNotification('Meal logged successfully!', 'success');
      }
    } catch (error) {
      showNotification('Failed to log meal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/nutrition/meals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchMeals();
        showNotification('Meal deleted', 'success');
      }
    } catch (error) {
      showNotification('Failed to delete meal', 'error');
    }
  };



  const resetForm = () => {
    setFormData({
      meal_name: '',
      meal_type: 'breakfast',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      notes: ''
    });
    setShowForm(false);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getMealTypeInfo = (type) => {
    return mealTypes.find(t => t.value === type) || mealTypes[0];
  };

  const calculateTotals = () => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };
  
  // Load active meal plan
  const loadActiveMealPlan = async () => {
    try {
      const data = await getActiveMealPlan();
      if (data && data.plan_data) {
        setFullMealPlan(data);
      } else {
        setFullMealPlan(null);
      }
    } catch (error) {
      console.log('No active meal plan found');
      setFullMealPlan(null);
    }
  };
  
  // Generate new 7-day meal plan
  const handleGenerateMealPlan = async () => {
    if (!expectations.trim()) {
      showNotification('Please describe your goals and expectations', 'error');
      return;
    }
    
    setGeneratingPlan(true);
    try {
      const data = await generateMealPlan(expectations);
      setFullMealPlan(data);
      setShowMealPlanGenerator(false);
      setSelectedDay(1);
      showNotification('Meal plan generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating meal plan:', error);
      showNotification(error.message || 'Failed to generate meal plan. Please complete your profile first.', 'error');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="nutrition-header">
          <Apple size={32} className="nutrition-icon" />
          <h1>Nutrition Tracker</h1>
          <p>AI-powered meal logging and recommendations</p>
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

        {/* Daily Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="summary-card">
            <h2>Today's Summary</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Calories</span>
                <span className="summary-value">{totals.calories.toFixed(0)}</span>
                <span className="summary-unit">kcal</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Protein</span>
                <span className="summary-value">{totals.protein.toFixed(1)}</span>
                <span className="summary-unit">g</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Carbs</span>
                <span className="summary-value">{totals.carbs.toFixed(1)}</span>
                <span className="summary-unit">g</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Fats</span>
                <span className="summary-value">{totals.fats.toFixed(1)}</span>
                <span className="summary-unit">g</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Custom Meal Plan Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="meal-plan-generator-card">
            {/* Initial state - show intro and button */}
            {!showMealPlanGenerator && !fullMealPlan && (
              <div className="generator-intro">
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' }}>
                  🍽️ Generate Personalized Meal Plan
                </h2>
                <p>Get a comprehensive personalized meal plan tailored to your goals, lab results, and cultural preferences.</p>
                <ul>
                  <li>✓ Based on your nationality and food preferences</li>
                  <li>✓ Considers lab abnormalities (priority)</li>
                  <li>✓ Respects allergies and dietary restrictions</li>
                  <li>✓ Uses real recipes from verified web sources</li>
                  <li>✓ Includes detailed macros and preparation tips</li>
                </ul>
                <Button onClick={() => setShowMealPlanGenerator(true)}>
                  Generate My Meal Plan
                </Button>
              </div>
            )}

            {showMealPlanGenerator && !fullMealPlan && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="generator-form"
              >
                <label>
                  <strong>What are your nutrition goals and expectations?</strong>
                  <small>Be specific about your goals (bulk/cut/maintain), dietary preferences, and any focus areas</small>
                </label>
                <textarea
                  className="expectations-input"
                  value={expectations}
                  onChange={(e) => setExpectations(e.target.value)}
                  placeholder="Example: I want to bulk by focusing on high protein foods and reducing sugars. I prefer lean meats and want to maintain my energy levels throughout the day."
                  rows={4}
                />
                <div className="generator-actions">
                  <Button 
                    onClick={handleGenerateMealPlan}
                    disabled={generatingPlan || !expectations.trim()}
                  >
                    {generatingPlan ? 'Generating Plan...' : 'Generate Plan'}
                  </Button>
                  <Button 
                    onClick={() => setShowMealPlanGenerator(false)}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {fullMealPlan && fullMealPlan.plan_data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {fullMealPlan.modification_notes && (
                  <div className="modification-alert">
                    <AlertCircle size={20} />
                    <div>
                      <strong>Plan Modifications Based on Lab Results</strong>
                      <p>{fullMealPlan.modification_notes}</p>
                    </div>
                  </div>
                )}

                <div className="day-selector">
                  {fullMealPlan.plan_data.days && fullMealPlan.plan_data.days.map((day) => (
                    <button
                      key={day.day}
                      className={`day-btn ${selectedDay === day.day ? 'active' : ''}`}
                      onClick={() => setSelectedDay(day.day)}
                    >
                      <Calendar size={16} />
                      Day {day.day}
                    </button>
                  ))}
                </div>

                {fullMealPlan.plan_data.days && fullMealPlan.plan_data.days
                  .filter(day => day.day === selectedDay)
                  .map((day) => (
                    <div key={day.day} className="day-plan">
                      <div className="day-summary">
                        <h3>Day {day.day} Summary</h3>
                        <div className="day-macros">
                          <div className="day-macro-item">
                            <span className="macro-label">Calories</span>
                            <span className="macro-value">{day.total_calories}</span>
                            <span className="macro-unit">kcal</span>
                          </div>
                          <div className="day-macro-item">
                            <span className="macro-label">Protein</span>
                            <span className="macro-value">{day.total_protein}</span>
                            <span className="macro-unit">g</span>
                          </div>
                          <div className="day-macro-item">
                            <span className="macro-label">Carbs</span>
                            <span className="macro-value">{day.total_carbs}</span>
                            <span className="macro-unit">g</span>
                          </div>
                          <div className="day-macro-item">
                            <span className="macro-label">Fats</span>
                            <span className="macro-value">{day.total_fats}</span>
                            <span className="macro-unit">g</span>
                          </div>
                        </div>
                      </div>

                      <div className="meals-list">
                        {day.meals && day.meals.map((meal, idx) => (
                          <div key={idx} className="plan-meal-card">
                            <div className="plan-meal-header">
                              <span className="meal-type-tag">{meal.type}</span>
                              <div className="meal-macros-inline">
                                <span>{meal.calories} cal</span>
                                <span>•</span>
                                <span>{meal.protein}g P</span>
                                <span>•</span>
                                <span>{meal.carbs}g C</span>
                                <span>•</span>
                                <span>{meal.fats}g F</span>
                              </div>
                            </div>
                            <h4>{meal.dish_name}</h4>
                            <p className="meal-description">{meal.description}</p>
                            {meal.preparation_notes && (
                              <div className="preparation-notes">
                                <strong>Prep:</strong> {meal.preparation_notes}
                              </div>
                            )}
                            {meal.health_benefit && (
                              <div className="health-benefit">
                                <strong>Health Benefit:</strong> {meal.health_benefit}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                {fullMealPlan.sources && fullMealPlan.sources.length > 0 && (
                  <div className="plan-sources">
                    <h4>
                      <Globe size={20} />
                      Verified Sources ({fullMealPlan.sources.length})
                    </h4>
                    <div className="sources-list">
                      {fullMealPlan.sources.slice(0, 5).map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-link"
                        >
                          <ExternalLink size={14} />
                          <span>{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="plan-actions">
                  <Button 
                    onClick={() => {
                      setFullMealPlan(null);
                      setShowMealPlanGenerator(true);
                      setExpectations('');
                    }}
                    variant="secondary"
                  >
                    Generate New Plan
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Meal Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="card-header">
              <h2>Log a Meal ({meals.length})</h2>
              <Button 
                onClick={() => setShowForm(!showForm)}
                variant="secondary"
              >
                <Plus size={20} />
                {showForm ? 'Cancel' : 'Add Meal'}
              </Button>
            </div>

            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="meal-form"
              >
                <Input
                  label="Meal Name"
                  value={formData.meal_name}
                  onChange={(e) => setFormData({ ...formData, meal_name: e.target.value })}
                  placeholder="e.g., Chicken Salad"
                  required
                />

                <div className="form-field">
                  <label>Meal Type</label>
                  <div className="meal-type-selector">
                    {mealTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        className={`meal-type-btn ${formData.meal_type === type.value ? 'active' : ''}`}
                        style={{ '--type-color': type.color }}
                        onClick={() => setFormData({ ...formData, meal_type: type.value })}
                      >
                        <span className="meal-type-icon">{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="macros-grid">
                  <Input
                    label="Calories"
                    type="number"
                    step="0.1"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    placeholder="0"
                  />
                  <Input
                    label="Protein (g)"
                    type="number"
                    step="0.1"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                    placeholder="0"
                  />
                  <Input
                    label="Carbs (g)"
                    type="number"
                    step="0.1"
                    value={formData.carbs}
                    onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                    placeholder="0"
                  />
                  <Input
                    label="Fats (g)"
                    type="number"
                    step="0.1"
                    value={formData.fats}
                    onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <Input
                  label="Notes (Optional)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional details..."
                />

                <div className="form-actions">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Log Meal'}
                  </Button>
                </div>
              </motion.form>
            )}
          </Card>
        </motion.div>

        {/* Meals List */}
        <div className="meals-grid">
          {meals.map((meal, index) => {
            const typeInfo = getMealTypeInfo(meal.meal_type);
            return (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 4) }}
                >
                  <Card className="meal-card">
                    <div className="meal-header">
                      <div className="meal-type-badge" style={{ background: typeInfo.color }}>
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </div>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(meal.id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <h3>{meal.meal_name}</h3>
                    
                    {(meal.calories || meal.protein || meal.carbs || meal.fats) && (
                      <div className="meal-macros">
                        {meal.calories && (
                          <div className="macro-item">
                            <span className="macro-value">{meal.calories}</span>
                            <span className="macro-label">cal</span>
                          </div>
                        )}
                        {meal.protein && (
                          <div className="macro-item">
                            <span className="macro-value">{meal.protein}g</span>
                            <span className="macro-label">protein</span>
                          </div>
                        )}
                        {meal.carbs && (
                          <div className="macro-item">
                            <span className="macro-value">{meal.carbs}g</span>
                            <span className="macro-label">carbs</span>
                          </div>
                        )}
                        {meal.fats && (
                          <div className="macro-item">
                            <span className="macro-value">{meal.fats}g</span>
                            <span className="macro-label">fats</span>
                          </div>
                        )}
                      </div>
                    )}

                    {meal.notes && (
                      <p className="meal-notes">{meal.notes}</p>
                    )}

                    <span className="meal-time">
                      {new Date(meal.meal_date).toLocaleString()}
                    </span>
                  </Card>
                </motion.div>
              );
            })
          }
        </div>
      </motion.div>
    </Layout>
  );
};

export default Nutrition;
