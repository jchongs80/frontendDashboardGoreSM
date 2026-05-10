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
import TagRoundedIcon from "@mui/icons-material/TagRounded";
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
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, rgba(27,111,238,0.10) 0%, rgba(27,111,238,0) 100%)",
        }}
      >
        <Stack spacing={0.55} sx={{ pr: 2, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="nowrap">
            <InfoOutlinedIcon fontSize="small" sx={{ mt: 0.15, flexShrink: 0 }} />

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 0.45 }}
              >
                <Typography
                  sx={{
                    fontWeight: 950,
                    letterSpacing: 0.1,
                    lineHeight: 1.2,
                    fontSize: { xs: "0.98rem", sm: "1.05rem" },
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  Información del Indicador PEI
                </Typography>

                <Chip
                  size="small"
                  variant="outlined"
                  label={safeText(tipoNivel)}
                  sx={{ borderRadius: 999, fontWeight: 800 }}
                />
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: "12px",
                  mt: 0.2,
                }}
              >
                Indicador: <b>{safeText(nombreIndicador)}</b>
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Button
          onClick={onClose}
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "text.secondary",
            borderRadius: 2,
          }}
        >
          <CloseRoundedIcon />
        </Button>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
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
            p: 1.5,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(248,250,255,0.92)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            mb: 2,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                icon={<TagRoundedIcon />}
                label={`Código: ${safeText(codigoIndicador)}`}
                sx={{ fontWeight: 900, borderRadius: 999 }}
                variant="outlined"
              />
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Chip
              size="small"
              label="INFO"
              color="info"
              variant="filled"
              sx={{ borderRadius: 999, fontWeight: 900 }}
            />
          </Stack>

          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: "text.secondary",
              fontSize: "11.5px",
              lineHeight: 1.45,
            }}
          >
            Registra el análisis cualitativo del avance del indicador y las medidas
            recomendadas para mejorar su implementación.
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
          {loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Cargando información...</Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                label="¿Cuáles son los factores que contribuyeron (logro) o dificultaron (problemas) el nivel de avance del logro esperado?"
                value={factoresAvance}
                onChange={(e) => setFactoresAvance(e.target.value)}
                fullWidth
                multiline
                minRows={5}
                maxRows={10}
                sx={fieldSx}
              />

              <TextField
                label="Medidas recomendadas para mejorar la implementación"
                value={medidasRecomendadas}
                onChange={(e) => setMedidasRecomendadas(e.target.value)}
                fullWidth
                multiline
                minRows={5}
                maxRows={10}
                sx={fieldSx}
              />
            </Stack>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Box sx={{ flex: 1 }} />

        <Button
          onClick={guardarInfo}
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          disabled={loading || saving}
          sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
        >
          {saving ? "GUARDANDO..." : "GUARDAR"}
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
        >
          CERRAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}
