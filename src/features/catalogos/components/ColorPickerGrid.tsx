import { Box, Tooltip } from "@mui/material";

const PALETTE = [
  "#0EA5A4", "#10B981", "#22C55E", "#3B82F6", "#6366F1", "#8B5CF6",
  "#F59E0B", "#F97316", "#EF4444", "#EC4899", "#64748B", "#111827",
];

export default function ColorPickerGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {PALETTE.map((c) => {
        const selected = c.toLowerCase() === (value ?? "").toLowerCase();
        return (
          <Tooltip key={c} title={c} arrow>
            <Box
              onClick={() => onChange(c)}
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.5,
                bgcolor: c,
                cursor: "pointer",
                border: selected ? "2px solid #111827" : "1px solid rgba(0,0,0,.10)",
                boxShadow: selected ? "0 10px 18px rgba(2,6,23,.18)" : "none",
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}