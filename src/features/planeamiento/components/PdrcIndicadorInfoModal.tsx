import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import { PdrcOerAerVistaAction } from "../PdrcOerAerVistaAction";

type Props = {
  open: boolean;
  onClose: () => void;
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  tipoNivel?: string | null;
};

function safeText(value?: string | null): string {
  const txt = (value ?? "").toString().trim();
  return txt.length === 0 ? "—" : txt;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Error no controlado.";
  }
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0,0,0,0.18)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.7)",
  },
} as const;

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 10px 24px rgba(0,0,0,.06)",
} as const;

export default function PdrcIndicadorInfoModal({
  open,
  onClose,
  idPdrcOerAer,
  idIndicadorNombre,
  codigoIndicador,
  nombreIndicador,
  tipoNivel,
}: Props): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const [factoresAvance, setFactoresAvance] = useState<string>("");
  const [medidasRecomendadas, setMedidasRecomendadas] = useState<string>("");

  const loadInfo = async () => {
    if (!idPdrcOerAer || !idIndicadorNombre) {
      setFactoresAvance("");
      setMedidasRecomendadas("");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const info = await PdrcOerAerVistaAction.getIndicadorInfo(
        idPdrcOerAer,
        idIndicadorNombre
      );

      setFactoresAvance(info?.factoresAvance ?? "");
      setMedidasRecomendadas(info?.medidasRecomendadas ?? "");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
      setFactoresAvance("");
      setMedidasRecomendadas("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadInfo();
  }, [open, idPdrcOerAer, idIndicadorNombre]);

  async function guardarInfo() {
    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await PdrcOerAerVistaAction.guardarIndicadorInfo({
        idPdrcOerAer,
        idIndicadorNombre,
        factoresAvance,
        medidasRecomendadas,
      });

      setSuccessMsg("Información guardada correctamente.");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          width: { xs: "96vw", sm: "90vw", md: 760 },
          maxWidth: "760px",
          boxShadow: "0 24px 70px rgba(15,23,42,.22)",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.4,
          py: 1.7,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(239,246,255,.95), rgba(255,255,255,.96))",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#2563eb",
              background: "linear-gradient(135deg, rgba(219,234,254,.95), rgba(255,255,255,.92))",
              border: "1px solid rgba(37,99,235,.22)",
              boxShadow: "0 10px 22px rgba(37,99,235,.12)",
              flexShrink: 0,
            }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography sx={{ fontSize: 18, fontWeight: 950, letterSpacing: "-0.02em", color: "#0f172a" }}>
                Información del Indicador PDRC
              </Typography>
              <Chip
                size="small"
                label={safeText(tipoNivel)}
                sx={{
                  height: 24,
                  borderRadius: 999,
                  fontWeight: 950,
                  color: "#2563eb",
                  border: "1px solid rgba(37,99,235,.22)",
                  background: "rgba(239,246,255,.9)",
                }}
              />
            </Stack>
            <Typography sx={{ mt: 0.25, fontSize: 12.2, color: "#64748b", fontWeight: 700 }} noWrap>
              Indicador: {safeText(nombreIndicador)}
            </Typography>
          </Box>
        </Stack>

        <Button onClick={onClose} sx={{ minWidth: "auto", p: 0.7, color: "#475569", borderRadius: 2 }}>
          <CloseRoundedIcon />
        </Button>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 2.4, background: "linear-gradient(180deg, rgba(255,255,255,.95), rgba(248,250,252,.88))" }}>
        {errorMsg ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        ) : null}

        {successMsg ? (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {successMsg}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            border: "1px solid rgba(148,163,184,.28)",
            background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.96))",
            boxShadow: "0 10px 28px rgba(15,23,42,.05)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "64px 142px 1px 1fr" },
              gap: { xs: 1.4, sm: 2 },
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#15803d",
                background: "linear-gradient(135deg, rgba(220,252,231,.95), rgba(255,255,255,.92))",
                border: "1px solid rgba(34,197,94,.25)",
                boxShadow: "0 12px 26px rgba(34,197,94,.12)",
              }}
            >
              <DescriptionRoundedIcon />
            </Box>

            <Box>
              <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 900 }}>Código</Typography>
              <Typography sx={{ mt: 0.45, fontSize: 14, color: "#0f172a", fontWeight: 950 }}>
                {safeText(codigoIndicador)}
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={0.8} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography sx={{ fontSize: 12, color: "#334155", fontWeight: 950 }}>
                  Nivel: {safeText(tipoNivel)}
                </Typography>
                <Chip
                  size="small"
                  label="INFO"
                  sx={{
                    height: 22,
                    borderRadius: 999,
                    fontWeight: 950,
                    color: "#0369a1",
                    background: "rgba(224,242,254,.95)",
                    border: "1px solid rgba(14,165,233,.22)",
                  }}
                />
              </Stack>
              <Typography sx={{ mt: 0.55, color: "#475569", fontSize: 12, fontWeight: 750, lineHeight: 1.45 }}>
                Indicador: {safeText(nombreIndicador)}
              </Typography>
              <Typography sx={{ mt: 0.6, color: "#64748b", fontSize: 12, fontWeight: 650, lineHeight: 1.45 }}>
                Registra el análisis cualitativo del avance del indicador y las medidas recomendadas para mejorar su implementación.
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: 3,
            border: "1px solid rgba(191,219,254,.9)",
            background: "linear-gradient(180deg, rgba(239,246,255,.55), rgba(255,255,255,.96))",
            boxShadow: "0 12px 28px rgba(37,99,235,.06)",
          }}
        >
          {loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Cargando información...</Typography>
            </Stack>
          ) : (
            <Stack spacing={2.2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 18, color: "#2563eb" }} />
                  <Typography sx={{ fontSize: 15, fontWeight: 950, color: "#1d4ed8" }}>Análisis del avance</Typography>
                </Stack>
                <TextField
                  label="¿Cuáles son los factores que contribuyeron (logro) o dificultaron (problemas) el nivel de avance del logro esperado?"
                  value={factoresAvance}
                  onChange={(e) => setFactoresAvance(e.target.value)}
                  fullWidth
                  multiline
                  minRows={5}
                  maxRows={10}
                  sx={premiumInfoFieldSx}
                />
              </Box>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 18, color: "#2563eb" }} />
                  <Typography sx={{ fontSize: 15, fontWeight: 950, color: "#1d4ed8" }}>Recomendaciones</Typography>
                </Stack>
                <TextField
                  label="Medidas recomendadas para mejorar la implementación"
                  value={medidasRecomendadas}
                  onChange={(e) => setMedidasRecomendadas(e.target.value)}
                  fullWidth
                  multiline
                  minRows={5}
                  maxRows={10}
                  sx={premiumInfoFieldSx}
                />
              </Box>
            </Stack>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 2.4, py: 2, borderTop: "1px solid rgba(15,23,42,.08)", background: "rgba(255,255,255,.82)" }}>
        <Box sx={{ flex: 1 }} />

        <Button
          onClick={guardarInfo}
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          disabled={loading || saving}
          sx={{ minWidth: 140, height: 42, fontWeight: 950, borderRadius: 2.2 }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ minWidth: 120, height: 42, fontWeight: 900, borderRadius: 2.2 }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const premiumInfoFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.4,
    backgroundColor: "rgba(255,255,255,.96)",
    fontWeight: 700,
  },
  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148,163,184,.38)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,.70)",
  },
} as const;
