import { Card, CardContent, Box, Typography } from "@mui/material";
import React from "react";

export default function StatCard({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: { text: string; positive?: boolean };
}) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid #E8EEF5",
        boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
      }}
    >
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.6 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(14,165,164,0.10)",
            color: "primary.main",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: 12.5,
              color: "text.secondary",
              fontWeight: 700,
            }}
          >
            {label}
          </Typography>
          <Typography sx={{ fontSize: 21, fontWeight: 900 }}>
            {value}
          </Typography>
        </Box>

        {delta && (
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 800,
              color: delta.positive ? "success.main" : "error.main",
            }}
          >
            {delta.text}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}