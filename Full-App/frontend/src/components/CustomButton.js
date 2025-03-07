import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

export default function ButtonSizes({
  children,
  variant = "outlined",
  size = "medium",
  padding,
  onClick,
  selectedColor,
  darkMode,
}) {
  return (
    <Box sx={{ "& button": { m: 1 } }}>
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        sx={{
          borderColor: selectedColor,
          color: darkMode ? "#FFF" : "#444",
          padding: padding,
          minWidth: "90%",
        }}>
        {children}
      </Button>
    </Box>
  );
}
