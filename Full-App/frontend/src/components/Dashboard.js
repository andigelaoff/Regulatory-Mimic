import React, { useContext } from "react";
import { Box, Typography, Grid2, Paper } from "@mui/material";
import { CustomThemeContext } from "./ThemeContext";
import { useTheme } from "@mui/material/styles";
import ChatIcon from "@mui/icons-material/Chat";
import DescriptionIcon from "@mui/icons-material/Description";
import TranslateIcon from "@mui/icons-material/GTranslate";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export const options = [
  {
    label: "New Chat",
    icon: (
      <ChatIcon
        fontSize="large"
        color="secondary"
        sx={{
          borderRadius: "10px",
          p: "5px",
          backgroundColor: "rgba(187, 0, 255, 0.11)",
        }}
      />
    ),
    screen: "chat",
    prompt: "",
  },
  {
    label: "Generate Document",
    icon: (
      <DescriptionIcon
        fontSize="large"
        color="error"
        sx={{
          borderRadius: "10px",
          p: "5px",
          backgroundColor: "rgba(255, 0, 0, 0.11)",
        }}
      />
    ),
    screen: "chat",
    prompt: "Generate a document about ",
  },
  {
    label: "Translate",
    icon: (
      <TranslateIcon
        fontSize="large"
        color="success"
        sx={{
          borderRadius: "10px",
          p: "5px",
          backgroundColor: "rgba(60, 255, 0, 0.11)",
        }}
      />
    ),
    screen: "chat",
    prompt: "Translate this to ",
  },
  {
    label: "Regulatory Guidelines",
    icon: (
      <MenuBookIcon
        fontSize="large"
        color="primary"
        sx={{
          borderRadius: "10px",
          p: "5px",
          backgroundColor: "rgba(255, 153, 0, 0.11)",
        }}
      />
    ),
    screen: "chat",
    prompt: "Provide regulatory guidelines for ",
  },
];

export default function Dashboard({ setActiveScreen, setInput }) {
  const { darkMode } = useContext(CustomThemeContext);
  const theme = useTheme();

  const handleCardClick = (screen, prompt) => {
    setActiveScreen("chat");
    setTimeout(() => {
      if (setInput) setInput(prompt);
    }, 0);
  };

  return (
    <Box
      sx={{
        backgroundColor: darkMode ? "#181818" : "#fFFFFF",
        color: theme.palette.text.primary,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
      {/* Title */}
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{
          color: theme.palette.text.primary,
          mb: 3,
          textAlign: "center",
        }}>
        What can I help you with?
      </Typography>

      {/* Cards Container */}
      <Grid2
        container
        spacing={2}
        justifyContent="center"
        sx={{ maxWidth: "900px" }}>
        {options.map(({ label, icon, screen, prompt }) => (
          <Grid2 item xs={12} sm={6} md={3} key={screen}>
            <Paper
              elevation={3}
              onClick={() => handleCardClick(screen, prompt)}
              sx={{
                backgroundColor: darkMode ? "#252A34" : "#F5F5F5",
                color: theme.palette.text.primary,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "18px",
                textAlign: "center",
                cursor: "pointer",
                transition: "transform 0.1s ease, filter 0.1s ease",
                "&:hover": {
                  transform: "scale(1.03)",
                  filter: "brightness(1.05)",
                },
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                width: "150px",
                height: "130px",
              }}>
              {icon}
              <Typography variant="subtitle2" fontWeight="bold">
                {label}
              </Typography>
            </Paper>
          </Grid2>
        ))}
      </Grid2>
    </Box>
  );
}
