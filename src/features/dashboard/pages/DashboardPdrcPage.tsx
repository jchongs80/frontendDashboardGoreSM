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
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";

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

import DashboardPdrcAction, {
  type DashboardPdrcDto,
  type DashboardPdrcIndicadorResumenDto,
  type DashboardPdrcJerarquiaDto,
} from "../DashboardPdrcAction";
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
  tone?: "purple" | "blue" | "green" | "amber" | "teal";
};


function getNivelChipSx(item: DashboardPdrcJerarquiaDto) {
  return item.codigoAer || item.enunciadoAer
    ? {
        bgcolor: "rgba(37,99,235,0.10)",
        color: "rgb(30,64,175)",
        borderColor: "rgba(37,99,235,0.45)",
        fontWeight: 900,
      }
    : {
        bgcolor: "rgba(20,184,166,0.12)",
        color: "rgb(15,118,110)",
        borderColor: "rgba(20,184,166,0.45)",
        fontWeight: 900,
      };
}

function getNivelLabel(item: DashboardPdrcJerarquiaDto): string {
  if (item.codigoAer || item.enunciadoAer) {
    return `${item.codigoAer ?? "AER"} - ${item.enunciadoAer ?? ""}`.trim();
  }

  return `${item.codigoOer ?? "OER"} - ${item.enunciadoOer ?? ""}`.trim();
}

function getAvanceBarColor(avance?: number | null): string {
  return getAvanceTheme(avance).accent;
}

function clampProgress(value?: number | null): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}

