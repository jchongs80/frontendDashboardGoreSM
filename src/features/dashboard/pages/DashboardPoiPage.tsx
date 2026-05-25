import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  ButtonGroup,
  Chip,
  CircularProgress,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Select,
} from "@mui/material";
import Grid from "@mui/material/GridLegacy";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import PreviewRoundedIcon from "@mui/icons-material/PreviewRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";

import DashboardPoiAction, {
  type DashboardPoiAoEjecucionDto,
  type DashboardPoiCumplimientoDto,
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

function formatNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}



function getOptionLabel(options: OptionItem[], value?: number | null): string {
  if (value == null) return "";
  const item = options.find((x) => Number(x.value) === Number(value));
  return item?.label ?? String(value);
}

function getMesLabel(options: OptionItem[], value?: number | null): string {
  return getOptionLabel(options, value) || String(value ?? "");
}
type PorcentajeFinalFiltro = "TODOS" | "0_75" | "75_90" | "90_100" | "100_MAS";
type TablaTerritorialActiva = "ejecucion" | "programacion";
type TablaResumenFisicoActiva = "mensual" | "periodo" | "anual";
type TablaResumenAoActiva = "mensual" | "periodo" | "anual";

function optionKey(value: number | string | null | undefined): string {
  return value == null ? "" : String(value);
}

function getNumericPrefix(value: string | number | null | undefined): number {
  const text = String(value ?? "").trim();
  const match = text.match(/^-?\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function uniqueTerritorialOptions(
  rows: DashboardPoiCumplimientoDto[],
  keyId: "idProvincia" | "idDistrito",
  keyLabel: "provincia" | "distrito"
): OptionItem[] {
  const map = new Map<string, OptionItem>();

  rows.forEach((row) => {
    const id = row[keyId];
    const label = row[keyLabel];

    if (id == null || !label) return;

    map.set(String(id), {
      value: id,
      label,
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    const na = getNumericPrefix(a.label);
    const nb = getNumericPrefix(b.label);

    if (na !== nb) return na - nb;
    return String(a.label).localeCompare(String(b.label), "es");
  });
}

type TerritorialChartGroupBy = "provincia" | "distrito";

function buildTerritorialTrendRows(
  rows: DashboardPoiCumplimientoDto[],
  groupBy: TerritorialChartGroupBy
): DashboardPoiCumplimientoDto[] {
  const map = new Map<string, DashboardPoiCumplimientoDto>();

  rows.forEach((row) => {
    const key = groupBy === "provincia"
      ? optionKey(row.idProvincia || row.provincia || "SIN_PROVINCIA")
      : optionKey(row.idDistrito || row.distrito || "SIN_DISTRITO");

    const label = groupBy === "provincia"
      ? (row.provincia || "Sin provincia")
      : (row.distrito || "Sin distrito");

    const current = map.get(key);

    if (!current) {
      map.set(key, {
        ...row,
        grupo: label,
        codigo: label,
        descripcion: label,
        fisicaBaseMes: row.fisicaBaseMes ?? 0,
        fisicaComparacionMes: row.fisicaComparacionMes ?? 0,
        fisicaBasePeriodo: row.fisicaBasePeriodo ?? 0,
        fisicaComparacionPeriodo: row.fisicaComparacionPeriodo ?? 0,
        fisicaBaseAnual: row.fisicaBaseAnual ?? 0,
        fisicaComparacionAnual: row.fisicaComparacionAnual ?? 0,
        fisicaBaseFinal: row.fisicaBaseFinal ?? 0,
        fisicaComparacionFinal: row.fisicaComparacionFinal ?? 0,
      });
      return;
    }

    current.fisicaBaseMes = Number(current.fisicaBaseMes ?? 0) + Number(row.fisicaBaseMes ?? 0);
    current.fisicaComparacionMes = Number(current.fisicaComparacionMes ?? 0) + Number(row.fisicaComparacionMes ?? 0);
    current.fisicaBasePeriodo = Number(current.fisicaBasePeriodo ?? 0) + Number(row.fisicaBasePeriodo ?? 0);
    current.fisicaComparacionPeriodo = Number(current.fisicaComparacionPeriodo ?? 0) + Number(row.fisicaComparacionPeriodo ?? 0);
    current.fisicaBaseAnual = Number(current.fisicaBaseAnual ?? 0) + Number(row.fisicaBaseAnual ?? 0);
    current.fisicaComparacionAnual = Number(current.fisicaComparacionAnual ?? 0) + Number(row.fisicaComparacionAnual ?? 0);
    current.fisicaBaseFinal = Number(current.fisicaBaseFinal ?? 0) + Number(row.fisicaBaseFinal ?? 0);
    current.fisicaComparacionFinal = Number(current.fisicaComparacionFinal ?? 0) + Number(row.fisicaComparacionFinal ?? 0);
  });

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      cumplimientoMes: Number(row.fisicaComparacionMes ?? 0) === 0
        ? 0
        : Number(((Number(row.fisicaBaseMes ?? 0) / Number(row.fisicaComparacionMes ?? 0)) * 100).toFixed(2)),
      cumplimientoPeriodo: Number(row.fisicaComparacionPeriodo ?? 0) === 0
        ? 0
        : Number(((Number(row.fisicaBasePeriodo ?? 0) / Number(row.fisicaComparacionPeriodo ?? 0)) * 100).toFixed(2)),
      cumplimientoAnual: Number(row.fisicaComparacionAnual ?? 0) === 0
        ? 0
        : Number(((Number(row.fisicaBaseAnual ?? 0) / Number(row.fisicaComparacionAnual ?? 0)) * 100).toFixed(2)),
      cumplimientoFinal: Number(row.fisicaComparacionFinal ?? 0) === 0
        ? 0
        : Number(((Number(row.fisicaBaseFinal ?? 0) / Number(row.fisicaComparacionFinal ?? 0)) * 100).toFixed(2)),
    }))
    .sort((a, b) => {
      const na = getNumericPrefix(a.grupo);
      const nb = getNumericPrefix(b.grupo);

      if (na !== nb) return na - nb;
      return String(a.grupo).localeCompare(String(b.grupo), "es");
    });
}



const porcentajeFinalOptions: { value: PorcentajeFinalFiltro; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "0_75", label: "0% - 75%" },
  { value: "75_90", label: "75% - 90%" },
  { value: "90_100", label: "90% - 100%" },
  { value: "100_MAS", label: "100% a más" },
];

