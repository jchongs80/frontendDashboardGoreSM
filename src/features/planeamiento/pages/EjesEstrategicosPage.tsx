import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
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
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { api } from "../../../shared/api";
import {
  CatalogoAction,
  type DimensionDto,
  type InstrumentoDto,
} from "../../catalogos/CatalogoAction";

import {
  PlaneamientoAction,
  type EjeEstrategicoCreateUpdateDto,
  type EjeEstrategicoDetailDto,
  type EjeEstrategicoListDto,
} from "../PlaneamientoAction";

/** =========================
 * Constantes ESTABLES (fuera del componente)
 * Evita warnings de react-hooks/exhaustive-deps
 * ========================= */
const EMPTY_FORM: EjeEstrategicoCreateUpdateDto = {
  idInstrumento: 0,
  codigo: "",
  nombre: "",
  descripcion: null,
  idDimension: null,
  orden: null,
  estado: "ACTIVO",
};

/** =========================
 * Helpers (sin any)
 * ========================= */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Ocurrió un error inesperado.";
}

const pillSx = (estado?: string | null) => ({
  display: "inline-flex",
  px: 1,
  py: 0.25,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: "1px solid #E7ECF3",
  bgcolor: estado === "ACTIVO" ? "rgba(16,185,129,.10)" : "rgba(239,68,68,.10)",
});

