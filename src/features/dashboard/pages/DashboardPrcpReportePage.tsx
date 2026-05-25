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
  type DashboardPrcpReporteGraficoDto,
} from "../DashboardPrcpAction";

function parseNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function formatNumber(value?: number | null): string {
  if (value == null || !Number.isFinite(Number(value))) return "0.00";
  return new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

function formatPercent(value?: number | null): string {
  if (value == null || !Number.isFinite(Number(value))) return "0.00%";
  return `${formatNumber(Number(value))}%`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "medium" }).format(d);
}

function SvgLineChart({ items }: { items: DashboardPrcpReporteGraficoDto[] }) {
  const width = 420;
  const height = 155;
  const left = 42;
  const right = 20;
  const top = 16;
  const bottom = 34;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const max = Math.max(100, ...items.map((x) => Number(x.valor || 0)));
  const step = items.length <= 1 ? plotW : plotW / (items.length - 1);
  const points = items.map((item, index) => {
    const x = left + index * step;
    const y = top + plotH - (Math.max(0, Math.min(max, Number(item.valor || 0))) / max) * plotH;
    return { x, y, item };
  });

  return (
    <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", height: 170 }}>
      {[0, 25, 50, 75, 100].map((g) => {
        const y = top + plotH - (g / 100) * plotH;
        return (
          <g key={g}>
            <line x1={left} y1={y} x2={width - right} y2={y} stroke="#e5e7eb" />
            <text x={6} y={y + 4} fontSize="9">{g}%</text>
          </g>
        );
      })}
      <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#2563eb" strokeWidth="3" />
      {points.map((p) => (
        <g key={p.item.etiqueta}>
          <circle cx={p.x} cy={p.y} r="4" fill="#2563eb" />
          <text x={p.x} y={p.y - 8} fontSize="9" textAnchor="middle" fontWeight="700">{formatPercent(p.item.valor)}</text>
          <text x={p.x} y={height - 8} fontSize="9" textAnchor="middle">{p.item.etiqueta}</text>
        </g>
      ))}
    </Box>
  );
}

function SvgColumnChart({ items }: { items: DashboardPrcpReporteGraficoDto[] }) {
  const width = 390;
  const height = 155;
  const left = 34;
  const top = 16;
  const bottom = 34;
  const plotH = height - top - bottom;
  const max = Math.max(1, ...items.map((x) => Number(x.cantidad || 0)));
  const barW = Math.max(22, (width - left - 24) / Math.max(1, items.length) - 24);

  return (
    <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", height: 170 }}>
      <line x1={left} y1={top + plotH} x2={width - 12} y2={top + plotH} stroke="#9ca3af" />
      {items.map((item, index) => {
        const h = (Number(item.cantidad || 0) / max) * plotH;
        const x = left + 20 + index * (barW + 34);
        const y = top + plotH - h;
        return (
          <g key={item.etiqueta}>
            <rect x={x} y={y} width={barW} height={h} fill="#16a34a" rx="3" />
            <text x={x + barW / 2} y={y - 6} fontSize="10" textAnchor="middle" fontWeight="700">{item.cantidad}</text>
            <text x={x + barW / 2} y={height - 8} fontSize="10" textAnchor="middle">{item.etiqueta}</text>
          </g>
        );
      })}
    </Box>
  );
}

function SvgDonutChart({ items, avanceAcumulado }: { items: DashboardPrcpReporteGraficoDto[]; avanceAcumulado?: number | null }) {
  const cumplidos = Number(items.find((x) => x.etiqueta?.toUpperCase() === "CUMPLIDOS")?.valor || 0);
  const pendientes = Number(items.find((x) => x.etiqueta?.toUpperCase() === "PENDIENTES")?.valor || 0);
  const avance = Math.max(0, Math.min(100, cumplidos));
  const avanceCentral = Math.max(0, Math.min(100, Number(avanceAcumulado ?? cumplidos)));
  const pendiente = Math.max(0, Math.min(100, pendientes));

  const cx = 128;
  const cy = 108;
  const r = 70;

  function polar(angleDeg: number) {
    const angleRad = (Math.PI / 180) * angleDeg;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  }

  function arcPath(startAngle: number, endAngle: number) {
    const start = polar(startAngle);
    const end = polar(endAngle);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  }

  const cumplidosEndAngle = 180 + 180 * (avance / 100);
  const pendientesEndAngle = 360;
  const showCumplidos = avance > 0;
  const showPendientes = pendiente > 0 && cumplidosEndAngle < pendientesEndAngle;

  return (
    <Box component="svg" viewBox="0 0 380 180" sx={{ width: "100%", height: 180 }}>
      <path d={arcPath(180, 360)} fill="none" stroke="#e5e7eb" strokeWidth="22" strokeLinecap="round" />
      {showCumplidos ? (
        <path d={arcPath(180, cumplidosEndAngle)} fill="none" stroke="#34d399" strokeWidth="22" strokeLinecap="round" />
      ) : null}
      {showPendientes ? (
        <path d={arcPath(cumplidosEndAngle, pendientesEndAngle)} fill="none" stroke="#4b5563" strokeWidth="22" strokeLinecap="round" />
      ) : null}

      <text x={cx} y={cy - 12} fontSize="12" textAnchor="middle" fontWeight="900">{formatPercent(avanceCentral)}</text>
      <text x={cx} y={cy + 4} fontSize="10" textAnchor="middle" fontWeight="700">Avance</text>

      <circle cx="280" cy="50" r="5" fill="#34d399" />
      <text x="292" y="54" fontSize="11">Cumplidos: {formatPercent(avance)}</text>
      <circle cx="280" cy="75" r="5" fill="#4b5563" />
      <text x="292" y="79" fontSize="11">Pendientes: {formatPercent(pendiente)}</text>

      <text x="52" y="145" fontSize="10" fill="#34d399" fontWeight="900">{formatPercent(avance)}</text>
      <text x="232" y="145" fontSize="10" fill="#4b5563" fontWeight="900">{formatPercent(pendiente)}</text>
    </Box>
  );
}

