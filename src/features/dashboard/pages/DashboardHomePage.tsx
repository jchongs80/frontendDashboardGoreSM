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
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";

import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
import DashboardResumenAction, {
  type DashboardResumenDto,
  type DashboardRankingDto,
} from "../DashboardResumenAction";

const INSTRUMENTOS_MONITOREADOS = ["AG", "PDRC", "PRCP", "PEI", "POI"];

const COLORS = {
  rojo: "#ef4444",
  amarillo: "#f59e0b",
  verde: "#22c55e",
  azul: "#6366f1",
};

const instrumentGradient: Record<string, string> = {
  AG: "linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%)",
  PDRC: "linear-gradient(135deg, #ccfbf1 0%, #ecfeff 100%)",
  PRCP: "linear-gradient(135deg, #fee2e2 0%, #fff7ed 100%)",
  PEI: "linear-gradient(135deg, #ede9fe 0%, #eff6ff 100%)",
  POI: "linear-gradient(135deg, #dbeafe 0%, #f0fdf4 100%)",
};

const instrumentBorder: Record<string, string> = {
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
  if (avance < 75) return { label: "ROJO", color: COLORS.rojo, bg: "#fee2e2" };
  if (avance < 95) return { label: "AMARILLO", color: COLORS.amarillo, bg: "#fef3c7" };
  if (avance <= 100) return { label: "VERDE", color: COLORS.verde, bg: "#dcfce7" };
  return { label: "AZUL", color: COLORS.azul, bg: "#e0e7ff" };
}

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactElement;
  accent: string;
};

function KpiCard({ title, value, subtitle, icon, accent }: KpiCardProps): React.ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "#dbeafe",
        boxShadow: "0 16px 38px rgba(15, 23, 42, .07)",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: accent,
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography sx={{ fontSize: 12.5, color: "#475569", fontWeight: 800 }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 0.7, fontSize: 28, fontWeight: 950, lineHeight: 1.1, color: "#0f172a" }}>
            {value}
          </Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.8, fontSize: 12.3, color: "#64748b" }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2.5,
            display: "grid",
            placeItems: "center",
            color: accent,
            background: `${accent}14`,
            border: `1px solid ${accent}40`,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

function InstrumentCard({ item }: { item: DashboardRankingDto }): React.ReactElement {
  const estado = getEstado(Number(item.avancePromedio ?? 0));
  const border = instrumentBorder[item.instrumento] ?? DASHBOARD_COLORS.primary;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.7,
        borderRadius: 3,
        border: "1px solid",
        borderColor: `${border}55`,
        background: instrumentGradient[item.instrumento] ?? "#fff",
        boxShadow: "0 12px 28px rgba(15, 23, 42, .06)",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.2}>
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

      <Typography sx={{ mt: 1.4, fontSize: 24, fontWeight: 950, color: border }}>
        {formatPercent(item.avancePromedio)}
      </Typography>
      <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap sx={{ mt: 1.1 }}>
        <Chip size="small" label={`R: ${item.rojo}`} sx={{ background: "#fee2e2", color: "#991b1b", fontWeight: 800 }} />
        <Chip size="small" label={`A: ${item.amarillo}`} sx={{ background: "#fef3c7", color: "#92400e", fontWeight: 800 }} />
        <Chip size="small" label={`V: ${item.verde}`} sx={{ background: "#dcfce7", color: "#166534", fontWeight: 800 }} />
        <Chip size="small" label={`Az: ${item.azul}`} sx={{ background: "#e0e7ff", color: "#3730a3", fontWeight: 800 }} />
      </Stack>
    </Paper>
  );
}

