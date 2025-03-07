import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import "./ThemeToggle.css";
import React from "react";
export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(
    typeof window !== "undefined" && localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme") || "light";
      setDarkMode(storedTheme === "dark");

      if (storedTheme === "dark") {
        document.documentElement.classList.add("dark-theme");
      } else {
        document.documentElement.classList.remove("dark-theme");
      }
    }
  }, []);

  const handleToggle = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");

      if (newMode) {
        document.documentElement.classList.add("dark-theme");
      } else {
        document.documentElement.classList.remove("dark-theme");
      }

      return newMode;
    });
  };

  return (
    <div className="toggle-container" onClick={handleToggle}>
      <div className={`toggle ${darkMode ? "dark" : "light"}`}>
        <div className="toggle-circle"></div>
        <Sun className="icon sun" size={16} />
        <Moon className="icon moon" size={16} />
      </div>
    </div>
  );
}