type IndicadorDrawerState = {
  open: boolean;
  instrumento: string;
  idRegistro: number;
  idIndicadorNombre: number;
};

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
    teal: {
      bg: "linear-gradient(135deg, rgba(20,184,166,.12), rgba(255,255,255,.96))",
      iconBg: "rgba(20,184,166,.13)",
      iconColor: "rgb(15,118,110)",
      border: "rgba(20,184,166,.26)",
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
            border: `1px solid ${palette.border}`,
          }}
        >
          {icon}
        </Box>
      </Stack>

      {subtitle ? (
        <Typography sx={{ mt: 1.2, fontSize: 12.5, color: "text.secondary", lineHeight: 1.35 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Paper>
  );
}

function findLabel(options: OptionItem[], value?: number | string | null): string {
  if (value == null || value === "") return "";
  const item = options.find((x) => String(x.value) === String(value));
  return item?.label ?? String(value);
}

function nivelAvanceLabel(value?: DashboardNivelAvanceValue | null): string {
  if (value === "0_75") return "0% - 75%";
  if (value === "75_95") return "75% - 95%";
  if (value === "95_MAS") return "95% a más";
  return "";
}

export default function DashboardPdrcPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCombos, setLoadingCombos] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardPdrcDto | null>(null);

  const [filters, setFilters] = useState<DashboardCommonHeaderFiltersValue>({
    idPeriodo: null,
    idAnioProyeccion: null,
    idUnidad: null,
    idOer: null,
    idAer: null,
    nivelAvance: null,
  });

  const [periodos, setPeriodos] = useState<OptionItem[]>([]);
  const [aniosProyeccion, setAniosProyeccion] = useState<OptionItem[]>([]);
  const [unidades, setUnidades] = useState<OptionItem[]>([]);
  const [oerOptions, setOerOptions] = useState<OptionItem[]>([]);
  const [aerOptions, setAerOptions] = useState<OptionItem[]>([]);

  const [drawerState, setDrawerState] = useState<IndicadorDrawerState>({
    open: false,
    instrumento: "PDRC",
    idRegistro: 0,
    idIndicadorNombre: 0,
  });

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  async function loadCombos() {
    setLoadingCombos(true);
    try {
      const periodosResp = await DashboardCatalogoAction.getPeriodos("PDRC").catch(() => []);
      setPeriodos(periodosResp);

      const aniosResp = await DashboardCatalogoAction.getAniosProyeccion(null, "PDRC").catch(() => []);
      setAniosProyeccion(aniosResp);

      const unidadesResp = await DashboardCatalogoAction.getUnidadesPdrc(null).catch(() => []);
      setUnidades(unidadesResp);

      const oerResp = await DashboardCatalogoAction.getOerPdrc(null, null).catch(() => []);
      setOerOptions(oerResp);

      setAerOptions([]);
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
        idUnidad: f.idUnidad ?? undefined,
        idOer: f.idOer ?? undefined,
        idAer: f.idAer ?? undefined,
        nivelAvance: f.nivelAvance ?? undefined,
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
    let activo = true;

    async function loadAniosPorPeriodo() {
      try {
        const aniosResp = await DashboardCatalogoAction.getAniosProyeccion(
          filters.idPeriodo ?? null,
          "PDRC"
        );

        if (activo) setAniosProyeccion(aniosResp);
      } catch {
        if (activo) setAniosProyeccion([]);
      }
    }

    void loadAniosPorPeriodo();

    return () => {
      activo = false;
    };
  }, [filters.idPeriodo]);

  useEffect(() => {
    let activo = true;

    async function loadUnidadesYOer() {
      try {
        const [unidadesResp, oerResp] = await Promise.all([
          DashboardCatalogoAction.getUnidadesPdrc(filters.idPeriodo ?? null).catch(() => []),
          DashboardCatalogoAction.getOerPdrc(filters.idPeriodo ?? null, filters.idUnidad ?? null).catch(() => []),
        ]);

        if (activo) {
          setUnidades(unidadesResp);
          setOerOptions(oerResp);
        }
      } catch {
        if (activo) {
          setUnidades([]);
          setOerOptions([]);
        }
      }
    }

    void loadUnidadesYOer();

    return () => {
      activo = false;
    };
  }, [filters.idPeriodo, filters.idUnidad]);

  useEffect(() => {
    let activo = true;

    async function loadAer() {
      if (!filters.idOer) {
        setAerOptions([]);
        return;
      }

      try {
        const aerResp = await DashboardCatalogoAction.getAerPdrc(
          filters.idPeriodo ?? null,
          filters.idUnidad ?? null,
          filters.idOer ?? null
        );

        if (activo) setAerOptions(aerResp);
      } catch {
        if (activo) setAerOptions([]);
      }
    }

    void loadAer();

    return () => {
      activo = false;
    };
  }, [filters.idPeriodo, filters.idUnidad, filters.idOer]);

  useEffect(() => {
    void loadData(filters);
  }, [filters]);

  const jerarquiaData = useMemo(() => data?.jerarquia ?? [], [data]);
  const tendenciaData = useMemo(() => data?.tendencia ?? [], [data]);
  const tendenciaGraficoData = useMemo(
    () =>
      tendenciaData.map((item) => {
        const avance = Math.max(0, Math.min(Number(item.valor ?? 0), 100));

        return {
          ...item,
          avancePromedio: avance,
          referencia75: 75,
          referencia95: 95,
        };
      }),
    [tendenciaData]
  );

  const anioResumen = useMemo(() => {
    const label = findLabel(aniosProyeccion, filters.idAnioProyeccion);
    const n = Number(label);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [aniosProyeccion, filters.idAnioProyeccion]);

  const filtrosActivos = useMemo(() => {
    const items: { key: keyof DashboardCommonHeaderFiltersValue; label: string }[] = [];

    if (filters.idPeriodo) items.push({ key: "idPeriodo", label: `Periodo: ${findLabel(periodos, filters.idPeriodo)}` });
    if (filters.idAnioProyeccion) items.push({ key: "idAnioProyeccion", label: `Año: ${findLabel(aniosProyeccion, filters.idAnioProyeccion)}` });
    if (filters.idUnidad) items.push({ key: "idUnidad", label: `Unidad: ${findLabel(unidades, filters.idUnidad)}` });
    if (filters.idOer) items.push({ key: "idOer", label: `OER: ${findLabel(oerOptions, filters.idOer)}` });
    if (filters.idAer) items.push({ key: "idAer", label: `AER: ${findLabel(aerOptions, filters.idAer)}` });
    if (filters.nivelAvance) items.push({ key: "nivelAvance", label: `Avance: ${nivelAvanceLabel(filters.nivelAvance)}` });

    return items;
  }, [filters, periodos, aniosProyeccion, unidades, oerOptions, aerOptions]);

  function updateFilters(next: DashboardCommonHeaderFiltersValue) {
    setFilters((prev) => {
      const cleaned: DashboardCommonHeaderFiltersValue = { ...next };

      if (prev.idPeriodo !== next.idPeriodo) {
        cleaned.idAnioProyeccion = null;
      }

      if (prev.idUnidad !== next.idUnidad) {
        cleaned.idOer = null;
        cleaned.idAer = null;
      }

      if (prev.idOer !== next.idOer) {
        cleaned.idAer = null;
      }

      return cleaned;
    });
  }

  function quitarFiltro(key: keyof DashboardCommonHeaderFiltersValue) {
    setFilters((prev) => {
      const next = { ...prev, [key]: null };

      if (key === "idPeriodo") next.idAnioProyeccion = null;
      if (key === "idUnidad") {
        next.idOer = null;
        next.idAer = null;
      }
      if (key === "idOer") next.idAer = null;

      return next;
    });
  }

  function limpiarFiltros() {
    setFilters({
      idPeriodo: null,
      idAnioProyeccion: null,
      idUnidad: null,
      idOer: null,
      idAer: null,
      nivelAvance: null,
    });
  }

  function toggleIndicadoresCard(itemKey: string) {
    setExpandedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  }

  function openIndicadorDrawer(
    item: DashboardPdrcJerarquiaDto,
    indicador: DashboardPdrcIndicadorResumenDto
  ) {
    setDrawerState({
      open: true,
      instrumento: "PDRC",
      idRegistro: item.idPdrcOerAer,
      idIndicadorNombre: indicador.idIndicadorNombre,
    });
  }


  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(37,99,235,.08), transparent 34%), linear-gradient(180deg, #f8fafc 0%, #eef4f8 100%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.2, md: 2.8 },
          mb: 2.4,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.25)",
          background: "linear-gradient(135deg, rgba(255,255,255,.96), rgba(248,250,252,.88))",
          boxShadow: "0 18px 45px rgba(15,23,42,.07)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.4} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "16px",
                display: "grid",
                placeItems: "center",
                color: "rgb(30,64,175)",
                bgcolor: "rgba(37,99,235,.10)",
                border: "1px solid rgba(37,99,235,.20)",
              }}
            >
              <AutoGraphRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-.02em" }}>
                Dashboard P.D.R.C.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                Seguimiento de OER, AER e indicadores regionales
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: "flex-start", md: "flex-end" }} flexWrap="wrap" useFlexGap>
            <Chip label={`OER: ${data?.kpis.totalOer ?? 0}`} size="small" variant="outlined" sx={{ borderRadius: 999, fontWeight: 900, bgcolor: "rgba(20,184,166,.10)", color: "rgb(15,118,110)", borderColor: "rgba(20,184,166,.35)" }} />
            <Chip label={`AER: ${data?.kpis.totalAer ?? 0}`} size="small" variant="outlined" sx={{ borderRadius: 999, fontWeight: 900, bgcolor: "rgba(37,99,235,.10)", color: "rgb(30,64,175)", borderColor: "rgba(37,99,235,.35)" }} />
            <Chip label={`Avance: ${formatPercent(data?.kpis.avancePromedio)}`} size="small" variant="outlined" sx={{ borderRadius: 999, fontWeight: 900, bgcolor: "rgba(34,197,94,.10)", color: "rgb(21,128,61)", borderColor: "rgba(34,197,94,.35)" }} />
            <Tooltip title="Refrescar dashboard">
              <IconButton
                onClick={() => void loadData(filters)}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "14px",
                  border: "1px solid rgba(148,163,184,.35)",
                  bgcolor: "rgba(255,255,255,.9)",
                  boxShadow: "0 10px 22px rgba(15,23,42,.06)",
                }}
              >
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.8, md: 2.2 },
          mb: 2,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.25)",
          background: "rgba(255,255,255,.94)",
          boxShadow: "0 16px 34px rgba(15,23,42,.06)",
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.6 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "13px",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(37,99,235,.10)",
              color: "rgb(37,99,235)",
            }}
          >
            <FilterAltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: 18 }}>Filtros de búsqueda</Typography>
            <Typography variant="body2" color="text.secondary">
              Ajuste el contexto para consultar el avance del PDRC y sus indicadores.
            </Typography>
          </Box>
        </Stack>

        <DashboardHeaderFilters
          value={filters}
          periodos={periodos}
          aniosProyeccion={aniosProyeccion}
          unidadesOrganizacionales={unidades}
          oerPdrc={oerOptions}
          aerPdrc={aerOptions}
          mostrarUnidadOrganizacional
          mostrarOerPdrc
          mostrarAerPdrc
          mostrarNivelAvance
          onChange={updateFilters}
        />
      </Paper>

      {loadingCombos ? (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2">Cargando filtros...</Typography>
          </Stack>
        </Box>
      ) : null}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 2.4 }}>
        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap alignItems="center">
          {filtrosActivos.length ? (
            filtrosActivos.map((item) => (
              <Chip
                key={item.key}
                label={item.label}
                size="small"
                onDelete={() => quitarFiltro(item.key)}
                sx={{
                  borderRadius: 999,
                  fontWeight: 850,
                  bgcolor: "rgba(255,255,255,.92)",
                  border: "1px solid rgba(148,163,184,.38)",
                  boxShadow: "0 8px 18px rgba(15,23,42,.05)",
                }}
              />
            ))
          ) : (
            <Chip
              label="Sin filtros activos"
              size="small"
              variant="outlined"
              sx={{ borderRadius: 999, fontWeight: 800, bgcolor: "rgba(255,255,255,.84)" }}
            />
          )}
        </Stack>

        <Button
          variant="outlined"
          size="small"
          startIcon={<FilterAltOffRoundedIcon />}
          onClick={limpiarFiltros}
          disabled={!filtrosActivos.length}
          sx={{
            borderRadius: 2.5,
            fontWeight: 950,
            px: 1.8,
            alignSelf: { xs: "flex-start", md: "center" },
            bgcolor: "rgba(255,255,255,.88)",
          }}
        >
          Limpiar filtros
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography>Cargando dashboard PDRC...</Typography>
          </Stack>
        </Box>
      ) : null}

      {!loading && errorMsg ? (
        <Alert severity="warning" sx={{ mt: 3, borderRadius: 3 }}>
          {errorMsg}
        </Alert>
      ) : null}

      {!loading && !errorMsg && data ? (
        <>
          <Grid container spacing={2.2} sx={{ mt: 0.5, mb: 6 }}>
            <Grid item xs={12} sm={6} lg={2.4}>
              <KpiCard title="OER" value={data.kpis.totalOer} subtitle="Objetivos estratégicos regionales evaluados" icon={<FlagRoundedIcon />} tone="teal" />
            </Grid>
            <Grid item xs={12} sm={6} lg={2.4}>
              <KpiCard title="Indicadores OER" value={data.kpis.totalIndicadoresOer ?? 0} subtitle="Indicadores asociados a nivel OER" icon={<DonutLargeRoundedIcon />} tone="blue" />
            </Grid>
            <Grid item xs={12} sm={6} lg={2.4}>
              <KpiCard title="AER" value={data.kpis.totalAer} subtitle="Acciones estratégicas regionales evaluadas" icon={<AccountTreeRoundedIcon />} tone="purple" />
            </Grid>
            <Grid item xs={12} sm={6} lg={2.4}>
              <KpiCard title="Indicadores AER" value={data.kpis.totalIndicadoresAer ?? 0} subtitle="Indicadores asociados a nivel AER" icon={<ChecklistRoundedIcon />} tone="green" />
            </Grid>
            <Grid item xs={12} sm={6} lg={2.4}>
              <KpiCard title="Avance Promedio" value={formatPercent(data.kpis.avancePromedio)} subtitle="Promedio consolidado del PDRC" icon={<SpeedRoundedIcon />} tone="amber" />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: 2.2,
              p: { xs: 1.7, md: 2.2 },
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,.25)",
              background: "rgba(255,255,255,.95)",
              boxShadow: "0 20px 45px rgba(15,23,42,.07)",
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.8 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "13px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(37,99,235,.10)",
                  color: "rgb(37,99,235)",
                }}
              >
                <FormatListBulletedRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 950, fontSize: 18 }}>Lista OER / AER</Typography>
                <Typography variant="body2" color="text.secondary">
                  Revise el avance por nivel y abra el resumen analítico del indicador.
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.1}>
              {jerarquiaData.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 3 }}>No se encontraron registros para los filtros seleccionados.</Alert>
              ) : null}

              {jerarquiaData.map((item) => {
                const itemKey = String(item.idPdrcOerAer);
                const indicadores = item.indicadores ?? [];
                const expanded = Boolean(expandedItems[itemKey]);
                const avance = Number(item.avancePromedio ?? 0);
                const avanceLimitado = clampProgress(avance);
                const nivelLabel = item.codigoAer || item.enunciadoAer ? "AER" : "OER";
                const avanceTheme = getAvanceTheme(item.avancePromedio);
                const barColor = getAvanceBarColor(item.avancePromedio);

                return (
                  <Paper
                    key={item.idPdrcOerAer}
                    elevation={0}
                    sx={{
                      p: 1.45,
                      borderRadius: 3,
                      border: "1.5px solid",
                      borderColor: avanceTheme.border,
                      background: avanceTheme.bg,
                      boxShadow: avanceTheme.shadow,
                      position: "relative",
                      overflow: "hidden",
                      "&:before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        bgcolor: avanceTheme.accent,
                      },
                    }}
                  >
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.4} justifyContent="space-between" alignItems={{ xs: "stretch", md: "flex-start" }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={0.9} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            size="small"
                            label={nivelLabel}
                            variant="outlined"
                            sx={{ borderRadius: 999, height: 22, ...getNivelChipSx(item) }}
                          />
                          <Typography sx={{ fontWeight: 950, fontSize: 14.5, lineHeight: 1.25 }}>
                            {getNivelLabel(item)}
                          </Typography>
                        </Stack>

                        {nivelLabel === "AER" ? (
                          <Typography sx={{ mt: 0.45, fontSize: 12.5, color: "text.secondary" }}>
                            Vinculado a: {item.codigoOer} - {item.enunciadoOer}
                          </Typography>
                        ) : null}

                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1.05 }} flexWrap="wrap" useFlexGap>
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

                        <Box sx={{ mt: 1.15 }}>
                          <LinearProgress
                            variant="determinate"
                            value={avanceLimitado}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "rgba(148,163,184,.18)",
                              "& .MuiLinearProgress-bar": {
                                borderRadius: 999,
                                bgcolor: barColor,
                              },
                            }}
                          />
                          <Typography sx={{ mt: 0.55, fontSize: 11.5, color: "text.secondary" }}>
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
                            bgcolor: avanceTheme.chipBg,
                            color: avanceTheme.text,
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
                            No se encontraron indicadores asociados para este nivel OER / AER.
                          </Alert>
                        ) : null}

                        <Stack spacing={0.85}>
                          {indicadores.map((indicador) => {
                            const indicadorTheme = getAvanceTheme(indicador.avance);
                            const indicadorBarColor = getAvanceBarColor(indicador.avance);

                            return (
                              <Paper
                                key={`${item.idPdrcOerAer}-${indicador.idIndicadorNombre}`}
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
              p: { xs: 1.8, md: 2.3 },
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,.25)",
              background: "rgba(255,255,255,.95)",
              boxShadow: "0 20px 45px rgba(15,23,42,.07)",
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
              <Typography sx={{ fontWeight: 950, fontSize: 17 }}>Tendencia PDRC</Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Evolución del avance promedio por año de proyección. El tooltip muestra el avance promedio y referencias.
            </Typography>

            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendenciaGraficoData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }}
                  />
                  <RechartsTooltip formatter={(v: number) => formatPercent(v)} />
                  <Legend verticalAlign="bottom" height={32} />
                  <Line
                    type="monotone"
                    dataKey="avancePromedio"
                    name="Avance promedio"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0f766e" }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="referencia75"
                    name="Referencia 75%"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="7 5"
                    dot={false}
                    activeDot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="referencia95"
                    name="Referencia 95%"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="7 5"
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
            anioResumen={anioResumen}
          />
        </>
      ) : null}
    </Box>
  );
}
