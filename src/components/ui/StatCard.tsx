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
    <Card>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(14,165,164,0.14)", // teal suave
            color: "primary.main",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 700 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 900 }}>{value}</Typography>
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