export default function DashboardHomePage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardResumenDto | null>(null);

  async function loadData() {
    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardResumenAction.getResumen();
      setData(resp);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el dashboard.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const rankingData = useMemo<DashboardRankingDto[]>(() => {
    const base = data?.rankingInstrumentos ?? [];
    return INSTRUMENTOS_MONITOREADOS.map((codigo) =>
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

  const pieData = useMemo(() => {
    return [
      { name: "Crítico (<75%)", value: data?.semaforo?.rojo ?? 0, color: COLORS.rojo },
      { name: "Moderado (75–95%)", value: data?.semaforo?.amarillo ?? 0, color: COLORS.amarillo },
      { name: "Logrado (95–100%)", value: data?.semaforo?.verde ?? 0, color: COLORS.verde },
      { name: "Superado (>100%)", value: data?.semaforo?.azul ?? 0, color: COLORS.azul },
    ];
  }, [data]);

  const semaforoTotal = useMemo(() => {
    return pieData.reduce((acc, item) => acc + Number(item.value ?? 0), 0);
  }, [pieData]);

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
              <SpaceDashboardRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 950, color: "#0f172a" }}>
                Dashboard Ejecutivo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
                Resumen gerencial de AG, PDRC, PRCP, PEI y POI con datos consolidados.
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
              <KpiCard title="Instrumentos monitoreados" value={data.totalInstrumentos} subtitle="AG, PDRC, PRCP, PEI y POI" icon={<FlagRoundedIcon />} accent="#2563eb" />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard title="Indicadores / metas" value={data.totalIndicadores} subtitle="Total consolidado monitoreado" icon={<AccountTreeRoundedIcon />} accent="#8b5cf6" />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard title="Unidades responsables" value={data.totalUnidadesResponsables} subtitle="Unidades orgánicas activas" icon={<GroupsRoundedIcon />} accent="#10b981" />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard title="Avance promedio" value={formatPercent(data.avancePromedio)} subtitle="Promedio de instrumentos" icon={<ShowChartRoundedIcon />} accent="#f97316" />
            </Grid>
          </Grid>

          <Grid container spacing={2.2} sx={{ mt: 5 }}>
            {rankingData.map((item) => (
              <Grid item xs={12} sm={6} md={2.4} key={item.instrumento}>
                <InstrumentCard item={item} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.2} sx={{ mt: 2.2 }}>
            <Grid item xs={12} lg={8}>
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
                <Box sx={{ height: 355 }}>
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
                          <Cell key={`ranking-home-${entry.instrumento}`} fill={instrumentBorder[entry.instrumento] ?? DASHBOARD_COLORS.secondary} />
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

            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: 3,
                  border: "1px solid #dbeafe",
                  boxShadow: "0 18px 44px rgba(15,23,42,.08)",
                  height: "100%",
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
                }}
              >
                <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#64748b" }} />
                  <Typography sx={{ fontWeight: 950, letterSpacing: ".08em", textTransform: "uppercase", color: "#334155" }}>
                    Distribución semáforo
                  </Typography>
                </Stack>
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={66}
                        outerRadius={104}
                        paddingAngle={3}
                        stroke="#ffffff"
                        strokeWidth={3}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Stack spacing={1.25} sx={{ mt: 1 }}>
                  {pieData.map((item) => {
                    const pct = semaforoTotal > 0 ? Math.min(100, (Number(item.value) / semaforoTotal) * 100) : 0;
                    return (
                      <Stack key={item.name} direction="row" alignItems="center" spacing={1.4}>
                        <Typography sx={{ width: 128, fontSize: 13, color: "#475569", fontWeight: 700 }}>
                          {item.name}
                        </Typography>
                        <Box sx={{ flex: 1, height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
                          <Box sx={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: item.color }} />
                        </Box>
                        <Typography sx={{ width: 44, textAlign: "right", fontSize: 13, color: item.color, fontWeight: 950 }}>
                          {item.value}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ mt: 2.2, p: 2, borderRadius: 3, border: "1px solid #dbeafe", boxShadow: "0 16px 38px rgba(15,23,42,.07)", background: "#fff" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <WarningAmberRoundedIcon fontSize="small" sx={{ color: "#f97316" }} />
              <Typography sx={{ fontWeight: 950 }}>Alertas de consistencia y avance</Typography>
            </Stack>

            {!data.alertasCriticas?.length ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No se encontraron alertas críticas.</Alert>
            ) : (
              <Stack spacing={1}>
                {data.alertasCriticas.map((item, index) => (
                  <Paper key={`${item.instrumento}-${item.titulo}-${index}`} variant="outlined" sx={{ p: 1.5, borderRadius: 2.4, borderColor: item.nivel === "CRITICO" ? "#fecaca" : "#fed7aa", background: item.nivel === "CRITICO" ? "#fff1f2" : "#fff7ed" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography sx={{ fontWeight: 950 }}>[{item.instrumento}] {item.titulo}</Typography>
                        <Typography sx={{ fontSize: 13, color: "#475569", mt: 0.3 }}>{item.descripcion}</Typography>
                      </Box>
                      <Chip size="small" label={item.nivel} sx={{ fontWeight: 950, color: item.nivel === "CRITICO" ? "#991b1b" : "#9a3412", background: item.nivel === "CRITICO" ? "#fee2e2" : "#ffedd5" }} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </>
      ) : null}
    </Box>
  );
}
