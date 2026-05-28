import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  FormControl,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

import {
  CargaMasivaAction,
  type AgCargaMasivaResultadoDto,
  type CargaMasivaResultadoDto,
  type CargaMasivaValidacionDto,
  type PdrcCargaMasivaResultadoDto,
  type TipoPlantillaCarga,
} from "../CargaMasivaAction";

type RouteParams = {
  tipo?: string;
};

const tiposPermitidos = ["ag", "pdrc", "pei", "poi"] as const;
type TipoInstrumento = (typeof tiposPermitidos)[number];

type PlantillaDescarga = {
  label: string;
  fileName: string;
  url: string;
  descripcion: string;
};

type MetricCardProps = {
  label: string;
  value: number | string;
  tone?: "default" | "success" | "error" | "warning" | "info" | "primary";
};

const COLOR_VERDE_INSTITUCIONAL = "#0B5D4F";
const COLOR_VERDE_MEDIO = "#0F766E";
const COLOR_VERDE_CLARO = "#16A085";
const COLOR_VERDE_EXITO = "#15803D";
const COLOR_TEXTO_VERDE = "#064E3B";

const TIPO_PLANTILLA_LABEL: Record<TipoPlantillaCarga, string> = {
  VALOR: "Indicador Valor / Meta",
  EJECUTADO: "Indicador Ejecutado",
};

function normalizeTipo(tipo?: string): TipoInstrumento {
  const t = (tipo ?? "").trim().toLowerCase();

  return (tiposPermitidos.includes(t as TipoInstrumento)
    ? t
    : "pdrc") as TipoInstrumento;
}

function getTitulo(tipo: TipoInstrumento): string {
  switch (tipo) {
    case "ag":
      return "Carga Masiva AG";
    case "pdrc":
      return "Carga Masiva PDRC";
    case "pei":
      return "Carga Masiva PEI";
    case "poi":
      return "Carga Masiva POI";
    default:
      return "Carga Masiva";
  }
}

function getDescripcion(tipo: TipoInstrumento): string {
  switch (tipo) {
    case "pdrc":
      return "Valida y procesa objetivos, acciones, indicadores y valores del PDRC.";
    case "ag":
      return "Carga metas y ejecutados de Acuerdos de Gobernabilidad con validación previa.";
    case "pei":
      return "Carga masiva para el PEI.";
    case "poi":
      return "Carga masiva para el POI.";
    default:
      return "Sube un archivo Excel para validarlo y procesarlo.";
  }
}

function isPdrcResultado(
  resultado: CargaMasivaResultadoDto | null
): resultado is PdrcCargaMasivaResultadoDto {
  return !!resultado && "periodosInsertados" in resultado;
}

function isAgResultado(
  resultado: CargaMasivaResultadoDto | null
): resultado is AgCargaMasivaResultadoDto {
  return !!resultado && "cabecerasInsertadas" in resultado;
}

function getPlantillas(tipo: TipoInstrumento): PlantillaDescarga[] {
  switch (tipo) {
    case "pdrc":
      return [
        {
          label: "Descargar plantilla oficial PDRC",
          fileName: "Template_Carga_Masiva_PDRC.xlsx",
          url: "/plantillas/Template_Carga_Masiva_PDRC.xlsx",
          descripcion: "Incluye las hojas Indicador Valor e Indicador Ejecutado.",
        },
      ];

    case "ag":
      return [
        {
          label: "Descargar plantilla oficial AG",
          fileName: "Template_Carga_Masiva_AG.xlsx",
          url: "/plantillas/Template_Carga_Masiva_AG.xlsx",
          descripcion: "Incluye las hojas Indicador Valor e Indicador Ejecutado.",
        },
      ];

    default:
      return [];
  }
}

function descargarArchivo(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";

  const kb = bytes / 1024;

  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  return `${(kb / 1024).toFixed(2)} MB`;
}

