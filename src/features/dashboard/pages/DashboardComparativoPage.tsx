import React, { useEffect, useMemo, useState } from "react";
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
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  Cell,
  LabelList,
} from "recharts";

import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
import DashboardComparativoAction, {
  type DashboardComparativoDto,
  type DashboardComparativoInstrumentoDto,
} from "../DashboardComparativoAction";

const INSTRUMENTOS = ["PDRC", "PRCP", "AG", "PEI", "POI"] as const;

const lineColors: Record<string, string> = {
  AG: "#f59e0b",
  PDRC: "#14b8a6",
  PRCP: "#ef4444",
  PEI: "#8b5cf6",
  POI: "#2563eb",
};

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${n.toFixed(2)}%`;
}

function getAvanceTheme(avance: number): {
  color: string;
  border: string;
  bg: string;
  softBg: string;
  shadow: string;
  label: string;
  shortLabel: string;
} {
  if (avance >= 95) {
    return {
      color: "#16a34a",
      border: "rgba(34, 197, 94, .55)",
      bg: "#dcfce7",
      softBg: "linear-gradient(135deg, rgba(240,253,244,.98) 0%, rgba(220,252,231,.72) 100%)",
      shadow: "0 16px 36px rgba(22,163,74,.10)",
      label: "95% a más",
      shortLabel: "Logrado",
    };
  }

  if (avance >= 75) {
    return {
      color: "#d97706",
      border: "rgba(245, 158, 11, .58)",
      bg: "#fef3c7",
      softBg: "linear-gradient(135deg, rgba(255,251,235,.98) 0%, rgba(254,243,199,.76) 100%)",
      shadow: "0 16px 36px rgba(217,119,6,.10)",
      label: "75% - 95%",
      shortLabel: "En proceso",
    };
  }

  return {
    color: "#dc2626",
    border: "rgba(248, 113, 113, .60)",
    bg: "#fee2e2",
    softBg: "linear-gradient(135deg, rgba(255,245,245,.98) 0%, rgba(254,226,226,.78) 100%)",
    shadow: "0 16px 36px rgba(220,38,38,.10)",
    label: "< 75%",
    shortLabel: "Crítico",
  };
}

function getDistribucionOficial(item: DashboardComparativoInstrumentoDto): {
  critico: number;
  enProceso: number;
  logrado: number;
} {
  return {
    critico: Number(item.rojo ?? 0),
    enProceso: Number(item.amarillo ?? 0),
    logrado: Number(item.verde ?? 0) + Number(item.azul ?? 0),
  };
}

function RangeChip({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "green" }): React.ReactElement {
  const styles = {
    red: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" },
    amber: { bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
    green: { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" },
  }[tone];

  return (
    <Chip
      size="small"
      label={`${label}: ${value}`}
      sx={{
        height: 22,
        background: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        fontSize: 10.5,
        fontWeight: 900,
        "& .MuiChip-label": { px: 0.75 },
      }}
    />
  );
}

function InstrumentSummaryCard({ item }: { item: DashboardComparativoInstrumentoDto }): React.ReactElement {
  const avance = Number(item.avancePromedio ?? 0);
  const avanceTheme = getAvanceTheme(avance);
  const distribucion = getDistribucionOficial(item);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.55,
        borderRadius: 2.8,
        border: "1px solid",
        borderColor: avanceTheme.border,
        background: avanceTheme.softBg,
        boxShadow: avanceTheme.shadow,
        position: "relative",
        overflow: "hidden",
        minHeight: 128,
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: avanceTheme.color,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box>
          <Typography sx={{ fontWeight: 950, fontSize: 16, color: "#0f172a" }}>{item.instrumento}</Typography>
          <Typography sx={{ fontSize: 11.5, color: "#64748b", mt: 0.2 }}>
            {item.indicadores} indicador(es)/meta(s)
          </Typography>
        </Box>
        <Chip
          size="small"
          label={avanceTheme.label}
          sx={{
            height: 23,
            background: avanceTheme.bg,
            color: avanceTheme.color,
            border: `1px solid ${avanceTheme.border}`,
            fontWeight: 950,
            fontSize: 10.5,
            "& .MuiChip-label": { px: 0.85 },
          }}
        />
      </Stack>

      <Typography sx={{ mt: 1.2, fontSize: 25, lineHeight: 1, fontWeight: 950, color: avanceTheme.color }}>
        {formatPercent(item.avancePromedio)}
      </Typography>

      <Stack
        direction="row"
        spacing={0.55}
        flexWrap="wrap"
        useFlexGap
        sx={{
          mt: 1.15,
          p: 0.65,
          borderRadius: 2,
          border: "1px solid rgba(148,163,184,.22)",
          background: "rgba(255,255,255,.62)",
        }}
      >
        <RangeChip label="Crítico" value={distribucion.critico} tone="red" />
        <RangeChip label="En proceso" value={distribucion.enProceso} tone="amber" />
        <RangeChip label="Logrado" value={distribucion.logrado} tone="green" />
      </Stack>
    </Paper>
  );
}

export default function DashboardComparativoPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardComparativoDto | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardComparativoAction.getComparativo();
      setData(resp);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el comparativo.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const rankingData = useMemo<DashboardComparativoInstrumentoDto[]>(() => {
    const base = data?.instrumentos ?? [];
    return INSTRUMENTOS.map((codigo) =>
      base.find((x) => x.instrumento === codigo) ?? {
        instrumento: codigo,
        indicadores: 0,
        avancePromedio: 0,
        rojo: 0,
        amarillo: 0,
        verde: 0,
        azul: 0,
      }
    );
  }, [data]);

  const trendData = useMemo(() => {
    const source = data?.tendencia ?? [];
    const byPeriodo = new Map<string, Record<string, string | number>>();

    source.forEach((item) => {
      if (!byPeriodo.has(item.periodo)) {
        byPeriodo.set(item.periodo, { periodo: item.periodo });
      }
      byPeriodo.get(item.periodo)![item.instrumento] = Number(item.valor ?? 0);
    });

    return Array.from(byPeriodo.values()).sort((a, b) => String(a.periodo).localeCompare(String(b.periodo)));
  }, [data]);

  return (
    <Box sx={{ p: 3, background: "linear-gradient(180deg, #f6f9ff 0%, #ffffff 42%)", minHeight: "100%" }}>
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
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
              <CompareArrowsRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 950, color: "#0f172a" }}>
                Dashboard Comparativo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Comparativo real de AG, PDRC, PRCP, PEI y POI.
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={() => void loadData()} title="Refrescar" sx={{ border: "1px solid #cbd5e1", background: "#fff" }}>
            <RefreshRoundedIcon />
          </IconButton>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography>Cargando comparativo...</Typography>
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
            {rankingData.map((item) => (
              <Grid item xs={12} sm={6} md={2.4} key={item.instrumento}>
                <InstrumentSummaryCard item={item} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} lg={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: 3,
                  border: "1px solid #dbeafe",
                  boxShadow: "0 18px 44px rgba(15,23,42,.08)",
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: "linear-gradient(180deg, #ef4444 0%, #f59e0b 48%, #22c55e 100%)",
                  },
                }}
              >
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.4} sx={{ mb: 2 }}>
                  <Box>
                    <Stack direction="row" spacing={1.1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
                      <Typography sx={{ fontWeight: 950, letterSpacing: ".08em", textTransform: "uppercase", color: "#334155" }}>
                        Ranking de avance · instrumentos
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.45 }}>
                      Barras coloreadas según la semaforización oficial por avance.
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label="Crítico: < 75%" sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 900, border: "1px solid #fecaca" }} />
                    <Chip size="small" label="En proceso: 75% - 95%" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 900, border: "1px solid #fde68a" }} />
                    <Chip size="small" label="Logrado: 95% a más" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 900, border: "1px solid #bbf7d0" }} />
                  </Stack>
                </Stack>
                <Box sx={{ height: 380 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rankingData}
                      layout="vertical"
                      margin={{ top: 8, right: 74, left: 14, bottom: 10 }}
                    >
                      <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 120]}
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fill: "#64748b", fontSize: 13, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="instrumento"
                        width={72}
                        tick={{ fill: "#64748b", fontSize: 14, fontWeight: 850 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(value) => formatPercent(Number(value ?? 0))} cursor={{ fill: "rgba(37,99,235,.06)" }} />
                      <Bar dataKey="avancePromedio" name="Avance promedio" radius={[0, 10, 10, 0]} barSize={30}>
                        {rankingData.map((entry) => (
                          <Cell key={`ranking-comparativo-${entry.instrumento}`} fill={getAvanceTheme(Number(entry.avancePromedio ?? 0)).color} />
                        ))}
                        <LabelList
                          dataKey="avancePromedio"
                          position="right"
                          formatter={(value) => formatPercent(Number(value ?? 0))}
                          style={{ fill: "#0f172a", fontSize: 13, fontWeight: 900 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: 3,
                  border: "1px solid #dbeafe",
                  boxShadow: "0 16px 38px rgba(15,23,42,.07)",
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                  height: "100%",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <TableChartRoundedIcon fontSize="small" sx={{ color: "#2563eb" }} />
                  <Box>
                    <Typography sx={{ fontWeight: 950 }}>Resumen comparativo</Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                      Distribución oficial por avance de cada instrumento.
                    </Typography>
                  </Box>
                </Stack>
                <Stack spacing={1.15}>
                  {rankingData.map((item) => {
                    const avance = Number(item.avancePromedio ?? 0);
                    const avanceTheme = getAvanceTheme(avance);
                    const distribucion = getDistribucionOficial(item);
                    return (
                      <Paper
                        key={item.instrumento}
                        variant="outlined"
                        sx={{
                          p: 1.45,
                          borderRadius: 2.6,
                          borderColor: avanceTheme.border,
                          background: avanceTheme.softBg,
                          boxShadow: avanceTheme.shadow,
                          position: "relative",
                          overflow: "hidden",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            background: avanceTheme.color,
                          },
                        }}
                      >
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>{item.instrumento}</Typography>
                            <Typography sx={{ fontSize: 13, color: "#475569", mt: 0.35 }}>
                              {item.indicadores} indicador(es)/meta(s) · Avance: {formatPercent(item.avancePromedio)}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={avanceTheme.label}
                            sx={{
                              height: 22,
                              bgcolor: avanceTheme.bg,
                              color: avanceTheme.color,
                              border: `1px solid ${avanceTheme.border}`,
                              fontWeight: 950,
                              fontSize: 10.5,
                              "& .MuiChip-label": { px: 0.85 },
                            }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={0.55} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                          <RangeChip label="Crítico" value={distribucion.critico} tone="red" />
                          <RangeChip label="En proceso" value={distribucion.enProceso} tone="amber" />
                          <RangeChip label="Logrado" value={distribucion.logrado} tone="green" />
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: 3,
                  border: "1px solid #dbeafe",
                  boxShadow: "0 16px 38px rgba(15,23,42,.07)",
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                  position: "relative",
                  overflow: "hidden",
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
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={1.2} sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TimelineRoundedIcon fontSize="small" sx={{ color: "#2563eb" }} />
                    <Box>
                      <Typography sx={{ fontWeight: 950 }}>Tendencia comparativa por instrumento</Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.2 }}>
                        Evolución histórica comparativa manteniendo identidad visual por instrumento.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    {INSTRUMENTOS.map((instrumento) => {
                      const item = rankingData.find((x) => x.instrumento === instrumento);
                      const theme = getAvanceTheme(Number(item?.avancePromedio ?? 0));
                      return (
                        <Chip
                          key={`trend-chip-${instrumento}`}
                          size="small"
                          label={`${instrumento}: ${theme.label}`}
                          sx={{
                            bgcolor: theme.bg,
                            color: theme.color,
                            border: `1px solid ${theme.border}`,
                            fontWeight: 900,
                            fontSize: 11,
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Stack>
                <Box sx={{ height: 390 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 18, right: 24, left: 0, bottom: 5 }}>
                      <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 13, fontWeight: 700 }} />
                      <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} domain={[0, 120]} />
                      <Tooltip
                        formatter={(value, name) => [formatPercent(Number(value ?? 0)), name]}
                        contentStyle={{
                          borderRadius: 12,
                          border: `1px solid ${DASHBOARD_COLORS.grid}`,
                          boxShadow: "0 10px 25px rgba(0,0,0,.08)",
                        }}
                      />
                      <Legend />
                      {INSTRUMENTOS.map((instrumento) => (
                        <Line
                          key={instrumento}
                          type="monotone"
                          dataKey={instrumento}
                          name={instrumento}
                          stroke={lineColors[instrumento]}
                          strokeWidth={3}
                          dot={{ r: 4, fill: lineColors[instrumento] }}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      ) : null}
    </Box>
  );
}
