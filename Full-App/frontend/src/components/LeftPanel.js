import React from "react";
import { Box, Typography } from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useTheme } from "@mui/material/styles";

export default function LeftPanel(darkMode) {
  const theme = useTheme();
  return (
    <Box
      item
      xs={12}
      md={6}
      sx={{
        background: darkMode ? "#0D0D0D" : "#F5F5F5",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 6,
        flexBasis: "50%",
      }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ color: theme.palette.primary.main }}>
        Start your 30-day free trial
      </Typography>
      <Typography
        variant="body1"
        sx={{ mt: 1, opacity: 0.8, color: darkMode ? "#CCC" : "#333" }}>
        No credit card required
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            gap: 1,
            color: darkMode ? "#CCC" : "#333",
          }}>
          <PeopleAltIcon fontSize="small" />
          Invite unlimited colleagues
        </Typography>
        <Typography
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            gap: 1,
            color: darkMode ? "#CCC" : "#333",
          }}>
          <VisibilityIcon fontSize="small" />
          Ensure compliance with real-time insights
        </Typography>
        <Typography
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: darkMode ? "#CCC" : "#333",
          }}>
          <SecurityIcon fontSize="small" />
          Built-in security to protect your data
        </Typography>
      </Box>
    </Box>
  );
}
