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
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import DashboardPoiAction, {
  type DashboardPoiReporteDto,
  type DashboardPoiReporteFilaDto,
} from "../DashboardPoiAction";

function parseNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
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

function formatNumber(value?: number | null): string {
  if (value == null || !Number.isFinite(Number(value))) return "";
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

const physicalColumns = [
  { key: "FA", label: "F(A)" },
  { key: "FRE", label: "F(RE)" },
  { key: "FSE", label: "F(SE)" },
  { key: "FNA", label: "Fn(A)" },
  { key: "FNRE", label: "Fn(RE)" },
  { key: "FNSE", label: "Fn(SE)" },
  { key: "FAJ", label: "F(AJ)" },
  { key: "FCS", label: "F(CS)" },
  { key: "FREP", label: "F(RE_P)" },
  { key: "FSEP", label: "F(SE_P)" },
  { key: "FNAJ", label: "Fn(AJ)" },
  { key: "FNCS", label: "Fn(CS)" },
  { key: "FNREP", label: "Fn(RE_P)" },
  { key: "FNSEP", label: "Fn(SE_P)" },
];

const baseHeadSx = {
  bgcolor: "#eff6ff",
  color: "#1e3a8a",
  fontWeight: 900,
  fontSize: 11,
  borderColor: "#bfdbfe",
  whiteSpace: "nowrap",
};

function getValor(row: DashboardPoiReporteFilaDto, key: string): number | null | undefined {
  return row.valoresFisicos?.[key];
}

export default function DashboardPoiReportePage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);
  const [downloadingExcelAlertas, setDownloadingExcelAlertas] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<DashboardPoiReporteDto | null>(null);

  const filtros = useMemo(
    () => ({
      idPeriodo: parseNumber(searchParams.get("idPeriodo")),
      idPoiAnio: parseNumber(searchParams.get("idPoiAnio")),
      mes: parseNumber(searchParams.get("mes")),
      idUnidadEjecutora: parseNumber(searchParams.get("idUnidadEjecutora")),
    }),
    [searchParams]
  );

  useEffect(() => {
    let active = true;

    async function loadReporte() {
      if (filtros.idPeriodo == null) {
        setLoading(false);
        setData(null);
        setErrorMsg("Para visualizar el reporte POI debe seleccionar un Periodo POI. No se permite generar el reporte con la opción Todos.");
        return;
      }

      if (filtros.idPoiAnio == null) {
        setLoading(false);
        setData(null);
        setErrorMsg("Para visualizar el reporte POI debe seleccionar un Año POI. El reporte POI es anual y no se debe generar con la opción Todos.");
        return;
      }

      setLoading(true);
      setErrorMsg("");

      try {
        const resp = await DashboardPoiAction.getReporte(filtros);
        if (active) setData(resp);
      } catch (error) {
        if (active) {
          setData(null);
          setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el reporte WEB POI.");
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

  const rows = data?.filas ?? [];

  async function descargarExcelBackend() {
    if (filtros.idPeriodo == null) {
      setErrorMsg("Para descargar el reporte Excel POI debe seleccionar un Periodo POI.");
      return;
    }

    if (filtros.idPoiAnio == null) {
      setErrorMsg("Para descargar el reporte Excel POI debe seleccionar un Año POI.");
      return;
    }

    setDownloadingExcel(true);
    setErrorMsg("");

    try {
      await DashboardPoiAction.descargarReporteExcel(filtros);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo descargar el reporte Excel POI.");
    } finally {
      setDownloadingExcel(false);
    }
  }


  async function descargarExcelAlertasBackend() {
    if (filtros.idPeriodo == null) {
      setErrorMsg("Para descargar el Reporte Excel 2 POI debe seleccionar un Periodo POI.");
      return;
    }

    if (filtros.idPoiAnio == null) {
      setErrorMsg("Para descargar el Reporte Excel 2 POI debe seleccionar un Año POI.");
      return;
    }

    setDownloadingExcelAlertas(true);
    setErrorMsg("");

    try {
      await DashboardPoiAction.descargarReporteExcelAlertas(filtros);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo descargar el Reporte Excel 2 POI.");
    } finally {
      setDownloadingExcelAlertas(false);
    }
  }

  async function descargarPdfBackend() {
    if (filtros.idPeriodo == null) {
      setErrorMsg("Para generar el reporte PDF POI debe seleccionar un Periodo POI.");
      return;
    }

    if (filtros.idPoiAnio == null) {
      setErrorMsg("Para generar el reporte PDF POI debe seleccionar un Año POI.");
      return;
    }

    setErrorMsg("");

    try {
      await DashboardPoiAction.descargarReportePdf(filtros);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "No se pudo generar el reporte PDF POI.");
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.30)",
          background: "linear-gradient(135deg, rgba(37,99,235,.07), rgba(255,255,255,.96))",
          boxShadow: "0 14px 32px rgba(15,23,42,.06)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate("/dashboard/poi")}
              sx={{ borderRadius: 2.5, fontWeight: 900, bgcolor: "rgba(255,255,255,.92)" }}
            >
              Volver
            </Button>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 950 }}>
                Reporte WEB P.O.I.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vista preliminar del reporte por actividad operativa anual.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PictureAsPdfRoundedIcon />}
              onClick={() => void descargarPdfBackend()}
              sx={{ borderRadius: 2.5, fontWeight: 950, bgcolor: "rgba(255,255,255,.88)" }}
            >
              Generar reporte PDF
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={<TableChartRoundedIcon />}
              onClick={() => void descargarExcelBackend()}
              disabled={downloadingExcel || loading || !!errorMsg}
              sx={{ borderRadius: 2.5, fontWeight: 950, bgcolor: "rgba(255,255,255,.88)" }}
            >
              {downloadingExcel ? "Generando Excel..." : "Descargar Excel"}
            </Button>

            <Button
              variant="outlined"
              size="small"
              color="warning"
              startIcon={<TableChartRoundedIcon />}
              onClick={() => void descargarExcelAlertasBackend()}
              disabled={downloadingExcelAlertas || loading || !!errorMsg}
              sx={{
                borderRadius: 2.5,
                fontWeight: 950,
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
          </Stack>
        </Stack>
      </Paper>

      {errorMsg ? <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>{errorMsg}</Alert> : null}

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
          <CircularProgress size={22} />
          <Typography>Cargando reporte POI...</Typography>
        </Stack>
      ) : null}

      {!loading && data ? (
        <>
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 4, border: "1px solid #dbeafe", bgcolor: "#ffffff" }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={`Periodo: ${data.periodo ?? "Todos"}`} variant="outlined" sx={{ fontWeight: 800 }} />
              <Chip label={`Año POI: ${data.anioPoi ?? "Todos"}`} variant="outlined" sx={{ fontWeight: 800 }} />
              <Chip label={`Mes: ${data.mesNombre ?? "Todos"}`} variant="outlined" sx={{ fontWeight: 800 }} />
              <Chip label={`Unidad Ejecutora: ${data.unidadEjecutora ?? "Todas"}`} variant="outlined" sx={{ fontWeight: 800 }} />
              <Chip label={`Generado: ${formatDateTime(data.fechaGeneracion)}`} variant="outlined" sx={{ fontWeight: 800 }} />
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: "1px solid #dbeafe",
              overflow: "hidden",
              bgcolor: "#ffffff",
            }}
          >
            <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
              <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                POI por Actividad Operativa Anual
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 12.5 }}>
                Columnas con sustento en BD y columnas físicas especiales visibles aunque no tengan datos.
              </Typography>
            </Box>

            <TableContainer
              className="poi-report-scroll-container"
              sx={{
                width: "100%",
                maxWidth: "100%",
                height: "calc(100vh - 300px)",
                minHeight: 420,
                overflowX: "scroll",
                overflowY: "scroll",
                scrollbarGutter: "stable both-edges",
                borderTop: "1px solid #dbeafe",
                borderBottom: "1px solid #dbeafe",
                background:
                  "linear-gradient(180deg, rgba(248,250,252,.98) 0%, rgba(255,255,255,1) 100%)",
                boxShadow: "inset 0 0 0 1px rgba(219,234,254,.75)",
                "&::-webkit-scrollbar": {
                  width: 18,
                  height: 18,
                },
                "&::-webkit-scrollbar-track": {
                  background: "#eaf2ff",
                  borderRadius: 999,
                  boxShadow: "inset 0 0 0 1px rgba(147,197,253,.55)",
                },
                "&::-webkit-scrollbar-thumb": {
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #3b82f6 48%, #60a5fa 100%)",
                  borderRadius: 999,
                  border: "4px solid #eaf2ff",
                  boxShadow: "0 2px 8px rgba(37,99,235,.35)",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background:
                    "linear-gradient(135deg, #1d4ed8 0%, #2563eb 48%, #3b82f6 100%)",
                },
                "&::-webkit-scrollbar-corner": {
                  background: "#eaf2ff",
                },
                scrollbarWidth: "auto",
                scrollbarColor: "#2563eb #eaf2ff",
              }}
            >
              <Table stickyHeader size="small" sx={{ minWidth: 3900, tableLayout: "auto" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={baseHeadSx}>UE</TableCell>
                    <TableCell sx={baseHeadSx}>Centro de Costo</TableCell>
                    <TableCell sx={baseHeadSx}>OEI / AEI</TableCell>
                    <TableCell sx={baseHeadSx}>Nro Registro POI</TableCell>
                    <TableCell sx={baseHeadSx}>Código AO</TableCell>
                    <TableCell sx={baseHeadSx}>Actividad Operativa</TableCell>
                    <TableCell sx={baseHeadSx}>Unidad de Medida</TableCell>
                    <TableCell sx={baseHeadSx}>Provincia</TableCell>
                    <TableCell sx={baseHeadSx}>Distrito</TableCell>
                    {physicalColumns.map((col) => (
                      <TableCell key={col.key} align="right" sx={baseHeadSx}>{col.label} Total</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9 + physicalColumns.length} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                        No se encontraron registros para los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : rows.map((row, idx) => (
                    <TableRow key={`${row.nroRegistroPoi}-${row.actividadOperativaId}-${idx}`} hover>
                      <TableCell sx={{ fontSize: 12 }}>{row.unidadEjecutora}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.centroCosto}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 900 }}>{row.oei} / {row.aei}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{row.objetivoEstrategicoInstitucional}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 800 }}>{row.nroRegistroPoi}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 800 }}>{row.actividadOperativaId}</TableCell>
                      <TableCell sx={{ fontSize: 12, minWidth: 280 }}>{row.actividadOperativa}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.unidadMedida}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.provinciaNombreUbigeo}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{row.distritoNombreUbigeo}</TableCell>
                      {physicalColumns.map((col) => (
                        <TableCell key={col.key} align="right" sx={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          {formatNumber(getValor(row, `${col.key}TOTAL`))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : null}
    </Box>
  );
}