function cumpleFiltroPorcentajeFinal(
  row: DashboardPoiCumplimientoDto,
  filtro: PorcentajeFinalFiltro
): boolean {
  if (filtro === "TODOS") return true;

  const value = Number(row.cumplimientoFinal ?? 0);

  if (filtro === "0_75") return value >= 0 && value <= 75;
  if (filtro === "75_90") return value > 75 && value <= 90;
  if (filtro === "90_100") return value > 90 && value <= 100;

  return value > 100;
}

function cumplimientoResumenCellSx(value: number | null | undefined) {
  const n = Number(value ?? 0);

  if (n > 100) {
    return {
      ...bodyCellSx,
      background: "#7e22ce",
      color: "#ffffff",
      fontWeight: 800,
    };
  }

  if (n >= 90) {
    return {
      ...bodyCellSx,
      background: "#bbf7d0",
      color: "#166534",
      fontWeight: 800,
    };
  }

  if (n >= 75) {
    return {
      ...bodyCellSx,
      background: "#fecaca",
      color: "#991b1b",
      fontWeight: 800,
    };
  }

  return {
    ...bodyCellSx,
    background: "#fef08a",
    color: "#713f12",
    fontWeight: 800,
  };
}

type TablaResumenFisicoProps = {
  modo: TablaResumenFisicoActiva;
  rows: DashboardPoiCumplimientoDto[];
  mesLabel: string;
};

