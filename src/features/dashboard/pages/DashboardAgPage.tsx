import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";

import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

import DashboardAgAction, {
  type DashboardAgDto,
  type DashboardAgIndicadorResumenDto,
  type DashboardAgJerarquiaDto,
} from "../DashboardAgAction";
import DashboardIndicadorDrawer from "../components/drawers/DashboardIndicadorDrawer";
import { DASHBOARD_COLORS } from "../constants/dashboardChartColors";
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

function getAvanceTheme(avance?: number | null) {
  const value = Number(avance ?? 0);

  if (value < 75) {
    return {
      accent: DASHBOARD_COLORS.danger,
      text: "rgb(153,27,27)",
      border: "rgba(239,68,68,0.58)",
      borderSoft: "rgba(239,68,68,0.32)",
      bg: "linear-gradient(135deg, rgba(254,242,242,.92) 0%, rgba(255,255,255,.97) 68%, rgba(255,247,247,.88) 100%)",
      chipBg: "rgba(254,226,226,.86)",
      chipBorder: "rgba(239,68,68,.45)",
      shadow: "0 12px 28px rgba(239,68,68,.08)",
    };
  }

  if (value < 95) {
    return {
      accent: DASHBOARD_COLORS.warning,
      text: "rgb(146,64,14)",
      border: "rgba(245,158,11,0.60)",
      borderSoft: "rgba(245,158,11,0.34)",
      bg: "linear-gradient(135deg, rgba(255,251,235,.93) 0%, rgba(255,255,255,.97) 68%, rgba(255,247,237,.88) 100%)",
      chipBg: "rgba(254,243,199,.88)",
      chipBorder: "rgba(245,158,11,.52)",
      shadow: "0 12px 28px rgba(245,158,11,.09)",
    };
  }

  return {
    accent: DASHBOARD_COLORS.success,
    text: "rgb(21,128,61)",
    border: "rgba(34,197,94,0.58)",
    borderSoft: "rgba(34,197,94,0.32)",
    bg: "linear-gradient(135deg, rgba(240,253,244,.93) 0%, rgba(255,255,255,.97) 68%, rgba(236,253,245,.88) 100%)",
    chipBg: "rgba(220,252,231,.88)",
    chipBorder: "rgba(34,197,94,.48)",
    shadow: "0 12px 28px rgba(34,197,94,.08)",
  };
}

function getAvanceChipSx(avance?: number | null) {
  const theme = getAvanceTheme(avance);

  return {
    bgcolor: theme.chipBg,
    color: theme.text,
    borderColor: theme.chipBorder,
    fontWeight: 900,
    "& .MuiChip-icon": {
      color: theme.text,
      fontSize: 16,
      ml: 0.7,
    },
  };
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
  icon: React.ReactNode;
  tone?: "purple" | "blue" | "green" | "amber";
};


type DashboardAgRadarDimensionDto = {
  idDimension?: number;
  dimension?: string;
  avancePromedio?: number;
  referencia75?: number;
  referencia95?: number;
};

type DashboardAgDtoConRadar = DashboardAgDto & {
  radarDimensiones?: DashboardAgRadarDimensionDto[];
};

type IndicadorDrawerState = {
  open: boolean;
  instrumento: string;
  idRegistro: number;
  idIndicadorNombre: number;
};

function getAvanceBarColor(avance?: number | null): string {
  return getAvanceTheme(avance).accent;
}


