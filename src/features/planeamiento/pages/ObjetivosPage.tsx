import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import {
  CatalogoAction,
  type DimensionDto,
  type InstrumentoDto,
  type UnidadOrganizacionalDto,
} from "../../catalogos/CatalogoAction";

import {
  PlaneamientoAction,
  type EjeEstrategicoListDto,
  type PoliticaListDto,
  type ObjetivoCreateUpdateDto,
  type ObjetivoListDto,
} from "../PlaneamientoAction";

/** =======================
 * UI helpers
 * ======================= */

const pillSx = (estado?: string | null) => ({
  display: "inline-flex",
  alignItems: "center",
  px: 1,
  py: 0.25,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: "1px solid #E7ECF3",
  bgcolor: estado === "ACTIVO" ? "rgba(16,185,129,.10)" : "rgba(239,68,68,.10)",
});

function LabelValue({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <Box sx={{ display: "grid", gap: 0.35 }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

function instrumentoLabel(i: InstrumentoDto) {
  return `${i.codigo} - ${i.nombre}`;
}

function safeStr(x?: string | null) {
  return (x ?? "").toString();
}

const EMPTY_FORM: ObjetivoCreateUpdateDto = {
  idInstrumento: 0,
  codigo: "",
  enunciado: "",
  descripcion: "",
  tipo: "",
  idDimension: null,
  idEje: null,
  idPolitica: null,
  idUnidadResponsable: null,
  orden: null,
  estado: "ACTIVO",
};

/** =======================
 * Page
 * ======================= */

export default function ObjetivosPage() {
  // master
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<DimensionDto[]>([]);
  const [ejes, setEjes] = useState<EjeEstrategicoListDto[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaListDto[]>([]);
  const [unidades, setUnidades] = useState<UnidadOrganizacionalDto[]>([]);

  const [loadingMaster, setLoadingMaster] = useState(false);
  const [errorMaster, setErrorMaster] = useState<string | null>(null);

  const [qMaster, setQMaster] = useState("");
  const [qDetalle, setQDetalle] = useState("");

  const [pageMaster, setPageMaster] = useState(0);
  const [rppMaster, setRppMaster] = useState(10);

  // expand / detail
  const [expandedInstrumentoId, setExpandedInstrumentoId] = useState<number | null>(null);

  const [detailByInstrumento, setDetailByInstrumento] = useState<Record<number, ObjetivoListDto[]>>(
    {}
  );
  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>({});
  const [detailError, setDetailError] = useState<Record<number, string | null>>({});

  // dialogs
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<ObjetivoListDto | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingRow, setEditingRow] = useState<ObjetivoListDto | null>(null);
  const [formEdit, setFormEdit] = useState<ObjetivoCreateUpdateDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [formCreate, setFormCreate] = useState<ObjetivoCreateUpdateDto>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const lockedInstrumentId = useMemo(() => {
    if (openEdit && editingRow) return editingRow.idInstrumento;
    if (openCreate && formCreate.idInstrumento) return formCreate.idInstrumento;
    return null;
  }, [openEdit, editingRow, openCreate, formCreate.idInstrumento]);

  /** =======================
   * Load master data
   * ======================= */
  const loadMaster = async () => {
    try {
      setLoadingMaster(true);
      setErrorMaster(null);

      const [inst, dims, ej, pol, uni] = await Promise.all([
        CatalogoAction.getInstrumentosEje(),
        CatalogoAction.getDimensiones(),
        PlaneamientoAction.getEjesEstrategicos(),
        PlaneamientoAction.getPoliticas(),
        CatalogoAction.getUnidadesOrganizacionales(),
      ]);

      setInstrumentos(inst);
      setDimensiones(dims);
      setEjes(ej);
      setPoliticas(pol);
      setUnidades(uni);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando datos maestros";
      setErrorMaster(msg);
    } finally {
      setLoadingMaster(false);
    }
  };

  useEffect(() => {
    void loadMaster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** =======================
   * Detail loader
   * ======================= */
  const loadObjetivosByInstrumento = async (idInstrumento: number, force = false) => {
    const already = detailByInstrumento[idInstrumento];
    if (!force && already && Array.isArray(already)) return;

    try {
      setDetailLoading((p) => ({ ...p, [idInstrumento]: true }));
      setDetailError((p) => ({ ...p, [idInstrumento]: null }));

      const data = await PlaneamientoAction.getObjetivosByInstrumento(idInstrumento);
      setDetailByInstrumento((p) => ({ ...p, [idInstrumento]: data }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando objetivos";
      setDetailError((p) => ({ ...p, [idInstrumento]: msg }));
    } finally {
      setDetailLoading((p) => ({ ...p, [idInstrumento]: false }));
    }
  };

  const toggleExpand = async (idInstrumento: number) => {
    if (expandedInstrumentoId === idInstrumento) {
      setExpandedInstrumentoId(null);
      return;
    }
    setExpandedInstrumentoId(idInstrumento);
    setQDetalle("");
    await loadObjetivosByInstrumento(idInstrumento, false);
  };

  /** =======================
   * Master filtering / paging
   * ======================= */
  const instrumentosFiltrados = useMemo(() => {
    const q = qMaster.trim().toLowerCase();
    if (!q) return instrumentos;

    return instrumentos.filter((i) => {
      const blob = [
        i.codigo,
        i.nombre,
        i.nivel ?? "",
        i.horizonteTemporal ?? "",
        i.estado ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [instrumentos, qMaster]);

  const instrumentosPaginados = useMemo(() => {
    const start = pageMaster * rppMaster;
    return instrumentosFiltrados.slice(start, start + rppMaster);
  }, [instrumentosFiltrados, pageMaster, rppMaster]);

  /** =======================
   * Combo helpers
   * ======================= */
  const ejesPorInstrumento = useMemo(() => {
    const map: Record<number, EjeEstrategicoListDto[]> = {};
    for (const eje of ejes) {
      const k = eje.idInstrumento;
      if (!map[k]) map[k] = [];
      map[k].push(eje);
    }
    return map;
  }, [ejes]);

  const politicasPorInstrumento = useMemo(() => {
    const map: Record<number, PoliticaListDto[]> = {};
    for (const p of politicas) {
      const k = p.idInstrumento;
      if (!map[k]) map[k] = [];
      map[k].push(p);
    }
    return map;
  }, [politicas]);

  const dimensionesMap = useMemo(() => {
    const map: Record<number, DimensionDto> = {};
    for (const d of dimensiones) map[d.idDimension] = d;
    return map;
  }, [dimensiones]);

  const unidadesMap = useMemo(() => {
    const map: Record<number, UnidadOrganizacionalDto> = {};
    for (const u of unidades) map[u.idUnidad] = u;
    return map;
  }, [unidades]);

  /** =======================
   * Dialog handlers
   * ======================= */
  const openViewDialog = (row: ObjetivoListDto) => {
    setViewRow(row);
    setOpenView(true);
  };

  const openEditDialog = (row: ObjetivoListDto) => {
    setSaveError(null);
    setEditingRow(row);

    setFormEdit({
      idInstrumento: row.idInstrumento,
      codigo: row.codigo ?? "",
      enunciado: row.enunciado ?? "",
      descripcion: "",
      tipo: "",
      idDimension: null,
      idEje: row.idEje ?? null,
      idPolitica: row.idPolitica ?? null,
      idUnidadResponsable: row.idUnidadResponsable ?? null,
      orden: row.orden ?? null,
      estado: row.estado ?? "ACTIVO",
    });

    setOpenEdit(true);
  };

  const openCreateForInstrumento = (idInstrumento: number) => {
    setCreateError(null);
    setFormCreate({ ...EMPTY_FORM, idInstrumento });
    setOpenCreate(true);
  };

  const openCreateGlobal = () => {
    setCreateError(null);
    setFormCreate({ ...EMPTY_FORM, idInstrumento: expandedInstrumentoId ?? 0 });
    setOpenCreate(true);
  };

  /** =======================
   * Save / Create
   * ======================= */
  const requiredEditOk =
    formEdit.idInstrumento > 0 &&
    formEdit.codigo.trim() !== "" &&
    formEdit.enunciado.trim() !== "";

  const saveEdit = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updateObjetivo(editingRow.idObjetivo, formEdit);

      setOpenEdit(false);
      await loadObjetivosByInstrumento(editingRow.idInstrumento, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const requiredCreateOk =
    formCreate.idInstrumento > 0 &&
    formCreate.codigo.trim() !== "" &&
    formCreate.enunciado.trim() !== "";

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      await PlaneamientoAction.createObjetivo(formCreate);

      setOpenCreate(false);
      setExpandedInstrumentoId(formCreate.idInstrumento);
      setQDetalle("");
      await loadObjetivosByInstrumento(formCreate.idInstrumento, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo registrar";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  /** =======================
   * Render
   * ======================= */

  return (
    <Box sx={{ p: 2.5 }}>
      {/* Header */}
      <Box
        sx={{
          display: "grid",
          gap: 1.2,
          mb: 2,
          p: 2.2,
          borderRadius: 2.5,
          border: "1px solid #E7ECF3",
          bgcolor: "background.paper",
          boxShadow: "0 10px 30px rgba(16,24,40,.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 950, letterSpacing: -0.3 }}>
              Planeamiento: Objetivos por Instrumento
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.4 }}>
              Maestro: Instrumentos. Expande un instrumento para gestionar sus objetivos.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={`${instrumentosFiltrados.length} instrumentos`}
              variant="outlined"
              sx={{ fontWeight: 900 }}
            />

            <Tooltip title="Refrescar">
              <span>
                <IconButton onClick={() => void loadMaster()} disabled={loadingMaster}>
                  <RefreshRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={openCreateGlobal}
              sx={{ fontWeight: 900, borderRadius: 2 }}
            >
              NUEVO OBJETIVO
            </Button>
          </Box>
        </Box>

        <TextField
          value={qMaster}
          onChange={(e) => {
            setQMaster(e.target.value);
            setPageMaster(0);
          }}
          placeholder="Buscar instrumento (código / nombre / nivel / horizonte)..."
          InputProps={{
            startAdornment: (
              <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
                <SearchRoundedIcon fontSize="small" />
              </Box>
            ),
          }}
          fullWidth
        />

        {errorMaster && (
          <Alert severity="error" sx={{ fontWeight: 700 }}>
            {errorMaster}
          </Alert>
        )}
      </Box>

      {/* Master Table */}
      <Box
        sx={{
          borderRadius: 2.5,
          border: "1px solid #E7ECF3",
          bgcolor: "background.paper",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(16,24,40,.05)",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(17, 24, 39, 0.02)" }}>
              <TableCell width={54} />
              <TableCell sx={{ fontWeight: 900 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 900 }} width={160}>
                Nivel
              </TableCell>
              <TableCell sx={{ fontWeight: 900 }} width={140}>
                Horizonte
              </TableCell>
              <TableCell sx={{ fontWeight: 900 }} width={120}>
                Estado
              </TableCell>
              <TableCell sx={{ fontWeight: 900 }} width={260} align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {instrumentosPaginados.map((inst) => {
              const expanded = expandedInstrumentoId === inst.idInstrumento;

              const det = detailByInstrumento[inst.idInstrumento] ?? [];
              const detLoading = detailLoading[inst.idInstrumento] ?? false;
              const detErr = detailError[inst.idInstrumento] ?? null;

              const qd = qDetalle.trim().toLowerCase();
              const detFiltrado =
                !qd
                  ? det
                  : det.filter((o) =>
                      [
                        o.codigo ?? "",
                        o.enunciado ?? "",
                        o.nombreEje ?? "",
                        o.nombrePolitica ?? "",
                        o.nombreDimension ?? "",
                        o.nombreUnidadResponsable ?? "",
                        o.estado ?? "",
                      ]
                        .join(" ")
                        .toLowerCase()
                        .includes(qd)
                    );

              return (
                <Fragment key={inst.idInstrumento}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton onClick={() => void toggleExpand(inst.idInstrumento)} size="small">
                        {expanded ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                      </IconButton>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 900 }}>{inst.codigo}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{inst.nombre}</TableCell>
                    <TableCell>{inst.nivel ?? "—"}</TableCell>
                    <TableCell>{inst.horizonteTemporal ?? "—"}</TableCell>

                    <TableCell>
                      <Box sx={pillSx(inst.estado)}>{inst.estado}</Box>
                    </TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={
                            typeof detailByInstrumento[inst.idInstrumento]?.length === "number"
                              ? `${detailByInstrumento[inst.idInstrumento]!.length} objetivos`
                              : "— objetivos"
                          }
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 900 }}
                        />

                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddRoundedIcon />}
                          sx={{ fontWeight: 900, borderRadius: 2 }}
                          onClick={() => openCreateForInstrumento(inst.idInstrumento)}
                        >
                          AGREGAR
                        </Button>

                        <Tooltip title="Refrescar objetivos">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => void loadObjetivosByInstrumento(inst.idInstrumento, true)}
                              disabled={detLoading}
                            >
                              <RefreshRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, borderBottom: expanded ? "1px solid #EEF2F7" : "none" }}>
                      <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2 }}>
                          {/* Header detalle estilo premium */}
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ display: "grid", gap: 0.25 }}>
                              <Typography sx={{ fontSize: 18, fontWeight: 950 }}>
                                Objetivos del instrumento: {inst.codigo} - {inst.nombre}
                              </Typography>
                              <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700 }}>
                                Ver / editar / agregar objetivos sin salir del instrumento.
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <TextField
                                size="small"
                                placeholder="Buscar objetivo..."
                                value={qDetalle}
                                onChange={(e) => setQDetalle(e.target.value)}
                                InputProps={{
                                  startAdornment: (
                                    <Box sx={{ display: "flex", alignItems: "center", pr: 1 }}>
                                      <SearchRoundedIcon fontSize="small" />
                                    </Box>
                                  ),
                                }}
                                sx={{ width: 320 }}
                              />

                              <Chip label={`${det.length} objetivos`} variant="outlined" sx={{ fontWeight: 900 }} />

                              <Tooltip title="Refrescar objetivos">
                                <span>
                                  <IconButton
                                    onClick={() => void loadObjetivosByInstrumento(inst.idInstrumento, true)}
                                    disabled={detLoading}
                                  >
                                    <RefreshRoundedIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Button
                                variant="contained"
                                startIcon={<AddRoundedIcon />}
                                sx={{ fontWeight: 900, borderRadius: 2 }}
                                onClick={() => openCreateForInstrumento(inst.idInstrumento)}
                              >
                                NUEVO OBJETIVO
                              </Button>
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1.5 }} />

                          {detErr && (
                            <Alert severity="error" sx={{ mb: 1.5, fontWeight: 700 }}>
                              {detErr}
                            </Alert>
                          )}

                          {detLoading ? (
                            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                              Cargando objetivos...
                            </Typography>
                          ) : det.length === 0 ? (
                            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                              No hay objetivos registrados para este instrumento.
                            </Typography>
                          ) : detFiltrado.length === 0 ? (
                            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                              Sin resultados para “{qDetalle.trim()}”.
                            </Typography>
                          ) : (
                            <Box sx={{ borderRadius: 2, border: "1px solid #EEF2F7", overflow: "hidden" }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "rgba(17, 24, 39, 0.02)" }}>
                                    <TableCell sx={{ fontWeight: 900 }} width={140}>
                                      Código
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Enunciado</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={220}>
                                      Eje
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={220}>
                                      Política
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={220}>
                                      Unidad
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={90}>
                                      Orden
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={120}>
                                      Estado
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={140} align="right">
                                      Acciones
                                    </TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {detFiltrado.map((o) => (
                                    <TableRow key={o.idObjetivo} hover>
                                      <TableCell sx={{ fontWeight: 900 }}>{o.codigo}</TableCell>
                                      <TableCell sx={{ fontWeight: 800 }}>{o.enunciado}</TableCell>
                                      <TableCell>{o.nombreEje ?? "—"}</TableCell>
                                      <TableCell>{o.nombrePolitica ?? "—"}</TableCell>
                                      <TableCell>{o.nombreUnidadResponsable ?? "—"}</TableCell>
                                      <TableCell>{o.orden ?? "—"}</TableCell>
                                      <TableCell>
                                        <Box sx={pillSx(o.estado)}>{o.estado}</Box>
                                      </TableCell>

                                      <TableCell align="right">
                                        <Tooltip title="Ver">
                                          <IconButton onClick={() => openViewDialog(o)} size="small">
                                            <VisibilityRoundedIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                          <IconButton onClick={() => openEditDialog(o)} size="small">
                                            <EditRoundedIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}

            {instrumentosPaginados.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6 }}>
                  <Typography sx={{ textAlign: "center", color: "text.secondary", fontWeight: 800 }}>
                    {loadingMaster ? "Cargando..." : "Sin instrumentos para mostrar"}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={instrumentosFiltrados.length}
          page={pageMaster}
          onPageChange={(_, p) => setPageMaster(p)}
          rowsPerPage={rppMaster}
          onRowsPerPageChange={(e) => {
            setRppMaster(parseInt(e.target.value, 10));
            setPageMaster(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
          labelRowsPerPage="Filas por página:"
        />
      </Box>

      {/* =======================
          VIEW DIALOG
      ======================= */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Detalle de Objetivo
          <IconButton onClick={() => setOpenView(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <LabelValue label="Código" value={viewRow.codigo} />
              <LabelValue label="Orden" value={viewRow.orden ?? "—"} />
              <LabelValue label="Estado" value={<Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Enunciado" value={viewRow.enunciado} />
              </Box>

              <LabelValue label="Instrumento" value={viewRow.nombreInstrumento ?? `#${viewRow.idInstrumento}`} />
              <LabelValue label="Eje" value={viewRow.nombreEje ?? "—"} />
              <LabelValue label="Política" value={viewRow.nombrePolitica ?? "—"} />

              <LabelValue label="Dimensión" value={viewRow.nombreDimension ?? "—"} />
              <LabelValue label="Unidad Responsable" value={viewRow.nombreUnidadResponsable ?? "—"} />
              <Box />
            </Box>
          ) : (
            <Typography color="text.secondary">—</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* =======================
          EDIT DIALOG
      ======================= */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>Editar Objetivo</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Instrumento"
              select
              value={formEdit.idInstrumento}
              onChange={(e) =>
                setFormEdit((p) => ({
                  ...p,
                  idInstrumento: Number(e.target.value),
                  idEje: null,
                  idPolitica: null,
                }))
              }
              fullWidth
              disabled={lockedInstrumentId !== null}
            >
              <MenuItem value={0} disabled>
                Seleccione...
              </MenuItem>
              {instrumentos.map((x) => (
                <MenuItem key={x.idInstrumento} value={x.idInstrumento}>
                  {instrumentoLabel(x)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Eje (opcional)"
              select
              value={formEdit.idEje ?? ""}
              onChange={(e) =>
                setFormEdit((p) => ({
                  ...p,
                  idEje: e.target.value === "" ? null : Number(e.target.value),
                  idPolitica: null,
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {(ejesPorInstrumento[formEdit.idInstrumento] ?? []).map((x) => (
                <MenuItem key={x.idEje} value={x.idEje}>
                  {x.codigo} - {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Política (opcional)"
              select
              value={formEdit.idPolitica ?? ""}
              onChange={(e) =>
                setFormEdit((p) => ({
                  ...p,
                  idPolitica: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {(politicasPorInstrumento[formEdit.idInstrumento] ?? [])
                .filter((p) => (formEdit.idEje ? p.idEje === formEdit.idEje : true))
                .map((x) => (
                  <MenuItem key={x.idPolitica} value={x.idPolitica}>
                    {x.codigo} - {x.nombre}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              label="Dimensión (opcional)"
              select
              value={formEdit.idDimension ?? ""}
              onChange={(e) =>
                setFormEdit((p) => ({
                  ...p,
                  idDimension: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {dimensiones.map((d) => (
                <MenuItem key={d.idDimension} value={d.idDimension}>
                  {d.codigo ? `${d.codigo} - ${d.nombre}` : d.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Unidad Responsable (opcional)"
              select
              value={formEdit.idUnidadResponsable ?? ""}
              onChange={(e) =>
                setFormEdit((p) => ({
                  ...p,
                  idUnidadResponsable: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {unidades.map((u) => (
                <MenuItem key={u.idUnidad} value={u.idUnidad}>
                  {u.codigo ? `${u.codigo} - ${u.nombre}` : u.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Código"
              value={formEdit.codigo}
              onChange={(e) => setFormEdit((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Enunciado"
              value={formEdit.enunciado}
              onChange={(e) => setFormEdit((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Tipo (opcional)"
              value={safeStr(formEdit.tipo)}
              onChange={(e) => setFormEdit((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Orden"
              type="number"
              value={formEdit.orden ?? ""}
              onChange={(e) =>
                setFormEdit((p) => ({
                  ...p,
                  orden: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            />

            <TextField
              label="Descripción"
              value={safeStr(formEdit.descripcion)}
              onChange={(e) => setFormEdit((p) => ({ ...p, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Estado"
              select
              value={formEdit.estado}
              onChange={(e) => setFormEdit((p) => ({ ...p, estado: e.target.value }))}
              fullWidth
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>

            {saveError && (
              <Alert severity="error" sx={{ fontWeight: 800 }}>
                {saveError}
              </Alert>
            )}

            {formEdit.idDimension && dimensionesMap[formEdit.idDimension] && (
              <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: 12.5 }}>
                Dimensión seleccionada:{" "}
                <b>
                  {dimensionesMap[formEdit.idDimension].codigo} - {dimensionesMap[formEdit.idDimension].nombre}
                </b>
              </Typography>
            )}

            {formEdit.idUnidadResponsable && unidadesMap[formEdit.idUnidadResponsable] && (
              <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: 12.5 }}>
                Unidad seleccionada:{" "}
                <b>
                  {unidadesMap[formEdit.idUnidadResponsable].codigo
                    ? `${unidadesMap[formEdit.idUnidadResponsable].codigo} - `
                    : ""}
                  {unidadesMap[formEdit.idUnidadResponsable].nombre}
                </b>
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => void saveEdit()} variant="contained" disabled={!requiredEditOk || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================
          CREATE DIALOG
      ======================= */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>Nuevo Objetivo</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Instrumento"
              select
              value={formCreate.idInstrumento}
              onChange={(e) =>
                setFormCreate((p) => ({
                  ...p,
                  idInstrumento: Number(e.target.value),
                  idEje: null,
                  idPolitica: null,
                }))
              }
              fullWidth
              disabled={lockedInstrumentId !== null}
            >
              <MenuItem value={0} disabled>
                Seleccione...
              </MenuItem>
              {instrumentos.map((x) => (
                <MenuItem key={x.idInstrumento} value={x.idInstrumento}>
                  {instrumentoLabel(x)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Eje (opcional)"
              select
              value={formCreate.idEje ?? ""}
              onChange={(e) =>
                setFormCreate((p) => ({
                  ...p,
                  idEje: e.target.value === "" ? null : Number(e.target.value),
                  idPolitica: null,
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {(ejesPorInstrumento[formCreate.idInstrumento] ?? []).map((x) => (
                <MenuItem key={x.idEje} value={x.idEje}>
                  {x.codigo} - {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Política (opcional)"
              select
              value={formCreate.idPolitica ?? ""}
              onChange={(e) =>
                setFormCreate((p) => ({
                  ...p,
                  idPolitica: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {(politicasPorInstrumento[formCreate.idInstrumento] ?? [])
                .filter((p) => (formCreate.idEje ? p.idEje === formCreate.idEje : true))
                .map((x) => (
                  <MenuItem key={x.idPolitica} value={x.idPolitica}>
                    {x.codigo} - {x.nombre}
                  </MenuItem>
                ))}
            </TextField>

            <TextField
              label="Dimensión (opcional)"
              select
              value={formCreate.idDimension ?? ""}
              onChange={(e) =>
                setFormCreate((p) => ({
                  ...p,
                  idDimension: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {dimensiones.map((d) => (
                <MenuItem key={d.idDimension} value={d.idDimension}>
                  {d.codigo ? `${d.codigo} - ${d.nombre}` : d.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Unidad Responsable (opcional)"
              select
              value={formCreate.idUnidadResponsable ?? ""}
              onChange={(e) =>
                setFormCreate((p) => ({
                  ...p,
                  idUnidadResponsable: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {unidades.map((u) => (
                <MenuItem key={u.idUnidad} value={u.idUnidad}>
                  {u.codigo ? `${u.codigo} - ${u.nombre}` : u.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Código"
              value={formCreate.codigo}
              onChange={(e) => setFormCreate((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Enunciado"
              value={formCreate.enunciado}
              onChange={(e) => setFormCreate((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Tipo (opcional)"
              value={safeStr(formCreate.tipo)}
              onChange={(e) => setFormCreate((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Orden"
              type="number"
              value={formCreate.orden ?? ""}
              onChange={(e) =>
                setFormCreate((p) => ({
                  ...p,
                  orden: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            />

            <TextField
              label="Descripción"
              value={safeStr(formCreate.descripcion)}
              onChange={(e) => setFormCreate((p) => ({ ...p, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Estado"
              select
              value={formCreate.estado}
              onChange={(e) => setFormCreate((p) => ({ ...p, estado: e.target.value }))}
              fullWidth
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>

            {createError && (
              <Alert severity="error" sx={{ fontWeight: 800 }}>
                {createError}
              </Alert>
            )}

            {formCreate.idDimension && dimensionesMap[formCreate.idDimension] && (
              <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: 12.5 }}>
                Dimensión seleccionada:{" "}
                <b>
                  {dimensionesMap[formCreate.idDimension].codigo} - {dimensionesMap[formCreate.idDimension].nombre}
                </b>
              </Typography>
            )}

            {formCreate.idUnidadResponsable && unidadesMap[formCreate.idUnidadResponsable] && (
              <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: 12.5 }}>
                Unidad seleccionada:{" "}
                <b>
                  {unidadesMap[formCreate.idUnidadResponsable].codigo
                    ? `${unidadesMap[formCreate.idUnidadResponsable].codigo} - `
                    : ""}
                  {unidadesMap[formCreate.idUnidadResponsable].nombre}
                </b>
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={() => void create()} variant="contained" disabled={!requiredCreateOk || creating}>
            {creating ? "Registrando..." : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
