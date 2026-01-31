import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
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

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import {
  PlaneamientoAction,
  type ObjetivoConResponsablesDto,
  type ObjetivoCreateUpdateDto,
  type ObjetivoResponsableDto,
  type UnidadOrgDto,
} from "../PlaneamientoAction";

const INSTRUMENTO_ID = 6;
const TITULO_FIJO = "PLAN ESTRATÉGICO INSTITUCIONAL (PEI): OBJETIVOS ESTRATÉGICOS INSTITUCIONALES Y RESPONSABLES";

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

function normalizeText(v: unknown): string {
  if (v == null) return "";
  return String(v).trim().toLowerCase();
}

function getOeiText(row: ObjetivoConResponsablesDto): string {
  // tu backend puede devolver oer/enunciado/objetivo (lo reutilizamos)
  return String(row.oer ?? row.enunciado ?? row.objetivo ?? "");
}

const buildEmptyNewForm = (idInstrumento: number): ObjetivoCreateUpdateDto => ({
  idInstrumento,
  codigo: "",
  enunciado: "",
  descripcion: null,
  tipo: null,
  idDimension: null,
  idEje: null,
  idPolitica: null,
  idUnidadResponsable: null,
  orden: null,
  estado: "ACTIVO",
});

export default function PeiObjetivosResponsablesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Si quieres reutilizar el flujo de “Acciones/Indicadores” luego:
  const openAccionesIndicadores = (
    idInstrumento: number,
    idObjetivo: number,
    idUnidad: number,
    newTab = false
  ) => {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    const url = `/pei/instrumento/${idInstrumento}/objetivo/${idObjetivo}/unidad/${idUnidad}/acciones-indicadores?returnTo=${returnTo}`;

    if (newTab) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(url);
  };

  const [rows, setRows] = useState<ObjetivoConResponsablesDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  // ========= Dialog: Ver =========
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<ObjetivoConResponsablesDto | null>(null);

  // ========= Dialog: Editar =========
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ObjetivoConResponsablesDto | null>(null);

  const [editForm, setEditForm] = useState<ObjetivoCreateUpdateDto>(
    buildEmptyNewForm(INSTRUMENTO_ID)
  );

  // ========= Dialog: Nuevo =========
  const [openNew, setOpenNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);
  const [newForm, setNewForm] = useState<ObjetivoCreateUpdateDto>(
    buildEmptyNewForm(INSTRUMENTO_ID)
  );

  // ========= Dialog: Agregar Responsable =========
  const [openAddResp, setOpenAddResp] = useState(false);
  const [respRow, setRespRow] = useState<ObjetivoConResponsablesDto | null>(null);
  const [unidades, setUnidades] = useState<UnidadOrgDto[]>([]);
  const [unidadesLoading, setUnidadesLoading] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadOrgDto | null>(null);
  const [addingResp, setAddingResp] = useState(false);
  const [addRespError, setAddRespError] = useState<string | null>(null);

  // ========= Dialog: Confirmar Eliminación Responsable =========
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmObj, setConfirmObj] = useState<ObjetivoConResponsablesDto | null>(null);
  const [confirmResp, setConfirmResp] = useState<ObjetivoResponsableDto | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await PlaneamientoAction.getObjetivosConResponsablesByInstrumento(
        INSTRUMENTO_ID,
        false
      );

      setRows(data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return rows;

    return rows.filter((p) => {
      const hitCodigo = normalizeText(p.codigo).includes(q);
      const hitOei = normalizeText(getOeiText(p)).includes(q);
      const hitEstado = normalizeText(p.estado).includes(q);

      const hitResp = (p.responsables ?? []).some((r) => {
        return (
          normalizeText(r.codigoUnidad).includes(q) ||
          normalizeText(r.nombreUnidad).includes(q)
        );
      });

      return hitCodigo || hitOei || hitEstado || hitResp;
    });
  }, [rows, query]);

  // ======================
  // Acciones: Ver / Editar
  // ======================
  const onView = (p: ObjetivoConResponsablesDto) => {
    setViewRow(p);
    setOpenView(true);
  };

  const onEdit = (p: ObjetivoConResponsablesDto) => {
    setEditing(p);
    setSaveError(null);

    setEditForm({
      idInstrumento: INSTRUMENTO_ID,
      codigo: p.codigo,
      enunciado: getOeiText(p),
      descripcion: null,
      tipo: null,
      idDimension: null,
      idEje: null,
      idPolitica: null,
      idUnidadResponsable: null,
      orden: null,
      estado: p.estado ?? "ACTIVO",
    });

    setOpenEdit(true);
  };

  const saveEdit = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload: ObjetivoCreateUpdateDto = {
        ...editForm,
        idInstrumento: INSTRUMENTO_ID,
        codigo: (editForm.codigo ?? "").trim(),
        enunciado: (editForm.enunciado ?? "").trim(),
        // ✅ Forzados para O.E.I.
        tipo: "INSTITUCIONAL",
        descripcion: (editForm.enunciado ?? "").trim(),
        estado: editForm.estado ?? "ACTIVO",
      };

      if (!payload.enunciado) throw new Error("Ingrese el enunciado del O.E.I.");

      await PlaneamientoAction.updateObjetivo(editing.idObjetivo, payload);
      setOpenEdit(false);
      await load();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  // ======================
  // Nuevo O.E.I.
  // ======================
  const openNuevoOei = () => {
    setNewForm(buildEmptyNewForm(INSTRUMENTO_ID)); // ✅ siempre vacío
    setNewError(null);
    setOpenNew(true);
  };

  const closeNuevoOei = () => {
    setOpenNew(false);
    setNewError(null);
    setNewForm(buildEmptyNewForm(INSTRUMENTO_ID)); // ✅ deja limpio
  };

  const createOei = async () => {
    try {
      setCreating(true);
      setNewError(null);

      const payload: ObjetivoCreateUpdateDto = {
        ...newForm,
        idInstrumento: INSTRUMENTO_ID,
        codigo: (newForm.codigo ?? "").trim(),
        enunciado: (newForm.enunciado ?? "").trim(),
        // ✅ Forzados para O.E.I.
        tipo: "INSTITUCIONAL",
        descripcion: (newForm.enunciado ?? "").trim(),
        estado: newForm.estado ?? "ACTIVO",
      };

      if (!payload.codigo) throw new Error("Ingrese el código");
      if (!payload.enunciado) throw new Error("Ingrese el enunciado del O.E.I.");

      await PlaneamientoAction.createObjetivo(payload);
      closeNuevoOei();
      await load();
    } catch (e: unknown) {
      setNewError(e instanceof Error ? e.message : "Error creando O.E.I.");
    } finally {
      setCreating(false);
    }
  };

  // ======================
  // Responsables
  // ======================
  const openAddResponsable = async (p: ObjetivoConResponsablesDto) => {
    setRespRow(p);
    setSelectedUnidad(null);
    setAddRespError(null);
    setOpenAddResp(true);

    if (unidades.length) return;

    try {
      setUnidadesLoading(true);
      const u = await PlaneamientoAction.getUnidadesOrg();
      setUnidades(u.filter((x) => (x.estado ?? "ACTIVO") === "ACTIVO"));
    } catch (e: unknown) {
      setAddRespError(e instanceof Error ? e.message : "Error cargando unidades");
    } finally {
      setUnidadesLoading(false);
    }
  };

  const addResponsable = async () => {
    if (!respRow) return;
    if (!selectedUnidad) {
      setAddRespError("Seleccione un responsable");
      return;
    }

    try {
      setAddingResp(true);
      setAddRespError(null);

      await PlaneamientoAction.addResponsableToObjetivo(respRow.idObjetivo, {
        idUnidad: selectedUnidad.idUnidadOrganizacional,
      });

      setOpenAddResp(false);
      await load();
    } catch (e: unknown) {
      setAddRespError(e instanceof Error ? e.message : "Error agregando responsable");
    } finally {
      setAddingResp(false);
    }
  };

  const askRemove = (o: ObjetivoConResponsablesDto, r: ObjetivoResponsableDto) => {
    setConfirmObj(o);
    setConfirmResp(r);
    setRemoveError(null);
    setConfirmOpen(true);
  };

  const removeResponsable = async () => {
    if (!confirmObj || !confirmResp) return;

    try {
      setRemoving(true);
      setRemoveError(null);

      await PlaneamientoAction.removeResponsableFromObjetivo(
        confirmObj.idObjetivo,
        confirmResp.idUnidad
      );

      setConfirmOpen(false);
      await load();
    } catch (e: unknown) {
      setRemoveError(e instanceof Error ? e.message : "Error eliminando responsable");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        background:
          "radial-gradient(1200px 420px at 0% 0%, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0) 60%)",
      }}
    >
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 950, letterSpacing: -0.2 }}>
            {TITULO_FIJO}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.25 }}>
            Visualiza y administra objetivos estratégicos institucionales (O.E.I.) del instrumento y sus responsables.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNuevoOei}>
          NUEVO O.E.I.
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #EEF2F7",
          bgcolor: "#fff",
          boxShadow: "0 12px 40px rgba(15,23,42,0.08)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: "rgba(248,250,252,.9)",
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ width: { xs: "100%", md: 360 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Refrescar">
            <IconButton onClick={() => void load()}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>

          <Chip
            label={`${filtered.length} registros`}
            sx={{ fontWeight: 900, bgcolor: "rgba(15,23,42,0.04)" }}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 950, bgcolor: "rgba(248,250,252,.9)" } }}>
                <TableCell sx={{ width: 110 }}>código</TableCell>
                <TableCell>O.E.I.</TableCell>
                <TableCell sx={{ width: 520 }}>responsables</TableCell>
                <TableCell sx={{ width: 120 }}>estado</TableCell>
                <TableCell sx={{ width: 140 }}>acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
                      <CircularProgress />
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 4 }}>
                      <Typography sx={{ fontWeight: 900, color: "error.main", mb: 0.5 }}>
                        Ocurrió un error
                      </Typography>
                      <Typography sx={{ color: "text.secondary" }}>{error}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && filtered.map((p) => {
                const firstResp = (p.responsables ?? [])[0] ?? null;

                return (
                  <TableRow key={`${p.idObjetivo}`}>
                    <TableCell sx={{ fontWeight: 900 }}>{p.codigo}</TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                        {getOeiText(p)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "grid", gap: 0.9 }}>
                        {(p.responsables ?? []).length === 0 && (
                          <Typography sx={{ color: "text.secondary" }}>—</Typography>
                        )}

                        {(p.responsables ?? []).map((r) => (
                          <Box
                            key={`${p.idObjetivo}-${r.idUnidad}`}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              border: "1px solid #EEF2F7",
                              borderRadius: 2,
                              px: 1,
                              py: 0.6,
                              bgcolor: "rgba(248,250,252,.7)",
                            }}
                          >
                            <Chip
                              label={r.codigoUnidad ?? "—"}
                              size="small"
                              sx={{ fontWeight: 900 }}
                            />

                            <Typography sx={{ fontWeight: 900 }}>
                              {r.nombreUnidad ?? "—"}
                            </Typography>

                            <Box sx={{ flex: 1 }} />

                            {/* opcional: abrir acciones/indicadores en nueva pestaña */}
                            <Tooltip title="Ver acciones / indicadores">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  // usa el primero como “contexto”
                                  const idUnidad = r.idUnidad;
                                  openAccionesIndicadores(INSTRUMENTO_ID, p.idObjetivo, idUnidad, true);
                                }}
                              >
                                <OpenInNewRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Eliminar responsable">
                              <IconButton
                                size="small"
                                onClick={() => askRemove(p, r)}
                                sx={{ color: "error.main" }}
                              >
                                <DeleteRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ))}

                        <Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PersonAddAlt1RoundedIcon />}
                            onClick={() => openAddResponsable(p)}
                          >
                            Agregar responsable
                          </Button>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box component="span" sx={pillSx(p.estado)}>
                        {p.estado ?? "—"}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Tooltip title="Ver">
                          <IconButton size="small" onClick={() => onView(p)}>
                            <VisibilityRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => onEdit(p)}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Si quieres replicar el “+ responsable” en acciones */}
                        <Tooltip title="Agregar responsable">
                          <IconButton size="small" onClick={() => openAddResponsable(p)}>
                            <PersonAddAlt1RoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Si quieres el icono contextual al primer responsable */}
                        {firstResp && (
                          <Tooltip title="Ver acciones / indicadores">
                            <IconButton
                              size="small"
                              onClick={() => openAccionesIndicadores(INSTRUMENTO_ID, p.idObjetivo, firstResp.idUnidad, false)}
                            >
                              <OpenInNewRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!loading && !error && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 900 }}>Sin registros</Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        No se encontraron O.E.I. con el filtro actual.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ===================== Dialog: Ver ===================== */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle>Detalle O.E.I.</DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Box sx={{ display: "grid", gap: 1 }}>
              <Typography sx={{ fontWeight: 900 }}>Código</Typography>
              <Typography sx={{ color: "text.secondary" }}>{viewRow.codigo}</Typography>

              <Divider />

              <Typography sx={{ fontWeight: 900 }}>Enunciado</Typography>
              <Typography sx={{ color: "text.secondary" }}>{getOeiText(viewRow)}</Typography>

              <Divider />

              <Typography sx={{ fontWeight: 900 }}>Estado</Typography>
              <Typography sx={{ color: "text.secondary" }}>{viewRow.estado ?? "—"}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ===================== Dialog: Editar ===================== */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar O.E.I.</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField
              label="Código"
              value={editForm.codigo ?? ""}
              onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="O.E.I. (Enunciado)"
              value={editForm.enunciado ?? ""}
              onChange={(e) => setEditForm((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />

            <TextField
              select
              label="Estado"
              value={editForm.estado ?? "ACTIVO"}
              onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </TextField>

            {saveError && (
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                {saveError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void saveEdit()} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== Dialog: Nuevo ===================== */}
      <Dialog open={openNew} onClose={closeNuevoOei} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo O.E.I.</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <TextField
              label="Código"
              value={newForm.codigo ?? ""}
              onChange={(e) => setNewForm((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="O.E.I. (Enunciado)"
              value={newForm.enunciado ?? ""}
              onChange={(e) => setNewForm((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />

            <TextField
              select
              label="Estado"
              value={newForm.estado ?? "ACTIVO"}
              onChange={(e) => setNewForm((p) => ({ ...p, estado: e.target.value }))}
              SelectProps={{ native: true }}
              fullWidth
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </TextField>

            {newError && (
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                {newError}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeNuevoOei} disabled={creating}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void createOei()} disabled={creating}>
            {creating ? "Creando..." : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== Dialog: Agregar Responsable ===================== */}
      <Dialog open={openAddResp} onClose={() => setOpenAddResp(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar responsable</DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Autocomplete
              options={unidades}
              loading={unidadesLoading}
              getOptionLabel={(o) => `${o.codigo ?? ""} - ${o.nombre ?? ""}`}
              value={selectedUnidad}
              onChange={(_, v) => setSelectedUnidad(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Responsable"
                  placeholder="Seleccione una unidad org..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {unidadesLoading ? <CircularProgress size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {addRespError && (
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                {addRespError}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenAddResp(false)} disabled={addingResp}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void addResponsable()} disabled={addingResp}>
            {addingResp ? "Agregando..." : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===================== Dialog: Confirmar eliminación ===================== */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Confirmar</DialogTitle>

        <DialogContent dividers>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>
            ¿Eliminar responsable?
          </Typography>

          {confirmResp && (
            <Typography sx={{ color: "text.secondary" }}>
              {confirmResp.codigoUnidad} - {confirmResp.nombreUnidad}
            </Typography>
          )}

          {removeError && (
            <Typography sx={{ mt: 1, color: "error.main", fontWeight: 900 }}>
              {removeError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={removing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void removeResponsable()}
            disabled={removing}
          >
            {removing ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
