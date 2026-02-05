import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { useNavigate } from "react-router-dom";
import { PlaneamientoAction } from "../PlaneamientoAction";
import type { UnidadOrgDto } from "../PlaneamientoAction";

type Estado = "ACTIVO" | "INACTIVO";
type EstadoFilter = "TODOS" | Estado;

/**
 * En tu backend, /api/unidades-org puede devolver más campos (siglas, tipo, email, etc.)
 * PlaneamientoAction.getUnidadesOrg hoy normaliza a UnidadOrgDto (id/codigo/nombre/estado).
 * Para UI premium, mantenemos campos opcionales por si luego amplías el Action/DTO.
 */
type UnidadRow = UnidadOrgDto & {
  siglas?: string | null;
  tipo?: string | null;
  responsableNombre?: string | null;
  responsableCargo?: string | null;
  email?: string | null;
  telefono?: string | null;
};

type FormState = {
  idUnidadOrganizacional: number;
  codigo: string;
  nombre: string;
  siglas: string;
  tipo: string;
  responsableNombre: string;
  responsableCargo: string;
  email: string;
  telefono: string;
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

function LabelValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "rgba(0,0,0,.03)" }}>
      <Typography variant="caption" sx={{ fontWeight: 900, color: "text.secondary" }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.4, fontWeight: 800 }}>{value || "—"}</Box>
    </Box>
  );
}

