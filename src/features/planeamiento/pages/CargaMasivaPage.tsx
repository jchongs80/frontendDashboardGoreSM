import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

import {
  CargaMasivaAction,
  type CargaMasivaErrorDto,
  type CargaMasivaResultadoDto,
  type CargaMasivaValidacionDto,
  type TipoPlantillaCarga,
} from "../CargaMasivaAction";

type RouteParams = {
  tipo?: string;
};

const TIPOS_PERMITIDOS = ["ag", "pdrc", "prcp", "pei", "poi"] as const;
type TipoInstrumento = (typeof TIPOS_PERMITIDOS)[number];

type MetricTone = "default" | "success" | "error" | "info" | "warning";

type MetricCardProps = {
  label: string;
  value: string | number;
  tone?: MetricTone;
};

const TIPO_PLANTILLA: TipoPlantillaCarga = "VALOR";

const COLOR_PRIMARY = "#0F766E";
const COLOR_PRIMARY_DARK = "#0B5D4F";
const COLOR_SUCCESS = "#15803D";
const COLOR_TEXT = "#111827";
const COLOR_MUTED = "#64748B";
const COLOR_SOFT = "#F7FBF9";
const COLOR_LINE = "rgba(15, 118, 110, 0.16)";

function normalizeTipo(tipo?: string): TipoInstrumento | null {
  const value = (tipo ?? "").trim().toLowerCase();
  return TIPOS_PERMITIDOS.includes(value as TipoInstrumento)
    ? (value as TipoInstrumento)
    : null;
}

function isTipoHabilitado(
  tipo: TipoInstrumento | null,
): tipo is TipoInstrumento {
  return (
    tipo === "ag" ||
    tipo === "pdrc" ||
    tipo === "prcp" ||
    tipo === "pei" ||
    tipo === "poi"
  );
}

function getTipoDisplay(
  tipo: TipoInstrumento | null,
  tipoUrl?: string,
): string {
  return (tipo ?? tipoUrl ?? "pdrc").toUpperCase();
}

function getTitulo(tipo: TipoInstrumento | null): string {
  return `Carga masiva ${getTipoDisplay(tipo)}`;
}

function getDescripcion(tipo: TipoInstrumento | null): string {
  switch (tipo) {
    case "ag":
      return "Carga los valores programados de Acuerdos de Gobernabilidad desde Excel.";
    case "pdrc":
      return "Carga los valores programados del Plan de Desarrollo Regional Concertado.";
    case "prcp":
      return "Carga los valores programados del Plan Regional de Competitividad y Productividad.";
    case "pei":
      return "Carga los valores programados del Plan Estratégico Institucional.";
    case "poi":
      return "Carga la programación y ejecución mensual del Plan Operativo Institucional";
    default:
      return "Selecciona un instrumento válido para iniciar la carga masiva.";
  }
}

function getHojaPrincipal(tipo: TipoInstrumento | null): string {
  switch (tipo) {
    case "ag":
      return "01_AG_INDICADOR_VALOR";
    case "pdrc":
      return "01_PDRC_INDICADOR_VALOR";
    case "prcp":
      return "01_PRCP_INDICADOR_VALOR";
    case "pei":
      return "01_PEI_INDICADOR_VALOR";
    case "poi":
      return "POI_Por_ActividadOperativaAnual";
    default:
      return "01_INDICADOR_VALOR";
  }
}

function getPlantilla(tipo: TipoInstrumento | null): {
  label: string;
  fileName: string;
  url: string;
} {

   const upper = getTipoDisplay(tipo);

  if (tipo === "poi") {
    return {
      label: "Descargar plantilla POI",
      fileName: `Template_Carga_Masiva_${upper}.xlsx`,
      url: `/plantillas/Template_Carga_Masiva_${upper}.xlsx`,
    };
  }

 

  return {
    label: `Descargar plantilla ${upper}`,
    fileName: `Template_Carga_Masiva_${upper}.xlsx`,
    url: `/plantillas/Template_Carga_Masiva_${upper}.xlsx`,
  };
}

