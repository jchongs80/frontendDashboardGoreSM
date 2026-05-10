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

import DashboardPrcpAction, {
  type DashboardPrcpReporteDto,
  type DashboardPrcpReporteFilaDto,
} from "../DashboardPrcpAction";

function parseNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function formatNumber(value?: number | null): string {
  if (value == null || !Number.isFinite(Number(value))) return "0.00";
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(d);
}

function getAvanceCellSx(value?: number | null) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 100) return undefined;

  return {
    bgcolor: "rgba(34, 197, 94, 0.14)",
    color: "rgb(21, 128, 61)",
    fontWeight: 900,
  };
}

function getValorAnual(row: DashboardPrcpReporteFilaDto, anio: number) {
  return row.valoresPorAnio?.find((x) => Number(x.anio) === Number(anio));
}

export default function DashboardPrcpReportePage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardPrcpReporteDto | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);

  const filtros = useMemo(
    () => ({
      idPeriodo: parseNumber(searchParams.get("idPeriodo")),
      idAnioProyeccion: parseNumber(searchParams.get("idAnioProyeccion")),
      idObjetivoPrioritario: parseNumber(searchParams.get("idObjetivoPrioritario")),
    }),
    [searchParams]
  );

  useEffect(() => {
    let active = true;

    async function loadReporte() {
      if (filtros.idPeriodo == null) {
        setLoading(false);
        setData(null);
        setErrorMsg("Para generar el reporte PDF debe seleccionar un Periodo PRCP. No se permite generar el reporte con la opción Todos.");
        return;
      }

      setLoading(true);
      setErrorMsg("");

      try {
        const resp = await DashboardPrcpAction.getReporte(filtros);
        if (active) setData(resp);
      } catch (error) {
        if (active) {
          setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el reporte PRCP.");
          setData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadReporte();

    return () => {
      active = false;
    };
  }, [filtros]);

  const aniosLogro = data?.aniosLogroEsperado ?? [];
  const aniosEjecutado = data?.aniosEjecutado?.length ? data.aniosEjecutado : aniosLogro;
  const totalCols = 13 + Math.max(1, aniosLogro.length) + Math.max(1, aniosEjecutado.length) * 2;

  async function descargarPdfBackend() {
    setDownloadingPdf(true);
    setErrorMsg("");

    try {
      await DashboardPrcpAction.descargarReportePdf(filtros);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo generar el PDF del reporte PRCP.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function descargarExcelBackend() {
    setDownloadingExcel(true);
    setErrorMsg("");

    try {
      await DashboardPrcpAction.descargarReporteExcel(filtros);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo generar el Excel del reporte PRCP.");
    } finally {
      setDownloadingExcel(false);
    }
  }

  return (
    <Box
      className="reporte-page"
      sx={{
        p: 2.5,
        bgcolor: "#f8fafc",
        height: "100vh",
        maxHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        overflow: "auto",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @page { size: A4 landscape; margin: 5mm; }
        @media print {
          html, body, #root { margin: 0 !important; width: 100% !important; height: auto !important; overflow: visible !important; background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print, .MuiDrawer-root, header, nav, aside, footer { display: none !important; }
          .reporte-page { padding: 0 !important; background: white !important; height: auto !important; max-height: none !important; overflow: visible !important; }
          .reporte-paper { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; width: 100% !important; }
          .reporte-table-container { overflow: visible !important; max-width: none !important; }
          .reporte-table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; page-break-inside: auto; }
          .reporte-table thead { display: table-header-group; }
          .reporte-table tr { page-break-inside: avoid; break-inside: avoid; }
          .reporte-table th, .reporte-table td { font-size: 5.1px !important; line-height: 1.15 !important; padding: 1.5px 2px !important; }
          .reporte-title { font-size: 11px !important; }
          .reporte-meta p, .reporte-meta span { font-size: 7px !important; }
        }
        .reporte-table { border-collapse: collapse; width: 100%; table-layout: fixed; }
        .reporte-table th { background: #f3f4f6; font-weight: 800; text-align: center; border: 1px solid #9ca3af; }
        .reporte-table td { border: 1px solid #cbd5e1; vertical-align: top; }
        .reporte-table .op-row td { background: #f5f3ff; font-weight: 900; }
        .col-codigo { width: 62px; }
        .col-denominacion { width: 180px; }
        .col-hito { width: 150px; }
        .col-corta { width: 72px; }
        .col-num { width: 54px; text-align: center; }
      `}</style>

      <Stack className="no-print" direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} variant="outlined" onClick={() => navigate(-1)} sx={{ borderRadius: 2, fontWeight: 900 }}>
          Volver
        </Button>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<TableChartRoundedIcon />} variant="outlined" color="success" onClick={() => void descargarExcelBackend()} disabled={!data || loading || downloadingExcel} sx={{ borderRadius: 2, fontWeight: 900 }}>
            {downloadingExcel ? "Generando Excel..." : "Descargar Excel"}
          </Button>
          <Button startIcon={<PrintRoundedIcon />} variant="contained" onClick={() => void descargarPdfBackend()} disabled={!data || loading || downloadingPdf} sx={{ borderRadius: 2, fontWeight: 900 }}>
            {downloadingPdf ? "Generando PDF..." : "Descargar PDF"}
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
          <CircularProgress size={22} />
          <Typography>Cargando reporte PRCP...</Typography>
        </Stack>
      ) : null}

      {!loading && errorMsg ? <Alert severity="warning" sx={{ borderRadius: 2 }}>{errorMsg}</Alert> : null}

      {!loading && data ? (
        <Paper className="reporte-paper" elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "white" }}>
          <Typography className="reporte-title" sx={{ textAlign: "center", fontSize: 15, fontWeight: 900, textTransform: "uppercase" }}>
            {data.titulo || "Reporte de Seguimiento PRCP"}
          </Typography>

          <Stack className="reporte-meta" direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center" sx={{ mt: 1, mb: 1.5 }}>
            <Chip size="small" label={`Periodo: ${data.periodoPrcp || "—"}`} />
            <Chip size="small" label={`Objetivo prioritario: ${data.objetivoPrioritarioFiltro || "Todos"}`} />
            <Chip size="small" label={`Unidad conductora: ${data.unidadConductoraFiltro || "—"}`} />
            <Chip size="small" label={`Año reporte: ${data.anioReporte ?? "—"}`} />
            <Chip size="small" label={`Fecha: ${formatDateTime(data.fechaGeneracion)}`} />
          </Stack>

          <TableContainer className="reporte-table-container" sx={{ overflowX: "auto" }}>
            <Table size="small" className="reporte-table">
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={3} className="col-codigo">OP</TableCell>
                  <TableCell rowSpan={3} className="col-denominacion">Objetivo Prioritario</TableCell>
                  <TableCell rowSpan={3} className="col-codigo">MP</TableCell>
                  <TableCell rowSpan={3} className="col-denominacion">Medida Política</TableCell>
                  <TableCell rowSpan={3} className="col-corta">Responsable MP</TableCell>
                  <TableCell colSpan={3}>Hitos de Implementación</TableCell>
                  <TableCell rowSpan={3} className="col-codigo">Código Indicador</TableCell>
                  <TableCell rowSpan={3} className="col-denominacion">Indicador</TableCell>
                  <TableCell rowSpan={3} className="col-corta">Unidad de medida</TableCell>
                  <TableCell rowSpan={3} className="col-corta">Sentido</TableCell>
                  <TableCell colSpan={aniosLogro.length || 1}>Logro Esperado</TableCell>
                  <TableCell colSpan={aniosEjecutado.length || 1}>Valores Obtenidos</TableCell>
                  <TableCell colSpan={aniosEjecutado.length || 1}>Avance (%)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell rowSpan={2} className="col-hito">Hasta Julio 2025</TableCell>
                  <TableCell rowSpan={2} className="col-hito">Hasta Julio 2028</TableCell>
                  <TableCell rowSpan={2} className="col-hito">Hasta Julio 2030</TableCell>
                  {aniosLogro.length > 0 ? aniosLogro.map((anio) => <TableCell key={`le-${anio}`} rowSpan={2} className="col-num">{anio}</TableCell>) : <TableCell rowSpan={2} className="col-num">0.00</TableCell>}
                  {aniosEjecutado.length > 0 ? aniosEjecutado.map((anio) => <TableCell key={`vo-${anio}`} rowSpan={2} className="col-num">{anio}</TableCell>) : <TableCell rowSpan={2} className="col-num">0.00</TableCell>}
                  {aniosEjecutado.length > 0 ? aniosEjecutado.map((anio) => <TableCell key={`av-${anio}`} rowSpan={2} className="col-num">{anio}</TableCell>) : <TableCell rowSpan={2} className="col-num">0.00</TableCell>}
                </TableRow>
                <TableRow />
              </TableHead>
              <TableBody>
                {data.filas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={totalCols}>No se encontraron registros.</TableCell>
                  </TableRow>
                ) : null}

                {data.filas.map((row) => (
                  <TableRow key={`${row.idPrcpOpPiMp}-${row.idIndicadorNombre}`}>
                    <TableCell>{row.codigoOp}</TableCell>
                    <TableCell>{row.descripcionOp}</TableCell>
                    <TableCell>{row.codigoMp}</TableCell>
                    <TableCell>{row.descripcionMp}</TableCell>
                    <TableCell>{row.responsableMp || ""}</TableCell>
                    <TableCell>{row.hitoJulio2025 || ""}</TableCell>
                    <TableCell>{row.hitoJulio2028 || ""}</TableCell>
                    <TableCell>{row.hitoJulio2030 || ""}</TableCell>
                    <TableCell>{row.codigoIndicador}</TableCell>
                    <TableCell>{row.nombreIndicador}</TableCell>
                    <TableCell>{row.unidadMedida || ""}</TableCell>
                    <TableCell>{row.sentido || ""}</TableCell>
                    {aniosLogro.length > 0 ? aniosLogro.map((anio) => {
                      const logro = row.logrosEsperados?.find((x) => Number(x.anio) === Number(anio));
                      return <TableCell key={anio} className="col-num">{formatNumber(logro?.valor)}</TableCell>;
                    }) : <TableCell className="col-num">0.00</TableCell>}
                    {aniosEjecutado.length > 0 ? aniosEjecutado.map((anio) => {
                      const valor = getValorAnual(row, anio);
                      return <TableCell key={`${anio}-vo`} className="col-num">{formatNumber(valor?.valorObtenidoAnual)}</TableCell>;
                    }) : <TableCell className="col-num">0.00</TableCell>}
                    {aniosEjecutado.length > 0 ? aniosEjecutado.map((anio) => {
                      const valor = getValorAnual(row, anio);
                      return <TableCell key={`${anio}-av`} className="col-num" sx={getAvanceCellSx(valor?.avanceAnual)}>{formatNumber(valor?.avanceAnual)}</TableCell>;
                    }) : <TableCell className="col-num">0.00</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 1.5, width: 520, maxWidth: "100%" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>Tabla Resumen: Semaforización por nivel de avance</Typography>
            <Typography sx={{ fontSize: 11 }}>Año: {data.anioReporte ?? "—"}</Typography>
            <Table size="small" className="reporte-table">
              <TableHead>
                <TableRow>
                  <TableCell>Categoría</TableCell>
                  <TableCell>[0%-75%&gt;</TableCell>
                  <TableCell>[75%-95%&gt;</TableCell>
                  <TableCell>≥95%</TableCell>
                  <TableCell>0.00</TableCell>
                  <TableCell>TOTAL</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.resumen.map((item) => (
                  <TableRow key={item.categoria}>
                    <TableCell>{item.categoria}</TableCell>
                    <TableCell>{item.rojo}</TableCell>
                    <TableCell>{item.amarillo}</TableCell>
                    <TableCell>{item.verde}</TableCell>
                    <TableCell>{item.nd}</TableCell>
                    <TableCell>{item.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>ALERTAS IDENTIFICADAS</Typography>
            <Typography sx={{ fontSize: 11 }}>{data.alertasIdentificadas}</Typography>
          </Box>
        </Paper>
      ) : null}
    </Box>
  );
}