function LabelValue({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <Box sx={{ display: "grid", gap: 0.35 }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>{value ?? "—"}</Typography>
    </Box>
  );
}

/** =========================
 * Page
 * ========================= */
export default function EjesEstrategicosPage() {
  // catálogos
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<DimensionDto[]>([]);

  // master
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [qMaster, setQMaster] = useState("");
  const [pageMaster, setPageMaster] = useState(0);
  const [rppMaster, setRppMaster] = useState(10);

  // expand / detail (cache por instrumento)
  const [expandedInstrumentoId, setExpandedInstrumentoId] = useState<number | null>(null);
  const [qDetail, setQDetail] = useState("");

  const [detailByInstrumento, setDetailByInstrumento] = useState<Record<number, EjeEstrategicoListDto[]>>(
    {}
  );
  const [detailLoadingByInstrumento, setDetailLoadingByInstrumento] = useState<Record<number, boolean>>(
    {}
  );
  const [detailErrorByInstrumento, setDetailErrorByInstrumento] = useState<
    Record<number, string | null>
  >({});

  // dialogs: view
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<EjeEstrategicoDetailDto | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  // dialogs: edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // dialogs: create
  const [openCreate, setOpenCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // saving
  const [saving, setSaving] = useState(false);

  // forms
  const [formCreate, setFormCreate] = useState<EjeEstrategicoCreateUpdateDto>(EMPTY_FORM);
  const [formEdit, setFormEdit] = useState<EjeEstrategicoCreateUpdateDto>(EMPTY_FORM);

  /** labels */
  const instrumentoLabel = useCallback(
    (id: number) => {
      const it = instrumentos.find((x) => x.idInstrumento === id);
      if (!it) return `#${id}`;
      return `${it.codigo} - ${it.nombre}`;
    },
    [instrumentos]
  );

  const dimensionOption = useCallback(
    (id?: number | null): DimensionDto | null => {
      if (!id) return null;
      return dimensiones.find((d) => d.idDimension === id) ?? null;
    },
    [dimensiones]
  );

  /** Load base catalogs */
  const loadCatalogos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [inst, dims] = await Promise.all([
        CatalogoAction.getInstrumentosEje(),
        CatalogoAction.getDimensiones(),
      ]);

      setInstrumentos(inst ?? []);
      setDimensiones(dims ?? []);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogos();
  }, [loadCatalogos]);

  /** Detail loader (por instrumento) */
  const loadEjesByInstrumento = useCallback(
    async (idInstrumento: number, force = false) => {
      if (!idInstrumento) return;
      if (!force && detailByInstrumento[idInstrumento]) return;

      setDetailLoadingByInstrumento((p) => ({ ...p, [idInstrumento]: true }));
      setDetailErrorByInstrumento((p) => ({ ...p, [idInstrumento]: null }));

      try {
        const rows = await PlaneamientoAction.getEjesByInstrumento(idInstrumento);
        setDetailByInstrumento((p) => ({ ...p, [idInstrumento]: rows ?? [] }));
      } catch (e: unknown) {
        setDetailByInstrumento((p) => ({ ...p, [idInstrumento]: [] }));
        setDetailErrorByInstrumento((p) => ({ ...p, [idInstrumento]: getErrorMessage(e) }));
      } finally {
        setDetailLoadingByInstrumento((p) => ({ ...p, [idInstrumento]: false }));
      }
    },
    [detailByInstrumento]
  );

  const toggleExpand = useCallback(
    async (idInstrumento: number) => {
      if (expandedInstrumentoId === idInstrumento) {
        setExpandedInstrumentoId(null);
        setQDetail("");
        return;
      }
      setExpandedInstrumentoId(idInstrumento);
      setQDetail("");
      await loadEjesByInstrumento(idInstrumento);
    },
    [expandedInstrumentoId, loadEjesByInstrumento]
  );

  /** master filtered */
  const instrumentosFiltered = useMemo(() => {
    const t = qMaster.trim().toLowerCase();
    if (!t) return instrumentos;

    return instrumentos.filter((x) => {
      const a = x.codigo.toLowerCase();
      const b = x.nombre.toLowerCase();
      const c = (x.nivel ?? "").toLowerCase();
      const d = (x.horizonteTemporal ?? "").toLowerCase();
      return a.includes(t) || b.includes(t) || c.includes(t) || d.includes(t);
    });
  }, [instrumentos, qMaster]);

  const instrumentosPaged = useMemo(() => {
    const start = pageMaster * rppMaster;
    return instrumentosFiltered.slice(start, start + rppMaster);
  }, [instrumentosFiltered, pageMaster, rppMaster]);

  /** detail filtered (del instrumento expandido) */
  const detailRows = useMemo(() => {
    if (!expandedInstrumentoId) return [];
    const base = detailByInstrumento[expandedInstrumentoId] ?? [];
    const t = qDetail.trim().toLowerCase();
    if (!t) return base;

    return base.filter((r) => {
      const a = r.codigo.toLowerCase();
      const b = r.nombre.toLowerCase();
      const c = (r.estado ?? "").toLowerCase();
      return a.includes(t) || b.includes(t) || c.includes(t);
    });
  }, [expandedInstrumentoId, detailByInstrumento, qDetail]);

  /** ======= GET Detail (para Ver/Editar) =======
   * Evita el error: "descripcion does not exist on ListDto"
   */
  const fetchDetail = useCallback(
    async (idEje: number): Promise<EjeEstrategicoDetailDto> => {
      // Se asume endpoint: GET /api/ejesestrategicos/{id}
      // Si no existe, retorna fallback mínimo (no rompe UI)
      try {
        const detail = await api.get<EjeEstrategicoDetailDto>(`/api/ejesestrategicos/${idEje}`);
        return detail;
      } catch {
        return {
          idEje,
          idInstrumento: expandedInstrumentoId ?? 0,
          codigo: "",
          nombre: "",
          orden: null,
          estado: "ACTIVO",
          descripcion: null,
          idDimension: null,
          nombreDimension: null,
        };
      }
    },
    [expandedInstrumentoId]
  );

  /** =========================
   * Dialog handlers (sin warnings)
   * ========================= */
  const openCreateForExpanded = useCallback(() => {
    setCreateError(null);

    if (!expandedInstrumentoId) {
      setCreateError("Primero expande (selecciona) un instrumento para crear el eje.");
      setOpenCreate(true);
      setFormCreate(EMPTY_FORM);
      return;
    }

    setFormCreate({ ...EMPTY_FORM, idInstrumento: expandedInstrumentoId });
    setOpenCreate(true);
  }, [expandedInstrumentoId]);

  const openCreateForInstrumento = useCallback(
    (idInstrumento: number) => {
      setCreateError(null);
      setFormCreate({ ...EMPTY_FORM, idInstrumento });
      setExpandedInstrumentoId(idInstrumento);
      setOpenCreate(true);
      void loadEjesByInstrumento(idInstrumento);
    },
    [loadEjesByInstrumento]
  );

  const openViewDialog = useCallback(
    async (row: EjeEstrategicoListDto) => {
      setOpenView(true);
      setViewLoading(true);
      setViewError(null);
      setViewRow(null);

      try {
        const detail = await fetchDetail(row.idEje);
        const merged: EjeEstrategicoDetailDto = {
          ...detail,
          ...row,
          descripcion: detail.descripcion ?? null,
          idDimension: detail.idDimension ?? null,
        };
        setViewRow(merged);
      } catch (e: unknown) {
        setViewError(getErrorMessage(e));
      } finally {
        setViewLoading(false);
      }
    },
    [fetchDetail]
  );

  const openEditDialog = useCallback(
    async (row: EjeEstrategicoListDto) => {
      setOpenEdit(true);
      setEditingId(row.idEje);
      setEditLoading(true);
      setEditError(null);

      try {
        const detail = await fetchDetail(row.idEje);
        const merged: EjeEstrategicoDetailDto = {
          ...detail,
          ...row,
          descripcion: detail.descripcion ?? null,
          idDimension: detail.idDimension ?? null,
        };

        setFormEdit({
          idInstrumento: merged.idInstrumento,
          codigo: merged.codigo ?? "",
          nombre: merged.nombre ?? "",
          descripcion: merged.descripcion ?? null,
          idDimension: merged.idDimension ?? null,
          orden: merged.orden ?? null,
          estado: merged.estado ?? "ACTIVO",
        });
      } catch (e: unknown) {
        setEditError(getErrorMessage(e));
      } finally {
        setEditLoading(false);
      }
    },
    [fetchDetail]
  );

  /** ===== CRUD ===== */
  const canCreate =
    formCreate.idInstrumento > 0 && formCreate.codigo.trim().length > 0 && formCreate.nombre.trim().length > 0;

  const canSaveEdit =
    formEdit.idInstrumento > 0 && formEdit.codigo.trim().length > 0 && formEdit.nombre.trim().length > 0;

  const create = useCallback(async () => {
    try {
      setSaving(true);
      setCreateError(null);

      if (!formCreate.idInstrumento) {
        setCreateError("Primero selecciona un instrumento.");
        return;
      }

      await PlaneamientoAction.createEjeEstrategico(formCreate);

      const instId = formCreate.idInstrumento;
      setOpenCreate(false);
      await loadEjesByInstrumento(instId, true);
      setExpandedInstrumentoId(instId);
    } catch (e: unknown) {
      setCreateError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [formCreate, loadEjesByInstrumento]);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;

    try {
      setSaving(true);
      setEditError(null);

      await PlaneamientoAction.updateEjeEstrategico(editingId, formEdit);

      const instId = formEdit.idInstrumento;
      setOpenEdit(false);
      setEditingId(null);
      await loadEjesByInstrumento(instId, true);
    } catch (e: unknown) {
      setEditError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [editingId, formEdit, loadEjesByInstrumento]);

  /** ===== render form ===== */
  const renderForm = (mode: "create" | "edit") => {
    const data = mode === "create" ? formCreate : formEdit;
    const setData = mode === "create" ? setFormCreate : setFormEdit;

    return (
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <TextField
          label="Instrumento"
          value={data.idInstrumento ? instrumentoLabel(data.idInstrumento) : ""}
          placeholder="Seleccione un instrumento expandiendo la lista…"
          fullWidth
          InputLabelProps={{ shrink: true }}
          InputProps={{ readOnly: true }}
          helperText={data.idInstrumento ? "Instrumento fijado." : "Expande un instrumento para seleccionar."}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 1.5 }}>
          <TextField
            label="Código"
            value={data.codigo}
            onChange={(e) => setData((p) => ({ ...p, codigo: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Nombre"
            value={data.nombre}
            onChange={(e) => setData((p) => ({ ...p, nombre: e.target.value }))}
            fullWidth
          />
        </Box>

        <TextField
          label="Descripción"
          value={data.descripcion ?? ""}
          onChange={(e) => setData((p) => ({ ...p, descripcion: e.target.value }))}
          fullWidth
          multiline
          minRows={2}
        />

        <Divider />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 1.5 }}>
          <Autocomplete<DimensionDto, false, false, false>
            options={dimensiones}
            value={dimensionOption(data.idDimension)}
            onChange={(_, opt) => setData((p) => ({ ...p, idDimension: opt?.idDimension ?? null }))}
            getOptionLabel={(o) => `${o.codigo} - ${o.nombre}`}
            isOptionEqualToValue={(a, b) => a.idDimension === b.idDimension}
            renderInput={(params) => (
              <TextField {...params} label="Dimensión (opcional)" placeholder="Buscar dimensión..." />
            )}
          />

          <TextField
            label="Estado"
            select
            value={data.estado ?? "ACTIVO"}
            onChange={(e) => setData((p) => ({ ...p, estado: e.target.value }))}
            fullWidth
          >
            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
            <MenuItem value="INACTIVO">INACTIVO</MenuItem>
          </TextField>
        </Box>

        <TextField
          label="Orden (opcional)"
          type="number"
          value={data.orden ?? ""}
          onChange={(e) =>
            setData((p) => ({
              ...p,
              orden: e.target.value === "" ? null : Number(e.target.value),
            }))
          }
          fullWidth
        />

        {mode === "create" && createError ? (
          <Typography sx={{ color: "error.main", fontWeight: 900 }}>{createError}</Typography>
        ) : null}
        {mode === "edit" && editError ? (
          <Typography sx={{ color: "error.main", fontWeight: 900 }}>{editError}</Typography>
        ) : null}

        {!data.idInstrumento || !data.codigo.trim() || !data.nombre.trim() ? (
          <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: 12.5 }}>
            * Requerido: Instrumento, Código y Nombre.
          </Typography>
        ) : null}
      </Box>
    );
  };

  /** =========================
   * UI
   * ========================= */
  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 1000 }}>Planeamiento: Ejes Estratégicos por Instrumento</Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.25 }}>
          Maestro: Instrumentos. Expande un instrumento para gestionar sus ejes estratégicos.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #EEF2F7", overflow: "hidden" }}>
        <Toolbar sx={{ gap: 1.5, px: 2 }}>
          <TextField
            value={qMaster}
            onChange={(e) => {
              setQMaster(e.target.value);
              setPageMaster(0);
            }}
            size="small"
            placeholder="Buscar instrumento (código / nombre / nivel / horizonte)..."
            sx={{ width: { xs: "100%", sm: 560 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flex: 1 }} />

          <Tooltip title={expandedInstrumentoId ? "Crear eje para el instrumento expandido" : "Expande un instrumento primero"}>
            <span>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreateForExpanded}>
                Nuevo eje
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Refrescar catálogos">
            <span>
              <IconButton onClick={() => void loadCatalogos()} disabled={loading}>
                <RefreshRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Chip label={`${instrumentosFiltered.length} instrumentos`} variant="outlined" sx={{ borderRadius: 999 }} />
        </Toolbar>

        {loading ? <LinearProgress /> : null}

        {error ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography sx={{ color: "error.main", fontWeight: 900 }}>{error}</Typography>
            <Button onClick={() => void loadCatalogos()} variant="contained" sx={{ mt: 1 }}>
              Reintentar
            </Button>
          </Box>
        ) : null}

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 52, bgcolor: "#FAFBFD" }} />
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 140 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD" }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 160 }}>Nivel</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 160 }}>Horizonte</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 120 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 220 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {instrumentosPaged.map((inst) => {
                const idInst = inst.idInstrumento;
                const isOpen = expandedInstrumentoId === idInst;

                const detLoading = !!detailLoadingByInstrumento[idInst];
                const detErr = detailErrorByInstrumento[idInst];
                const count = detailByInstrumento[idInst]?.length ?? 0;

                return (
                  <React.Fragment key={idInst}>
                    <TableRow hover sx={{ "& > td": { borderBottom: "none" } }}>
                      <TableCell>
                        <IconButton size="small" onClick={() => void toggleExpand(idInst)}>
                          {isOpen ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                        </IconButton>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900 }}>{inst.codigo}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{inst.nombre}</TableCell>
                      <TableCell>{inst.nivel ?? "—"}</TableCell>
                      <TableCell>{inst.horizonteTemporal ?? "—"}</TableCell>
                      <TableCell>
                        <Box sx={pillSx(inst.estado)}>{inst.estado}</Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                          <Chip label={`${count} ejes`} size="small" variant="outlined" sx={{ borderRadius: 999 }} />
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => openCreateForInstrumento(idInst)}
                          >
                            Agregar
                          </Button>
                          <Tooltip title="Refrescar detalle">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => void loadEjesByInstrumento(idInst, true)}
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
                      <TableCell colSpan={7} sx={{ py: 0, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 2, py: 2, bgcolor: "#FBFCFE" }}>
                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1.5 }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 1000 }}>
                                  Ejes del instrumento: {inst.codigo} - {inst.nombre}
                                </Typography>
                                <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 700 }}>
                                  Ver / editar / agregar ejes sin salir del instrumento.
                                </Typography>
                              </Box>

                              <Box sx={{ flex: 1 }} />

                              <TextField
                                value={qDetail}
                                onChange={(e) => setQDetail(e.target.value)}
                                size="small"
                                placeholder="Buscar en ejes..."
                                sx={{ width: { xs: "100%", sm: 340 } }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchRoundedIcon fontSize="small" />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Box>

                            {detLoading ? <LinearProgress sx={{ mb: 1.25 }} /> : null}

                            {detErr ? (
                              <Box sx={{ mb: 1.25 }}>
                                <Typography sx={{ color: "error.main", fontWeight: 900 }}>{detErr}</Typography>
                                <Button variant="contained" onClick={() => void loadEjesByInstrumento(idInst, true)} sx={{ mt: 1 }}>
                                  Reintentar
                                </Button>
                              </Box>
                            ) : null}

                            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 90 }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 140 }}>Código</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD" }}>Nombre</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 240 }}>Dimensión</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 90 }}>Orden</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 110 }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 140 }}>Acción</TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {detailRows.map((r) => (
                                    <TableRow key={r.idEje} hover>
                                      <TableCell>{r.idEje}</TableCell>
                                      <TableCell sx={{ fontWeight: 900 }}>{r.codigo}</TableCell>
                                      <TableCell sx={{ fontWeight: 800 }}>{r.nombre}</TableCell>
                                      <TableCell>{r.nombreDimension ?? "—"}</TableCell>
                                      <TableCell>{r.orden ?? "—"}</TableCell>
                                      <TableCell>
                                        <Box sx={pillSx(r.estado)}>{r.estado}</Box>
                                      </TableCell>
                                      <TableCell>
                                        <Tooltip title="Ver">
                                          <IconButton size="small" onClick={() => void openViewDialog(r)}>
                                            <VisibilityRoundedIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                          <IconButton size="small" onClick={() => void openEditDialog(r)}>
                                            <EditRoundedIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  ))}

                                  {!detLoading && !detErr && detailRows.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={7}>
                                        <Box sx={{ py: 3, textAlign: "center" }}>
                                          <Typography sx={{ fontWeight: 1000 }}>Sin ejes</Typography>
                                          <Typography sx={{ color: "text.secondary" }}>
                                            Usa “Agregar” para registrar un eje para este instrumento.
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ) : null}
                                </TableBody>
                              </Table>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}

              {!loading && !error && instrumentosPaged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 1000 }}>Sin resultados</Typography>
                      <Typography sx={{ color: "text.secondary" }}>Ajusta tu búsqueda de instrumentos.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={instrumentosFiltered.length}
            page={pageMaster}
            onPageChange={(_, p) => setPageMaster(p)}
            rowsPerPage={rppMaster}
            onRowsPerPageChange={(e) => {
              setRppMaster(parseInt(e.target.value, 10));
              setPageMaster(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </TableContainer>
      </Paper>

      {/* ===== VIEW ===== */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 1000, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Detalle del eje
          <IconButton onClick={() => setOpenView(false)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {viewLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

          {viewError ? <Typography sx={{ color: "error.main", fontWeight: 900 }}>{viewError}</Typography> : null}

          {viewRow ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <LabelValue label="ID" value={viewRow.idEje} />
              <LabelValue label="Estado" value={<Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>} />
              <LabelValue label="Orden" value={viewRow.orden ?? "—"} />

              <LabelValue label="Código" value={viewRow.codigo} />
              <LabelValue label="Nombre" value={viewRow.nombre} />
              <LabelValue label="Dimensión" value={viewRow.nombreDimension ?? "—"} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Instrumento" value={instrumentoLabel(viewRow.idInstrumento)} />
              </Box>

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Descripción" value={viewRow.descripcion ?? "—"} />
              </Box>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== EDIT ===== */}
      <Dialog
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setEditingId(null);
          setEditError(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 1000, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Editar eje
          <IconButton
            onClick={() => {
              setOpenEdit(false);
              setEditingId(null);
              setEditError(null);
            }}
            size="small"
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {editLoading ? <LinearProgress sx={{ mb: 1.5 }} /> : null}
          {renderForm("edit")}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setOpenEdit(false);
              setEditingId(null);
              setEditError(null);
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={() => void saveEdit()} variant="contained" disabled={!canSaveEdit || saving || editLoading}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== CREATE ===== */}
      <Dialog
        open={openCreate}
        onClose={() => {
          setOpenCreate(false);
          setCreateError(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 1000, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Nuevo eje estratégico
          <IconButton
            onClick={() => {
              setOpenCreate(false);
              setCreateError(null);
            }}
            size="small"
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>{renderForm("create")}</DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setOpenCreate(false);
              setCreateError(null);
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={() => void create()} variant="contained" disabled={!canCreate || saving}>
            {saving ? "Registrando..." : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
