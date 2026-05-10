import React, { useEffect, useMemo, useState } from "react";
import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
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
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AssignmentLateRoundedIcon from "@mui/icons-material/AssignmentLateRounded";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import DashboardPoiAction, {
  type DashboardPoiDto,
} from "../DashboardPoiAction";
import DashboardPoiHeaderFilters from "../components/DashboardPoiHeaderFilters";
import DashboardCatalogoAction from "../DashboardCatalogoAction";
import type {
  DashboardPoiHeaderFiltersValue,
  OptionItem,
} from "../DashboardFiltersTypes";

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
      <Typography sx={{ mt: 0.6, fontSize: 26, fontWeight: 900 }}>
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

export default function DashboardPoiPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCombos, setLoadingCombos] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardPoiDto | null>(null);

  const [filters, setFilters] = useState<DashboardPoiHeaderFiltersValue>({
    idPeriodo: null,
    idPoiAnio: null,
    mes: null,
  });

  const [periodos, setPeriodos] = useState<OptionItem[]>([]);
  const [poiAnios, setPoiAnios] = useState<OptionItem[]>([]);

  const meses: OptionItem[] = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
  ];

  async function loadCombos() {
    setLoadingCombos(true);
    try {
      const [periodosResp, poiAniosResp] = await Promise.all([
        DashboardCatalogoAction.getPeriodos("POI"),
        DashboardCatalogoAction.getPoiAnios(),
      ]);

      setPeriodos(periodosResp);
      setPoiAnios(poiAniosResp);
    } finally {
      setLoadingCombos(false);
    }
  }

  async function loadData(currentFilters?: DashboardPoiHeaderFiltersValue) {
    const f = currentFilters ?? filters;

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardPoiAction.getDashboard({
        idPeriodo: f.idPeriodo ?? undefined,
        anio: f.idPoiAnio ?? undefined,
        mes: f.mes ?? undefined,
      });
      setData(resp);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el dashboard POI.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCombos();
  }, []);

  useEffect(() => {
    void loadData(filters);
  }, [filters]);

  const comparativoData = useMemo(() => data?.comparativoPoiSiaf ?? [], [data]);
  const ejecutoraData = useMemo(() => data?.ejecucionPorEjecutora ?? [], [data]);
  const seguimientoData = useMemo(() => data?.seguimientoPendiente ?? [], [data]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <ApartmentRoundedIcon />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Dashboard P.O.I.
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Ejecución física, seguimiento e inconsistencias
          </Typography>
        </Box>

        <IconButton onClick={() => void loadData(filters)} title="Refrescar">
          <RefreshRoundedIcon />
        </IconButton>
      </Stack>

      <DashboardPoiHeaderFilters
        value={filters}
        periodos={periodos}
        poiAnios={poiAnios}
        meses={meses}
        onChange={setFilters}
      />

      {loadingCombos ? (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2">Cargando filtros...</Typography>
          </Stack>
        </Box>
      ) : null}

      {loading ? (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography>Cargando dashboard POI...</Typography>
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
                title="Ejecución Física"
                value={formatPercent(data.kpis.ejecucionFisica)}
                subtitle="Promedio consolidado"
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Ejecución Presupuestal"
                value={formatPercent(data.kpis.ejecucionPresupuestal)}
                subtitle="Pendiente de integración"
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Inconsistencias"
                value={data.kpis.totalInconsistencias}
                subtitle="Registros observados"
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Seguimiento pendiente"
                value={data.kpis.totalPendientesSeguimiento}
                subtitle="Pendientes por regularizar"
              />
            </Grid>
          </Grid>

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
                  Comparativo físico mensual
                </Typography>

                <Box sx={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparativoData}>
                      <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                      <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => formatPercent(v)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="poi"
                        name="POI"
                        stroke={DASHBOARD_COLORS.primary}
                        strokeWidth={3}
                        dot={{ r: 4, fill: DASHBOARD_COLORS.primary }}
                      />
                      <Line
                        type="monotone"
                        dataKey="siaf"
                        name="SIAF"
                        stroke={DASHBOARD_COLORS.accent}
                        strokeWidth={3}
                        strokeDasharray="6 4"
                        dot={{ r: 4, fill: DASHBOARD_COLORS.accent }}
                      />
                    </LineChart>
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
                  Ejecución por unidad ejecutora
                </Typography>

                <Box sx={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ejecutoraData}>
                      <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="unidadEjecutora" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                      <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => formatPercent(v)} />
                      <Legend />
                      <Bar
                        dataKey="ejecucionFisica"
                        name="Física"
                        fill={DASHBOARD_COLORS.secondary}
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="ejecucionPresupuestal"
                        name="Presupuestal"
                        fill={DASHBOARD_COLORS.warning}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
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
                Inconsistencias detectadas
              </Typography>
            </Stack>

            {!data.inconsistencias?.length ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No se detectaron inconsistencias.
              </Alert>
            ) : (
              <Stack spacing={1.15}>
                {data.inconsistencias.map((item, idx) => (
                  <Paper
                    key={`${item.actividadOperativa}-${idx}`}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                      {item.actividadOperativa} · {item.centroCosto}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.45 }}>
                      {item.descripcion}
                    </Typography>
                    <Chip label={item.nivel} size="small" sx={{ mt: 1 }} />
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>

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
              <AssignmentLateRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 900 }}>
                Seguimiento pendiente
              </Typography>
            </Stack>

            {!seguimientoData.length ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No hay pendientes de seguimiento.
              </Alert>
            ) : (
              <Stack spacing={1.15}>
                {seguimientoData.map((item, idx) => (
                  <Paper
                    key={`${item.unidadEjecutora}-${item.centroCosto}-${idx}`}
                    variant="outlined"
                    sx={{ p: 1.5, borderRadius: 2 }}
                  >
                    <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                      {item.unidadEjecutora}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.35 }}>
                      {item.centroCosto}
                    </Typography>
                    <Chip label={`Pendientes: ${item.pendientes}`} size="small" sx={{ mt: 1 }} />
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