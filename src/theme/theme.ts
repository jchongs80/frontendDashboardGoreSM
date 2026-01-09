import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0EA5A4" },     // TEAL principal (Vexel-like)
    secondary: { main: "#22C55E" },   // verde para positivos (opcional)
    info: { main: "#38BDF8" },        // celeste para serie 2 (charts)
    warning: { main: "#F59E0B" },     // naranja
    error: { main: "#EF4444" },
    background: {
      default: "#F3F6FB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ["Inter", "system-ui", "Segoe UI", "Roboto", "Arial"].join(","),
    h6: { fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #EEF2F7",
          boxShadow: "0 10px 22px rgba(16,24,40,0.06)",
        },
      },
    },
    MuiInputLabel: {
    styleOverrides: {
      root: {
        lineHeight: 1.2,
        overflow: "visible",
      },
    },
  },
  MuiFormLabel: {
    styleOverrides: {
      root: {
        lineHeight: 1.2,
        overflow: "visible",
      },
    },
  },
  },
});

export default theme;