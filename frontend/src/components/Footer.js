import React from 'react';
import { Mail, Linkedin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-text">
          Created by <span className="creator-name">Venkata Sai Krishna Aditya Vatturi</span>
        </p>
        <div className="footer-links">
          <a 
            href="mailto:vvatturi@horizon.csueastbay.edu" 
            className="footer-link"
            aria-label="Email"
            title="vvatturi@horizon.csueastbay.edu"
          >
            <Mail size={20} />
          </a>
          <a 
            href="https://www.linkedin.com/in/vvs-krishna-aditya-2002vvsk/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="LinkedIn Profile"
          >
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
