import React, { useState, useContext, useEffect } from "react";
import { CustomThemeContext } from "./ThemeContext";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, TextField, InputAdornment, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Button } from "@mui/material";
import SortIcon from '@mui/icons-material/Sort';
import AddIcon from '@mui/icons-material/Add';
import CustomButton from "./CustomButton";
import SettingsDialog from "./SettingsDialog";
import axios from "axios"; // Import axios

export default function Sidebar({ setNewChat, isOpen, toggleSidebar }) {
  const { darkMode } = useContext(CustomThemeContext);
  const theme = useTheme();
  const [openSettings, setOpenSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions, setSessions] = useState([]); // State to store sessions from DynamoDB
  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  // Fetch sessions from DynamoDB when the component mounts
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        console.log("Fetching sessions...");
        const response = await axios.get(`${apiUrl}/api/sessions`); // Use full backend URL
        console.log("Fetched sessions:", response.data); // Log the fetched data
        setSessions(response.data); // Update state with fetched sessions
      } catch (error) {
        console.error("Error fetching sessions:", error);
        if (error.response) {
          // The request was made and the server responded with a status code
          console.error("Server response data:", error.response.data);
          console.error("Server response status:", error.response.status);
          console.error("Server response headers:", error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          console.error("No response received:", error.request);
        } else {
          // Something happened in setting up the request
          console.error("Error setting up request:", error.message);
        }
      }
    };

    fetchSessions();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Filter sessions based on search term
  const filteredSessions = sessions.filter((session) =>
    session.sessionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="sidebar"
      style={{
        position: "fixed",
        top: 0,
        left: isOpen ? "0" : "-260px",
        width: "260px",
        height: "100vh",
        backgroundColor: darkMode ? "#1a1a1a" : "#EFF4F9",
        color: darkMode ? "#FFF" : "#000",
        padding: "16px",
        transition: "left 0.3s ease-in-out",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
      {/* Sidebar Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <IconButton
            onClick={() => setOpenSettings(true)}
            style={{
              borderRadius: "5px",
              padding: "5px",
            }}>
            <SettingsIcon fontSize="medium" />
          </IconButton>
        </div>
        {/* Close Button (Inside Sidebar) */}
        <IconButton onClick={toggleSidebar}>
          <CloseIcon />
        </IconButton>
      </div>

      <div>
        {/* Button for New Chat */}
        <Button
          startIcon={<AddIcon />}
          onClick={() => setNewChat(true)}
          style={{
            marginTop: "16px",
            height: "40px",
            color: "rgba(55, 57, 58)",
            borderRadius: "1.2rem",
            padding: "0.5rem 1rem",
            textTransform: "none",
            fontSize: "14px",
            fontWeight: "bold",
            margin: "1rem 0",
          }}
        >
          New Chat
        </Button>
      </div>

      {/* Chat History */}
      <Box style={{ flexGrow: 1, paddingTop: "16px", height: "80%" }}>
        <h4
          style={{
            color: theme.palette.text.secondary,
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "12px",
          }}>
          Chat History
        </h4>

        {/* Search Bar */}
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search sessions..."
          sx={{ width: "90%", marginBottom: "1rem" }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Filtered Sessions */}
        <Box
          style={{
            flexGrow: 1,
            overflowY: "scroll",
            paddingTop: "6px",
            height: "92%",
          }}
          sx={{
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(140, 127, 127, 0.81)",
              borderRadius: "18px",
            },
          }}>
          {filteredSessions.map((session) => (
            <Button
              key={session.sessionId} // Use sessionId as the key
              variant="text"
              startIcon={<SortIcon sx={{ marginRight: '.5rem' }} />}
              style={{
                color: theme.palette.text.primary,
                textTransform: "none",
                justifyContent: "flex-start",
                width: "90%",
                paddingLeft: "1rem",
                borderRadius: "1rem",
              }}
            >
              {session.sessionName}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Settings Button at Bottom */}
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          paddingBottom: "16px",
        }}></div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={openSettings}
        handleClose={() => setOpenSettings(false)}
      />
    </div>
  );
}