import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
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

import {
  CargaMasivaAction,
  type AgCargaMasivaResultadoDto,
  type CargaMasivaResultadoDto,
  type CargaMasivaValidacionDto,
  type PdrcCargaMasivaResultadoDto,
  type PrcpCargaMasivaResultadoDto,
  type TipoPlantillaCarga,
} from "../CargaMasivaAction";

type RouteParams = {
  tipo?: string;
};

const tiposPermitidos = ["ag", "pdrc", "prcp", "pei", "poi"] as const;
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
const COLOR_VERDE_SUAVE = "#EAF6F2";
const COLOR_VERDE_EXITO = "#15803D";
const COLOR_TEXTO = "#1F2937";
const COLOR_TEXTO_SUAVE = "#64748B";

const TIPO_PLANTILLA_LABEL: Record<TipoPlantillaCarga, string> = {
  VALOR: "Indicador Valor / Meta",
  EJECUTADO: "Indicador Ejecutado",
};

function normalizeTipo(tipo?: string): TipoInstrumento {
  const t = (tipo ?? "").trim().toLowerCase();

  return (
    tiposPermitidos.includes(t as TipoInstrumento) ? t : "pdrc"
  ) as TipoInstrumento;
}

function getTitulo(tipo: TipoInstrumento): string {
  switch (tipo) {
    case "ag":
      return "Carga Masiva AG";
    case "pdrc":
      return "Carga Masiva PDRC";
    case "prcp":
      return "Carga Masiva PRCP";
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
      return "Sube la plantilla oficial para validar y cargar valores programados del PDRC.";
    case "ag":
      return "Sube la plantilla oficial para validar y cargar valores programados de Acuerdos de Gobernabilidad.";
    case "prcp":
      return "Sube la plantilla oficial para validar y cargar valores programados del PRCP.";
    case "pei":
      return "Carga masiva para el PEI.";
    case "poi":
      return "Carga masiva para el POI.";
    default:
      return "Sube un archivo Excel para validarlo y procesarlo.";
  }
}

function getHojaEsperada(tipo: TipoInstrumento): string {
  switch (tipo) {
    case "ag":
      return "01_AG_INDICADOR_VALOR";
    case "pdrc":
      return "01_PDRC_INDICADOR_VALOR";
    case "prcp":
      return "01_PRCP_INDICADOR_VALOR";
    default:
      return "Hoja de carga masiva";
  }
}

function isPdrcResultado(
  resultado: CargaMasivaResultadoDto | null,
): resultado is PdrcCargaMasivaResultadoDto {
  return !!resultado && "periodosInsertados" in resultado;
}

function isPrcpResultado(
  resultado: CargaMasivaResultadoDto | null,
): resultado is PrcpCargaMasivaResultadoDto {
  return !!resultado && "relacionesPrcpInsertadas" in resultado;
}

function isAgResultado(
  resultado: CargaMasivaResultadoDto | null,
): resultado is AgCargaMasivaResultadoDto {
  return !!resultado && "cabecerasInsertadas" in resultado;
}

