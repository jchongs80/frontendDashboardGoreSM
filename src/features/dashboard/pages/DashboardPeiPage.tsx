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
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
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

import DashboardPeiAction, {
  type DashboardPeiDto,
  type DashboardPeiJerarquiaDto,
} from "../DashboardPeiAction";
import DashboardIndicadorDrawer from "../components/drawers/DashboardIndicadorDrawer";
import DashboardHeaderFilters from "../components/DashboardHeaderFilters";
import DashboardCatalogoAction from "../DashboardCatalogoAction";
import type {
  DashboardCommonHeaderFiltersValue,
  DashboardNivelAvanceValue,
  OptionItem,
} from "../DashboardFiltersTypes";

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${n.toFixed(2)}%`;
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

function getNivelBorderColor(tipoNivel?: string | null): string {
  return tipoNivel?.toUpperCase() === "OEI"
    ? "rgba(124,58,237,0.75)"
    : "rgba(37,99,235,0.75)";
}

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

function getNivelChipSx(tipoNivel?: string | null) {
  return tipoNivel?.toUpperCase() === "OEI"
    ? {
        bgcolor: "rgba(124,58,237,0.12)",
        color: "rgb(91,33,182)",
        borderColor: "rgba(124,58,237,0.45)",
        fontWeight: 900,
      }
    : {
        bgcolor: "rgba(37,99,235,0.10)",
        color: "rgb(30,64,175)",
        borderColor: "rgba(37,99,235,0.45)",
        fontWeight: 900,
      };
}

function getNivelLabel(item: DashboardPeiJerarquiaDto): string {
  if (item.tipoNivel === "OEI") {
    return `${item.codigoOei ?? "OEI"} - ${item.enunciadoOei ?? ""}`.trim();
  }

  return `${item.codigoAei ?? "AEI"} - ${item.enunciadoAei ?? ""}`.trim();
}

function getNivelAvanceLabel(value?: DashboardNivelAvanceValue | string | null): string {
  const nivel = String(value ?? "");
  if (nivel === "0_75") return "0% - 75%";
  if (nivel === "75_95") return "75% - 95%";
  if (nivel === "95_MAS" || nivel === "95_100") return "95% a más";
  return "";
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

function clampProgress(value?: number | null): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
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

export default function DashboardPeiPage(): React.ReactElement {
  const [loading, setLoading] = useState(true);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [reporteErrorMsg, setReporteErrorMsg] = useState("");
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [data, setData] = useState<DashboardPeiDto | null>(null);

  const [filters, setFilters] = useState<DashboardCommonHeaderFiltersValue>({
    idPeriodo: null,
    idAnioProyeccion: null,
    idUnidad: null,
    nivelAvance: null,
  });

  const [periodos, setPeriodos] = useState<OptionItem[]>([]);
  const [aniosProyeccion, setAniosProyeccion] = useState<OptionItem[]>([]);
  const [unidadesOrganizacionales, setUnidadesOrganizacionales] = useState<OptionItem[]>([]);

  const [drawerState, setDrawerState] = useState<IndicadorDrawerState>({
    open: false,
    instrumento: "PEI",
    idRegistro: 0,
    idIndicadorNombre: 0,
  });

  async function loadCombos() {
    setLoadingCombos(true);

    try {
      const [periodosResp, aniosResp, unidadesResp] = await Promise.all([
        DashboardCatalogoAction.getPeriodos("PEI"),
        DashboardCatalogoAction.getAniosProyeccion(),
        DashboardCatalogoAction.getUnidadesPei(null),
      ]);

      setPeriodos(periodosResp);
      setAniosProyeccion(aniosResp);
      setUnidadesOrganizacionales(unidadesResp);
    } finally {
      setLoadingCombos(false);
    }
  }

  async function loadData(currentFilters?: DashboardCommonHeaderFiltersValue) {
    const f = currentFilters ?? filters;

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardPeiAction.getDashboard({
        idPeriodo: f.idPeriodo ?? undefined,
        idAnioProyeccion: f.idAnioProyeccion ?? undefined,
        idUnidad: f.idUnidad ?? undefined,
        nivelAvance: f.nivelAvance ?? undefined,
      });

      setData(resp);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "No se pudo cargar el dashboard PEI."
      );
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

    async function loadUnidadesPorPeriodo() {
      try {
        const unidadesResp = await DashboardCatalogoAction.getUnidadesPei(
          filters.idPeriodo ?? null
        );

        if (activo) {
          setUnidadesOrganizacionales(unidadesResp);
        }
      } catch {
        if (activo) {
          setUnidadesOrganizacionales([]);
        }
      }
    }

    void loadUnidadesPorPeriodo();

    return () => {
      activo = false;
    };
  }, [filters.idPeriodo]);

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

    if (filters.idUnidad != null) {
      result.push({
        key: "idUnidad",
        label: `Unidad: ${getOptionLabel(unidadesOrganizacionales, filters.idUnidad)}`,
      });
    }

    if (filters.nivelAvance != null) {
      result.push({ key: "nivelAvance", label: `Avance: ${getNivelAvanceLabel(filters.nivelAvance)}` });
    }

    return result;
  }, [filters, periodos, aniosProyeccion, unidadesOrganizacionales]);

  const limpiarFiltros = () => {
    setFilters({
      idPeriodo: null,
      idAnioProyeccion: null,
      idUnidad: null,
      nivelAvance: null,
    });
  };

  const quitarFiltro = (key: keyof DashboardCommonHeaderFiltersValue) => {
    setFilters((prev) => ({ ...prev, [key]: null }));
  };


  const abrirReportePei = () => {
    if (filters.idPeriodo == null) {
      setReporteErrorMsg("Debe seleccionar un Periodo PEI para generar el reporte PDF. No se permite generar el reporte con la opción Todos.");
      return;
    }

    setReporteErrorMsg("");
    const qp = new URLSearchParams();

    if (filters.idPeriodo != null) qp.append("idPeriodo", String(filters.idPeriodo));
    if (filters.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filters.idAnioProyeccion));
    if (filters.idUnidad != null) qp.append("idUnidad", String(filters.idUnidad));
    if (filters.nivelAvance != null) qp.append("nivelAvance", String(filters.nivelAvance));

    const url = qp.toString()
      ? `/dashboard/pei/reporte?${qp.toString()}`
      : "/dashboard/pei/reporte";

    window.open(url, "_blank", "noopener,noreferrer");
  };


  const descargarReporteExcelPei = async () => {
    if (filters.idPeriodo == null) {
      setReporteErrorMsg("Debe seleccionar un Periodo PEI para descargar el reporte Excel. No se permite descargar el reporte con la opción Todos.");
      return;
    }

    setReporteErrorMsg("");
    setDownloadingExcel(true);

    try {
      await DashboardPeiAction.descargarReporteExcel({
        idPeriodo: filters.idPeriodo ?? undefined,
        idAnioProyeccion: filters.idAnioProyeccion ?? undefined,
        idUnidad: filters.idUnidad ?? undefined,
        nivelAvance: filters.nivelAvance ?? undefined,
      });
    } catch (error) {
      setReporteErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo descargar el reporte Excel PEI."
      );
    } finally {
      setDownloadingExcel(false);
    }
  };

  function openIndicadorDrawer(item: DashboardPeiJerarquiaDto) {
    setDrawerState({
      open: true,
      instrumento: "PEI",
      idRegistro: item.idPeiOeiAei,
      idIndicadorNombre: item.idIndicadorNombre,
    });
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoGraphRoundedIcon />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Dashboard P.E.I.
            </Typography>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Seguimiento de OEI, AEI e indicadores institucionales
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
        unidadesOrganizacionales={unidadesOrganizacionales}
        mostrarUnidadOrganizacional
        mostrarNivelAvance
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
            onClick={abrirReportePei}
            sx={{ borderRadius: 2, fontWeight: 900, whiteSpace: "nowrap" }}
          >
            Generar reporte PDF
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<TableChartRoundedIcon />}
            onClick={() => void descargarReporteExcelPei()}
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
            <Typography>Cargando dashboard PEI...</Typography>
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
            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="OEI"
                value={data.kpis.totalOei}
                subtitle="Objetivos estratégicos institucionales evaluados"
              />
            </Grid>

            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Indicadores OEI"
                value={data.kpis.totalIndicadoresOei ?? 0}
                subtitle="Indicadores asociados a nivel OEI"
              />
            </Grid>

            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="AEI"
                value={data.kpis.totalAei}
                subtitle="Acciones estratégicas institucionales evaluadas"
              />
            </Grid>

            <Grid item xs={12} md={6} xl={3}>
              <KpiCard
                title="Indicadores AEI"
                value={data.kpis.totalIndicadoresAei ?? 0}
                subtitle="Indicadores asociados a nivel AEI"
              />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: 0,
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 10px 24px rgba(0,0,0,.05)",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <AccountTreeRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 900 }}>Lista OEI / AEI</Typography>
            </Stack>

            <Stack spacing={1.1}>
              {jerarquiaData.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No se encontraron registros con los filtros seleccionados.
                </Alert>
              ) : null}

              {jerarquiaData.map((item) => {
                const nivelColor = getNivelBorderColor(item.tipoNivel);
                const barColor = getAvanceBarColor(item.avancePromedio);

                return (
                  <Paper
                    key={item.idPeiOeiAei}
                    variant="outlined"
                    sx={{
                      p: 1.4,
                      borderRadius: 2,
                      borderColor: nivelColor,
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ md: "flex-start" }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            label={item.tipoNivel}
                            variant="outlined"
                            sx={{
                              height: 20,
                              borderRadius: 999,
                              "& .MuiChip-label": { px: 0.8, fontSize: 11 },
                              ...getNivelChipSx(item.tipoNivel),
                            }}
                          />

                          <Typography sx={{ fontWeight: 900, fontSize: 14 }}>
                            {getNivelLabel(item)}
                          </Typography>
                        </Stack>

                        {item.tipoNivel === "AEI" ? (
                          <Typography sx={{ mt: 0.35, fontSize: 13, color: "text.secondary" }}>
                            Vinculado a: {item.codigoOei} - {item.enunciadoOei}
                          </Typography>
                        ) : null}

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.9 }} flexWrap="wrap" useFlexGap>
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

                        <Box sx={{ mt: 1.2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={clampProgress(item.avancePromedio)}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "rgba(148,163,184,0.20)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: barColor,
                              },
                            }}
                          />
                          <Typography sx={{ mt: 0.35, fontSize: 11.5, color: "text.secondary" }}>
                            Progreso visual limitado a 100%. Avance real: {formatPercent(item.avancePromedio)}.
                          </Typography>
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
            <Typography sx={{ fontWeight: 900, mb: 0.4 }}>Tendencia PEI</Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Evolución del avance promedio por año de proyección. El tooltip muestra meta promedio,
              ejecutado promedio y avance promedio.
            </Typography>

            <Box sx={{ height: 340 }}>
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
