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

import DashboardPeiAction, {
  type DashboardPeiReporteDto,
  type DashboardPeiReporteFilaDto,
} from "../DashboardPeiAction";
import type { DashboardNivelAvanceValue } from "../DashboardFiltersTypes";

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

function getRowKey(row: DashboardPeiReporteFilaDto): string {
  return `${row.idPeiOeiAei}-${row.idIndicadorNombre}`;
}

function getValorAnual(row: DashboardPeiReporteFilaDto, anio: number) {
  return row.valoresPorAnio?.find((x) => Number(x.anio) === Number(anio));
}

type GrupoReporte = {
  key: string;
  tipoNivel: string;
  codigo: string;
  denominacion: string;
  avancePorAnio: Record<number, { semestre: number | null; anual: number | null }>;
  rows: DashboardPeiReporteFilaDto[];
};

function avg(values: Array<number | null | undefined>): number | null {
  const valid = values
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x));

  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function buildGroups(rows: DashboardPeiReporteFilaDto[], aniosEjecutado: number[]): GrupoReporte[] {
  const map = new Map<string, GrupoReporte>();

  rows.forEach((row) => {
    const key = `${row.tipoNivel}-${row.idPeiOeiAei}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        tipoNivel: row.tipoNivel,
        codigo: row.codigoNivel,
        denominacion: row.denominacionNivel,
        avancePorAnio: {},
        rows: [],
      });
    }

    map.get(key)!.rows.push(row);
  });

  return Array.from(map.values()).map((group) => {
    const avancePorAnio: Record<number, { semestre: number | null; anual: number | null }> = {};

    aniosEjecutado.forEach((anio) => {
      avancePorAnio[anio] = {
        semestre: avg(group.rows.map((row) => getValorAnual(row, anio)?.avanceSemestre)),
        anual: avg(group.rows.map((row) => getValorAnual(row, anio)?.avanceAnual)),
      };
    });

    return { ...group, avancePorAnio };
  });
}

export default function DashboardPeiReportePage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardPeiReporteDto | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);

  const filtros = useMemo(
    () => ({
      idPeriodo: parseNumber(searchParams.get("idPeriodo")),
      idAnioProyeccion: parseNumber(searchParams.get("idAnioProyeccion")),
      idUnidad: parseNumber(searchParams.get("idUnidad")),
      nivelAvance: (searchParams.get("nivelAvance") || undefined) as
        | DashboardNivelAvanceValue
        | undefined,
    }),
    [searchParams]
  );

  useEffect(() => {
    let active = true;

    async function loadReporte() {
      if (filtros.idPeriodo == null) {
        setLoading(false);
        setData(null);
        setErrorMsg("Para generar el reporte PDF debe seleccionar un Periodo PEI. No se permite generar el reporte con la opción Todos.");
        return;
      }

      setLoading(true);
      setErrorMsg("");

      try {
        const resp = await DashboardPeiAction.getReporte(filtros);
        if (active) setData(resp);
      } catch (error) {
        if (active) {
          setErrorMsg(
            error instanceof Error
              ? error.message
              : "No se pudo cargar el reporte PEI."
          );
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
  const grupos = useMemo(() => buildGroups(data?.filas ?? [], aniosEjecutado), [data, aniosEjecutado]);

  const baseCols = 9;
  const colSpanAntesDeAvance = baseCols + aniosLogro.length + aniosEjecutado.length * 2;
  const totalCols = colSpanAntesDeAvance + aniosEjecutado.length * 2;

  async function descargarPdfBackend() {
    setDownloadingPdf(true);
    setErrorMsg("");

    try {
      await DashboardPeiAction.descargarReportePdf(filtros);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo generar el PDF del reporte PEI."
      );
    } finally {
      setDownloadingPdf(false);
    }
  }


  async function descargarExcelBackend() {
    setDownloadingExcel(true);
    setErrorMsg("");

    try {
      await DashboardPeiAction.descargarReporteExcel(filtros);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo generar el Excel del reporte PEI."
      );
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
        .reporte-table .group-row td { background: #eef2ff; font-weight: 900; }
        .reporte-table .oei-row td { background: #f5f3ff; }
        .reporte-table .aei-row td { background: #eff6ff; }
        .col-codigo { width: 62px; }
        .col-denominacion { width: 210px; }
        .col-ue { width: 86px; }
        .col-uorg { width: 142px; }
        .col-corta { width: 68px; }
        .col-num { width: 54px; text-align: center; }
      `}</style>

      <Stack
        className="no-print"
        direction="row"
        spacing={1}
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ borderRadius: 2, fontWeight: 900 }}
        >
          Volver
        </Button>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            startIcon={<TableChartRoundedIcon />}
            variant="outlined"
            color="success"
            onClick={() => void descargarExcelBackend()}
            disabled={!data || loading || downloadingExcel}
            sx={{ borderRadius: 2, fontWeight: 900 }}
          >
            {downloadingExcel ? "Generando Excel..." : "Descargar Excel"}
          </Button>

          <Button
            startIcon={<PrintRoundedIcon />}
            variant="contained"
            onClick={() => void descargarPdfBackend()}
            disabled={!data || loading || downloadingPdf}
            sx={{ borderRadius: 2, fontWeight: 900 }}
          >
            {downloadingPdf ? "Generando PDF..." : "Descargar PDF A4 horizontal"}
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={22} />
          <Typography>Cargando reporte PEI...</Typography>
        </Stack>
      ) : null}

      {!loading && errorMsg ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      ) : null}

      {!loading && data ? (
        <Paper
          className="reporte-paper"
          elevation={0}
          sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "white" }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>Anexo B-7</Typography>
          <Typography className="reporte-title" sx={{ textAlign: "center", fontWeight: 950, fontSize: 16 }}>
            {data.titulo}
          </Typography>

          <Box className="reporte-meta" sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "160px 1fr", gap: 0.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>Periodo PEI :</Typography>
            <Typography sx={{ fontSize: 12 }}>{data.periodoPei || "—"}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>Nivel de Gobierno :</Typography>
            <Typography sx={{ fontSize: 12 }}>{data.nivelGobierno}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>Sector :</Typography>
            <Typography sx={{ fontSize: 12 }}>{data.sector}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>Pliego :</Typography>
            <Typography sx={{ fontSize: 12 }}>{data.pliego}</Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.3, mb: 1.3 }}>
            <Chip size="small" label={`Año reporte: ${data.anioReporte ?? "—"}`} variant="outlined" />
            <Chip size="small" label={`Unidad: ${data.unidadFiltro || "Todas"}`} variant="outlined" />
            <Chip size="small" label={`Nivel de avance: ${data.nivelAvanceLabel || "Todos"}`} variant="outlined" />
            <Chip size="small" label={`Generado: ${formatDateTime(data.fechaGeneracion)}`} variant="outlined" />
          </Stack>

          <TableContainer className="reporte-table-container" sx={{ overflowX: "auto" }}>
            <Table size="small" className="reporte-table">
              <TableHead>
                <TableRow>
                  <TableCell rowSpan={3} className="col-codigo">Código</TableCell>
                  <TableCell rowSpan={3} className="col-denominacion">Denominación</TableCell>
                  <TableCell rowSpan={3} className="col-ue">UE</TableCell>
                  <TableCell rowSpan={3} className="col-uorg">Unidad de Organización</TableCell>
                  <TableCell rowSpan={3} className="col-corta">Relevancia</TableCell>
                  <TableCell rowSpan={3} className="col-corta">Sentido Esperado</TableCell>
                  <TableCell rowSpan={3} className="col-corta">Tipo de Agregación</TableCell>
                  <TableCell colSpan={2}>Línea Base</TableCell>
                  <TableCell colSpan={aniosLogro.length || 1}>Logro Esperado</TableCell>
                  <TableCell colSpan={(aniosEjecutado.length || 1) * 2}>Valores Obtenidos</TableCell>
                  <TableCell colSpan={(aniosEjecutado.length || 1) * 2}>Avance Tipo I (%)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell rowSpan={2} className="col-num">Año</TableCell>
                  <TableCell rowSpan={2} className="col-num">Valor</TableCell>
                  {aniosLogro.length > 0 ? (
                    aniosLogro.map((anio) => <TableCell key={`le-${anio}`} rowSpan={2} className="col-num">{anio}</TableCell>)
                  ) : (
                    <TableCell rowSpan={2} className="col-num">0.00</TableCell>
                  )}
                  {aniosEjecutado.length > 0 ? (
                    aniosEjecutado.map((anio) => <TableCell key={`vo-${anio}`} colSpan={2}>{anio}</TableCell>)
                  ) : (
                    <TableCell colSpan={2}>0.00</TableCell>
                  )}
                  {aniosEjecutado.length > 0 ? (
                    aniosEjecutado.map((anio) => <TableCell key={`av-${anio}`} colSpan={2}>{anio}</TableCell>)
                  ) : (
                    <TableCell colSpan={2}>0.00</TableCell>
                  )}
                </TableRow>
                <TableRow>
                  {(aniosEjecutado.length > 0 ? aniosEjecutado : [0]).flatMap((anio) => [
                    <TableCell key={`vo-sem-${anio}`} className="col-num">Sem.</TableCell>,
                    <TableCell key={`vo-anual-${anio}`} className="col-num">Anual</TableCell>,
                  ])}
                  {(aniosEjecutado.length > 0 ? aniosEjecutado : [0]).flatMap((anio) => [
                    <TableCell key={`av-sem-${anio}`} className="col-num">Sem.</TableCell>,
                    <TableCell key={`av-anual-${anio}`} className="col-num">Anual</TableCell>,
                  ])}
                </TableRow>
              </TableHead>
              <TableBody>
                {grupos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={totalCols}>No se encontraron registros.</TableCell>
                  </TableRow>
                ) : null}

                {grupos.map((grupo) => (
                  <React.Fragment key={grupo.key}>
                    <TableRow className={`group-row ${grupo.tipoNivel === "OEI" ? "oei-row" : "aei-row"}`}>
                      <TableCell colSpan={colSpanAntesDeAvance}>
                        {grupo.codigo} {grupo.denominacion}
                      </TableCell>
                      {aniosEjecutado.flatMap((anio) => [
                        <TableCell key={`${grupo.key}-${anio}-sem`} className="col-num">
                          {/* En las filas resumen OEI/AEI el modelo muestra el resumen solo en Anual. */}
                        </TableCell>,
                        <TableCell
                          key={`${grupo.key}-${anio}-anual`}
                          className="col-num"
                          sx={getAvanceCellSx(grupo.avancePorAnio[anio]?.anual)}
                        >
                          {formatNumber(grupo.avancePorAnio[anio]?.anual)}
                        </TableCell>,
                      ])}
                    </TableRow>

                    {grupo.rows.map((row) => (
                      <TableRow key={getRowKey(row)}>
                        <TableCell>{row.codigoIndicador}</TableCell>
                        <TableCell>{row.nombreIndicador}</TableCell>
                        <TableCell>{row.unidadEjecutora || ""}</TableCell>
                        <TableCell>{row.unidadOrganizacion || ""}</TableCell>
                        <TableCell>{row.relevancia || ""}</TableCell>
                        <TableCell>{row.sentidoEsperado || ""}</TableCell>
                        <TableCell>{row.tipoAgregacion || ""}</TableCell>
                        <TableCell className="col-num">{row.lineaBaseAnio ?? ""}</TableCell>
                        <TableCell className="col-num">{formatNumber(row.lineaBaseValor)}</TableCell>
                        {aniosLogro.length > 0 ? (
                          aniosLogro.map((anio) => {
                            const logro = row.logrosEsperados?.find((x) => Number(x.anio) === Number(anio));
                            return <TableCell key={anio} className="col-num">{formatNumber(logro?.valor)}</TableCell>;
                          })
                        ) : (
                          <TableCell className="col-num">0.00</TableCell>
                        )}
                        {aniosEjecutado.length > 0 ? (
                          aniosEjecutado.flatMap((anio) => {
                            const valor = getValorAnual(row, anio);
                            return [
                              <TableCell key={`${anio}-vo-sem`} className="col-num">{formatNumber(valor?.valorObtenidoSemestre)}</TableCell>,
                              <TableCell key={`${anio}-vo-anual`} className="col-num">{formatNumber(valor?.valorObtenidoAnual)}</TableCell>,
                            ];
                          })
                        ) : (
                          <>
                            <TableCell className="col-num">0.00</TableCell>
                            <TableCell className="col-num">0.00</TableCell>
                          </>
                        )}
                        {aniosEjecutado.length > 0 ? (
                          aniosEjecutado.flatMap((anio) => {
                            const valor = getValorAnual(row, anio);
                            return [
                              <TableCell
                                key={`${anio}-av-sem`}
                                className="col-num"
                                sx={getAvanceCellSx(valor?.avanceSemestre)}
                              >
                                {formatNumber(valor?.avanceSemestre)}
                              </TableCell>,
                              <TableCell
                                key={`${anio}-av-anual`}
                                className="col-num"
                                sx={getAvanceCellSx(valor?.avanceAnual)}
                              >
                                {formatNumber(valor?.avanceAnual)}
                              </TableCell>,
                            ];
                          })
                        ) : (
                          <>
                            <TableCell className="col-num">0.00</TableCell>
                            <TableCell className="col-num">0.00</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography sx={{ mt: 1.5, fontSize: 11, fontWeight: 900 }}>IGI: {formatNumber(data.igi)}</Typography>

          <Box sx={{ mt: 1.4 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 900 }}>NOTA :</Typography>
            <Typography sx={{ fontSize: 10 }}>1. (*) Indicador sin registro de campos RELEVANCIA y/o TIPO DE AGREGACIÓN.</Typography>
            <Typography sx={{ fontSize: 10 }}>2. (**) El cálculo de avance porcentual incluye una división por cero.</Typography>
            <Typography sx={{ fontSize: 10 }}>3. Para este reporte, el avance se calcula con la misma lógica del dashboard: ejecutado / meta * 100.</Typography>
            <Typography sx={{ fontSize: 10 }}>4. La columna UE se obtiene desde el circuito de unidades ejecutoras vinculado a los centros de costo de las AEI.</Typography>
          </Box>

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