function getAgNivelChipSx() {
  return {
    bgcolor: "rgba(37,99,235,0.10)",
    color: "rgb(30,64,175)",
    borderColor: "rgba(37,99,235,0.45)",
    fontWeight: 900,
  };
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

function KpiCard({ title, value, subtitle, icon, tone = "blue" }: KpiCardProps): React.ReactElement {
  const palette = {
    purple: {
      bg: "linear-gradient(135deg, rgba(124,58,237,.12), rgba(255,255,255,.96))",
      iconBg: "rgba(124,58,237,.12)",
      iconColor: "rgb(91,33,182)",
      border: "rgba(124,58,237,.22)",
    },
    blue: {
      bg: "linear-gradient(135deg, rgba(37,99,235,.10), rgba(255,255,255,.96))",
      iconBg: "rgba(37,99,235,.11)",
      iconColor: "rgb(30,64,175)",
      border: "rgba(37,99,235,.22)",
    },
    green: {
      bg: "linear-gradient(135deg, rgba(22,163,74,.11), rgba(255,255,255,.96))",
      iconBg: "rgba(22,163,74,.12)",
      iconColor: "rgb(21,128,61)",
      border: "rgba(22,163,74,.24)",
    },
    amber: {
      bg: "linear-gradient(135deg, rgba(245,158,11,.12), rgba(255,255,255,.96))",
      iconBg: "rgba(245,158,11,.14)",
      iconColor: "rgb(146,64,14)",
      border: "rgba(245,158,11,.28)",
    },
  }[tone];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: 4,
        border: "1px solid",
        borderColor: palette.border,
        background: palette.bg,
        boxShadow: "0 18px 34px rgba(15,23,42,.07)",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        "&:before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: palette.iconColor,
          opacity: 0.65,
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 900 }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 0.7, fontSize: 30, lineHeight: 1, fontWeight: 950 }}>
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: "14px",
            display: "grid",
            placeItems: "center",
            bgcolor: palette.iconBg,
            color: palette.iconColor,
            flex: "0 0 auto",
          }}
        >
          {icon}
        </Box>
      </Stack>

      {subtitle ? (
        <Typography sx={{ mt: 1.4, fontSize: 12.5, color: "text.secondary", lineHeight: 1.35 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Paper>
  );
}

export default function DashboardAgPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCombos, setLoadingCombos] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [reporteMsg, setReporteMsg] = useState<string>("");
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);
  const [data, setData] = useState<DashboardAgDto | null>(null);

  const [filters, setFilters] = useState<DashboardCommonHeaderFiltersValue>({
    idPeriodo: null,
    idAnioProyeccion: null,
    idDimension: null,
    idUnidad: null,
    idPolitica: null,
    nivelAvance: null,
  });

  const [periodos, setPeriodos] = useState<OptionItem[]>([]);
  const [aniosProyeccion, setAniosProyeccion] = useState<OptionItem[]>([]);
  const [dimensionesAg, setDimensionesAg] = useState<OptionItem[]>([]);
  const [unidadesOrganizacionales, setUnidadesOrganizacionales] = useState<OptionItem[]>([]);
  const [politicasAg, setPoliticasAg] = useState<OptionItem[]>([]);

  const [drawerState, setDrawerState] = useState<IndicadorDrawerState>({
    open: false,
    instrumento: "AG",
    idRegistro: 0,
    idIndicadorNombre: 0,
  });

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  async function loadCombos() {
    setLoadingCombos(true);
    try {
      const periodosResp = await DashboardCatalogoAction.getPeriodos("AG").catch(() => []);
      setPeriodos(periodosResp);

      const [aniosResult, dimensionesResult, unidadesResult, politicasResult] = await Promise.allSettled([
        DashboardCatalogoAction.getAniosProyeccion(null, "AG"),
        DashboardCatalogoAction.getDimensionesAg(null),
        DashboardCatalogoAction.getUnidadesAg(null, null),
        DashboardCatalogoAction.getPoliticasAg(null, null, null),
      ]);

      setAniosProyeccion(aniosResult.status === "fulfilled" ? aniosResult.value : []);
      setDimensionesAg(dimensionesResult.status === "fulfilled" ? dimensionesResult.value : []);
      setUnidadesOrganizacionales(unidadesResult.status === "fulfilled" ? unidadesResult.value : []);
      setPoliticasAg(politicasResult.status === "fulfilled" ? politicasResult.value : []);
    } finally {
      setLoadingCombos(false);
    }
  }

  async function loadData(currentFilters?: DashboardCommonHeaderFiltersValue) {
    const f = currentFilters ?? filters;

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardAgAction.getDashboard({
        idPeriodo: f.idPeriodo ?? undefined,
        idAnioProyeccion: f.idAnioProyeccion ?? undefined,
        idDimension: f.idDimension ?? undefined,
        idUnidad: f.idUnidad ?? undefined,
        idPolitica: f.idPolitica ?? undefined,
        nivelAvance: f.nivelAvance ?? undefined,
      });
      setData(resp);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el dashboard AG.");
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

    async function loadCatalogosAgPorContexto() {
      const [aniosResult, dimensionesResult, unidadesResult, politicasResult] = await Promise.allSettled([
        DashboardCatalogoAction.getAniosProyeccion(filters.idPeriodo ?? null, "AG"),
        DashboardCatalogoAction.getDimensionesAg(filters.idPeriodo ?? null),
        DashboardCatalogoAction.getUnidadesAg(filters.idPeriodo ?? null, filters.idDimension ?? null),
        DashboardCatalogoAction.getPoliticasAg(
          filters.idPeriodo ?? null,
          filters.idDimension ?? null,
          filters.idUnidad ?? null
        ),
      ]);

      if (activo) {
        setAniosProyeccion(aniosResult.status === "fulfilled" ? aniosResult.value : []);
        setDimensionesAg(dimensionesResult.status === "fulfilled" ? dimensionesResult.value : []);
        setUnidadesOrganizacionales(unidadesResult.status === "fulfilled" ? unidadesResult.value : []);
        setPoliticasAg(politicasResult.status === "fulfilled" ? politicasResult.value : []);
      }
    }

    void loadCatalogosAgPorContexto();

    return () => {
      activo = false;
    };
  }, [filters.idPeriodo, filters.idDimension, filters.idUnidad]);

  useEffect(() => {
    void loadData(filters);
  }, [filters]);

  const jerarquiaData = useMemo(() => data?.jerarquia ?? [], [data]);
  const tendenciaData = useMemo(() => data?.tendencia ?? [], [data]);

  const radarDimensionesData = useMemo(() => {
    const radar = ((data as DashboardAgDtoConRadar | null)?.radarDimensiones ?? []).map((item) => ({
      dimension: item.dimension || "Sin dimensión",
      avancePromedio: Number(item.avancePromedio ?? 0),
      referencia75: Number(item.referencia75 ?? 75),
      referencia95: Number(item.referencia95 ?? 95),
    }));

    return radar;
  }, [data]);

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

    if (filters.idDimension != null) {
      result.push({
        key: "idDimension",
        label: `Dimensión: ${getOptionLabel(dimensionesAg, filters.idDimension)}`,
      });
    }

    if (filters.idUnidad != null) {
      result.push({
        key: "idUnidad",
        label: `Unidad: ${getOptionLabel(unidadesOrganizacionales, filters.idUnidad)}`,
      });
    }

    if (filters.idPolitica != null) {
      result.push({
        key: "idPolitica",
        label: `Política: ${getOptionLabel(politicasAg, filters.idPolitica)}`,
      });
    }

    if (filters.nivelAvance != null) {
      result.push({ key: "nivelAvance", label: `Avance: ${getNivelAvanceLabel(filters.nivelAvance)}` });
    }

    return result;
  }, [filters, periodos, aniosProyeccion, dimensionesAg, unidadesOrganizacionales, politicasAg]);

  const limpiarFiltros = () => {
    setFilters({
      idPeriodo: null,
      idAnioProyeccion: null,
      idDimension: null,
      idUnidad: null,
      idPolitica: null,
      nivelAvance: null,
    });
  };

  const quitarFiltro = (key: keyof DashboardCommonHeaderFiltersValue) => {
    setFilters((prev) => {
      if (key === "idPeriodo") {
        return { ...prev, idPeriodo: null, idDimension: null, idUnidad: null, idPolitica: null };
      }

      if (key === "idDimension") {
        return { ...prev, idDimension: null, idUnidad: null, idPolitica: null };
      }

      if (key === "idUnidad") {
        return { ...prev, idUnidad: null, idPolitica: null };
      }

      return { ...prev, [key]: null };
    });
  };

  const validarPeriodoParaReporte = (): boolean => {
    if (filters.idPeriodo == null) {
      setReporteMsg("Seleccione un periodo AG antes de generar el reporte.");
      return false;
    }

    setReporteMsg("");
    return true;
  };

  const generarReporteWeb = () => {
    if (!validarPeriodoParaReporte()) return;

    const qp = new URLSearchParams();
    if (filters.idPeriodo != null) qp.append("idPeriodo", String(filters.idPeriodo));
    if (filters.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filters.idAnioProyeccion));
    if (filters.idDimension != null) qp.append("idDimension", String(filters.idDimension));
    if (filters.idUnidad != null) qp.append("idUnidad", String(filters.idUnidad));
    if (filters.idPolitica != null) qp.append("idPolitica", String(filters.idPolitica));
    if (filters.nivelAvance != null) qp.append("nivelAvance", String(filters.nivelAvance));

    const url = `/dashboard/ag/reporte?${qp.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const descargarReporteExcel = async () => {
    if (!validarPeriodoParaReporte()) return;

    setDownloadingExcel(true);
    try {
      await DashboardAgAction.descargarReporteExcel({
        idPeriodo: filters.idPeriodo ?? undefined,
        idAnioProyeccion: filters.idAnioProyeccion ?? undefined,
        idDimension: filters.idDimension ?? undefined,
        idUnidad: filters.idUnidad ?? undefined,
        idPolitica: filters.idPolitica ?? undefined,
        nivelAvance: filters.nivelAvance ?? undefined,
      });
    } catch (error) {
      setReporteMsg(error instanceof Error ? error.message : "No se pudo descargar el Excel AG.");
    } finally {
      setDownloadingExcel(false);
    }
  };


  function toggleIndicadoresCard(itemKey: string) {
    setExpandedItems((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  }

  function openIndicadorDrawer(item: DashboardAgJerarquiaDto, indicador: DashboardAgIndicadorResumenDto) {
    setDrawerState({
      open: true,
      instrumento: "AG",
      idRegistro: item.idAgPoRecoInpr,
      idIndicadorNombre: indicador.idIndicadorNombre,
    });
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "rgba(248,250,252,.72)", minHeight: "100vh" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.4 },
          mb: 2,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.28)",
          background:
            "linear-gradient(135deg, rgba(239,246,255,.95), rgba(255,255,255,.96) 48%, rgba(240,253,250,.78))",
          boxShadow: "0 18px 44px rgba(15,23,42,.07)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                color: "rgb(30,64,175)",
                bgcolor: "rgba(37,99,235,.10)",
                border: "1px solid rgba(37,99,235,.18)",
              }}
            >
              <AutoGraphRoundedIcon />
            </Box>

            <Box>
              <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-.02em" }}>
                Dashboard A.G.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                Seguimiento de políticas, resultados concertados, intervenciones prioritarias e indicadores
              </Typography>
            </Box>
          </Stack>

          <Tooltip title="Refrescar dashboard">
            <IconButton
              onClick={() => void loadData(filters)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "14px",
                border: "1px solid rgba(148,163,184,.35)",
                bgcolor: "rgba(255,255,255,.82)",
                boxShadow: "0 8px 20px rgba(15,23,42,.06)",
              }}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.7, md: 2 },
          mb: 1.4,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.30)",
          bgcolor: "rgba(255,255,255,.92)",
          boxShadow: "0 14px 32px rgba(15,23,42,.06)",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(37,99,235,.10)",
              color: "rgb(37,99,235)",
            }}
          >
            <FilterAltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>Filtros de búsqueda</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              Ajuste el contexto para consultar el avance de los acuerdos de gobernabilidad.
            </Typography>
          </Box>
        </Stack>

        <DashboardHeaderFilters
          value={filters}
          periodos={periodos}
          aniosProyeccion={aniosProyeccion}
          dimensionesAg={dimensionesAg}
          unidadesOrganizacionales={unidadesOrganizacionales}
          politicasAg={politicasAg}
          mostrarDimensionAg
          mostrarUnidadOrganizacional
          mostrarPoliticaAg
          mostrarNivelAvance
          onChange={(value) => {
            setReporteMsg("");
            setFilters(value);
          }}
        />
      </Paper>

      {reporteMsg ? (
        <Alert severity="warning" sx={{ mt: -0.6, mb: 1.4, borderRadius: 2 }}>
          {reporteMsg}
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
            <Chip
              size="small"
              label="Sin filtros activos"
              variant="outlined"
              sx={{ borderRadius: 999, bgcolor: "rgba(255,255,255,.86)", fontWeight: 800 }}
            />
          ) : (
            filtrosActivos.map((item) => (
              <Chip
                key={String(item.key)}
                size="small"
                label={item.label}
                onDelete={() => quitarFiltro(item.key)}
                variant="outlined"
                sx={{
                  borderRadius: 999,
                  fontWeight: 800,
                  maxWidth: 420,
                  bgcolor: "rgba(239,246,255,.85)",
                  borderColor: "rgba(59,130,246,.28)",
                }}
              />
            ))
          )}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PictureAsPdfRoundedIcon />}
            onClick={generarReporteWeb}
            disabled={downloadingPdf || downloadingExcel}
            sx={{ borderRadius: 2.5, fontWeight: 950, whiteSpace: "nowrap", bgcolor: "rgba(255,255,255,.88)" }}
          >
            Generar reporte PDF
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<TableChartRoundedIcon />}
            onClick={() => void descargarReporteExcel()}
            disabled={downloadingPdf || downloadingExcel}
            sx={{ borderRadius: 2.5, fontWeight: 950, whiteSpace: "nowrap", bgcolor: "rgba(255,255,255,.88)" }}
          >
            {downloadingExcel ? "Descargando..." : "Descargar Excel"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterAltOffRoundedIcon />}
            onClick={limpiarFiltros}
            disabled={filtrosActivos.length === 0}
            sx={{ borderRadius: 2.5, fontWeight: 950, whiteSpace: "nowrap", bgcolor: "rgba(255,255,255,.88)" }}
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
            <Typography>Cargando dashboard AG...</Typography>
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
          <Grid container spacing={2.2} sx={{ mt: 1.4, mb: 6 }}>
            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard title="Políticas" value={data.kpis.totalPoliticas} subtitle="Políticas evaluadas" icon={<FlagRoundedIcon />} tone="purple" />
            </Grid>
            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard title="Resultados" value={data.kpis.totalResultados} subtitle="Resultados concertados" icon={<ChecklistRoundedIcon />} tone="blue" />
            </Grid>
            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard title="Intervenciones" value={data.kpis.totalIntervenciones} subtitle="Intervenciones prioritarias" icon={<AccountTreeRoundedIcon />} tone="green" />
            </Grid>
            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard title="Indicadores" value={data.kpis.totalIndicadores} subtitle="Indicadores vinculados" icon={<DonutLargeRoundedIcon />} tone="blue" />
            </Grid>
            <Grid item xs={12} md={6} xl={2.4}>
              <KpiCard title="Avance Promedio" value={formatPercent(data.kpis.avancePromedio)} subtitle="Promedio consolidado AG" icon={<InsightsRoundedIcon />} tone="amber" />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,.30)",
              bgcolor: "rgba(255,255,255,.94)",
              boxShadow: "0 18px 42px rgba(15,23,42,.07)",
            }}
          >
            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(37,99,235,.10)",
                  color: "rgb(37,99,235)",
                }}
              >
                <AccountTreeRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>Lista Política / Resultado Concertado / Intervención Prioritaria</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  Revise el avance por jerarquía y abra el detalle analítico del indicador.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.1}>
              {jerarquiaData.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No se encontraron registros con los filtros seleccionados.
                </Alert>
              ) : null}

              {jerarquiaData.map((item) => {
                const itemKey = String(item.idAgPoRecoInpr);
                const indicadores = item.indicadores ?? [];
                const expanded = Boolean(expandedItems[itemKey]);
                const avanceTheme = getAvanceTheme(item.avancePromedio);
                const barColor = getAvanceBarColor(item.avancePromedio);
                const avanceLimitado = clampProgress(item.avancePromedio);

                return (
                  <Paper
                    key={item.idAgPoRecoInpr}
                    variant="outlined"
                    sx={{
                      p: { xs: 1.4, md: 1.7 },
                      borderRadius: 3,
                      borderColor: avanceTheme.border,
                      background: avanceTheme.bg,
                      boxShadow: avanceTheme.shadow,
                      position: "relative",
                      overflow: "hidden",
                      "&:before": {
                        content: '\"\"',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 4,
                        bottom: 0,
                        bgcolor: avanceTheme.accent,
                      },
                    }}
                  >
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.4} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            label="AG"
                            variant="outlined"
                            sx={{
                              height: 20,
                              borderRadius: 999,
                              ...getAgNivelChipSx(),
                              "& .MuiChip-label": { px: 0.8, fontSize: 11 },
                            }}
                          />
                          <Typography sx={{ fontWeight: 950, fontSize: 14.2, letterSpacing: "-.01em" }}>
                            {item.codigoPolitica} - {item.descripcionPolitica}
                          </Typography>
                        </Stack>

                        <Typography sx={{ mt: 0.35, fontSize: 13, color: "text.secondary" }}>
                          Resultado concertado: {item.codigoResultado} - {item.descripcionResultado}
                        </Typography>
                        <Typography sx={{ mt: 0.25, fontSize: 13, color: "text.secondary" }}>
                          Intervención prioritaria: {item.codigoIntervencion} - {item.descripcionIntervencion}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.9 }} flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            icon={<FormatListBulletedRoundedIcon />}
                            label={`Indicadores: ${indicadores.length || item.cantidadIndicadores}`}
                            variant="outlined"
                            sx={{ borderRadius: 999, ...getAvanceChipSx(item.avancePromedio) }}
                          />

                          <Chip
                            size="small"
                            icon={<SpeedRoundedIcon />}
                            label={`Avance: ${formatPercent(item.avancePromedio)}`}
                            variant="outlined"
                            sx={{ borderRadius: 999, ...getAvanceChipSx(item.avancePromedio) }}
                          />
                        </Stack>

                        <Box sx={{ mt: 1.2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={avanceLimitado}
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

                      <Tooltip title={expanded ? "Ocultar indicadores asociados" : "Ver indicadores asociados"}>
                        <IconButton
                          size="small"
                          onClick={() => toggleIndicadoresCard(itemKey)}
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "14px",
                            border: `1px solid ${avanceTheme.borderSoft}`,
                            color: avanceTheme.text,
                            bgcolor: avanceTheme.chipBg,
                            boxShadow: "0 10px 20px rgba(15,23,42,.08)",
                            alignSelf: { xs: "flex-end", md: "flex-start" },
                            transition: "all .18s ease",
                            "&:hover": {
                              bgcolor: avanceTheme.chipBg,
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <KeyboardArrowUpRoundedIcon
                            sx={{
                              fontSize: 22,
                              transform: expanded ? "rotate(0deg)" : "rotate(180deg)",
                              transition: "transform .18s ease",
                            }}
                          />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          mt: 1.4,
                          pt: 1.2,
                          borderTop: `1px solid ${avanceTheme.borderSoft}`,
                        }}
                      >
                        <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                          <FormatListBulletedRoundedIcon sx={{ fontSize: 17, color: avanceTheme.text }} />
                          <Typography sx={{ fontSize: 13, fontWeight: 950, color: "rgb(51,65,85)" }}>
                            Indicadores asociados
                          </Typography>
                          <Chip
                            size="small"
                            label={`${indicadores.length} registro(s)`}
                            variant="outlined"
                            sx={{
                              height: 20,
                              borderRadius: 999,
                              ...getAvanceChipSx(item.avancePromedio),
                              "& .MuiChip-label": { px: 0.75, fontSize: 10.5 },
                            }}
                          />
                        </Stack>

                        {indicadores.length === 0 ? (
                          <Alert severity="info" sx={{ borderRadius: 2 }}>
                            No se encontraron indicadores asociados para este registro AG.
                          </Alert>
                        ) : null}

                        <Stack spacing={0.85}>
                          {indicadores.map((indicador) => {
                            const indicadorTheme = getAvanceTheme(indicador.avance);
                            const indicadorBarColor = getAvanceBarColor(indicador.avance);

                            return (
                              <Paper
                                key={`${item.idAgPoRecoInpr}-${indicador.idIndicadorNombre}`}
                                variant="outlined"
                                sx={{
                                  p: { xs: 1.15, md: 1.25 },
                                  borderRadius: 2.6,
                                  borderColor: "rgba(148,163,184,.28)",
                                  bgcolor: "rgba(255,255,255,.78)",
                                  boxShadow: "0 8px 18px rgba(15,23,42,.04)",
                                }}
                              >
                                <Stack
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={1}
                                  alignItems={{ xs: "stretch", md: "center" }}
                                  justifyContent="space-between"
                                >
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                                      <Chip
                                        size="small"
                                        label={indicador.codigoIndicador || `ID-${indicador.idIndicadorNombre}`}
                                        variant="outlined"
                                        sx={{
                                          height: 20,
                                          borderRadius: 999,
                                          ...getAvanceChipSx(indicador.avance),
                                          "& .MuiChip-label": { px: 0.8, fontSize: 10.5 },
                                        }}
                                      />
                                      <Typography sx={{ fontSize: 13.1, fontWeight: 950, color: "rgb(15,23,42)" }}>
                                        {indicador.nombreIndicador}
                                      </Typography>
                                    </Stack>

                                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                                      <Chip
                                        size="small"
                                        label={`Meta: ${formatNumber(indicador.meta)}`}
                                        variant="outlined"
                                        sx={{
                                          height: 22,
                                          borderRadius: 999,
                                          ...getAvanceChipSx(indicador.avance),
                                          "& .MuiChip-label": { px: 0.75, fontSize: 10.7 },
                                        }}
                                      />
                                      <Chip
                                        size="small"
                                        label={`Ejecutado: ${formatNumber(indicador.ejecutado)}`}
                                        variant="outlined"
                                        sx={{
                                          height: 22,
                                          borderRadius: 999,
                                          ...getAvanceChipSx(indicador.avance),
                                          "& .MuiChip-label": { px: 0.75, fontSize: 10.7 },
                                        }}
                                      />
                                      <Chip
                                        size="small"
                                        icon={<SpeedRoundedIcon />}
                                        label={`Avance: ${formatPercent(indicador.avance)}`}
                                        variant="outlined"
                                        sx={{
                                          height: 22,
                                          borderRadius: 999,
                                          ...getAvanceChipSx(indicador.avance),
                                          "& .MuiChip-label": { px: 0.75, fontSize: 10.7 },
                                        }}
                                      />
                                    </Stack>

                                    <Box sx={{ mt: 0.85, maxWidth: { xs: "100%", md: 520 } }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={clampProgress(indicador.avance)}
                                        sx={{
                                          height: 6,
                                          borderRadius: 999,
                                          bgcolor: "rgba(148,163,184,0.18)",
                                          "& .MuiLinearProgress-bar": {
                                            borderRadius: 999,
                                            bgcolor: indicadorBarColor,
                                          },
                                        }}
                                      />
                                    </Box>
                                  </Box>

                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<QueryStatsRoundedIcon />}
                                    onClick={() => openIndicadorDrawer(item, indicador)}
                                    sx={{
                                      alignSelf: { xs: "flex-start", md: "center" },
                                      borderRadius: 2.3,
                                      fontWeight: 950,
                                      whiteSpace: "nowrap",
                                      color: indicadorTheme.text,
                                      borderColor: indicadorTheme.borderSoft,
                                      bgcolor: "rgba(255,255,255,.76)",
                                      "&:hover": {
                                        borderColor: indicadorTheme.border,
                                        bgcolor: indicadorTheme.chipBg,
                                      },
                                    }}
                                  >
                                    Ver resumen
                                  </Button>
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Box>
                    </Collapse>
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
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,.30)",
              bgcolor: "rgba(255,255,255,.94)",
              boxShadow: "0 18px 42px rgba(15,23,42,.07)",
            }}
          >
            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 0.4 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(20,184,166,.10)",
                  color: "rgb(13,148,136)",
                }}
              >
                <AutoGraphRoundedIcon fontSize="small" />
              </Box>
              <Typography sx={{ fontWeight: 900 }}>Tendencia AG</Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Evolución del avance promedio por año de proyección. La tendencia mantiene el contexto de período, dimensión, unidad, política y nivel de avance, y no se limita por el año seleccionado.
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, md: 2 },
                minHeight: { xs: 560, md: 625 },
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,.22)",
                bgcolor: "linear-gradient(135deg, rgba(240,253,250,.72), rgba(255,255,255,.98))",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                    Radar por dimensiones
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 11.5 }}>
                    Avance promedio consolidado por dimensión
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={`${radarDimensionesData.length} dimensión(es)`}
                  variant="outlined"
                  sx={{ fontWeight: 900, borderColor: "rgba(37,99,235,.28)", color: "rgb(30,64,175)" }}
                />
              </Stack>

              {radarDimensionesData.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No se encontraron datos por dimensión para los filtros seleccionados.
                </Alert>
              ) : (
                <Box sx={{ height: { xs: 468, md: 507 }, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarDimensionesData} outerRadius="88%" margin={{ top: 12, right: 56, left: 56, bottom: 12 }}>
                      <PolarGrid stroke="rgba(148,163,184,.45)" />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: DASHBOARD_COLORS.text, fontSize: 11, fontWeight: 800 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 150]}
                        tick={{ fill: DASHBOARD_COLORS.text, fontSize: 10 }}
                        tickFormatter={(value: number) => `${value}%`}
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => {
                          if (name === "Avance promedio") return [formatPercent(value), name];
                          return [formatPercent(value), name];
                        }}
                      />
                      <Radar
                        name="Avance promedio"
                        dataKey="avancePromedio"
                        stroke={DASHBOARD_COLORS.primary}
                        fill={DASHBOARD_COLORS.primary}
                        fillOpacity={0.22}
                        strokeWidth={3}
                        dot
                      />
                      <Radar
                        name="Referencia 75%"
                        dataKey="referencia75"
                        stroke={DASHBOARD_COLORS.warning}
                        fill={DASHBOARD_COLORS.warning}
                        fillOpacity={0.04}
                        strokeDasharray="5 5"
                      />
                      <Radar
                        name="Referencia 95%"
                        dataKey="referencia95"
                        stroke={DASHBOARD_COLORS.success}
                        fill={DASHBOARD_COLORS.success}
                        fillOpacity={0.04}
                        strokeDasharray="5 5"
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>
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
