import React, { useEffect, useState, useContext } from "react";
import Chat from "./Chat";
import Dashboard from "./Dashboard";
import Sidebar from "./Sidebar";
import { FaBars } from "react-icons/fa";
import "../styles/global.css";
import { useTheme } from "@mui/material/styles";
import { CustomThemeContext } from "./ThemeContext";

function Home() {
  const { darkMode } = useContext(CustomThemeContext);
  const theme = useTheme();

  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [newChat, setNewChat] = useState(false);
  const [input, setInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleNewChat = () => {
    setNewChat(true);
    setActiveScreen("chat");
    setInput("");
  };

  return (
    <div
      className="app-container"
      style={{
        backgroundColor: darkMode ? "#181818" : theme.palette.background.paper,
        minHeight: "100vh",
        display: "flex",
      }}>
      {/* Sidebar Component */}
      <Sidebar
        setNewChat={handleNewChat}
        toggleSidebar={toggleSidebar}
        isOpen={isSidebarOpen}
      />

      <div
        className="main-content"
        style={{
          flexGrow: 1,
          transition: "margin-left 0.3s ease-in-out",
          marginLeft: isSidebarOpen ? "260px" : "0",
        }}>
        {!isSidebarOpen && (
          <div
            style={{
              position: "fixed",
              top: "15px",
              left: "10px",
              zIndex: 999,
              padding: "8px",
            }}>
            <button
              className="menu-button"
              onClick={toggleSidebar}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
              }}>
              <FaBars
                style={{ color: theme.palette.primary.main, fontSize: "20px" }}
              />
            </button>
          </div>
        )}

        {activeScreen === "dashboard" && !newChat ? (
          <Dashboard setActiveScreen={setActiveScreen} setInput={setInput} />
        ) : (
          <Chat
            setActiveScreen={setActiveScreen}
            newChat={newChat}
            setNewChat={setNewChat}
            input={input}
            setInput={setInput}
          />
        )}
      </div>
    </div>
  );
}

export default Home;
