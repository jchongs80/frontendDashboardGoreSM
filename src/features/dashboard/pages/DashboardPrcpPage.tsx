import React, { useEffect, useMemo, useState } from "react";
import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

import DashboardPrcpAction, {
  type DashboardPrcpDto,
  type DashboardPrcpJerarquiaDto,
} from "../DashboardPrcpAction";
import DashboardIndicadorDrawer from "../components/drawers/DashboardIndicadorDrawer";
import DashboardHeaderFilters from "../components/DashboardHeaderFilters";
import DashboardCatalogoAction from "../DashboardCatalogoAction";
import type {
  DashboardCommonHeaderFiltersValue,
  OptionItem,
} from "../DashboardFiltersTypes";

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(2) : "0.00"}%`;
}

function formatNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
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

function getSemaforoChipSx(semaforo?: string | null) {
  const value = (semaforo ?? "").toUpperCase();

  if (value === "ROJO") {
    return {
      bgcolor: "rgba(239,68,68,0.12)",
      color: "rgb(153,27,27)",
      borderColor: "rgba(239,68,68,0.45)",
      fontWeight: 900,
    };
  }

  if (value === "AMARILLO") {
    return {
      bgcolor: "rgba(245,158,11,0.15)",
      color: "rgb(146,64,14)",
      borderColor: "rgba(245,158,11,0.55)",
      fontWeight: 900,
    };
  }

  return {
    bgcolor: "rgba(34,197,94,0.13)",
    color: "rgb(21,128,61)",
    borderColor: "rgba(34,197,94,0.50)",
    fontWeight: 900,
  };
}

function getAvanceChipSx() {
  return {
    bgcolor: "rgba(255,255,255,0.92)",
    color: "text.secondary",
    borderColor: "rgba(148,163,184,0.55)",
    fontWeight: 800,
    "& .MuiChip-icon": {
      color: "text.secondary",
      fontSize: 16,
      ml: 0.7,
    },
  };
}

function getAvanceBarColor(avance?: number | null): string {
  const value = Number(avance ?? 0);

  if (value < 75) return DASHBOARD_COLORS.danger;
  if (value < 95) return DASHBOARD_COLORS.warning;
  return DASHBOARD_COLORS.success;
}

function clampProgress(value?: number | null): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}

function getOptionLabel(options: OptionItem[], value?: number | null): string {
  if (value == null) return "";
  const item = options.find((x) => Number(x.value) === Number(value));
  return item?.label ?? String(value);
}

function getAnioFromOption(options: OptionItem[], value?: number | null): number | null {
  const label = getOptionLabel(options, value);
  const match = label.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

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

      <Typography sx={{ mt: 0.6, fontSize: 26, fontWeight: 900 }}>{value}</Typography>

      {subtitle ? (
        <Typography sx={{ mt: 0.7, fontSize: 12.5, color: "text.secondary" }}>
          {subtitle}
        </Typography>
      ) : null}
    </Paper>
  );
}

export default function DashboardPrcpPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCombos, setLoadingCombos] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [reporteErrorMsg, setReporteErrorMsg] = useState<string>("");
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);
  const [data, setData] = useState<DashboardPrcpDto | null>(null);

  const [filters, setFilters] = useState<DashboardCommonHeaderFiltersValue>({
    idPeriodo: null,
    idAnioProyeccion: null,
    idObjetivoPrioritario: null,
  });

  const [periodos, setPeriodos] = useState<OptionItem[]>([]);
  const [aniosProyeccion, setAniosProyeccion] = useState<OptionItem[]>([]);
  const [objetivosPrioritarios, setObjetivosPrioritarios] = useState<OptionItem[]>([]);
  const [unidadConductora, setUnidadConductora] = useState<string>("");

  const [drawerState, setDrawerState] = useState<IndicadorDrawerState>({
    open: false,
    instrumento: "PRCP",
    idRegistro: 0,
    idIndicadorNombre: 0,
  });

  async function loadCombos() {
    setLoadingCombos(true);

    try {
      const [periodosResp, aniosResp, objetivosResp] = await Promise.all([
        DashboardCatalogoAction.getPeriodos("PRCP"),
        DashboardCatalogoAction.getAniosProyeccion(),
        DashboardCatalogoAction.getObjetivosPrioritariosPrcp(null),
      ]);

      setPeriodos(periodosResp);
      setAniosProyeccion(aniosResp);
      setObjetivosPrioritarios(objetivosResp);
    } finally {
      setLoadingCombos(false);
    }
  }

  async function loadData(currentFilters?: DashboardCommonHeaderFiltersValue) {
    const f = currentFilters ?? filters;

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardPrcpAction.getDashboard({
        idPeriodo: f.idPeriodo ?? undefined,
        idAnioProyeccion: f.idAnioProyeccion ?? undefined,
        idObjetivoPrioritario: f.idObjetivoPrioritario ?? undefined,
      });

      setData(resp);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el dashboard PRCP.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCombos();
  }, []);

  useEffect(() => {
    let activo = true;

    async function loadObjetivosPorPeriodo() {
      try {
        const objetivosResp = await DashboardCatalogoAction.getObjetivosPrioritariosPrcp(
          filters.idPeriodo ?? null
        );

        if (activo) {
          setObjetivosPrioritarios(objetivosResp);
        }
      } catch {
        if (activo) {
          setObjetivosPrioritarios([]);
        }
      }
    }

    void loadObjetivosPorPeriodo();

    return () => {
      activo = false;
    };
  }, [filters.idPeriodo]);

  useEffect(() => {
    let activo = true;

    async function loadUnidadConductora() {
      if (!filters.idObjetivoPrioritario) {
        setUnidadConductora("");
        return;
      }

      try {
        const unidadResp = await DashboardCatalogoAction.getUnidadConductoraObjetivoPrcp(
          filters.idPeriodo ?? null,
          filters.idObjetivoPrioritario
        );

        if (activo) {
          setUnidadConductora(unidadResp?.label ?? "");
        }
      } catch {
        if (activo) {
          setUnidadConductora("");
        }
      }
    }

    void loadUnidadConductora();

    return () => {
      activo = false;
    };
  }, [filters.idPeriodo, filters.idObjetivoPrioritario]);

  useEffect(() => {
    void loadData(filters);
  }, [filters]);

  const jerarquiaData = useMemo(() => data?.jerarquia ?? [], [data]);
  const tendenciaData = useMemo(() => data?.tendencia ?? [], [data]);

  const filtrosActivos = useMemo(() => {
    const result: Array<{ key: keyof DashboardCommonHeaderFiltersValue; label: string }> = [];

    if (filters.idPeriodo != null) {
      result.push({ key: "idPeriodo", label: `Periodo: ${getOptionLabel(periodos, filters.idPeriodo)}` });
    }

    if (filters.idAnioProyeccion != null) {
      result.push({
        key: "idAnioProyeccion",
        label: `Año: ${getOptionLabel(aniosProyeccion, filters.idAnioProyeccion)}`,
      });
    }

    if (filters.idObjetivoPrioritario != null) {
      result.push({
        key: "idObjetivoPrioritario",
        label: `Objetivo: ${getOptionLabel(objetivosPrioritarios, filters.idObjetivoPrioritario)}`,
      });
    }

    return result;
  }, [filters, periodos, aniosProyeccion, objetivosPrioritarios]);

  const limpiarFiltros = () => {
    setReporteErrorMsg("");
    setUnidadConductora("");
    setFilters({
      idPeriodo: null,
      idAnioProyeccion: null,
      idObjetivoPrioritario: null,
    });
  };

  const quitarFiltro = (key: keyof DashboardCommonHeaderFiltersValue) => {
    setReporteErrorMsg("");
    setFilters((prev) => ({ ...prev, [key]: null }));
    if (key === "idObjetivoPrioritario") {
      setUnidadConductora("");
    }
  };

  const abrirReportePrcp = () => {
    if (filters.idPeriodo == null) {
      setReporteErrorMsg("Debe seleccionar un Periodo PRCP para generar el reporte PDF. No se permite generar el reporte con la opción Todos.");
      return;
    }

    setReporteErrorMsg("");
    const qp = new URLSearchParams();

    if (filters.idPeriodo != null) qp.append("idPeriodo", String(filters.idPeriodo));
    if (filters.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filters.idAnioProyeccion));
    if (filters.idObjetivoPrioritario != null) qp.append("idObjetivoPrioritario", String(filters.idObjetivoPrioritario));

    const url = qp.toString()
      ? `/dashboard/prcp/reporte?${qp.toString()}`
      : "/dashboard/prcp/reporte";

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const descargarReporteExcelPrcp = async () => {
    if (filters.idPeriodo == null) {
      setReporteErrorMsg("Debe seleccionar un Periodo PRCP para descargar el reporte Excel. No se permite descargar el reporte con la opción Todos.");
      return;
    }

    setReporteErrorMsg("");
    setDownloadingExcel(true);

    try {
      await DashboardPrcpAction.descargarReporteExcel({
        idPeriodo: filters.idPeriodo ?? undefined,
        idAnioProyeccion: filters.idAnioProyeccion ?? undefined,
        idObjetivoPrioritario: filters.idObjetivoPrioritario ?? undefined,
      });
    } catch (error) {
      setReporteErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el reporte Excel PRCP."
      );
    } finally {
      setDownloadingExcel(false);
    }
  };

  function openIndicadorDrawer(item: DashboardPrcpJerarquiaDto) {
    setDrawerState({
      open: true,
      instrumento: "PRCP",
      idRegistro: item.idPrcpOpPiMp,
      idIndicadorNombre: item.idIndicadorNombre,
    });
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <WorkspacePremiumRoundedIcon />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Dashboard P.R.C.P.
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Objetivos prioritarios, medidas de política, hitos e indicadores
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
        objetivosPrioritarios={objetivosPrioritarios}
        mostrarObjetivoPrioritario
        mostrarUnidadConductoraObjetivo
        unidadConductoraObjetivo={unidadConductora}
        onChange={(value) => {
          setReporteErrorMsg("");
          setFilters(value);
        }}
      />



      {reporteErrorMsg ? (
        <Alert severity="warning" sx={{ mt: 1.2, borderRadius: 2 }}>
          {reporteErrorMsg}
        </Alert>
      ) : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1.2}
        sx={{ mt: 1.3, mb: 1.4 }}
      >
        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
          {filtrosActivos.length === 0 ? (
            <Chip size="small" label="Sin filtros activos" variant="outlined" sx={{ borderRadius: 999 }} />
          ) : (
            filtrosActivos.map((item) => (
              <Chip
                key={String(item.key)}
                size="small"
                label={item.label}
                onDelete={() => quitarFiltro(item.key)}
                variant="outlined"
                sx={{ borderRadius: 999, fontWeight: 700 }}
              />
            ))
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PictureAsPdfRoundedIcon />}
            onClick={abrirReportePrcp}
            sx={{ borderRadius: 2, fontWeight: 900, whiteSpace: "nowrap" }}
          >
            Generar reporte PDF
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<TableChartRoundedIcon />}
            onClick={() => void descargarReporteExcelPrcp()}
            disabled={downloadingExcel}
            sx={{ borderRadius: 2, fontWeight: 900, whiteSpace: "nowrap" }}
          >
            {downloadingExcel ? "Generando Excel..." : "Descargar Excel"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterAltOffRoundedIcon />}
            onClick={limpiarFiltros}
            disabled={filtrosActivos.length === 0}
            sx={{ borderRadius: 2, fontWeight: 900, whiteSpace: "nowrap" }}
          >
            Limpiar filtros
          </Button>
        </Stack>
      </Stack>

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
            <Typography>Cargando dashboard PRCP...</Typography>
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
           <Grid container spacing={2.2} sx={{ mt: 1, mb: 6 }}>
            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard title="OP" value={data.kpis.totalOp} subtitle="Objetivos prioritarios" />
            </Grid>

            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard title="MP" value={data.kpis.totalMp} subtitle="Medidas de política" />
            </Grid>

            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard title="Hitos" value={data.kpis.totalHitos ?? 0} subtitle="Hitos registrados" />
            </Grid>

            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard
                title="Indicadores"
                value={data.kpis.totalIndicadores}
                subtitle="Indicadores vinculados"
              />
            </Grid>

            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard
                title="Avance Promedio"
                value={formatPercent(data.kpis.avancePromedio)}
                subtitle="Promedio consolidado PRCP"
              />
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
            <Typography sx={{ fontWeight: 900, mb: 0.4 }}>Tendencia PRCP</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Evolución del avance promedio por año de proyección. La tendencia mantiene el
              contexto de período y objetivo prioritario, y no se limita por el año seleccionado.
            </Typography>

            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendenciaData} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <YAxis
                    tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <RechartsTooltip
                    formatter={(value: number, name: string) => {
                      if (name === "Meta promedio") return [formatNumber(value), name];
                      if (name === "Ejecutado promedio") return [formatNumber(value), name];
                      return [formatPercent(value), name];
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avancePromedio"
                    name="Avance promedio"
                    stroke={DASHBOARD_COLORS.primary}
                    strokeWidth={3}
                    dot={{ r: 4, fill: DASHBOARD_COLORS.primary }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="referencia75"
                    name="Referencia 75%"
                    stroke={DASHBOARD_COLORS.warning}
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    dot={false}
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="referencia95"
                    name="Referencia 95%"
                    stroke={DASHBOARD_COLORS.success}
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
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
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <AccountTreeRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 900 }}>Lista OP / PI / MP</Typography>
            </Stack>

            <Stack spacing={1.1}>
              {jerarquiaData.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No se encontraron registros con los filtros seleccionados.
                </Alert>
              ) : null}

              {jerarquiaData.map((item) => {
                const barColor = getAvanceBarColor(item.avancePromedio);

                return (
                  <Paper key={item.idPrcpOpPiMp} variant="outlined" sx={{ p: 1.4, borderRadius: 2 }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ md: "flex-start" }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                          {item.codigoOp} - {item.descripcionOp}
                        </Typography>


                        <Typography sx={{ mt: 0.25, fontSize: 13, color: "text.secondary" }}>
                          {item.codigoMp} - {item.descripcionMp}
                        </Typography>

                        {item.responsableMp ? (
                          <Typography sx={{ mt: 0.25, fontSize: 12.5, color: "text.secondary" }}>
                            Responsable MP: {item.responsableMp}
                          </Typography>
                        ) : null}

                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mt: 0.9 }}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Chip
                            size="small"
                            icon={<FormatListBulletedRoundedIcon />}
                            label={`Indicadores: ${item.cantidadIndicadores}`}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              ...getAvanceChipSx(),
                            }}
                          />

                          <Chip
                            size="small"
                            icon={<SpeedRoundedIcon />}
                            label={`Avance: ${formatPercent(item.avancePromedio)}`}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              ...getAvanceChipSx(),
                            }}
                          />

                          <Chip
                            size="small"
                            label={item.semaforo}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              ...getSemaforoChipSx(item.semaforo),
                            }}
                          />
                        </Stack>

                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={clampProgress(item.avancePromedio)}
                            sx={{
                              height: 7,
                              borderRadius: 999,
                              bgcolor: "rgba(148,163,184,0.20)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: barColor,
                              },
                            }}
                          />
                        </Box>
                      </Box>

                      <Tooltip title="Ver detalle del indicador">
                        <IconButton
                          size="small"
                          onClick={() => openIndicadorDrawer(item)}
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "rgba(59,130,246,.10)",
                          }}
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>

          <DashboardIndicadorDrawer
            open={drawerState.open}
            onClose={() => setDrawerState((prev) => ({ ...prev, open: false }))}
            instrumento={drawerState.instrumento}
            idRegistro={drawerState.idRegistro}
            idIndicadorNombre={drawerState.idIndicadorNombre}
            anioResumen={getAnioFromOption(aniosProyeccion, filters.idAnioProyeccion)}
          />
        </>
      ) : null}
    </Box>
  );
}
