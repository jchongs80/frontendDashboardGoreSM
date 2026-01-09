import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      sx={{
        py: 2,
        px: { xs: 2, md: 3 },
        borderTop: "1px solid #EEF2F7",
        bgcolor: "background.paper",
      }}
    >
      <Typography sx={{ fontSize: 12.5, color: "text.secondary", textAlign: "center" }}>
        Copyright © {new Date().getFullYear()} Dashboard. Gobierno Regional de San Martin
      </Typography>
    </Box>
  );
}