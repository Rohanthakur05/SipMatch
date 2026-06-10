import { useState } from 'react';
import './Button.css';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  icon,
  iconRight,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) {
  const [ripple, setRipple] = useState(false);

  const handleClick = (e) => {
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''} ${ripple ? 'btn-ripple' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {icon && !loading && <span className="btn-icon">{icon}</span>}
      <span className="btn-text">{children}</span>
      {iconRight && <span className="btn-icon-right">{iconRight}</span>}
    </button>
  );
}
