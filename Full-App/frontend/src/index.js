// import react and reactDOM for rendering
import React from "react";
import ReactDOM from "react-dom/client";
// import main components & styles
import App from "./App";
import "./styles/global.css";
// import and wrap the app in a Theme Provider
// CustomThemeProvider manages the dark mode and light mode functionality
// ensures that the theme is applied throughout the app
import { CustomThemeProvider } from "../src/components/ThemeContext";
import "./components/ThemeContext.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CustomThemeProvider>
      <App />
    </CustomThemeProvider>
  </React.StrictMode>
);
