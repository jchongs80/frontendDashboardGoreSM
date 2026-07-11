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

import { AgPoRecoInprVistaAction } from "../AgPoRecoInprVistaAction";

type Props = {
  open: boolean;
  onClose: () => void;
  idAgPoRecoInpr: number;
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
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 800,
    color: "#2563eb",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(147,197,253,0.75)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.55)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.8)",
  },
} as const;

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(147,197,253,0.85)",
  background:
    "linear-gradient(180deg, rgba(239,246,255,0.82), rgba(255,255,255,0.98))",
  boxShadow: "0 14px 34px rgba(15,23,42,.07)",
} as const;

const headerIconSx = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#2563eb",
  background:
    "linear-gradient(135deg, rgba(219,234,254,.95), rgba(255,255,255,.92))",
  border: "1px solid rgba(37,99,235,.24)",
  boxShadow: "0 12px 26px rgba(37,99,235,.12)",
} as const;

export default function AgIndicadorInfoModal({
  open,
  onClose,
  idAgPoRecoInpr,
  idIndicadorNombre,
  codigoIndicador,
  nombreIndicador,
  tipoNivel,
}: Props): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const [factoresFavorecieronAvance, setFactoresFavorecieronAvance] =
    useState<string>("");
  const [factoresRetrocesoEstancamiento, setFactoresRetrocesoEstancamiento] =
    useState<string>("");
  const [conclusiones, setConclusiones] = useState<string>("");
  const [recomendaciones, setRecomendaciones] = useState<string>("");
  const [desafios, setDesafios] = useState<string>("");
  const [fuenteVerificacion, setFuenteVerificacion] = useState<string>("");

  const loadInfo = async () => {
    if (!idAgPoRecoInpr || !idIndicadorNombre) {
      setFactoresFavorecieronAvance("");
      setFactoresRetrocesoEstancamiento("");
      setConclusiones("");
      setRecomendaciones("");
      setDesafios("");
      setFuenteVerificacion("");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const info = await AgPoRecoInprVistaAction.getIndicadorInfo(
        idAgPoRecoInpr,
        idIndicadorNombre,
      );

      setFactoresFavorecieronAvance(info?.factoresFavorecieronAvance ?? "");
      setFactoresRetrocesoEstancamiento(
        info?.factoresRetrocesoEstancamiento ?? "",
      );
      setConclusiones(info?.conclusiones ?? "");
      setRecomendaciones(info?.recomendaciones ?? "");
      setDesafios(info?.desafios ?? "");
      setFuenteVerificacion(info?.fuenteVerificacion ?? "");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
      setFactoresFavorecieronAvance("");
      setFactoresRetrocesoEstancamiento("");
      setConclusiones("");
      setRecomendaciones("");
      setDesafios("");
      setFuenteVerificacion("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadInfo();
  }, [open, idAgPoRecoInpr, idIndicadorNombre]);

  async function guardarInfo() {
    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      await AgPoRecoInprVistaAction.guardarIndicadorInfo({
        idAgPoRecoInpr,
        idIndicadorNombre,
        factoresFavorecieronAvance,
        factoresRetrocesoEstancamiento,
        conclusiones,
        recomendaciones,
        desafios,
        fuenteVerificacion,
      });

      setSuccessMsg(
        "La información del indicador AG se guardó correctamente.",
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
            "linear-gradient(90deg, rgba(239,246,255,0.96), rgba(255,255,255,0.98))",
        }}
      >
        <Stack spacing={0.55} sx={{ pr: 2, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="flex-start"
            flexWrap="nowrap"
          >
            <Box sx={headerIconSx}>
              <InfoOutlinedIcon fontSize="small" />
            </Box>

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
                  Información del Indicador AG
                </Typography>

                <Chip
                  size="small"
                  variant="outlined"
                  label={safeText(tipoNivel)}
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    color: "#2563eb",
                    borderColor: "rgba(37,99,235,.45)",
                    backgroundColor: "rgba(239,246,255,.9)",
                  }}
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

        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.6, md: 2 },
            borderRadius: 3,
            border: "1px solid rgba(203,213,225,.95)",
            background: "rgba(255,255,255,.82)",
            boxShadow: "0 10px 28px rgba(15,23,42,.05)",
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "72px 150px 1fr" },
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#15803d",
                border: "1px solid rgba(34,197,94,.25)",
                background:
                  "linear-gradient(135deg, rgba(240,253,244,.92), rgba(255,255,255,.95))",
              }}
            >
              <DescriptionRoundedIcon fontSize="large" />
            </Box>

            <Stack spacing={0.7}>
              <Typography
                sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}
              >
                Código
              </Typography>
              <Typography
                sx={{ fontSize: 14.5, color: "#0f172a", fontWeight: 950 }}
              >
                {safeText(codigoIndicador)}
              </Typography>
            </Stack>

            <Box
              sx={{
                borderLeft: {
                  xs: "none",
                  md: "1px solid rgba(148,163,184,.35)",
                },
                pl: { xs: 0, md: 3 },
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 0.8 }}
              >
                <Typography
                  sx={{ fontSize: 13, color: "#334155", fontWeight: 950 }}
                >
                  Nivel:{" "}
                  <Box component="span" sx={{ color: "#0f172a" }}>
                    {safeText(tipoNivel)}
                  </Box>
                </Typography>
                <Chip
                  size="small"
                  label="INFO"
                  color="info"
                  variant="filled"
                  sx={{ borderRadius: 999, fontWeight: 900, height: 22 }}
                />
              </Stack>
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "#475569",
                  fontWeight: 700,
                  lineHeight: 1.55,
                }}
              >
                Indicador: {safeText(nombreIndicador)}
              </Typography>
              <Typography
                sx={{
                  mt: 0.45,
                  fontSize: 11.5,
                  color: "#64748b",
                  fontWeight: 650,
                  lineHeight: 1.45,
                }}
              >
                Registra la información cualitativa del indicador AG que será
                usada en la ficha INFO y en el reporte institucional.
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <InfoOutlinedIcon fontSize="small" sx={{ color: "#2563eb" }} />
            <Typography sx={{ fontWeight: 950, color: "#2563eb" }}>
              Análisis cualitativo del indicador
            </Typography>
          </Stack>
          {loading ? (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ py: 2 }}
            >
              <CircularProgress size={18} />
              <Typography variant="body2">Cargando información...</Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <TextField
                label="Factores que favorecieron el avance o logro de los resultados"
                value={factoresFavorecieronAvance}
                onChange={(e) => setFactoresFavorecieronAvance(e.target.value)}
                fullWidth
                multiline
                minRows={4}
                maxRows={10}
                sx={fieldSx}
              />

              <TextField
                label="Factores que influenciaron en los retrocesos o estancamiento de los resultados"
                value={factoresRetrocesoEstancamiento}
                onChange={(e) =>
                  setFactoresRetrocesoEstancamiento(e.target.value)
                }
                fullWidth
                multiline
                minRows={4}
                maxRows={10}
                sx={fieldSx}
              />

              <TextField
                label="Conclusiones"
                value={conclusiones}
                onChange={(e) => setConclusiones(e.target.value)}
                fullWidth
                multiline
                minRows={4}
                maxRows={10}
                sx={fieldSx}
              />

              <TextField
                label="Recomendaciones"
                value={recomendaciones}
                onChange={(e) => setRecomendaciones(e.target.value)}
                fullWidth
                multiline
                minRows={4}
                maxRows={10}
                sx={fieldSx}
              />

              <TextField
                label="Desafíos"
                value={desafios}
                onChange={(e) => setDesafios(e.target.value)}
                fullWidth
                multiline
                minRows={4}
                maxRows={10}
                sx={fieldSx}
              />

              <TextField
                label="Fuente de verificación / link"
                value={fuenteVerificacion}
                onChange={(e) => setFuenteVerificacion(e.target.value)}
                fullWidth
                multiline
                minRows={2}
                maxRows={6}
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
          sx={{
            fontWeight: 900,
            borderRadius: 2,
            px: 3.5,
            minWidth: 130,
            boxShadow: "0 10px 22px rgba(25,118,210,.22)",
          }}
        >
          {saving ? "GUARDANDO..." : "GUARDAR"}
        </Button>

        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            fontWeight: 900,
            borderRadius: 2,
            px: 3.5,
            minWidth: 132,
            backgroundColor: "#fff",
          }}
        >
          CERRAR
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
            minWidth: { xs: 280, sm: 440 },
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