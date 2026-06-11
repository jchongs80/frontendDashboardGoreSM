// AJUSTE_POI_AO_DETALLE_ESTILO_IGUAL_PeiAoIndicadores_20260520
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
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

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
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.18)" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.70)",
  },
  "& .MuiInputLabel-root": {
    fontSize: "11px",
    color: "rgba(71,85,105,0.92)",
    fontWeight: 700,
  },
  "& .MuiInputBase-input": {
    fontSize: "12px",
    fontWeight: 700,
    color: "#0f172a",
  },
} as const;

const fieldSxValueMinus2 = {
  ...fieldSx,
  "& .MuiInputBase-input": {
    fontSize: "12px",
    fontWeight: 700,
    color: "#0f172a",
  },
} as const;

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(191,219,254,0.95)",
  background: "linear-gradient(180deg, rgba(239,246,255,0.58), rgba(255,255,255,0.96))",
  boxShadow: "0 10px 25px rgba(37,99,235,0.055)",
} as const;

const dialogPaperSx = {
  width: { xs: "calc(100vw - 24px)", sm: 760, md: 820 },
  maxWidth: "calc(100vw - 24px)",
  borderRadius: 4,
  overflow: "hidden",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.96) 100%)",
  boxShadow: "0 24px 70px rgba(15,23,42,0.24)",
} as const;

const headerIconSx = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  color: "#2563eb",
  background: "linear-gradient(135deg, rgba(219,234,254,.95), rgba(255,255,255,.92))",
  border: "1px solid rgba(59,130,246,.24)",
  boxShadow: "0 12px 26px rgba(37,99,235,.13)",
  flexShrink: 0,
} as const;

const summaryCardSx = {
  p: { xs: 2.0, md: 2.35 },
  mb: 2.25,
  borderRadius: 3,
  border: "1px solid rgba(148,163,184,0.28)",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
} as const;

const blueSectionCardSx = {
  ...sectionCardSx,
  border: "1px solid rgba(191,219,254,.95)",
  background: "linear-gradient(180deg, rgba(239,246,255,.62), rgba(255,255,255,.95))",
  boxShadow: "0 12px 28px rgba(37,99,235,.055)",
} as const;

