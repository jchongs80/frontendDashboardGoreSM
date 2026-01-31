import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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

import { CatalogoAction, type InstrumentoDto, type UnidadOrganizacionalDto } from "../../catalogos/CatalogoAction";

import {
  PlaneamientoAction,
  type AccionCreateUpdateDto,
  type AccionListDto,
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

function objetivoLabel(o: ObjetivoListDto) {
  return `${o.codigo} - ${o.enunciado}`;
}

function safeStr(v?: string | null) {
  return (v ?? "").toString();
}

const EMPTY_FORM: AccionCreateUpdateDto = {
  idObjetivo: 0,
  codigo: "",
  enunciado: "",
  descripcion: "",
  tipo: "",
  idUnidadResponsable: null,
  orden: null,
  presupuestoEstimado: null,
  estado: "ACTIVO",
};

function normalizePayload(p: AccionCreateUpdateDto): AccionCreateUpdateDto {
  const desc = safeStr(p.descripcion).trim();
  const tipo = safeStr(p.tipo).trim();
  return {
    ...p,
    descripcion: desc === "" ? null : desc,
    tipo: tipo === "" ? null : tipo,
  };
}

/** =======================
 * Page
 * ======================= */

export default function AccionesPage() {
  // master
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [unidades, setUnidades] = useState<UnidadOrganizacionalDto[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [errorMaster, setErrorMaster] = useState<string | null>(null);

  const [qMaster, setQMaster] = useState("");
  const [pageMaster, setPageMaster] = useState(0);
  const [rppMaster, setRppMaster] = useState(10);

  // expand / detail
  const [expandedInstrumentoId, setExpandedInstrumentoId] = useState<number | null>(null);

  const [accionesByInstrumento, setAccionesByInstrumento] = useState<Record<number, AccionListDto[]>>({});
  const [objetivosByInstrumento, setObjetivosByInstrumento] = useState<Record<number, ObjetivoListDto[]>>({});

  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>({});
  const [detailError, setDetailError] = useState<Record<number, string | null>>({});

  // dialogs
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<AccionListDto | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editInstrumentoId, setEditInstrumentoId] = useState<number>(0);
  const [editingRow, setEditingRow] = useState<AccionListDto | null>(null);
  const [formEdit, setFormEdit] = useState<AccionCreateUpdateDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [createInstrumentoId, setCreateInstrumentoId] = useState<number>(0);
  const [formCreate, setFormCreate] = useState<AccionCreateUpdateDto>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /** =======================
   * Load master
   * ======================= */

  const loadMaster = useCallback(async () => {
    try {
      setLoadingMaster(true);
      setErrorMaster(null);

      const [inst, uni] = await Promise.all([
        CatalogoAction.getInstrumentos(),
        CatalogoAction.getUnidadesOrganizacionales(),
      ]);

      setInstrumentos(inst);
      setUnidades(uni);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando instrumentos";
      setErrorMaster(msg);
    } finally {
      setLoadingMaster(false);
    }
  }, []);

  useEffect(() => {
    void loadMaster();
  }, [loadMaster]);

  /** =======================
   * Detail loaders
   * ======================= */

  const loadDetalleInstrumento = useCallback(async (idInstrumento: number, force = false) => {
    const alreadyAcc = accionesByInstrumento[idInstrumento];
    const alreadyObj = objetivosByInstrumento[idInstrumento];

    if (!force && Array.isArray(alreadyAcc) && Array.isArray(alreadyObj)) return;

    try {
      setDetailLoading((p) => ({ ...p, [idInstrumento]: true }));
      setDetailError((p) => ({ ...p, [idInstrumento]: null }));

      const [acc, obj] = await Promise.all([
        PlaneamientoAction.getAccionesByInstrumento(idInstrumento),
        PlaneamientoAction.getObjetivosByInstrumento(idInstrumento),
      ]);

      setAccionesByInstrumento((p) => ({ ...p, [idInstrumento]: acc }));
      setObjetivosByInstrumento((p) => ({ ...p, [idInstrumento]: obj }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando acciones/objetivos";
      setDetailError((p) => ({ ...p, [idInstrumento]: msg }));
    } finally {
      setDetailLoading((p) => ({ ...p, [idInstrumento]: false }));
    }
  }, [accionesByInstrumento, objetivosByInstrumento]);

  const toggleExpand = (idInstrumento: number) => {
    setExpandedInstrumentoId((prev) => (prev === idInstrumento ? null : idInstrumento));
  };

  useEffect(() => {
    if (expandedInstrumentoId) {
      void loadDetalleInstrumento(expandedInstrumentoId, false);
    }
  }, [expandedInstrumentoId, loadDetalleInstrumento]);

  /** =======================
   * Master filtering / paging
   * ======================= */

  const instrumentosFiltrados = useMemo(() => {
    const q = qMaster.trim().toLowerCase();
    if (!q) return instrumentos;

    return instrumentos.filter((i) => {
      const blob = [i.codigo, i.nombre, i.nivel ?? "", i.horizonteTemporal ?? "", i.estado ?? ""]
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
   * Maps / combos
   * ======================= */

  const unidadesMap = useMemo(() => {
    const map: Record<number, UnidadOrganizacionalDto> = {};
    for (const u of unidades) map[u.idUnidad] = u;
    return map;
  }, [unidades]);

  const objetivosFor = (idInstrumento: number) => objetivosByInstrumento[idInstrumento] ?? [];
  const accionesFor = (idInstrumento: number) => accionesByInstrumento[idInstrumento] ?? [];

  /** =======================
   * Dialog handlers
   * ======================= */

  const openViewDialog = (row: AccionListDto) => {
    setViewRow(row);
    setOpenView(true);
  };

  const openCreateForInstrumento = async (idInstrumento: number) => {
    setCreateError(null);
    setCreateInstrumentoId(idInstrumento);
    setFormCreate({ ...EMPTY_FORM });

    setOpenCreate(true);

    // asegurar objetivos cargados (y de paso acciones si quieres cache)
    await loadDetalleInstrumento(idInstrumento, false);
  };

  const openEditDialog = async (idInstrumento: number, row: AccionListDto) => {
    setSaveError(null);
    setEditInstrumentoId(idInstrumento);
    setEditingRow(row);

    setFormEdit({
      idObjetivo: row.idObjetivo,
      codigo: row.codigo ?? "",
      enunciado: row.enunciado ?? "",
      descripcion: "",
      tipo: "",
      idUnidadResponsable: row.idUnidadResponsable ?? null,
      orden: row.orden ?? null,
      presupuestoEstimado: row.presupuestoEstimado ?? null,
      estado: row.estado ?? "ACTIVO",
    });

    setOpenEdit(true);

    await loadDetalleInstrumento(idInstrumento, false);
  };

  /** =======================
   * Create / Save
   * ======================= */

  const requiredCreateOk =
    formCreate.idObjetivo > 0 &&
    formCreate.codigo.trim() !== "" &&
    formCreate.enunciado.trim() !== "" &&
    createInstrumentoId > 0;

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      const payload = normalizePayload(formCreate);
      await PlaneamientoAction.createAccion(payload);

      setOpenCreate(false);

      // refrescar detalle del instrumento
      setExpandedInstrumentoId(createInstrumentoId);
      await loadDetalleInstrumento(createInstrumentoId, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo registrar";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const requiredEditOk =
    formEdit.idObjetivo > 0 &&
    formEdit.codigo.trim() !== "" &&
    formEdit.enunciado.trim() !== "" &&
    editInstrumentoId > 0;

  const saveEdit = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload = normalizePayload(formEdit);
      await PlaneamientoAction.updateAccion(editingRow.idAccion, payload);

      setOpenEdit(false);

      await loadDetalleInstrumento(editInstrumentoId, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar";
      setSaveError(msg);
    } finally {
      setSaving(false);
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
              Planeamiento: Acciones por Instrumento
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.4 }}>
              Maestro: Instrumentos. Expande un instrumento para ver/crear/editar acciones.
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
                <IconButton onClick={loadMaster} disabled={loadingMaster}>
                  <RefreshRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>
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
              <TableCell sx={{ fontWeight: 900 }} width={180} align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {instrumentosPaginados.map((inst) => {
              const expanded = expandedInstrumentoId === inst.idInstrumento;

              const det = accionesFor(inst.idInstrumento);
              const detLoading = detailLoading[inst.idInstrumento] ?? false;
              const detErr = detailError[inst.idInstrumento] ?? null;

              return (
                <Fragment key={inst.idInstrumento}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton onClick={() => toggleExpand(inst.idInstrumento)} size="small">
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
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<AddRoundedIcon />}
                        sx={{ fontWeight: 900, borderRadius: 2 }}
                        onClick={() => void openCreateForInstrumento(inst.idInstrumento)}
                      >
                        Crear
                      </Button>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, borderBottom: expanded ? "1px solid #EEF2F7" : "none" }}>
                      <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ display: "grid" }}>
                              <Typography sx={{ fontWeight: 950 }}>Acciones del instrumento</Typography>
                              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                                {instrumentoLabel(inst)}
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Chip label={`${det.length} acciones`} variant="outlined" sx={{ fontWeight: 900 }} />

                              <Tooltip title="Refrescar acciones/objetivos">
                                <span>
                                  <IconButton
                                    onClick={() => void loadDetalleInstrumento(inst.idInstrumento, true)}
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
                                onClick={() => void openCreateForInstrumento(inst.idInstrumento)}
                              >
                                Nueva acción
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
                              Cargando acciones...
                            </Typography>
                          ) : det.length === 0 ? (
                            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                              No hay acciones registradas para este instrumento.
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
                                    <TableCell sx={{ fontWeight: 900 }} width={260}>
                                      Objetivo
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={220}>
                                      Unidad Resp.
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={90}>
                                      Orden
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={140}>
                                      Presupuesto
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
                                  {det.map((a) => (
                                    <TableRow key={a.idAccion} hover>
                                      <TableCell sx={{ fontWeight: 900 }}>{a.codigo}</TableCell>
                                      <TableCell sx={{ fontWeight: 800 }}>{a.enunciado}</TableCell>
                                      <TableCell>{a.nombreObjetivo ?? `#${a.idObjetivo}`}</TableCell>
                                      <TableCell>{a.nombreUnidadResponsable ?? "—"}</TableCell>
                                      <TableCell>{a.orden ?? "—"}</TableCell>
                                      <TableCell>
                                        {a.presupuestoEstimado == null ? "—" : a.presupuestoEstimado}
                                      </TableCell>
                                      <TableCell>
                                        <Box sx={pillSx(a.estado)}>{a.estado}</Box>
                                      </TableCell>

                                      <TableCell align="right">
                                        <Tooltip title="Ver">
                                          <IconButton onClick={() => openViewDialog(a)} size="small">
                                            <VisibilityRoundedIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                          <IconButton
                                            onClick={() => void openEditDialog(inst.idInstrumento, a)}
                                            size="small"
                                          >
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
          Detalle de Acción
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

              <LabelValue label="Objetivo" value={viewRow.nombreObjetivo ?? `#${viewRow.idObjetivo}`} />
              <LabelValue label="Instrumento" value={viewRow.nombreInstrumento ?? (viewRow.idInstrumento ? `#${viewRow.idInstrumento}` : "—")} />
              <LabelValue label="Unidad Resp." value={viewRow.nombreUnidadResponsable ?? "—"} />

              <LabelValue label="Presupuesto" value={viewRow.presupuestoEstimado ?? "—"} />
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
        <DialogTitle sx={{ fontWeight: 950 }}>Editar Acción</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Objetivo"
              select
              value={formEdit.idObjetivo}
              onChange={(e) => setFormEdit((p) => ({ ...p, idObjetivo: Number(e.target.value) }))}
              fullWidth
            >
              <MenuItem value={0} disabled>
                Seleccione...
              </MenuItem>
              {objetivosFor(editInstrumentoId).map((o) => (
                <MenuItem key={o.idObjetivo} value={o.idObjetivo}>
                  {objetivoLabel(o)}
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
                  {u.codigo} - {u.nombre}
                </MenuItem>
              ))}
            </TextField>

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
              label="Presupuesto estimado"
              type="number"
              value={formEdit.presupuestoEstimado ?? ""}
              onChange={(e) =>
                setFormEdit((p) => ({
                  ...p,
                  presupuestoEstimado: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            />

            <TextField
              label="Tipo (opcional)"
              value={safeStr(formEdit.tipo)}
              onChange={(e) => setFormEdit((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Descripción (opcional)"
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
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={saveEdit} variant="contained" disabled={!requiredEditOk || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================
          CREATE DIALOG
      ======================= */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950 }}>Nueva Acción</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Objetivo"
              select
              value={formCreate.idObjetivo}
              onChange={(e) => setFormCreate((p) => ({ ...p, idObjetivo: Number(e.target.value) }))}
              fullWidth
            >
              <MenuItem value={0} disabled>
                Seleccione...
              </MenuItem>
              {objetivosFor(createInstrumentoId).map((o) => (
                <MenuItem key={o.idObjetivo} value={o.idObjetivo}>
                  {objetivoLabel(o)}
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
                  {u.codigo} - {u.nombre}
                </MenuItem>
              ))}
            </TextField>

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
              label="Presupuesto estimado"
              type="number"
              value={formCreate.presupuestoEstimado ?? ""}
              onChange={(e) =>
                setFormCreate((p) => ({
                  ...p,
                  presupuestoEstimado: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            />

            <TextField
              label="Tipo (opcional)"
              value={safeStr(formCreate.tipo)}
              onChange={(e) => setFormCreate((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Descripción (opcional)"
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

            {formCreate.idUnidadResponsable && unidadesMap[formCreate.idUnidadResponsable] && (
              <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: 12.5 }}>
                Unidad seleccionada:{" "}
                <b>
                  {unidadesMap[formCreate.idUnidadResponsable].codigo} - {unidadesMap[formCreate.idUnidadResponsable].nombre}
                </b>
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={create} variant="contained" disabled={!requiredCreateOk || creating}>
            {creating ? "Registrando..." : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
