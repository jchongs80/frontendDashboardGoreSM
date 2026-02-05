import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import CatalogoTablePage, { type ColumnDef } from "../components/CatalogoTablePage";
import { CatalogoAction, type UnidadOrganizacionalDto, type UnidadOrganizacionalUpdateDto } from "../CatalogoAction";

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

function LabelValue({ label, value }: { label: string; value?: any }) {
  return (
    <Box sx={{ display: "grid", gap: 0.3 }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

export default function UnidadesOrgPage() {
  const [rows, setRows] = useState<UnidadOrganizacionalDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // view
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<UnidadOrganizacionalDto | null>(null);

  // edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<UnidadOrganizacionalDto | null>(null);
  const [saving, setSaving] = useState(false);
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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CatalogoAction.getUnidadesOrganizacionales();
      setRows(data);
    } catch (e: any) {
      setError(e.message ?? "Error cargando unidades organizacionales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

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
    } catch (e: any) {
      setSaveError(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
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
        <DialogTitle
          sx={{
            fontWeight: 950,
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(15,118,110,.10) 0%, rgba(255,255,255,1) 85%)",
            borderBottom: "1px solid rgba(2,6,23,.08)",
          }}
        >
          Detalle — Unidad Organizacional
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 3,
              background:
                "linear-gradient(90deg, rgba(59,130,246,.9), rgba(16,185,129,.9), rgba(249,115,22,.9))",
              opacity: 0.85,
            }}
          />
        </DialogTitle>
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
                  <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                    {viewRow.nombre}
                  </Typography>
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
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* EDITAR */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            fontWeight: 950,
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(15,118,110,.10) 0%, rgba(255,255,255,1) 85%)",
            borderBottom: "1px solid rgba(2,6,23,.08)",
          }}
        >
          Editar Unidad Organizacional
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 3,
              background:
                "linear-gradient(90deg, rgba(59,130,246,.9), rgba(16,185,129,.9), rgba(249,115,22,.9))",
              opacity: 0.85,
            }}
          />
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {saveError && (
              <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)" }}>
                <Typography sx={{ fontWeight: 900, color: "error.main" }}>{saveError}</Typography>
              </Box>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Siglas"
                value={form.siglas ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, siglas: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Tipo"
                value={form.tipo ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                fullWidth
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Responsable (cargo)"
                value={form.responsableCargo ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, responsableCargo: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Responsable (nombre)"
                value={form.responsableNombre ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, responsableNombre: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Unidad padre (ID)"
                type="number"
                value={form.idUnidadPadre ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    idUnidadPadre: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                fullWidth
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Email"
                value={form.email ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Teléfono"
                value={form.telefono ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Estado"
                select
                value={form.estado ?? "ACTIVO"}
                onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
                fullWidth
              >
                <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                <MenuItem value="INACTIVO">INACTIVO</MenuItem>
              </TextField>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} variant="contained" disabled={saving || !form.nombre.trim()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}