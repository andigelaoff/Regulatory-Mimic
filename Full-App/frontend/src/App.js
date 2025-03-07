// import required modules
// used for managing and persisting the theme state
import React, { useEffect, useState } from "react";
// handles client-side routing in the app
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import components
import Chat from "./components/Chat";
import Home from "./components/Home";
import AuthPage from "./components/AuthPage";
import Login from "./components/Login";
import Signup from "./components/Signup";
import "./styles/global.css";
import Verification from "./components/Verification";

function App() {
  // retrieves the saved theme from localStorage
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  //toggles the light-mode class on the body element based on the selected theme
  useEffect(() => {
    document.body.classList.toggle("light-mode", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // react router setup
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;
