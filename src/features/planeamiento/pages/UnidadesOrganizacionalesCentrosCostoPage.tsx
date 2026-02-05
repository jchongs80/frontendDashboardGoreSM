import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
  Select,
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
  Typography
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { UnidadesOrgCentroCostoAction } from "../UnidadesOrgCentroCostoAction";
import type {
  CentroCostoCreateUpdateDto,
  CentroCostoDto,
  UnidadEjecutoraDto,
  UnidadOrganizacionalDto
} from "../UnidadesOrgCentroCostoAction";

/** =========================
 * Helpers (sin any)
 * ========================= */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;

  if (isRecord(err)) {
    const msg = err["message"];
    if (typeof msg === "string" && msg.trim()) return msg;

    const errors = err["errors"];
    if (Array.isArray(errors) && errors.length) {
      const first = errors[0];
      if (typeof first === "string" && first.trim()) return first;
    }
  }
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
  bgcolor: estado === "ACTIVO" ? "rgba(16,185,129,.10)" : "rgba(239,68,68,.10)"
});

type DetailState = {
  loading: boolean;
  loaded: boolean;
  data: CentroCostoDto[];
  error?: string;
};

type DetailCache = Record<number, DetailState>;

type ModalForm = {
  codigo: string;
  nombre: string;
  idUnidadResponsable: number | null;
  idUnidadEjecutora: number | null;
  estado: "ACTIVO" | "INACTIVO";
};

type FormErrors = Partial<Record<"codigo" | "nombre" | "idUnidadResponsable", string>>;

