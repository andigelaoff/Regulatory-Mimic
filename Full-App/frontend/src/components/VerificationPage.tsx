import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Verification.css";
import { useAuth } from "../context/AuthContext";


const VerificationPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const { confirmSignUp, tempEmail } = useAuth(); 

  const handleChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 5) {
        document.getElementById(`input-${index + 1}`)?.focus();
      }
    }
  };
  
  const handleVerify = async () => {
    const enteredCode = code.join("");
    if (enteredCode.length === 6) {
      try {
        if (tempEmail) {
            await confirmSignUp(tempEmail, enteredCode);
        } else {
            throw new Error("User email is missing");
        }
        navigate("/chat"); 
      } catch (err) {
        setError("Failed to verify code. Please try again.");
      }
    } else {
      setError("Please enter a valid 6-digit code.");
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-box">
        <h2 className="verification-title">Verification Code</h2>
        <p className="verification-text">
          Enter the code sent to your email to verify your account.
        </p>
        <div className="code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`input-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              className="code-input"
            />
          ))}
        </div>
        {error && <p className="error-text">{error}</p>}

        <button className="verify-btn" onClick={handleVerify}>
          Verify account
        </button>
        <p className="support-text">
          Can't access your authentication app? <a href="#">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default VerificationPage;