function downloadFile(url: string, fileName: string): void {
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
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function getNumber(obj: unknown, key: string, fallback = 0): number {
  const value = asRecord(obj)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getString(obj: unknown, key: string, fallback = ""): string {
  const value = asRecord(obj)[key];
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function MetricCard({
  label,
  value,
  tone = "default",
}: MetricCardProps): React.ReactElement {
  const theme = useTheme();
  const colors: Record<MetricTone, string> = {
    default: theme.palette.text.secondary,
    success: COLOR_SUCCESS,
    error: theme.palette.error.main,
    info: COLOR_PRIMARY,
    warning: theme.palette.warning.dark,
  };

  const color = colors[tone];
  const isLongText = typeof value === "string" && value.length > 22;

  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: alpha(color, 0.18),
        bgcolor: alpha(color, 0.055),
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="caption"
        sx={{ display: "block", color: COLOR_MUTED, fontWeight: 800 }}
      >
        {label}
      </Typography>
      <Typography
        variant={isLongText ? "body2" : "h5"}
        sx={{
          mt: 0.25,
          color,
          fontWeight: 900,
          lineHeight: 1.18,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function StepLabel({
  number,
  title,
  helper,
}: {
  number: number;
  title: string;
  helper?: string;
}): React.ReactElement {
  return (
    <Stack direction="row" spacing={1.2} alignItems="flex-start">
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          bgcolor: alpha(COLOR_PRIMARY, 0.1),
          color: COLOR_PRIMARY,
          fontWeight: 900,
        }}
      >
        {number}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900, color: COLOR_TEXT }}>
          {title}
        </Typography>
        {helper && (
          <Typography variant="body2" sx={{ mt: 0.2, color: COLOR_MUTED }}>
            {helper}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function ErrorTable({
  errores,
}: {
  errores?: CargaMasivaErrorDto[];
}): React.ReactElement | null {
  if (!errores || errores.length === 0) return null;

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 2.5, maxHeight: 360 }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 900, width: 85 }}>Fila</TableCell>
            <TableCell sx={{ fontWeight: 900, width: 190 }}>Campo</TableCell>
            <TableCell sx={{ fontWeight: 900 }}>Mensaje</TableCell>
            <TableCell sx={{ fontWeight: 900, width: 180 }}>Valor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {errores.map((error, index) => (
            <TableRow key={`${error.numeroFila}-${error.campo}-${index}`} hover>
              <TableCell>{error.numeroFila}</TableCell>
              <TableCell>
                <Chip
                  label={error.campo || "—"}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell
                sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
              >
                {error.mensaje}
              </TableCell>
              <TableCell
                sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}
              >
                {error.valor ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function getExtraMetrics(
  tipo: TipoInstrumento | null,
  resultado: CargaMasivaResultadoDto,
): Array<{ label: string; value: string | number; tone?: MetricTone }> {
  const common = [
    {
      label: "Valores insertados",
      value: getNumber(resultado, "valoresInsertados"),
      tone: "success" as MetricTone,
    },
    {
      label: "Valores actualizados",
      value: getNumber(resultado, "valoresActualizados"),
      tone: "info" as MetricTone,
    },
    {
      label: "Valores omitidos",
      value: getNumber(resultado, "valoresOmitidos"),
      tone: "default" as MetricTone,
    },
  ];

  switch (tipo) {
    case "ag":
      return [
        ...common,
        {
          label: "Cabeceras nuevas",
          value: getNumber(resultado, "cabecerasInsertadas"),
        },
        {
          label: "Cabeceras reutilizadas",
          value: getNumber(resultado, "cabecerasReutilizadas"),
        },
      ];
    case "pdrc":
      return [
        ...common,
        {
          label: "Periodos",
          value: getNumber(resultado, "periodosInsertados"),
        },
        { label: "OER", value: getNumber(resultado, "oerInsertados") },
        { label: "AER", value: getNumber(resultado, "aerInsertados") },
        {
          label: "Relaciones OER/AER",
          value: getNumber(resultado, "oerAerInsertados"),
        },
        {
          label: "Indicadores",
          value: getNumber(resultado, "indicadoresInsertados"),
        },
      ];
    case "prcp":
      return [
        ...common,
        {
          label: "Relaciones PRCP",
          value: getNumber(resultado, "relacionesPrcpInsertadas"),
        },
        {
          label: "Objetivos prioritarios",
          value: getNumber(resultado, "objetivosPrioritariosInsertados"),
        },
        {
          label: "Problemas",
          value: getNumber(resultado, "problemasIdentificadosInsertados"),
        },
        {
          label: "Medidas",
          value: getNumber(resultado, "medidasPoliticaInsertadas"),
        },
        {
          label: "Indicadores",
          value: getNumber(resultado, "indicadoresInsertados"),
        },
      ];
    case "pei":
      return [
        ...common,
        { label: "OEI", value: getNumber(resultado, "oeiInsertados") },
        { label: "AEI", value: getNumber(resultado, "aeiInsertados") },
        {
          label: "Entidades PEI",
          value: getNumber(resultado, "entidadesEstrategicasInsertadas"),
        },
        {
          label: "Relaciones OEI/AEI",
          value: getNumber(resultado, "oeiAeiInsertados"),
        },
        {
          label: "Indicadores",
          value: getNumber(resultado, "indicadoresInsertados"),
        },
        { label: "Fuentes", value: getNumber(resultado, "fuentesInsertadas") },
        {
          label: "Periodicidades",
          value: getNumber(resultado, "periodicidadesInsertadas"),
        },
        {
          label: "Métodos cálculo",
          value: getNumber(resultado, "metodosCalculoInsertados"),
        },
      ];
    case "poi":
      return [
        ...common,
        {
          label: "Cabeceras POI",
          value: getNumber(resultado, "cabecerasPoiInsertadas"),
          tone: "info",
        },
        {
          label: "Categorías",
          value: getNumber(resultado, "categoriasInsertadas"),
        },
        {
          label: "Productos/Proyectos",
          value: getNumber(resultado, "productosProyectosInsertados"),
        },
        {
          label: "Funciones",
          value: getNumber(resultado, "funcionesInsertadas"),
        },
        {
          label: "Divisiones funcionales",
          value: getNumber(resultado, "divisionesFuncionalesInsertadas"),
        },
        {
          label: "Grupos funcionales",
          value: getNumber(resultado, "gruposFuncionalesInsertados"),
        },
        {
          label: "Actividades presupuestales",
          value: getNumber(resultado, "actividadesPresupuestalesInsertadas"),
        },
        {
          label: "Actividades operativas",
          value: getNumber(resultado, "actividadesOperativasInsertadas"),
        },
        {
          label: "Unidades ejecutoras",
          value: getNumber(resultado, "unidadesEjecutorasInsertadas"),
        },
        {
          label: "Centros de costo",
          value: getNumber(resultado, "centrosCostoInsertados"),
        },
      ];
    default:
      return common;
  }
}

export default function CargaMasivaPage(): React.ReactElement {
  const theme = useTheme();
  const navigate = useNavigate();
  const { tipo } = useParams<RouteParams>();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const tipoActual = useMemo(() => normalizeTipo(tipo), [tipo]);
  const tipoDisplay = getTipoDisplay(tipoActual, tipo);
  const plantilla = useMemo(() => getPlantilla(tipoActual), [tipoActual]);
  const habilitado = isTipoHabilitado(tipoActual);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] = useState<CargaMasivaValidacionDto | null>(
    null,
  );
  const [resultado, setResultado] = useState<CargaMasivaResultadoDto | null>(
    null,
  );
  const [errorGeneral, setErrorGeneral] = useState<string>("");
  const [loadingValidar, setLoadingValidar] = useState(false);
  const [loadingProcesar, setLoadingProcesar] = useState(false);
  const [dragActivo, setDragActivo] = useState(false);
  const [confirmarProcesar, setConfirmarProcesar] = useState(false);
  const [validacionKey, setValidacionKey] = useState<string>("");

  const limpiarPantalla = useCallback(() => {
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");
    setLoadingValidar(false);
    setLoadingProcesar(false);
    setDragActivo(false);
    setConfirmarProcesar(false);
    setValidacionKey("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  useEffect(() => {
    limpiarPantalla();
  }, [tipoActual, limpiarPantalla]);

  const currentKey = `${tipoActual ?? ""}|${TIPO_PLANTILLA}|${archivo?.name ?? ""}|${archivo?.size ?? 0}|${archivo?.lastModified ?? 0}`;
  const validacionVigente = Boolean(validacion) && validacionKey === currentKey;

  const puedeProcesar = Boolean(
    archivo &&
      habilitado &&
      validacionVigente &&
      validacion?.puedeProcesar &&
      !loadingProcesar,
  );

  const limpiarResultados = useCallback(() => {
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");
    setValidacionKey("");
  }, []);

  const setArchivoSeguro = useCallback(
    (file: File | null) => {
      limpiarResultados();
      setArchivo(null);

      if (!file) return;

      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension !== "xlsx") {
        setErrorGeneral("Solo se permiten archivos Excel con extensión .xlsx.");
        return;
      }

      setArchivo(file);
    },
    [limpiarResultados],
  );

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    setArchivoSeguro(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActivo(false);
    setArchivoSeguro(event.dataTransfer.files?.[0] ?? null);
  };

  const onValidar = async () => {
    if (!archivo) {
      setErrorGeneral("Selecciona un archivo Excel antes de validar.");
      return;
    }

    if (!habilitado) {
      setErrorGeneral(
        `La carga masiva para ${tipoDisplay} aún no está habilitada.`,
      );
      return;
    }

    setLoadingValidar(true);
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");
    setValidacionKey("");

    try {
      const response = await CargaMasivaAction.validar(
        tipoActual ?? undefined,
        archivo,
        TIPO_PLANTILLA,
      );
      setValidacion(response);
      setValidacionKey(currentKey);
    } catch (error: unknown) {
      setErrorGeneral(
        error instanceof Error
          ? error.message
          : "No se pudo validar el archivo.",
      );
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
      const response = await CargaMasivaAction.procesar(
        tipoActual ?? undefined,
        archivo,
        TIPO_PLANTILLA,
      );
      setResultado(response);
    } catch (error: unknown) {
      setErrorGeneral(
        error instanceof Error
          ? error.message
          : "No se pudo procesar el archivo.",
      );
    } finally {
      setLoadingProcesar(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#F8FAFC", minHeight: "100%" }}>
      <Stack spacing={2}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3.5,
            border: "1px solid",
            borderColor: alpha(COLOR_PRIMARY, 0.13),
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ minWidth: 0 }}
            >
              <Tooltip title="Volver" arrow>
                <IconButton
                  onClick={() => navigate(-1)}
                  sx={{
                    color: COLOR_PRIMARY,
                    bgcolor: alpha(COLOR_PRIMARY, 0.08),
                    "&:hover": { bgcolor: alpha(COLOR_PRIMARY, 0.14) },
                  }}
                >
                  <ArrowBackRoundedIcon />
                </IconButton>
              </Tooltip>

              <Box sx={{ minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 900,
                      color: COLOR_TEXT,
                      letterSpacing: -0.2,
                    }}
                  >
                    {getTitulo(tipoActual)}
                  </Typography>
                  <Chip
                    label={tipoDisplay}
                    size="small"
                    sx={{
                      height: 24,
                      color: COLOR_PRIMARY,
                      bgcolor: alpha(COLOR_PRIMARY, 0.09),
                      fontWeight: 850,
                    }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.35, color: COLOR_MUTED, maxWidth: 850 }}
                >
                  {getDescripcion(tipoActual)}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
              flexWrap="wrap"
            >
              <Chip
                icon={<CheckCircleRoundedIcon />}
                label="Solo Indicador Valor / Meta"
                size="small"
                sx={{
                  color: COLOR_PRIMARY,
                  bgcolor: alpha(COLOR_PRIMARY, 0.09),
                  fontWeight: 850,
                  "& .MuiChip-icon": { color: COLOR_PRIMARY },
                }}
              />
              <Tooltip title="Limpiar pantalla" arrow>
                <IconButton
                  onClick={limpiarPantalla}
                  sx={{
                    color: COLOR_MUTED,
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                  }}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {!habilitado && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            La carga masiva para <strong>{tipoDisplay}</strong> todavía no está
            habilitada. Actualmente están operativos <strong>AG</strong>,{" "}
            <strong>PDRC</strong>, <strong>PRCP</strong> y <strong>PEI</strong>.
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3.5,
            border: "1px solid",
            borderColor: alpha(theme.palette.grey[500], 0.16),
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack spacing={1.8}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "42px 1fr auto" },
                gap: { xs: 1.2, md: 1.6 },
                alignItems: "center",
                p: { xs: 1.6, md: 1.9 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: alpha(COLOR_PRIMARY, 0.13),
                bgcolor: alpha(COLOR_PRIMARY, 0.025),
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(COLOR_PRIMARY, 0.1),
                  color: COLOR_PRIMARY,
                  fontWeight: 950,
                }}
              >
                1
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 950, color: COLOR_TEXT }}>
                  Descarga la plantilla oficial
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.2, color: COLOR_MUTED }}
                >
                  Usa la hoja <strong>{getHojaPrincipal(tipoActual)}</strong> y
                  no cambies los encabezados.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<DownloadRoundedIcon />}
                onClick={() => downloadFile(plantilla.url, plantilla.fileName)}
                disabled={!habilitado}
                sx={{
                  justifySelf: { xs: "stretch", md: "end" },
                  borderRadius: 2.3,
                  fontWeight: 850,
                  color: COLOR_PRIMARY,
                  borderColor: alpha(COLOR_PRIMARY, 0.35),
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: COLOR_PRIMARY,
                    bgcolor: alpha(COLOR_PRIMARY, 0.05),
                  },
                }}
              >
                {plantilla.label}
              </Button>
            </Box>

            <Box
              sx={{
                pl: { xs: 2.1, md: 2.1 },
                display: { xs: "none", sm: "block" },
              }}
            >
              <Box
                sx={{
                  width: 2,
                  height: 14,
                  bgcolor: alpha(COLOR_PRIMARY, 0.16),
                  borderRadius: 1,
                }}
              />
            </Box>

            <Box
              onDragOver={(event) => {
                event.preventDefault();
                setDragActivo(true);
              }}
              onDragLeave={() => setDragActivo(false)}
              onDrop={onDrop}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "42px 1fr auto" },
                gap: { xs: 1.2, md: 1.6 },
                alignItems: "center",
                p: { xs: 1.6, md: 1.9 },
                borderRadius: 3,
                border: "1.5px dashed",
                borderColor: dragActivo
                  ? COLOR_PRIMARY
                  : archivo
                    ? alpha(COLOR_SUCCESS, 0.48)
                    : COLOR_LINE,
                bgcolor: dragActivo
                  ? alpha(COLOR_PRIMARY, 0.055)
                  : archivo
                    ? alpha(COLOR_SUCCESS, 0.045)
                    : COLOR_SOFT,
                transition: "all .18s ease",
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: archivo
                    ? alpha(COLOR_SUCCESS, 0.12)
                    : alpha(COLOR_PRIMARY, 0.1),
                  color: archivo ? COLOR_SUCCESS : COLOR_PRIMARY,
                  fontWeight: 950,
                }}
              >
                2
              </Box>

              <Stack
                direction="row"
                spacing={1.4}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2.6,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    color: archivo ? COLOR_SUCCESS : COLOR_PRIMARY,
                    bgcolor: archivo
                      ? alpha(COLOR_SUCCESS, 0.11)
                      : alpha(COLOR_PRIMARY, 0.08),
                  }}
                >
                  {archivo ? (
                    <CheckCircleRoundedIcon />
                  ) : (
                    <CloudUploadRoundedIcon />
                  )}
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, color: COLOR_TEXT }}>
                    Sube el archivo Excel
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.15, color: COLOR_MUTED }}
                  >
                    {archivo
                      ? "Archivo seleccionado y listo para validar."
                      : "Arrastra el archivo aquí o selecciónalo desde tu equipo."}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.65,
                      color: archivo ? COLOR_TEXT : COLOR_MUTED,
                      fontWeight: archivo ? 850 : 600,
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {archivo
                      ? `${archivo.name} · ${formatBytes(archivo.size)}`
                      : "Formato permitido: .xlsx"}
                  </Typography>
                </Box>
              </Stack>

              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                sx={{
                  justifySelf: { xs: "stretch", md: "end" },
                  borderRadius: 2.3,
                  fontWeight: 850,
                  color: COLOR_PRIMARY,
                  borderColor: alpha(COLOR_PRIMARY, 0.35),
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: COLOR_PRIMARY,
                    bgcolor: alpha(COLOR_PRIMARY, 0.05),
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
            </Box>

            <Box
              sx={{
                pl: { xs: 2.1, md: 2.1 },
                display: { xs: "none", sm: "block" },
              }}
            >
              <Box
                sx={{
                  width: 2,
                  height: 14,
                  bgcolor: alpha(COLOR_PRIMARY, 0.16),
                  borderRadius: 1,
                }}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "42px 1fr auto" },
                gap: { xs: 1.2, md: 1.6 },
                alignItems: "center",
                p: { xs: 1.6, md: 1.9 },
                borderRadius: 3,
                border: "1px solid",
                borderColor:
                  validacionVigente && validacion?.puedeProcesar
                    ? alpha(COLOR_SUCCESS, 0.28)
                    : alpha(COLOR_PRIMARY, 0.12),
                bgcolor:
                  validacionVigente && validacion?.puedeProcesar
                    ? alpha(COLOR_SUCCESS, 0.035)
                    : "#FFFFFF",
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(COLOR_PRIMARY, 0.1),
                  color: COLOR_PRIMARY,
                  fontWeight: 950,
                }}
              >
                3
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 950, color: COLOR_TEXT }}>
                  Valida y procesa la carga
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 0.2, color: COLOR_MUTED }}
                >
                  Primero valida el Excel. Si no hay errores, se habilita el
                  procesamiento.
                </Typography>
                {validacionVigente && validacion?.puedeProcesar && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.6, color: COLOR_SUCCESS, fontWeight: 850 }}
                  >
                    Validación correcta. Ya puedes procesar la carga.
                  </Typography>
                )}
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                justifyContent="flex-end"
              >
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
                  disabled={!archivo || loadingValidar || !habilitado}
                  sx={{
                    borderRadius: 2.3,
                    fontWeight: 900,
                    boxShadow: "none",
                    bgcolor: COLOR_PRIMARY,
                    whiteSpace: "nowrap",
                    "&:hover": { bgcolor: COLOR_PRIMARY_DARK },
                  }}
                >
                  {loadingValidar ? "Validando..." : "Validar archivo"}
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
                    borderRadius: 2.3,
                    fontWeight: 900,
                    boxShadow: "none",
                    bgcolor: COLOR_SUCCESS,
                    whiteSpace: "nowrap",
                    "&:hover": { bgcolor: "#166534" },
                  }}
                >
                  {loadingProcesar ? "Procesando..." : "Procesar carga"}
                </Button>
              </Stack>
            </Box>

            {(loadingValidar || loadingProcesar) && (
              <LinearProgress
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(COLOR_PRIMARY, 0.1),
                  "& .MuiLinearProgress-bar": { bgcolor: COLOR_PRIMARY },
                }}
              />
            )}

            <Alert
              severity="success"
              icon={<RuleRoundedIcon />}
              sx={{
                borderRadius: 2.8,
                bgcolor: alpha(COLOR_SUCCESS, 0.065),
                color: "#064E3B",
                border: "1px solid",
                borderColor: alpha(COLOR_SUCCESS, 0.12),
                "& .MuiAlert-icon": { color: COLOR_SUCCESS },
              }}
            >
              Regla de carga: si el registro existe, solo se actualiza el{" "}
              <strong>valor</strong>. Los maestros existentes se reutilizan y no
              se modifican.
            </Alert>

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
              border: "1px solid",
              borderColor: validacion.puedeProcesar
                ? alpha(COLOR_SUCCESS, 0.28)
                : alpha(theme.palette.warning.main, 0.35),
              bgcolor: "#FFFFFF",
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.3}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Resultado de validación
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLOR_MUTED }}>
                    {validacion.puedeProcesar
                      ? "El archivo está listo para procesar."
                      : "Corrige los errores antes de procesar."}
                  </Typography>
                </Box>
                <Chip
                  label={
                    validacion.puedeProcesar
                      ? "Validación correcta"
                      : "Con observaciones"
                  }
                  sx={{
                    fontWeight: 900,
                    color: validacion.puedeProcesar
                      ? "#064E3B"
                      : theme.palette.warning.dark,
                    bgcolor: validacion.puedeProcesar
                      ? alpha(COLOR_SUCCESS, 0.12)
                      : alpha(theme.palette.warning.main, 0.16),
                  }}
                />
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  },
                  gap: 1.2,
                }}
              >
                <MetricCard
                  label="Filas leídas"
                  value={validacion.totalFilas}
                  tone="info"
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
                {validacion.tipoPlantilla && (
                  <MetricCard
                    label="Plantilla"
                    value={validacion.tipoPlantilla}
                    tone="info"
                  />
                )}
              </Box>

              <ErrorTable errores={validacion.errores} />
            </Stack>
          </Paper>
        )}

        {resultado && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3.5,
              border: "1px solid",
              borderColor: resultado.success
                ? alpha(COLOR_SUCCESS, 0.28)
                : alpha(theme.palette.error.main, 0.35),
              bgcolor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.3}
                justifyContent="space-between"
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    Resultado de procesamiento
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: COLOR_MUTED, overflowWrap: "anywhere" }}
                  >
                    {resultado.mensaje}
                  </Typography>
                </Box>
                <Chip
                  label={resultado.success ? "Procesado" : "No procesado"}
                  sx={{
                    fontWeight: 900,
                    color: resultado.success
                      ? "#064E3B"
                      : theme.palette.error.dark,
                    bgcolor: resultado.success
                      ? alpha(COLOR_SUCCESS, 0.12)
                      : alpha(theme.palette.error.main, 0.12),
                  }}
                />
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1.2,
                }}
              >
                <MetricCard
                  label="Filas leídas"
                  value={getNumber(resultado, "totalFilasLeidas")}
                  tone="info"
                />
                <MetricCard
                  label="Filas válidas"
                  value={getNumber(resultado, "totalFilasValidas")}
                  tone="success"
                />
                <MetricCard
                  label="Filas con error"
                  value={getNumber(resultado, "totalFilasConError")}
                  tone={
                    getNumber(resultado, "totalFilasConError") > 0
                      ? "error"
                      : "default"
                  }
                />
                <MetricCard
                  label="Archivo"
                  value={getString(
                    resultado,
                    "nombreArchivo",
                    archivo?.name ?? "—",
                  )}
                  tone="info"
                />
              </Box>

              <Divider />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1.2,
                }}
              >
                {getExtraMetrics(tipoActual, resultado).map((metric) => (
                  <MetricCard
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    tone={metric.tone ?? "default"}
                  />
                ))}
              </Box>

              <ErrorTable errores={resultado.errores} />
            </Stack>
          </Paper>
        )}
      </Stack>

      <Dialog
        open={confirmarProcesar}
        onClose={() => setConfirmarProcesar(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Confirmar procesamiento
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1.2}>
            <Typography variant="body2" sx={{ color: COLOR_MUTED }}>
              Se procesará el archivo para <strong>{tipoDisplay}</strong>. Si
              existen valores, se actualizará únicamente el campo valor.
            </Typography>
            {archivo && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: alpha(COLOR_PRIMARY, 0.06),
                  minWidth: 0,
                }}
              >
                <InsertDriveFileRoundedIcon sx={{ color: COLOR_PRIMARY }} />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {archivo.name}
                </Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmarProcesar(false)}
            sx={{ borderRadius: 2, fontWeight: 800 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={onProcesar}
            variant="contained"
            sx={{
              borderRadius: 2,
              fontWeight: 900,
              boxShadow: "none",
              bgcolor: COLOR_SUCCESS,
              "&:hover": { bgcolor: "#166534" },
            }}
          >
            Procesar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
