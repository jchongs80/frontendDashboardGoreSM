import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { DimensionDto } from "../CatalogoAction";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 800, mt: 0.3 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function DimensionViewDialog({
  open,
  onClose,
  row,
}: {
  open: boolean;
  onClose: () => void;
  row: DimensionDto | null;
}) {
  if (!row) return null;

  const color = (row.color ?? "").trim();
  const safeColor = /^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : "#E5E7EB";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            Detalle de Dimensión
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            Vista solo lectura
          </Typography>
        </Box>

        <IconButton onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid #EEF2F7",
            bgcolor: "#FAFBFD",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: safeColor,
              border: "1px solid rgba(0,0,0,.08)",
              boxShadow: "0 10px 22px rgba(2,6,23,.08)",
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
              {row.nombre}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
              Código: {row.codigo}
            </Typography>
          </Box>

          <Chip
            label={row.estado}
            sx={{
              fontWeight: 900,
              borderRadius: 999,
              bgcolor: row.estado === "ACTIVO" ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)",
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Field label="Código" value={row.codigo} />
          <Field label="Orden" value={row.orden ?? "-"} />
          <Field label="Color" value={color || "-"} />
          <Field label="Icono" value={row.icono || "-"} />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Field label="Descripción" value={row.descripcion || "-"} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}