import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Bell, Apple, FileText, BarChart3, Droplet, Moon, Dumbbell, Heart, Bot, CreditCard } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/reminders', icon: Bell, label: 'Reminders' },
    { path: '/nutrition', icon: Apple, label: 'Nutrition' },
    { path: '/health-records', icon: FileText, label: 'Health Records' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/hydration', icon: Droplet, label: 'Hydration' },
    { path: '/sleep-tracker', icon: Moon, label: 'Sleep Tracker' },
    { path: '/fitness', icon: Dumbbell, label: 'Fitness Companion' },
    { path: '/mindfulness', icon: Heart, label: 'Mindfulness' },
    { path: '/caretaker-ai', icon: Bot, label: 'CareTaker AI' },
    { path: '/billing', icon: CreditCard, label: 'Billing' }
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button 
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
