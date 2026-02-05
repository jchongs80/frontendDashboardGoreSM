import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import CatalogoTablePage, { type ColumnDef } from "../components/CatalogoTablePage";
import { CatalogoAction, type ActualizarTipoIndicadorDto, type TipoIndicadorDto } from "../CatalogoAction";

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

export default function TipoIndicadorPage() {
  const [rows, setRows] = useState<TipoIndicadorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<TipoIndicadorDto | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<TipoIndicadorDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<ActualizarTipoIndicadorDto>({
    codigo: "",
    nombre: "",
    descripcion: "",
    orden: null,
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CatalogoAction.getTiposIndicador();
      setRows(data);
    } catch (e: any) {
      setError(e.message ?? "Error cargando tipos de indicador");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const columns = useMemo<ColumnDef<TipoIndicadorDto>[]>(
    () => [
      { key: "codigo", header: "Código", sortable: true, width: 120 },

      // ✅ Nombre con jerarquía visual
      {
        key: "nombre",
        header: "Nombre",
        sortable: true,
        render: (r) => (
          <Typography sx={{ fontWeight: 950, lineHeight: 1.15 }}>
            {r.nombre}
          </Typography>
        ),
      },

      // ✅ Descripción con clamp + tooltip
      {
        key: "descripcion",
        header: "Descripción",
        render: (r) => (
          <Tooltip title={r.descripcion ?? ""} arrow placement="top-start">
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                maxWidth: 520,
              }}
            >
              {r.descripcion ?? "—"}
            </Typography>
          </Tooltip>
        ),
      },

      { key: "orden", header: "Orden", sortable: true, width: 90 },
    ],
    []
  );

  const onView = (r: TipoIndicadorDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = (r: TipoIndicadorDto) => {
    setEditing(r);
    setSaveError(null);
    setForm({
      codigo: r.codigo,
      nombre: r.nombre,
      descripcion: r.descripcion ?? "",
      orden: r.orden ?? null,
    });
    setOpenEdit(true);
  };

  const save = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setSaveError(null);
      await CatalogoAction.updateTipoIndicador(editing.idTipoIndicador, form);
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
        title="Catálogo: Tipos de Indicador"
        subtitle="Visualiza y edita tipos de indicador."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idTipoIndicador}
        searchKeys={["codigo", "nombre", "descripcion"]}
        onRefresh={load}
        allowEdit={true}
        onView={onView}
        onEdit={onEdit}
      />
      </Box>

      {/* VER */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            fontWeight: 950,
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(15,118,110,.10) 0%, rgba(255,255,255,1) 85%)",
            borderBottom: "1px solid rgba(2,6,23,.08)",
          }}
        >
          Detalle — Tipo de Indicador
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
                <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                  {viewRow.nombre}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  {viewRow.descripcion ?? "—"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <LabelValue label="Código" value={viewRow.codigo} />
                <LabelValue label="Orden" value={viewRow.orden ?? "—"} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* EDITAR */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            fontWeight: 950,
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(15,118,110,.10) 0%, rgba(255,255,255,1) 85%)",
            borderBottom: "1px solid rgba(2,6,23,.08)",
          }}
        >
          Editar Tipo de Indicador
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

            <Box sx={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 1.5 }}>
              <TextField label="Código" value={form.codigo} fullWidth disabled />
              <TextField
                label="Nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                fullWidth
              />
            </Box>

            <TextField
              label="Descripción"
              value={form.descripcion ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />

            <TextField
              label="Orden"
              type="number"
              value={form.orden ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  orden: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            />
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