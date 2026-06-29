import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";

import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
import DashboardResumenAction, {
  type DashboardResumenDto,
  type DashboardRankingDto,
} from "../DashboardResumenAction";

const INSTRUMENTOS_MONITOREADOS = ["PDRC", "PRCP", "AG", "PEI", "POI"];
const ORDEN_CARDS_INSTRUMENTOS = ["PDRC", "PRCP", "AG", "PEI", "POI"];

function normalizarInstrumentoOrden(value: string | null | undefined): string {
  return String(value ?? "").replace(/\./g, "").trim().toUpperCase();
}

function getOrdenInstrumento(value: string | null | undefined): number {
  const instrumento = normalizarInstrumentoOrden(value);
  const index = ORDEN_CARDS_INSTRUMENTOS.indexOf(instrumento);
  return index >= 0 ? index : ORDEN_CARDS_INSTRUMENTOS.length;
}

function ordenarPorInstrumento<T extends { instrumento: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ordenA = getOrdenInstrumento(a.instrumento);
    const ordenB = getOrdenInstrumento(b.instrumento);

    if (ordenA !== ordenB) return ordenA - ordenB;

    return a.instrumento.localeCompare(b.instrumento);
  });
}


const COLORS = {
  rojo: "#ef4444",
  amarillo: "#f59e0b",
  verde: "#22c55e",
  azul: "#6366f1",
};

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${n.toFixed(2)}%`;
}

function getEstado(avance: number): {
  label: string;
  color: string;
  bg: string;
  border: string;
  softBg: string;
  shadow: string;
} {
  if (avance < 75) {
    return {
      label: "< 75%",
      color: COLORS.rojo,
      bg: "#fee2e2",
      border: "#f87171",
      softBg: "linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)",
      shadow: "0 14px 30px rgba(239, 68, 68, .10)",
    };
  }

  if (avance < 95) {
    return {
      label: "75% - 95%",
      color: COLORS.amarillo,
      bg: "#fef3c7",
      border: "#f59e0b",
      softBg: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
      shadow: "0 14px 30px rgba(245, 158, 11, .12)",
    };
  }

  return {
    label: "95% a más",
    color: COLORS.verde,
    bg: "#dcfce7",
    border: "#22c55e",
    softBg: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
    shadow: "0 14px 30px rgba(34, 197, 94, .12)",
  };
}

const RANGOS_OFICIALES = [
  {
    label: "Crítico",
    detail: "< 75%",
    color: COLORS.rojo,
    bg: "#fee2e2",
    border: "#fecaca",
  },
  {
    label: "En proceso",
    detail: "75% - 95%",
    color: COLORS.amarillo,
    bg: "#fef3c7",
    border: "#fde68a",
  },
  {
    label: "Logrado",
    detail: "95% a más",
    color: COLORS.verde,
    bg: "#dcfce7",
    border: "#bbf7d0",
  },
];

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement;
  accent: string;
};

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: KpiCardProps): React.ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.35,
        borderRadius: 3.4,
        border: "1px solid",
        borderColor: `${accent}30`,
        boxShadow: "0 18px 42px rgba(15, 23, 42, .075)",
        height: "100%",
        minHeight: 132,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, #ffffff 0%, ${accent}08 48%, #f8fbff 100%)`,
        transition:
          "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 24px 54px rgba(15, 23, 42, .10)",
          borderColor: `${accent}55`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: `linear-gradient(180deg, ${accent} 0%, ${accent}88 100%)`,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          right: -36,
          top: -36,
          width: 128,
          height: 128,
          borderRadius: "50%",
          background: `${accent}10`,
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={0.8}
            alignItems="center"
            sx={{ mb: 0.9 }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 0 4px ${accent}16`,
              }}
            />
            <Typography
              sx={{
                fontSize: 12.2,
                color: "#475569",
                fontWeight: 900,
                letterSpacing: ".015em",
              }}
            >
              {title}
            </Typography>
          </Stack>
          <Typography
            sx={{
              fontSize: 31,
              fontWeight: 950,
              lineHeight: 1,
              color: "#0f172a",
              letterSpacing: "-.035em",
            }}
          >
            {value}
          </Typography>
          {subtitle ? (
            <Typography
              sx={{
                mt: 1.1,
                fontSize: 12.2,
                color: "#64748b",
                fontWeight: 650,
                lineHeight: 1.35,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2.8,
            display: "grid",
            placeItems: "center",
            color: accent,
            background: `linear-gradient(135deg, ${accent}18 0%, #ffffff 100%)`,
            border: `1px solid ${accent}45`,
            boxShadow: `0 12px 24px ${accent}18`,
            flex: "0 0 auto",
            "& svg": { fontSize: 23 },
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

function InstrumentCard({
  item,
}: {
  item: DashboardRankingDto;
}): React.ReactElement {
  const avance = Number(item.avancePromedio ?? 0);
  const estado = getEstado(avance);
  const critico = Number(item.rojo ?? 0);
  const enProceso = Number(item.amarillo ?? 0);
  const logrado = Number(item.verde ?? 0) + Number(item.azul ?? 0);

  const distribucion = [
    {
      label: "Crítico",
      value: critico,
      color: COLORS.rojo,
      bg: "#fee2e2",
      border: "#fecaca",
    },
    {
      label: "En proceso",
      value: enProceso,
      color: COLORS.amarillo,
      bg: "#fef3c7",
      border: "#fde68a",
    },
    {
      label: "Logrado",
      value: logrado,
      color: COLORS.verde,
      bg: "#dcfce7",
      border: "#bbf7d0",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.7,
        borderRadius: 3,
        border: "1px solid",
        borderColor: `${estado.border}80`,
        background: estado.softBg,
        boxShadow: estado.shadow,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: estado.color,
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1.2}
      >
        <Stack spacing={0.2}>
          <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
            {item.instrumento}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#64748b" }}>
            {item.indicadores} indicador(es)/meta(s)
          </Typography>
        </Stack>
        <Chip
          size="small"
          label={estado.label}
          sx={{
            color: estado.color,
            background: estado.bg,
            border: `1px solid ${estado.color}55`,
            fontWeight: 900,
          }}
        />
      </Stack>

      <Typography
        sx={{ mt: 1.4, fontSize: 24, fontWeight: 950, color: estado.color }}
      >
        {formatPercent(item.avancePromedio)}
      </Typography>

      <Box
        sx={{
          mt: 1.15,
          p: 0.75,
          borderRadius: 2.2,
          background: "rgba(255,255,255,.62)",
          border: "1px solid rgba(148,163,184,.18)",
        }}
      >
        <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap>
          {distribucion.map((rango) => (
            <Chip
              key={`${item.instrumento}-${rango.label}`}
              size="small"
              label={`${rango.label}: ${rango.value}`}
              sx={{
                height: 23,
                borderRadius: 999,
                background: rango.bg,
                color: rango.color,
                border: `1px solid ${rango.border}`,
                fontWeight: 900,
                "& .MuiChip-label": { px: 0.8, fontSize: 10.5 },
              }}
            />
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}

function SummaryComparativoCard({
  items,
  paperRef,
}: {
  items: DashboardRankingDto[];
  paperRef?: React.Ref<HTMLDivElement>;
}): React.ReactElement {
  return (
    <Paper
      ref={paperRef}
      elevation={0}
      sx={{
        p: 2.4,
        borderRadius: 3,
        border: "1px solid #dbeafe",
        boxShadow: "0 18px 44px rgba(15,23,42,.08)",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "visible",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: "#2563eb",
        },
      }}
    >
      <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2.2,
            display: "grid",
            placeItems: "center",
            color: "#2563eb",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            boxShadow: "0 10px 22px rgba(37,99,235,.12)",
          }}
        >
          <TableChartRoundedIcon fontSize="small" />
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 950,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "#334155",
            }}
          >
            Resumen comparativo
          </Typography>
          <Typography sx={{ mt: 0.25, fontSize: 12, color: "#64748b" }}>
            Distribución oficial por avance de cada instrumento.
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={1.05}>
        {items.map((item) => {
          const avance = Number(item.avancePromedio ?? 0);
          const estado = getEstado(avance);
          const critico = Number(item.rojo ?? 0);
          const enProceso = Number(item.amarillo ?? 0);
          const logrado = Number(item.verde ?? 0) + Number(item.azul ?? 0);

          const rangos = [
            {
              label: "Crítico",
              value: critico,
              color: COLORS.rojo,
              bg: "#fee2e2",
              border: "#fecaca",
            },
            {
              label: "En proceso",
              value: enProceso,
              color: COLORS.amarillo,
              bg: "#fef3c7",
              border: "#fde68a",
            },
            {
              label: "Logrado",
              value: logrado,
              color: COLORS.verde,
              bg: "#dcfce7",
              border: "#bbf7d0",
            },
          ];

          return (
            <Paper
              key={`home-resumen-comparativo-${item.instrumento}`}
              elevation={0}
              sx={{
                p: 1.35,
                borderRadius: 2.6,
                border: "1px solid",
                borderColor: estado.border,
                background: estado.softBg,
                boxShadow: estado.shadow,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: estado.color,
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="flex-start"
                justifyContent="space-between"
                spacing={1}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>
                    {item.instrumento}
                  </Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 12.3, color: "#475569" }}>
                    {item.indicadores} indicador(es)/meta(s) · Avance: {formatPercent(item.avancePromedio)}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={estado.label}
                  sx={{
                    height: 22,
                    flexShrink: 0,
                    color: estado.color,
                    background: estado.bg,
                    border: `1px solid ${estado.border}`,
                    fontWeight: 950,
                    "& .MuiChip-label": { px: 0.85, fontSize: 10.5 },
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={0.55} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {rangos.map((rango) => (
                  <Chip
                    key={`${item.instrumento}-${rango.label}`}
                    size="small"
                    label={`${rango.label}: ${rango.value}`}
                    sx={{
                      height: 22,
                      borderRadius: 999,
                      background: rango.bg,
                      color: rango.color,
                      border: `1px solid ${rango.border}`,
                      fontWeight: 900,
                      "& .MuiChip-label": { px: 0.75, fontSize: 10.2 },
                    }}
                  />
                ))}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Paper>
  );
}

export default function DashboardHomePage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardResumenDto | null>(null);
  const resumenComparativoRef = useRef<HTMLDivElement | null>(null);
  const [rankingHeight, setRankingHeight] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardResumenAction.getResumen();
      setData(resp);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el dashboard.",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useLayoutEffect(() => {
    const element = resumenComparativoRef.current;

    if (!element || loading || errorMsg || !data) {
      setRankingHeight(null);
      return undefined;
    }

    let frameId = 0;

    const updateRankingHeight = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const nextHeight = Math.ceil(element.offsetHeight);
        setRankingHeight((currentHeight) =>
          currentHeight === nextHeight ? currentHeight : nextHeight,
        );
      });
    };

    updateRankingHeight();

    const resizeObserver = new ResizeObserver(updateRankingHeight);
    resizeObserver.observe(element);
    window.addEventListener("resize", updateRankingHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateRankingHeight);
    };
  }, [data, errorMsg, loading]);

  const rankingData = useMemo<DashboardRankingDto[]>(() => {
    const base = data?.rankingInstrumentos ?? [];
    return INSTRUMENTOS_MONITOREADOS.map(
      (codigo) =>
        base.find((x) => x.instrumento === codigo) ?? {
          instrumento: codigo,
          indicadores: 0,
          avancePromedio: 0,
          rojo: 0,
          amarillo: 0,
          verde: 0,
          azul: 0,
        },
    );
  }, [data]);


  const instrumentCardsData = useMemo<DashboardRankingDto[]>(() => {
    return ORDEN_CARDS_INSTRUMENTOS.map(
      (codigo) =>
        rankingData.find((x) => x.instrumento === codigo) ?? {
          instrumento: codigo,
          indicadores: 0,
          avancePromedio: 0,
          rojo: 0,
          amarillo: 0,
          verde: 0,
          azul: 0,
        },
    );
  }, [rankingData]);

  return (
    <Box
      sx={{
        p: 3,
        background: "linear-gradient(180deg, #f6f9ff 0%, #ffffff 42%)",
        minHeight: "100%",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.3,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #dbeafe",
          background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)",
          boxShadow: "0 18px 42px rgba(15, 23, 42, .07)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                color: "#2563eb",
                background: "#dbeafe",
                border: "1px solid #bfdbfe",
              }}
            >
              <SpaceDashboardRoundedIcon />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 950, color: "#0f172a" }}
              >
                Dashboard Ejecutivo
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.3 }}
              >
                Resumen gerencial de AG, PDRC, PRCP, PEI y POI con datos
                consolidados.
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={() => void loadData()}
            title="Refrescar"
            sx={{ border: "1px solid #cbd5e1", background: "#fff" }}
          >
            <RefreshRoundedIcon />
          </IconButton>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography>Cargando dashboard...</Typography>
          </Stack>
        </Box>
      ) : null}

      {!loading && errorMsg ? (
        <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      ) : null}

      {!loading && !errorMsg && data ? (
        <>
          <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Instrumentos monitoreados"
                value={data.totalInstrumentos}
                subtitle="AG, PDRC, PRCP, PEI y POI"
                icon={<FlagRoundedIcon />}
                accent="#2563eb"
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Indicadores / metas"
                value={data.totalIndicadores}
                subtitle="Total consolidado monitoreado"
                icon={<AccountTreeRoundedIcon />}
                accent="#8b5cf6"
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Unidades responsables"
                value={data.totalUnidadesResponsables}
                subtitle="Unidades orgánicas activas"
                icon={<GroupsRoundedIcon />}
                accent="#10b981"
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Avance promedio"
                value={formatPercent(data.avancePromedio)}
                subtitle="Promedio de instrumentos"
                icon={<ShowChartRoundedIcon />}
                accent="#f97316"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.2} sx={{ mt: 5 }}>
            {instrumentCardsData.map((item) => (
              <Grid item xs={12} sm={6} md={2.4} key={item.instrumento}>
                <InstrumentCard item={item} />
              </Grid>
            ))}
          </Grid>

          <Box
            sx={{
              mt: 2.2,
              mb: 4,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2.15fr) minmax(360px, 1fr)" },
              gap: 2.2,
              alignItems: "start",
              width: "100%",
              position: "relative",
              clear: "both",
            }}
          >
            <Box sx={{ minWidth: 0, display: "flex" }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: 3,
                  border: "1px solid #dbeafe",
                  boxShadow: "0 18px 44px rgba(15,23,42,.08)",
                  width: "100%",
                  height: { xs: "auto", lg: rankingHeight ? `${rankingHeight}px` : "auto" },
                  minHeight: { xs: "auto", lg: rankingHeight ? `${rankingHeight}px` : "auto" },
                  maxHeight: { xs: "none", lg: rankingHeight ? `${rankingHeight}px` : "none" },
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background:
                      "linear-gradient(180deg, #ef4444 0%, #f59e0b 46%, #22c55e 100%)",
                  },
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "flex-start", md: "center" }}
                  justifyContent="space-between"
                  sx={{ mb: 2, flexShrink: 0 }}
                >
                  <Stack direction="row" spacing={1.1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#2563eb",
                      }}
                    />
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 950,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "#334155",
                        }}
                      >
                        Ranking de avance · instrumentos
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.25,
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: 700,
                        }}
                      >
                        Barras coloreadas según la semaforización oficial por
                        avance.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    {RANGOS_OFICIALES.map((rango) => (
                      <Chip
                        key={`ranking-legend-${rango.label}`}
                        size="small"
                        label={`${rango.label}: ${rango.detail}`}
                        sx={{
                          height: 24,
                          color: rango.color,
                          background: rango.bg,
                          border: `1px solid ${rango.border}`,
                          fontWeight: 900,
                          "& .MuiChip-label": { px: 0.9, fontSize: 11 },
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    height: "auto",
                    borderRadius: 2.5,
                    border: "1px solid #e2e8f0",
                    background:
                      "linear-gradient(135deg, rgba(248,250,252,.92) 0%, rgba(255,255,255,.98) 100%)",
                    p: 1.2,
                    overflow: "hidden",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rankingData}
                      layout="vertical"
                      margin={{ top: 18, right: 82, left: 18, bottom: 18 }}
                    >
                      <CartesianGrid
                        stroke={DASHBOARD_COLORS.grid}
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        domain={[0, 120]}
                        tickFormatter={(value) => `${value}%`}
                        tick={{
                          fill: "#64748b",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="instrumento"
                        width={72}
                        tick={{
                          fill: "#64748b",
                          fontSize: 14,
                          fontWeight: 850,
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v: number) => formatPercent(v)}
                        cursor={{ fill: "rgba(37,99,235,.06)" }}
                      />
                      <Bar
                        dataKey="avancePromedio"
                        name="Avance promedio"
                        radius={[0, 10, 10, 0]}
                        barSize={28}
                      >
                        {rankingData.map((entry) => {
                          const estado = getEstado(
                            Number(entry.avancePromedio ?? 0),
                          );
                          return (
                            <Cell
                              key={`ranking-home-${entry.instrumento}`}
                              fill={estado.color}
                            />
                          );
                        })}
                        <LabelList
                          dataKey="avancePromedio"
                          position="right"
                          formatter={(value) =>
                            formatPercent(Number(value ?? 0))
                          }
                          style={{
                            fill: "#0f172a",
                            fontSize: 13,
                            fontWeight: 900,
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>

            <Box sx={{ display: "flex", minWidth: 0 }}>
              <SummaryComparativoCard items={rankingData} paperRef={resumenComparativoRef} />
            </Box>
          </Box>

          <Paper
            elevation={0}
            sx={{
              mt: 3,
              p: 2.2,
              borderRadius: 3,
              border: "1px solid #dbeafe",
              boxShadow: "0 18px 44px rgba(15,23,42,.08)",
              background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
              position: "relative",
              zIndex: 2,
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                background: "linear-gradient(180deg, #ef4444 0%, #f59e0b 100%)",
              },
            }}
          >
            {(() => {
              const alertas = data.alertasCriticas ?? [];
              const alertasCriticas = ordenarPorInstrumento(
                alertas.filter((item) => item.nivel === "CRITICO"),
              );
              const alertasRevision = ordenarPorInstrumento(
                alertas.filter((item) => item.nivel !== "CRITICO"),
              );

              const renderAlerta = (
                item: (typeof alertas)[number],
                index: number,
              ): React.ReactElement => {
                const esCritico = item.nivel === "CRITICO";
                const theme = esCritico
                  ? {
                      label: "Crítico",
                      range: "< 75%",
                      color: COLORS.rojo,
                      bg: "linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)",
                      border: "#fecaca",
                      chipBg: "#fee2e2",
                    }
                  : {
                      label: "Revisión",
                      range: "> 100%",
                      color: COLORS.amarillo,
                      bg: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
                      border: "#fed7aa",
                      chipBg: "#ffedd5",
                    };

                return (
                  <Paper
                    key={`${item.instrumento}-${item.titulo}-${index}`}
                    elevation={0}
                    sx={{
                      p: 1.55,
                      borderRadius: 2.8,
                      border: `1px solid ${theme.border}`,
                      background: theme.bg,
                      boxShadow: `0 12px 28px ${theme.color}14`,
                      position: "relative",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        background: theme.color,
                      },
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      alignItems={{ xs: "flex-start", md: "center" }}
                      justifyContent="space-between"
                      spacing={1.5}
                    >
                      <Stack
                        direction="row"
                        spacing={1.2}
                        alignItems="flex-start"
                        sx={{ minWidth: 0 }}
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            color: theme.color,
                            background: `${theme.color}14`,
                            border: `1px solid ${theme.color}35`,
                            flexShrink: 0,
                          }}
                        >
                          <WarningAmberRoundedIcon fontSize="small" />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Chip
                              size="small"
                              label={item.instrumento}
                              sx={{
                                height: 22,
                                color: theme.color,
                                background: theme.chipBg,
                                border: `1px solid ${theme.border}`,
                                fontWeight: 950,
                                "& .MuiChip-label": {
                                  px: 0.75,
                                  fontSize: 10.5,
                                },
                              }}
                            />
                            <Typography
                              sx={{
                                fontWeight: 950,
                                color: "#0f172a",
                                lineHeight: 1.25,
                              }}
                            >
                              {item.titulo}
                            </Typography>
                          </Stack>
                          <Typography
                            sx={{
                              mt: 0.45,
                              fontSize: 12.7,
                              color: "#475569",
                              lineHeight: 1.45,
                            }}
                          >
                            {item.descripcion}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip
                          size="small"
                          label={theme.label}
                          sx={{
                            color: theme.color,
                            background: theme.chipBg,
                            border: `1px solid ${theme.border}`,
                            fontWeight: 950,
                          }}
                        />
                        <Chip
                          size="small"
                          label={theme.range}
                          sx={{
                            color: theme.color,
                            background: "rgba(255,255,255,.72)",
                            border: `1px solid ${theme.border}`,
                            fontWeight: 950,
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                );
              };

              return (
                <>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "flex-start", md: "center" }}
                    justifyContent="space-between"
                    sx={{ mb: 1.7 }}
                  >
                    <Stack direction="row" spacing={1.1} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2.4,
                          display: "grid",
                          placeItems: "center",
                          color: "#f97316",
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                        }}
                      >
                        <WarningAmberRoundedIcon />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>
                          Alertas de consistencia y avance
                        </Typography>
                        <Typography
                          sx={{
                            mt: 0.25,
                            fontSize: 12.2,
                            color: "#64748b",
                            fontWeight: 700,
                          }}
                        >
                          Priorización UX Premium por criticidad y revisión de
                          sobreavances.
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={0.8}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Chip
                        size="small"
                        label={`${alertas.length} alertas`}
                        sx={{
                          color: "#2563eb",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          fontWeight: 950,
                        }}
                      />
                      <Chip
                        size="small"
                        label={`${alertasCriticas.length} críticas`}
                        sx={{
                          color: COLORS.rojo,
                          background: "#fee2e2",
                          border: "1px solid #fecaca",
                          fontWeight: 950,
                        }}
                      />
                      <Chip
                        size="small"
                        label={`${alertasRevision.length} revisión`}
                        sx={{
                          color: COLORS.amarillo,
                          background: "#fef3c7",
                          border: "1px solid #fde68a",
                          fontWeight: 950,
                        }}
                      />
                    </Stack>
                  </Stack>

                  {!alertas.length ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No se encontraron alertas críticas.
                    </Alert>
                  ) : (
                    <Stack spacing={1.5}>
                      {alertasCriticas.length ? (
                        <Box>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                            sx={{ mb: 0.9 }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: COLORS.rojo,
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: 12.5,
                                fontWeight: 950,
                                color: "#991b1b",
                                letterSpacing: ".06em",
                                textTransform: "uppercase",
                              }}
                            >
                              Alertas críticas · avance menor a 75%
                            </Typography>
                          </Stack>
                          <Stack spacing={1}>
                            {alertasCriticas.map(renderAlerta)}
                          </Stack>
                        </Box>
                      ) : null}

                      {alertasRevision.length ? (
                        <Box>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                            sx={{ mb: 0.9 }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: COLORS.amarillo,
                              }}
                            />
                            <Typography
                              sx={{
                                fontSize: 12.5,
                                fontWeight: 950,
                                color: "#92400e",
                                letterSpacing: ".06em",
                                textTransform: "uppercase",
                              }}
                            >
                              Alertas de revisión · avance mayor a 100%
                            </Typography>
                          </Stack>
                          <Stack spacing={1}>
                            {alertasRevision.map(renderAlerta)}
                          </Stack>
                        </Box>
                      ) : null}
                    </Stack>
                  )}
                </>
              );
            })()}
          </Paper>
        </>
      ) : null}
    </Box>
  );
}
