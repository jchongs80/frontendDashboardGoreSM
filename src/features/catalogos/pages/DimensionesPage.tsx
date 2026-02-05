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
import { Chip, Typography } from "@mui/material";

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

  const columns = useMemo<ColumnDef<DimensionDto>[]>(() => {
  const safeHex = (v?: string) => {
    const s = (v ?? "").trim();
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(s) ? s : null;
  };

  return [
    { key: "codigo", header: "Código", sortable: true, width: 110 },

    // ✅ Color swatch "premium"
    {
      key: "color",
      header: "Color",
      width: 90,
      render: (r) => {
        const hex = safeHex(r.color ?? undefined) ?? "#E5E7EB";;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: 1,
                bgcolor: hex,
                border: "1px solid rgba(2,6,23,.18)",
                boxShadow: `0 10px 18px rgba(2,6,23,.10), 0 0 0 4px ${hex}22`,
              }}
            />
            <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary" }}>
              {hex.toUpperCase()}
            </Typography>
          </Box>
        );
      },
    },

    // ✅ Nombre con “dot” de color
    {
      key: "nombre",
      header: "Nombre",
      sortable: true,
      render: (r) => {
        const hex = safeHex(r.color ?? undefined) ?? "#E5E7EB";;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title={r.color ? `Color: ${r.color}` : "Sin color"} arrow>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  bgcolor: hex,
                  boxShadow: `0 0 0 3px ${hex}22`,
                  border: "1px solid rgba(2,6,23,.15)",
                }}
              />
            </Tooltip>
            <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              {r.nombre}
            </Typography>
          </Box>
        );
      },
    },

    // ✅ Descripción: 2 líneas + tooltip
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
            {r.descripcion ?? "-"}
          </Typography>
        </Tooltip>
      ),
    },

    { key: "orden", header: "Orden", sortable: true, width: 90 },

    // ✅ Estado como Chip (más “premium”)
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      width: 130,
      render: (r) => {
        const ok = r.estado === "ACTIVO";
        return (
          <Chip
            label={r.estado}
            size="small"
            sx={{
              fontWeight: 900,
              letterSpacing: ".3px",
              borderRadius: 999,
              px: 0.5,
              bgcolor: ok ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)",
              border: ok ? "1px solid rgba(16,185,129,.30)" : "1px solid rgba(239,68,68,.30)",
              color: ok ? "rgb(5,150,105)" : "rgb(220,38,38)",
            }}
          />
        );
      },
    },
  ];
}, []);

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
    <Box
  sx={{
    // Contenedor de la tabla con borde/sombra suave
    "& .MuiTableContainer-root": {
      borderRadius: 3,
      overflow: "hidden",
      border: "1px solid rgba(2,6,23,.08)",
      boxShadow: "0 10px 30px rgba(2,6,23,.06)",
    },

    // Encabezado: gradient + sticky + borde inferior
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

    // Línea “accent” arriba del header (detalle premium)
    "& .MuiTableHead-root": {
      position: "relative",
    },
    "& .MuiTableHead-root::before": {
      content: '""',
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 3,
      background: "linear-gradient(90deg, rgba(59,130,246,.9), rgba(16,185,129,.9), rgba(249,115,22,.9))",
      opacity: 0.85,
    },

    // Hover de filas (bonus)
    "& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root": {
      backgroundColor: "rgba(15,118,110,.04)",
    },
  }}
>
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

      </Box>

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