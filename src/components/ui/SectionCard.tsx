import { Card, CardContent, CardHeader } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import React from "react";

export default function SectionCard({
  title,
  action,
  children,
  sx,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid #E8EEF5",
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
        ...sx,
      }}
    >
      <CardHeader
        title={title}
        titleTypographyProps={{
          fontSize: 14.5,
          fontWeight: 800,
          letterSpacing: 0.1,
        }}
        action={action}
        sx={{ pb: 0.5 }}
      />
      <CardContent sx={{ pt: 1.5 }}>{children}</CardContent>
    </Card>
  );
}