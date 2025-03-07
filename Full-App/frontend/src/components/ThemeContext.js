import React, { createContext, useState, useEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "./theme";

export const CustomThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const CustomThemeProvider = ({ children }) => {
  // Load from localStorage or default to dark mode
  const storedTheme = localStorage.getItem("theme");
  const [darkMode, setDarkMode] = useState(
    storedTheme ? storedTheme === "dark" : true
  );

  // Toggle theme mode
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  // Apply the theme class to <body>
  useEffect(() => {
    document.body.classList.remove("light-mode", "dark-mode"); // Remove both classes first
    document.body.classList.add(darkMode ? "dark-mode" : "light-mode"); // Apply the correct one
  }, [darkMode]);

  const theme = useMemo(() => getTheme(darkMode), [darkMode]);

  return (
    <CustomThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </CustomThemeContext.Provider>
  );
};
