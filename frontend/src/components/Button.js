import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', ...props }) => {
  return (
    <button className={`button button-${variant}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
