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
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import { PeiOeiAeiVistaAction } from "../PeiOeiAeiVistaAction";

type Props = {
  open: boolean;
  onClose: () => void;
  idPeiOeiAei: number;
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

export default function PeiIndicadorInfoModal({
  open,
  onClose,
  idPeiOeiAei,
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
    if (!idPeiOeiAei || !idIndicadorNombre) {
      setFactoresAvance("");
      setMedidasRecomendadas("");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const info = await PeiOeiAeiVistaAction.getIndicadorInfo(
        idPeiOeiAei,
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
  }, [open, idPeiOeiAei, idIndicadorNombre]);

  async function guardarInfo() {
    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await PeiOeiAeiVistaAction.guardarIndicadorInfo({
        idPeiOeiAei,
        idIndicadorNombre,
        factoresAvance,
        medidasRecomendadas,
      });

      setSuccessMsg(
        "La información del indicador PEI se guardó correctamente.",
      );
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog
      open={open}
      onClose={onClose}
      fullWidth={false}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: "calc(100vw - 24px)", md: 820, lg: 900 },
          maxWidth: "calc(100vw - 24px)",
          borderRadius: 4,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(248,251,255,.96) 100%)",
          boxShadow: "0 24px 70px rgba(15,23,42,.22)",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(15,23,42,.08)",
          background:
            "linear-gradient(90deg, rgba(239,246,255,.95) 0%, rgba(255,255,255,.98) 55%, rgba(255,255,255,.95) 100%)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#2563eb",
              background: "linear-gradient(135deg, rgba(219,234,254,.95), rgba(255,255,255,.92))",
              border: "1px solid rgba(37,99,235,.22)",
              flexShrink: 0,
            }}
          >
            <InfoOutlinedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography sx={{ fontSize: 20, fontWeight: 950, letterSpacing: "-0.03em", color: "#0f172a" }}>
                Información del Indicador PEI
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={safeText(tipoNivel)}
                sx={{ height: 24, borderRadius: 999, fontWeight: 950, color: "#15803d", background: "rgba(240,253,244,.9)", borderColor: "rgba(34,197,94,.25)" }}
              />
            </Stack>
            <Typography sx={{ mt: 0.25, fontSize: 12.5, color: "#64748b", fontWeight: 650 }} noWrap>
              Indicador: {safeText(nombreIndicador)}
            </Typography>
          </Box>
        </Stack>

        <Button onClick={onClose} sx={{ minWidth: "auto", p: 0.7, color: "#475569", borderRadius: 2 }}>
          <CloseRoundedIcon />
        </Button>
      </DialogTitle>

      <DialogContent
        sx={{
          px: { xs: 2.2, md: 3 },
          py: 3,
          background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.86))",
        }}
      >
        {errorMsg ? <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert> : null}
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
            p: 2.4,
            borderRadius: 3,
            border: "1px solid rgba(191,219,254,.9)",
            background: "linear-gradient(180deg, rgba(239,246,255,.55), rgba(255,255,255,.95))",
            boxShadow: "0 14px 34px rgba(15,23,42,.06)",
          }}
        >
          {loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography sx={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>Cargando información...</Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Box>
                <Typography sx={{ mb: 0.8, fontSize: 14.5, color: "#1d4ed8", fontWeight: 950 }}>
                  Análisis del avance
                </Typography>
                <TextField
                  label="¿Cuáles son los factores que contribuyeron (logro) o dificultaron (problemas) el nivel de avance del logro esperado?"
                  value={factoresAvance}
                  onChange={(e) => setFactoresAvance(e.target.value)}
                  fullWidth
                  multiline
                  minRows={6}
                  maxRows={12}
                  sx={premiumTextAreaSx}
                />
              </Box>

              <Box>
                <Typography sx={{ mb: 0.8, fontSize: 14.5, color: "#1d4ed8", fontWeight: 950 }}>
                  Recomendaciones
                </Typography>
                <TextField
                  label="Medidas recomendadas para mejorar la implementación"
                  value={medidasRecomendadas}
                  onChange={(e) => setMedidasRecomendadas(e.target.value)}
                  fullWidth
                  multiline
                  minRows={6}
                  maxRows={12}
                  sx={premiumTextAreaSx}
                />
              </Box>
            </Stack>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.2, md: 3 }, py: 2.2, borderTop: "1px solid rgba(15,23,42,.08)", background: "rgba(255,255,255,.9)" }}>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={guardarInfo}
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          disabled={loading || saving}
          sx={{ minWidth: 150, height: 42, fontWeight: 950, borderRadius: 2.2, boxShadow: "0 12px 22px rgba(37,99,235,.24)" }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </Button>
        <Button onClick={onClose} variant="outlined" sx={{ minWidth: 130, height: 42, fontWeight: 900, borderRadius: 2.2 }}>
          Cerrar
        </Button>
      </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(successMsg)}
        autoHideDuration={3000}
        onClose={(_event, reason) => {
          if (reason === "clickaway") return;
          setSuccessMsg("");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMsg("")}
          sx={{
            width: "100%",
            minWidth: { xs: 280, sm: 450 },
            borderRadius: 2,
            fontWeight: 900,
            boxShadow: "0 14px 35px rgba(15,23,42,.22)",
          }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

const premiumTextAreaSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,.96)",
    alignItems: "flex-start",
  },
  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 750,
    color: "#64748b",
  },
  "& .MuiInputBase-input": {
    fontSize: 13.5,
    lineHeight: 1.55,
    color: "#0f172a",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148,163,184,.34)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,.72)",
  },
} as const;