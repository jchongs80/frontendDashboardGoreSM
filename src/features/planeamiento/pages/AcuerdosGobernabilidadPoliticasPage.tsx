import { useCallback, useEffect, useMemo, useState } from "react";
/*import { useNavigate } from "react-router-dom";*/
import { useNavigate, useParams } from "react-router-dom";

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
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
//import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import { CatalogoAction, type InstrumentoDto } from "../../catalogos/CatalogoAction";
import {
  PlaneamientoAction,
  type PoliticaConResponsablesDto,
  type PoliticaCreateUpdateDto,
  type PoliticaResponsableDto,
  type UnidadOrgDto,
} from "../PlaneamientoAction";

//const INSTRUMENTO_CODIGO = "AG"; // Acuerdos de Gobernabilidad

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

export default function AcuerdosGobernabilidadPoliticasPage() {
  const { codigoInstrumento } = useParams<{ codigoInstrumento: string }>();
  const codigo = (codigoInstrumento ?? "AG").toUpperCase();

  const [instrumento, setInstrumento] = useState<InstrumentoDto | null>(null);

  const [rows, setRows] = useState<PoliticaConResponsablesDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  // ========= Dialog: Ver =========
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<PoliticaConResponsablesDto | null>(null);

  // ========= Dialog: Editar =========
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<PoliticaConResponsablesDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<PoliticaCreateUpdateDto>({
    idInstrumento: 0,
    codigo: "",
    nombre: "",
    descripcion: "",
    idDimension: null,
    idEje: null,
    orden: null,
    estado: "ACTIVO",
  });

  // ========= Dialog: Nueva Política =========
  const [openNew, setOpenNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  const [newForm, setNewForm] = useState<PoliticaCreateUpdateDto>({
    idInstrumento: 0,
    codigo: "",
    nombre: "",
    descripcion: "",
    idDimension: null,
    idEje: null,
    orden: null,
    estado: "ACTIVO",
  });

  // ========= Dialog: Agregar Responsable =========
  const [openAddResp, setOpenAddResp] = useState(false);
  const [respRow, setRespRow] = useState<PoliticaConResponsablesDto | null>(null);
  const [unidades, setUnidades] = useState<UnidadOrgDto[]>([]);
  const [unidadesLoading, setUnidadesLoading] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState<UnidadOrgDto | null>(null);
  const [addingResp, setAddingResp] = useState(false);
  const [addRespError, setAddRespError] = useState<string | null>(null);

  // ========= Confirm: Quitar Responsable =========
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPolitica, setConfirmPolitica] = useState<PoliticaConResponsablesDto | null>(null);
  const [confirmResp, setConfirmResp] = useState<PoliticaResponsableDto | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  /*const loadInstrumento = useCallback(async () => {
    const instrumentos = await CatalogoAction.getInstrumentos();
    const found = instrumentos.find((x) => x.codigo?.toUpperCase() === INSTRUMENTO_CODIGO);
    if (!found) throw new Error(`No se encontró el instrumento con código ${INSTRUMENTO_CODIGO}`);
    setInstrumento(found);
    return found;
  }, []);*/
  const loadInstrumento = useCallback(async () => {
    const instrumentos = await CatalogoAction.getInstrumentos();
    const found = instrumentos.find((x) => x.codigo?.toUpperCase() === codigo);
    if (!found) throw new Error(`No se encontró el instrumento con código ${codigo}`);
    setInstrumento(found);
    return found;
  }, [codigo]);


  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const inst = instrumento ?? (await loadInstrumento());
      const data = await PlaneamientoAction.getPoliticasConResponsablesByInstrumento(
        inst.idInstrumento,
        false
      );
      setRows(data ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error cargando políticas";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [instrumento, loadInstrumento]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return rows;

    return rows.filter((p) => {
      const hitPolitica =
        normalizeText(p.codigo).includes(q) ||
        normalizeText(p.politica).includes(q) ||
        normalizeText(p.estado).includes(q);

      const hitResp = (p.responsables ?? []).some((r) => {
        return (
          normalizeText(r.codigoUnidad).includes(q) ||
          normalizeText(r.nombreUnidad).includes(q)
        );
      });

      return hitPolitica || hitResp;
    });
  }, [rows, query]);

  // ======================
  // Acciones: Ver / Edit
  // ======================
  const onView = (p: PoliticaConResponsablesDto) => {
    setViewRow(p);
    setOpenView(true);
  };

  const onEdit = (p: PoliticaConResponsablesDto) => {
    setEditing(p);
    setSaveError(null);
    setEditForm({
      idInstrumento: p.idInstrumento,
      codigo: p.codigo,
      nombre: p.politica,
      descripcion: "",
      idDimension: null,
      idEje:  null,
      orden:  null,
      estado: p.estado ?? "ACTIVO",
    });
    setOpenEdit(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updatePolitica(editing.idPolitica, editForm);
      setOpenEdit(false);
      await load();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  // ======================
  // Nueva Política
  // ======================
  const openNuevaPolitica = () => {
    if (!instrumento) {
      // si aún no cargó, igual abrimos y se setea luego
      setNewForm((p) => ({ ...p, idInstrumento: 0 }));
    } else {
      setNewForm((p) => ({ ...p, idInstrumento: instrumento.idInstrumento }));
    }
    setNewError(null);
    setOpenNew(true);
  };

  const createPolitica = async () => {
    try {
      setCreating(true);
      setNewError(null);

      const inst = instrumento ?? (await loadInstrumento());
      const payload: PoliticaCreateUpdateDto = {
        ...newForm,
        idInstrumento: inst.idInstrumento,
        codigo: newForm.codigo.trim(),
        nombre: newForm.nombre.trim(),
        estado: newForm.estado ?? "ACTIVO",
      };

      if (!payload.codigo) throw new Error("Ingrese el código");
      if (!payload.nombre) throw new Error("Ingrese el nombre");

      await PlaneamientoAction.createPolitica(payload);
      setOpenNew(false);
      await load();
    } catch (e: unknown) {
      setNewError(e instanceof Error ? e.message : "Error creando política");
    } finally {
      setCreating(false);
    }
  };

  // ======================
  // Responsables
  // ======================
  const openAddResponsable = async (p: PoliticaConResponsablesDto) => {
    setRespRow(p);
    setSelectedUnidad(null);
    setAddRespError(null);
    setOpenAddResp(true);

    if (unidades.length) return;

    try {
      setUnidadesLoading(true);
      const u = await PlaneamientoAction.getUnidadesOrg();
      // opcional: solo activos
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

      await PlaneamientoAction.addResponsableToPolitica(respRow.idPolitica, {
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

  const askRemove = (p: PoliticaConResponsablesDto, r: PoliticaResponsableDto) => {
    setConfirmPolitica(p);
    setConfirmResp(r);
    setRemoveError(null);
    setConfirmOpen(true);
  };

  const removeResponsable = async () => {
    if (!confirmPolitica || !confirmResp) return;

    try {
      setRemoving(true);
      setRemoveError(null);

      await PlaneamientoAction.removeResponsableFromPolitica(
        confirmPolitica.idPolitica,
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

  const navigate = useNavigate();
const returnTo = `/${codigo.toLowerCase()}/politica`;

const goToResultados = (idInstrumento: number, idPolitica: number, idUnidad: number, newTab = false) => {
  const path =
    `/acuerdos-gobernabilidad/instrumento/${idInstrumento}/politica/${idPolitica}/responsable/${idUnidad}/resultados` +
    `?returnTo=${encodeURIComponent(returnTo)}`;

  if (newTab) window.open(path, "_blank", "noopener,noreferrer");
  else navigate(path);
};
/*const goToResultados = (idInstrumento: number, idPolitica: number, idUnidad: number, newTab = false) => {
  const path = `/acuerdos-gobernabilidad/instrumento/${idInstrumento}/politica/${idPolitica}/responsable/${idUnidad}/resultados`;
  if (newTab) window.open(path, "_blank", "noopener,noreferrer");
  else navigate(path);
};*/

  // ======================
  // UI Helpers
  // ======================
  const title = instrumento
    ? `${instrumento.nombre.toUpperCase()}: POLÍTICAS Y RESPONSABLES`
    : "POLÍTICAS Y RESPONSABLES";

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
            Visualiza y administra políticas del instrumento y sus responsables.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openNuevaPolitica}
        >
          NUEVA POLÍTICA
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: "100%", sm: 460 },
              "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
            }}
          />
          <Box sx={{ flex: 1 }} />

          <Tooltip title="Refrescar">
            <span>
              <IconButton onClick={() => void load()} disabled={loading}>
                <RefreshRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Chip
            label={`${filtered.length} registros`}
            variant="outlined"
            sx={{ borderRadius: 999, fontWeight: 900, bgcolor: "#fff" }}
          />
        </Box>

        <Divider />

        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 90 }}>
                  código
                </TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD" }}>
                  política
                </TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 520 }}>
                  responsables
                </TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 110 }}>
                  estado
                </TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 200 }}>
                  acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                      <CircularProgress size={26} />
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 3 }}>
                      <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                        {error}
                      </Typography>
                      <Button variant="contained" sx={{ mt: 1 }} onClick={() => void load()}>
                        Reintentar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                        Sin resultados
                      </Typography>
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
                    key={p.idPolitica}
                    hover
                    sx={{
                      "& td": { borderBottom: "1px solid #F0F3F8", py: 1.25 },
                      "&:hover": { bgcolor: "rgba(99,102,241,0.04)" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>{p.codigo}</TableCell>

                    <TableCell>
                      <Typography sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                        {p.politica}
                      </Typography>
                    </TableCell>

                    {/* Responsables (premium UX: cada responsable como "card" compacta) */}
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
                                <Tooltip title="Ver resultados / intervenciones">
                                  <IconButton
                                    size="small"
                                    onClick={() => goToResultados(p.idInstrumento, p.idPolitica, r.idUnidad, true)}
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

                    {/* Acciones a nivel de política */}
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
          Dialog: Ver Política
         ========================= */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle>Detalle de política</DialogTitle>
        <DialogContent dividers>
          {viewRow && (
            <Box sx={{ display: "grid", gap: 1.2 }}>
              <Typography sx={{ fontWeight: 900 }}>{viewRow.codigo}</Typography>
              <Typography sx={{ fontWeight: 800 }}>{viewRow.politica}</Typography>

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
          Dialog: Editar Política
         ========================= */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar política</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {saveError && (
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>
                {saveError}
              </Typography>
            )}

            <TextField
              label="Código"
              value={editForm.codigo}
              disabled
              fullWidth
              size="small"
            />

            <TextField
              label="Política"
              value={editForm.nombre}
              onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
              fullWidth
              size="small"
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
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =========================
          Dialog: Nueva Política
         ========================= */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva política</DialogTitle>
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
              label="Política"
              value={newForm.nombre}
              onChange={(e) => setNewForm((p) => ({ ...p, nombre: e.target.value }))}
              fullWidth
              size="small"
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
          <Button onClick={() => setOpenNew(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={createPolitica} disabled={creating}>
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
              {respRow ? `${respRow.codigo} - ${respRow.politica}` : ""}
            </Typography>

            <Autocomplete
              options={unidades}
              loading={unidadesLoading}
              value={selectedUnidad}
              onChange={(_, v) => setSelectedUnidad(v)}
              getOptionLabel={(o) => `${o.codigo} - ${o.nombre}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleccione responsable (Unidad Org.)"
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
          Confirm: Quitar Responsable
         ========================= */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Quitar responsable</DialogTitle>
        <DialogContent dividers>
          {removeError && (
            <Typography sx={{ color: "error.main", fontWeight: 900, mb: 1 }}>
              {removeError}
            </Typography>
          )}

          <Typography sx={{ fontWeight: 800 }}>
            ¿Deseas quitar a este responsable de la política?
          </Typography>

          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 900 }}>
              Política
            </Typography>
            <Typography sx={{ fontWeight: 900 }}>
              {confirmPolitica ? `${confirmPolitica.codigo} - ${confirmPolitica.politica}` : "—"}
            </Typography>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 900 }}>
              Responsable
            </Typography>
            <Typography sx={{ fontWeight: 900 }}>
              {confirmResp ? `${confirmResp.codigoUnidad} - ${confirmResp.nombreUnidad}` : "—"}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={removing}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={removeResponsable} disabled={removing}>
            {removing ? "Quitando..." : "Quitar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