export default function UnidadesOrganizacionalesCentrosCostoPage() {
  /** master */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [unidades, setUnidades] = useState<UnidadOrganizacionalDto[]>([]);
  const [qMaster, setQMaster] = useState("");
  const [pageMaster, setPageMaster] = useState(0);
  const [rppMaster, setRppMaster] = useState(10);

  /** expand/detail */
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [qDetail, setQDetail] = useState("");

  const [details, setDetails] = useState<DetailCache>({});
  const detailsRef = useRef<DetailCache>({});
  useEffect(() => {
    detailsRef.current = details;
  }, [details]);

  /** UE catalog */
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<UnidadEjecutoraDto[]>([]);
  const [ueLoading, setUeLoading] = useState(false);
  const [ueLoaded, setUeLoaded] = useState(false);
  const [ueError, setUeError] = useState<string>("");

  /** modal create/edit */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUnidad, setModalUnidad] = useState<UnidadOrganizacionalDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [editIdCentroCosto, setEditIdCentroCosto] = useState<number | null>(null);

  const [form, setForm] = useState<ModalForm>({
    codigo: "",
    nombre: "",
    idUnidadResponsable: null,
    idUnidadEjecutora: null,
    estado: "ACTIVO"
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formApiError, setFormApiError] = useState("");

  /** confirm delete */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ccToDelete, setCcToDelete] = useState<CentroCostoDto | null>(null);

  /** =========================
   * Load master
   * ========================= */
  const loadUnidades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const rows = await UnidadesOrgCentroCostoAction.getUnidadesOrg(true);
      setUnidades(rows ?? []);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUnidades();
  }, [loadUnidades]);

  /** =========================
   * Detail loader con force
   * ========================= */
  const ensureCentrosCosto = useCallback(async (idUnidad: number, force = false) => {
    const current = detailsRef.current[idUnidad];

    if (current?.loading) return;
    if (current?.loaded && !force) return;

    setDetails((prev) => ({
      ...prev,
      [idUnidad]: { ...(prev[idUnidad] ?? { data: [] }), loading: true, loaded: false }
    }));

    try {
      const rows = await UnidadesOrgCentroCostoAction.getCentrosCostoByUnidad(idUnidad, true);
      setDetails((prev) => ({
        ...prev,
        [idUnidad]: { loading: false, loaded: true, data: rows ?? [] }
      }));
    } catch (e: unknown) {
      setDetails((prev) => ({
        ...prev,
        [idUnidad]: { loading: false, loaded: false, data: [], error: getErrorMessage(e) }
      }));
    }
  }, []);

  const toggleExpand = useCallback(
    async (idUnidad: number) => {
      if (expandedId === idUnidad) {
        setExpandedId(null);
        setQDetail("");
        return;
      }
      setExpandedId(idUnidad);
      setQDetail("");
      await ensureCentrosCosto(idUnidad);
    },
    [expandedId, ensureCentrosCosto]
  );

  /** =========================
   * UE catalog
   * ========================= */
  const ensureUnidadesEjecutoras = useCallback(async () => {
    if (ueLoaded || ueLoading) return;

    setUeLoading(true);
    setUeError("");
    try {
      const list = await UnidadesOrgCentroCostoAction.getUnidadesEjecutoras(true);
      setUnidadesEjecutoras(list ?? []);
      setUeLoaded(true);
    } catch (e: unknown) {
      setUeError(getErrorMessage(e));
    } finally {
      setUeLoading(false);
    }
  }, [ueLoaded, ueLoading]);

  /** =========================
   * Filtering + paging (master)
   * ========================= */
  const unidadesFiltered = useMemo(() => {
    const t = qMaster.trim().toLowerCase();
    if (!t) return unidades;

    return unidades.filter((u) => {
      const a = (u.codigo ?? "").toLowerCase();
      const b = (u.nombre ?? "").toLowerCase();
      const c = (u.siglas ?? "").toLowerCase();
      const d = (u.tipo ?? "").toLowerCase();
      const e = (u.responsable ?? "").toLowerCase();
      return a.includes(t) || b.includes(t) || c.includes(t) || d.includes(t) || e.includes(t);
    });
  }, [unidades, qMaster]);

  const unidadesPaged = useMemo(() => {
    const start = pageMaster * rppMaster;
    return unidadesFiltered.slice(start, start + rppMaster);
  }, [unidadesFiltered, pageMaster, rppMaster]);

  /** =========================
   * Detail filtered (expanded only)
   * ========================= */
  const detailRows = useMemo(() => {
    if (!expandedId) return [];
    const base = details[expandedId]?.data ?? [];
    const t = qDetail.trim().toLowerCase();
    if (!t) return base;

    return base.filter((r) => {
      const a = (r.codigo ?? "").toLowerCase();
      const b = (r.nombre ?? "").toLowerCase();
      const c = (r.estado ?? "").toLowerCase();
      return a.includes(t) || b.includes(t) || c.includes(t);
    });
  }, [expandedId, details, qDetail]);

  /** =========================
   * Modal handlers
   * ========================= */
  const validateForm = (f: ModalForm): FormErrors => {
    const e: FormErrors = {};
    if (!f.codigo.trim()) e.codigo = "Código es obligatorio";
    if (!f.nombre.trim()) e.nombre = "Nombre es obligatorio";
    if (f.idUnidadResponsable == null) e.idUnidadResponsable = "Seleccione Unidad Responsable";
    return e;
  };

  const openCreateModalForUnidad = useCallback(
    async (unidad: UnidadOrganizacionalDto) => {
      setModalUnidad(unidad);
      setEditIdCentroCosto(null);
      setFormApiError("");
      setFormErrors({});

      setForm({
        codigo: "",
        nombre: "",
        idUnidadResponsable: unidad.idUnidad,
        idUnidadEjecutora: null,
        estado: "ACTIVO"
      });

      await ensureUnidadesEjecutoras();

      setModalOpen(true);
      setExpandedId(unidad.idUnidad);
      void ensureCentrosCosto(unidad.idUnidad, true);
    },
    [ensureUnidadesEjecutoras, ensureCentrosCosto]
  );

  const openCreateModalGeneral = useCallback(async () => {
    setModalUnidad(null);
    setEditIdCentroCosto(null);
    setFormApiError("");
    setFormErrors({});

    setForm({
      codigo: "",
      nombre: "",
      idUnidadResponsable: null,
      idUnidadEjecutora: null,
      estado: "ACTIVO"
    });

    await ensureUnidadesEjecutoras();
    setModalOpen(true);
  }, [ensureUnidadesEjecutoras]);

  const openEditModal = useCallback(
    async (cc: CentroCostoDto, unidadPadre: UnidadOrganizacionalDto) => {
      setModalUnidad(unidadPadre);
      setEditIdCentroCosto(cc.idCentroCosto);
      setFormApiError("");
      setFormErrors({});

      await ensureUnidadesEjecutoras();

      setForm({
        codigo: cc.codigo ?? "",
        nombre: cc.nombre ?? "",
        idUnidadResponsable: cc.idUnidadResponsable ?? unidadPadre.idUnidad,
        idUnidadEjecutora: cc.idUnidadEjecutora ?? null,
        estado: cc.estado === "INACTIVO" ? "INACTIVO" : "ACTIVO"
      });

      setModalOpen(true);
      setExpandedId(unidadPadre.idUnidad);
    },
    [ensureUnidadesEjecutoras]
  );

  const submitSaveCentroCosto = useCallback(async () => {
    const errs = validateForm(form);
    setFormErrors(errs);
    setFormApiError("");
    if (Object.keys(errs).length > 0) return;

    const dto: CentroCostoCreateUpdateDto = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      idUnidadResponsable: form.idUnidadResponsable,
      idUnidadEjecutora: form.idUnidadEjecutora ?? null,
      estado: form.estado
    };

    setSaving(true);
    try {
      if (editIdCentroCosto == null) {
        await UnidadesOrgCentroCostoAction.createCentroCosto(dto);
      } else {
        await UnidadesOrgCentroCostoAction.updateCentroCosto(editIdCentroCosto, dto);
      }

      if (form.idUnidadResponsable != null) {
        const idU = form.idUnidadResponsable;
        setExpandedId(idU);
        await ensureCentrosCosto(idU, true);
      }

      setModalOpen(false);
      setEditIdCentroCosto(null);
    } catch (e: unknown) {
      setFormApiError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [editIdCentroCosto, form, ensureCentrosCosto]);

  /** =========================
   * Delete handlers
   * ========================= */
  const askDeleteCentroCosto = (cc: CentroCostoDto) => {
    setCcToDelete(cc);
    setConfirmOpen(true);
  };

  const doDeleteCentroCosto = useCallback(async () => {
    if (!ccToDelete) return;

    try {
      await UnidadesOrgCentroCostoAction.deleteCentroCosto(ccToDelete.idCentroCosto);

      const idUnidad = ccToDelete.idUnidadResponsable;
      if (typeof idUnidad === "number") {
        setDetails((prev) => ({
          ...prev,
          [idUnidad]: { loading: false, loaded: false, data: [] }
        }));
        await ensureCentrosCosto(idUnidad, true);
      }
    } catch (e: unknown) {
      // aquí podrías disparar snackbar
      console.error(e);
    } finally {
      setConfirmOpen(false);
      setCcToDelete(null);
    }
  }, [ccToDelete, ensureCentrosCosto]);

  /** =========================
   * UI
   * ========================= */
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 1.25 }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Catálogo: Unidades Organizacionales
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }}>
          Maestro: Unidades Organizacionales. Expande una unidad para ver/crear/editar centros de costo.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading ? <LinearProgress /> : null}

        {/* Toolbar estilo Ejes */}
        <Toolbar sx={{ gap: 1.25, py: 1.25 }}>
          <TextField
            value={qMaster}
            onChange={(e) => {
              setQMaster(e.target.value);
              setPageMaster(0);
            }}
            placeholder="Buscar unidad (código / nombre / siglas / tipo / responsable)…"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => void openCreateModalGeneral()}
            sx={{ whiteSpace: "nowrap" }}
          >
            Nuevo Centro de Costo
          </Button>

          <Tooltip title="Refrescar">
            <IconButton onClick={() => void loadUnidades()}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>

          <Chip
            label={`${unidadesFiltered.length} unid. org.`}
            variant="outlined"
            sx={{ fontWeight: 900 }}
          />
        </Toolbar>

        {error ? (
          <Box sx={{ px: 2, pb: 2 }}>
            <Typography sx={{ color: "error.main", fontWeight: 900 }}>{error}</Typography>
          </Box>
        ) : null}

        {/* Table master */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={42} />
                <TableCell sx={{ fontWeight: 900 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Siglas</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Responsable</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="center" width={240}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {unidadesPaged.map((u) => {
                const isOpen = expandedId === u.idUnidad;
                const d = details[u.idUnidad];
                const count = d?.loaded ? (d.data?.length ?? 0) : null;

                return (
                  <React.Fragment key={u.idUnidad}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton size="small" onClick={() => void toggleExpand(u.idUnidad)}>
                          {isOpen ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                        </IconButton>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900 }}>{u.codigo}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{u.nombre}</TableCell>
                      <TableCell>{u.siglas ?? "—"}</TableCell>
                      <TableCell>{u.tipo ?? "—"}</TableCell>
                      <TableCell>{u.responsable ?? "—"}</TableCell>
                      <TableCell>{u.email ?? "—"}</TableCell>
                      <TableCell>
                        <Box component="span" sx={pillSx(u.estado)}>
                          {u.estado ?? "—"}
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, alignItems: "center" }}>
                          <Chip
                            size="small"
                            label={count == null ? "—" : `${count} centros`}
                            variant="outlined"
                            sx={{ fontWeight: 900 }}
                          />

                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => void openCreateModalForUnidad(u)}
                          >
                            Agregar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* Detail */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ p: 0, border: 0 }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 2, pb: 2, pt: 1.5 }}>
                            <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                              Centros de costo de la unidad: {u.codigo} - {u.nombre}
                            </Typography>

                            <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 700, mb: 1 }}>
                              Ver / editar / agregar centros de costo sin salir de la unidad organizacional
                            </Typography>

                            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
                              <TextField
                                value={qDetail}
                                onChange={(e) => setQDetail(e.target.value)}
                                size="small"
                                placeholder="Buscar en centros de costo…"
                                sx={{ width: 320 }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchRoundedIcon fontSize="small" />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Box>

                            {d?.loading ? (
                              <Box sx={{ py: 2 }}>
                                <LinearProgress />
                                <Typography sx={{ mt: 1, fontSize: 12.5, color: "text.secondary", fontWeight: 700 }}>
                                  Cargando centros de costo…
                                </Typography>
                              </Box>
                            ) : d?.error ? (
                              <Typography sx={{ color: "error.main", fontWeight: 900 }}>{d.error}</Typography>
                            ) : detailRows.length === 0 ? (
                              <Typography sx={{ fontSize: 13, color: "text.secondary", fontWeight: 700 }}>
                                No hay centros de costo para esta unidad.
                              </Typography>
                            ) : (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 900 }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Código</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Nombre</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Unidad Ejecutora</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }} align="center" width={160}>
                                      Acción
                                    </TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {detailRows.map((cc) => (
                                    <TableRow key={cc.idCentroCosto} hover>
                                      <TableCell>{cc.idCentroCosto}</TableCell>
                                      <TableCell sx={{ fontWeight: 900 }}>{cc.codigo}</TableCell>
                                      <TableCell sx={{ fontWeight: 800 }}>{cc.nombre}</TableCell>
                                      <TableCell>{cc.nombreUnidadEjecutora ?? "—"}</TableCell>
                                      <TableCell>
                                        <Box component="span" sx={pillSx(cc.estado)}>
                                          {cc.estado ?? "—"}
                                        </Box>
                                      </TableCell>

                                      <TableCell align="center">
                                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                                          <Tooltip title="Ver">
                                            <IconButton size="small">
                                              <VisibilityRoundedIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>

                                          <Tooltip title="Editar">
                                            <IconButton
                                              size="small"
                                              onClick={() => void openEditModal(cc, u)}
                                            >
                                              <EditRoundedIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>

                                          <Tooltip title="Inactivar">
                                            <IconButton size="small" onClick={() => askDeleteCentroCosto(cc)}>
                                              <DeleteOutlineRoundedIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination estilo Ejes */}
        <TablePagination
          component="div"
          count={unidadesFiltered.length}
          page={pageMaster}
          onPageChange={(_, p) => setPageMaster(p)}
          rowsPerPage={rppMaster}
          onRowsPerPageChange={(e) => {
            setRppMaster(Number(e.target.value));
            setPageMaster(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* ===== Modal Create/Edit ===== */}
      <Dialog
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditIdCentroCosto(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 900 }}>
              {editIdCentroCosto == null ? "Nuevo Centro de Costo" : "Editar Centro de Costo"}
              {modalUnidad ? ` (Unidad: ${modalUnidad.codigo})` : ""}
            </Typography>
          </Box>

          <IconButton
            onClick={() => {
              setModalOpen(false);
              setEditIdCentroCosto(null);
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {formApiError ? (
            <Typography sx={{ color: "error.main", fontWeight: 900, mb: 1 }}>{formApiError}</Typography>
          ) : null}

          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField
              label="Código"
              value={form.codigo}
              onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
              error={Boolean(formErrors.codigo)}
              helperText={formErrors.codigo ?? ""}
              fullWidth
            />

            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              error={Boolean(formErrors.nombre)}
              helperText={formErrors.nombre ?? ""}
              fullWidth
            />

            <Divider />

            <TextField
              label="Unidad Responsable"
              select
              value={form.idUnidadResponsable ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const id = v === "" ? null : Number(v);
                setForm((p) => ({ ...p, idUnidadResponsable: id }));
              }}
              error={Boolean(formErrors.idUnidadResponsable)}
              helperText={formErrors.idUnidadResponsable ?? ""}
              fullWidth
            >
              <MenuItem value="">-- Seleccione --</MenuItem>
              {unidades.map((u) => (
                <MenuItem key={u.idUnidad} value={u.idUnidad}>
                  {u.codigo} - {u.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Unidad Ejecutora (opcional)"
              select
              value={form.idUnidadEjecutora ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                const id = v === "" ? null : Number(v);
                setForm((p) => ({ ...p, idUnidadEjecutora: id }));
              }}
              fullWidth
              helperText={
                ueLoading
                  ? "Cargando unidades ejecutoras…"
                  : ueError
                    ? ueError
                    : !ueLoading && ueLoaded && unidadesEjecutoras.length === 0
                      ? "No hay unidades ejecutoras registradas."
                      : " "
              }
            >
              <MenuItem value="">-- Ninguna --</MenuItem>
              {unidadesEjecutoras.map((ue) => (
                <MenuItem key={ue.idUnidadEjecutora} value={ue.idUnidadEjecutora}>
                  {ue.codigo} - {ue.nombre}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 1.5 }}>
              <TextField
                label="Estado"
                select
                value={form.estado}
                onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as "ACTIVO" | "INACTIVO" }))}
                fullWidth
              >
                <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                <MenuItem value="INACTIVO">INACTIVO</MenuItem>
              </TextField>

              <Box />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setModalOpen(false);
              setEditIdCentroCosto(null);
            }}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button variant="contained" onClick={() => void submitSaveCentroCosto()} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Confirm delete ===== */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Inactivar centro de costo</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Seguro que deseas inactivar el centro de costo{" "}
            <b>{ccToDelete?.codigo ?? ""}</b> - {ccToDelete?.nombre ?? ""}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void doDeleteCentroCosto()}>
            Inactivar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
