import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppProvider } from "@toolpad/core/AppProvider";
import {
  Box,
  Button,
  Container,
  Grid2,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { CustomThemeContext } from "./ThemeContext";
import LockIcon from "@mui/icons-material/Lock";
import { verifyCode } from "../services/api";

export default function Verification() {
  const navigate = useNavigate();
  const { darkMode } = useContext(CustomThemeContext);
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(localStorage.getItem("email"));
  }, []);

  const handleVerifyCode = async () => {
    const response = await verifyCode(email, code);
    if (response.error) {
      setError("Invalid verification code");
    } else {
      alert("Account verified successfully");
      navigate("/home");
    }
  };

  return (
    <AppProvider theme={theme}>
      <Grid2 container sx={{ minHeight: "100vh" }}>
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
            flexBasis: "100%",
          }}>
          <Container maxWidth="xs">
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ mb: "10px", color: theme.palette.text.primary }}
                fontWeight="bold">
                Verify Your Account
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 3, color: theme.palette.text.secondary }}>
                Enter the verification code sent to your email.
              </Typography>
            </Box>

            {error && <Typography color="error">{error}</Typography>}

            <TextField
              fullWidth
              label="Verification Code"
              margin="dense"
              size="small"
              onChange={(e) => setCode(e.target.value)}
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
              onClick={handleVerifyCode}>
              VERIFY CODE
            </Button>
          </Container>
        </Grid2>
      </Grid2>
    </AppProvider>
  );
}