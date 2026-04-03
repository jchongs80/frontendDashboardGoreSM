import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      sx={{
        py: 2,
        px: { xs: 2, md: 3 },
        borderTop: "1px solid #E8EEF5",
        bgcolor: "background.paper",
      }}
    >
      <Typography
        sx={{
          fontSize: 12.5,
          color: "text.secondary",
          textAlign: "center",
        }}
      >
        © {new Date().getFullYear()} Dashboard. Gobierno Regional de San Martín
      </Typography>
    </Box>
  );
}