function MetricCard({
  label,
  value,
  tone = "default",
}: MetricCardProps): React.ReactElement {
  const theme = useTheme();

  const colorMap = {
    default: theme.palette.text.secondary,
    success: COLOR_VERDE_EXITO,
    error: theme.palette.error.main,
    warning: theme.palette.warning.main,
    info: COLOR_VERDE_MEDIO,
    primary: COLOR_VERDE_INSTITUCIONAL,
  };

  const color = colorMap[tone];

  return (
    <Box
      sx={{
        p: 1.6,
        minWidth: 150,
        flex: "1 1 150px",
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(color, 0.22),
        bgcolor: alpha(color, 0.07),
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 700 }}
      >
        {label}
      </Typography>

      <Typography
        variant="h5"
        sx={{ fontWeight: 900, lineHeight: 1.1, color }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function CargaMasivaPage(): React.ReactElement {
  const theme = useTheme();
  const navigate = useNavigate();
  const { tipo } = useParams<RouteParams>();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const tipoActual = useMemo(() => normalizeTipo(tipo), [tipo]);
  const plantillas = useMemo(() => getPlantillas(tipoActual), [tipoActual]);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoPlantilla, setTipoPlantilla] =
    useState<TipoPlantillaCarga>("VALOR");

  const [validacion, setValidacion] =
    useState<CargaMasivaValidacionDto | null>(null);
  const [resultado, setResultado] =
    useState<CargaMasivaResultadoDto | null>(null);

  const [errorGeneral, setErrorGeneral] = useState<string>("");
  const [loadingValidar, setLoadingValidar] = useState<boolean>(false);
  const [loadingProcesar, setLoadingProcesar] = useState<boolean>(false);
  const [dragActivo, setDragActivo] = useState<boolean>(false);
  const [confirmarProcesar, setConfirmarProcesar] =
    useState<boolean>(false);
  const [validacionKey, setValidacionKey] = useState<string>("");

  const soportado = tipoActual === "pdrc" || tipoActual === "ag";

  const currentKey = `${tipoActual}|${tipoPlantilla}|${archivo?.name ?? ""}|${
    archivo?.size ?? 0
  }|${archivo?.lastModified ?? 0}`;

  const validacionVigente = !!validacion && validacionKey === currentKey;

  const puedeProcesar =
    !!archivo &&
    validacionVigente &&
    !!validacion?.puedeProcesar &&
    !loadingProcesar &&
    soportado;

  const activeStep = resultado ? 3 : validacionVigente ? 2 : archivo ? 1 : 0;

  const tipoPlantillaColor =
    tipoPlantilla === "VALOR" ? COLOR_VERDE_MEDIO : COLOR_VERDE_EXITO;

  const limpiarResultados = () => {
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");
    setValidacionKey("");
  };

  const setFileSeguro = (file: File | null) => {
    limpiarResultados();
    setArchivo(null);

    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext !== "xlsx") {
      setErrorGeneral("Solo se permiten archivos Excel con extensión .xlsx.");
      return;
    }

    setArchivo(file);
  };

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFileSeguro(file);
    event.target.value = "";
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActivo(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    setFileSeguro(file);
  };

  const onValidar = async () => {
    if (!archivo) {
      setErrorGeneral("Seleccione un archivo Excel antes de validar.");
      return;
    }

    setLoadingValidar(true);
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");
    setValidacionKey("");

    try {
      const resp = await CargaMasivaAction.validar(
        tipoActual,
        archivo,
        tipoPlantilla
      );

      setValidacion(resp);
      setValidacionKey(currentKey);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No se pudo validar el archivo.";
      setErrorGeneral(msg);
    } finally {
      setLoadingValidar(false);
    }
  };

  const onProcesar = async () => {
    if (!archivo) {
      setErrorGeneral("Seleccione un archivo Excel antes de procesar.");
      return;
    }

    if (!puedeProcesar) {
      setErrorGeneral(
        "Primero valida el archivo seleccionado. Solo se puede procesar una validación correcta y vigente."
      );
      return;
    }

    setLoadingProcesar(true);
    setResultado(null);
    setErrorGeneral("");
    setConfirmarProcesar(false);

    try {
      const resp = await CargaMasivaAction.procesar(
        tipoActual,
        archivo,
        tipoPlantilla
      );

      setResultado(resp);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No se pudo procesar el archivo.";
      setErrorGeneral(msg);
    } finally {
      setLoadingProcesar(false);
    }
  };

  const onLimpiar = () => {
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");
    setValidacionKey("");

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: "100%",
        bgcolor: alpha(COLOR_VERDE_INSTITUCIONAL, 0.025),
      }}
    >
      <Paper
  elevation={0}
  sx={{
    p: { xs: 2, md: 2.5 },
    mb: 2,
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
    bgcolor: "#FFFFFF",
    border: "1px solid",
    borderColor: alpha(COLOR_VERDE_INSTITUCIONAL, 0.16),
    boxShadow: "0 14px 35px rgba(15, 23, 42, 0.06)",
    "&::before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 7,
      bgcolor: COLOR_VERDE_MEDIO,
    },
  }}
