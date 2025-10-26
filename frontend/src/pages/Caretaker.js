import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, Edit2, Phone, Mail, UserCheck } from 'lucide-react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import './Caretaker.css';

const Caretaker = () => {
  const [caretakers, setCaretakers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship_type: '',
    phone: '',
    email: '',
    share_on_recovery: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCaretakers();
  }, []);

  const fetchCaretakers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/caretaker/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCaretakers(data);
      }
    } catch (error) {
      console.error('Error fetching caretakers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `http://localhost:8000/caretaker/${editingId}`
        : 'http://localhost:8000/caretaker/';
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchCaretakers();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving caretaker:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (caretaker) => {
    setFormData({
      name: caretaker.name,
      relationship_type: caretaker.relationship_type,
      phone: caretaker.phone,
      email: caretaker.email,
      share_on_recovery: caretaker.share_on_recovery
    });
    setEditingId(caretaker.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this contact?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/caretaker/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchCaretakers();
      }
    } catch (error) {
      console.error('Error deleting caretaker:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      relationship_type: '',
      phone: '',
      email: '',
      share_on_recovery: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="caretaker-header">
          <Users size={32} className="caretaker-icon" />
          <h1>Emergency Contacts</h1>
          <p>Manage your caretakers and emergency contacts</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <div className="card-header">
              <h2>Your Contacts ({caretakers.length})</h2>
              <Button 
                onClick={() => setShowForm(!showForm)}
                variant="secondary"
              >
                <Plus size={20} />
                {showForm ? 'Cancel' : 'Add Contact'}
              </Button>
            </div>

            {showForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="caretaker-form"
              >
                <div className="form-grid">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />

                  <Input
                    label="Relationship"
                    value={formData.relationship_type}
                    onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
                    placeholder="Family, Friend, Doctor"
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="share_on_recovery"
                    checked={formData.share_on_recovery}
                    onChange={(e) => setFormData({ ...formData, share_on_recovery: e.target.checked })}
                  />
                  <label htmlFor="share_on_recovery">
                    Notify this contact when recovery mode is activated
                  </label>
                </div>

                <div className="form-actions">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (editingId ? 'Update Contact' : 'Add Contact')}
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

        <div className="caretakers-grid">
          {caretakers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="empty-state">
                <Users size={48} className="empty-icon" />
                <h3>No Emergency Contacts Yet</h3>
                <p>Add your first emergency contact to get started</p>
              </Card>
            </motion.div>
          ) : (
            caretakers.map((caretaker, index) => (
              <motion.div
                key={caretaker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 2) }}
              >
                <Card className="caretaker-card">
                  <div className="caretaker-header-row">
                    <div className="caretaker-info">
                      <h3>{caretaker.name}</h3>
                      <span className="relationship-badge">{caretaker.relationship_type}</span>
                    </div>
                    <div className="caretaker-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(caretaker)}
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(caretaker.id)}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="caretaker-details">
                    <div className="detail-item">
                      <Phone size={16} />
                      <span>{caretaker.phone}</span>
                    </div>
                    <div className="detail-item">
                      <Mail size={16} />
                      <span>{caretaker.email}</span>
                    </div>
                    {caretaker.share_on_recovery && (
                      <div className="detail-item notify-badge">
                        <UserCheck size={16} />
                        <span>Receives recovery alerts</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </Layout>
  );
};

export default Caretaker;
