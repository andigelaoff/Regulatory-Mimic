import React from 'react';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Importing icons
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setTimeout(() => {
      navigate("/verification");
    }, 3000);
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h2>Reset Your Password</h2>
        <p>Enter your email and new password.</p>
        
        <form onSubmit={handleResetPassword}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            className="forgot-password-input"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-container">
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              className="forgot-password-input"
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <span className="password-toggle" onClick={toggleNewPasswordVisibility}>
              {showNewPassword ? <EyeOff /> : <Eye />}
            </span>
          </div>
          <div className="password-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              className="forgot-password-input"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <span className="password-toggle" onClick={toggleConfirmPasswordVisibility}>
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </span>
          </div>

          <button type="submit" className="reset-password-btn">
            Continue
          </button>
        </form>

        {message && <p className="reset-message">{message}</p>}

        <p className="back-to-login" onClick={() => navigate("/login")}>
          Back to Login
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
