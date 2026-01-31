import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

import { CatalogoAction, type InstrumentoDto } from "../../catalogos/CatalogoAction";
import {
  PlaneamientoAction,
  type AccionCreateUpdateDto,
  type IndicadorListDto,
} from "../PlaneamientoAction";

import {
  PdrcObjetivosAccionesIndicadoresAction,
  type AccionConIndicadoresDto,
  type IndicadorItemDto,
  type ObjetivoResponsableAccionesIndicadoresDto,
} from "../PdrcObjetivosAccionesIndicadoresAction";

/* =========================
   Helpers (NO lógica negocio)
========================= */

const getErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Ocurrió un error inesperado.";
};

const pillSx = (estado?: string | null) => ({
  display: "inline-flex",
  px: 1,
  py: 0.25,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: "1px solid #E7ECF3",
  bgcolor:
    (estado ?? "ACTIVO").toUpperCase() === "ACTIVO"
      ? "rgba(16,185,129,.10)"
      : "rgba(239,68,68,.10)",
});

const normalizeText = (v: unknown): string => {
  if (v == null) return "";
  return String(v).trim().toLowerCase();
};

// Estilo premium (igual línea que tu página de Acuerdos)
const pageBgSx = {
  p: { xs: 1.5, md: 2 },
  borderRadius: 3,
  background:
    "radial-gradient(1200px 420px at 0% 0%, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0) 60%)",
};

const cardSx = {
  borderRadius: 3,
  border: "1px solid #EEF2F7",
  bgcolor: "#fff",
  boxShadow: "0 12px 40px rgba(15,23,42,0.08)",
  overflow: "hidden",
};

const headerBarSx = {
  p: 2,
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  bgcolor: "rgba(248,250,252,9)",
};

const thSx = {
  fontWeight: 900,
  bgcolor: "#FAFBFD",
  borderBottom: "1px solid #EEF2F7",
  whiteSpace: "nowrap",
};

const baseRowSx = {
  "& td": { borderBottom: "1px solid #F0F3F8", py: 1.25 },
  "&:hover": { bgcolor: "rgba(99,102,241,0.04)" },
};

