import { useCallback, useEffect, useMemo, useState } from "react";
import {
  InputAdornment,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Tooltip
} from "@mui/material";
import CatalogoTablePage, { type ColumnDef } from "../components/CatalogoTablePage";
import {
  CatalogoAction,
  type ActualizarDimensionDto,
  type DimensionDto,
} from "../CatalogoAction";
import DimensionViewDialog from "../components/DimensionViewDialog";
import ColorPickerGrid from "../components/ColorPickerGrid";

export default function DimensionesPage() {
  const [rows, setRows] = useState<DimensionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View modal
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<DimensionDto | null>(null);

  // Edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<DimensionDto | null>(null);
  const [form, setForm] = useState<ActualizarDimensionDto>({
    nombre: "",
    descripcion: "",
    color: "",
    icono: "",
    orden: null,
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CatalogoAction.getDimensiones();
      setRows(data);
    } catch (e: any) {
      setError(e.message ?? "Error cargando dimensiones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const columns = useMemo<ColumnDef<DimensionDto>[]>(
    () => [
      { key: "codigo", header: "Código", sortable: true, width: 110 },
      { key: "nombre", header: "Nombre", sortable: true },
      { key: "descripcion", header: "Descripción" },
      { key: "orden", header: "Orden", sortable: true, width: 90 },
      {
        key: "estado",
        header: "Estado",
        sortable: true,
        width: 110,
        render: (r) => (
          <Box
            sx={{
              display: "inline-flex",
              px: 1,
              py: 0.25,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 900,
              border: "1px solid #E7ECF3",
              bgcolor:
                r.estado === "ACTIVO"
                  ? "rgba(16,185,129,.10)"
                  : "rgba(239,68,68,.10)",
            }}
          >
            {r.estado}
          </Box>
        ),
      },
    ],
    []
  );

  const onView = (r: DimensionDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = (r: DimensionDto) => {
    setEditing(r);
    setForm({
      nombre: r.nombre,
      descripcion: r.descripcion ?? "",
      color: r.color ?? "",
      icono: r.icono ?? "",
      orden: r.orden ?? null,
      estado: r.estado ?? "ACTIVO",
    });
    setOpenEdit(true);
  };

  const save = async () => {
    if (!editing) return;
    await CatalogoAction.updateDimension(editing.idDimension, form);
    setOpenEdit(false);
    await load();
  };

  const isHex = (v: string) => /^#([0-9A-Fa-f]{3}){1,2}$/.test((v ?? "").trim());
  const colorValue = (form.color ?? "").trim();
  const valid = isHex(colorValue);

  return (
    <>
      <CatalogoTablePage
        title="Catálogo: Dimensiones"
        subtitle="Visualiza y edita dimensiones (solo campos permitidos)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idDimension}
        searchKeys={["codigo", "nombre", "descripcion", "estado"]}
        onRefresh={load}
        allowEdit={true}
        onView={onView}
        onEdit={onEdit}
      />

      {/* ✅ Modal Ver (bonito, solo lectura) */}
      <DimensionViewDialog
        open={openView}
        onClose={() => setOpenView(false)}
        row={viewRow}
      />

      {/* ✅ Modal Editar (form + selector de color) */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Editar Dimensión</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5, mt: 0.5 }}>
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Descripción"
              value={form.descripcion ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <Box>
                <TextField
                  label="Color (hex)"
                  value={form.color ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                  placeholder="#0EA5A4"
                  fullWidth
                  error={!!colorValue && !valid}
                  helperText={!!colorValue && !valid ? "Hex inválido. Ej: #0EA5A4" : " "}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tooltip title={valid ? colorValue : "Color inválido"} arrow>
                          <Box
                            sx={{
                              width: 18,
                              height: 18,
                              borderRadius: 1,
                              bgcolor: valid ? colorValue : "#E5E7EB",
                              border: "1px solid rgba(0,0,0,.15)",
                              boxShadow: "0 6px 12px rgba(2,6,23,.10)",
                            }}
                          />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ mt: 1 }}>
                  <ColorPickerGrid
                    value={form.color ?? ""}
                    onChange={(hex) => setForm((p) => ({ ...p, color: hex }))}
                  />
                </Box>
              </Box>

              <TextField
                label="Icono"
                value={form.icono ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, icono: e.target.value }))}
                fullWidth
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
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

              <TextField
                label="Estado"
                select
                value={form.estado}
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
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button onClick={save} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}