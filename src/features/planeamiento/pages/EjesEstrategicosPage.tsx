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

// AJUSTA ESTA RUTA si tu CatalogoTablePage está en otro lugar.
// En tu caso mencionaste que los TSX están en: src/features/catalogos/pages
import CatalogoTablePage, { type ColumnDef } from "../../catalogos/components/CatalogoTablePage";

// AJUSTA ESTA RUTA si tu CatalogoAction está en otro lugar.
// Tú dijiste: src/features/catalogos/CatalogoAction.ts
import { CatalogoAction } from "../../catalogos/CatalogoAction";

// AJUSTA ESTA RUTA si tu action está en otro lugar.
// Recomendado: src/features/planeamiento/PlaneamientoAction.ts
import { PlaneamientoAction } from "../PlaneamientoAction";

/** ===== Tipos (puedes moverlos al PlaneamientoAction si ya los tienes ahí) ===== */
type EjeEstrategicoListDto = {
  idEje: number;
  idInstrumento: number;
  codigo: string;
  nombre: string;
  orden?: number | null;
  estado: string;

  // campos “humanos” (si el backend los manda)
  nombreInstrumento?: string | null;
  nombreDimension?: string | null;

  // opcional si tu backend lo expone en lista
  idDimension?: number | null;
  descripcion?: string | null;
};

type EjeEstrategicoCreateUpdateDto = {
  idInstrumento: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  idDimension?: number | null;
  orden?: number | null;
  estado: string;
};

