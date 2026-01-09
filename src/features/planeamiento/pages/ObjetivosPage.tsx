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

import CatalogoTablePage, { type ColumnDef } from "../../catalogos/components/CatalogoTablePage";
import { PlaneamientoAction } from "../PlaneamientoAction";
import { CatalogoAction, type UnidadOrganizacionalDto } from "../../catalogos/CatalogoAction";

/** ===== Tipos locales (si ya los tienes en PlaneamientoAction, impórtalos) ===== */
type ObjetivoListDto = {
  idObjetivo: number;
  idInstrumento: number;
  codigo: string;
  enunciado: string;
  orden?: number | null;
  estado: string;

  idDimension?: number | null;
  idEje?: number | null;
  idPolitica?: number | null;
  idUnidadResponsable?: number | null;

  tipo?: string | null;
  descripcion?: string | null;

  nombreInstrumento?: string | null;
  nombreDimension?: string | null;
  nombreEje?: string | null;
  nombrePolitica?: string | null;
  nombreUnidadResponsable?: string | null;
};

type ObjetivoCreateUpdateDto = {
  idInstrumento: number;
  codigo: string;
  enunciado: string;
  descripcion?: string | null;
  tipo?: string | null;

  idDimension?: number | null;
  idEje?: number | null;
  idPolitica?: number | null;
  idUnidadResponsable?: number | null;

  orden?: number | null;
  estado: string;
};

type InstrumentoDto = { idInstrumento: number; codigo?: string | null; nombre: string };
type DimensionDto = { idDimension: number; codigo?: string | null; nombre: string };
type EjeDto = { idEje: number; idInstrumento: number; codigo: string; nombre: string; estado: string };
type PoliticaDto = { idPolitica: number; idInstrumento: number; codigo: string; nombre: string; estado: string; idEje?: number | null };

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

