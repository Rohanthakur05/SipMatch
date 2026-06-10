import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    ageVerification: false,
    termsAccepted: false
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const checkPasswordStrength = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters';
    if (!/\d/.test(pass)) return 'Password must contain a number';
    if (!/[A-Z]/.test(pass)) return 'Password must contain an uppercase letter';
    return null;
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const strengthError = checkPasswordStrength(formData.password);
      if (strengthError) newErrors.password = strengthError;
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dob);
      if (age < 18) {
        newErrors.dob = 'You must be at least 18 years old to use SipMatch';
      }
    }

    if (!formData.ageVerification) {
      newErrors.ageVerification = 'You must confirm your age';
    }

    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the Terms & Conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        navigate('/onboarding');
      }, 1500);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '540px' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <Link to="/" className="auth-logo">
            <span role="img" aria-label="glasses">🥂</span> SipMatch
          </Link>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the best nightlife dating community</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              className={`form-input ${errors.fullName ? 'has-error' : ''}`}
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
            />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              className={`form-input ${errors.email ? 'has-error' : ''}`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={`form-input ${errors.password ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={`form-input ${errors.confirmPassword ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dob">Date of Birth</label>
            <input
              id="dob"
              type="date"
              name="dob"
              className={`form-input ${errors.dob ? 'has-error' : ''}`}
              value={formData.dob}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.dob && <span className="error-text">{errors.dob}</span>}
          </div>

          <div className="form-options" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.8rem', marginTop: '0.5rem' }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="ageVerification"
                className="checkbox-input"
                checked={formData.ageVerification}
                onChange={handleChange}
              />
              <span>I confirm that I am at least 18 years of age.</span>
            </label>
            {errors.ageVerification && <span className="error-text" style={{ marginTop: '-0.5rem' }}>{errors.ageVerification}</span>}
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="termsAccepted"
                className="checkbox-input"
                checked={formData.termsAccepted}
                onChange={handleChange}
              />
              <span>I agree to the <a href="#" style={{ color: 'var(--primary)' }}>Terms & Conditions</a> and <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>.</span>
            </label>
            {errors.termsAccepted && <span className="error-text" style={{ marginTop: '-0.5rem' }}>{errors.termsAccepted}</span>}
          </div>

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loading-state">
                <span className="spinner"></span> Creating Account...
              </span>
            ) : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? 
          <Link to="/login" className="auth-link">Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