export default function UnidadesOrgPage2() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<UnidadRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [q, setQ] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("TODOS");

  const [page, setPage] = useState<number>(0);
  const [rpp, setRpp] = useState<number>(10);

  // Modales
  const [openView, setOpenView] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [viewRow, setViewRow] = useState<UnidadRow | null>(null);

  const [form, setForm] = useState<FormState>({
    idUnidadOrganizacional: 0,
    codigo: "",
    nombre: "",
    siglas: "",
    tipo: "",
    responsableNombre: "",
    responsableCargo: "",
    email: "",
    telefono: "",
    estado: "ACTIVO",
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");

  const load = async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const data = await PlaneamientoAction.getUnidadesOrg();
      // PlaneamientoAction.getUnidadesOrg devuelve UnidadOrgDto[]
      // Lo proyectamos a UnidadRow para UI (campos extra opcionales en el futuro)
      const projected: UnidadRow[] = data.map((u) => ({
        ...u,
        estado: u.estado ?? "ACTIVO",
      }));
      setRows(projected);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al listar unidades."));
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

      const hay =
        toText(r.codigo).includes(qq) ||
        toText(r.nombre).includes(qq) ||
        toText(r.siglas).includes(qq) ||
        toText(r.tipo).includes(qq) ||
        toText(r.responsableNombre).includes(qq) ||
        toText(r.email).includes(qq);

      return hay;
    });
  }, [rows, q, estadoFilter]);

  const paged = useMemo(() => {
    const start = page * rpp;
    return filtered.slice(start, start + rpp);
  }, [filtered, page, rpp]);

  const onView = (r: UnidadRow): void => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = (r: UnidadRow): void => {
    setSaveError("");
    setViewRow(r);

    setForm({
      idUnidadOrganizacional: r.idUnidadOrganizacional,
      codigo: r.codigo,
      nombre: r.nombre,
      siglas: r.siglas ?? "",
      tipo: r.tipo ?? "",
      responsableNombre: r.responsableNombre ?? "",
      responsableCargo: r.responsableCargo ?? "",
      email: r.email ?? "",
      telefono: r.telefono ?? "",
      estado: normEstado(r.estado),
    });

    setOpenEdit(true);
  };

  const patchForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSave = useMemo(() => {
    return form.nombre.trim().length >= 3;
  }, [form.nombre]);

  /**
   * Guardado (si tu backend soporta UPDATE).
   * Si tu endpoint es distinto, ajusta la URL aquí.
   */
  const save = async (): Promise<void> => {
    setSaving(true);
    setSaveError("");
    try {
      const { api } = await import("../../../shared/api");

      const payload = {
        nombre: form.nombre.trim(),
        siglas: form.siglas.trim() || null,
        tipo: form.tipo.trim() || null,
        responsableNombre: form.responsableNombre.trim() || null,
        responsableCargo: form.responsableCargo.trim() || null,
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        estado: form.estado,
      };

      // ✅ Ajusta si tu backend usa otra ruta:
      await api.put<void>(`/api/unidades-org/${form.idUnidadOrganizacional}`, payload);

      setOpenEdit(false);
      await load();
    } catch (err: unknown) {
      setSaveError(getErrorMessage(err, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2.25 }}>
      {/* Header */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 950 }}>
          Catálogo: Unidades Organizacionales
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }}>
          Visualiza y edita unidades org (según permisos del backend).
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
            placeholder="Buscar (código / nombre / siglas / tipo / responsable / email)…"
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
            sx={{ width: 150 }}
          >
            <MenuItem value="TODOS">TODOS</MenuItem>
            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
            <MenuItem value="INACTIVO">INACTIVO</MenuItem>
          </TextField>

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
                <TableCell sx={{ fontWeight: 900 }}>Siglas</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Responsable</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 900 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 900 }} align="right">
                  Acción
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paged.map((r) => (
                <TableRow key={r.idUnidadOrganizacional} hover>
                  <TableCell sx={{ fontWeight: 900 }}>{r.codigo}</TableCell>
                  <TableCell>{r.nombre}</TableCell>
                  <TableCell>{r.siglas ?? "—"}</TableCell>
                  <TableCell>{r.tipo ?? "—"}</TableCell>
                  <TableCell>{r.responsableNombre ?? "—"}</TableCell>
                  <TableCell>{r.email ?? "—"}</TableCell>
                  <TableCell>
                    <Box sx={pillSx(r.estado)}>{normEstado(r.estado).toUpperCase()}</Box>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Ver">
                      <IconButton size="small" onClick={() => onView(r)}>
                        <VisibilityRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => onEdit(r)}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="OE - AE">
                      <IconButton
                        size="small"
                        onClick={() => {
                          // ✅ CAMBIA ESTA RUTA si en tu App.tsx es diferente
                          navigate(`/planeamiento/pdrc-oe-ae/${r.idUnidadOrganizacional}`);
                        }}
                      >
                        <OpenInNewRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    sx={{ py: 4, textAlign: "center", color: "text.secondary", fontWeight: 800 }}
                  >
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
        <DialogTitle
          sx={{
            fontWeight: 950,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Detalle de Unidad
          <IconButton onClick={() => setOpenView(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <LabelValue label="Código" value={viewRow?.codigo} />
            <LabelValue
              label="Estado"
              value={<Box sx={pillSx(viewRow?.estado)}>{normEstado(viewRow?.estado)}</Box>}
            />
            <LabelValue label="Nombre" value={viewRow?.nombre} />
            <LabelValue label="Siglas" value={viewRow?.siglas} />
            <LabelValue label="Tipo" value={viewRow?.tipo} />
            <LabelValue label="Responsable" value={viewRow?.responsableNombre} />
            <LabelValue label="Email" value={viewRow?.email} />
            <LabelValue label="Teléfono" value={viewRow?.telefono} />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Editar ===== */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            fontWeight: 950,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          Editar Unidad
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
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patchForm("nombre", e.target.value)}
              fullWidth
            />

            <TextField
              label="Siglas"
              value={form.siglas}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patchForm("siglas", e.target.value)}
              fullWidth
            />

            <TextField
              label="Tipo"
              value={form.tipo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patchForm("tipo", e.target.value)}
              fullWidth
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.25 }}>
            <TextField
              label="Responsable"
              value={form.responsableNombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                patchForm("responsableNombre", e.target.value)
              }
              fullWidth
            />

            <TextField
              label="Cargo"
              value={form.responsableCargo}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                patchForm("responsableCargo", e.target.value)
              }
              fullWidth
            />

            <TextField
              label="Email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patchForm("email", e.target.value)}
              fullWidth
            />

            <TextField
              label="Teléfono"
              value={form.telefono}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patchForm("telefono", e.target.value)}
              fullWidth
            />

            <TextField
              label="Estado"
              select
              value={form.estado}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => patchForm("estado", e.target.value as Estado)}
              fullWidth
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void save()} disabled={!canSave || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