// Si tu CatalogoAction ya exporta estos tipos, reemplaza por imports.
type InstrumentoDto = { idInstrumento: number; codigo?: string | null; nombre: string };
type DimensionDto = { idDimension: number; codigo?: string | null; nombre: string };

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
    <Box sx={{ display: "grid", gap: 0.35 }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

export default function EjesEstrategicosPage() {
  const [rows, setRows] = useState<EjeEstrategicoListDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<DimensionDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VIEW
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<EjeEstrategicoListDto | null>(null);

  // EDIT
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<EjeEstrategicoListDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // CREATE
  const emptyCreate: EjeEstrategicoCreateUpdateDto = {
    idInstrumento: 0,
    codigo: "",
    nombre: "",
    descripcion: "",
    idDimension: null,
    orden: null,
    estado: "ACTIVO",
  };

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<EjeEstrategicoCreateUpdateDto>(emptyCreate);


  const [form, setForm] = useState<EjeEstrategicoCreateUpdateDto>({
    idInstrumento: 0,
    codigo: "",
    nombre: "",
    descripcion: "",
    idDimension: null,
    orden: null,
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // IMPORTANTE:
      // - PlaneamientoAction.getEjesEstrategicos debe devolver la lista
      // - CatalogoAction.getInstrumentos / getDimensiones deben devolver combos
      const [data, inst, dims] = await Promise.all([
        PlaneamientoAction.getEjesEstrategicos() as Promise<EjeEstrategicoListDto[]>,
        CatalogoAction.getInstrumentos() as Promise<InstrumentoDto[]>,
        CatalogoAction.getDimensiones() as Promise<DimensionDto[]>,
      ]);

      setRows(data);
      setInstrumentos(inst);
      setDimensiones(dims);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando Ejes Estratégicos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const columns = useMemo<ColumnDef<EjeEstrategicoListDto>[]>(
    () => [
      { key: "codigo", header: "Código", sortable: true, width: 120 },
      { key: "nombre", header: "Nombre", sortable: true },
      { key: "nombreInstrumento", header: "Instrumento", width: 220 },
      { key: "nombreDimension", header: "Dimensión", width: 180 },
      { key: "orden", header: "Orden", width: 90 },
      {
        key: "estado",
        header: "Estado",
        sortable: true,
        width: 110,
        render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
      },
    ],
    []
  );

  const onView = (r: EjeEstrategicoListDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = async (r: EjeEstrategicoListDto) => {
    setSaveError(null);
    setEditing(r);

    // Si tienes endpoint detail, úsalo para traer descripcion/idDimension.
    // Si no, usamos lo que venga en la fila.
    let detail = r;
    try {
      // opcional: si lo implementas en PlaneamientoAction:
      // detail = await PlaneamientoAction.getEjeEstrategicoById(r.idEje);
    } catch {
      /* no-op */
    }

    setForm({
      idInstrumento: detail.idInstrumento,
      codigo: detail.codigo ?? "",
      nombre: detail.nombre ?? "",
      descripcion: detail.descripcion ?? "",
      idDimension: detail.idDimension ?? null,
      orden: detail.orden ?? null,
      estado: detail.estado ?? "ACTIVO",
    });

    setOpenEdit(true);
  };

  const requiredOk = form.idInstrumento > 0 && form.codigo.trim() !== "" && form.nombre.trim() !== "";

  const save = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updateEjeEstrategico(editing.idEje, form);
      setOpenEdit(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };


  const onNew = () => {
    setCreateError(null);
    setCreateForm(emptyCreate);
    setOpenCreate(true);
  };

  const requiredCreateOk =
    createForm.idInstrumento > 0 &&
    createForm.codigo.trim() !== "" &&
    createForm.nombre.trim() !== "";

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      // AJUSTA el nombre si tu action lo tiene distinto
      await PlaneamientoAction.createEjeEstrategico(createForm);

      setOpenCreate(false);
      await load();
    } catch (e: any) {
      setCreateError(e?.message ?? "No se pudo registrar");
    } finally {
      setCreating(false);
    }
  };



  return (
    <>
      <CatalogoTablePage
        title="Planeamiento: Ejes Estratégicos"
        subtitle="Listado de ejes por instrumento (con visualización y edición)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idEje}
        searchKeys={["codigo", "nombre", "nombreInstrumento", "nombreDimension", "estado"]}
        onRefresh={load}
        allowEdit
        onView={onView}
        onEdit={onEdit}
        onNew={onNew}
        newLabel="Nuevo"
      />

      {/* VIEW */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle del Eje Estratégico</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <LabelValue label="Código" value={viewRow.codigo} />
              <LabelValue label="Orden" value={viewRow.orden ?? "—"} />
              <LabelValue label="Estado" value={<Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Nombre" value={viewRow.nombre} />
              </Box>

              <LabelValue label="Instrumento" value={viewRow.nombreInstrumento ?? `#${viewRow.idInstrumento}`} />
              <LabelValue label="Dimensión" value={viewRow.nombreDimension ?? "—"} />
              <LabelValue label="Id Eje" value={viewRow.idEje} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Descripción" value={viewRow.descripcion ?? "—"} />
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">—</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* EDIT */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Editar Eje Estratégico</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Instrumento"
              select
              value={form.idInstrumento}
              onChange={(e) => setForm((p) => ({ ...p, idInstrumento: Number(e.target.value) }))}
              fullWidth
            >
              <MenuItem value={0} disabled>
                Seleccione...
              </MenuItem>
              {instrumentos.map((x) => (
                <MenuItem key={x.idInstrumento} value={x.idInstrumento}>
                  {(x.codigo ? `${x.codigo} - ` : "") + x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Código"
              value={form.codigo}
              onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Dimensión (opcional)"
              select
              value={form.idDimension ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idDimension: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {dimensiones.map((x) => (
                <MenuItem key={x.idDimension} value={x.idDimension}>
                  {(x.codigo ? `${x.codigo} - ` : "") + x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Orden"
              type="number"
              value={form.orden ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, orden: e.target.value === "" ? null : Number(e.target.value) }))
              }
              fullWidth
            />

            <TextField
              label="Descripción"
              value={form.descripcion ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
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

            {saveError && (
              <Typography sx={{ color: "error.main", fontWeight: 800 }}>
                {saveError}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} variant="contained" disabled={!requiredOk || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE */}
<Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
  <DialogTitle sx={{ fontWeight: 900 }}>Nuevo Eje Estratégico</DialogTitle>
  <DialogContent sx={{ pt: 1.5 }}>
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
      <TextField
        label="Instrumento"
        select
        value={createForm.idInstrumento}
        onChange={(e) => setCreateForm((p) => ({ ...p, idInstrumento: Number(e.target.value) }))}
        fullWidth
      >
        <MenuItem value={0} disabled>Seleccione...</MenuItem>
        {instrumentos.map((x) => (
          <MenuItem key={x.idInstrumento} value={x.idInstrumento}>
            {(x.codigo ? `${x.codigo} - ` : "") + x.nombre}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Código"
        value={createForm.codigo}
        onChange={(e) => setCreateForm((p) => ({ ...p, codigo: e.target.value }))}
        fullWidth
      />

      <TextField
        label="Nombre"
        value={createForm.nombre}
        onChange={(e) => setCreateForm((p) => ({ ...p, nombre: e.target.value }))}
        fullWidth
      />

      <TextField
        label="Dimensión (opcional)"
        select
        value={createForm.idDimension ?? ""}
        onChange={(e) =>
          setCreateForm((p) => ({
            ...p,
            idDimension: e.target.value === "" ? null : Number(e.target.value),
          }))
        }
        fullWidth
      >
        <MenuItem value="">—</MenuItem>
        {dimensiones.map((x) => (
          <MenuItem key={x.idDimension} value={x.idDimension}>
            {(x.codigo ? `${x.codigo} - ` : "") + x.nombre}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Orden"
        type="number"
        value={createForm.orden ?? ""}
        onChange={(e) =>
          setCreateForm((p) => ({ ...p, orden: e.target.value === "" ? null : Number(e.target.value) }))
        }
        fullWidth
      />

      <TextField
        label="Descripción"
        value={createForm.descripcion ?? ""}
        onChange={(e) => setCreateForm((p) => ({ ...p, descripcion: e.target.value }))}
        fullWidth
        multiline
        minRows={2}
      />

      <TextField
        label="Estado"
        select
        value={createForm.estado}
        onChange={(e) => setCreateForm((p) => ({ ...p, estado: e.target.value }))}
        fullWidth
      >
        <MenuItem value="ACTIVO">ACTIVO</MenuItem>
        <MenuItem value="INACTIVO">INACTIVO</MenuItem>
      </TextField>

      {createError && (
        <Typography sx={{ color: "error.main", fontWeight: 800 }}>
          {createError}
        </Typography>
      )}
    </Box>
  </DialogContent>

  <DialogActions sx={{ px: 3, pb: 2.5 }}>
    <Button onClick={() => setOpenCreate(false)} disabled={creating}>Cancelar</Button>
    <Button onClick={create} variant="contained" disabled={!requiredCreateOk || creating}>
      {creating ? "Registrando..." : "Registrar"}
    </Button>
  </DialogActions>
</Dialog>

    </>
  );
}