const codeChipSx = {
  borderRadius: 999,
  fontWeight: 900,
  bgcolor: "#fff",
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

type SnackState = {
  open: boolean;
  type: "success" | "error";
  msg: string;
};

type AccionFormState = {
  idAccion?: number;
  codigo: string;
  enunciado: string;
  orden: string; // input string
  estado: "ACTIVO" | "INACTIVO";
};

type IndicadorFormState = {
  idAccion: number;
  indicador: IndicadorListDto | null;
};

export default function PdrcObjetivosAccionesIndicadoresPage() {
  const { idInstrumento, idObjetivo, idUnidad } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const instrumentoId = useMemo(
    () => (idInstrumento ? parseInt(idInstrumento, 10) : NaN),
    [idInstrumento]
  );
  const objetivoId = useMemo(() => (idObjetivo ? parseInt(idObjetivo, 10) : NaN), [idObjetivo]);
  const unidadId = useMemo(() => (idUnidad ? parseInt(idUnidad, 10) : NaN), [idUnidad]);

  const [vista, setVista] = useState<ObjetivoResponsableAccionesIndicadoresDto | null>(null);
  const [instrumento, setInstrumento] = useState<InstrumentoDto | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [snack, setSnack] = useState<SnackState>({ open: false, type: "success", msg: "" });
  const showOk = (msg: string) => setSnack({ open: true, type: "success", msg });
  const showErr = (msg: string) => setSnack({ open: true, type: "error", msg });

  // dialogs: acción
  const [openViewAccion, setOpenViewAccion] = useState(false);
  const [viewAccion, setViewAccion] = useState<AccionConIndicadoresDto | null>(null);

  const [openEditAccion, setOpenEditAccion] = useState(false);
  const [savingAccion, setSavingAccion] = useState(false);
  const [accionForm, setAccionForm] = useState<AccionFormState>({
    codigo: "",
    enunciado: "",
    orden: "",
    estado: "ACTIVO",
  });

  const [openNewAccion, setOpenNewAccion] = useState(false);
  const [creatingAccion, setCreatingAccion] = useState(false);
  const [newAccionForm, setNewAccionForm] = useState<AccionFormState>({
    codigo: "",
    enunciado: "",
    orden: "",
    estado: "ACTIVO",
  });

  // dialogs: indicador
  const [openAddIndic, setOpenAddIndic] = useState(false);
  const [indicadores, setIndicadores] = useState<IndicadorListDto[]>([]);
  const [indicadoresLoading, setIndicadoresLoading] = useState(false);
  const [indicForm, setIndicForm] = useState<IndicadorFormState>({ idAccion: 0, indicador: null });
  const [addingIndic, setAddingIndic] = useState(false);

  // confirm delete indicador
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAccion, setConfirmAccion] = useState<AccionConIndicadoresDto | null>(null);
  const [confirmIndic, setConfirmIndic] = useState<IndicadorItemDto | null>(null);
  const [removingIndic, setRemovingIndic] = useState(false);

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    const sp = new URLSearchParams(location.search);
    const returnTo = sp.get("returnTo") || "/instrumentos";
    navigate(returnTo);
  };

  const load = useCallback(async () => {
    if (
      !instrumentoId ||
      Number.isNaN(instrumentoId) ||
      !objetivoId ||
      Number.isNaN(objetivoId) ||
      !unidadId ||
      Number.isNaN(unidadId)
    ) {
      setError("Parámetros inválidos en la ruta (idInstrumento/idObjetivo/idUnidad).");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [res, inst] = await Promise.all([
        PdrcObjetivosAccionesIndicadoresAction.getVista(instrumentoId, objetivoId, unidadId, false),
        CatalogoAction.getInstrumentoById(instrumentoId),
      ]);

      setVista(res);
      setInstrumento(inst);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [instrumentoId, objetivoId, unidadId]);

  useEffect(() => {
    load();
  }, [load]);

const filteredVista = useMemo<ObjetivoResponsableAccionesIndicadoresDto | null>(() => {
    if (!vista) return null;
    const q = normalizeText(query);
    if (!q) return vista;

    const acciones = (vista.acciones ?? [])
      .map((a) => {
        const hitAccion =
          normalizeText(a.codigoAccion).includes(q) ||
          normalizeText(a.accion).includes(q) ||
          normalizeText(a.estadoAccion).includes(q);

        const inds = (a.indicadores ?? []).filter((i) => {
          return (
            normalizeText(i.codigoIndicador).includes(q) ||
            normalizeText(i.indicador).includes(q) ||
            normalizeText(i.estadoRelacion).includes(q) ||
            normalizeText(i.estadoIndicador).includes(q)
          );
        });

        if (hitAccion) return { ...a, indicadores: a.indicadores ?? [] };
        if (inds.length) return { ...a, indicadores: inds };
        return null;
      })
      .filter((x): x is AccionConIndicadoresDto => x !== null);

    return { ...vista, acciones };
  }, [vista, query]);

  // ======================
  // Acciones UI (Acción)
  // ======================
  const onViewAccion = (a: AccionConIndicadoresDto) => {
    setViewAccion(a);
    setOpenViewAccion(true);
  };

  const onEditAccion = (a: AccionConIndicadoresDto) => {
    setAccionForm({
      idAccion: a.idAccion,
      codigo: a.codigoAccion ?? "",
      enunciado: a.accion ?? "",
      orden: a.ordenAccion == null ? "" : String(a.ordenAccion),
      estado: (a.estadoAccion ?? "ACTIVO").toUpperCase() === "INACTIVO" ? "INACTIVO" : "ACTIVO",
    });
    setOpenEditAccion(true);
  };

  const parseIntOrNull = (raw: string): number | null | "invalid" => {
    const v = raw.trim();
    if (v === "") return null;
    const n = Number(v);
    if (Number.isNaN(n)) return "invalid";
    return Math.trunc(n);
  };

  const saveAccion = async () => {
    if (!vista || !accionForm.idAccion) return;

    if (!accionForm.codigo.trim() || !accionForm.enunciado.trim()) {
      showErr("Completa código y enunciado de la acción.");
      return;
    }

    const orden = parseIntOrNull(accionForm.orden);
    if (orden === "invalid") {
      showErr("Orden debe ser numérico.");
      return;
    }

    try {
      setSavingAccion(true);

      const payload: AccionCreateUpdateDto = {
        idObjetivo: vista.idObjetivo,
        codigo: accionForm.codigo.trim(),
        enunciado: accionForm.enunciado.trim(),
        orden,
        idUnidadResponsable: vista.idUnidad,
        estado: accionForm.estado,
      };

      await PlaneamientoAction.updateAccion(accionForm.idAccion, payload);
      showOk("Acción actualizada.");
      setOpenEditAccion(false);
      await load();
    } catch (e: unknown) {
      showErr(getErrorMessage(e));
    } finally {
      setSavingAccion(false);
    }
  };

  const openDialogNuevaAccion = () => {
    setNewAccionForm({ codigo: "", enunciado: "", orden: "", estado: "ACTIVO" });
    setOpenNewAccion(true);
  };

  const createAccion = async () => {
    if (!vista) return;

    if (!newAccionForm.codigo.trim() || !newAccionForm.enunciado.trim()) {
      showErr("Completa código y enunciado de la acción.");
      return;
    }

    const orden = parseIntOrNull(newAccionForm.orden);
    if (orden === "invalid") {
      showErr("Orden debe ser numérico.");
      return;
    }

    try {
      setCreatingAccion(true);

      const payload: AccionCreateUpdateDto = {
        idObjetivo: vista.idObjetivo,
        codigo: newAccionForm.codigo.trim(),
        enunciado: newAccionForm.enunciado.trim(),
        orden,
        idUnidadResponsable: vista.idUnidad,
        estado: newAccionForm.estado,
      };

      await PlaneamientoAction.createAccion(payload);
      showOk("Acción creada.");
      setOpenNewAccion(false);
      await load();
    } catch (e: unknown) {
      showErr(getErrorMessage(e));
    } finally {
      setCreatingAccion(false);
    }
  };

  // ======================
  // Indicadores (N a N)
  // ======================
  const openDialogAddIndicador = async (a: AccionConIndicadoresDto) => {
    setIndicForm({ idAccion: a.idAccion, indicador: null });
    setOpenAddIndic(true);

    if (indicadores.length) return;

    try {
      setIndicadoresLoading(true);
      const all = await PlaneamientoAction.getIndicadores();
      setIndicadores(all.filter((x) => (x.estado ?? "ACTIVO") === "ACTIVO"));
    } catch (e: unknown) {
      showErr(getErrorMessage(e));
    } finally {
      setIndicadoresLoading(false);
    }
  };

  const addIndicador = async () => {
    if (!indicForm.idAccion) return;
    if (!indicForm.indicador) {
      showErr("Seleccione un indicador.");
      return;
    }

    try {
      setAddingIndic(true);

      await PdrcObjetivosAccionesIndicadoresAction.addIndicadorToAccion(indicForm.idAccion, {
        idIndicador: indicForm.indicador.idIndicador,
      });

      showOk("Indicador asignado.");
      setOpenAddIndic(false);
      await load();
    } catch (e: unknown) {
      showErr(getErrorMessage(e));
    } finally {
      setAddingIndic(false);
    }
  };

  const askRemoveIndicador = (a: AccionConIndicadoresDto, i: IndicadorItemDto) => {
    setConfirmAccion(a);
    setConfirmIndic(i);
    setConfirmOpen(true);
  };

  const removeIndicador = async () => {
    if (!confirmAccion || !confirmIndic) return;

    try {
      setRemovingIndic(true);

      await PdrcObjetivosAccionesIndicadoresAction.removeIndicadorFromAccion(
        confirmAccion.idAccion,
        confirmIndic.idIndicador
      );

      showOk("Indicador eliminado (inactivado) de la acción.");
      setConfirmOpen(false);
      await load();
    } catch (e: unknown) {
      showErr(getErrorMessage(e));
    } finally {
      setRemovingIndic(false);
    }
  };

  const title = instrumento
    ? `${instrumento.nombre} (${instrumento.codigo})`
    : "PLAN DE DESARROLLO REGIONAL CONCERTADO (PDRC)";

  const totalAcciones = filteredVista?.acciones?.length ?? 0;

  return (
    <Box sx={pageBgSx}>
      {/* ===== Header superior ===== */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 1000, letterSpacing: 0.2 }}>
            {title}: O.E.R. / RESPONSABLES / A.E.R. / INDICADORES
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            Visualiza acciones estratégicas regionales e indicadores por OER y Responsable.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={handleVolver}
            sx={{ borderRadius: 2 }}
          >
            Volver
          </Button>

          <Tooltip title="Actualizar">
            <span>
              <IconButton onClick={load} disabled={loading} sx={{ border: "1px solid #EEF2F7" }}>
                <RefreshRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* ===== Card Cabecera (OER/Responsable) ===== */}
      <Paper sx={{ ...cardSx, mb: 2 }}>
        <Box sx={{ ...headerBarSx, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Typography sx={{ fontWeight: 1000 }}>Cabecera</Typography>
            <Chip
              size="small"
              label={`${totalAcciones} acciones`}
              sx={{ fontWeight: 900, borderRadius: 999 }}
            />
          </Box>

          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            size="small"
            sx={{ width: { xs: "100%", md: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <CircularProgress size={18} />
              <Typography sx={{ color: "text.secondary" }}>Cargando...</Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && !vista && (
            <Alert severity="info">No se encontró la cabecera (OER/Responsable).</Alert>
          )}

          {vista && (
            <TableContainer sx={{ borderRadius: 2, border: "1px solid #EEF2F7" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={thSx}>CÓDIGO</TableCell>
                    <TableCell sx={thSx}>OBJETIVOS ESTRATÉGICOS REGIONALES</TableCell>
                    <TableCell sx={thSx}>código responsable</TableCell>
                    <TableCell sx={thSx}>nombre responsable</TableCell>
                    <TableCell sx={thSx}>ESTADO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow sx={baseRowSx}>
                    <TableCell sx={{ fontWeight: 900, width: 110 }}>{vista.codigoObjetivo}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{vista.oer}</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 140 }}>{vista.codigoUnidad}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{vista.nombreUnidad}</TableCell>
                    <TableCell sx={{ width: 110 }}>
                      <Box sx={pillSx(vista.estadoResponsable)}>{vista.estadoResponsable}</Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* ===== Card Detalle (Acciones/Indicadores) ===== */}
      <Paper sx={cardSx}>
        <Box sx={{ ...headerBarSx, justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 1000 }}>
              PDRC: ACCIONES ESTRATÉGICAS REGIONALES E INDICADORES
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
              Cada acción estratégica regional puede tener uno o más indicadores.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openDialogNuevaAccion}
            sx={{ borderRadius: 2, fontWeight: 900 }}
            disabled={!vista || loading}
          >
            + NUEVA ACCIÓN
          </Button>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          {!filteredVista?.acciones?.length ? (
            <Alert severity="info">No hay acciones para este OER/Responsable.</Alert>
          ) : (
            <TableContainer sx={{ borderRadius: 2, border: "1px solid #EEF2F7" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={thSx}>código</TableCell>
                    <TableCell sx={thSx}>ACCIONES ESTRATÉGICAS REGIONALES</TableCell>
                    <TableCell sx={thSx} align="center">
                      acciones
                    </TableCell>

                    <TableCell sx={thSx}>código</TableCell>
                    <TableCell sx={thSx}>indicadores</TableCell>
                    <TableCell sx={thSx}>estado</TableCell>
                    <TableCell sx={thSx} align="center">
                      acciones
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredVista.acciones.map((a) => {
                    const inds = (a.indicadores?.length ? a.indicadores : [null]) as Array<
                      IndicadorItemDto | null
                    >;

                    return inds.map((i, idx) => (
                      <TableRow key={`${a.idAccion}-${i?.idIndicador ?? "none"}-${idx}`} sx={baseRowSx}>
                        {/* Acción: código */}
                        {idx === 0 && (
                          <TableCell
                            rowSpan={inds.length}
                            sx={{ width: 110, verticalAlign: "middle", fontWeight: 900 }}
                          >
                            <Chip
                              size="small"
                              label={a.codigoAccion}
                              sx={codeChipSx}
                              variant="outlined"
                            />
                          </TableCell>
                        )}

                        {/* Acción: enunciado */}
                        {idx === 0 && (
                          <TableCell rowSpan={inds.length} sx={{ verticalAlign: "middle", fontWeight: 800 }}>
                            {a.accion}
                          </TableCell>
                        )}

                        {/* Acción: botones */}
                        {idx === 0 && (
                          <TableCell rowSpan={inds.length} align="center" sx={{ width: 130 }}>
                            <Tooltip title="Ver acción">
                              <IconButton size="small" onClick={() => onViewAccion(a)}>
                                <VisibilityRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Editar acción">
                              <IconButton size="small" onClick={() => onEditAccion(a)}>
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Nuevo indicador">
                              <IconButton size="small" onClick={() => openDialogAddIndicador(a)}>
                                <AddRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}

                        {/* Indicador: código */}
                        <TableCell sx={{ width: 140 }}>
                          {i ? (
                            <Chip size="small" label={i.codigoIndicador} sx={codeChipSx} variant="outlined" />
                          ) : (
                            <Typography sx={{ color: "text.secondary", fontSize: 12 }}>—</Typography>
                          )}
                        </TableCell>

                        {/* Indicador: nombre */}
                        <TableCell sx={{ fontWeight: 800 }}>
                          {i ? i.indicador : <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Sin indicadores</Typography>}
                        </TableCell>

                        {/* Estado relación */}
                        <TableCell sx={{ width: 110 }}>
                          <Box sx={pillSx(i?.estadoRelacion ?? "ACTIVO")}>{i?.estadoRelacion ?? "—"}</Box>
                        </TableCell>

                        {/* Indicador acciones */}
                        <TableCell align="center" sx={{ width: 90 }}>
                          {i ? (
                            <Tooltip title="Eliminar indicador de la acción">
                              <IconButton
                                size="small"
                                onClick={() => askRemoveIndicador(a, i)}
                                sx={{ color: "#ef4444" }}
                              >
                                <DeleteRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <span />
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* ===== Snackbar simple (mismo patrón de tu página base) ===== */}
      <Dialog open={snack.open} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <DialogTitle sx={{ fontWeight: 1000 }}>{snack.type === "success" ? "OK" : "Error"}</DialogTitle>
        <DialogContent>
          <Typography>{snack.msg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnack((s) => ({ ...s, open: false }))}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog: Ver Acción ===== */}
      <Dialog open={openViewAccion} onClose={() => setOpenViewAccion(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 1000 }}>Ver Acción Estratégica</DialogTitle>
        <DialogContent dividers>
          {!viewAccion ? (
            <Typography sx={{ color: "text.secondary" }}>—</Typography>
          ) : (
            <Box sx={{ display: "grid", gap: 1 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip size="small" label={viewAccion.codigoAccion} sx={codeChipSx} variant="outlined" />
                <Box sx={pillSx(viewAccion.estadoAccion)}>{viewAccion.estadoAccion}</Box>
              </Box>
              <Typography sx={{ fontWeight: 900 }}>{viewAccion.accion}</Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                Indicadores: {viewAccion.indicadores?.length ?? 0}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewAccion(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog: Editar Acción ===== */}
      <Dialog open={openEditAccion} onClose={() => setOpenEditAccion(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 1000 }}>Editar Acción Estratégica</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.25 }}>
            <TextField
              label="Código"
              value={accionForm.codigo}
              onChange={(e) => setAccionForm((s) => ({ ...s, codigo: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Enunciado"
              value={accionForm.enunciado}
              onChange={(e) => setAccionForm((s) => ({ ...s, enunciado: e.target.value }))}
              size="small"
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Orden (opcional)"
              value={accionForm.orden}
              onChange={(e) => setAccionForm((s) => ({ ...s, orden: e.target.value }))}
              size="small"
              fullWidth
            />
            <Autocomplete
              value={accionForm.estado}
              options={["ACTIVO", "INACTIVO"]}
              onChange={(_, v) =>
                setAccionForm((s) => ({ ...s, estado: (v ?? "ACTIVO") as "ACTIVO" | "INACTIVO" }))
              }
              renderInput={(params) => <TextField {...params} label="Estado" size="small" fullWidth />}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditAccion(false)} disabled={savingAccion}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveAccion} disabled={savingAccion}>
            {savingAccion ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog: Nueva Acción ===== */}
      <Dialog open={openNewAccion} onClose={() => setOpenNewAccion(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 1000 }}>Nueva Acción Estratégica</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.25 }}>
            <TextField
              label="Código"
              value={newAccionForm.codigo}
              onChange={(e) => setNewAccionForm((s) => ({ ...s, codigo: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Enunciado"
              value={newAccionForm.enunciado}
              onChange={(e) => setNewAccionForm((s) => ({ ...s, enunciado: e.target.value }))}
              size="small"
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Orden (opcional)"
              value={newAccionForm.orden}
              onChange={(e) => setNewAccionForm((s) => ({ ...s, orden: e.target.value }))}
              size="small"
              fullWidth
            />
            <Autocomplete
              value={newAccionForm.estado}
              options={["ACTIVO", "INACTIVO"]}
              onChange={(_, v) =>
                setNewAccionForm((s) => ({ ...s, estado: (v ?? "ACTIVO") as "ACTIVO" | "INACTIVO" }))
              }
              renderInput={(params) => <TextField {...params} label="Estado" size="small" fullWidth />}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewAccion(false)} disabled={creatingAccion}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={createAccion} disabled={creatingAccion}>
            {creatingAccion ? "Creando..." : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog: Agregar Indicador ===== */}
      <Dialog open={openAddIndic} onClose={() => setOpenAddIndic(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 1000 }}>Asignar Indicador a la Acción</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.25 }}>
            <Autocomplete
              options={indicadores}
              loading={indicadoresLoading}
              value={indicForm.indicador}
              onChange={(_, v) => setIndicForm((s) => ({ ...s, indicador: v }))}
              getOptionLabel={(o) => `${o.codigo} - ${o.nombre}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Indicador"
                  size="small"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {indicadoresLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddIndic(false)} disabled={addingIndic}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={addIndicador} disabled={addingIndic}>
            {addingIndic ? "Asignando..." : "Asignar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Confirm: Eliminar Indicador ===== */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 1000 }}>Confirmar eliminación</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 1 }}>
            Se inactivará la relación <b>Acción - Indicador</b>.
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            Acción: {confirmAccion?.codigoAccion} — {confirmAccion?.accion}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            Indicador: {confirmIndic?.codigoIndicador} — {confirmIndic?.indicador}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={removingIndic}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={removeIndicador}
            disabled={removingIndic}
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            {removingIndic ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
