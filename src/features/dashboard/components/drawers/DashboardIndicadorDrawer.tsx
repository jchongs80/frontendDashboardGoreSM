import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import IconButton from "@mui/material/IconButton";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import DashboardIndicadorAction, {
  type DashboardIndicadorDetalleDto,
} from "../../DashboardIndicadorAction";
import { DASHBOARD_COLORS } from "../../constants/dashboardChartColors";

const COLOR_META = "#2563eb";
const COLOR_EJECUTADO = "#16a34a";
const COLOR_SEMESTRE = "#f97316";
const COLOR_AVANCE = "#7c3aed";

// Líneas de referencia con estilo tipo dashboard ejecutivo.
const COLOR_REF_75 = "#f59e0b";
const COLOR_REF_95 = "#22c55e";

type Props = {
  open: boolean;
  onClose: () => void;
  instrumento: string;
  idRegistro: number;
  idIndicadorNombre: number;
  anioResumen?: number | null;
};

type ResumenAnual = {
  anio: string;
  meta: number;
  ejecutado: number;
  semestreI: number;
  avance: number;
  referencia75: number;
  referencia95: number;
};

function formatNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)}%`;
}

function formatBytes(bytes: number | null | undefined): string {
  const n = Number(bytes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function safeText(value?: string | null): string {
  const txt = (value ?? "").trim();
  return txt.length ? txt : "—";
}

function getAvance(meta: number | null | undefined, ejecutado: number | null | undefined): number | null {
  const m = Number(meta ?? 0);
  const e = Number(ejecutado ?? 0);

  if (!Number.isFinite(m) || !Number.isFinite(e) || m === 0) return null;
  return (e / m) * 100;
}

function getSemaforoFromAvance(avance: number | null | undefined): "ROJO" | "AMARILLO" | "VERDE" {
  const value = Number(avance ?? 0);
  if (value < 75) return "ROJO";
  if (value < 95) return "AMARILLO";
  return "VERDE";
}

function getProgressColor(avance: number | null | undefined): string {
  const semaforo = getSemaforoFromAvance(avance);
  if (semaforo === "ROJO") return "#ef4444";
  if (semaforo === "AMARILLO") return "#f59e0b";
  return "#22c55e";
}

function getAvanceTheme(avance: number | null | undefined) {
  const semaforo = getSemaforoFromAvance(avance);

  if (semaforo === "ROJO") {
    return {
      accent: "#ef4444",
      text: "#991b1b",
      border: "rgba(239,68,68,.55)",
      borderSoft: "rgba(239,68,68,.30)",
      bg: "linear-gradient(135deg, rgba(254,242,242,.96) 0%, rgba(255,255,255,.98) 55%, rgba(255,247,247,.88) 100%)",
      chipBg: "rgba(254,226,226,.86)",
      chipBorder: "rgba(239,68,68,.45)",
      iconBg: "rgba(254,226,226,.88)",
      shadow: "0 18px 42px rgba(239,68,68,.10)",
    };
  }

  if (semaforo === "AMARILLO") {
    return {
      accent: "#f59e0b",
      text: "#92400e",
      border: "rgba(245,158,11,.58)",
      borderSoft: "rgba(245,158,11,.32)",
      bg: "linear-gradient(135deg, rgba(255,251,235,.96) 0%, rgba(255,255,255,.98) 55%, rgba(255,247,237,.88) 100%)",
      chipBg: "rgba(254,243,199,.88)",
      chipBorder: "rgba(245,158,11,.52)",
      iconBg: "rgba(254,243,199,.88)",
      shadow: "0 18px 42px rgba(245,158,11,.11)",
    };
  }

  return {
    accent: "#22c55e",
    text: "#15803d",
    border: "rgba(34,197,94,.55)",
    borderSoft: "rgba(34,197,94,.30)",
    bg: "linear-gradient(135deg, rgba(240,253,244,.96) 0%, rgba(255,255,255,.98) 55%, rgba(236,253,245,.88) 100%)",
    chipBg: "rgba(220,252,231,.88)",
    chipBorder: "rgba(34,197,94,.48)",
    iconBg: "rgba(220,252,231,.88)",
    shadow: "0 18px 42px rgba(34,197,94,.11)",
  };
}

type MiniCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  borderColor?: string;
};

function MiniCard({ title, value, icon, borderColor = "rgba(0,0,0,0.12)" }: MiniCardProps): React.ReactElement {
  const normalizedBorder = String(borderColor);
  const isGreen = normalizedBorder.includes("34,197,94");
  const isOrange = normalizedBorder.includes("249,115,22");
  const isPurple = normalizedBorder.includes("124,58,237");

  const accent = isGreen
    ? "rgb(22,163,74)"
    : isOrange
      ? "rgb(234,88,12)"
      : isPurple
        ? "rgb(124,58,237)"
        : "rgb(37,99,235)";

  const bg = isGreen
    ? "rgba(34,197,94,.08)"
    : isOrange
      ? "rgba(249,115,22,.08)"
      : isPurple
        ? "rgba(124,58,237,.08)"
        : "rgba(37,99,235,.08)";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.55,
        minHeight: 104,
        borderRadius: 3,
        borderColor,
        background: "linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(248,250,252,.90) 100%)",
        boxShadow: "0 12px 28px rgba(15,23,42,.06)",
        position: "relative",
        overflow: "hidden",
        "&:before": {
          content: '\"\"',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          bgcolor: accent,
          opacity: 0.85,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2.2,
            display: "grid",
            placeItems: "center",
            color: accent,
            bgcolor: bg,
            border: `1px solid ${borderColor}`,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: 12.3, color: "text.secondary", fontWeight: 900 }}>
          {title}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 1.05, fontSize: 25, fontWeight: 950, letterSpacing: "-.02em" }}>
        {value}
      </Typography>
    </Paper>
  );
}

type InfoRowProps = {
  label: string;
  value?: string | null;
};

function InfoRow({ label, value }: InfoRowProps): React.ReactElement {
  return (
    <Typography sx={{ fontSize: 13.2, lineHeight: 1.5 }}>
      <b>{label}:</b> {safeText(value)}
    </Typography>
  );
}

export default function DashboardIndicadorDrawer(props: Props): React.ReactElement {
  const { open, onClose, instrumento, idRegistro, idIndicadorNombre, anioResumen } = props;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<DashboardIndicadorDetalleDto | null>(null);

  useEffect(() => {
    async function fetchDetalle() {
      if (!open || !instrumento || !idRegistro || !idIndicadorNombre) return;

      setLoading(true);
      setErrorMsg("");

      try {
        const resp = await DashboardIndicadorAction.getDetalle(
          instrumento,
          idRegistro,
          idIndicadorNombre
        );
        setData(resp);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el indicador.");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void fetchDetalle();
  }, [open, instrumento, idRegistro, idIndicadorNombre]);

  const chartData = useMemo<ResumenAnual[]>(() => {
    const metas = data?.valoresMeta ?? [];
    const ejecutados = data?.valoresEjecutado ?? [];
    const semestres = data?.valoresEjecutadoSemestreI ?? [];

    const years = Array.from(
      new Set([
        ...metas.map((x) => x.anio),
        ...ejecutados.map((x) => x.anio),
        ...semestres.map((x) => x.anio),
      ])
    ).sort((a, b) => a - b);

    return years.map((anio) => {
      const meta = Number(metas.find((m) => m.anio === anio)?.valor ?? 0);
      const ejecutado = Number(ejecutados.find((e) => e.anio === anio)?.valor ?? 0);
      const semestreI = Number(semestres.find((e) => e.anio === anio)?.valor ?? 0);
      const avance = getAvance(meta, ejecutado) ?? 0;

      return {
        anio: String(anio),
        meta,
        ejecutado,
        semestreI,
        avance,
        referencia75: 75,
        referencia95: 95,
      };
    });
  }, [data]);

  const ultimo = useMemo(() => {
    if (chartData.length === 0) {
      return {
        anio: "—",
        meta: 0,
        ejecutado: 0,
        semestreI: 0,
        avance: null as number | null,
        semaforo: "ROJO" as "ROJO" | "AMARILLO" | "VERDE",
        esConsolidado: false,
      };
    }

    const anioSolicitado = Number(anioResumen ?? 0);
    const tieneAnioSeleccionado = Number.isFinite(anioSolicitado) && anioSolicitado > 0;

    if (!tieneAnioSeleccionado) {
      const meta = chartData.reduce((total, item) => total + Number(item.meta ?? 0), 0);
      const ejecutado = chartData.reduce((total, item) => total + Number(item.ejecutado ?? 0), 0);
      const semestreI = chartData.reduce((total, item) => total + Number(item.semestreI ?? 0), 0);
      const avance = getAvance(meta, ejecutado);

      return {
        anio: "Consolidado",
        meta,
        ejecutado,
        semestreI,
        avance,
        semaforo: getSemaforoFromAvance(avance),
        esConsolidado: true,
      };
    }

    const item = chartData.find((x) => Number(x.anio) === anioSolicitado) ?? chartData[0];
    const avance = getAvance(item.meta, item.ejecutado);

    return {
      anio: item.anio,
      meta: item.meta,
      ejecutado: item.ejecutado,
      semestreI: item.semestreI,
      avance,
      semaforo: getSemaforoFromAvance(avance),
      esConsolidado: false,
    };
  }, [chartData, anioResumen]);

  const progressValue = Math.max(0, Math.min(Number(ultimo.avance ?? 0), 100));
  const progressColor = getProgressColor(ultimo.avance);
  const avanceTheme = getAvanceTheme(ultimo.avance);
  const instrumentoKey = (instrumento ?? "").trim().toUpperCase();
  const esPrcp = instrumentoKey === "PRCP";
  const esAg = instrumentoKey === "AG";
  const esPdrc = instrumentoKey === "PDRC";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 650, md: 760 },
          borderTopLeftRadius: { xs: 0, sm: 18 },
          borderBottomLeftRadius: { xs: 0, sm: 18 },
          overflow: "hidden",
          bgcolor: "#f8fafc",
          boxShadow: "-24px 0 60px rgba(15,23,42,.22)",
        },
      }}
    >
      <Box sx={{ height: "100%", overflowY: "auto", bgcolor: "#f8fafc" }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            px: 2.4,
            py: 1.8,
            bgcolor: "rgba(255,255,255,.96)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(148,163,184,.24)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.4}>
            <Stack direction="row" spacing={1.15} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "rgb(22,163,74)",
                  bgcolor: "rgba(220,252,231,.85)",
                  border: "1px solid rgba(34,197,94,.28)",
                  boxShadow: "0 12px 26px rgba(34,197,94,.12)",
                  flex: "0 0 auto",
                }}
              >
                <InsightsRoundedIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 950, fontSize: 18.5, lineHeight: 1.1 }}>
                  Resumen ejecutivo del indicador
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 12.3,
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: { xs: 250, sm: 500 },
                  }}
                >
                  Meta, ejecutado, avance, semestre I, línea base e información complementaria
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={onClose}
              sx={{
                border: "1px solid rgba(148,163,184,.35)",
                bgcolor: "rgba(255,255,255,.86)",
                "&:hover": { bgcolor: "rgba(241,245,249,.95)" },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: 2.2 }}>

        {loading ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2">Cargando detalle...</Typography>
          </Stack>
        ) : null}

        {!loading && errorMsg ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        ) : null}

        {!loading && !errorMsg && data ? (
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.8,
                borderRadius: 3.2,
                borderColor: avanceTheme.border,
                background: avanceTheme.bg,
                boxShadow: avanceTheme.shadow,
                position: "relative",
                overflow: "hidden",
                "&:before": {
                  content: '\"\"',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: avanceTheme.accent,
                },
              }}
            >
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.6} alignItems={{ sm: "flex-start" }}>
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    color: avanceTheme.text,
                    bgcolor: avanceTheme.iconBg,
                    border: `1px solid ${avanceTheme.borderSoft}`,
                    flex: "0 0 auto",
                  }}
                >
                  <TimelineRoundedIcon />
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mb: 0.9 }}>
                    <Chip
                      size="small"
                      label={data.instrumento}
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        bgcolor: "rgba(37,99,235,.10)",
                        color: "rgb(37,99,235)",
                      }}
                    />
                    <Chip
                      size="small"
                      label={`Código: ${data.codigoIndicador}`}
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 950,
                        bgcolor: avanceTheme.chipBg,
                        color: avanceTheme.text,
                        borderColor: avanceTheme.chipBorder,
                      }}
                    />
                  </Stack>

                  <Typography sx={{ fontWeight: 950, lineHeight: 1.25, fontSize: 16.2 }}>
                    {data.nombreIndicador}
                  </Typography>

                  <Box
                    sx={{
                      mt: 1.1,
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: data.nivel2 ? "1fr 1fr" : "1fr" },
                      gap: 0.8,
                    }}
                  >
                    <Box sx={{ p: 1, borderRadius: 2.2, bgcolor: "rgba(255,255,255,.72)", border: "1px solid rgba(148,163,184,.20)" }}>
                      <Typography sx={{ fontSize: 11.2, color: "text.secondary", fontWeight: 900 }}>
                        {esAg ? "Política" : esPrcp ? "Objetivo prioritario" : esPdrc ? "OER" : "OEI"}
                      </Typography>
                      <Typography sx={{ mt: 0.25, fontSize: 12.6, fontWeight: 800, color: "rgb(51,65,85)" }}>
                        {safeText(data.nivel1)}
                      </Typography>
                    </Box>

                    {data.nivel2 ? (
                      <Box sx={{ p: 1, borderRadius: 2.2, bgcolor: "rgba(255,255,255,.72)", border: "1px solid rgba(148,163,184,.20)" }}>
                        <Typography sx={{ fontSize: 11.2, color: "text.secondary", fontWeight: 900 }}>
                          {esAg ? "Resultado concertado" : esPrcp ? "Medida política" : esPdrc ? "AER" : "AEI"}
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontSize: 12.6, fontWeight: 800, color: "rgb(51,65,85)" }}>
                          {safeText(data.nivel2)}
                        </Typography>
                      </Box>
                    ) : null}
                  </Box>

                  {(esAg || esPdrc) && data.nivel3 ? (
                    <Box sx={{ mt: 0.8, p: 1, borderRadius: 2.2, bgcolor: "rgba(255,255,255,.72)", border: "1px solid rgba(148,163,184,.20)" }}>
                      <Typography sx={{ fontSize: 11.2, color: "text.secondary", fontWeight: 900 }}>
                        {esAg ? "Intervención prioritaria" : "Dimensión / Unidad"}
                      </Typography>
                      <Typography sx={{ mt: 0.25, fontSize: 12.6, fontWeight: 800, color: "rgb(51,65,85)" }}>
                        {safeText(data.nivel3)}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              </Stack>
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
                gap: 1.2,
              }}
            >
              <MiniCard
                title={ultimo.esConsolidado ? "Meta consolidada" : `Meta ${ultimo.anio}`}
                value={formatNumber(ultimo.meta)}
                icon={<FlagRoundedIcon fontSize="small" />}
                borderColor="rgba(37,99,235,0.30)"
              />

              <MiniCard
                title={ultimo.esConsolidado ? "Ejecutado consolidado" : `Ejecutado ${ultimo.anio}`}
                value={formatNumber(ultimo.ejecutado)}
                icon={<CheckCircleRoundedIcon fontSize="small" />}
                borderColor="rgba(34,197,94,0.35)"
              />

              <MiniCard
                title={ultimo.esConsolidado ? "Semestre I consolidado" : `Semestre I ${ultimo.anio}`}
                value={formatNumber(ultimo.semestreI)}
                icon={<CalendarMonthRoundedIcon fontSize="small" />}
                borderColor="rgba(249,115,22,0.38)"
              />

              <MiniCard
                title="Avance"
                value={ultimo.avance == null ? "—" : formatPercent(ultimo.avance)}
                icon={<TrackChangesRoundedIcon fontSize="small" />}
                borderColor="rgba(124,58,237,0.32)"
              />
            </Box>

            <Paper variant="outlined" sx={{
                p: 1.7,
                borderRadius: 3,
                borderColor: avanceTheme.borderSoft,
                bgcolor: "rgba(255,255,255,.96)",
                background: avanceTheme.bg,
                boxShadow: avanceTheme.shadow,
                position: "relative",
                overflow: "hidden",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: avanceTheme.accent,
                  opacity: 0.85,
                },
              }}>
              <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.8 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 13.2 }}>
                  {ultimo.esConsolidado ? "Progreso consolidado del indicador" : "Progreso anual del indicador"}
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 13.2 }}>
                  {ultimo.avance == null ? "—" : formatPercent(ultimo.avance)}
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "rgba(0,0,0,0.08)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundColor: progressColor,
                  },
                }}
              />
            </Paper>

            <Paper variant="outlined" sx={{
                p: 1.7,
                borderRadius: 3,
                borderColor: avanceTheme.borderSoft,
                bgcolor: "rgba(255,255,255,.96)",
                background: avanceTheme.bg,
                boxShadow: avanceTheme.shadow,
                position: "relative",
                overflow: "hidden",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: avanceTheme.accent,
                  opacity: 0.85,
                },
              }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <InfoOutlinedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 900 }}>
                  Información complementaria
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 0.7,
                }}
              >
                {esAg ? (
                  <>
                    <InfoRow label="Línea base" value={data.lineaBase ? `${data.lineaBase.anio} | ${data.lineaBase.tipoValor ?? "BASE"} | ${formatNumber(data.lineaBase.valor)}` : "—"} />
                    <InfoRow label="Fuente" value={data.fuente} />
                    <InfoRow label="Tendencia" value={data.tendencia} />
                    <InfoRow label="Método de cálculo" value={data.metodoCalculo} />
                    <InfoRow label="Unidad de medida" value={data.unidadMedida} />
                    <InfoRow label="Tipo de indicador" value={data.tipoIndicador} />
                    <InfoRow label="Tipo de valor" value={data.tipoValor} />
                  </>
                ) : esPrcp ? (
                  <>
                    <InfoRow label="Unidad de medida" value={data.unidadMedida} />
                    <InfoRow label="Sentido" value={data.tipoIndicador ?? data.sentidoEsperado} />
                  </>
                ) : esPdrc ? (
                  <>
                    <InfoRow label="Línea base" value={data.lineaBase ? `${data.lineaBase.anio} | ${data.lineaBase.tipoValor ?? "BASE"} | ${formatNumber(data.lineaBase.valor)}` : "—"} />
                    <InfoRow label="Nivel" value={data.nivel2 ? "AER" : "OER"} />
                    <InfoRow label="OER" value={data.nivel1} />
                    <InfoRow label="AER" value={data.nivel2} />
                    <InfoRow label="Tipo de valor" value={data.tipoValor} />
                    <InfoRow label="Tipo de medición" value={data.tipoIndicador ?? data.unidadMedida} />
                  </>
                ) : (
                  <>
                    <InfoRow label="Línea base" value={data.lineaBase ? `${data.lineaBase.anio} | ${data.lineaBase.tipoValor ?? "BASE"} | ${formatNumber(data.lineaBase.valor)}` : "—"} />
                    <InfoRow label="Relevancia" value={data.relevancia} />
                    <InfoRow label="Sentido esperado" value={data.sentidoEsperado} />
                    <InfoRow label="Tipo de agregación" value={data.tipoAgregacion} />
                    <InfoRow label="Fuente" value={data.fuente} />
                    <InfoRow label="Tipo de valor" value={data.tipoValor} />
                  </>
                )}
              </Box>
            </Paper>

            {!esPrcp ? (
            <Paper variant="outlined" sx={{
                p: 1.7,
                borderRadius: 3,
                borderColor: avanceTheme.borderSoft,
                bgcolor: "rgba(255,255,255,.96)",
                background: avanceTheme.bg,
                boxShadow: avanceTheme.shadow,
                position: "relative",
                overflow: "hidden",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: avanceTheme.accent,
                  opacity: 0.85,
                },
              }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <CategoryRoundedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 900 }}>
                  Información INFO
                </Typography>
              </Stack>

              <Stack spacing={0.8}>
                {esAg ? (
                  <>
                    <InfoRow
                      label="Factores que favorecieron el avance o logro de los resultados"
                      value={data.factoresFavorecieronAvance ?? data.factoresAvance}
                    />
                    <InfoRow
                      label="Factores que influenciaron en los retrocesos o estancamiento de los resultados"
                      value={data.factoresRetrocesoEstancamiento}
                    />
                    <InfoRow
                      label="Recomendaciones"
                      value={data.recomendaciones ?? data.medidasRecomendadas}
                    />
                  </>
                ) : (
                  <>
                    <InfoRow
                      label="Factores que contribuyeron o dificultaron el avance"
                      value={data.factoresAvance}
                    />
                    <InfoRow
                      label="Medidas recomendadas"
                      value={data.medidasRecomendadas}
                    />
                  </>
                )}
              </Stack>
            </Paper>

            ) : null}

            {!esPrcp ? (
            <Paper variant="outlined" sx={{
                p: 1.7,
                borderRadius: 3,
                borderColor: avanceTheme.borderSoft,
                bgcolor: "rgba(255,255,255,.96)",
                background: avanceTheme.bg,
                boxShadow: avanceTheme.shadow,
                position: "relative",
                overflow: "hidden",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: avanceTheme.accent,
                  opacity: 0.85,
                },
              }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <AttachFileRoundedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 900 }}>
                  Ficha del indicador
                </Typography>
              </Stack>

              {data.ficha?.tieneFicha ? (
                <Stack spacing={0.6}>
                  <InfoRow label="Archivo" value={data.ficha.nombreOriginal} />
                  <InfoRow label="Extensión" value={data.ficha.extension} />
                  <Typography sx={{ fontSize: 13.2 }}>
                    <b>Tamaño:</b> {formatBytes(data.ficha.tamanioBytes)}
                  </Typography>
                </Stack>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  El indicador aún no tiene ficha adjunta.
                </Alert>
              )}
            </Paper>

            ) : null}

            <Paper variant="outlined" sx={{
                p: 1.7,
                borderRadius: 3,
                borderColor: avanceTheme.borderSoft,
                bgcolor: "rgba(255,255,255,.96)",
                background: avanceTheme.bg,
                boxShadow: avanceTheme.shadow,
                position: "relative",
                overflow: "hidden",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: avanceTheme.accent,
                  opacity: 0.85,
                },
              }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TimelineRoundedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 900 }}>
                  Meta, Ejecutado, Semestre I y Avance
                </Typography>
              </Stack>

              <Box sx={{ height: 310 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="anio" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                    <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "Avance %" || name === "Referencia 75%" || name === "Referencia 95%") {
                          return [formatPercent(value), name];
                        }
                        return [formatNumber(value), name];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${DASHBOARD_COLORS.grid}`,
                        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      name="Meta"
                      stroke={COLOR_META}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLOR_META }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ejecutado"
                      name="Ejecutado"
                      stroke={COLOR_EJECUTADO}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLOR_EJECUTADO }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="semestreI"
                      name="Semestre I"
                      stroke={COLOR_SEMESTRE}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: COLOR_SEMESTRE }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avance"
                      name="Avance %"
                      stroke={COLOR_AVANCE}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: COLOR_AVANCE }}
                    />
                    <Line
                      type="monotone"
                      dataKey="referencia75"
                      name="Referencia 75%"
                      stroke={COLOR_REF_75}
                      strokeWidth={2}
                      strokeDasharray="7 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="referencia95"
                      name="Referencia 95%"
                      stroke={COLOR_REF_95}
                      strokeWidth={2}
                      strokeDasharray="7 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 0.2 }}>
              <Button
                onClick={onClose}
                variant="outlined"
                sx={{
                  borderRadius: 2.3,
                  fontWeight: 950,
                  px: 3.2,
                  minHeight: 38,
                  borderColor: "rgba(15,23,42,.55)",
                  color: "rgb(15,23,42)",
                  "&:hover": {
                    borderColor: "rgba(15,23,42,.85)",
                    bgcolor: "rgba(15,23,42,.04)",
                  },
                }}
              >
                Cerrar
              </Button>
            </Box>
          </Stack>
        ) : null}
        </Box>
      </Box>
    </Drawer>
  );
}
