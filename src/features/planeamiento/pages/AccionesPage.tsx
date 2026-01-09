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
import { CatalogoAction, type UnidadOrganizacionalDto } from "../../catalogos/CatalogoAction";
import { PlaneamientoAction } from "../PlaneamientoAction";

/** ===== Tipos locales mínimos (si ya los tienes en PlaneamientoAction, impórtalos) ===== */
type InstrumentoDto = { idInstrumento: number; codigo?: string | null; nombre: string };
type EjeDto = { idEje: number; idInstrumento: number; codigo: string; nombre: string; estado: string };
type PoliticaDto = { idPolitica: number; idInstrumento: number; codigo: string; nombre: string; estado: string; idEje?: number | null };
type ObjetivoDto = {
  idObjetivo: number;
  idInstrumento: number;
  codigo: string;
  enunciado: string;
  estado: string;
  idEje?: number | null;
  idPolitica?: number | null;
};

type AccionListDto = {
  idAccion: number;
  idObjetivo: number;
  codigo: string;
  enunciado: string;
  orden?: number | null;
  estado: string;

  presupuestoEstimado?: number | null;
  idUnidadResponsable?: number | null;

  // “humanos” si tu backend los manda en lista
  nombreObjetivo?: string | null;
  nombreInstrumento?: string | null;
  nombreUnidadResponsable?: string | null;

  descripcion?: string | null;
  tipo?: string | null;
};

type AccionCreateUpdateDto = {
  idObjetivo: number;
  codigo: string;
  enunciado: string;
  descripcion?: string | null;
  tipo?: string | null;
  idUnidadResponsable?: number | null;
  orden?: number | null;
  presupuestoEstimado?: number | null;
  estado: string;
};

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