const greenSectionCardSx = {
  ...sectionCardSx,
  border: "1px solid rgba(187,247,208,.92)",
  background: "linear-gradient(180deg, rgba(240,253,244,.70), rgba(255,255,255,.96))",
  boxShadow: "0 12px 28px rgba(34,197,94,.055)",
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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{ sx: dialogPaperSx }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(15,23,42,0.08)",
          background:
            "linear-gradient(90deg, rgba(239,246,255,0.96) 0%, rgba(255,255,255,0.98) 50%, rgba(255,255,255,0.94) 100%)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={headerIconSx}>
            <AccountTreeRoundedIcon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography sx={{ fontSize: 21, fontWeight: 950, letterSpacing: "-0.03em", color: "#0f172a" }}>
                Actividad Operativa (AO)
              </Typography>
              <Chip
                size="small"
                label="Detalle"
                sx={{
                  height: 26,
                  borderRadius: 999,
                  fontWeight: 950,
                  color: "#1d4ed8",
                  border: "1px solid rgba(59,130,246,.25)",
                  background: "rgba(219,234,254,.78)",
                }}
              />
            </Stack>
            <Typography sx={{ mt: 0.25, fontSize: 13, color: "#64748b", fontWeight: 600 }} noWrap>
              AO: {nombreAo}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip
            label="Resumen"
            icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#16a34a" }} />}
            sx={{
              height: 34,
              borderRadius: 2,
              fontWeight: 900,
              color: "#15803d",
              border: "1px solid rgba(34,197,94,.25)",
              background: "rgba(240,253,244,.95)",
              boxShadow: "0 8px 18px rgba(34,197,94,.08)",
              "& .MuiChip-icon": { ml: 1.1 },
            }}
          />
          <Tooltip title="Cerrar">
            <IconButton onClick={onClose} sx={{ borderRadius: 2, color: "#475569" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2.2, md: 3.2 }, py: 3, background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.88))", "& .MuiInputBase-input": { fontSize: "12px" } }}>
        {/* Card superior: datos AO + contexto OER/AER/OEI/AEI */}
        <Paper elevation={0} sx={summaryCardSx}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "88px 220px minmax(0, 1fr)" },
              gap: { xs: 1.5, md: 2 },
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                justifySelf: { xs: "start", md: "center" },
                color: "#16a34a",
                background: "linear-gradient(135deg, rgba(240,253,244,.98), rgba(255,255,255,.95))",
                border: "1px solid rgba(34,197,94,.35)",
                boxShadow: "0 14px 30px rgba(34,197,94,.12)",
              }}
            >
              <DescriptionRoundedIcon />
            </Box>

            <Stack spacing={1.05} sx={{ minWidth: 0 }}>
              <Box>
                <Typography sx={{ fontSize: 10.5, color: "#64748b", fontWeight: 800 }}>
                  Nro Registro POI
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#0f172a", fontWeight: 950 }}>
                  {nroRegistroPoi}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10.5, color: "#64748b", fontWeight: 800 }}>
                  Código AO
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#0f172a", fontWeight: 950 }}>
                  {codigoAo}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10.5, color: "#64748b", fontWeight: 800 }}>
                  Año
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#0f172a", fontWeight: 950 }}>
                  {anioLabel ?? "—"}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                minWidth: 0,
                pl: { xs: 0, md: 2 },
                borderLeft: { xs: "none", md: "1px solid rgba(148,163,184,0.45)" },
              }}
            >
              <Typography
                sx={{
                  fontSize: 11.4,
                  lineHeight: 1.55,
                  color: "#334155",
                  fontWeight: 750,
                  textTransform: "uppercase",
                }}
              >
                <Box component="span" sx={{ fontWeight: 950, color: "#0f172a" }}>OER:</Box>{" "}
                {safe(oer ?? null)}
                <br />
                <Box component="span" sx={{ fontWeight: 950, color: "#0f172a" }}>AER:</Box>{" "}
                {safe(aer ?? null)}
                <br />
                <Box component="span" sx={{ fontWeight: 950, color: "#0f172a" }}>OEI:</Box>{" "}
                {safe(oei ?? null)}
                <br />
                <Box component="span" sx={{ fontWeight: 950, color: "#0f172a" }}>AEI:</Box>{" "}
                {safe(aei ?? null)}
              </Typography>
            </Box>
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
                <ChecklistRoundedIcon fontSize="small" sx={{ color: "#2563eb" }} />
                <Typography sx={{ fontWeight: 950, color: "#1d4ed8" }}>Actividad Operativa</Typography>
              </Stack>

              <TextField
                label="Nombre Actividad Operativa"
                value={nombreAo}
                size="small"
                fullWidth
                multiline
                minRows={2}
                sx={{ ...fieldSxValueMinus2, mb: 2 }}
                InputProps={{ readOnly: true }}
              />

              {/* ✅ Actividad Sectorial (AO Sectorial) */}
              <TextField
                label="Actividad Sectorial"
                value={combo(data?.aoSectorialCodigo ?? null, data?.aoSectorialNombre ?? null)}
                size="small"
                fullWidth
                sx={fieldSxValueMinus2}
                InputProps={{ readOnly: true }}
              />
            </Paper>

            {/* ✅ 3) Contexto (al final) */}
            <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Inventory2RoundedIcon fontSize="small" sx={{ color: "#38aa1b" }} />
                <Typography sx={{ fontWeight: 950, color: "#38aa1b" }}>Cadena Presupuestal</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  (catálogos POI)
                </Typography>
              </Stack>

              <Box sx={twoCol}>
                <TextField
                  label="Categoría Prepuestal"
                  value={categoria}
                  size="small"
                  fullWidth
                  sx={fieldSxValueMinus2}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Producto / Proyecto"
                  value={prodProy}
                  size="small"
                  fullWidth
                  sx={fieldSxValueMinus2}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Actividad Presupuestal"
                  value={actPres}
                  size="small"
                  fullWidth
                  sx={fieldSxValueMinus2}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Función"
                  value={funcion}
                  size="small"
                  fullWidth
                  sx={fieldSxValueMinus2}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="División Funcional"
                  value={division}
                  size="small"
                  fullWidth
                  sx={fieldSxValueMinus2}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Grupo Funcional"
                  value={grupo}
                  size="small"
                  fullWidth
                  sx={fieldSxValueMinus2}
                  InputProps={{ readOnly: true }}
                />
              </Box>
            </Paper>
          </>
        )}
      </DialogContent>

      {/* Botón CERRAR */}
      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,.94)" }}>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="outlined" sx={{ fontWeight: 950, borderRadius: 2, px: 3.2, height: 40, color: "#0f172a", borderColor: "rgba(15,23,42,.55)", "&:hover": { borderColor: "#0f172a", background: "rgba(15,23,42,.03)" } }}>
          CERRAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}