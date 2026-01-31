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
} from "../../catalogos/CatalogoAction";

import {
  PlaneamientoAction,
  type EjeEstrategicoListDto,
  type PoliticaCreateUpdateDto,
  type PoliticaListDto,
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

function LabelValue({
  label,
  value,
}: {
  label: string;
  value?: ReactNode;
}) {
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

const EMPTY_FORM: PoliticaCreateUpdateDto = {
  idInstrumento: 0,
  codigo: "",
  nombre: "",
  descripcion: "",
  idDimension: null,
  idEje: null,
  orden: null,
  estado: "ACTIVO",
};

function instrumentoLabel(i: InstrumentoDto) {
  return `${i.codigo} - ${i.nombre}`;
}

function safeStr(x?: string | null) {
  return (x ?? "").toString();
}

/** =======================
 * Page
 * ======================= */

export default function PoliticasPage() {
  // master
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<DimensionDto[]>([]);
  const [ejes, setEjes] = useState<EjeEstrategicoListDto[]>([]);

  const [loadingMaster, setLoadingMaster] = useState(false);
  const [errorMaster, setErrorMaster] = useState<string | null>(null);

  const [qMaster, setQMaster] = useState("");
  const [qDetalle, setQDetalle] = useState("");

  const [pageMaster, setPageMaster] = useState(0);
  const [rppMaster, setRppMaster] = useState(10);

  // expand / detail
  const [expandedInstrumentoId, setExpandedInstrumentoId] = useState<number | null>(null);

  const [detailByInstrumento, setDetailByInstrumento] = useState<Record<number, PoliticaListDto[]>>(
    {}
  );
  const [detailLoading, setDetailLoading] = useState<Record<number, boolean>>({});
  const [detailError, setDetailError] = useState<Record<number, string | null>>({});

  // dialogs
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<PoliticaListDto | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingRow, setEditingRow] = useState<PoliticaListDto | null>(null);
  const [formEdit, setFormEdit] = useState<PoliticaCreateUpdateDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [formCreate, setFormCreate] = useState<PoliticaCreateUpdateDto>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const lockedInstrumentId = useMemo(() => {
    if (openEdit && editingRow) return editingRow.idInstrumento;
    if (openCreate && formCreate.idInstrumento) return formCreate.idInstrumento;
    return null;
  }, [openEdit, editingRow, openCreate, formCreate.idInstrumento]);

  /** =======================
   * Load master
   * ======================= */
  const loadMaster = async () => {
    try {
      setLoadingMaster(true);
      setErrorMaster(null);

      const [inst, dims, e] = await Promise.all([
        CatalogoAction.getInstrumentos(),
        CatalogoAction.getDimensiones(),
        PlaneamientoAction.getEjesEstrategicos(),
      ]);

      setInstrumentos(inst);
      setDimensiones(dims);
      setEjes(e);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando instrumentos";
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
  const loadPoliticasByInstrumento = async (idInstrumento: number, force = false) => {
    const already = detailByInstrumento[idInstrumento];
    if (!force && already && Array.isArray(already)) return;

    try {
      setDetailLoading((p) => ({ ...p, [idInstrumento]: true }));
      setDetailError((p) => ({ ...p, [idInstrumento]: null }));

      const data = await PlaneamientoAction.getPoliticasByInstrumento(idInstrumento);
      setDetailByInstrumento((p) => ({ ...p, [idInstrumento]: data }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cargando políticas";
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
    await loadPoliticasByInstrumento(idInstrumento, false);
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

  const dimensionesMap = useMemo(() => {
    const map: Record<number, DimensionDto> = {};
    for (const d of dimensiones) map[d.idDimension] = d;
    return map;
  }, [dimensiones]);

  /** =======================
   * Dialog handlers
   * ======================= */
  const openViewDialog = (row: PoliticaListDto) => {
    setViewRow(row);
    setOpenView(true);
  };

  const openEditDialog = (row: PoliticaListDto) => {
    setSaveError(null);
    setEditingRow(row);

    setFormEdit({
      idInstrumento: row.idInstrumento,
      codigo: row.codigo ?? "",
      nombre: row.nombre ?? "",
      descripcion: "",
      idDimension: null,
      idEje: row.idEje ?? null,
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
    formEdit.idInstrumento > 0 && formEdit.codigo.trim() !== "" && formEdit.nombre.trim() !== "";

  const saveEdit = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updatePolitica(editingRow.idPolitica, formEdit);

      setOpenEdit(false);
      await loadPoliticasByInstrumento(editingRow.idInstrumento, true);
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
    formCreate.nombre.trim() !== "";

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      await PlaneamientoAction.createPolitica(formCreate);

      setOpenCreate(false);

      setExpandedInstrumentoId(formCreate.idInstrumento);
      setQDetalle("");
      await loadPoliticasByInstrumento(formCreate.idInstrumento, true);
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
              Planeamiento: Políticas por Instrumento
            </Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.4 }}>
              Maestro: Instrumentos. Expande un instrumento para gestionar sus políticas.
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

            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={openCreateGlobal}
              sx={{ fontWeight: 900, borderRadius: 2 }}
            >
              NUEVA POLÍTICA
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
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
        </Box>

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
              <TableCell sx={{ fontWeight: 900 }} width={220} align="right">
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
                  : det.filter((p) =>
                      [
                        p.codigo ?? "",
                        p.nombre ?? "",
                        p.nombreEje ?? "",
                        p.nombreDimension ?? "",
                        p.estado ?? "",
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
                              ? `${detailByInstrumento[inst.idInstrumento]!.length} políticas`
                              : "— políticas"
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

                        <Tooltip title="Refrescar políticas">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => void loadPoliticasByInstrumento(inst.idInstrumento, true)}
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
                          {/* Header detalle estilo Ejes */}
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ display: "grid", gap: 0.25 }}>
                              <Typography sx={{ fontSize: 18, fontWeight: 950 }}>
                                Políticas del instrumento: {inst.codigo} - {inst.nombre}
                              </Typography>
                              <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 700 }}>
                                Ver / editar / agregar políticas sin salir del instrumento.
                              </Typography>
                            </Box>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <TextField
                                size="small"
                                placeholder="Buscar política..."
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

                              <Chip label={`${det.length} políticas`} variant="outlined" sx={{ fontWeight: 900 }} />

                              <Tooltip title="Refrescar políticas">
                                <span>
                                  <IconButton
                                    onClick={() => void loadPoliticasByInstrumento(inst.idInstrumento, true)}
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
                                NUEVA POLÍTICA
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
                              Cargando políticas...
                            </Typography>
                          ) : det.length === 0 ? (
                            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                              No hay políticas registradas para este instrumento.
                            </Typography>
                          ) : detFiltrado.length === 0 ? (
                            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                              Sin resultados para “{qDetalle.trim()}”.
                            </Typography>
                          ) : (
                            <Box
                              sx={{
                                borderRadius: 2,
                                border: "1px solid #EEF2F7",
                                overflow: "hidden",
                              }}
                            >
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "rgba(17, 24, 39, 0.02)" }}>
                                    <TableCell sx={{ fontWeight: 900 }} width={140}>
                                      Código
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Nombre</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={220}>
                                      Eje
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} width={180}>
                                      Dimensión
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
                                  {detFiltrado.map((p) => (
                                    <TableRow key={p.idPolitica} hover>
                                      <TableCell sx={{ fontWeight: 900 }}>{p.codigo}</TableCell>
                                      <TableCell sx={{ fontWeight: 800 }}>{p.nombre}</TableCell>
                                      <TableCell>{p.nombreEje ?? "—"}</TableCell>
                                      <TableCell>{p.nombreDimension ?? "—"}</TableCell>
                                      <TableCell>{p.orden ?? "—"}</TableCell>
                                      <TableCell>
                                        <Box sx={pillSx(p.estado)}>{p.estado}</Box>
                                      </TableCell>

                                      <TableCell align="right">
                                        <Tooltip title="Ver">
                                          <IconButton onClick={() => openViewDialog(p)} size="small">
                                            <VisibilityRoundedIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                          <IconButton onClick={() => openEditDialog(p)} size="small">
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
          Detalle de Política
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
                <LabelValue label="Nombre" value={viewRow.nombre} />
              </Box>

              <LabelValue
                label="Instrumento"
                value={viewRow.nombreInstrumento ?? `#${viewRow.idInstrumento}`}
              />
              <LabelValue label="Eje" value={viewRow.nombreEje ?? "—"} />
              <LabelValue label="Dimensión" value={viewRow.nombreDimension ?? "—"} />
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
        <DialogTitle sx={{ fontWeight: 950 }}>Editar Política</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Instrumento"
              select
              value={formEdit.idInstrumento}
              onChange={(e) => setFormEdit((p) => ({ ...p, idInstrumento: Number(e.target.value) }))}
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
                  {d.codigo} - {d.nombre}
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
              label="Nombre"
              value={formEdit.nombre}
              onChange={(e) => setFormEdit((p) => ({ ...p, nombre: e.target.value }))}
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
        <DialogTitle sx={{ fontWeight: 950 }}>Nueva Política</DialogTitle>
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
                  {d.codigo} - {d.nombre}
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
              label="Nombre"
              value={formCreate.nombre}
              onChange={(e) => setFormCreate((p) => ({ ...p, nombre: e.target.value }))}
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
                  {dimensionesMap[formCreate.idDimension].codigo} -{" "}
                  {dimensionesMap[formCreate.idDimension].nombre}
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
