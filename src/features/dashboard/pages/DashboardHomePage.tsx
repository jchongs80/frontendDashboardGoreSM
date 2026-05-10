import React, { useEffect, useMemo, useState } from "react";
import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
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
import IconButton from "@mui/material/IconButton";

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
} from "recharts";

import DashboardResumenAction, {
  type DashboardResumenDto,
  type DashboardRankingDto,
} from "../DashboardResumenAction";

const COLORS = {
  rojo: "#EF4444",
  amarillo: "#F59E0B",
  verde: "#22C55E",
  azul: "#3B82F6",
};

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${n.toFixed(2)}%`;
}

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
};

function KpiCard({ title, value, subtitle }: KpiCardProps): React.ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 24px rgba(0,0,0,.05)",
        height: "100%",
      }}
    >
      <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 0.6, fontSize: 26, fontWeight: 900, lineHeight: 1.2 }}>
        {value}
      </Typography>
      {subtitle ? (
        <Typography sx={{ mt: 0.7, fontSize: 12.5, color: "text.secondary" }}>
          {subtitle}
        </Typography>
      ) : null}
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

  const pieData = useMemo(() => {
    return [
      { name: "Rojo", value: data?.semaforo?.rojo ?? 0, color: COLORS.rojo },
      { name: "Amarillo", value: data?.semaforo?.amarillo ?? 0, color: COLORS.amarillo },
      { name: "Verde", value: data?.semaforo?.verde ?? 0, color: COLORS.verde },
      { name: "Azul", value: data?.semaforo?.azul ?? 0, color: COLORS.azul },
    ];
  }, [data]);

  const rankingData = useMemo<DashboardRankingDto[]>(() => {
    return data?.rankingInstrumentos ?? [];
  }, [data]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <SpaceDashboardRoundedIcon />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Dashboard Ejecutivo
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Resumen general de instrumentos e indicadores regionales
          </Typography>
        </Box>

        <IconButton onClick={() => void loadData()} title="Refrescar">
          <RefreshRoundedIcon />
        </IconButton>
      </Stack>

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
                title="Instrumentos"
                value={data.totalInstrumentos}
                subtitle="Instrumentos activos"
              />
            </Grid>

            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Indicadores"
                value={data.totalIndicadores}
                subtitle="Indicadores registrados"
              />
            </Grid>

            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Unidades Responsables"
                value={data.totalUnidadesResponsables}
                subtitle="Unidades orgánicas vinculadas"
              />
            </Grid>

            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Avance Promedio"
                value={formatPercent(data.avancePromedio)}
                subtitle="Promedio consolidado"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} lg={8}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 10px 24px rgba(0,0,0,.05)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <InsightsRoundedIcon fontSize="small" />
                  <Typography sx={{ fontWeight: 900 }}>
                    Ranking de instrumentos
                  </Typography>
                </Stack>

                <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rankingData}>
                    <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="instrumento" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                    <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => formatPercent(v)} />
                    <Bar
                      dataKey="avancePromedio"
                      name="Avance Promedio"
                      fill={DASHBOARD_COLORS.secondary}
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "0 10px 24px rgba(0,0,0,.05)",
                  height: "100%",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <DonutLargeRoundedIcon fontSize="small" />
                  <Typography sx={{ fontWeight: 900 }}>
                    Semaforización global
                  </Typography>
                </Stack>

                <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <Chip label={`Rojo: ${data.semaforo.rojo}`} size="small" />
                  <Chip label={`Amarillo: ${data.semaforo.amarillo}`} size="small" />
                  <Chip label={`Verde: ${data.semaforo.verde}`} size="small" />
                  <Chip label={`Azul: ${data.semaforo.azul}`} size="small" />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: 2.2,
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 10px 24px rgba(0,0,0,.05)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <WarningAmberRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 900 }}>
                Alertas críticas
              </Typography>
            </Stack>

            {!data.alertasCriticas?.length ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No se encontraron alertas críticas.
              </Alert>
            ) : (
              <Stack spacing={1.25}>
                {data.alertasCriticas.map((item, idx) => (
                  <Paper
                    key={`${item.instrumento}-${idx}`}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                          [{item.instrumento}] {item.titulo}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.45 }}>
                          {item.descripcion}
                        </Typography>
                      </Box>

                      <Chip
                        label={item.nivel}
                        size="small"
                        color={item.nivel === "CRITICO" ? "error" : "warning"}
                        sx={{ alignSelf: "flex-start" }}
                      />
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