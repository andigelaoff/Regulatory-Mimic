import "./SignUp.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import googleLogo from "../assets/images/google-logo.png";
import microsoftLogo from "../assets/images/microsoft-logo.png";
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  // Regex for password validation
  const passwordRegex = /^(?=.*[A-Z])(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    let newErrors: { [key: string]: boolean } = {};

    // Field Validations
    newErrors.firstName = !firstName.trim();
    newErrors.lastName = !lastName.trim();
    newErrors.email = !email.includes("@");
    newErrors.password = !passwordRegex.test(password);
    newErrors.terms = !termsAccepted;

    // If there are errors, update state and stop submission
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    try {
      await signUp(email, password);
      navigate('/verification');
    } catch (err) {
      setErrors({ general: true });
      console.error('Sign up failed:', err);
    }
  };

  return (
    <div className="signup-container">
      <h1 className="signup-logo" onClick={() => navigate("/")}>Regulatory Agent</h1>
      <div className="signup-box">
        <h2 className="signup-text">Create an account</h2>
        <p className="signup-login-text">
          Already have an account? <a onClick={() => navigate('/login')}>Log in</a>
        </p>

        <form onSubmit={handleSignUp}>
          <div className="signup-input-group">
            <input
              type="text"
              className={`signup-input-box signup-half-width ${errors.firstName ? 'error' : ''}`}
              placeholder="First name"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setErrors((prev) => ({ ...prev, firstName: !e.target.value.trim() }));
              }}
            />
            <input
              type="text"
              className={`signup-input-box signup-half-width ${errors.lastName ? 'error' : ''}`}
              placeholder="Last name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors((prev) => ({ ...prev, lastName: !e.target.value.trim() }));
              }}
            />
          </div>

          <input
            type="email"
            className={`signup-input-box signup-full-width ${errors.email ? 'error' : ''}`}
            placeholder="Email*"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: !e.target.value.includes("@") }));
            }}
          />

          <input
            type="password"
            className={`signup-input-box signup-full-width ${errors.password ? 'error' : ''}`}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: !passwordRegex.test(e.target.value) }));
            }}
          />
          {errors.password && <p className="error-message">At least 8 letters, 1 uppercase, 1 special.</p>}

          <div className="signup-checkbox-group">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                setErrors((prev) => ({ ...prev, terms: !e.target.checked }));
              }}
            />
            <label htmlFor="terms">I agree to the <a href="/terms">Terms & Conditions</a></label>
          </div>
          <button className="signup-btn" type="submit">
            Create account
          </button>
        </form>

        <div className="signup-divider">
          <span className="signup-line"></span> Or register with <span className="signup-line"></span>
        </div>

        <div className="signup-social-login">
          <button className="signup-social-btn google-btn">
            <img src={googleLogo} alt="Google Logo" className="signup-social-icon" />
            Google
          </button>
          <button className="signup-social-btn microsoft-btn">
            <img src={microsoftLogo} alt="Microsoft Logo" className="signup-social-icon" />
            Microsoft
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
