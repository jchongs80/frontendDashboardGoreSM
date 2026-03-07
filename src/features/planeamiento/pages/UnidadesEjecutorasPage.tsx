// features/planeamiento/pages/UnidadesEjecutorasPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
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
  Button,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { useNavigate } from "react-router-dom";

import { UnidadEjecutoraAction } from "../UnidadEjecutoraAction";
import type { UnidadEjecutoraDto } from "../UnidadEjecutoraAction";

type Estado = "ACTIVO" | "INACTIVO";
type EstadoFilter = "TODOS" | Estado;

type UnidadEjecutoraRow = UnidadEjecutoraDto;

type FormState = {
  idUnidadEjecutora: number;
  codigo: string;
  nombre: string;
  tipo: string;
  idPliego: string;
  estado: Estado;
};

function toText(v: unknown): string {
  return (v ?? "").toString().trim().toLowerCase();
}

function normEstado(v?: string | null): Estado {
  const s = (v ?? "ACTIVO").toString().toUpperCase();
  return s === "INACTIVO" ? "INACTIVO" : "ACTIVO";
}

function getErrorMessage(err: unknown, fallback = "Ocurrió un error."): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}

function pillSx(estado?: string | null) {
  const e = normEstado(estado);
  return {
    display: "inline-flex",
    alignItems: "center",
    px: 1.25,
    py: 0.35,
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 0.3,
    border: "1px solid",
    borderColor: e === "ACTIVO" ? "rgba(46, 125, 50, .25)" : "rgba(237, 108, 2, .25)",
    bgcolor: e === "ACTIVO" ? "rgba(46, 125, 50, .08)" : "rgba(237, 108, 2, .08)",
    color: e === "ACTIVO" ? "success.main" : "warning.main",
  } as const;
}

function actionBtnSx() {
  return {
    borderRadius: 2,
    mx: 0.25,
    border: "1px solid rgba(0,0,0,.08)",
    bgcolor: "rgba(255,255,255,.9)",
    boxShadow: "0 6px 16px rgba(0,0,0,.06)",
    "&:hover": {
      bgcolor: "rgba(25,118,210,.08)",
      borderColor: "rgba(25,118,210,.25)",
      transform: "translateY(-1px)",
      boxShadow: "0 10px 22px rgba(0,0,0,.10)",
    },
    transition: "all .15s ease",
  } as const;
}

// ✅ estilo premium para NUEVA UE (igual vibe a tu ejemplo)
function newBtnSx() {
  return {
    height: 36,
    borderRadius: 2.2,
    px: 1.8,
    fontWeight: 950,
    textTransform: "none",
    letterSpacing: 0.2,
    background: "linear-gradient(135deg, #1976d2 0%, #1d4ed8 55%, #2563eb 100%)",
    boxShadow: "0 12px 26px rgba(25,118,210,.30)",
    border: "1px solid rgba(255,255,255,.22)",
    "& .MuiButton-startIcon": { mr: 0.6 },
    "&:hover": {
      background: "linear-gradient(135deg, #1565c0 0%, #1e40af 55%, #1d4ed8 100%)",
      boxShadow: "0 16px 34px rgba(25,118,210,.40)",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0px)",
      boxShadow: "0 10px 22px rgba(25,118,210,.28)",
    },
    transition: "all .15s ease",
    whiteSpace: "nowrap",
    position: "relative",
    overflow: "hidden",
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: 2.2,
      background: "linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,0))",
      opacity: 0.55,
      pointerEvents: "none",
    },
  } as const;
}

function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "rgba(0,0,0,.03)" }}>
      <Typography variant="caption" sx={{ fontWeight: 900, color: "text.secondary" }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.4, fontWeight: 800 }}>{value || "—"}</Box>
    </Box>
  );
}

