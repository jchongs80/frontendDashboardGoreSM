import React from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";

import type { PeiOeiAeiAoByIdDto } from "../PeiOeiAeiAOAction";

type Props = {
  open: boolean;
  onClose: () => void;
  data: PeiOeiAeiAoByIdDto | null;

  // Año (solo para mostrar como chip)
  anioLabel?: number | null;

  // ✅ Contexto superior
  oer?: string | null;
  aer?: string | null;
  oei?: string | null;
  aei?: string | null;
};

function safe(v?: string | null) {
  const x = (v ?? "").toString().trim();
  return x.length === 0 ? "—" : x;
}

function combo(code?: string | null, name?: string | null) {
  const c = (code ?? "").trim();
  const n = (name ?? "").trim();
  if (!c && !n) return "—";
  if (c && n) return `${c} - ${n}`;
  return c || n;
}

// estilo premium (sin Grid item/container)
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.75,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
} as const;

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
} as const;

export default function PeiOeiAeiAoDetalleModal({
  open,
  onClose,
  data,
  anioLabel,
  oer,
  aer,
  oei,
  aei,
}: Props) {
  const twoCol = {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
    gap: 1.25,
  } as const;

  const nroRegistroPoi = safe(data?.nroRegistroPoi ?? null);
  const codigoAo = safe(data?.codigoAo ?? null);
  const nombreAo = safe(data?.actividadOperativaNombre ?? null);

  const categoria = combo(data?.categoriaCodigo ?? null, data?.categoriaNombre ?? null);
  const prodProy = combo(data?.productoProyectoCodigo ?? null, data?.productoProyectoNombre ?? null);
  const funcion = combo(data?.funcionCodigo ?? null, data?.funcionNombre ?? null);
  const division = combo(data?.divisionCodigo ?? null, data?.divisionNombre ?? null);
  const grupo = combo(data?.grupoCodigo ?? null, data?.grupoNombre ?? null);
  const actPres = combo(data?.actividadPresupCodigo ?? null, data?.actividadPresupNombre ?? null);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {/* Header premium (NO reducir letra aquí) */}
      <DialogTitle
        sx={{
          pb: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(27,111,238,0.08) 0%, rgba(27,111,238,0) 100%)",
        }}
      >
        <Stack spacing={0.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccountTreeRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950, letterSpacing: 0.2 }}>
              Actividad Operativa (AO)
            </Typography>
            <Chip size="small" variant="outlined" label="Detalle" sx={{ borderRadius: 999, fontWeight: 800 }} />
          </Stack>

          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px" }}>
            AO: <b>{nombreAo}</b>
          </Typography>
        </Stack>

        <Tooltip title="Cerrar">
          <IconButton onClick={onClose} sx={{ borderRadius: 2 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <Divider />

      {/* ✅ (2) Reducir 2pt el texto dentro de TODOS los TextField (inputs) - NO afecta cabecera */}
      <DialogContent sx={{ pt: 2, "& .MuiInputBase-input": { fontSize: "12px" } }}>
        {/* Card superior: chips + OER/AER/OEI/AEI */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(248,250,255,0.9)",
            mb: 2,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
              <Chip
                icon={<TagRoundedIcon />}
                label={`Nro POI: ${nroRegistroPoi}`}
                sx={{ fontWeight: 900, borderRadius: 999 }}
                variant="outlined"
              />
              <Chip
                icon={<TagRoundedIcon />}
                label={`Código AO: ${codigoAo}`}
                sx={{ fontWeight: 800, borderRadius: 999 }}
                variant="outlined"
              />
              <Chip
                icon={<CalendarMonthRoundedIcon />}
                label={`Año: ${anioLabel ?? "—"}`}
                sx={{ fontWeight: 800, borderRadius: 999 }}
                variant="outlined"
              />
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Chip
              size="small"
              label="Resumen"
              color="success"
              variant="filled"
              sx={{ borderRadius: 999, fontWeight: 900 }}
            />
          </Stack>

          <Box sx={{ mt: 1.25 }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                whiteSpace: "pre-line",
                fontSize: "10.5px", // ✅ 12.5 - 2 = 10.5
              }}
            >
              OER: {safe(oer ?? null)}
              {"\n"}
              AER: {safe(aer ?? null)}
              {"\n"}
              OEI: {safe(oei ?? null)}
              {"\n"}
              AEI: {safe(aei ?? null)}
            </Typography>
          </Box>
        </Paper>

        {!data ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Sin datos.
          </Typography>
        ) : (
          <>
            

            {/* ✅ 2) Actividad Operativa */}
            <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ChecklistRoundedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 950 }}>Actividad Operativa</Typography>
              </Stack>

              <TextField
                label="Nombre Actividad Operativa"
                value={nombreAo}
                size="small"
                fullWidth
                multiline
                minRows={2}
                sx={{ ...fieldSx, mb: 2 }}
                InputProps={{ readOnly: true }}
              />

              {/* ✅ Actividad Sectorial (AO Sectorial) */}
              <TextField
                label="Actividad Sectorial"
                value={combo(data?.aoSectorialCodigo ?? null, data?.aoSectorialNombre ?? null)}
                size="small"
                fullWidth
                sx={fieldSx}
                InputProps={{ readOnly: true }}
              />
            </Paper>

            {/* ✅ 3) Contexto (al final) */}
            <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Inventory2RoundedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 950 }}>Contexto</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  (catálogos POI)
                </Typography>
              </Stack>

              <Box sx={twoCol}>
                <TextField
                  label="Categoría (POI)"
                  value={categoria}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Producto / Proyecto"
                  value={prodProy}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Actividad Presupuestal"
                  value={actPres}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Función"
                  value={funcion}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="División Funcional"
                  value={division}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Grupo Funcional"
                  value={grupo}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            </Paper>
          </>
        )}
      </DialogContent>

      {/* Botón CERRAR */}
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="outlined" sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}>
          CERRAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}