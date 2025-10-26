import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Heart, Activity, Users, Moon, User, ChevronDown, Menu } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          {token && (
            <button 
              className="navbar-menu-toggle"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>
          )}
          <Link to="/dashboard" className="navbar-brand">
            <Heart className="navbar-icon" size={24} />
            <span>VitaLedger</span>
          </Link>
        </div>
        
        {token && (
          <div className="navbar-content">
            <div className="navbar-links">
              <Link 
                to="/recovery" 
                className={`nav-link ${isActive('/recovery') ? 'active' : ''}`}
              >
                <Activity size={18} />
                Recovery
              </Link>
              <Link 
                to="/sleep" 
                className={`nav-link ${isActive('/sleep') ? 'active' : ''}`}
              >
                <Moon size={18} />
                Sleep
              </Link>
              <Link 
                to="/caretaker" 
                className={`nav-link ${isActive('/caretaker') ? 'active' : ''}`}
              >
                <Users size={18} />
                Emergency Contacts
              </Link>
            </div>
            <div className="navbar-actions">
              <div className="profile-dropdown">
                <button 
                  className="profile-button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <User size={20} />
                  <span>{user.name || 'Profile'}</span>
                  <ChevronDown size={16} />
                </button>
                
                {showProfileMenu && (
                  <div className="profile-menu">
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/edit-profile');
                      }}
                      className="profile-menu-item"
                    >
                      <User size={16} />
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="profile-menu-item logout-item"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