export default function AccionesPage() {
  const [rows, setRows] = useState<AccionListDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [ejes, setEjes] = useState<EjeDto[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaDto[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoDto[]>([]);
  const [unidades, setUnidades] = useState<UnidadOrganizacionalDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VIEW
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<AccionListDto | null>(null);

  // EDIT
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<AccionListDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);


  // CREATE
  const emptyCreate: AccionCreateUpdateDto = {
    idObjetivo: 0,
    codigo: "",
    enunciado: "",
    descripcion: "",
    tipo: "",
    idUnidadResponsable: null,
    orden: null,
    presupuestoEstimado: null,
    estado: "ACTIVO",
  };

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<AccionCreateUpdateDto>(emptyCreate);


  // filtros (cascada) solo para el modal de edición
  const [selInstrumento, setSelInstrumento] = useState<number>(0);
  const [selEje, setSelEje] = useState<number | null>(null);
  const [selPolitica, setSelPolitica] = useState<number | null>(null);

  const [form, setForm] = useState<AccionCreateUpdateDto>({
    idObjetivo: 0,
    codigo: "",
    enunciado: "",
    descripcion: "",
    tipo: "",
    idUnidadResponsable: null,
    orden: null,
    presupuestoEstimado: null,
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, inst, ej, pol, obj, uni] = await Promise.all([
        PlaneamientoAction.getAcciones() as Promise<AccionListDto[]>,
        CatalogoAction.getInstrumentos() as Promise<InstrumentoDto[]>,
        PlaneamientoAction.getEjesEstrategicos() as Promise<EjeDto[]>,
        PlaneamientoAction.getPoliticas() as Promise<PoliticaDto[]>,
        PlaneamientoAction.getObjetivos() as Promise<ObjetivoDto[]>,
        CatalogoAction.getUnidadesOrganizacionales(), // OJO: usa idUnidad
      ]);

      setRows(data);
      setInstrumentos(inst);
      setEjes(ej);
      setPoliticas(pol);
      setObjetivos(obj);
      setUnidades(uni);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando Acciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  // cascadas para combos del modal
  const ejesPorInstrumento = useMemo(() => {
    if (!selInstrumento) return ejes;
    return ejes.filter((x) => x.idInstrumento === selInstrumento);
  }, [ejes, selInstrumento]);

  const politicasPorInstrumentoYEje = useMemo(() => {
    let list = politicas;
    if (selInstrumento) list = list.filter((x) => x.idInstrumento === selInstrumento);
    if (selEje) list = list.filter((x) => (x.idEje ?? null) === selEje);
    return list;
  }, [politicas, selInstrumento, selEje]);

  const objetivosPorCascada = useMemo(() => {
    let list = objetivos;
    if (selInstrumento) list = list.filter((x) => x.idInstrumento === selInstrumento);
    if (selEje) list = list.filter((x) => (x.idEje ?? null) === selEje);
    if (selPolitica) list = list.filter((x) => (x.idPolitica ?? null) === selPolitica);
    return list;
  }, [objetivos, selInstrumento, selEje, selPolitica]);

  // resets cascada: si cambias instrumento, baja todo
  useEffect(() => {
    // cuando cambia instrumento, resetea eje/política/objetivo
    setSelEje(null);
    setSelPolitica(null);
    if (openCreate) setCreateForm((p) => ({ ...p, idObjetivo: 0 }));
    else setForm((p) => ({ ...p, idObjetivo: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selInstrumento]);

  useEffect(() => {
    // cuando cambia eje, resetea política/objetivo
    setSelPolitica(null);
    if (openCreate) setCreateForm((p) => ({ ...p, idObjetivo: 0 }));
    else setForm((p) => ({ ...p, idObjetivo: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selEje]);

  useEffect(() => {
    // cuando cambia política, resetea objetivo
    if (openCreate) setCreateForm((p) => ({ ...p, idObjetivo: 0 }));
    else setForm((p) => ({ ...p, idObjetivo: 0 }));
  }, [selPolitica]);

  const columns = useMemo<ColumnDef<AccionListDto>[]>(() => [
    { key: "codigo", header: "Código", sortable: true, width: 120 },
    { key: "enunciado", header: "Acción", sortable: true },
    { key: "nombreObjetivo", header: "Objetivo", width: 260 },
    { key: "nombreInstrumento", header: "Instrumento", width: 220 },
    { key: "nombreUnidadResponsable", header: "Unidad Resp.", width: 220 },
    { key: "orden", header: "Orden", width: 90 },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      width: 110,
      render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
    },
  ], []);

  const onView = (r: AccionListDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = async (r: AccionListDto) => {
    setSaveError(null);
    setEditing(r);

    // si tienes endpoint detail, podrías traer descripcion/tipo/etc
    let detail = r;
    try {
      // opcional: PlaneamientoAction.getAccionById(r.idAccion)
    } catch {
      /* no-op */
    }

    // Inferimos la cascada a partir del objetivo (si existe en lista)
    const obj = objetivos.find((x) => x.idObjetivo === detail.idObjetivo);
    const instId = obj?.idInstrumento ?? 0;
    const ejeId = obj?.idEje ?? null;
    const polId = obj?.idPolitica ?? null;

    setSelInstrumento(instId);
    setSelEje(ejeId);
    setSelPolitica(polId);

    setForm({
      idObjetivo: detail.idObjetivo,
      codigo: detail.codigo ?? "",
      enunciado: detail.enunciado ?? "",
      descripcion: detail.descripcion ?? "",
      tipo: detail.tipo ?? "",
      idUnidadResponsable: detail.idUnidadResponsable ?? null,
      orden: detail.orden ?? null,
      presupuestoEstimado: detail.presupuestoEstimado ?? null,
      estado: detail.estado ?? "ACTIVO",
    });

    setOpenEdit(true);
  };

  const requiredOk =
    form.idObjetivo > 0 &&
    form.codigo.trim() !== "" &&
    form.enunciado.trim() !== "";

  const save = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updateAccion(editing.idAccion, form);
      setOpenEdit(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const getObjetivoLabel = (id: number) => {
    const obj = objetivos.find((x) => x.idObjetivo === id);
    if (!obj) return `#${id}`;
    return `${obj.codigo} - ${obj.enunciado}`;
  };


  const onNew = () => {
  setCreateError(null);
  setCreateForm(emptyCreate);

  // reset cascada
  setSelInstrumento(0);
  setSelEje(null);
  setSelPolitica(null);

  setOpenCreate(true);
  };

  const requiredCreateOk =
    createForm.idObjetivo > 0 &&
    createForm.codigo.trim() !== "" &&
    createForm.enunciado.trim() !== "";

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      await PlaneamientoAction.createAccion(createForm);

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
        title="Planeamiento: Acciones Estratégicas"
        subtitle="Acciones vinculadas a objetivos. Edición con cascada Instrumento → Eje → Política → Objetivo."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idAccion}
        searchKeys={["codigo", "enunciado", "nombreObjetivo", "nombreInstrumento", "nombreUnidadResponsable", "estado"]}
        onRefresh={load}
        allowEdit
        onView={onView}
        onEdit={onEdit}
        onNew={onNew}
        newLabel="Nuevo"
      />

      {/* VIEW */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle de Acción</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <LabelValue label="Código" value={viewRow.codigo} />
              <LabelValue label="Orden" value={viewRow.orden ?? "—"} />
              <LabelValue label="Estado" value={<Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Enunciado" value={viewRow.enunciado} />
              </Box>

              <LabelValue label="Objetivo" value={viewRow.nombreObjetivo ?? getObjetivoLabel(viewRow.idObjetivo)} />
              <LabelValue label="Instrumento" value={viewRow.nombreInstrumento ?? "—"} />
              <LabelValue label="Unidad Responsable" value={viewRow.nombreUnidadResponsable ?? "—"} />

              <LabelValue label="Presupuesto estimado" value={viewRow.presupuestoEstimado ?? "—"} />
              <LabelValue label="Tipo" value={viewRow.tipo ?? "—"} />
              <LabelValue label="Id Acción" value={viewRow.idAccion} />

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
        <DialogTitle sx={{ fontWeight: 900 }}>Editar Acción</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            {/* Cascada */}
            <TextField
              label="Instrumento"
              select
              value={selInstrumento}
              onChange={(e) => setSelInstrumento(Number(e.target.value))}
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
              value={selEje ?? ""}
              onChange={(e) => setSelEje(e.target.value === "" ? null : Number(e.target.value))}
              fullWidth
              disabled={!selInstrumento}
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
              value={selPolitica ?? ""}
              onChange={(e) => setSelPolitica(e.target.value === "" ? null : Number(e.target.value))}
              fullWidth
              disabled={!selInstrumento}
            >
              <MenuItem value="">—</MenuItem>
              {politicasPorInstrumentoYEje.map((x) => (
                <MenuItem key={x.idPolitica} value={x.idPolitica}>
                  {x.codigo} - {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Objetivo (requerido)"
              select
              value={form.idObjetivo || ""}
              onChange={(e) => setForm((p) => ({ ...p, idObjetivo: Number(e.target.value) }))}
              fullWidth
              disabled={!selInstrumento}
            >
              <MenuItem value="" disabled>Seleccione...</MenuItem>
              {objetivosPorCascada.map((x) => (
                <MenuItem key={x.idObjetivo} value={x.idObjetivo}>
                  {x.codigo} - {x.enunciado}
                </MenuItem>
              ))}
            </TextField>

            {/* Campos */}
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
                // OJO: TU DTO REAL usa idUnidad (no idUnidadOrganizacional)
                <MenuItem key={x.idUnidad} value={x.idUnidad}>
                  {(x.codigo ? `${x.codigo} - ` : "") + x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Tipo (opcional)"
              select
              value={form.tipo ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="ACTIVIDAD">ACTIVIDAD</MenuItem>
              <MenuItem value="PROYECTO">PROYECTO</MenuItem>
              <MenuItem value="INICIATIVA">INICIATIVA</MenuItem>
            </TextField>

            <TextField
              label="Orden"
              type="number"
              value={form.orden ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, orden: e.target.value === "" ? null : Number(e.target.value) }))}
              fullWidth
            />

            <TextField
              label="Presupuesto estimado"
              type="number"
              value={form.presupuestoEstimado ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  presupuestoEstimado: e.target.value === "" ? null : Number(e.target.value),
                }))
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
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} variant="contained" disabled={!requiredOk || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      
      {/* CREATE */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Nueva Acción</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            {/* Cascada */}
            <TextField
              label="Instrumento"
              select
              value={selInstrumento}
              onChange={(e) => setSelInstrumento(Number(e.target.value))}
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
              value={selEje ?? ""}
              onChange={(e) => setSelEje(e.target.value === "" ? null : Number(e.target.value))}
              fullWidth
              disabled={!selInstrumento}
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
              value={selPolitica ?? ""}
              onChange={(e) => setSelPolitica(e.target.value === "" ? null : Number(e.target.value))}
              fullWidth
              disabled={!selInstrumento}
            >
              <MenuItem value="">—</MenuItem>
              {politicasPorInstrumentoYEje.map((x) => (
                <MenuItem key={x.idPolitica} value={x.idPolitica}>
                  {x.codigo} - {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Objetivo (requerido)"
              select
              value={createForm.idObjetivo || ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, idObjetivo: Number(e.target.value) }))}
              fullWidth
              disabled={!selInstrumento}
            >
              <MenuItem value="" disabled>Seleccione...</MenuItem>
              {objetivosPorCascada.map((x) => (
                <MenuItem key={x.idObjetivo} value={x.idObjetivo}>
                  {x.codigo} - {x.enunciado}
                </MenuItem>
              ))}
            </TextField>

            {/* Campos */}
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
                // OJO: TU DTO REAL usa idUnidad (no idUnidadOrganizacional)
                <MenuItem key={x.idUnidad} value={x.idUnidad}>
                  {(x.codigo ? `${x.codigo} - ` : "") + x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Tipo (opcional)"
              select
              value={createForm.tipo ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, tipo: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="ACTIVIDAD">ACTIVIDAD</MenuItem>
              <MenuItem value="PROYECTO">PROYECTO</MenuItem>
              <MenuItem value="INICIATIVA">INICIATIVA</MenuItem>
            </TextField>

            <TextField
              label="Orden"
              type="number"
              value={createForm.orden ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, orden: e.target.value === "" ? null : Number(e.target.value) }))}
              fullWidth
            />

            <TextField
              label="Presupuesto estimado"
              type="number"
              value={createForm.presupuestoEstimado ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  presupuestoEstimado: e.target.value === "" ? null : Number(e.target.value),
                }))
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
            {creating ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>



    </>
  );
}