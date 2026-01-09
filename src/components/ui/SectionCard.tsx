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
    <Card sx={sx}>
      <CardHeader
        title={title}
        titleTypographyProps={{ fontSize: 14, fontWeight: 800 }}
        action={action}
        sx={{ pb: 0.5 }}
      />
      <CardContent sx={{ pt: 1.5 }}>{children}</CardContent>
    </Card>
  );
}