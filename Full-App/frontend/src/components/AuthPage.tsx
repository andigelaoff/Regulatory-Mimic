import React from 'react';
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

const AuthPage = () => {
  const navigate = useNavigate(); 

  return (
    <div className="container">
      <div className="left-section">
        <div className="left-content">
          <h1 className="title">Welcome to HR Agent</h1>
        </div>
      </div>

      <div className="right-section">
        <div className="right-content">
          <h2 className="get-started">Get started</h2>
          <div className="button-group">
            <button className="btn-login" onClick={() => navigate("/login")}>Log in</button>
            <button className="btn-signup" onClick={() => navigate("/signup")}>Sign up</button>
          </div> 
          
        </div>
        
        <div className="footer">
          <a href="/terms">Terms of use</a> | <a href="/privacy">Privacy policy</a>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
