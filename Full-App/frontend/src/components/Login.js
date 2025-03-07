import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppProvider } from "@toolpad/core/AppProvider";
import {
  Box,
  Button,
  Container,
  Divider,
  Grid2,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import { CustomThemeContext } from "./ThemeContext";
import { login } from "../services/api";

import LeftPanel from "./LeftPanel";

const providers = [
  { id: "google", name: "Google", icon: <GoogleIcon fontSize="small" /> },
  { id: "github", name: "GitHub", icon: <GitHubIcon fontSize="small" /> },
];

export default function Login() {
  const navigate = useNavigate();
  // const [darkMode, setDarkMode] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(CustomThemeContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Custom theme
  const theme = useTheme();

  const handleLogin = async () => {
    const response = await login(email, password);
    if (response.error) {
      console.error(response.error);
      if (response.error ) {
        setError("Invalid email or password");
      } 
      
    } else {
      navigate("/home");
    }
  }

  return (
    <AppProvider theme={theme}>
      <Grid2 container sx={{ minHeight: "100vh" }}>
        {/* Left Side - Info Section */}
        <LeftPanel darkMode={darkMode} />

        {/* Right Side - Login Form */}
        <Grid2
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 4,
            backgroundColor: theme.palette.background.paper,
            position: "relative",
            flexBasis: "50%",
          }}>
          <IconButton
            sx={{ position: "absolute", top: 16, right: 16 }}
            onClick={toggleDarkMode}>
            {darkMode ? (
              <LightModeIcon sx={{ color: theme.palette.primary.main }} />
            ) : (
              <DarkModeIcon sx={{ color: theme.palette.primary.main }} />
            )}
          </IconButton>

          <Container maxWidth="xs">
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ mb: "10px", color: theme.palette.text.primary }}
                fontWeight="bold">
                Sign In
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 3, color: theme.palette.text.secondary }}>
                Welcome back! Please enter your details.
              </Typography>
            </Box>

            {/* Social Login Buttons */}
            {providers.map((provider) => (
              <Button
                key={provider.id}
                variant="outlined"
                fullWidth
                startIcon={provider.icon}
                sx={{
                  mb: 1,
                  padding: "12px",
                  borderColor: theme.palette.divider,
                  fontSize: "14px",
                  textTransform: "none",
                  fontWeight: "500",
                  color: theme.palette.text.primary,
                }}
                onClick={() => console.log(`Sign in with ${provider.name}`)}>
                Sign in with {provider.name}
              </Button>
            ))}

            <Divider sx={{ my: 3, color: darkMode ? "#fff" : "#666" }}>
              or
            </Divider>

            {/* Login Form */}
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="dense"
              size="small"
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: theme.palette.text.disabled }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="dense"
              size="small"
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: theme.palette.text.disabled }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                backgroundColor: theme.palette.primary.main,
                color: darkMode ? "#FFF" : "#444",
                padding: "12px",
                fontSize: "14px",
              }}
              onClick={() => handleLogin()}>
              SIGN IN
            </Button>
            {error && <Typography color="error">{error}</Typography>}


            {/* Sign Up Link */}
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                textAlign: "center",
                color: darkMode ? "#fff" : "#666",
              }}>
              Don’t have an account?{" "}
              <Button
                variant="text"
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.primary.main,
                }}
                onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </Typography>
          </Container>
        </Grid2>
      </Grid2>
    </AppProvider>
  );
}
