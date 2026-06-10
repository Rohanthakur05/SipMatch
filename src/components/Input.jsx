import { useState } from 'react';
import './Input.css';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon,
  iconRight,
  fullWidth = true,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-full' : ''} ${error ? 'input-error' : ''} ${focused ? 'input-focused' : ''} ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="input-field"
          {...props}
        />
        {type === 'password' && (
          <button
            type="button"
            className="input-toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        )}
        {iconRight && <span className="input-icon-right">{iconRight}</span>}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