>
  <Box
    sx={{
      position: "absolute",
      right: -80,
      top: -85,
      width: 210,
      height: 210,
      borderRadius: "50%",
      bgcolor: alpha(COLOR_VERDE_MEDIO, 0.055),
    }}
  />

  <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={2}
    justifyContent="space-between"
    alignItems={{ xs: "stretch", md: "center" }}
    sx={{ position: "relative" }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center">
      <IconButton
        onClick={() => navigate(-1)}
        aria-label="Volver"
        sx={{
          color: COLOR_VERDE_MEDIO,
          bgcolor: alpha(COLOR_VERDE_MEDIO, 0.08),
          border: "1px solid",
          borderColor: alpha(COLOR_VERDE_MEDIO, 0.16),
          "&:hover": {
            bgcolor: alpha(COLOR_VERDE_MEDIO, 0.14),
          },
        }}
      >
        <ArrowBackRoundedIcon />
      </IconButton>

      <Box>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: -0.35,
              color: COLOR_TEXTO_VERDE,
            }}
          >
            {getTitulo(tipoActual)}
          </Typography>

          <Chip
            label={tipoActual.toUpperCase()}
            size="small"
            sx={{
              color: COLOR_VERDE_MEDIO,
              bgcolor: alpha(COLOR_VERDE_MEDIO, 0.1),
              border: "1px solid",
              borderColor: alpha(COLOR_VERDE_MEDIO, 0.18),
              fontWeight: 900,
            }}
          />
        </Stack>

        <Typography
          variant="body2"
          sx={{
            color: alpha("#334155", 0.85),
            mt: 0.45,
            maxWidth: 760,
          }}
        >
          {getDescripcion(tipoActual)}
        </Typography>
      </Box>
    </Stack>

    <Tooltip title="Limpiar pantalla" arrow>
      <IconButton
        onClick={onLimpiar}
        sx={{
          color: COLOR_VERDE_MEDIO,
          bgcolor: alpha(COLOR_VERDE_MEDIO, 0.07),
          border: "1px solid",
          borderColor: alpha(COLOR_VERDE_MEDIO, 0.14),
          alignSelf: { xs: "flex-start", md: "center" },
          "&:hover": {
            bgcolor: alpha(COLOR_VERDE_MEDIO, 0.13),
          },
        }}
      >
        <RefreshRoundedIcon />
      </IconButton>
    </Tooltip>
  </Stack>
