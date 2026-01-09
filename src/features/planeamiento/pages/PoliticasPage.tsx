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

// AJUSTA la ruta si tu CatalogoTablePage está en otro lugar.
// Tú dijiste que los TSX están en: src/features/catalogos/pages
import CatalogoTablePage, { type ColumnDef } from "../../catalogos/components/CatalogoTablePage";

// Tú dijiste: src/features/catalogos/CatalogoAction.ts
import { CatalogoAction } from "../../catalogos/CatalogoAction";

// Recomendado: src/features/planeamiento/PlaneamientoAction.ts
import { PlaneamientoAction } from "../PlaneamientoAction";

/** ===== Tipos locales (si ya los tienes en PlaneamientoAction, impórtalos y elimina esto) ===== */
type PoliticaListDto = {
  idPolitica: number;
  idInstrumento: number;
  codigo: string;
  nombre: string;
  orden?: number | null;
  estado: string;

  idDimension?: number | null;
  idEje?: number | null;
  descripcion?: string | null;

  nombreInstrumento?: string | null;
  nombreDimension?: string | null;
  nombreEje?: string | null;
};

type PoliticaCreateUpdateDto = {
  idInstrumento: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  idDimension?: number | null;
  idEje?: number | null;
  orden?: number | null;
  estado: string;
};

type InstrumentoDto = { idInstrumento: number; codigo?: string | null; nombre: string };
type DimensionDto = { idDimension: number; codigo?: string | null; nombre: string };
type EjeEstrategicoListDto = { idEje: number; idInstrumento: number; codigo: string; nombre: string; estado: string };

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
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>{value ?? "—"}</Typography>
    </Box>
  );
}

