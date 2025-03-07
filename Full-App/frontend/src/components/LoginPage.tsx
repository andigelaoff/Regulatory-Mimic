import React from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import "./LoginPage.css";
// Commented out imports since image files are missing
import googleLogo from "../assets/images/google-logo.png";
import microsoftLogo from "../assets/images/microsoft-logo.png";
import { Eye, EyeOff, AlertCircle } from "lucide-react"; // Using lucide-react

const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate('/chat'); 
    } catch (err) {
      setError('Incorrect email or password.');
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-logo" onClick={() => navigate("/")}>Regulatory Agent</h1>

      <div className="login-box">
        <h2 className="login-text">Welcome back</h2>
        <form onSubmit={handleLogin} className="login-form">

      
          <input
            type="email"
            placeholder="Email*"
            value={email}
            className="login-input-box"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

         
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password*"
              value={password}
              className="login-input-box"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="password-toggle" onClick={togglePasswordVisibility}>
              {showPassword ? <EyeOff /> : <Eye />}
            </span>
          </div>

          {/* Forgot Password Link */}
          {/* <p className="forgot-password" onClick={() => navigate('/forgot-password')}>
            Forgot password?
          </p> */}

         
          {error && (
            <p className="error-popup">
              <AlertCircle className="error-icon" /> {error}
            </p>
          )}

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <p className="login-signup-text">
          Don't have an account? <a onClick={()=>navigate('/signup')}>Sign Up</a>
        </p>

        <div className="login-divider">
          <span className="login-line"></span> OR <span className="login-line"></span>
        </div>

        <div className="login-social-login">
          <button className="login-social-btn google-btn">
            <img src={googleLogo} alt="Google Logo" className="login-social-icon" />
            Google
          </button>
          <button className="login-social-btn microsoft-btn">
            <img src={microsoftLogo} alt="Microsoft Logo" className="login-social-icon" />
            Microsoft
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