</Paper>

      {!soportado && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
          La carga masiva para <strong>{tipoActual.toUpperCase()}</strong>{" "}
          todavía no está habilitada. Por ahora la implementación operativa
          está en <strong>PDRC</strong> y <strong>AG</strong>.
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: alpha(COLOR_VERDE_INSTITUCIONAL, 0.16),
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.07)",
        }}
      >
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: 3,
            display: { xs: "none", md: "flex" },
            "& .MuiStepIcon-root.Mui-active": {
              color: COLOR_VERDE_MEDIO,
            },
            "& .MuiStepIcon-root.Mui-completed": {
              color: COLOR_VERDE_EXITO,
            },
          }}
        >
          <Step>
            <StepLabel>Preparar plantilla</StepLabel>
          </Step>
          <Step>
            <StepLabel>Subir archivo</StepLabel>
          </Step>
          <Step>
            <StepLabel>Validar</StepLabel>
          </Step>
          <Step>
            <StepLabel>Procesar</StepLabel>
          </Step>
        </Stepper>

        <Stack spacing={2.2}>
          {(tipoActual === "ag" || tipoActual === "pdrc") && (
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 1.8, md: 2 },
                borderRadius: 3,
                borderColor: alpha(theme.palette.grey[500], 0.24),
                bgcolor: alpha(theme.palette.background.paper, 0.98),
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Stack direction="row" spacing={1.4} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2.3,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(COLOR_VERDE_MEDIO, 0.08),
                      color: COLOR_VERDE_MEDIO,
                      flexShrink: 0,
                    }}
                  >
                    <TuneRoundedIcon fontSize="small" />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>
                      ¿Qué información deseas cargar?
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.3 }}
                    >
                      Selecciona si vas a cargar metas programadas o valores
                      ejecutados.
                    </Typography>
                  </Box>
                </Stack>

                <FormControl>
                  <RadioGroup
                    row
                    value={tipoPlantilla}
                    onChange={(e) => {
                      setTipoPlantilla(e.target.value as TipoPlantillaCarga);
                      limpiarResultados();
                    }}
                    sx={{
                      gap: 1,
                      justifyContent: { xs: "flex-start", md: "flex-end" },
                    }}
                  >
                    <FormControlLabel
                      value="VALOR"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                            Indicador Valor
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Metas o valores programados
                          </Typography>
                        </Box>
                      }
                      sx={{
                        m: 0,
                        px: 1.4,
                        py: 0.8,
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor:
                          tipoPlantilla === "VALOR"
                            ? alpha(COLOR_VERDE_MEDIO, 0.48)
                            : alpha(theme.palette.grey[500], 0.22),
                        bgcolor:
                          tipoPlantilla === "VALOR"
                            ? alpha(COLOR_VERDE_MEDIO, 0.06)
                            : "transparent",
                      }}
                    />

                    <FormControlLabel
                      value="EJECUTADO"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                            Indicador Ejecutado
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Avances registrados por año
                          </Typography>
                        </Box>
                      }
                      sx={{
                        m: 0,
                        px: 1.4,
                        py: 0.8,
                        borderRadius: 2.5,
                        border: "1px solid",
                        borderColor:
                          tipoPlantilla === "EJECUTADO"
                            ? alpha(COLOR_VERDE_EXITO, 0.48)
                            : alpha(theme.palette.grey[500], 0.22),
                        bgcolor:
                          tipoPlantilla === "EJECUTADO"
                            ? alpha(COLOR_VERDE_EXITO, 0.06)
                            : "transparent",
                      }}
                    />
                  </RadioGroup>
                </FormControl>
              </Stack>
            </Paper>
          )}

          {plantillas.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(COLOR_VERDE_INSTITUCIONAL, 0.025),
                borderColor: alpha(COLOR_VERDE_INSTITUCIONAL, 0.18),
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(COLOR_VERDE_MEDIO, 0.1),
                      color: COLOR_VERDE_MEDIO,
                    }}
                  >
                    <DownloadRoundedIcon />
                  </Box>

                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>
                      1. Descarga la plantilla oficial
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usa siempre el formato vigente para evitar errores de
                      estructura.
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  {plantillas.map((p) => (
                    <Button
                      key={p.url}
                      variant="contained"
                      startIcon={<DownloadRoundedIcon />}
                      onClick={() => descargarArchivo(p.url, p.fileName)}
                      sx={{
                        borderRadius: 3,
                        fontWeight: 800,
                        boxShadow: "none",
                        bgcolor: COLOR_VERDE_MEDIO,
                        "&:hover": {
                          bgcolor: COLOR_VERDE_INSTITUCIONAL,
                        },
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          )}

          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setDragActivo(true);
            }}
            onDragLeave={() => setDragActivo(false)}
            onDrop={onDrop}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 4,
              border: "2px dashed",
              borderColor: dragActivo
                ? COLOR_VERDE_MEDIO
                : archivo
                  ? alpha(COLOR_VERDE_EXITO, 0.55)
                  : alpha(COLOR_VERDE_MEDIO, 0.28),
              bgcolor: dragActivo
                ? alpha(COLOR_VERDE_MEDIO, 0.06)
                : archivo
                  ? alpha(COLOR_VERDE_EXITO, 0.055)
                  : alpha(theme.palette.grey[500], 0.035),
              transition: "all .18s ease",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Stack direction="row" spacing={1.6} alignItems="center">
                <Box
                  sx={{
                    width: 58,
                    height: 58,
                    borderRadius: 3.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: archivo
                      ? alpha(COLOR_VERDE_EXITO, 0.12)
                      : alpha(COLOR_VERDE_MEDIO, 0.1),
                    color: archivo ? COLOR_VERDE_EXITO : COLOR_VERDE_MEDIO,
                  }}
                >
                  {archivo ? (
                    <CheckCircleRoundedIcon fontSize="large" />
                  ) : (
                    <CloudUploadRoundedIcon fontSize="large" />
                  )}
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 900 }}>
                    {archivo
                      ? archivo.name
                      : "2. Arrastra o selecciona tu archivo Excel"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {archivo
                      ? `${formatBytes(archivo.size)} · listo para validar`
                      : "Solo archivos .xlsx. Primero valida; luego procesa."}
                  </Typography>

                  {(tipoActual === "ag" || tipoActual === "pdrc") && (
                    <Chip
                      size="small"
                      sx={{
                        mt: 1,
                        fontWeight: 800,
                        bgcolor: alpha(tipoPlantillaColor, 0.12),
                        color: tipoPlantillaColor,
                      }}
                      label={`Se procesará: ${TIPO_PLANTILLA_LABEL[tipoPlantilla]}`}
                    />
                  )}
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadFileRoundedIcon />}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 800,
                    borderColor: alpha(COLOR_VERDE_MEDIO, 0.45),
                    color: COLOR_VERDE_MEDIO,
                    "&:hover": {
                      borderColor: COLOR_VERDE_MEDIO,
                      bgcolor: alpha(COLOR_VERDE_MEDIO, 0.06),
                    },
                  }}
                >
                  Seleccionar archivo
                  <input
                    ref={inputRef}
                    hidden
                    type="file"
                    accept=".xlsx"
                    onChange={onSelectFile}
                  />
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    loadingValidar ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <FactCheckRoundedIcon />
                    )
                  }
                  onClick={onValidar}
                  disabled={!archivo || loadingValidar || !soportado}
                  sx={{
                    borderRadius: 3,
                    minWidth: 135,
                    fontWeight: 900,
                    boxShadow: "none",
                    bgcolor: COLOR_VERDE_MEDIO,
                    "&:hover": {
                      bgcolor: COLOR_VERDE_INSTITUCIONAL,
                    },
                    "&.Mui-disabled": {
                      bgcolor: alpha(theme.palette.grey[500], 0.25),
                      color: alpha(theme.palette.text.primary, 0.35),
                    },
                  }}
                >
                  {loadingValidar ? "Validando..." : "Validar"}
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    loadingProcesar ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PlayCircleOutlineRoundedIcon />
                    )
                  }
                  onClick={() => setConfirmarProcesar(true)}
                  disabled={!puedeProcesar}
                  sx={{
                    borderRadius: 3,
                    minWidth: 135,
                    fontWeight: 900,
                    boxShadow: "none",
                    bgcolor: COLOR_VERDE_EXITO,
                    "&:hover": {
                      bgcolor: "#166534",
                    },
                    "&.Mui-disabled": {
                      bgcolor: alpha(theme.palette.grey[500], 0.25),
                      color: alpha(theme.palette.text.primary, 0.35),
                    },
                  }}
                >
                  {loadingProcesar ? "Procesando..." : "Procesar"}
                </Button>
              </Stack>
            </Stack>
          </Box>

          {(loadingValidar || loadingProcesar) && (
            <LinearProgress
              sx={{
                borderRadius: 2,
                bgcolor: alpha(COLOR_VERDE_MEDIO, 0.12),
                "& .MuiLinearProgress-bar": {
                  bgcolor: COLOR_VERDE_MEDIO,
                },
              }}
            />
          )}

          <Alert
            severity="success"
            icon={<InfoOutlinedIcon />}
            sx={{
              borderRadius: 3,
              bgcolor: alpha(COLOR_VERDE_MEDIO, 0.08),
              color: COLOR_TEXTO_VERDE,
              "& .MuiAlert-icon": {
                color: COLOR_VERDE_MEDIO,
              },
            }}
          >
            Flujo recomendado: <strong>descargar plantilla</strong>, completar
            datos, <strong>validar</strong> y recién <strong>procesar</strong>.
            El procesamiento solo se habilita cuando la validación no tiene
            errores.
          </Alert>

          {tipoActual === "ag" && (
            <Alert
              severity="success"
              icon={<VerifiedRoundedIcon />}
              sx={{
                borderRadius: 3,
                bgcolor: alpha(COLOR_VERDE_EXITO, 0.08),
                color: COLOR_TEXTO_VERDE,
                "& .MuiAlert-icon": {
                  color: COLOR_VERDE_EXITO,
                },
              }}
            >
              Para <strong>AG</strong>, usa la plantilla oficial con las hojas{" "}
              <strong>01_AG_INDICADOR_VALOR</strong> y{" "}
              <strong>02_AG_INDICADOR_EJECUTADO</strong>. El selector superior
              define cuál de ellas procesará el backend.
            </Alert>
          )}

          {tipoActual === "pdrc" && (
            <Alert
              severity="success"
              icon={<VerifiedRoundedIcon />}
              sx={{
                borderRadius: 3,
                bgcolor: alpha(COLOR_VERDE_EXITO, 0.08),
                color: COLOR_TEXTO_VERDE,
                "& .MuiAlert-icon": {
                  color: COLOR_VERDE_EXITO,
                },
              }}
            >
              Para <strong>PDRC</strong>, usa la plantilla oficial con las hojas{" "}
              <strong>01_PDRC_INDICADOR_VALOR</strong> y{" "}
              <strong>02_PDRC_INDICADOR_EJECUTADO</strong>. El selector superior
              define cuál de ellas procesará el backend.
            </Alert>
          )}

          {errorGeneral && (
            <Alert
              severity="error"
              icon={<ErrorOutlineRoundedIcon />}
              sx={{ borderRadius: 3 }}
            >
              {errorGeneral}
            </Alert>
          )}
        </Stack>
      </Paper>

      {validacion && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: { xs: 2, md: 2.5 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: validacion.puedeProcesar
              ? alpha(COLOR_VERDE_EXITO, 0.35)
              : alpha(theme.palette.warning.main, 0.35),
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            sx={{ mb: 2 }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <AssignmentTurnedInRoundedIcon
                  sx={{
                    color: validacion.puedeProcesar
                      ? COLOR_VERDE_EXITO
                      : theme.palette.warning.main,
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Resultado de Validación
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {validacion.puedeProcesar
                  ? "El archivo está listo para procesamiento."
                  : "Corrige los errores antes de procesar."}
              </Typography>
            </Box>

            <Chip
              label={
                validacion.puedeProcesar
                  ? "Validación correcta"
                  : "Validación con observaciones"
              }
              sx={{
                fontWeight: 900,
                color: validacion.puedeProcesar
                  ? COLOR_TEXTO_VERDE
                  : theme.palette.warning.dark,
                bgcolor: validacion.puedeProcesar
                  ? alpha(COLOR_VERDE_EXITO, 0.12)
                  : alpha(theme.palette.warning.main, 0.16),
              }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.2}
            sx={{ mb: 2, flexWrap: "wrap" }}
          >
            <MetricCard
              label="Total filas"
              value={validacion.totalFilas}
              tone="primary"
            />
            <MetricCard
              label="Filas válidas"
              value={validacion.filasValidas}
              tone="success"
            />
            <MetricCard
              label="Filas con error"
              value={validacion.filasConError}
              tone={validacion.filasConError > 0 ? "error" : "default"}
            />
            <MetricCard
              label="Puede procesar"
              value={validacion.puedeProcesar ? "Sí" : "No"}
              tone={validacion.puedeProcesar ? "success" : "warning"}
            />
          </Stack>

          {!!validacion.tipoPlantilla && (
            <Chip
              label={`Plantilla detectada: ${validacion.tipoPlantilla}`}
              variant="outlined"
              sx={{
                mb: 2,
                fontWeight: 800,
                borderColor: alpha(COLOR_VERDE_MEDIO, 0.5),
                color: COLOR_VERDE_MEDIO,
              }}
            />
          )}

          {validacion.errores?.length > 0 ? (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 3, maxHeight: 430 }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>Fila</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Campo</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Mensaje</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Valor</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {validacion.errores.map((e, idx) => (
                    <TableRow key={`${e.numeroFila}-${e.campo}-${idx}`} hover>
                      <TableCell>{e.numeroFila}</TableCell>
                      <TableCell>
                        <Chip label={e.campo} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{e.mensaje}</TableCell>
                      <TableCell>{e.valor ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert
              severity="success"
              sx={{
                borderRadius: 3,
                bgcolor: alpha(COLOR_VERDE_EXITO, 0.08),
                color: COLOR_TEXTO_VERDE,
              }}
            >
              El archivo no presenta errores de validación. Puedes procesarlo
              con seguridad.
            </Alert>
          )}
        </Paper>
      )}

      {resultado && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: { xs: 2, md: 2.5 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: resultado.success
              ? alpha(COLOR_VERDE_EXITO, 0.35)
              : alpha(theme.palette.error.main, 0.35),
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            sx={{ mb: 2 }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TableRowsRoundedIcon
                  sx={{
                    color: resultado.success
                      ? COLOR_VERDE_EXITO
                      : theme.palette.error.main,
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  Resultado del Procesamiento
                </Typography>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {resultado.mensaje}
              </Typography>
            </Box>

            <Chip
              label={resultado.success ? "Procesado" : "No procesado"}
              sx={{
                fontWeight: 900,
                color: resultado.success
                  ? COLOR_TEXTO_VERDE
                  : theme.palette.error.dark,
                bgcolor: resultado.success
                  ? alpha(COLOR_VERDE_EXITO, 0.12)
                  : alpha(theme.palette.error.main, 0.12),
              }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.2}
            sx={{ mb: 2, flexWrap: "wrap" }}
          >
            <MetricCard
              label="Filas leídas"
              value={resultado.totalFilasLeidas}
              tone="primary"
            />
            <MetricCard
              label="Filas válidas"
              value={resultado.totalFilasValidas}
              tone="success"
            />
            <MetricCard
              label="Filas con error"
              value={resultado.totalFilasConError}
              tone={resultado.totalFilasConError > 0 ? "error" : "default"}
            />
            {"tipoPlantilla" in resultado && (
              <MetricCard
                label="Plantilla"
                value={resultado.tipoPlantilla}
                tone="info"
              />
            )}
          </Stack>

          {isPdrcResultado(resultado) && (
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              sx={{ mb: 2, flexWrap: "wrap" }}
            >
              <MetricCard
                label="Valores insertados"
                value={resultado.valoresInsertados ?? 0}
                tone="success"
              />
              <MetricCard
                label="Valores actualizados"
                value={resultado.valoresActualizados ?? 0}
                tone="info"
              />
              <MetricCard
                label="Valores omitidos"
                value={resultado.valoresOmitidos ?? 0}
                tone="warning"
              />
              <MetricCard
                label="OER insertados"
                value={resultado.oerInsertados ?? 0}
                tone="primary"
              />
              <MetricCard
                label="AER insertados"
                value={resultado.aerInsertados ?? 0}
                tone="primary"
              />
              <MetricCard
                label="Indicadores insertados"
                value={resultado.indicadoresInsertados ?? 0}
                tone="info"
              />
            </Stack>
          )}

          {isAgResultado(resultado) && (
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              sx={{ mb: 2, flexWrap: "wrap" }}
            >
              <MetricCard
                label="Cabeceras insertadas"
                value={resultado.cabecerasInsertadas}
                tone="success"
              />
              <MetricCard
                label="Cabeceras reutilizadas"
                value={resultado.cabecerasReutilizadas}
                tone="primary"
              />
              <MetricCard
                label="Valores insertados"
                value={resultado.valoresInsertados}
                tone="success"
              />
              <MetricCard
                label="Valores actualizados"
                value={resultado.valoresActualizados}
                tone="info"
              />
              <MetricCard
                label="Ejecutados insertados"
                value={resultado.ejecutadosInsertados}
                tone="success"
              />
              <MetricCard
                label="Ejecutados actualizados"
                value={resultado.ejecutadosActualizados}
                tone="info"
              />
            </Stack>
          )}

          {!!resultado.errores?.length && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 3 }}>
                El procesamiento devolvió observaciones.
              </Alert>

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 3, maxHeight: 360 }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900 }}>Fila</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Campo</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>Mensaje</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {resultado.errores.map((e, idx) => (
                      <TableRow key={`${e.numeroFila}-${e.campo}-${idx}`} hover>
                        <TableCell>{e.numeroFila}</TableCell>
                        <TableCell>{e.campo}</TableCell>
                        <TableCell>{e.mensaje}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      )}

      <Dialog
        open={confirmarProcesar}
        onClose={() => setConfirmarProcesar(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Confirmar procesamiento
        </DialogTitle>

        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 3, mb: 2 }}>
            Esta acción insertará o actualizará registros en la base de datos
            según las reglas de carga masiva.
          </Alert>

          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Archivo:</strong> {archivo?.name}
            </Typography>

            <Typography variant="body2">
              <strong>Instrumento:</strong> {tipoActual.toUpperCase()}
            </Typography>

            {(tipoActual === "ag" || tipoActual === "pdrc") && (
              <Typography variant="body2">
                <strong>Tipo de carga:</strong>{" "}
                {TIPO_PLANTILLA_LABEL[tipoPlantilla]}
              </Typography>
            )}

            <Typography variant="body2">
              <strong>Filas válidas:</strong> {validacion?.filasValidas ?? 0}
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmarProcesar(false)}
            sx={{
              borderRadius: 2.5,
              color: COLOR_VERDE_MEDIO,
            }}
          >
            Cancelar
          </Button>

          <Button
            onClick={onProcesar}
            variant="contained"
            startIcon={
              loadingProcesar ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PlayCircleOutlineRoundedIcon />
              )
            }
            disabled={loadingProcesar}
            sx={{
              borderRadius: 2.5,
              fontWeight: 900,
              boxShadow: "none",
              bgcolor: COLOR_VERDE_EXITO,
              "&:hover": {
                bgcolor: "#166534",
              },
            }}
          >
            Sí, procesar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}