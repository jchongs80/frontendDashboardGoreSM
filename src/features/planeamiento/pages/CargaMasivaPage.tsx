import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

import {
  CargaMasivaAction,
  type CargaMasivaResultadoDto,
  type CargaMasivaValidacionDto,
  type AgCargaMasivaResultadoDto,
  type PdrcCargaMasivaResultadoDto,
} from "../CargaMasivaAction";

type RouteParams = {
  tipo?: string;
};

const tiposPermitidos = ["ag", "pdrc", "pei", "poi"] as const;
type TipoInstrumento = (typeof tiposPermitidos)[number];

function normalizeTipo(tipo?: string): TipoInstrumento {
  const t = (tipo ?? "").trim().toLowerCase();
  return (tiposPermitidos.includes(t as TipoInstrumento) ? t : "pdrc") as TipoInstrumento;
}

function getTitulo(tipo: TipoInstrumento): string {
  switch (tipo) {
    case "ag":
      return "Planeamiento: Carga Masiva AG";
    case "pdrc":
      return "Planeamiento: Carga Masiva PDRC";
    case "pei":
      return "Planeamiento: Carga Masiva PEI";
    case "poi":
      return "Planeamiento: Carga Masiva POI";
    default:
      return "Planeamiento: Carga Masiva";
  }
}

function getDescripcion(tipo: TipoInstrumento): string {
  switch (tipo) {
    case "pdrc":
      return "Valida y procesa el archivo Excel para objetivos, acciones, indicadores y valores del PDRC.";
    case "ag":
      return "Valida y procesa el archivo Excel para Acuerdos de Gobernabilidad, tanto Indicador Valor como Indicador Ejecutado.";
    case "pei":
      return "Carga masiva para el PEI.";
    case "poi":
      return "Carga masiva para el POI.";
    default:
      return "Sube un archivo Excel para validarlo y procesarlo.";
  }
}

function isPdrcResultado(
  resultado: CargaMasivaResultadoDto | null
): resultado is PdrcCargaMasivaResultadoDto {
  return !!resultado && "periodosInsertados" in resultado;
}

function isAgResultado(
  resultado: CargaMasivaResultadoDto | null
): resultado is AgCargaMasivaResultadoDto {
  return !!resultado && "cabecerasInsertadas" in resultado;
}

type PlantillaDescarga = {
  label: string;
  fileName: string;
  url: string;
};

function getPlantillas(tipo: TipoInstrumento): PlantillaDescarga[] {
  switch (tipo) {
    case "pdrc":
      return [
        {
          label: "Descargar plantilla PDRC",
          fileName: "pdrc-plantilla.xlsx",
          url: "/plantillas/pdrc-plantilla.xlsx",
        },
      ];

    case "ag":
      return [
        {
          label: "Plantilla AG - Valores",
          fileName: "ag-plantilla-valores.xlsx",
          url: "/plantillas/ag-plantilla-valores.xlsx",
        },
        {
          label: "Plantilla AG - Ejecutado",
          fileName: "ag-plantilla-ejecutado.xlsx",
          url: "/plantillas/ag-plantilla-ejecutado.xlsx",
        },
      ];

    default:
      return [];
  }
}

