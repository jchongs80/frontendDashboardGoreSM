import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import DashboardPdrcAction, {
  type DashboardPdrcDto,
  type DashboardPdrcJerarquiaDto,
} from "../DashboardPdrcAction";
import DashboardIndicadorDrawer from "../components/drawers/DashboardIndicadorDrawer";
import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
import DashboardHeaderFilters from "../components/DashboardHeaderFilters";
import DashboardCatalogoAction from "../DashboardCatalogoAction";
import type {
  DashboardCommonHeaderFiltersValue,
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

type IndicadorDrawerState = {
  open: boolean;
  instrumento: string;
  idRegistro: number;
  idIndicadorNombre: number;
};

function KpiCard({ title, value, subtitle }: KpiCardProps): React.ReactElement {
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "0 10px 24px rgba(0,0,0,.05)", height: "100%" }}>
      <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ mt: 0.6, fontSize: 26, fontWeight: 900 }}>{value}</Typography>
      {subtitle ? <Typography sx={{ mt: 0.7, fontSize: 12.5, color: "text.secondary" }}>{subtitle}</Typography> : null}
    </Paper>
  );
}

export default function DashboardPdrcPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCombos, setLoadingCombos] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardPdrcDto | null>(null);

  const [filters, setFilters] = useState<DashboardCommonHeaderFiltersValue>({
    idPeriodo: null,
    idAnioProyeccion: null,
  });

  const [periodos, setPeriodos] = useState<OptionItem[]>([]);
  const [aniosProyeccion, setAniosProyeccion] = useState<OptionItem[]>([]);

  const [drawerState, setDrawerState] = useState<IndicadorDrawerState>({
    open: false,
    instrumento: "PDRC",
    idRegistro: 0,
    idIndicadorNombre: 0,
  });

  async function loadCombos() {
    setLoadingCombos(true);
    try {
      const [periodosResp, aniosResp] = await Promise.all([
        DashboardCatalogoAction.getPeriodos("PDRC"),
        DashboardCatalogoAction.getAniosProyeccion(),
      ]);

      setPeriodos(periodosResp);
      setAniosProyeccion(aniosResp);
    } finally {
      setLoadingCombos(false);
    }
  }

  async function loadData(currentFilters?: DashboardCommonHeaderFiltersValue) {
    const f = currentFilters ?? filters;

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardPdrcAction.getDashboard({
        idPeriodo: f.idPeriodo ?? undefined,
        idAnioProyeccion: f.idAnioProyeccion ?? undefined,
      });
      setData(resp);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el dashboard PDRC.");
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

  const jerarquiaData = useMemo(() => data?.jerarquia ?? [], [data]);
  const tendenciaData = useMemo(() => data?.tendencia ?? [], [data]);

  function openIndicadorDrawer(item: DashboardPdrcJerarquiaDto) {
    setDrawerState({
      open: true,
      instrumento: "PDRC",
      idRegistro: item.idPdrcOerAer,
      idIndicadorNombre: item.idIndicadorNombre,
    });
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <HubRoundedIcon />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Dashboard P.D.R.C.
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Objetivos, acciones e indicadores del PDRC
          </Typography>
        </Box>

        <IconButton onClick={() => void loadData(filters)} title="Refrescar">
          <RefreshRoundedIcon />
        </IconButton>
      </Stack>

      <DashboardHeaderFilters
        value={filters}
        periodos={periodos}
        aniosProyeccion={aniosProyeccion}
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
            <Typography>Cargando dashboard PDRC...</Typography>
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
              <KpiCard title="OER" value={data.kpis.totalOer} subtitle="Objetivos estratégicos regionales" />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard title="AER" value={data.kpis.totalAer} subtitle="Acciones estratégicas regionales" />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard title="Indicadores" value={data.kpis.totalIndicadores} subtitle="Indicadores vinculados" />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard title="Avance Promedio" value={formatPercent(data.kpis.avancePromedio)} subtitle="Promedio consolidado PDRC" />
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ mt: 2.2, p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "0 10px 24px rgba(0,0,0,.05)" }}>
            <Typography sx={{ fontWeight: 900, mb: 2 }}>Jerarquía OER / AER</Typography>

            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jerarquiaData}>
                  <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="codigoAer" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <RechartsTooltip formatter={(v: number) => formatPercent(v)} />
                  <Bar dataKey="avancePromedio" name="Avance Promedio" fill={DASHBOARD_COLORS.accent} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Stack spacing={1.1} sx={{ mt: 2 }}>
              {jerarquiaData.map((item) => (
                <Paper key={item.idPdrcOerAer} variant="outlined" sx={{ p: 1.4, borderRadius: 2 }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                        {item.codigoOer} - {item.enunciadoOer}
                      </Typography>
                      <Typography sx={{ mt: 0.35, fontSize: 13, color: "text.secondary" }}>
                        {item.codigoAer} - {item.enunciadoAer}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.9 }} flexWrap="wrap" useFlexGap>
                        <Chip size="small" label={`IND: ${item.cantidadIndicadores}`} />
                        <Chip size="small" label={`AVANCE: ${formatPercent(item.avancePromedio)}`} />
                        <Chip size="small" label={item.semaforo} />
                      </Stack>
                    </Box>

                    <Tooltip title="Ver detalle del indicador">
                      <IconButton size="small" onClick={() => openIndicadorDrawer(item)} sx={{ width: 34, height: 34, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "rgba(59,130,246,.10)" }}>
                        <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ mt: 2.2, p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "0 10px 24px rgba(0,0,0,.05)" }}>
            <Typography sx={{ fontWeight: 900, mb: 2 }}>Tendencia PDRC</Typography>

            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendenciaData}>
                  <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <RechartsTooltip formatter={(v: number) => formatPercent(v)} />
                  <Line type="monotone" dataKey="valor" name="Avance" stroke={DASHBOARD_COLORS.accent} strokeWidth={3} dot={{ r: 4, fill: DASHBOARD_COLORS.accent }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <DashboardIndicadorDrawer
            open={drawerState.open}
            onClose={() => setDrawerState((prev) => ({ ...prev, open: false }))}
            instrumento={drawerState.instrumento}
            idRegistro={drawerState.idRegistro}
            idIndicadorNombre={drawerState.idIndicadorNombre}
          />
        </>
      ) : null}
    </Box>
  );
}