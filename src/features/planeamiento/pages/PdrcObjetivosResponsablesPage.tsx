import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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

import { CatalogoAction, type InstrumentoDto } from "../../catalogos/CatalogoAction";
import {
  PlaneamientoAction,
  type ObjetivoConResponsablesDto,
  type ObjetivoCreateUpdateDto,
  type ObjetivoResponsableDto,
  type UnidadOrgDto,
} from "../PlaneamientoAction";

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

function getOerText(row: ObjetivoConResponsablesDto): string {
  return String(row.oer ?? row.enunciado ?? row.objetivo ?? "");
}



export default function PdrcObjetivosResponsablesPage() {
const navigate = useNavigate();
const location = useLocation();

const openAccionesIndicadores = (
  idInstrumento: number,
  idObjetivo: number,
  idUnidad: number,
  newTab = false
) => {
  const returnTo = encodeURIComponent(location.pathname + location.search);
  const url = `/pdrc/instrumento/${idInstrumento}/objetivo/${idObjetivo}/unidad/${idUnidad}/acciones-indicadores?returnTo=${returnTo}`;

  if (newTab) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  navigate(url);
};


  const { codigoInstrumento } = useParams<{ codigoInstrumento: string }>();
  const codigo = (codigoInstrumento ?? "PDRC").toUpperCase();

  const [instrumento, setInstrumento] = useState<InstrumentoDto | null>(null);

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
  const [editForm, setEditForm] = useState<ObjetivoCreateUpdateDto>({
    idInstrumento: 0,
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

  // ========= Dialog: Nuevo =========
  const [openNew, setOpenNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);
  const [newForm, setNewForm] = useState<ObjetivoCreateUpdateDto>({
    idInstrumento: 0,
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

  const loadInstrumento = async (): Promise<InstrumentoDto> => {
    const inst = await CatalogoAction.getInstrumentoByCodigo(codigo);
    setInstrumento(inst);
    return inst;
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const inst = instrumento ?? (await loadInstrumento());
      const data = await PlaneamientoAction.getObjetivosConResponsablesByInstrumento(
        inst.idInstrumento,
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
  }, [codigo]);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return rows;

    return rows.filter((p) => {
      const hitCodigo = normalizeText(p.codigo).includes(q);
      const hitOer = normalizeText(getOerText(p)).includes(q);
      const hitEstado = normalizeText(p.estado).includes(q);

      const hitResp = (p.responsables ?? []).some((r) => {
        return (
          normalizeText(r.codigoUnidad).includes(q) ||
          normalizeText(r.nombreUnidad).includes(q)
        );
      });

      return hitCodigo || hitOer || hitEstado || hitResp;
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
      idInstrumento: p.idInstrumento,
      codigo: p.codigo,
      enunciado: getOerText(p),
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
        codigo: (editForm.codigo ?? "").trim(),
        enunciado: (editForm.enunciado ?? "").trim(),
        // ✅ Forzados para O.E.R.
        tipo: "REGIONAL",
        descripcion: (editForm.enunciado ?? "").trim(),
        estado: editForm.estado ?? "ACTIVO",
      };

      if (!payload.enunciado) throw new Error("Ingrese el enunciado del O.E.R.");

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
  // Nuevo O.E.R.
  // ======================
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

const openNuevoOer = () => {
  const idInst = instrumento?.idInstrumento ?? 0;

  setNewForm(buildEmptyNewForm(idInst)); // ✅ limpia código y enunciado
  setNewError(null);
  setOpenNew(true);
};

const closeNuevoOer = () => {
  const idInst = instrumento?.idInstrumento ?? 0;

  setOpenNew(false);
  setNewError(null);
  setNewForm(buildEmptyNewForm(idInst)); // ✅ deja limpio para la próxima vez
};


  const createOer = async () => {
    try {
      setCreating(true);
      setNewError(null);

      const inst = instrumento ?? (await loadInstrumento());

      const payload: ObjetivoCreateUpdateDto = {
        ...newForm,
        idInstrumento: inst.idInstrumento,
        codigo: (newForm.codigo ?? "").trim(),
        enunciado: (newForm.enunciado ?? "").trim(),
        // ✅ Forzados para O.E.R.
        tipo: "REGIONAL",
        descripcion: (newForm.enunciado ?? "").trim(),
        estado: newForm.estado ?? "ACTIVO",
      };

      if (!payload.codigo) throw new Error("Ingrese el código");
      if (!payload.enunciado) throw new Error("Ingrese el enunciado del O.E.R.");

      await PlaneamientoAction.createObjetivo(payload);
      closeNuevoOer();
      await load();
    } catch (e: unknown) {
      setNewError(e instanceof Error ? e.message : "Error creando O.E.R.");
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

  // ======================
  // UI Helpers
  // ======================
  const title = instrumento
    ? `${instrumento.nombre.toUpperCase()}: OBJETIVOS ESTRATÉGICOS REGIONALES Y RESPONSABLES`
    : "OBJETIVOS ESTRATÉGICOS REGIONALES Y RESPONSABLES";

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
            {title}
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.25 }}>
            Visualiza y administra objetivos estratégicos regionales (O.E.R.) del instrumento y sus responsables.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNuevoOer}>
          NUEVO O.E.R.
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
                <TableCell>O.E.R.</TableCell>
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

              {!loading && !error && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Sin resultados</Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        Prueba cambiando el texto de búsqueda.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                filtered.map((p) => (
                  <TableRow
                    key={p.idObjetivo}
                    hover
                    sx={{
                      "& td": { borderBottom: "1px solid #F0F3F8", py: 1.25 },
                      "&:hover": { bgcolor: "rgba(99,102,241,0.04)" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>{p.codigo}</TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                        {getOerText(p) || "—"}
                      </Typography>
                    </TableCell>

                    {/* Responsables */}
                    <TableCell>
                      {(p.responsables ?? []).length === 0 ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ color: "text.secondary" }}>—</Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => void openAddResponsable(p)}
                            startIcon={<PersonAddAlt1RoundedIcon />}
                            sx={{ borderRadius: 999, textTransform: "none" }}
                          >
                            Agregar responsable
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ display: "grid", gap: 0.75 }}>
                          {p.responsables.map((r) => (
                            <Box
                              key={r.idUnidad}
                              sx={{
                                display: "grid",
                                gridTemplateColumns: "110px 1fr auto",
                                alignItems: "center",
                                gap: 1,
                                px: 1.25,
                                py: 0.9,
                                borderRadius: 2,
                                border: "1px solid #EEF2F7",
                                bgcolor: "rgba(15,23,42,0.02)",
                                transition: "all .15s ease",
                                "&:hover": {
                                  bgcolor: "rgba(99,102,241,0.06)",
                                  borderColor: "rgba(99,102,241,0.22)",
                                },
                              }}
                            >
                              <Chip
                                label={r.codigoUnidad}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderRadius: 999,
                                  fontWeight: 900,
                                  bgcolor: "#fff",
                                  fontFamily:
                                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                }}
                              />

                              <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                {r.nombreUnidad}
                              </Typography>

                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                <Tooltip title="Ver acciones estratégicas r. / indicadores">
                                    <IconButton
                                      size="small"
                                      onClick={(e) =>
                                        openAccionesIndicadores(
                                          p.idInstrumento,
                                          p.idObjetivo,
                                          r.idUnidad,
                                          e.ctrlKey || e.metaKey || e.shiftKey // si presionas CTRL/SHIFT abre en nueva pestaña
                                        )
                                      }
                                      sx={{ color: "text.secondary" }}
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


                            </Box>
                          ))}
                        </Box>
                      )}
                    </TableCell>

                    <TableCell>
                      <Box sx={pillSx(p.estado)}>{p.estado}</Box>
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

                        <Tooltip title="Nuevo responsable">
                          <IconButton size="small" onClick={() => void openAddResponsable(p)}>
                            <PersonAddAlt1RoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* =========================
          Dialog: Ver O.E.R.
         ========================= */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle>Detalle de O.E.R.</DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Box sx={{ display: "grid", gap: 1.2 }}>
              <Typography sx={{ fontWeight: 900 }}>{viewRow.codigo}</Typography>
              <Typography sx={{ fontWeight: 800 }}>{getOerText(viewRow) || "—"}</Typography>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 900, color: "text.secondary" }}>
                  Estado
                </Typography>
                <Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>
              </Box>

              <Divider />

              <Typography sx={{ fontWeight: 900 }}>Responsables</Typography>
              {(viewRow.responsables ?? []).length === 0 ? (
                <Typography sx={{ color: "text.secondary" }}>Sin responsables</Typography>
              ) : (
                <Box sx={{ display: "grid", gap: 0.6 }}>
                  {viewRow.responsables.map((r) => (
                    <Box key={r.idUnidad} sx={{ display: "flex", gap: 1 }}>
                      <Typography sx={{ fontWeight: 900, width: 90 }}>{r.codigoUnidad}</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{r.nombreUnidad}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* =========================
          Dialog: Editar O.E.R.
         ========================= */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar O.E.R.</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {saveError && (
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                {saveError}
              </Typography>
            )}

            <TextField label="Código" value={editForm.codigo} disabled fullWidth size="small" />

            <TextField
              label="O.E.R. (Enunciado)"
              value={editForm.enunciado}
              onChange={(e) => setEditForm((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              size="small"
              multiline
              minRows={3}
            />

            <TextField
              label="Estado"
              value={editForm.estado}
              onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))}
              fullWidth
              size="small"
              select
              SelectProps={{ native: true }}
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving}>
            {saving ? "Guardando..." : "Grabar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =========================
          Dialog: Nuevo O.E.R.
         ========================= */}
      <Dialog open={openNew} onClose={closeNuevoOer} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo O.E.R.</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {newError && (
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                {newError}
              </Typography>
            )}

            <TextField
              label="Código"
              value={newForm.codigo}
              onChange={(e) => setNewForm((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
              size="small"
            />

            <TextField
              label="O.E.R. (Enunciado)"
              value={newForm.enunciado}
              onChange={(e) => setNewForm((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              size="small"
              multiline
              minRows={3}
            />

            <TextField
              label="Estado"
              value={newForm.estado}
              onChange={(e) => setNewForm((p) => ({ ...p, estado: e.target.value }))}
              fullWidth
              size="small"
              select
              SelectProps={{ native: true }}
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNuevoOer} disabled={creating}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={createOer} disabled={creating}>
            {creating ? "Creando..." : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =========================
          Dialog: Agregar Responsable
         ========================= */}
      <Dialog open={openAddResp} onClose={() => setOpenAddResp(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar responsable</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {addRespError && (
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                {addRespError}
              </Typography>
            )}

            <Typography sx={{ fontWeight: 900 }}>
              {respRow ? `${respRow.codigo} — ${getOerText(respRow)}` : ""}
            </Typography>

            <Autocomplete
              options={unidades}
              loading={unidadesLoading}
              value={selectedUnidad}
              onChange={(_, v) => setSelectedUnidad(v)}
              getOptionLabel={(o) => `${o.codigo} — ${o.nombre}`}
              isOptionEqualToValue={(a, b) => a.idUnidadOrganizacional === b.idUnidadOrganizacional}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Unidad responsable"
                  size="small"
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddResp(false)} disabled={addingResp}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={addResponsable} disabled={addingResp}>
            {addingResp ? "Agregando..." : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =========================
          Dialog: Confirmar eliminación
         ========================= */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Eliminar responsable</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography>
              Se eliminará el responsable{" "}
              <b>{confirmResp?.codigoUnidad}</b> — {confirmResp?.nombreUnidad}.
            </Typography>

            {removeError && (
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                {removeError}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={removing}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={removeResponsable}
            disabled={removing}
            startIcon={<DeleteRoundedIcon />}
          >
            {removing ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
