import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { PerfilesAction, type PerfilDto } from "../actions/PerfilesActions";

type FormMode = "new" | "edit";

type FormField =
  | "nombre"
  | "apellidoPaterno"
  | "apellidoMaterno"
  | "email"
  | "username"
  | "password"
  | "idPerfil"
  | "telefono"
  | "cargo";

type FormErrors = Partial<Record<FormField, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safe(v: unknown) {
  return (v ?? "").toString();
}

function obtenerNombreUsuario(row: UsuarioDto) {
  return row.nombreCompleto ?? row.username;
}

function obtenerMensajeErrorApi(error: unknown): {
  message: string;
  fieldErrors: FormErrors;
} {
  const fallback = {
    message: "No se pudo guardar el usuario. Revisa los datos ingresados.",
    fieldErrors: {} as FormErrors,
  };

  if (!error) return fallback;

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  let payload: any = error;
  try {
    payload = JSON.parse(raw);
  } catch {
    // El error no siempre llega como JSON.
  }

  const validationErrors = payload?.errors ?? payload?.response?.data?.errors;
  const fieldErrors: FormErrors = {};

  if (validationErrors && typeof validationErrors === "object") {
    for (const [field, messages] of Object.entries(validationErrors)) {
      const message = Array.isArray(messages)
        ? String(messages[0] ?? "")
        : String(messages ?? "");
      const normalized = field.toLowerCase();

      if (normalized === "email") fieldErrors.email = message;
      else if (normalized === "nombre") fieldErrors.nombre = message;
      else if (normalized === "username") fieldErrors.username = message;
      else if (normalized === "password") fieldErrors.password = message;
      else if (normalized === "idperfil") fieldErrors.idPerfil = message;
      else if (normalized === "telefono") fieldErrors.telefono = message;
      else if (normalized === "cargo") fieldErrors.cargo = message;
      else if (normalized === "apellidopaterno")
        fieldErrors.apellidoPaterno = message;
      else if (normalized === "apellidomaterno")
        fieldErrors.apellidoMaterno = message;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      message: "Corrige los campos señalados antes de guardar.",
      fieldErrors,
    };
  }

  const apiMessage =
    payload?.message ??
    payload?.response?.data?.message ??
    payload?.title ??
    payload?.response?.data?.title;

  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return { message: apiMessage, fieldErrors };
  }

  if (typeof raw === "string" && raw.trim() && raw !== "[object Object]") {
    return { message: raw, fieldErrors };
  }

  return fallback;
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
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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
    [mode],
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

  function limpiarErrorCampo(field: FormField) {
    setFormErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function actualizarCampo<K extends keyof CreateUsuarioDto>(
    field: K,
    value: CreateUsuarioDto[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setDialogError(null);
    limpiarErrorCampo(field as FormField);
  }

  function validarFormulario(): boolean {
    const errors: FormErrors = {};

    if (!form.nombre.trim()) {
      errors.nombre = "Ingresa el nombre del usuario.";
    }

    const email = form.email.trim();
    if (!email) {
      errors.email = "Ingresa el correo electrónico.";
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email =
        "Ingresa un correo válido, por ejemplo: usuario@dominio.com";
    }

    if (mode === "new") {
      if (!form.username.trim()) {
        errors.username = "Ingresa el nombre de usuario.";
      } else if (form.username.trim().length < 4) {
        errors.username = "El usuario debe tener al menos 4 caracteres.";
      }

      if (!form.password) {
        errors.password = "Ingresa una contraseña.";
      } else if (form.password.length < 8) {
        errors.password = "La contraseña debe tener al menos 8 caracteres.";
      }
    }

    if (!form.idPerfil) {
      errors.idPerfil = "Selecciona un perfil.";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setDialogError("Corrige los campos señalados antes de guardar.");
      return false;
    }

    setDialogError(null);
    return true;
  }

  function cerrarDialogo() {
    if (saving) return;
    setOpen(false);
    setDialogError(null);
    setFormErrors({});
  }

  function openNew() {
    setMode("new");
    setEditId(null);
    setError(null);
    setDialogError(null);
    setFormErrors({});

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
    setDialogError(null);
    setFormErrors({});

    setForm({
      nombre: row.nombre ?? "",
      apellidoPaterno: row.apellidoPaterno ?? "",
      apellidoMaterno: row.apellidoMaterno ?? "",
      email: row.email ?? "",
      username: row.username ?? "",
      password: "",
      idPerfil: row.idPerfil ?? perfiles[0]?.idPerfil ?? 0,
      idUnidad: null,
      telefono: row.telefono ?? "",
      cargo: row.cargo ?? "",
    });

    setOpen(true);
  }

  async function guardar() {
    setDialogError(null);

    if (!validarFormulario()) return;

    setSaving(true);

    try {
      if (mode === "new") {
        await UsuariosAction.crear({
          ...form,
          nombre: form.nombre.trim(),
          apellidoPaterno: form.apellidoPaterno?.trim(),
          apellidoMaterno: form.apellidoMaterno?.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          telefono: form.telefono?.trim(),
          cargo: form.cargo?.trim(),
        });
      } else {
        if (!editId) {
          setDialogError(
            "No se pudo identificar al usuario que deseas editar.",
          );
          return;
        }

        const dto: UpdateUsuarioDto = {
          idUsuario: editId,
          nombre: form.nombre.trim(),
          apellidoPaterno: form.apellidoPaterno?.trim(),
          apellidoMaterno: form.apellidoMaterno?.trim(),
          email: form.email.trim(),
          idPerfil: form.idPerfil,
          idUnidad: form.idUnidad,
          telefono: form.telefono?.trim(),
          cargo: form.cargo?.trim(),
          fotoUrl: null,
        };

        await UsuariosAction.actualizar(editId, dto);
      }

      setOpen(false);
      setDialogError(null);
      setFormErrors({});
      await cargar();
    } catch (e: unknown) {
      const result = obtenerMensajeErrorApi(e);
      setDialogError(result.message);
      setFormErrors((previous) => ({
        ...previous,
        ...result.fieldErrors,
      }));
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
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Usuarios</Typography>

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
                    gridTemplateColumns: "1.6fr 1.2fr 1.2fr 0.8fr 0.8fr",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 850, fontSize: 14 }}>
                      {r.nombreCompleto ??
                        `${r.nombre} ${r.apellidoPaterno ?? ""}`.trim()}
                    </Typography>

                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                      {r.cargo ?? ""}
                    </Typography>
                  </Box>

                  <Typography sx={{ fontSize: 13 }}>{r.email}</Typography>

                  <Typography sx={{ fontSize: 13 }}>{r.username}</Typography>

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

      <Dialog open={open} onClose={cerrarDialogo} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>

        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mt: 1, mb: 1.5 }}>
              {dialogError}
            </Alert>
          )}

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
              onChange={(e) => actualizarCampo("nombre", e.target.value)}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
              fullWidth
            />

            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => actualizarCampo("email", e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
              fullWidth
            />

            <TextField
              label="Apellido paterno"
              value={safe(form.apellidoPaterno)}
              onChange={(e) =>
                actualizarCampo("apellidoPaterno", e.target.value)
              }
              error={!!formErrors.apellidoPaterno}
              helperText={formErrors.apellidoPaterno}
              fullWidth
            />

            <TextField
              label="Apellido materno"
              value={safe(form.apellidoMaterno)}
              onChange={(e) =>
                actualizarCampo("apellidoMaterno", e.target.value)
              }
              error={!!formErrors.apellidoMaterno}
              helperText={formErrors.apellidoMaterno}
              fullWidth
            />

            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => actualizarCampo("username", e.target.value)}
              error={!!formErrors.username}
              helperText={formErrors.username}
              fullWidth
              disabled={mode === "edit"}
            />

            <TextField
              select
              label="Perfil"
              value={form.idPerfil}
              onChange={(e) =>
                actualizarCampo("idPerfil", Number(e.target.value))
              }
              error={!!formErrors.idPerfil}
              helperText={formErrors.idPerfil}
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
              onChange={(e) => actualizarCampo("telefono", e.target.value)}
              error={!!formErrors.telefono}
              helperText={formErrors.telefono}
              fullWidth
            />

            <TextField
              label="Cargo"
              value={safe(form.cargo)}
              onChange={(e) => actualizarCampo("cargo", e.target.value)}
              error={!!formErrors.cargo}
              helperText={formErrors.cargo}
              fullWidth
            />

            {mode === "new" && (
              <TextField
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => actualizarCampo("password", e.target.value)}
                error={!!formErrors.password}
                fullWidth
                helperText={formErrors.password ?? "Mínimo 8 caracteres"}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cerrarDialogo} variant="outlined" disabled={saving}>
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