function descargarArchivo(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function CargaMasivaPage(): React.ReactElement {
  const navigate = useNavigate();
  const { tipo } = useParams<RouteParams>();

  const tipoActual = useMemo(() => normalizeTipo(tipo), [tipo]);
  const plantillas = useMemo(() => getPlantillas(tipoActual), [tipoActual]);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] = useState<CargaMasivaValidacionDto | null>(null);
  const [resultado, setResultado] = useState<CargaMasivaResultadoDto | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string>("");
  const [loadingValidar, setLoadingValidar] = useState<boolean>(false);
  const [loadingProcesar, setLoadingProcesar] = useState<boolean>(false);

  const soportado = tipoActual === "pdrc" || tipoActual === "ag";

  const archivoLabel = archivo?.name ?? "Ningún archivo seleccionado";

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setArchivo(file);
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");

    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx") {
      setErrorGeneral("Solo se permiten archivos .xlsx");
      setArchivo(null);
    }
  };

  const onValidar = async () => {
    if (!archivo) {
      setErrorGeneral("Seleccione un archivo Excel antes de validar.");
      return;
    }

    setLoadingValidar(true);
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");

    try {
      const resp = await CargaMasivaAction.validar(tipoActual, archivo);
      setValidacion(resp);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo validar el archivo.";
      setErrorGeneral(msg);
    } finally {
      setLoadingValidar(false);
    }
  };

  const onProcesar = async () => {
    if (!archivo) {
      setErrorGeneral("Seleccione un archivo Excel antes de procesar.");
      return;
    }

    setLoadingProcesar(true);
    setResultado(null);
    setErrorGeneral("");

    try {
      const resp = await CargaMasivaAction.procesar(tipoActual, archivo);
      setResultado(resp);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo procesar el archivo.";
      setErrorGeneral(msg);
    } finally {
      setLoadingProcesar(false);
    }
  };

  const onLimpiar = () => {
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
    setErrorGeneral("");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {getTitulo(tipoActual)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getDescripcion(tipoActual)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={tipoActual.toUpperCase()} color="primary" variant="outlined" />
          <Tooltip title="Limpiar" arrow>
            <IconButton onClick={onLimpiar}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {!soportado && (
        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
          La carga masiva para <strong>{tipoActual.toUpperCase()}</strong> todavía no está habilitada.
          Por ahora la implementación operativa está en <strong>PDRC</strong> y <strong>AG</strong>.
        </Alert>
      )}

      <Paper
        sx={{
          mt: 2,
          p: 2.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 10px 30px rgba(0,0,0,.06)",
        }}
      >
        <Stack spacing={2}>
          {plantillas.length > 0 && (
            <>
              <Stack spacing={1}>
                <Typography sx={{ fontWeight: 700 }}>
                  Plantillas Excel
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} flexWrap="wrap">
                  {plantillas.map((p) => (
                    <Button
                      key={p.url}
                      variant="outlined"
                      startIcon={<DownloadRoundedIcon />}
                      onClick={() => descargarArchivo(p.url, p.fileName)}
                      sx={{ borderRadius: 2.5 }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </Stack>
              </Stack>

              <Divider />
            </>
          )}

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.7}>
              <Typography sx={{ fontWeight: 700 }}>
                Archivo Excel
              </Typography>
              <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<DescriptionRoundedIcon />}
                  label={archivoLabel}
                  variant="outlined"
                  sx={{ maxWidth: "100%" }}
                />
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                sx={{ borderRadius: 2.5 }}
              >
                Seleccionar archivo
                <input hidden type="file" accept=".xlsx" onChange={onSelectFile} />
              </Button>

              <Button
                variant="contained"
                startIcon={loadingValidar ? <CircularProgress size={18} color="inherit" /> : <FactCheckRoundedIcon />}
                onClick={onValidar}
                disabled={!archivo || loadingValidar || !soportado}
                sx={{ borderRadius: 2.5, minWidth: 140 }}
              >
                {loadingValidar ? "Validando..." : "Validar"}
              </Button>

              <Button
                variant="contained"
                color="success"
                startIcon={loadingProcesar ? <CircularProgress size={18} color="inherit" /> : <PlayCircleOutlineRoundedIcon />}
                onClick={onProcesar}
                disabled={!archivo || loadingProcesar || !soportado || !validacion?.puedeProcesar}
                sx={{ borderRadius: 2.5, minWidth: 140 }}
              >
                {loadingProcesar ? "Procesando..." : "Procesar"}
              </Button>
            </Stack>
          </Stack>

          <Divider />

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Flujo recomendado: primero <strong>Validar</strong>, luego <strong>Procesar</strong>.
          </Alert>

          {tipoActual === "ag" && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Para <strong>AG</strong>, el archivo debe contener <strong>una sola hoja</strong>:
              puede ser <strong>Indicador Valor</strong> o <strong>Indicador Ejecutado</strong>.
            </Alert>
          )}

          {tipoActual === "pdrc" && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Para <strong>PDRC</strong>, utiliza la plantilla oficial de carga masiva antes de validar y procesar.
            </Alert>
          )}

          {errorGeneral && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {errorGeneral}
            </Alert>
          )}
        </Stack>
      </Paper>

      {validacion && (
        <Paper
          sx={{
            mt: 2,
            p: 2.5,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 10px 30px rgba(0,0,0,.05)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Resultado de Validación
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 2, flexWrap: "wrap" }}>
            <Chip label={`Total filas: ${validacion.totalFilas}`} variant="outlined" />
            <Chip label={`Válidas: ${validacion.filasValidas}`} color="success" variant="outlined" />
            <Chip label={`Con error: ${validacion.filasConError}`} color="error" variant="outlined" />
            <Chip
              label={validacion.puedeProcesar ? "Puede procesar" : "No puede procesar"}
              color={validacion.puedeProcesar ? "success" : "warning"}
            />
            {!!validacion.tipoPlantilla && (
              <Chip
                label={`Plantilla: ${validacion.tipoPlantilla}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Stack>

          {validacion.errores?.length > 0 ? (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Fila</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Campo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mensaje</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Valor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validacion.errores.map((e, idx) => (
                    <TableRow key={`${e.numeroFila}-${e.campo}-${idx}`}>
                      <TableCell>{e.numeroFila}</TableCell>
                      <TableCell>{e.campo}</TableCell>
                      <TableCell>{e.mensaje}</TableCell>
                      <TableCell>{e.valor ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              El archivo no presenta errores de validación.
            </Alert>
          )}
        </Paper>
      )}

      {resultado && (
        <Paper
          sx={{
            mt: 2,
            p: 2.5,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 10px 30px rgba(0,0,0,.05)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Resultado del Procesamiento
          </Typography>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 2, flexWrap: "wrap" }}>
            <Chip label={`Leídas: ${resultado.totalFilasLeidas}`} variant="outlined" />
            <Chip label={`Válidas: ${resultado.totalFilasValidas}`} color="success" variant="outlined" />
            <Chip label={`Con error: ${resultado.totalFilasConError}`} color="error" variant="outlined" />
            {!!("tipoPlantilla" in resultado) && (
              <Chip label={`Plantilla: ${resultado.tipoPlantilla}`} color="primary" variant="outlined" />
            )}
          </Stack>

          {isPdrcResultado(resultado) && (
            <>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 2, flexWrap: "wrap" }}>
                <Chip label={`Valores insertados: ${resultado.valoresInsertados}`} color="success" />
                <Chip label={`Valores omitidos: ${resultado.valoresOmitidos}`} color="warning" variant="outlined" />
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Periodos insertados</TableCell>
                      <TableCell>{resultado.periodosInsertados}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>OER insertados</TableCell>
                      <TableCell>{resultado.oerInsertados}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>AER insertados</TableCell>
                      <TableCell>{resultado.aerInsertados}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Entidades estratégicas insertadas</TableCell>
                      <TableCell>{resultado.entidadesEstrategicasInsertadas}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Relaciones OER/AER insertadas</TableCell>
                      <TableCell>{resultado.oerAerInsertados}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Indicadores insertados</TableCell>
                      <TableCell>{resultado.indicadoresInsertados}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </>
          )}

          {isAgResultado(resultado) && (
            <>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 2, flexWrap: "wrap" }}>
                <Chip label={`Cabeceras insertadas: ${resultado.cabecerasInsertadas}`} color="success" variant="outlined" />
                <Chip label={`Cabeceras reutilizadas: ${resultado.cabecerasReutilizadas}`} color="primary" variant="outlined" />
                <Chip label={`Valores insertados: ${resultado.valoresInsertados}`} color="success" />
                <Chip label={`Valores actualizados: ${resultado.valoresActualizados}`} color="info" variant="outlined" />
                <Chip label={`Valores omitidos: ${resultado.valoresOmitidos}`} color="warning" variant="outlined" />
                <Chip label={`Ejecutados insertados: ${resultado.ejecutadosInsertados}`} color="success" />
                <Chip label={`Ejecutados actualizados: ${resultado.ejecutadosActualizados}`} color="info" variant="outlined" />
                <Chip label={`Ejecutados omitidos: ${resultado.ejecutadosOmitidos}`} color="warning" variant="outlined" />
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Cabeceras insertadas</TableCell>
                      <TableCell>{resultado.cabecerasInsertadas}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Cabeceras reutilizadas</TableCell>
                      <TableCell>{resultado.cabecerasReutilizadas}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Valores insertados</TableCell>
                      <TableCell>{resultado.valoresInsertados}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Valores actualizados</TableCell>
                      <TableCell>{resultado.valoresActualizados}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Ejecutados insertados</TableCell>
                      <TableCell>{resultado.ejecutadosInsertados}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Ejecutados actualizados</TableCell>
                      <TableCell>{resultado.ejecutadosActualizados}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </>
          )}

          {!!resultado.errores?.length && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
                El procesamiento devolvió observaciones.
              </Alert>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Fila</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Campo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mensaje</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultado.errores.map((e, idx) => (
                      <TableRow key={`${e.numeroFila}-${e.campo}-${idx}`}>
                        <TableCell>{e.numeroFila}</TableCell>
                        <TableCell>{e.campo}</TableCell>
                        <TableCell>{e.mensaje}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}