function ChartCard({ title, items, mode, avanceAcumulado }: { title: string; items: DashboardPrcpReporteGraficoDto[]; mode: "line" | "column" | "donut"; avanceAcumulado?: number | null }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2, minHeight: 190 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 900, mb: 0.75 }}>{title}</Typography>
      {items.length === 0 ? (
        <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Sin información.</Typography>
      ) : mode === "line" ? (
        <SvgLineChart items={items} />
      ) : mode === "column" ? (
        <SvgColumnChart items={items} />
      ) : (
        <SvgDonutChart items={items} avanceAcumulado={avanceAcumulado} />
      )}
    </Paper>
  );
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
        setErrorMsg("Para generar el reporte PRCP debe seleccionar un Periodo PRCP. No se permite generar el reporte con la opción Todos.");
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
          .reporte-table th, .reporte-table td { font-size: 7px !important; line-height: 1.15 !important; padding: 2px !important; }
        }
        .reporte-table { border-collapse: collapse; width: 100%; table-layout: fixed; }
        .reporte-table th { background: #d9eaf7; font-weight: 800; text-align: center; border: 1px solid #9ca3af; }
        .reporte-table td { border: 1px solid #cbd5e1; vertical-align: top; }
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
          <Typography sx={{ textAlign: "center", fontSize: 15, fontWeight: 900, textTransform: "uppercase" }}>{data.titulo || "Reporte de Seguimiento PRCP"}</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center" sx={{ mt: 1, mb: 1.5 }}>
            <Chip size="small" label={`Periodo: ${data.periodoPrcp || "—"}`} />
            <Chip size="small" label={`Objetivo prioritario: ${data.objetivoPrioritarioFiltro || "Todos"}`} />
            <Chip size="small" label={`Unidad conductora: ${data.unidadConductoraFiltro || "—"}`} />
            <Chip size="small" label={`Año reporte: ${data.anioReporte ?? "Consolidado"}`} />
            <Chip size="small" label={`Fecha: ${formatDateTime(data.fechaGeneracion)}`} />
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5, mb: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}><Typography sx={{ fontSize: 11, fontWeight: 700 }}>Indicadores</Typography><Typography sx={{ fontSize: 22, fontWeight: 900 }}>{data.totalIndicadoresReporte}</Typography></Paper>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}><Typography sx={{ fontSize: 11, fontWeight: 700 }}>Cumplidos</Typography><Typography sx={{ fontSize: 22, fontWeight: 900 }}>{data.indicadoresCumplidos}</Typography></Paper>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}><Typography sx={{ fontSize: 11, fontWeight: 700 }}>Pendientes</Typography><Typography sx={{ fontSize: 22, fontWeight: 900 }}>{data.indicadoresPendientes}</Typography></Paper>
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}><Typography sx={{ fontSize: 11, fontWeight: 700 }}>Avance acumulado</Typography><Typography sx={{ fontSize: 22, fontWeight: 900 }}>{formatPercent(data.avanceAcumulado)}</Typography></Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 1.5, mb: 2 }}>
            <ChartCard title="Gráfico 1: Avance acumulado" items={data.graficoAvanceAcumulado ?? []} mode="line" />
            <ChartCard title="Gráfico 2: Hitos cumplidos" items={data.graficoHitosCumplidos ?? []} mode="column" />
            <ChartCard title="Gráfico 3: Distribución por estado" items={data.graficoDistribucionEstado ?? []} mode="donut" avanceAcumulado={data.avanceAcumulado} />
          </Box>

          <Typography sx={{ fontSize: 12, fontWeight: 900, mb: 0.75 }}>Detalle de Indicadores</Typography>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" className="reporte-table">
              <TableHead>
                <TableRow>
                  <TableCell>Objetivo Prioritario</TableCell>
                  <TableCell>Medida</TableCell>
                  <TableCell>Indicador</TableCell>
                  <TableCell>Periodo PRCP</TableCell>
                  <TableCell>Valor Esperado</TableCell>
                  <TableCell>Valor Obtenido</TableCell>
                  <TableCell>% Cumplimiento</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.filas.length === 0 ? (
                  <TableRow><TableCell colSpan={8}>No se encontraron registros.</TableCell></TableRow>
                ) : data.filas.map((row) => (
                  <TableRow key={`${row.idPrcpOpPiMp}-${row.idIndicadorNombre}`}>
                    <TableCell>{`${row.codigoOp} - ${row.descripcionOp}`}</TableCell>
                    <TableCell>{`${row.codigoMp} - ${row.descripcionMp}`}</TableCell>
                    <TableCell>{`${row.codigoIndicador} - ${row.nombreIndicador}`}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>{data.anioReporte ?? "Consolidado"}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>{formatNumber(row.valorEsperadoReporte)}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>{formatNumber(row.valorObtenidoReporte)}</TableCell>
                    <TableCell sx={{ textAlign: "center" }}>{formatPercent(row.cumplimientoReporte)}</TableCell>
                    <TableCell sx={{ textAlign: "center", fontWeight: 900, bgcolor: row.hitoCumplido ? "#dcfce7" : "#fee2e2" }}>{row.estadoReporte}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 900 }}>ALERTAS IDENTIFICADAS</Typography>
            <Typography sx={{ fontSize: 11 }}>{data.alertasIdentificadas}</Typography>
          </Box>
        </Paper>
      ) : null}
    </Box>
  );
}
