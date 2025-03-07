import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { CustomThemeContext } from "./ThemeContext"; // adjust path as needed

const steps = ["Create Account", "Explore Features", "Use AI Agent"];

export default function AuthPage() {
  const navigate = useNavigate();
  // Get darkMode state and toggle function from our centralized theme context
  const { darkMode, toggleDarkMode } = useContext(CustomThemeContext);
  // Access the current theme via MUI hook (provided by our CustomThemeProvider)
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);

  // Stepper Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const CustomConnector = (
    <StepConnector
      sx={{
        [`& .MuiStepConnector-line`]: {
          borderColor: theme.palette.primary.main,
          borderTopWidth: 3,
          transition: "width 0.5s ease-in-out",
          marginTop: "14px",
          marginLeft: "15px",
          marginRight: "15px",
        },
      }}
    />
  );

  const stepIcons = {
    0: <PersonAddIcon fontSize="large" />,
    1: <SearchIcon fontSize="large" />,
    2: <AutoAwesomeIcon fontSize="large" />,
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
      }}>
      {/* Navbar */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between", padding: "20px" }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: theme.palette.text.primary }}>
            AI Regulatory Agent
          </Typography>
          <Box>
            <Button
              sx={{ color: theme.palette.text.primary }}
              onClick={() => navigate("/login")}>
              Log In
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: "#000",
                marginLeft: 2,
              }}
              onClick={() => navigate("/signup")}>
              Get Started
            </Button>
            <IconButton sx={{ marginLeft: 2 }} onClick={toggleDarkMode}>
              {darkMode ? (
                <LightModeIcon sx={{ color: theme.palette.primary.main }} />
              ) : (
                <DarkModeIcon sx={{ color: theme.palette.primary.main }} />
              )}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ textAlign: "center", paddingTop: "160px" }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          sx={{ color: theme.palette.text.primary }}>
          Empower Your AI Experience
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary, marginTop: 2 }}>
          A seamless and intuitive AI platform designed for efficiency and
          productivity.
        </Typography>

        {/* Stepper Section */}
        <Box sx={{ width: "70%", margin: "auto", marginTop: 9 }}>
          <Stepper
            alternativeLabel
            activeStep={activeStep}
            connector={CustomConnector}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  icon={
                    <Box
                      sx={{
                        width: 55,
                        height: 55,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "40%",
                        backgroundColor:
                          activeStep >= index
                            ? theme.palette.success.light
                            : theme.palette.info.light,
                        color: "#FFF",
                        transition: "background-color 0.8s ease-in-out",
                      }}>
                      {stepIcons[index]}
                    </Box>
                  }>
                  <Typography
                    sx={{
                      fontWeight: activeStep === index ? "bold" : "normal",
                      color: theme.palette.text.primary,
                    }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box
          sx={{
            marginTop: 9,
            display: "flex",
            justifyContent: "center",
            gap: 2,
          }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: "#000",
              padding: "10px 20px",
            }}
            onClick={() => navigate("/signup")}>
            Get Started
          </Button>
          <Button
            variant="outlined"
            sx={{
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              padding: "10px 20px",
            }}
            onClick={() => navigate("/login")}>
            Learn More
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
