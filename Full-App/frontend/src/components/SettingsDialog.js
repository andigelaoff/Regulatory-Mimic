import React, { useContext } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { FaCog } from "react-icons/fa";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { CustomThemeContext } from "./ThemeContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

export default function SettingsDialog({
  open,
  handleClose,
  selectedColor,
  setSelectedColor,
}) {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(CustomThemeContext);

  const theme = useTheme();
  const handleLogout = () => {
    navigate("/login");
  };

  const handleColorChange = (color) => {
    if (setSelectedColor) {
      setSelectedColor(color);
      localStorage.setItem("primaryColor", color);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="settings-dialog"
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: darkMode ? "#333" : "#FFF",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.3)",
          maxWidth: "530px",
        },
      }}>
      <DialogTitle
        className="dialog-title"
        sx={{
          textAlign: "center",
          fontSize: "22px",
          fontWeight: "bold",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}>
        <FaCog className="settings-icon" style={{ color: selectedColor }} />
        <Typography variant="h6">Settings</Typography>
      </DialogTitle>

      <DialogContent className="dialog-content" sx={{ padding: "16px 24px" }}>
        {/* Theme Selection Row */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          sx={{ padding: "4px 0" }}>
          {" "}
          <Typography variant="body1" fontWeight="bold">
            Change theme
          </Typography>
          <IconButton onClick={toggleDarkMode}>
            {darkMode ? (
              <LightModeIcon
                sx={{ color: theme.palette.primary.main, fontSize: "28px" }}
              />
            ) : (
              <DarkModeIcon
                sx={{ color: theme.palette.primary.main, fontSize: "28px" }}
              />
            )}
          </IconButton>
        </Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          sx={{ padding: "4px 0" }}>
          {" "}
          <Typography variant="body1" fontWeight="bold">
            Log out to safely exit and end your active session
          </Typography>
          <Button
            onClick={handleLogout}
            sx={{
              color: selectedColor,
              border: `2px solid ${selectedColor}`,
              fontWeight: "bold",
              fontSize: "16px",
              padding: "10px 24px",
              borderRadius: "8px",
              width: "137px",
            }}>
            LOG OUT
          </Button>
        </Box>
      </DialogContent>

      {/* Buttons */}
      <DialogActions
        className="dialog-actions"
        sx={{ padding: "16px 24px", justifyContent: "end" }}>
        <Button
          onClick={handleClose}
          sx={{
            color: selectedColor,
            border: `2px solid ${selectedColor}`,
            fontWeight: "bold",
            fontSize: "16px",
            padding: "10px 24px",
            borderRadius: "8px",
          }}>
          CLOSE
        </Button>
      </DialogActions>
    </Dialog>
  );
}