function getPlantillas(tipo: TipoInstrumento): PlantillaDescarga[] {
  switch (tipo) {
    case "pdrc":
      return [
        {
          label: "Plantilla PDRC",
          fileName: "Template_Carga_Masiva_PDRC.xlsx",
          url: "/plantillas/Template_Carga_Masiva_PDRC.xlsx",
          descripcion: "Usa la hoja 01_PDRC_INDICADOR_VALOR.",
        },
      ];

    case "ag":
      return [
        {
          label: "Plantilla AG",
          fileName: "Template_Carga_Masiva_AG.xlsx",
          url: "/plantillas/Template_Carga_Masiva_AG.xlsx",
          descripcion: "Usa la hoja 01_AG_INDICADOR_VALOR.",
        },
      ];

    case "prcp":
      return [
        {
          label: "Plantilla PRCP",
          fileName: "Template_Carga_Masiva_PRCP.xlsx",
          url: "/plantillas/Template_Carga_Masiva_PRCP.xlsx",
          descripcion: "Usa la hoja 01_PRCP_INDICADOR_VALOR.",
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
    warning: theme.palette.warning.dark,
    info: COLOR_VERDE_MEDIO,
    primary: COLOR_VERDE_INSTITUCIONAL,
  };

  const color = colorMap[tone];

  return (
    <Box
      sx={{
        p: 1.4,
        minWidth: 140,
        flex: "1 1 140px",
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: alpha(color, 0.18),
        bgcolor: alpha(color, 0.055),
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: COLOR_TEXTO_SUAVE, fontWeight: 700 }}
      >
        {label}
      </Typography>

      <Typography
        variant="h6"
        sx={{ fontWeight: 850, color, lineHeight: 1.15 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function SectionTitle({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: COLOR_VERDE_SUAVE,
          color: COLOR_VERDE_MEDIO,
          fontWeight: 850,
          flexShrink: 0,
          mt: 0.15,
        }}
      >
        {number}
      </Box>

      <Box>
        <Typography sx={{ fontWeight: 850, color: COLOR_TEXTO }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: COLOR_TEXTO_SUAVE, mt: 0.2 }}>
          {description}
        </Typography>
      </Box>
    </Stack>
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

  const [validacion, setValidacion] = useState<CargaMasivaValidacionDto | null>(
    null,
  );
  const [resultado, setResultado] = useState<CargaMasivaResultadoDto | null>(
    null,
  );

  const [errorGeneral, setErrorGeneral] = useState<string>("");
  const [loadingValidar, setLoadingValidar] = useState<boolean>(false);
  const [loadingProcesar, setLoadingProcesar] = useState<boolean>(false);
  const [dragActivo, setDragActivo] = useState<boolean>(false);
  const [confirmarProcesar, setConfirmarProcesar] = useState<boolean>(false);
  const [validacionKey, setValidacionKey] = useState<string>("");

  useEffect(() => {
    if (tipoPlantilla !== "VALOR") {
      setTipoPlantilla("VALOR");
      limpiarResultados();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoActual, tipoPlantilla]);

  const soportado =
    tipoActual === "pdrc" || tipoActual === "ag" || tipoActual === "prcp";

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
      setErrorGeneral("Selecciona un archivo Excel antes de validar.");
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
        "VALOR",
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
      setErrorGeneral("Selecciona un archivo Excel antes de procesar.");
      return;
    }

    if (!puedeProcesar) {
      setErrorGeneral(
        "Primero valida el archivo seleccionado. Solo se puede procesar una validación correcta y vigente.",
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
        "VALOR",
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
    setTipoPlantilla("VALOR");

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: "100%",
        bgcolor: "#F8FAFC",
      }}
    >
      <Stack spacing={2.2}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.4 },
            borderRadius: 3.5,
            bgcolor: "#FFFFFF",
            border: "1px solid",
            borderColor: alpha(COLOR_VERDE_INSTITUCIONAL, 0.12),
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Tooltip title="Volver" arrow>
                <IconButton
                  onClick={() => navigate(-1)}
                  aria-label="Volver"
                  sx={{
                    color: COLOR_VERDE_MEDIO,
                    bgcolor: alpha(COLOR_VERDE_MEDIO, 0.07),
                    "&:hover": { bgcolor: alpha(COLOR_VERDE_MEDIO, 0.12) },
                  }}
                >
                  <ArrowBackRoundedIcon />
                </IconButton>
              </Tooltip>

              <Box>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 850,
                      color: COLOR_TEXTO,
                      letterSpacing: -0.2,
                    }}
                  >
                    {getTitulo(tipoActual)}
                  </Typography>

                  <Chip
                    label={tipoActual.toUpperCase()}
                    size="small"
                    sx={{
                      height: 24,
                      color: COLOR_VERDE_MEDIO,
                      bgcolor: alpha(COLOR_VERDE_MEDIO, 0.09),
                      fontWeight: 800,
                    }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: COLOR_TEXTO_SUAVE, mt: 0.35 }}
                >
                  {getDescripcion(tipoActual)}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
            >
              <Chip
                size="small"
                icon={<CheckCircleRoundedIcon />}
                label={TIPO_PLANTILLA_LABEL.VALOR}
                sx={{
                  color: COLOR_VERDE_MEDIO,
                  bgcolor: COLOR_VERDE_SUAVE,
                  fontWeight: 800,
                  "& .MuiChip-icon": { color: COLOR_VERDE_MEDIO },
                }}
              />

              <Tooltip title="Limpiar pantalla" arrow>
                <IconButton
                  onClick={onLimpiar}
                  sx={{
                    color: COLOR_TEXTO_SUAVE,
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                    "&:hover": {
                      bgcolor: alpha(theme.palette.grey[500], 0.14),
                    },
                  }}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {!soportado && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            La carga masiva para <strong>{tipoActual.toUpperCase()}</strong>{" "}
            todavía no está habilitada. Por ahora se encuentra disponible para{" "}
            <strong>AG</strong>, <strong>PDRC</strong> y <strong>PRCP</strong>.
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.6 },
            borderRadius: 3.5,
            bgcolor: "#FFFFFF",
            border: "1px solid",
            borderColor: alpha(theme.palette.grey[500], 0.16),
          }}
        >
          <Stack spacing={2.4}>
            <Alert
              severity="info"
              icon={<InfoOutlinedIcon />}
              sx={{
                borderRadius: 2.8,
                bgcolor: alpha(COLOR_VERDE_MEDIO, 0.055),
                color: COLOR_TEXTO,
                border: "1px solid",
                borderColor: alpha(COLOR_VERDE_MEDIO, 0.12),
                "& .MuiAlert-icon": { color: COLOR_VERDE_MEDIO },
              }}
            >
              Flujo simple: descarga la plantilla, sube tu Excel, valida y
              procesa. El botón <strong>Procesar</strong> se habilita solo
              cuando la validación es correcta.
            </Alert>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "0.9fr 1.1fr" },
                gap: 2,
              }}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  borderColor: alpha(theme.palette.grey[500], 0.15),
                  bgcolor: alpha(COLOR_VERDE_MEDIO, 0.018),
                }}
              >
                <Stack spacing={1.6}>
                  <SectionTitle
                    number={1}
                    title="Descarga la plantilla"
                    description={`Completa la hoja ${getHojaEsperada(tipoActual)} y conserva la estructura original.`}
                  />

                  {plantillas.length > 0 ? (
                    plantillas.map((p) => (
                      <Button
                        key={p.url}
                        variant="outlined"
                        startIcon={<DownloadRoundedIcon />}
                        onClick={() => descargarArchivo(p.url, p.fileName)}
                        sx={{
                          alignSelf: "flex-start",
                          borderRadius: 2.5,
                          fontWeight: 800,
                          borderColor: alpha(COLOR_VERDE_MEDIO, 0.35),
                          color: COLOR_VERDE_MEDIO,
                          bgcolor: "#FFFFFF",
                          "&:hover": {
                            borderColor: COLOR_VERDE_MEDIO,
                            bgcolor: alpha(COLOR_VERDE_MEDIO, 0.055),
                          },
                        }}
                      >
                        {p.label}
                      </Button>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: COLOR_TEXTO_SUAVE }}
                    >
                      No hay plantilla configurada para este instrumento.
                    </Typography>
                  )}

                  <Divider />

                  <Stack spacing={0.7}>
                    <Typography
                      variant="body2"
                      sx={{ color: COLOR_TEXTO_SUAVE }}
                    >
                      Tipo de carga permitido
                    </Typography>
                    <Chip
                      label="Solo Indicador Valor / Meta"
                      size="small"
                      sx={{
                        alignSelf: "flex-start",
                        color: COLOR_VERDE_MEDIO,
                        bgcolor: COLOR_VERDE_SUAVE,
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                </Stack>
              </Paper>

              <Box
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActivo(true);
                }}
                onDragLeave={() => setDragActivo(false)}
                onDrop={onDrop}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 3,
                  border: "1.5px dashed",
                  borderColor: dragActivo
                    ? COLOR_VERDE_MEDIO
                    : archivo
                      ? alpha(COLOR_VERDE_EXITO, 0.45)
                      : alpha(COLOR_VERDE_MEDIO, 0.24),
                  bgcolor: dragActivo
                    ? alpha(COLOR_VERDE_MEDIO, 0.055)
                    : archivo
                      ? alpha(COLOR_VERDE_EXITO, 0.05)
                      : "#FFFFFF",
                  transition: "all .18s ease",
                }}
              >
                <Stack spacing={2} height="100%" justifyContent="space-between">
                  <Stack direction="row" spacing={1.6} alignItems="center">
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 3,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: archivo
                          ? alpha(COLOR_VERDE_EXITO, 0.11)
                          : COLOR_VERDE_SUAVE,
                        color: archivo ? COLOR_VERDE_EXITO : COLOR_VERDE_MEDIO,
                        flexShrink: 0,
                      }}
                    >
                      {archivo ? (
                        <CheckCircleRoundedIcon />
                      ) : (
                        <CloudUploadRoundedIcon />
                      )}
                    </Box>

                    <Box>
                      <Typography sx={{ fontWeight: 850, color: COLOR_TEXTO }}>
                        {archivo ? archivo.name : "Sube el archivo Excel"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: COLOR_TEXTO_SUAVE, mt: 0.25 }}
                      >
                        {archivo
                          ? `${formatBytes(archivo.size)} · archivo listo para validar`
                          : "Arrastra el archivo aquí o selecciónalo desde tu equipo. Solo .xlsx."}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.2}
                    justifyContent="flex-end"
                  >
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<UploadFileRoundedIcon />}
                      sx={{
                        borderRadius: 2.5,
                        fontWeight: 800,
                        borderColor: alpha(COLOR_VERDE_MEDIO, 0.35),
                        color: COLOR_VERDE_MEDIO,
                        "&:hover": {
                          borderColor: COLOR_VERDE_MEDIO,
                          bgcolor: alpha(COLOR_VERDE_MEDIO, 0.055),
                        },
                      }}
                    >
                      Seleccionar
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
                        borderRadius: 2.5,
                        minWidth: 122,
                        fontWeight: 850,
                        boxShadow: "none",
                        bgcolor: COLOR_VERDE_MEDIO,
                        "&:hover": { bgcolor: COLOR_VERDE_INSTITUCIONAL },
                        "&.Mui-disabled": {
                          bgcolor: alpha(theme.palette.grey[500], 0.2),
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
                        borderRadius: 2.5,
                        minWidth: 122,
                        fontWeight: 850,
                        boxShadow: "none",
                        bgcolor: COLOR_VERDE_EXITO,
                        "&:hover": { bgcolor: "#166534" },
                        "&.Mui-disabled": {
                          bgcolor: alpha(theme.palette.grey[500], 0.2),
                          color: alpha(theme.palette.text.primary, 0.35),
                        },
                      }}
                    >
                      {loadingProcesar ? "Procesando..." : "Procesar"}
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Box>

            {(loadingValidar || loadingProcesar) && (
              <LinearProgress
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(COLOR_VERDE_MEDIO, 0.12),
                  "& .MuiLinearProgress-bar": { bgcolor: COLOR_VERDE_MEDIO },
                }}
              />
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
              p: { xs: 2, md: 2.5 },
              borderRadius: 3.5,
              bgcolor: "#FFFFFF",
              border: "1px solid",
              borderColor: validacion.puedeProcesar
                ? alpha(COLOR_VERDE_EXITO, 0.25)
                : alpha(theme.palette.warning.main, 0.28),
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
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 850, color: COLOR_TEXTO }}
                  >
                    Resultado de validación
                  </Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: COLOR_TEXTO_SUAVE }}>
                  {validacion.puedeProcesar
                    ? "El archivo está correcto y puede procesarse."
                    : "Revisa los errores indicados antes de procesar."}
                </Typography>
              </Box>

              <Chip
                label={
                  validacion.puedeProcesar
                    ? "Listo para procesar"
                    : "Con observaciones"
                }
                sx={{
                  alignSelf: { xs: "flex-start", md: "center" },
                  fontWeight: 850,
                  color: validacion.puedeProcesar
                    ? COLOR_VERDE_EXITO
                    : theme.palette.warning.dark,
                  bgcolor: validacion.puedeProcesar
                    ? alpha(COLOR_VERDE_EXITO, 0.1)
                    : alpha(theme.palette.warning.main, 0.14),
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
                size="small"
                sx={{
                  mb: 2,
                  fontWeight: 800,
                  borderColor: alpha(COLOR_VERDE_MEDIO, 0.35),
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
                      <TableCell sx={{ fontWeight: 850 }}>Fila</TableCell>
                      <TableCell sx={{ fontWeight: 850 }}>Campo</TableCell>
                      <TableCell sx={{ fontWeight: 850 }}>Mensaje</TableCell>
                      <TableCell sx={{ fontWeight: 850 }}>Valor</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {validacion.errores.map((e, idx) => (
                      <TableRow key={`${e.numeroFila}-${e.campo}-${idx}`} hover>
                        <TableCell>{e.numeroFila}</TableCell>
                        <TableCell>
                          <Chip
                            label={e.campo}
                            size="small"
                            variant="outlined"
                          />
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
                  color: COLOR_TEXTO,
                }}
              >
                No se encontraron errores. Puedes procesar el archivo.
              </Alert>
            )}
          </Paper>
        )}

        {resultado && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3.5,
              bgcolor: "#FFFFFF",
              border: "1px solid",
              borderColor: resultado.success
                ? alpha(COLOR_VERDE_EXITO, 0.25)
                : alpha(theme.palette.error.main, 0.28),
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
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 850, color: COLOR_TEXTO }}
                  >
                    Resultado del procesamiento
                  </Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: COLOR_TEXTO_SUAVE }}>
                  {resultado.mensaje}
                </Typography>
              </Box>

              <Chip
                label={resultado.success ? "Procesado" : "No procesado"}
                sx={{
                  alignSelf: { xs: "flex-start", md: "center" },
                  fontWeight: 850,
                  color: resultado.success
                    ? COLOR_VERDE_EXITO
                    : theme.palette.error.dark,
                  bgcolor: resultado.success
                    ? alpha(COLOR_VERDE_EXITO, 0.1)
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
              </Stack>
            )}

            {isPrcpResultado(resultado) && (
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.2}
                sx={{ mb: 2, flexWrap: "wrap" }}
              >
                <MetricCard
                  label="Relaciones PRCP"
                  value={resultado.relacionesPrcpInsertadas ?? 0}
                  tone="primary"
                />
                <MetricCard
                  label="Objetivos insertados"
                  value={resultado.objetivosPrioritariosInsertados ?? 0}
                  tone="success"
                />
                <MetricCard
                  label="Problemas insertados"
                  value={resultado.problemasIdentificadosInsertados ?? 0}
                  tone="info"
                />
                <MetricCard
                  label="Medidas insertadas"
                  value={resultado.medidasPoliticaInsertadas ?? 0}
                  tone="info"
                />
                <MetricCard
                  label="Indicadores insertados"
                  value={resultado.indicadoresInsertados ?? 0}
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
                        <TableCell sx={{ fontWeight: 850 }}>Fila</TableCell>
                        <TableCell sx={{ fontWeight: 850 }}>Campo</TableCell>
                        <TableCell sx={{ fontWeight: 850 }}>Mensaje</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {resultado.errores.map((e, idx) => (
                        <TableRow
                          key={`${e.numeroFila}-${e.campo}-${idx}`}
                          hover
                        >
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
      </Stack>

      <Dialog
        open={confirmarProcesar}
        onClose={() => setConfirmarProcesar(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 850, color: COLOR_TEXTO }}>
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

            <Typography variant="body2">
              <strong>Tipo de carga:</strong> {TIPO_PLANTILLA_LABEL.VALOR}
            </Typography>

            <Typography variant="body2">
              <strong>Filas válidas:</strong> {validacion?.filasValidas ?? 0}
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmarProcesar(false)}
            sx={{ borderRadius: 2.5, color: COLOR_VERDE_MEDIO }}
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
              fontWeight: 850,
              boxShadow: "none",
              bgcolor: COLOR_VERDE_EXITO,
              "&:hover": { bgcolor: "#166534" },
            }}
          >
            Sí, procesar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}