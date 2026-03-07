import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CatalogoTablePage, { type ColumnDef } from "../components/CatalogoTablePage";
import {
  CatalogoAction,
  type UnidadOrganizacionalCreateDto,
  type UnidadOrganizacionalDto,
  type UnidadOrganizacionalUpdateDto,
} from "../CatalogoAction";

/** ✅ Utilidad sin `any` para leer mensajes de error */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;

  // Si tu wrapper api devuelve { message: "..." } o { error: "..." }
  if (typeof err === "object" && err !== null) {
    const rec = err as Record<string, unknown>;
    const msg = rec["message"];
    const error = rec["error"];
    if (typeof msg === "string") return msg;
    if (typeof error === "string") return error;
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
  bgcolor: estado === "ACTIVO" ? "rgba(16,185,129,.10)" : "rgba(239,68,68,.10)",
});

function LabelValue({ label, value }: { label: string; value?: unknown }) {
  return (
    <Box sx={{ display: "grid", gap: 0.3 }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>{String(value ?? "—")}</Typography>
    </Box>
  );
}

export default function UnidadesOrgPage() {
  const [rows, setRows] = useState<UnidadOrganizacionalDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // view
  const [openView, setOpenView] = useState<boolean>(false);
  const [viewRow, setViewRow] = useState<UnidadOrganizacionalDto | null>(null);

  // edit
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [editing, setEditing] = useState<UnidadOrganizacionalDto | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<UnidadOrganizacionalUpdateDto>({
    nombre: "",
    siglas: "",
    tipo: "",
    idUnidadPadre: null,
    responsableCargo: "",
    responsableNombre: "",
    email: "",
    telefono: "",
    estado: "ACTIVO",
  });

  // create
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<UnidadOrganizacionalCreateDto>({
    codigo: "",
    nombre: "",
    siglas: "",
    tipo: "",
    idUnidadPadre: null,
    responsableCargo: "",
    responsableNombre: "",
    email: "",
    telefono: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CatalogoAction.getUnidadesOrganizacionales();
      setRows(data);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<UnidadOrganizacionalDto>[]>(
    () => [
      { key: "codigo", header: "Código", sortable: true, width: 120 },
      { key: "nombre", header: "Nombre", sortable: true },
      { key: "siglas", header: "Siglas", width: 120 },
      { key: "tipo", header: "Tipo", width: 160 },
      { key: "responsableNombre", header: "Responsable" },
      { key: "email", header: "Email" },
      {
        key: "estado",
        header: "Estado",
        sortable: true,
        width: 120,
        render: (r) => <Box sx={pillSx(r.estado)}>{r.estado ?? "—"}</Box>,
      },
    ],
    []
  );

  const onView = (r: UnidadOrganizacionalDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = (r: UnidadOrganizacionalDto) => {
    setEditing(r);
    setSaveError(null);
    setForm({
      nombre: r.nombre ?? "",
      siglas: r.siglas ?? "",
      tipo: r.tipo ?? "",
      idUnidadPadre: r.idUnidadPadre ?? null,
      responsableCargo: r.responsableCargo ?? "",
      responsableNombre: r.responsableNombre ?? "",
      email: r.email ?? "",
      telefono: r.telefono ?? "",
      estado: r.estado ?? "ACTIVO",
    });
    setOpenEdit(true);
  };

  const save = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setSaveError(null);
      await CatalogoAction.updateUnidadOrg(editing.idUnidad, form);
      setOpenEdit(false);
      await load();
    } catch (e: unknown) {
      setSaveError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onOpenCreate = () => {
    setCreateError(null);
    setCreateForm({
      codigo: "",
      nombre: "",
      siglas: "",
      tipo: "",
      idUnidadPadre: null,
      responsableCargo: "",
      responsableNombre: "",
      email: "",
      telefono: "",
    });
    setOpenCreate(true);
  };

  const create = async () => {
    const codigo = (createForm.codigo ?? "").trim();
    const nombre = (createForm.nombre ?? "").trim();

    if (!codigo || !nombre) {
      setCreateError("Código y Nombre son obligatorios.");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      await CatalogoAction.createUnidadOrg({
        ...createForm,
        codigo: codigo.toUpperCase(),
        nombre,
      });

      setOpenCreate(false);
      await load();
    } catch (e: unknown) {
      setCreateError(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          "& .MuiTableContainer-root": {
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid rgba(2,6,23,.08)",
            boxShadow: "0 10px 30px rgba(2,6,23,.06)",
          },
          "& .MuiTableHead-root .MuiTableCell-head": {
            position: "sticky",
            top: 0,
            zIndex: 2,
            background:
              "linear-gradient(180deg, rgba(15,118,110,.12) 0%, rgba(15,118,110,.06) 60%, rgba(255,255,255,1) 100%)",
            backdropFilter: "blur(6px)",
            fontWeight: 900,
            letterSpacing: ".4px",
            color: "rgba(2,6,23,.85)",
            borderBottom: "1px solid rgba(2,6,23,.12)",
            boxShadow: "inset 0 -1px 0 rgba(2,6,23,.06)",
          },
          "& .MuiTableHead-root": { position: "relative" },
          "& .MuiTableHead-root::before": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 3,
            background:
              "linear-gradient(90deg, rgba(59,130,246,.9), rgba(16,185,129,.9), rgba(249,115,22,.9))",
            opacity: 0.85,
            zIndex: 3,
          },
          "& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root": {
            backgroundColor: "rgba(15,118,110,.04)",
          },
        }}
      >
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Button
            variant="contained"
            onClick={onOpenCreate}
            sx={{
              borderRadius: 2.5,
              fontWeight: 900,
              px: 2.2,
              boxShadow: "0 10px 25px rgba(0,0,0,.08)",
            }}
          >
            + Nuevo
          </Button>
        </Stack>

        <CatalogoTablePage
          title="Catálogo: Unidades Organizacionales"
          subtitle="Visualiza y edita unidades org (campos permitidos por backend)."
          rows={rows}
          loading={loading}
          error={error}
          columns={columns}
          getRowId={(r) => r.idUnidad}
          searchKeys={["codigo", "nombre", "siglas", "tipo", "responsableNombre", "email", "estado"]}
          onRefresh={load}
          allowEdit={true}
          onView={onView}
          onEdit={onEdit}
        />
      </Box>

      {/* VER */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950 }}>Detalle — Unidad Organizacional</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #EEF2F7",
                  bgcolor: "#FAFBFD",
                  display: "grid",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 16 }}>{viewRow.nombre}</Typography>
                  <Box sx={pillSx(viewRow.estado)}>{viewRow.estado ?? "—"}</Box>
                </Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  {viewRow.codigo} • {viewRow.siglas ?? "—"} • {viewRow.tipo ?? "—"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                <LabelValue label="Código" value={viewRow.codigo} />
                <LabelValue label="Siglas" value={viewRow.siglas} />
                <LabelValue label="Tipo" value={viewRow.tipo} />
                <LabelValue label="Responsable (cargo)" value={viewRow.responsableCargo} />
                <LabelValue label="Responsable (nombre)" value={viewRow.responsableNombre} />
                <LabelValue label="Unidad padre (ID)" value={viewRow.idUnidadPadre} />
                <LabelValue label="Email" value={viewRow.email} />
                <LabelValue label="Teléfono" value={viewRow.telefono} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)} sx={{ fontWeight: 900 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDITAR */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950 }}>Editar — Unidad Organizacional</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {saveError}
            </Alert>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Siglas"
              value={form.siglas ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, siglas: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Tipo"
              value={form.tipo ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
              fullWidth
              select
            >
              <MenuItem value="">(Sin tipo)</MenuItem>
              <MenuItem value="OFICINA">OFICINA</MenuItem>
              <MenuItem value="DIRECCION">DIRECCION</MenuItem>
              <MenuItem value="GERENCIA">GERENCIA</MenuItem>
              <MenuItem value="UNIDAD">UNIDAD</MenuItem>
            </TextField>

            <TextField
              label="Estado"
              value={form.estado ?? "ACTIVO"}
              onChange={(e) => setForm((s) => ({ ...s, estado: e.target.value }))}
              fullWidth
              select
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>

            <TextField
              label="Responsable (Cargo)"
              value={form.responsableCargo ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, responsableCargo: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Responsable (Nombre)"
              value={form.responsableNombre ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, responsableNombre: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              value={form.email ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Teléfono"
              value={form.telefono ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, telefono: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Unidad Padre"
              value={form.idUnidadPadre ?? ""}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  idUnidadPadre: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
              select
            >
              <MenuItem value="">(Sin unidad padre)</MenuItem>
              {rows.map((u) => (
                <MenuItem key={u.idUnidad} value={u.idUnidad}>
                  {u.codigo} - {u.nombre}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving} sx={{ fontWeight: 900 }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={save} disabled={saving} sx={{ fontWeight: 900 }}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREAR */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950 }}>Nuevo — Unidad Organizacional</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {createError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {createError}
            </Alert>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            <TextField
              label="Código *"
              value={createForm.codigo}
              onChange={(e) => setCreateForm((s) => ({ ...s, codigo: e.target.value }))}
              fullWidth
              helperText="Ej: UO-001"
            />
            <TextField
              label="Nombre *"
              value={createForm.nombre}
              onChange={(e) => setCreateForm((s) => ({ ...s, nombre: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Siglas"
              value={createForm.siglas ?? ""}
              onChange={(e) => setCreateForm((s) => ({ ...s, siglas: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Tipo"
              value={createForm.tipo ?? ""}
              onChange={(e) => setCreateForm((s) => ({ ...s, tipo: e.target.value }))}
              fullWidth
              select
            >
              <MenuItem value="">(Sin tipo)</MenuItem>
              <MenuItem value="OFICINA">OFICINA</MenuItem>
              <MenuItem value="DIRECCION">DIRECCION</MenuItem>
              <MenuItem value="GERENCIA">GERENCIA</MenuItem>
              <MenuItem value="UNIDAD">UNIDAD</MenuItem>
            </TextField>

            <TextField
              label="Unidad Padre"
              value={createForm.idUnidadPadre ?? ""}
              onChange={(e) =>
                setCreateForm((s) => ({
                  ...s,
                  idUnidadPadre: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
              select
            >
              <MenuItem value="">(Sin unidad padre)</MenuItem>
              {rows.map((u) => (
                <MenuItem key={u.idUnidad} value={u.idUnidad}>
                  {u.codigo} - {u.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Responsable (Cargo)"
              value={createForm.responsableCargo ?? ""}
              onChange={(e) => setCreateForm((s) => ({ ...s, responsableCargo: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Responsable (Nombre)"
              value={createForm.responsableNombre ?? ""}
              onChange={(e) => setCreateForm((s) => ({ ...s, responsableNombre: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              value={createForm.email ?? ""}
              onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Teléfono"
              value={createForm.telefono ?? ""}
              onChange={(e) => setCreateForm((s) => ({ ...s, telefono: e.target.value }))}
              fullWidth
            />
          </Box>

          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
            El backend creará la unidad en estado <b>ACTIVO</b> automáticamente.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating} sx={{ fontWeight: 900 }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={create} disabled={creating} sx={{ fontWeight: 900 }}>
            {creating ? "Creando..." : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
