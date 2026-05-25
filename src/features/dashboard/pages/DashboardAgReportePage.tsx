import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";

import DashboardAgAction, {
  type DashboardAgFiltros,
  type DashboardAgReporteDto,
  type DashboardAgReporteDimensionDto,
} from "../DashboardAgAction";

function parseNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function formatPercent(value?: number | null): string {
  const n = Number(value ?? 0);
  return `${Number.isFinite(n) ? n.toFixed(2) : "0.00"}%`;
}

function formatNumber(value?: number | null): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "medium" }).format(d);
}

function nivelSx(nivel?: string | null) {
  const n = (nivel ?? "").toUpperCase();
  if (n === "ALTO") return { bgcolor: "#dcfce7", color: "#166534", borderColor: "#86efac" };
  if (n === "MEDIO") return { bgcolor: "#fef3c7", color: "#92400e", borderColor: "#fcd34d" };
  return { bgcolor: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" };
}

function ReporteDimension({ dimension }: { dimension: DashboardAgReporteDimensionDto }) {
  return (
    <Box sx={{ mt: 3, pageBreakBefore: "always" }}>
      <Typography sx={{ fontSize: 16, fontWeight: 900, mb: 1 }}>DIMENSIÓN {dimension.dimension}</Typography>
      {dimension.indicadores.map((row, idx) => (
        <Box key={`${row.idAgPoRecoInpr}-${row.idIndicadorNombre}-${row.anioProyeccion ?? idx}`} sx={{ mb: 1.2 }}>
          {idx === 0 || row.politica !== dimension.indicadores[idx - 1]?.politica ? (
            <Typography sx={{ fontWeight: 900, bgcolor: "#eaf3ff", border: "1px solid #bfdbfe", p: 0.7, mb: 0.5 }}>
              {row.politica}
            </Typography>
          ) : null}
          <Table size="small" sx={{ tableLayout: "fixed", borderCollapse: "collapse" }}>
            <TableHead>
              <TableRow>
                <TableCell>Ítem</TableCell>
                <TableCell>Resultado Concertado</TableCell>
                <TableCell>Intervención Prioritaria</TableCell>
                <TableCell>Indicador</TableCell>
                <TableCell>Año</TableCell>
                <TableCell>Meta</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Logro</TableCell>
                <TableCell>Nivel</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{row.codigoIndicador}</TableCell>
                <TableCell>{row.codigoResultado} - {row.resultadoConcertado}</TableCell>
                <TableCell>{row.codigoIntervencion} - {row.intervencionPrioritaria}</TableCell>
                <TableCell>{row.nombreIndicador}</TableCell>
                <TableCell>{row.anioProyeccion ?? "—"}</TableCell>
                <TableCell align="right">{formatNumber(row.metaProyectada)}</TableCell>
                <TableCell align="right">{formatNumber(row.valorIndicador)}</TableCell>
                <TableCell align="right">{formatPercent(row.logroEsperadoPorcentaje)}</TableCell>
                <TableCell><Chip size="small" label={row.nivelAvance} sx={{ ...nivelSx(row.nivelAvance), fontWeight: 900 }} /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      ))}
    </Box>
  );
}

export default function DashboardAgReportePage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<DashboardAgReporteDto | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const filtros: DashboardAgFiltros = useMemo(() => ({
    idPeriodo: parseNumber(searchParams.get("idPeriodo")),
    idAnioProyeccion: parseNumber(searchParams.get("idAnioProyeccion")),
    idDimension: parseNumber(searchParams.get("idDimension")),
    idUnidad: parseNumber(searchParams.get("idUnidad")),
    idPolitica: parseNumber(searchParams.get("idPolitica")),
    nivelAvance: searchParams.get("nivelAvance") || undefined,
  }), [searchParams]);

  useEffect(() => {
    let active = true;
    async function loadReporte() {
      if (filtros.idPeriodo == null) {
        setLoading(false);
        setData(null);
        setErrorMsg("Para generar el reporte AG debe seleccionar un Periodo AG. No se permite generar el reporte con la opción Todos.");
        return;
      }
      setLoading(true);
      setErrorMsg("");
      try {
        const resp = await DashboardAgAction.getReporte(filtros);
        if (active) setData(resp);
      } catch (error) {
        if (active) {
          setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el reporte AG.");
          setData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadReporte();
    return () => { active = false; };
  }, [filtros]);

  async function descargarPdf() {
    setDownloadingPdf(true);
    setErrorMsg("");
    try { await DashboardAgAction.descargarReportePdf(filtros); }
    catch (error) { setErrorMsg(error instanceof Error ? error.message : "No se pudo generar el PDF AG."); }
    finally { setDownloadingPdf(false); }
  }

  async function descargarExcel() {
    setDownloadingExcel(true);
    setErrorMsg("");
    try { await DashboardAgAction.descargarReporteExcel(filtros); }
    catch (error) { setErrorMsg(error instanceof Error ? error.message : "No se pudo generar el Excel AG."); }
    finally { setDownloadingExcel(false); }
  }

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: "#f8fafc",
        height: "100vh",
        maxHeight: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        pb: 8,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(-1)}>Volver</Button>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="success" startIcon={<TableChartRoundedIcon />} onClick={descargarExcel} disabled={downloadingExcel || downloadingPdf}>
            {downloadingExcel ? "Descargando..." : "Descargar Excel"}
          </Button>
          <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={descargarPdf} disabled={downloadingPdf || downloadingExcel}>
            {downloadingPdf ? "Generando..." : "Descargar PDF A4 horizontal"}
          </Button>
        </Stack>
      </Stack>

      {loading ? <Stack direction="row" spacing={1.5} alignItems="center"><CircularProgress size={22} /><Typography>Cargando reporte AG...</Typography></Stack> : null}
      {errorMsg ? <Alert severity="warning" sx={{ mb: 2 }}>{errorMsg}</Alert> : null}

      {!loading && !errorMsg && data ? (
        <Paper sx={{ p: 2, borderRadius: 2, overflowX: "auto", overflowY: "visible", mb: 8 }}>
          <Typography align="center" sx={{ fontSize: 18, fontWeight: 900, mb: 1 }}>{data.titulo}</Typography>
          <Typography align="center" sx={{ fontWeight: 800, mb: 1 }}>
            Acuerdo de Gobernabilidad {data.periodoAg} · {data.anioReporte ? `Año ${data.anioReporte}` : "Consolidado"}
          </Typography>
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Chip size="small" label={`Dimensión: ${data.dimensionFiltro || "Todas"}`} />
            <Chip size="small" label={`Unidad: ${data.unidadFiltro || "Todas"}`} />
            <Chip size="small" label={`Política: ${data.politicaFiltro || "Todas"}`} />
            <Chip size="small" label={`Nivel: ${data.nivelAvanceLabel || "Todos"}`} />
            <Chip size="small" label={`Generado: ${formatDateTime(data.fechaGeneracion)}`} />
          </Stack>

          <Typography sx={{ fontWeight: 900, mb: 1 }}>Resumen final</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Dimensión</TableCell>
                  <TableCell align="right">Indicadores priorizados</TableCell>
                  <TableCell align="right">Porcentaje de cumplimiento</TableCell>
                  <TableCell>Nivel de avance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.resumenFinal.map((row) => (
                  <TableRow key={row.idDimension}>
                    <TableCell>{row.dimension}</TableCell>
                    <TableCell align="right">{row.indicadoresPriorizados}</TableCell>
                    <TableCell align="right">{formatPercent(row.porcentajeCumplimiento)}</TableCell>
                    <TableCell><Chip size="small" label={row.nivelAvance} sx={{ ...nivelSx(row.nivelAvance), fontWeight: 900 }} /></TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "#e5e7eb" }}>
                  <TableCell sx={{ fontWeight: 900 }}>{data.totalFinal.dimension}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>{data.totalFinal.indicadoresPriorizados}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>{formatPercent(data.totalFinal.porcentajeCumplimiento)}</TableCell>
                  <TableCell><Chip size="small" label={data.totalFinal.nivelAvance} sx={{ ...nivelSx(data.totalFinal.nivelAvance), fontWeight: 900 }} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {data.dimensiones.map((dimension) => <ReporteDimension key={dimension.idDimension} dimension={dimension} />)}
        </Paper>
      ) : null}
    </Box>
  );
}