export default function ObjetivosPage() {
  const [rows, setRows] = useState<ObjetivoListDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<DimensionDto[]>([]);
  const [ejes, setEjes] = useState<EjeDto[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaDto[]>([]);
  const [unidades, setUnidades] = useState<UnidadOrganizacionalDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VIEW
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<ObjetivoListDto | null>(null);

  // EDIT
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<ObjetivoListDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // CREATE
  const emptyCreate: ObjetivoCreateUpdateDto = {
    idInstrumento: 0,
    codigo: "",
    enunciado: "",
    descripcion: "",
    tipo: "",
    idDimension: null,
    idEje: null,
    idPolitica: null,
    idUnidadResponsable: null,
    orden: null,
    estado: "ACTIVO",
  };

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<ObjetivoCreateUpdateDto>(emptyCreate);

  const ejesCreate = useMemo(() => {
    if (!createForm.idInstrumento) return ejes;
    return ejes.filter((x) => x.idInstrumento === createForm.idInstrumento);
  }, [ejes, createForm.idInstrumento]);

  const politicasCreate = useMemo(() => {
    let list = politicas;
    if (createForm.idInstrumento) list = list.filter((x) => x.idInstrumento === createForm.idInstrumento);
    if (createForm.idEje) list = list.filter((x) => (x.idEje ?? null) === createForm.idEje);
    return list;
  }, [politicas, createForm.idInstrumento, createForm.idEje]);

  useEffect(() => {
    if (!createForm.idEje) return;
    const ok = ejesCreate.some((x) => x.idEje === createForm.idEje);
    if (!ok) setCreateForm((p) => ({ ...p, idEje: null }));
  }, [createForm.idEje, ejesCreate]);

  useEffect(() => {
    if (!createForm.idPolitica) return;
    const ok = politicasCreate.some((x) => x.idPolitica === createForm.idPolitica);
    if (!ok) setCreateForm((p) => ({ ...p, idPolitica: null }));
  }, [createForm.idPolitica, politicasCreate]);



  const [form, setForm] = useState<ObjetivoCreateUpdateDto>({
    idInstrumento: 0,
    codigo: "",
    enunciado: "",
    descripcion: "",
    tipo: "",
    idDimension: null,
    idEje: null,
    idPolitica: null,
    idUnidadResponsable: null,
    orden: null,
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, inst, dims, e, p, u] = await Promise.all([
        PlaneamientoAction.getObjetivos() as Promise<ObjetivoListDto[]>,
        CatalogoAction.getInstrumentos() as Promise<InstrumentoDto[]>,
        CatalogoAction.getDimensiones() as Promise<DimensionDto[]>,
        PlaneamientoAction.getEjesEstrategicos() as Promise<EjeDto[]>,
        PlaneamientoAction.getPoliticas() as Promise<PoliticaDto[]>,
        CatalogoAction.getUnidadesOrganizacionales(),
      ]);

      setRows(data);
      setInstrumentos(inst);
      setDimensiones(dims);
      setEjes(e);
      setPoliticas(p);
      setUnidades(u);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando Objetivos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  // Cascada: Instrumento -> Ejes -> Politicas
  const ejesPorInstrumento = useMemo(() => {
    if (!form.idInstrumento) return ejes;
    return ejes.filter((x) => x.idInstrumento === form.idInstrumento);
  }, [ejes, form.idInstrumento]);

  const politicasPorInstrumentoYEje = useMemo(() => {
    let list = politicas;

    if (form.idInstrumento) {
      list = list.filter((x) => x.idInstrumento === form.idInstrumento);
    }
    if (form.idEje) {
      // si tu backend no manda idEje en politicas, esto igual no rompe, solo no filtra
      list = list.filter((x) => (x.idEje ?? null) === form.idEje);
    }
    return list;
  }, [politicas, form.idInstrumento, form.idEje]);

  // Resets cuando cambian niveles superiores
  useEffect(() => {
    if (!form.idEje) return;
    const ok = ejesPorInstrumento.some((x) => x.idEje === form.idEje);
    if (!ok) setForm((p) => ({ ...p, idEje: null }));
  }, [form.idEje, ejesPorInstrumento]);

  useEffect(() => {
    if (!form.idPolitica) return;
    const ok = politicasPorInstrumentoYEje.some((x) => x.idPolitica === form.idPolitica);
    if (!ok) setForm((p) => ({ ...p, idPolitica: null }));
  }, [form.idPolitica, politicasPorInstrumentoYEje]);

  const columns = useMemo<ColumnDef<ObjetivoListDto>[]>(() => [
    { key: "codigo", header: "Código", sortable: true, width: 120 },
    { key: "enunciado", header: "Objetivo", sortable: true },
    { key: "nombreInstrumento", header: "Instrumento", width: 220 },
    { key: "nombreEje", header: "Eje", width: 220 },
    { key: "nombrePolitica", header: "Política", width: 220 },
    { key: "nombreUnidadResponsable", header: "Unidad Resp.", width: 200 },
    { key: "orden", header: "Orden", width: 90 },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      width: 110,
      render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
    },
  ], []);

  const onView = (r: ObjetivoListDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = async (r: ObjetivoListDto) => {
    setSaveError(null);
    setEditing(r);

    // Si tienes endpoint detail, úsalo aquí. Si no, usamos la fila.
    let detail = r;
    try {
      // opcional: PlaneamientoAction.getObjetivoById(r.idObjetivo)
    } catch {
      /* no-op */
    }

    setForm({
      idInstrumento: detail.idInstrumento,
      codigo: detail.codigo ?? "",
      enunciado: detail.enunciado ?? "",
      descripcion: detail.descripcion ?? "",
      tipo: detail.tipo ?? "",
      idDimension: detail.idDimension ?? null,
      idEje: detail.idEje ?? null,
      idPolitica: detail.idPolitica ?? null,
      idUnidadResponsable: detail.idUnidadResponsable ?? null,
      orden: detail.orden ?? null,
      estado: detail.estado ?? "ACTIVO",
    });

    setOpenEdit(true);
  };

  const requiredOk =
    form.idInstrumento > 0 &&
    form.codigo.trim() !== "" &&
    form.enunciado.trim() !== "";

  const save = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updateObjetivo(editing.idObjetivo, form);
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
    createForm.enunciado.trim() !== "";

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      await PlaneamientoAction.createObjetivo(createForm);

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
        title="Planeamiento: Objetivos Estratégicos"
        subtitle="Objetivos por instrumento (con eje/política opcional)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idObjetivo}
        searchKeys={["codigo", "enunciado", "nombreInstrumento", "nombreEje", "nombrePolitica", "nombreUnidadResponsable", "estado"]}
        onRefresh={load}
        allowEdit
        onView={onView}
        onEdit={onEdit}
        onNew={onNew}
        newLabel="Nuevo"
      />

      {/* VIEW */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle de Objetivo</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <LabelValue label="Código" value={viewRow.codigo} />
              <LabelValue label="Orden" value={viewRow.orden ?? "—"} />
              <LabelValue label="Estado" value={<Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Enunciado" value={viewRow.enunciado} />
              </Box>

              <LabelValue label="Instrumento" value={viewRow.nombreInstrumento ?? `#${viewRow.idInstrumento}`} />
              <LabelValue label="Eje" value={viewRow.nombreEje ?? "—"} />
              <LabelValue label="Política" value={viewRow.nombrePolitica ?? "—"} />

              <LabelValue label="Dimensión" value={viewRow.nombreDimension ?? "—"} />
              <LabelValue label="Unidad Responsable" value={viewRow.nombreUnidadResponsable ?? "—"} />
              <LabelValue label="Tipo" value={viewRow.tipo ?? "—"} />

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
        <DialogTitle sx={{ fontWeight: 900 }}>Editar Objetivo</DialogTitle>
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
              {ejesPorInstrumento.map((x) => (
                <MenuItem key={x.idEje} value={x.idEje}>
                  {x.codigo} - {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Política (opcional)"
              select
              value={form.idPolitica ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, idPolitica: e.target.value === "" ? null : Number(e.target.value) }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {politicasPorInstrumentoYEje.map((x) => (
                <MenuItem key={x.idPolitica} value={x.idPolitica}>
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
              label="Unidad Responsable (opcional)"
              select
              value={form.idUnidadResponsable ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idUnidadResponsable: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {unidades.map((x) => (
                <MenuItem key={x.idUnidad} value={x.idUnidad}>
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
              label="Enunciado"
              value={form.enunciado}
              onChange={(e) => setForm((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Tipo (opcional)"
              select
              value={form.tipo ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="GENERAL">GENERAL</MenuItem>
              <MenuItem value="ESPECIFICO">ESPECÍFICO</MenuItem>
            </TextField>

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
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} variant="contained" disabled={!requiredOk || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>


        {/* CREATE */}
      <Dialog open={openCreate} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Nuevo Objetivo</DialogTitle>
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
              {ejesPorInstrumento.map((x) => (
                <MenuItem key={x.idEje} value={x.idEje}>
                  {x.codigo} - {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Política (opcional)"
              select
              value={createForm.idPolitica ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, idPolitica: e.target.value === "" ? null : Number(e.target.value) }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {politicasPorInstrumentoYEje.map((x) => (
                <MenuItem key={x.idPolitica} value={x.idPolitica}>
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
              label="Unidad Responsable (opcional)"
              select
              value={createForm.idUnidadResponsable ?? ""}
              onChange={(e) =>
                setCreateForm((p) => ({
                  ...p,
                  idUnidadResponsable: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {unidades.map((x) => (
                <MenuItem key={x.idUnidad} value={x.idUnidad}>
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
              label="Enunciado"
              value={createForm.enunciado}
              onChange={(e) => setCreateForm((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Tipo (opcional)"
              select
              value={createForm.tipo ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="GENERAL">GENERAL</MenuItem>
              <MenuItem value="ESPECIFICO">ESPECÍFICO</MenuItem>
            </TextField>

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
              <Typography sx={{ color: "error.main", fontWeight: 800 }}>
                {createError}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={create} variant="contained" disabled={!requiredCreateOk || creating}>
            {creating ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>



    </>
  );
}