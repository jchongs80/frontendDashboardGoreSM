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
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
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

const INSTRUMENTOS = ["AG", "PDRC", "PRCP", "PEI", "POI"] as const;

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

function getEstado(avance: number): { label: string; color: string; bg: string } {
  if (avance < 75) return { label: "ROJO", color: "#dc2626", bg: "#fee2e2" };
  if (avance < 95) return { label: "AMARILLO", color: "#d97706", bg: "#fef3c7" };
  if (avance <= 100) return { label: "VERDE", color: "#16a34a", bg: "#dcfce7" };
  return { label: "AZUL", color: "#4f46e5", bg: "#e0e7ff" };
}

function InstrumentSummaryCard({ item }: { item: DashboardComparativoInstrumentoDto }): React.ReactElement {
  const estado = getEstado(Number(item.avancePromedio ?? 0));
  const border = lineColors[item.instrumento] ?? DASHBOARD_COLORS.primary;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: `${border}55`,
        background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography sx={{ fontWeight: 950, fontSize: 16, color: "#0f172a" }}>{item.instrumento}</Typography>
        <Chip
          size="small"
          label={estado.label}
          sx={{ background: estado.bg, color: estado.color, border: `1px solid ${estado.color}55`, fontWeight: 900 }}
        />
      </Stack>
      <Typography sx={{ mt: 1, fontSize: 24, fontWeight: 950, color: border }}>
        {formatPercent(item.avancePromedio)}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.4 }}>
        {item.indicadores} indicador(es)/meta(s)
      </Typography>
      <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        <Chip size="small" label={`R:${item.rojo}`} sx={{ background: "#fee2e2", color: "#991b1b", fontWeight: 800 }} />
        <Chip size="small" label={`A:${item.amarillo}`} sx={{ background: "#fef3c7", color: "#92400e", fontWeight: 800 }} />
        <Chip size="small" label={`V:${item.verde}`} sx={{ background: "#dcfce7", color: "#166534", fontWeight: 800 }} />
        <Chip size="small" label={`Az:${item.azul}`} sx={{ background: "#e0e7ff", color: "#3730a3", fontWeight: 800 }} />
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
                }}
              >
                <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
                  <Typography sx={{ fontWeight: 950, letterSpacing: ".08em", textTransform: "uppercase", color: "#334155" }}>
                    Ranking de avance · instrumentos
                  </Typography>
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
                      <Tooltip formatter={(v: number) => formatPercent(v)} cursor={{ fill: "rgba(37,99,235,.06)" }} />
                      <Bar dataKey="avancePromedio" name="Avance promedio" radius={[0, 10, 10, 0]} barSize={30}>
                        {rankingData.map((entry) => (
                          <Cell key={`ranking-comparativo-${entry.instrumento}`} fill={lineColors[entry.instrumento] ?? DASHBOARD_COLORS.primary} />
                        ))}
                        <LabelList
                          dataKey="avancePromedio"
                          position="right"
                          formatter={(value: number) => formatPercent(value)}
                          style={{ fill: "#0f172a", fontSize: 13, fontWeight: 900 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #dbeafe", boxShadow: "0 16px 38px rgba(15,23,42,.07)", background: "#fff", height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <TableChartRoundedIcon fontSize="small" sx={{ color: "#2563eb" }} />
                  <Typography sx={{ fontWeight: 950 }}>Resumen comparativo</Typography>
                </Stack>
                <Stack spacing={1.1}>
                  {rankingData.map((item) => {
                    const estado = getEstado(Number(item.avancePromedio ?? 0));
                    return (
                      <Paper key={item.instrumento} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, borderColor: `${estado.color}44` }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Typography sx={{ fontWeight: 950 }}>{item.instrumento}</Typography>
                          <Chip size="small" label={estado.label} sx={{ background: estado.bg, color: estado.color, fontWeight: 900 }} />
                        </Stack>
                        <Typography sx={{ fontSize: 13, color: "#475569", mt: 0.35 }}>
                          Indicadores/metas: {item.indicadores} · Avance: {formatPercent(item.avancePromedio)}
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, color: "#64748b", mt: 0.25 }}>
                          Rojo: {item.rojo} · Amarillo: {item.amarillo} · Verde: {item.verde} · Azul: {item.azul}
                        </Typography>
                      </Paper>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #dbeafe", boxShadow: "0 16px 38px rgba(15,23,42,.07)", background: "#fff" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <TimelineRoundedIcon fontSize="small" sx={{ color: "#2563eb" }} />
                  <Typography sx={{ fontWeight: 950 }}>Tendencia comparativa por instrumento</Typography>
                </Stack>
                <Box sx={{ height: 390 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 18, right: 24, left: 0, bottom: 5 }}>
                      <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 13, fontWeight: 700 }} />
                      <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} domain={[0, 120]} />
                      <Tooltip
                        formatter={(value: number, name: string) => [formatPercent(value), name]}
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
