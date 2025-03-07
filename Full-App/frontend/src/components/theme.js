import { createTheme } from "@mui/material/styles";

export const getTheme = (darkMode) =>
  createTheme({
    typography: {
      fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    },
    palette: {
      mode: darkMode ? "dark" : "light",
      background: {
        default: darkMode ? "#000000" : "#F5F5F5",
        paper: darkMode ? "#202020" : "#FFFFFF",
      },
      primary: {
        main: darkMode ? "#E5EAF1" : "#3FA883",
        gray: darkMode ? "#333" : "#717475",
      },
      text: {
        primary: darkMode ? "#FFF" : "#84898c",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            // Define the hover state
            "&:hover": {
              backgroundColor: darkMode ? "#323437" : "#E5EAF1", // Adjust these colors as needed
              // color: darkMode ? "#444" : "#FFF",
            },
          },
        },
      },
    },
  });