function TablaResumenFisicoOeiAei({
  modo,
  rows,
  mesLabel,
}: TablaResumenFisicoProps): React.ReactElement {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  useEffect(() => {
    setPage(0);
  }, [modo, rows]);

  const config = useMemo(() => {
    if (modo === "mensual") {
      return {
        title: "EJECUCIÓN FÍSICA DEL MENSUAL (DEL MES SELECCIONADO)",
        firstColumn: `OEI / AEI, DEL MES SELECCIONADO${mesLabel ? ` - ${mesLabel}` : ""}`,
        totalLabel: "CANTIDAD AO, TOTAL DEL MES SELECCIONADO",
        mayorCeroLabel: "CANTIDAD AO > 0, DEL MES SELECCIONADO",
        porcentajeLabel: "EJECUCIÓN FÍSICA DEL MES SELECCIONADO (%) F(SE) / F(RE) %",
        totalGetter: (row: DashboardPoiCumplimientoDto) => row.cantidadAoTotalMes,
        mayorCeroGetter: (row: DashboardPoiCumplimientoDto) => row.cantidadAoMayorCeroMes,
        porcentajeGetter: (row: DashboardPoiCumplimientoDto) => row.cumplimientoMes,
      };
    }

    if (modo === "periodo") {
      return {
        title: "EJECUCIÓN FÍSICA DEL PERIODO (ACUMULADO HASTA EL MES SELECCIONADO)",
        firstColumn: "OEI / AEI, DEL PERIODO",
        totalLabel: "CANTIDAD AO, TOTAL DEL PERIODO",
        mayorCeroLabel: "CANTIDAD AO > 0, DEL PERIODO",
        porcentajeLabel: "EJECUCIÓN FÍSICA DEL PERIODO (%) F(SE) / F(RE) %",
        totalGetter: (row: DashboardPoiCumplimientoDto) => row.cantidadAoTotalPeriodo,
        mayorCeroGetter: (row: DashboardPoiCumplimientoDto) => row.cantidadAoMayorCeroPeriodo,
        porcentajeGetter: (row: DashboardPoiCumplimientoDto) => row.cumplimientoPeriodo,
      };
    }

    return {
      title: "AVANCE FÍSICO ANUAL",
      firstColumn: "OEI / AEI, DEL AÑO",
      totalLabel: "CANTIDAD AO, TOTAL DEL AÑO",
      mayorCeroLabel: "CANTIDAD AO > 0, DEL AÑO",
      porcentajeLabel: "EJECUCIÓN FÍSICA DEL AÑO (%) F(SE) / F(RE) %",
      totalGetter: (row: DashboardPoiCumplimientoDto) => row.cantidadAoTotalAnual,
      mayorCeroGetter: (row: DashboardPoiCumplimientoDto) => row.cantidadAoMayorCeroAnual,
      porcentajeGetter: (row: DashboardPoiCumplimientoDto) => row.cumplimientoAnual,
    };
  }, [modo, mesLabel]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => Number(config.totalGetter(row) ?? 0) > 0 || Number(config.mayorCeroGetter(row) ?? 0) > 0);
  }, [rows, config]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2.2,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid rgba(148,163,184,.26)",
        boxShadow: "0 18px 42px rgba(15,23,42,.065)",
        background: "rgba(255,255,255,.96)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pb: 1.2 }}>
        <FactCheckRoundedIcon sx={{ color: "#2563eb" }} />
        <Box>
          <Typography sx={{ fontWeight: 950, fontSize: 16 }}>{config.title}</Typography>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
            Resumen por OEI/AEI según los filtros principales del dashboard.
          </Typography>
        </Box>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headCellSx, width: "36%" }}>{config.firstColumn}</TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: "18%" }}>{config.totalLabel}</TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: "18%" }}>{config.mayorCeroLabel}</TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: "28%" }}>{config.porcentajeLabel}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!filteredRows.length ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                  No hay información para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : paginatedRows.map((row, idx) => {
              const porcentaje = Number(config.porcentajeGetter(row) ?? 0);

              return (
                <TableRow key={`resumen-fisico-${modo}-${row.grupo}-${page * rowsPerPage + idx}`} hover>
                  <TableCell sx={bodyMainCellSx}>
                    <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>{row.grupo}</Typography>
                    {row.descripcion && row.descripcion !== row.grupo ? (
                      <Typography sx={{ mt: 0.3, color: "text.secondary", fontSize: 11.5 }}>
                        {row.descripcion}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell align="center" sx={bodyCellSx}>
                    {formatNumber(config.totalGetter(row))}
                  </TableCell>
                  <TableCell align="center" sx={bodyCellSx}>
                    {formatNumber(config.mayorCeroGetter(row))}
                  </TableCell>
                  <TableCell align="center" sx={cumplimientoResumenCellSx(porcentaje)}>
                    {formatPercent(porcentaje)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
        sx={{
          borderTop: "1px solid #e5e7eb",
          background: "#ffffff",
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: 12.5,
            fontWeight: 700,
            color: "#475569",
          },
          "& .MuiTablePagination-select": {
            fontSize: 12.5,
            fontWeight: 800,
          },
        }}
      />
    </Paper>
  );
}


type TablaResumenFisicoAoProps = {
  modo: TablaResumenAoActiva;
  rows: DashboardPoiAoEjecucionDto[];
  mesLabel: string;
};

function TablaResumenFisicoAo({
  modo,
  rows,
  mesLabel,
}: TablaResumenFisicoAoProps): React.ReactElement {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  useEffect(() => {
    setPage(0);
  }, [modo, rows]);

  const config = useMemo(() => {
    if (modo === "mensual") {
      return {
        title: "NIVEL DE EJECUCIÓN FÍSICA SEGÚN AO (DEL MES SELECCIONADO)",
        porcentajeLabel: `EJECUCIÓN FÍSICA DEL MES SELECCIONADO (%)${mesLabel ? ` - ${mesLabel}` : ""}`,
        porcentajeGetter: (row: DashboardPoiAoEjecucionDto) => row.cumplimientoMes,
      };
    }

    if (modo === "periodo") {
      return {
        title: "NIVEL DE EJECUCIÓN FÍSICA SEGÚN AO (ACUMULADO HASTA EL MES SELECCIONADO)",
        porcentajeLabel: "EJECUCIÓN FÍSICA DEL PERIODO (%)",
        porcentajeGetter: (row: DashboardPoiAoEjecucionDto) => row.cumplimientoPeriodo,
      };
    }

    return {
      title: "NIVEL DE EJECUCIÓN FÍSICA SEGÚN AO (ANUAL)",
      porcentajeLabel: "EJECUCIÓN FÍSICA DEL AÑO (%)",
      porcentajeGetter: (row: DashboardPoiAoEjecucionDto) => row.cumplimientoAnual,
    };
  }, [modo, mesLabel]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const value = Number(config.porcentajeGetter(row) ?? 0);
      return value > 0 || Number(row.fisicaBaseMes ?? 0) > 0 || Number(row.fisicaBasePeriodo ?? 0) > 0 || Number(row.fisicaBaseAnual ?? 0) > 0;
    });
  }, [rows, config]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2.2,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid rgba(148,163,184,.26)",
        boxShadow: "0 18px 42px rgba(15,23,42,.065)",
        background: "rgba(255,255,255,.96)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pb: 1.2 }}>
        <QueryStatsRoundedIcon sx={{ color: "#2563eb" }} />
        <Box>
          <Typography sx={{ fontWeight: 950, fontSize: 16 }}>{config.title}</Typography>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
            Resumen por Actividad Operativa según los filtros principales del dashboard.
          </Typography>
        </Box>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headCellSx, width: "30%" }}>CENTRO DE COSTO</TableCell>
              <TableCell sx={{ ...headCellSx, width: "45%" }}>ACTIVIDAD OPERATIVA</TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: "25%" }}>
                {config.porcentajeLabel}
                <Typography component="div" sx={{ fontSize: 11, fontWeight: 900 }}>
                  F(SE) / F(RE) %
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!filteredRows.length ? (
              <TableRow>
                <TableCell colSpan={3} sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                  No hay información para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : paginatedRows.map((row, idx) => {
              const porcentaje = Number(config.porcentajeGetter(row) ?? 0);

              return (
                <TableRow key={`resumen-ao-${modo}-${row.idOeiAeiAo}-${page * rowsPerPage + idx}`} hover>
                  <TableCell sx={bodyMainCellSx}>
                    <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>{row.centroCosto || "Sin centro de costo"}</Typography>
                  </TableCell>
                  <TableCell sx={bodyMainCellSx}>
                    <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>{row.codigoAo || "SIN-AO"}</Typography>
                    <Typography sx={{ mt: 0.3, color: "text.secondary", fontSize: 11.5 }}>
                      {row.actividadOperativa || "Sin actividad operativa"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={cumplimientoResumenCellSx(porcentaje)}>
                    {formatPercent(porcentaje)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
        sx={{
          borderTop: "1px solid #e5e7eb",
          background: "#ffffff",
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: 12.5,
            fontWeight: 700,
            color: "#475569",
          },
          "& .MuiTablePagination-select": {
            fontSize: 12.5,
            fontWeight: 800,
          },
        }}
      />
    </Paper>
  );
}


type GaugeCardProps = {
  title: string;
  value: number;
  subtitle: string;
};

function GaugeCard({ title, value, subtitle }: GaugeCardProps): React.ReactElement {
  const normalized = Math.max(0, Math.min(100, Number(value ?? 0)));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: 4,
        border: "1px solid rgba(59,130,246,.26)",
        background:
          "linear-gradient(135deg, rgba(255,255,255,.98) 0%, rgba(239,246,255,.78) 100%)",
        boxShadow: "0 18px 40px rgba(37,99,235,.11)",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        "&:before": {
          content: '""',
          position: "absolute",
          inset: "0 auto 0 0",
          width: 4,
          background: "linear-gradient(180deg, #2563eb 0%, #22c55e 100%)",
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 14, color: "#1e3a8a" }}>
            {title}
          </Typography>
          <Typography sx={{ mt: 0.45, fontSize: 12, color: "#64748b", fontWeight: 700 }}>
            {subtitle}
          </Typography>
        </Box>
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={78}
            thickness={4.5}
            sx={{ color: "#e5e7eb", position: "absolute" }}
          />
          <CircularProgress
            variant="determinate"
            value={normalized}
            size={78}
            thickness={4.5}
            sx={{ color: value >= 95 ? "#16a34a" : value >= 75 ? "#f59e0b" : "#ef4444" }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontWeight: 900, fontSize: 15 }}>
              {formatPercent(value)}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}

type TablaPoiProps = {
  title: string;
  rows: DashboardPoiCumplimientoDto[];
  baseLabel: string;
  comparisonLabel: string;
  firstColumnTitle: string;
};

function TablaPoiCumplimiento({
  title,
  rows,
  baseLabel,
  comparisonLabel,
  firstColumnTitle,
}: TablaPoiProps): React.ReactElement {
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  useEffect(() => {
    setPage(0);
  }, [rows, title, baseLabel, comparisonLabel, firstColumnTitle]);

  const paginatedRows = useMemo(() => {
    return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2.2,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid rgba(148,163,184,.26)",
        boxShadow: "0 18px 42px rgba(15,23,42,.065)",
        background: "rgba(255,255,255,.96)",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pb: 1.5 }}>
        <QueryStatsRoundedIcon sx={{ color: "#2563eb" }} />
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{title}</Typography>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
            Nivel de cumplimiento físico por Unidad Ejecutora y OEI/AEI.
          </Typography>
        </Box>
      </Stack>

      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} sx={headCellSx}>{firstColumnTitle}</TableCell>
              <TableCell align="center" colSpan={2} sx={headCellSx}>{baseLabel}</TableCell>
              <TableCell align="center" colSpan={2} sx={headCellSx}>{baseLabel} PERIODO</TableCell>
              <TableCell align="center" colSpan={2} sx={headCellSx}>{baseLabel} ANUAL</TableCell>
              <TableCell align="center" colSpan={2} sx={{ ...headCellSx, background: "#dcfce7" }}>Fn({baseLabel})</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={headCellSx}>Valor</TableCell>
              <TableCell sx={headCellSx}>{baseLabel} / {comparisonLabel} %</TableCell>
              <TableCell sx={headCellSx}>Valor</TableCell>
              <TableCell sx={headCellSx}>{baseLabel} / {comparisonLabel} %</TableCell>
              <TableCell sx={headCellSx}>Valor</TableCell>
              <TableCell sx={headCellSx}>{baseLabel} / {comparisonLabel} %</TableCell>
              <TableCell sx={{ ...headCellSx, background: "#dcfce7" }}>Valor</TableCell>
              <TableCell sx={{ ...headCellSx, background: "#dcfce7" }}>Fn({baseLabel}) / Fn({comparisonLabel}) %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
                  No hay información para los filtros seleccionados.
                </TableCell>
              </TableRow>
            ) : paginatedRows.map((row, idx) => (
              <TableRow key={`${row.grupo}-${page * rowsPerPage + idx}`} hover>
                <TableCell sx={bodyMainCellSx}>
                  <Typography sx={{ fontWeight: 900, fontSize: 12.5 }}>{row.grupo}</Typography>
                  {row.descripcion && row.descripcion !== row.grupo ? (
                    <Typography sx={{ mt: 0.3, color: "text.secondary", fontSize: 11.5 }}>
                      {row.descripcion}
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell sx={bodyCellSx}>{formatNumber(row.fisicaBaseMes)}</TableCell>
                <TableCell sx={percentageCellSx(row.cumplimientoMes)}>{formatPercent(row.cumplimientoMes)}</TableCell>
                <TableCell sx={bodyCellSx}>{formatNumber(row.fisicaBasePeriodo)}</TableCell>
                <TableCell sx={percentageCellSx(row.cumplimientoPeriodo)}>{formatPercent(row.cumplimientoPeriodo)}</TableCell>
                <TableCell sx={bodyCellSx}>{formatNumber(row.fisicaBaseAnual)}</TableCell>
                <TableCell sx={percentageCellSx(row.cumplimientoAnual)}>{formatPercent(row.cumplimientoAnual)}</TableCell>
                <TableCell sx={{ ...bodyCellSx, background: "#f0fdf4" }}>{formatNumber(row.fisicaBaseFinal)}</TableCell>
                <TableCell sx={percentageCellSx(row.cumplimientoFinal, "#f0fdf4")}>{formatPercent(row.cumplimientoFinal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
        sx={{
          borderTop: "1px solid #e5e7eb",
          background: "#ffffff",
          "& .MuiTablePagination-toolbar": {
            minHeight: 52,
            px: 2,
          },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: 12.5,
            fontWeight: 700,
            color: "#475569",
          },
          "& .MuiTablePagination-select": {
            fontSize: 12.5,
            fontWeight: 800,
          },
        }}
      />
    </Paper>
  );
}


type TerritorialLineChartProps = {
  rows: DashboardPoiCumplimientoDto[];
  title: string;
  subtitle: string;
};

function TerritorialLineChart({ rows, title, subtitle }: TerritorialLineChartProps): React.ReactElement {
  const chartRows = rows;
  const width = 1200;
  const height = 320;
  const padding = { top: 30, right: 30, bottom: 72, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(100, ...chartRows.map((row) => Number(row.cumplimientoFinal ?? 0)));
  const safeMax = maxValue <= 0 ? 100 : Math.ceil(maxValue / 25) * 25;

  const points = chartRows.map((row, index) => {
    const x = padding.left + (chartRows.length <= 1 ? chartWidth / 2 : (index * chartWidth) / (chartRows.length - 1));
    const y = padding.top + chartHeight - ((Number(row.cumplimientoFinal ?? 0) / safeMax) * chartHeight);
    return { x, y, row };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: 4,
        border: "1px solid rgba(148,163,184,.26)",
        boxShadow: "0 18px 42px rgba(15,23,42,.065)",
        overflow: "hidden",
        background: "rgba(255,255,255,.96)",
        width: "100%",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pb: 1 }}>
        <QueryStatsRoundedIcon sx={{ color: "#2563eb" }} />
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{title}</Typography>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
            {subtitle}
          </Typography>
        </Box>
      </Stack>

      {!chartRows.length ? (
        <Box sx={{ px: 2, pb: 2 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No hay información territorial para graficar con los filtros seleccionados.
          </Alert>
        </Box>
      ) : (
        <Box sx={{ px: 2, pb: 2, width: "100%", overflowX: chartRows.length > 14 ? "auto" : "hidden" }}>
          <svg
            width="100%"
            height={height + 10}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={title}
          >
            {[0, 25, 50, 75, 100].map((tick) => {
              const y = padding.top + chartHeight - ((tick / safeMax) * chartHeight);
              return (
                <g key={tick}>
                  <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
                  <text x={12} y={y + 4} fontSize="13" fontWeight="700" fill="#64748b">{tick}%</text>
                </g>
              );
            })}

            <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} stroke="#cbd5e1" />
            <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} stroke="#cbd5e1" />

            <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

            {points.map((point, index) => (
              <g key={`${point.row.grupo}-${index}`}>
                <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e3a8a">
                  {formatPercent(point.row.cumplimientoFinal)}
                </text>
                <text
                  x={point.x}
                  y={height - 34}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#475569"
                  transform={`rotate(-22 ${point.x} ${height - 34})`}
                >
                  {(point.row.grupo ?? "").slice(0, 24)}
                </text>
              </g>
            ))}
          </svg>
        </Box>
      )}
    </Paper>
  );
}


const headCellSx = {
  background: "#eff6ff",
  color: "#1e3a8a",
  fontWeight: 900,
  borderColor: "#bfdbfe",
  fontSize: 12,
};

const bodyCellSx = {
  fontSize: 14.5,
  fontWeight: 400,
  borderColor: "#e5e7eb",
};

const bodyMainCellSx = {
  ...bodyCellSx,
  minWidth: 260,
};

function percentageCellSx(value: number | null | undefined, baseBackground = "#ffffff") {
  const n = Number(value ?? 0);
  const isOver100 = n > 100;

  return {
    ...bodyCellSx,
    background: isOver100 ? "#fee2e2" : baseBackground,
    color: isOver100 ? "#991b1b" : "#0f172a",
    fontWeight: isOver100 ? 500 : 400,
  };
}

export default function DashboardPoiPage(): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCombos, setLoadingCombos] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [reporteErrorMsg, setReporteErrorMsg] = useState<string>("");
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);
  const [downloadingExcelAlertas, setDownloadingExcelAlertas] = useState<boolean>(false);
  const [data, setData] = useState<DashboardPoiDto | null>(null);
  const [tablaActiva, setTablaActiva] = useState<"seguimiento" | "reprogramacion">("seguimiento");
  const [vistaTabla, setVistaTabla] = useState<"unidad" | "oeiAei">("unidad");
  const [porcentajeFinalFiltro, setPorcentajeFinalFiltro] = useState<PorcentajeFinalFiltro>("TODOS");
  const [tablaTerritorialActiva, setTablaTerritorialActiva] = useState<TablaTerritorialActiva>("ejecucion");
  const [idProvinciaTerritorial, setIdProvinciaTerritorial] = useState<string>("");
  const [idDistritoTerritorial, setIdDistritoTerritorial] = useState<string>("");
  const [tablaResumenFisicoActiva, setTablaResumenFisicoActiva] = useState<TablaResumenFisicoActiva>("mensual");
  const [tablaResumenAoActiva, setTablaResumenAoActiva] = useState<TablaResumenAoActiva>("mensual");


  const [filters, setFilters] = useState<DashboardPoiHeaderFiltersValue>({
    idPeriodo: null,
    idPoiAnio: null,
    mes: null,
    idUnidadEjecutora: null,
    nivelCumplimiento: null,
  });

  const [periodos, setPeriodos] = useState<OptionItem[]>([]);
  const [poiAnios, setPoiAnios] = useState<OptionItem[]>([]);
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<OptionItem[]>([]);

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

  async function loadUnidadesPoi(currentFilters?: DashboardPoiHeaderFiltersValue) {
    const f = currentFilters ?? filters;
    const unidades = await DashboardCatalogoAction.getUnidadesPoi(f.idPeriodo, f.idPoiAnio);
    setUnidadesEjecutoras(unidades);
  }

  async function loadData(currentFilters?: DashboardPoiHeaderFiltersValue) {
    const f = currentFilters ?? filters;

    setLoading(true);
    setErrorMsg("");

    try {
      const resp = await DashboardPoiAction.getDashboard({
        idPeriodo: f.idPeriodo ?? undefined,
        idPoiAnio: f.idPoiAnio ?? undefined,
        mes: f.mes ?? undefined,
        idUnidadEjecutora: f.idUnidadEjecutora ?? undefined,
        nivelCumplimiento: f.nivelCumplimiento ?? undefined,
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
    void loadUnidadesPoi(filters);
    void loadData(filters);
  }, [filters]);

  const tablaActual = useMemo(() => {
    if (!data) return [];

    const rows = tablaActiva === "seguimiento"
      ? (vistaTabla === "unidad"
        ? data.ejecucionFisicaPorUnidad ?? []
        : data.ejecucionFisicaPorOeiAei ?? [])
      : (vistaTabla === "unidad"
        ? data.programacionFisicaPorUnidad ?? []
        : data.programacionFisicaPorOeiAei ?? []);

    return rows.filter((row) => cumpleFiltroPorcentajeFinal(row, porcentajeFinalFiltro));
  }, [data, tablaActiva, vistaTabla, porcentajeFinalFiltro]);

  const tablaTerritorialBase = useMemo(() => {
    if (!data) return [];

    return tablaTerritorialActiva === "ejecucion"
      ? data.ejecucionFisicaPorProvinciaDistrito ?? []
      : data.programacionFisicaPorProvinciaDistrito ?? [];
  }, [data, tablaTerritorialActiva]);

  const provinciaOptions = useMemo(
    () => uniqueTerritorialOptions(tablaTerritorialBase, "idProvincia", "provincia"),
    [tablaTerritorialBase]
  );

  const distritoOptions = useMemo(() => {
    const rowsProvincia = idProvinciaTerritorial
      ? tablaTerritorialBase.filter((row) => optionKey(row.idProvincia) === idProvinciaTerritorial)
      : tablaTerritorialBase;

    return uniqueTerritorialOptions(rowsProvincia, "idDistrito", "distrito");
  }, [tablaTerritorialBase, idProvinciaTerritorial]);

  const tablaTerritorialActual = useMemo(() => {
    return tablaTerritorialBase.filter((row) => {
      const matchProvincia = !idProvinciaTerritorial || optionKey(row.idProvincia) === idProvinciaTerritorial;
      const matchDistrito = !idDistritoTerritorial || optionKey(row.idDistrito) === idDistritoTerritorial;
      return matchProvincia && matchDistrito;
    });
  }, [tablaTerritorialBase, idProvinciaTerritorial, idDistritoTerritorial]);

  const tendenciaTerritorialProvincia = useMemo(() => {
    return buildTerritorialTrendRows(tablaTerritorialActual, "provincia");
  }, [tablaTerritorialActual]);

  const tendenciaTerritorialDistrito = useMemo(() => {
    return buildTerritorialTrendRows(tablaTerritorialActual, "distrito");
  }, [tablaTerritorialActual]);

  const resumenFisicoRows = useMemo(() => {
    return data?.ejecucionFisicaPorOeiAei ?? [];
  }, [data]);

  const resumenAoRows = useMemo(() => {
    return data?.ejecucionFisicaPorAo ?? [];
  }, [data]);

  const mesSeleccionadoLabel = useMemo(() => {
    return filters.mes == null ? "" : getMesLabel(meses, filters.mes);
  }, [filters.mes, meses]);


  useEffect(() => {
    setIdProvinciaTerritorial("");
    setIdDistritoTerritorial("");
  }, [data, tablaTerritorialActiva]);

  useEffect(() => {
    setIdDistritoTerritorial("");
  }, [idProvinciaTerritorial]);


  const filtrosActivos = useMemo(() => {
    const result: Array<{ key: keyof DashboardPoiHeaderFiltersValue; label: string }> = [];

    if (filters.idPeriodo != null) {
      result.push({ key: "idPeriodo", label: `Periodo: ${getOptionLabel(periodos, filters.idPeriodo)}` });
    }

    if (filters.idPoiAnio != null) {
      result.push({ key: "idPoiAnio", label: `Año POI: ${getOptionLabel(poiAnios, filters.idPoiAnio)}` });
    }

    if (filters.mes != null) {
      result.push({ key: "mes", label: `Mes: ${getMesLabel(meses, filters.mes)}` });
    }

    if (filters.idUnidadEjecutora != null) {
      result.push({ key: "idUnidadEjecutora", label: `UE por OEI: ${getOptionLabel(unidadesEjecutoras, filters.idUnidadEjecutora)}` });
    }

    return result;
  }, [filters, periodos, poiAnios, meses, unidadesEjecutoras]);

  const quitarFiltro = (key: keyof DashboardPoiHeaderFiltersValue) => {
    setReporteErrorMsg("");
    setFilters((prev) => ({ ...prev, [key]: null }));
  };

  const limpiarFiltros = () => {
    setReporteErrorMsg("");
    setPorcentajeFinalFiltro("TODOS");
    setIdProvinciaTerritorial("");
    setIdDistritoTerritorial("");
    setFilters({
      idPeriodo: null,
      idPoiAnio: null,
      mes: null,
      idUnidadEjecutora: null,
      nivelCumplimiento: null,
    });
  };

  const buildReporteFiltros = () => ({
    idPeriodo: filters.idPeriodo ?? undefined,
    idPoiAnio: filters.idPoiAnio ?? undefined,
    mes: filters.mes ?? undefined,
    idUnidadEjecutora: filters.idUnidadEjecutora ?? undefined,
  });

  const abrirReportePoiWeb = () => {
    if (filters.idPeriodo == null) {
      setReporteErrorMsg("Debe seleccionar un Periodo POI para generar el reporte WEB. No se permite generar el reporte con la opción Todos.");
      return;
    }

    if (filters.idPoiAnio == null) {
      setReporteErrorMsg("Debe seleccionar un Año POI para generar el reporte WEB. El reporte POI es anual y no se debe generar con la opción Todos.");
      return;
    }

    setReporteErrorMsg("");
    const qp = new URLSearchParams();
    if (filters.idPeriodo != null) qp.append("idPeriodo", String(filters.idPeriodo));
    if (filters.idPoiAnio != null) qp.append("idPoiAnio", String(filters.idPoiAnio));
    if (filters.mes != null) qp.append("mes", String(filters.mes));
    if (filters.idUnidadEjecutora != null) qp.append("idUnidadEjecutora", String(filters.idUnidadEjecutora));

    const url = qp.toString() ? `/dashboard/poi/reporte?${qp.toString()}` : "/dashboard/poi/reporte";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const descargarReporteExcelPoi = async () => {
    if (filters.idPeriodo == null) {
      setReporteErrorMsg("Debe seleccionar un Periodo POI para descargar el reporte Excel. No se permite generar el reporte con la opción Todos.");
      return;
    }

    if (filters.idPoiAnio == null) {
      setReporteErrorMsg("Debe seleccionar un Año POI para descargar el reporte Excel. El reporte POI es anual y no se debe generar con la opción Todos.");
      return;
    }

    setDownloadingExcel(true);
    setReporteErrorMsg("");

    try {
      await DashboardPoiAction.descargarReporteExcel(buildReporteFiltros());
    } catch (error) {
      setReporteErrorMsg(error instanceof Error ? error.message : "No se pudo descargar el reporte Excel POI.");
    } finally {
      setDownloadingExcel(false);
    }
  };


  const descargarReporteExcelAlertasPoi = async () => {
    if (filters.idPeriodo == null) {
      setReporteErrorMsg("Debe seleccionar un Periodo POI para descargar el Reporte Excel 2. No se permite generar el reporte con la opción Todos.");
      return;
    }

    if (filters.idPoiAnio == null) {
      setReporteErrorMsg("Debe seleccionar un Año POI para descargar el Reporte Excel 2. El reporte POI es anual y no se debe generar con la opción Todos.");
      return;
    }

    setDownloadingExcelAlertas(true);
    setReporteErrorMsg("");

    try {
      await DashboardPoiAction.descargarReporteExcelAlertas(buildReporteFiltros());
    } catch (error) {
      setReporteErrorMsg(error instanceof Error ? error.message : "No se pudo descargar el Reporte Excel 2 POI.");
    } finally {
      setDownloadingExcelAlertas(false);
    }
  };

  const descargarReportePdfPoi = async () => {
    if (filters.idPeriodo == null) {
      setReporteErrorMsg("Debe seleccionar un Periodo POI para generar el reporte PDF. No se permite generar el reporte con la opción Todos.");
      return;
    }

    if (filters.idPoiAnio == null) {
      setReporteErrorMsg("Debe seleccionar un Año POI para generar el reporte PDF. El reporte POI es anual y no se debe generar con la opción Todos.");
      return;
    }

    setReporteErrorMsg("");

    try {
      await DashboardPoiAction.descargarReportePdf(buildReporteFiltros());
    } catch (error) {
      setReporteErrorMsg(error instanceof Error ? error.message : "No se pudo generar el reporte PDF POI.");
    }
  };


  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 2, md: 3 },
        background:
          "radial-gradient(circle at top left, rgba(59,130,246,.10), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #ffffff 72%)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.8, md: 2.2 },
          mb: 2,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.26)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,.98) 0%, rgba(239,246,255,.82) 100%)",
          boxShadow: "0 18px 42px rgba(15,23,42,.07)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",
                display: "grid",
                placeItems: "center",
                color: "#2563eb",
                background: "linear-gradient(135deg, rgba(219,234,254,.95), rgba(239,246,255,.95))",
                border: "1px solid rgba(59,130,246,.28)",
                boxShadow: "0 10px 24px rgba(37,99,235,.10)",
              }}
            >
              <ApartmentRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-.03em", lineHeight: 1.05 }}>
                Dashboard P.O.I.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35, fontWeight: 600 }}>
                Ejecución física, programación física y cumplimiento de metas.
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={() => void loadData(filters)}
            title="Refrescar"
            sx={{
              borderRadius: 2.5,
              border: "1px solid rgba(148,163,184,.30)",
              bgcolor: "rgba(255,255,255,.90)",
              boxShadow: "0 8px 18px rgba(15,23,42,.06)",
              "&:hover": { bgcolor: "#eff6ff", borderColor: "#93c5fd" },
            }}
          >
            <RefreshRoundedIcon />
          </IconButton>
        </Stack>
      </Paper>

      <DashboardPoiHeaderFilters
        value={filters}
        periodos={periodos}
        poiAnios={poiAnios}
        meses={meses}
        unidadesEjecutoras={unidadesEjecutoras}
        onChange={(value) => {
          setReporteErrorMsg("");
          setFilters(value);
        }}
      />

      {reporteErrorMsg ? (
        <Alert severity="warning" sx={{ mt: 1.2, borderRadius: 3 }}>
          {reporteErrorMsg}
        </Alert>
      ) : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={1.2}
        sx={{ mt: 1.3, mb: 2.2 }}
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
                  bgcolor: "rgba(239,246,255,.85)",
                  borderColor: "rgba(59,130,246,.28)",
                }}
              />
            ))
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PictureAsPdfRoundedIcon />}
            onClick={() => void descargarReportePdfPoi()}
            sx={{ borderRadius: 2.5, fontWeight: 950, whiteSpace: "nowrap", bgcolor: "rgba(255,255,255,.88)" }}
          >
            Generar reporte PDF
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<PreviewRoundedIcon />}
            onClick={abrirReportePoiWeb}
            sx={{ borderRadius: 2.5, fontWeight: 950, whiteSpace: "nowrap", bgcolor: "rgba(255,255,255,.88)" }}
          >
            Ver reporte WEB
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<TableChartRoundedIcon />}
            onClick={() => void descargarReporteExcelPoi()}
            disabled={downloadingExcel}
            sx={{ borderRadius: 2.5, fontWeight: 950, whiteSpace: "nowrap", bgcolor: "rgba(255,255,255,.88)" }}
          >
            {downloadingExcel ? "Generando Excel..." : "Descargar Excel"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="warning"
            startIcon={<TableChartRoundedIcon />}
            onClick={() => void descargarReporteExcelAlertasPoi()}
            disabled={downloadingExcelAlertas}
            sx={{
              borderRadius: 2.5,
              fontWeight: 950,
              whiteSpace: "nowrap",
              bgcolor: "rgba(255,251,235,.92)",
              borderColor: "#f59e0b",
              color: "#92400e",
              boxShadow: "0 10px 22px rgba(245,158,11,.12)",
              "&:hover": {
                bgcolor: "rgba(254,243,199,.95)",
                borderColor: "#d97706",
                boxShadow: "0 14px 28px rgba(245,158,11,.18)",
              },
            }}
          >
            {downloadingExcelAlertas ? "Generando Excel 2..." : "Reporte Excel 2"}
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterAltOffRoundedIcon />}
            onClick={limpiarFiltros}
            disabled={filtrosActivos.length === 0 && porcentajeFinalFiltro === "TODOS" && !idProvinciaTerritorial && !idDistritoTerritorial}
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
          <Grid
            container
            spacing={2.2}
            sx={{
              mt: 0.5,
              mb: 7, // Ajuste de separación: aumenta/disminuye este valor para separar los KPI del bloque de botones/filtros.
            }}
          >
            <Grid item xs={12} md={4}>
              <GaugeCard
                title="Ejecución física mensual POI"
                value={data.kpis.ejecucionFisicaMensual}
                subtitle="Mes seleccionado"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GaugeCard
                title="Ejecución física periodo POI"
                value={data.kpis.ejecucionFisicaPeriodo}
                subtitle="Hasta el mes seleccionado"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <GaugeCard
                title="Avance físico anual POI"
                value={data.kpis.avanceFisicoAnual}
                subtitle="Acumulado anual"
              />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              mt: 2.2,
              p: 2,
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,.26)",
              boxShadow: "0 18px 42px rgba(15,23,42,.06)",
              background: "rgba(255,255,255,.96)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {tablaActiva === "seguimiento" ? <FactCheckRoundedIcon sx={{ color: "#2563eb" }} /> : <TuneRoundedIcon sx={{ color: "#7c3aed" }} />}
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>
                    {tablaActiva === "seguimiento" ? "Ejecución física (Seguimiento)" : "Programación física (Reprogramación)"}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                    Seleccione la tabla y el nivel de agrupación a visualizar.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <ButtonGroup variant="outlined" size="small">
                  <Button
                    variant={tablaActiva === "seguimiento" ? "contained" : "outlined"}
                    onClick={() => setTablaActiva("seguimiento")}
                  >
                    Seguimiento
                  </Button>
                  <Button
                    variant={tablaActiva === "reprogramacion" ? "contained" : "outlined"}
                    onClick={() => setTablaActiva("reprogramacion")}
                  >
                    Reprogramación
                  </Button>
                </ButtonGroup>

                <ButtonGroup variant="outlined" size="small">
                  <Button
                    variant={vistaTabla === "unidad" ? "contained" : "outlined"}
                    onClick={() => setVistaTabla("unidad")}
                  >
                    UE
                  </Button>
                  <Button
                    variant={vistaTabla === "oeiAei" ? "contained" : "outlined"}
                    onClick={() => setVistaTabla("oeiAei")}
                  >
                    OEI / AEI
                  </Button>
                </ButtonGroup>

                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel id="dashboard-poi-porcentaje-final-label">Porcentaje final</InputLabel>
                  <Select
                    labelId="dashboard-poi-porcentaje-final-label"
                    value={porcentajeFinalFiltro}
                    label="Porcentaje final"
                    onChange={(event) =>
                      setPorcentajeFinalFiltro(event.target.value as PorcentajeFinalFiltro)
                    }
                    sx={{
                      background: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 800,
                      "& .MuiSelect-select": { py: 0.75 },
                    }}
                  >
                    {porcentajeFinalOptions.map((item) => (
                      <MenuItem key={item.value} value={item.value}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Paper>

          <TablaPoiCumplimiento
            title={tablaActiva === "seguimiento"
              ? "Nivel de cumplimiento de ejecución física por UE y OEI-AEI"
              : "Nivel de cumplimiento de programación física por UE y OEI-AEI"}
            rows={tablaActual}
            baseLabel={tablaActiva === "seguimiento" ? "F(SE)" : "F(RE)"}
            comparisonLabel={tablaActiva === "seguimiento" ? "F(RE)" : "F(A)"}
            firstColumnTitle={vistaTabla === "unidad" ? "Unidad Ejecutora" : "OEI / AEI cascada"}
          />

          <Paper
            elevation={0}
            sx={{
              mt: 2.2,
              p: 2,
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,.26)",
              boxShadow: "0 18px 42px rgba(15,23,42,.06)",
              background: "rgba(255,255,255,.96)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {tablaTerritorialActiva === "ejecucion" ? (
                  <FactCheckRoundedIcon sx={{ color: "#2563eb" }} />
                ) : (
                  <TuneRoundedIcon sx={{ color: "#7c3aed" }} />
                )}
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>
                    {tablaTerritorialActiva === "ejecucion"
                      ? "Ejecución física por Provincia / Distrito"
                      : "Programación física por Provincia / Distrito"}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                    Filtre por la ubicación registrada en la Actividad Operativa.
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <ButtonGroup variant="outlined" size="small">
                  <Button
                    variant={tablaTerritorialActiva === "ejecucion" ? "contained" : "outlined"}
                    onClick={() => setTablaTerritorialActiva("ejecucion")}
                  >
                    Ejecución
                  </Button>
                  <Button
                    variant={tablaTerritorialActiva === "programacion" ? "contained" : "outlined"}
                    onClick={() => setTablaTerritorialActiva("programacion")}
                  >
                    Programación
                  </Button>
                </ButtonGroup>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="dashboard-poi-provincia-label">Provincia</InputLabel>
                  <Select
                    labelId="dashboard-poi-provincia-label"
                    value={idProvinciaTerritorial}
                    label="Provincia"
                    onChange={(event) => setIdProvinciaTerritorial(String(event.target.value))}
                    sx={{
                      background: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 800,
                      "& .MuiSelect-select": { py: 0.75 },
                    }}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {provinciaOptions.map((item) => (
                      <MenuItem key={String(item.value)} value={String(item.value)}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="dashboard-poi-distrito-label">Distrito</InputLabel>
                  <Select
                    labelId="dashboard-poi-distrito-label"
                    value={idDistritoTerritorial}
                    label="Distrito"
                    onChange={(event) => setIdDistritoTerritorial(String(event.target.value))}
                    sx={{
                      background: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 800,
                      "& .MuiSelect-select": { py: 0.75 },
                    }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {distritoOptions.map((item) => (
                      <MenuItem key={String(item.value)} value={String(item.value)}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Paper>

          <TablaPoiCumplimiento
            title={tablaTerritorialActiva === "ejecucion"
              ? "Nivel de cumplimiento de ejecución física por Provincia / Distrito"
              : "Nivel de cumplimiento de programación física por Provincia / Distrito"}
            rows={tablaTerritorialActual}
            baseLabel={tablaTerritorialActiva === "ejecucion" ? "F(SE)" : "F(RE)"}
            comparisonLabel={tablaTerritorialActiva === "ejecucion" ? "F(RE)" : "F(A)"}
            firstColumnTitle="OEI / AEI cascada"
          />

          <TerritorialLineChart
            rows={tendenciaTerritorialProvincia}
            title={tablaTerritorialActiva === "ejecucion"
              ? "Tendencia territorial de ejecución física final POR PROVINCIA"
              : "Tendencia territorial de programación física final POR PROVINCIA"}
            subtitle="Línea del porcentaje final agrupado por provincia, usando la ubicación registrada en la Actividad Operativa."
          />

          <TerritorialLineChart
            rows={tendenciaTerritorialDistrito}
            title={tablaTerritorialActiva === "ejecucion"
              ? "Tendencia territorial de ejecución física final POR DISTRITO"
              : "Tendencia territorial de programación física final POR DISTRITO"}
            subtitle="Línea del porcentaje final agrupado por distrito, usando la ubicación registrada en la Actividad Operativa."
          />

          <Paper
            elevation={0}
            sx={{
              mt: 2.2,
              p: 2,
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,.26)",
              boxShadow: "0 18px 42px rgba(15,23,42,.06)",
              background: "rgba(255,255,255,.96)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <FactCheckRoundedIcon sx={{ color: "#2563eb" }} />
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>
                    Ejecución física mensual / periodo / anual por OEI-AEI
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                    Seleccione la tabla de resumen físico que desea visualizar.
                  </Typography>
                </Box>
              </Stack>

              <ButtonGroup variant="outlined" size="small">
                <Button
                  variant={tablaResumenFisicoActiva === "mensual" ? "contained" : "outlined"}
                  onClick={() => setTablaResumenFisicoActiva("mensual")}
                >
                  Mensual
                </Button>
                <Button
                  variant={tablaResumenFisicoActiva === "periodo" ? "contained" : "outlined"}
                  onClick={() => setTablaResumenFisicoActiva("periodo")}
                >
                  Periodo
                </Button>
                <Button
                  variant={tablaResumenFisicoActiva === "anual" ? "contained" : "outlined"}
                  onClick={() => setTablaResumenFisicoActiva("anual")}
                >
                  Anual
                </Button>
              </ButtonGroup>
            </Stack>
          </Paper>

          <TablaResumenFisicoOeiAei
            modo={tablaResumenFisicoActiva}
            rows={resumenFisicoRows}
            mesLabel={mesSeleccionadoLabel}
          />

          <Paper
            elevation={0}
            sx={{
              mt: 2.2,
              p: 2,
              borderRadius: 4,
              border: "1px solid rgba(148,163,184,.26)",
              boxShadow: "0 18px 42px rgba(15,23,42,.06)",
              background: "rgba(255,255,255,.96)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <QueryStatsRoundedIcon sx={{ color: "#2563eb" }} />
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>
                    Nivel de ejecución física mensual / periodo / anual según AO
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                    Seleccione la tabla de ejecución física por Actividad Operativa.
                  </Typography>
                </Box>
              </Stack>

              <ButtonGroup variant="outlined" size="small">
                <Button
                  variant={tablaResumenAoActiva === "mensual" ? "contained" : "outlined"}
                  onClick={() => setTablaResumenAoActiva("mensual")}
                >
                  Mensual
                </Button>
                <Button
                  variant={tablaResumenAoActiva === "periodo" ? "contained" : "outlined"}
                  onClick={() => setTablaResumenAoActiva("periodo")}
                >
                  Periodo
                </Button>
                <Button
                  variant={tablaResumenAoActiva === "anual" ? "contained" : "outlined"}
                  onClick={() => setTablaResumenAoActiva("anual")}
                >
                  Anual
                </Button>
              </ButtonGroup>
            </Stack>
          </Paper>

          <TablaResumenFisicoAo
            modo={tablaResumenAoActiva}
            rows={resumenAoRows}
            mesLabel={mesSeleccionadoLabel}
          />
        </>
      ) : null}
    </Box>
  );
}