export default function UnidadesEjecutorasPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<UnidadEjecutoraRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [q, setQ] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("TODOS");

  const [page, setPage] = useState<number>(0);
  const [rpp, setRpp] = useState<number>(10);

  // Modales
  const [openView, setOpenView] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [isCreate, setIsCreate] = useState<boolean>(false); // ✅ NUEVO
  const [viewRow, setViewRow] = useState<UnidadEjecutoraRow | null>(null);

  const [form, setForm] = useState<FormState>({
    idUnidadEjecutora: 0,
    codigo: "",
    nombre: "",
    tipo: "",
    idPliego: "",
    estado: "ACTIVO",
  });

  // Guardado de edición/registro
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");

  // Confirmación de cambio de estado
  const [openEstado, setOpenEstado] = useState<boolean>(false);
  const [estadoTarget, setEstadoTarget] = useState<UnidadEjecutoraRow | null>(null);
  const [estadoSaving, setEstadoSaving] = useState<boolean>(false);
  const [estadoError, setEstadoError] = useState<string>("");

  const load = async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const data = await UnidadEjecutoraAction.getUnidadesEjecutoras(true);
      const projected: UnidadEjecutoraRow[] = data.map((u) => ({
        ...u,
        estado: u.estado ?? "ACTIVO",
      }));
      setRows(projected);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al listar unidades ejecutoras."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = toText(q);
    return rows.filter((r) => {
      const e = normEstado(r.estado ?? "ACTIVO");
      if (estadoFilter !== "TODOS" && e !== estadoFilter) return false;
      if (!qq) return true;

      return (
        toText(r.codigo).includes(qq) ||
        toText(r.nombre).includes(qq) ||
        toText(r.tipo).includes(qq) ||
        toText(r.idPliego).includes(qq)
      );
    });
  }, [rows, q, estadoFilter]);

  const paged = useMemo(() => {
    const start = page * rpp;
    return filtered.slice(start, start + rpp);
  }, [filtered, page, rpp]);

  const onView = (r: UnidadEjecutoraRow): void => {
    setViewRow(r);
    setOpenView(true);
  };

  // ✅ NUEVO: crear
  const onCreate = (): void => {
    setSaveError("");
    setIsCreate(true);
    setViewRow(null);

    setForm({
      idUnidadEjecutora: 0,
      codigo: "",
      nombre: "",
      tipo: "",
      idPliego: "",
      estado: "ACTIVO",
    });

    setOpenEdit(true);
  };

  const onEdit = (r: UnidadEjecutoraRow): void => {
    setSaveError("");
    setIsCreate(false);
    setViewRow(r);

    setForm({
      idUnidadEjecutora: r.idUnidadEjecutora,
      codigo: r.codigo,
      nombre: r.nombre,
      tipo: r.tipo ?? "",
      idPliego: r.idPliego != null ? String(r.idPliego) : "",
      estado: normEstado(r.estado),
    });

    setOpenEdit(true);
  };

  const onConfirmEstado = (r: UnidadEjecutoraRow): void => {
    setEstadoError("");
    setEstadoTarget(r);
    setOpenEstado(true);
  };

  const patchForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSave = useMemo(() => {
    return form.codigo.trim().length >= 2 && form.nombre.trim().length >= 3;
  }, [form.codigo, form.nombre]);

  const save = async (): Promise<void> => {
    setSaving(true);
    setSaveError("");
    try {
      const idPliegoNum = form.idPliego.trim().length === 0 ? null : Number(form.idPliego);
      if (idPliegoNum !== null && Number.isNaN(idPliegoNum)) {
        setSaveError("El campo Pliego debe ser numérico (o vacío).");
        return;
      }

      const payload = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        tipo: form.tipo.trim() || null,
        idPliego: idPliegoNum,
        estado: form.estado,
      };

      if (isCreate) {
        // ✅ NUEVO: crear
        await UnidadEjecutoraAction.createUnidadEjecutora(payload);
      } else {
        // ✅ existente: editar
        await UnidadEjecutoraAction.updateUnidadEjecutora(form.idUnidadEjecutora, payload);
      }

      setOpenEdit(false);
      await load();
    } catch (err: unknown) {
      setSaveError(getErrorMessage(err, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  };

  const doCambiarEstado = async (): Promise<void> => {
    if (!estadoTarget) return;

    setEstadoSaving(true);
    setEstadoError("");
    try {
      const actual = normEstado(estadoTarget.estado);
      const nuevo: Estado = actual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      await UnidadEjecutoraAction.cambiarEstado(estadoTarget.idUnidadEjecutora, nuevo);

      setOpenEstado(false);
      setEstadoTarget(null);
      await load();
    } catch (err: unknown) {
      setEstadoError(getErrorMessage(err, "No se pudo cambiar el estado."));
    } finally {
      setEstadoSaving(false);
    }
  };

  const estadoConfirmText = useMemo(() => {
    if (!estadoTarget) return "";
    const actual = normEstado(estadoTarget.estado);
    const accion = actual === "ACTIVO" ? "inactivar" : "activar";
    return `¿Deseas ${accion} la unidad ejecutora ${estadoTarget.codigo} - ${estadoTarget.nombre}?`;
  }, [estadoTarget]);

  const goOerAer = (r: UnidadEjecutoraRow) => {
    navigate(`/planeamiento/pdrc-oer-aer/ue/${r.idUnidadEjecutora}`);
  };

  const goActividadOperativa = (r: UnidadEjecutoraRow) => {
    navigate(`/poi/oei-aei-ao/ue/${r.idUnidadEjecutora}`);
  };

  return (
    <Box sx={{ p: 2.25 }}>
      {/* Header */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 950 }}>
          POI: Unidades Ejecutoras
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }}>
          Lista y edición de Unidades Ejecutoras (poi_unidades_ejecutoras).
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 2.5, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
        {loading ? <LinearProgress /> : null}

        {/* Toolbar */}
        <Toolbar sx={{ gap: 1.25, py: 1.25 }}>
          <TextField
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar (código / nombre / tipo / pliego)…"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            value={estadoFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEstadoFilter(e.target.value as EstadoFilter);
              setPage(0);
            }}
            sx={{ width: 180 }}
          >
            <MenuItem value="TODOS">TODOS</MenuItem>
            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
            <MenuItem value="INACTIVO">INACTIVO</MenuItem>
          </TextField>

          {/* ✅ NUEVO BOTÓN (sin borrar nada de lo existente) 
          <Button
            variant="contained"
            size="small"
            onClick={onCreate} // tu handler para abrir modal de nueva UE
            startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              height: 36,                 // mismo alto que el TextField size small
              borderRadius: 1.6,
              px: 3.2,
              fontWeight: 900,
              textTransform: "none",
              boxShadow: "0 12px 24px rgba(25,118,210,.22)",
              whiteSpace: "nowrap",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 16px 30px rgba(25,118,210,.28)",
              },
              transition: "all .15s ease",
            }}
          >
            NUEVA UE
          </Button>*/}


          <Tooltip title="Refrescar">
            <IconButton onClick={() => void load()}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>

          <Chip label={`${filtered.length} registros`} variant="outlined" sx={{ fontWeight: 900 }} />
        </Toolbar>

        <Divider />

        {error ? (
          <Box sx={{ p: 2 }}>
            <Typography sx={{ color: "error.main", fontWeight: 900 }}>{error}</Typography>
          </Box>
        ) : null}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 900 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Pliego</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  Acción
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paged.map((r) => (
                <TableRow key={r.idUnidadEjecutora} hover>
                  <TableCell sx={{ fontWeight: 900 }}>{r.codigo}</TableCell>
                  <TableCell>{r.nombre}</TableCell>
                  <TableCell>{r.tipo ?? "—"}</TableCell>
                  <TableCell>{r.idPliego ?? "—"}</TableCell>
                  <TableCell>
                    <Box sx={pillSx(r.estado)}>{normEstado(r.estado).toUpperCase()}</Box>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Actividad Operativa">
                      <IconButton
                        size="small"
                        onClick={() => goActividadOperativa(r)}
                        sx={{
                          ...actionBtnSx(),
                          "&:hover": {
                            ...actionBtnSx()["&:hover"],
                            bgcolor: "rgba(99,102,241,.10)",
                            borderColor: "rgba(99,102,241,.35)",
                          },
                        }}
                      >
                        <FactCheckRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* ✅ abrir PdrcOeAePage */}
                    <Tooltip title="OER/AER (PDRC)">
                      <IconButton size="small" onClick={() => goOerAer(r)} sx={actionBtnSx()}>
                        <AccountTreeRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Ver">
                      <IconButton size="small" onClick={() => onView(r)} sx={actionBtnSx()}>
                        <VisibilityRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => onEdit(r)} sx={actionBtnSx()}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={normEstado(r.estado) === "ACTIVO" ? "Inactivar" : "Activar"}>
                      <IconButton size="small" onClick={() => onConfirmEstado(r)} sx={actionBtnSx()}>
                        <PowerSettingsNewRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 4, textAlign: "center", color: "text.secondary", fontWeight: 800 }}>
                    No hay registros para mostrar.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rpp}
          onRowsPerPageChange={(e) => {
            setRpp(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* ===== Dialog Ver ===== */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Detalle de Unidad Ejecutora
          <IconButton onClick={() => setOpenView(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <LabelValue label="Código" value={viewRow?.codigo} />
            <LabelValue label="Estado" value={<Box sx={pillSx(viewRow?.estado)}>{normEstado(viewRow?.estado)}</Box>} />
            <LabelValue label="Nombre" value={viewRow?.nombre} />
            <LabelValue label="Tipo" value={viewRow?.tipo} />
            <LabelValue label="Pliego" value={viewRow?.idPliego} />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Editar/Crear ===== */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {isCreate ? "Nueva Unidad Ejecutora" : "Editar Unidad Ejecutora"}
          <IconButton onClick={() => setOpenEdit(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {saveError ? (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>{saveError}</Typography>
            </Box>
          ) : null}

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.25 }}>
            <TextField label="Código" value={form.codigo} onChange={(e) => patchForm("codigo", e.target.value)} fullWidth />
            <TextField label="Nombre" value={form.nombre} onChange={(e) => patchForm("nombre", e.target.value)} fullWidth />
            <TextField label="Tipo" value={form.tipo} onChange={(e) => patchForm("tipo", e.target.value)} fullWidth />
            <TextField label="Pliego" value={form.idPliego} onChange={(e) => patchForm("idPliego", e.target.value)} fullWidth placeholder="(opcional)" />
            <TextField label="Estado" select value={form.estado} onChange={(e) => patchForm("estado", e.target.value as Estado)} fullWidth>
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void save()} disabled={saving || !canSave}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Estado ===== */}
      <Dialog open={openEstado} onClose={() => setOpenEstado(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Confirmar
          <IconButton onClick={() => setOpenEstado(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {estadoError ? (
            <Typography sx={{ color: "error.main", fontWeight: 900, mb: 1 }}>{estadoError}</Typography>
          ) : null}
          <Typography sx={{ fontWeight: 800 }}>{estadoConfirmText}</Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenEstado(false)} disabled={estadoSaving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void doCambiarEstado()} disabled={estadoSaving}>
            {estadoSaving ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
