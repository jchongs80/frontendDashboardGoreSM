import { useEffect, useMemo, useState } from "react";
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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import { useAuth } from "../../auth/AuthContext"; // 🔁 ajusta ruta
import {
  UsuariosAction,
  type UsuarioDto,
  type CreateUsuarioDto,
  type UpdateUsuarioDto,
} from "../actions/UsuariosAction";
import {
  PerfilesAction,
  type PerfilDto,
} from "../actions/PerfilesActions";

type FormMode = "new" | "edit";

function safe(v: unknown) {
  return (v ?? "").toString();
}

function obtenerNombreUsuario(row: UsuarioDto) {
  return row.nombreCompleto ?? row.username;
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const canManageUsers = !!user?.permisos?.puedeCrearUsuarios;

  const [rows, setRows] = useState<UsuarioDto[]>([]);
  const [perfiles, setPerfiles] = useState<PerfilDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<number | null>(null);

  // Dialog
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>("new");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CreateUsuarioDto>({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    email: "",
    username: "",
    password: "",
    idPerfil: 0,
    idUnidad: null,
    telefono: "",
    cargo: "",
  });

  const [editId, setEditId] = useState<number | null>(null);

  const title = useMemo(
    () => (mode === "new" ? "Nuevo usuario" : "Editar usuario"),
    [mode]
  );

  async function cargar() {
    setLoading(true);
    setError(null);

    try {
      const [u, p] = await Promise.all([
        UsuariosAction.listar(),
        PerfilesAction.listar(),
      ]);

      setRows(u ?? []);
      setPerfiles(p ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canManageUsers) {
      void cargar();
    }
  }, [canManageUsers]);

  function openNew() {
    setMode("new");
    setEditId(null);
    setError(null);

    setForm({
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      email: "",
      username: "",
      password: "",
      idPerfil: perfiles[0]?.idPerfil ?? 0,
      idUnidad: null,
      telefono: "",
      cargo: "",
    });

    setOpen(true);
  }

  function openEdit(row: UsuarioDto) {
    // Un usuario inactivo primero debe ser activado antes de poder editarse.
    if (!row.activo) {
      return;
    }

    setMode("edit");
    setEditId(row.idUsuario);
    setError(null);

    setForm({
      nombre: row.nombre ?? "",
      apellidoPaterno: row.apellidoPaterno ?? "",
      apellidoMaterno: row.apellidoMaterno ?? "",
      email: row.email ?? "",
      username: row.username ?? "",
      password: "",
      idPerfil: row.idPerfil ?? (perfiles[0]?.idPerfil ?? 0),
      idUnidad: null,
      telefono: row.telefono ?? "",
      cargo: row.cargo ?? "",
    });

    setOpen(true);
  }

  async function guardar() {
    setSaving(true);
    setError(null);

    try {
      if (mode === "new") {
        if (!form.password || form.password.length < 8) {
          throw new Error("Password mínimo 8 caracteres");
        }

        if (!form.idPerfil) {
          throw new Error("Selecciona un perfil");
        }

        await UsuariosAction.crear(form);
      } else {
        if (!editId) {
          throw new Error("Id de usuario inválido");
        }

        const dto: UpdateUsuarioDto = {
          idUsuario: editId,
          nombre: form.nombre,
          apellidoPaterno: form.apellidoPaterno,
          apellidoMaterno: form.apellidoMaterno,
          email: form.email,
          idPerfil: form.idPerfil,
          idUnidad: form.idUnidad,
          telefono: form.telefono,
          cargo: form.cargo,
          fotoUrl: null,
        };

        await UsuariosAction.actualizar(editId, dto);
      }

      setOpen(false);
      await cargar();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  async function inactivar(row: UsuarioDto) {
    const nombre = obtenerNombreUsuario(row);

    if (!confirm(`¿Está seguro de inactivar a ${nombre}?`)) {
      return;
    }

    setChangingId(row.idUsuario);
    setError(null);

    try {
      await UsuariosAction.inactivar(row.idUsuario);
      await cargar();
    } catch (e: any) {
      setError(e?.message ?? "Error inactivando usuario");
    } finally {
      setChangingId(null);
    }
  }

  async function activar(row: UsuarioDto) {
    const nombre = obtenerNombreUsuario(row);

    if (!confirm(`¿Está seguro de activar a ${nombre}?`)) {
      return;
    }

    setChangingId(row.idUsuario);
    setError(null);

    try {
      await UsuariosAction.activar(row.idUsuario);
      await cargar();
    } catch (e: any) {
      setError(e?.message ?? "Error activando usuario");
    } finally {
      setChangingId(null);
    }
  }

  if (!canManageUsers) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
          Usuarios
        </Typography>

        <Typography sx={{ mt: 1, color: "text.secondary" }}>
          No tienes permisos para gestionar usuarios.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
              Usuarios
            </Typography>

            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
              Crear, editar, activar e inactivar usuarios del sistema
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Refrescar">
              <IconButton onClick={() => void cargar()} disabled={loading}>
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={openNew}
              disabled={loading}
            >
              Nuevo
            </Button>
          </Stack>
        </Toolbar>

        <Divider />

        {error && (
          <Box sx={{ px: 2, py: 1.2 }}>
            <Typography sx={{ color: "error.main", fontSize: 13 }}>
              {error}
            </Typography>
          </Box>
        )}

        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.2fr 1.2fr 0.8fr 0.8fr",
              gap: 1,
              px: 1,
              pb: 1,
            }}
          >
            <Typography
              sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}
            >
              Nombre
            </Typography>

            <Typography
              sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}
            >
              Email
            </Typography>

            <Typography
              sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}
            >
              Usuario
            </Typography>

            <Typography
              sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}
            >
              Perfil
            </Typography>

            <Typography
              sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}
            >
              Estado
            </Typography>
          </Box>

          {rows.map((r) => {
            const changing = changingId === r.idUsuario;

            return (
              <Paper
                key={r.idUsuario}
                sx={{
                  mb: 1,
                  p: 1.2,
                  borderRadius: 2.5,
                  border: "1px solid #EEF2F7",
                  opacity: changing ? 0.65 : 1,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.6fr 1.2fr 1.2fr 0.8fr 0.8fr",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 850, fontSize: 14 }}>
                      {r.nombreCompleto ??
                        `${r.nombre} ${r.apellidoPaterno ?? ""}`.trim()}
                    </Typography>

                    <Typography
                      sx={{ fontSize: 12, color: "text.secondary" }}
                    >
                      {r.cargo ?? ""}
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: 13 }}>
                    {r.email}
                  </Typography>

                  <Typography sx={{ fontSize: 13 }}>
                    {r.username}
                  </Typography>

                  <Typography sx={{ fontSize: 13 }}>
                    {r.perfilNombre ?? "-"}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Chip
                      size="small"
                      label={r.activo ? "Activo" : "Inactivo"}
                      color={r.activo ? "success" : "default"}
                      variant={r.activo ? "filled" : "outlined"}
                    />

                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip
                        title={
                          r.activo
                            ? "Editar usuario"
                            : "Activa el usuario para poder editarlo"
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => openEdit(r)}
                            disabled={!r.activo || changing}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {r.activo ? (
                        <Tooltip title="Inactivar usuario">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => void inactivar(r)}
                              disabled={changing}
                              color="error"
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Activar usuario">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => void activar(r)}
                              disabled={changing}
                              color="success"
                            >
                              <CheckCircleOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Paper>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {title}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.2,
              mt: 1,
            }}
          >
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) =>
                setForm((p) => ({ ...p, nombre: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Apellido paterno"
              value={safe(form.apellidoPaterno)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  apellidoPaterno: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              label="Apellido materno"
              value={safe(form.apellidoMaterno)}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  apellidoMaterno: e.target.value,
                }))
              }
              fullWidth
            />

            <TextField
              label="Username"
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
              fullWidth
              disabled={mode === "edit"}
            />

            <TextField
              select
              label="Perfil"
              value={form.idPerfil}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idPerfil: Number(e.target.value),
                }))
              }
              fullWidth
            >
              {perfiles.map((p) => (
                <MenuItem key={p.idPerfil} value={p.idPerfil}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Teléfono"
              value={safe(form.telefono)}
              onChange={(e) =>
                setForm((p) => ({ ...p, telefono: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Cargo"
              value={safe(form.cargo)}
              onChange={(e) =>
                setForm((p) => ({ ...p, cargo: e.target.value }))
              }
              fullWidth
            />

            {mode === "new" && (
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                fullWidth
                helperText="Mínimo 8 caracteres"
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            onClick={() => void guardar()}
            variant="contained"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}