import React, { useEffect, useMemo, useState } from "react";
import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

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
} from "recharts";

import DashboardComparativoAction, {
  type DashboardComparativoDto,
} from "../DashboardComparativoAction";

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${n.toFixed(2)}%`;
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

  const rankingData = useMemo(() => data?.instrumentos ?? [], [data]);
  const trendData = useMemo(() => data?.tendencia ?? [], [data]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <CompareArrowsRoundedIcon />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Dashboard Comparativo
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Comparativo de instrumentos regionales
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
        <Grid container spacing={2.2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} lg={7}>
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
              <Typography sx={{ fontWeight: 900, mb: 2 }}>
                Avance promedio por instrumento
              </Typography>

              <Box sx={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingData}>
                  <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="instrumento" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatPercent(v)} />
                  <Bar
                    dataKey="avancePromedio"
                    name="Avance Promedio"
                    fill={DASHBOARD_COLORS.primary}
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={5}>
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
              <Typography sx={{ fontWeight: 900, mb: 2 }}>
                Resumen comparativo
              </Typography>

              <Stack spacing={1.1}>
                {rankingData.map((item) => (
                  <Paper
                    key={item.instrumento}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Typography sx={{ fontWeight: 900 }}>
                      {item.instrumento}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.35 }}>
                      Indicadores: {item.indicadores} · Avance: {formatPercent(item.avancePromedio)}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.25 }}>
                      R:{item.rojo} · A:{item.amarillo} · V:{item.verde} · S:{item.azul}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12}>
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
              <Typography sx={{ fontWeight: 900, mb: 2 }}>
                Tendencia comparativa
              </Typography>

              <Box sx={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${DASHBOARD_COLORS.grid}`,
                      boxShadow: "0 10px 25px rgba(0,0,0,.08)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    name="Avance"
                    stroke={DASHBOARD_COLORS.accent}
                    strokeWidth={3}
                    dot={{ r: 4, fill: DASHBOARD_COLORS.accent }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
}