export default function PoliticasPage() {
  const [rows, setRows] = useState<PoliticaListDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<DimensionDto[]>([]);
  const [ejes, setEjes] = useState<EjeEstrategicoListDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VIEW
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<PoliticaListDto | null>(null);

  // EDIT
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<PoliticaListDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // CREATE
  const emptyCreate: PoliticaCreateUpdateDto = {
    idInstrumento: 0,
    codigo: "",
    nombre: "",
    descripcion: "",
    idDimension: null,
    idEje: null,
    orden: null,
    estado: "ACTIVO",
  };

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<PoliticaCreateUpdateDto>(emptyCreate);

  const ejesCreate = useMemo(() => {
    if (!createForm.idInstrumento) return ejes;
    return ejes.filter((x) => x.idInstrumento === createForm.idInstrumento);
  }, [ejes, createForm.idInstrumento]);

  useEffect(() => {
    if (!createForm.idEje) return;
    const ok = ejesCreate.some((x) => x.idEje === createForm.idEje);
    if (!ok) setCreateForm((p) => ({ ...p, idEje: null }));
  }, [createForm.idEje, ejesCreate]);



  const [form, setForm] = useState<PoliticaCreateUpdateDto>({
    idInstrumento: 0,
    codigo: "",
    nombre: "",
    descripcion: "",
    idDimension: null,
    idEje: null,
    orden: null,
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, inst, dims, e] = await Promise.all([
        PlaneamientoAction.getPoliticas() as Promise<PoliticaListDto[]>,
        CatalogoAction.getInstrumentos() as Promise<InstrumentoDto[]>,
        CatalogoAction.getDimensiones() as Promise<DimensionDto[]>,
        PlaneamientoAction.getEjesEstrategicos() as Promise<EjeEstrategicoListDto[]>,
      ]);

      setRows(data);
      setInstrumentos(inst);
      setDimensiones(dims);
      setEjes(e);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando Políticas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const ejesFiltradosPorInstrumento = useMemo(() => {
    if (!form.idInstrumento) return ejes;
    return ejes.filter((x) => x.idInstrumento === form.idInstrumento);
  }, [ejes, form.idInstrumento]);

  // Si cambias instrumento, y el eje ya no corresponde, lo reseteamos.
  useEffect(() => {
    if (!form.idEje) return;
    const ejeOk = ejesFiltradosPorInstrumento.some((x) => x.idEje === form.idEje);
    if (!ejeOk) setForm((p) => ({ ...p, idEje: null }));
  }, [form.idEje, ejesFiltradosPorInstrumento]);

  const columns = useMemo<ColumnDef<PoliticaListDto>[]>(() => [
    { key: "codigo", header: "Código", sortable: true, width: 120 },
    { key: "nombre", header: "Nombre", sortable: true },
    { key: "nombreInstrumento", header: "Instrumento", width: 220 },
    { key: "nombreEje", header: "Eje", width: 220 },
    { key: "nombreDimension", header: "Dimensión", width: 180 },
    { key: "orden", header: "Orden", width: 90 },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      width: 110,
      render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
    },
  ], []);

  const onView = (r: PoliticaListDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = async (r: PoliticaListDto) => {
    setSaveError(null);
    setEditing(r);

    // Si tienes endpoint detail, úsalo aquí. Si no, usamos la fila.
    let detail = r;
    try {
      // Opcional si lo implementas:
      // detail = await PlaneamientoAction.getPoliticaById(r.idPolitica);
    } catch {
      /* no-op */
    }

    setForm({
      idInstrumento: detail.idInstrumento,
      codigo: detail.codigo ?? "",
      nombre: detail.nombre ?? "",
      descripcion: detail.descripcion ?? "",
      idDimension: detail.idDimension ?? null,
      idEje: detail.idEje ?? null,
      orden: detail.orden ?? null,
      estado: detail.estado ?? "ACTIVO",
    });

    setOpenEdit(true);
  };

  const requiredOk =
    form.idInstrumento > 0 &&
    form.codigo.trim() !== "" &&
    form.nombre.trim() !== "";

  const save = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updatePolitica(editing.idPolitica, form);
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

      await PlaneamientoAction.createPolitica(createForm);

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
        title="Planeamiento: Políticas"
        subtitle="Políticas por instrumento y eje (visualizar y editar)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idPolitica}
        searchKeys={["codigo", "nombre", "nombreInstrumento", "nombreEje", "nombreDimension", "estado"]}
        onRefresh={load}
        allowEdit
        onView={onView}
        onEdit={onEdit}
        onNew={onNew}
        newLabel="Nuevo"
      />

      {/* VIEW */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle de Política</DialogTitle>
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
              <LabelValue label="Eje" value={viewRow.nombreEje ?? "—"} />
              <LabelValue label="Dimensión" value={viewRow.nombreDimension ?? "—"} />

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
        <DialogTitle sx={{ fontWeight: 900 }}>Editar Política</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Instrumento"
              select
              value={form.idInstrumento}
              onChange={(e) => setForm((p) => ({ ...p, idInstrumento: Number(e.target.value) }))}
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
              label="Eje (opcional)"
              select
              value={form.idEje ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, idEje: e.target.value === "" ? null : Number(e.target.value) }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {ejesFiltradosPorInstrumento.map((x) => (
                <MenuItem key={x.idEje} value={x.idEje}>
                  {x.codigo} - {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Dimensión (opcional)"
              select
              value={form.idDimension ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, idDimension: e.target.value === "" ? null : Number(e.target.value) }))}
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
              label="Orden"
              type="number"
              value={form.orden ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, orden: e.target.value === "" ? null : Number(e.target.value) }))}
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
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} variant="contained" disabled={!requiredOk || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

            {/* CREATE */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Nueva Política</DialogTitle>
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
              label="Eje (opcional)"
              select
              value={createForm.idEje ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, idEje: e.target.value === "" ? null : Number(e.target.value) }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {ejesCreate.map((x) => (
                <MenuItem key={x.idEje} value={x.idEje}>
                  {x.codigo} - {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Dimensión (opcional)"
              select
              value={createForm.idDimension ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, idDimension: e.target.value === "" ? null : Number(e.target.value) }))}
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
              label="Orden"
              type="number"
              value={createForm.orden ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, orden: e.target.value === "" ? null : Number(e.target.value) }))}
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
              <Typography sx={{ color: "error.main", fontWeight: 800 }}>{createError}</Typography>
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