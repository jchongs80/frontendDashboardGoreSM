import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";

import CatalogoTablePage, { type ColumnDef } from "../../catalogos/components/CatalogoTablePage";
import { PlaneamientoAction, type IndicadorInstrumentoListDto, type IndicadorMetaCreateUpdateDto, type IndicadorMetaListDto } from "../PlaneamientoAction";

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

export default function IndicadoresMetasPage() {
  const [rows, setRows] = useState<IndicadorMetaListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [iiList, setIiList] = useState<IndicadorInstrumentoListDto[]>([]);

  // view
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<IndicadorMetaListDto | null>(null);

  // create
  // create
  const emptyCreate: IndicadorMetaCreateUpdateDto = {
    idIndicadorInstrumento: 0,
    anio: new Date().getFullYear(),
    lineaBase: null,
    metaProgramada: null,
    metaMinima: null,
    metaMaxima: null,
    metaAcumulada: null,
    estado: "ACTIVO",
  };

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<IndicadorMetaCreateUpdateDto>(emptyCreate);


  // edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<IndicadorMetaListDto | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<IndicadorMetaCreateUpdateDto>({
    idIndicadorInstrumento: 0,
    anio: new Date().getFullYear(),
    lineaBase: null,
    metaProgramada: null,
    metaMinima: null,
    metaMaxima: null,
    metaAcumulada: null,
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, ii] = await Promise.all([
        PlaneamientoAction.getIndicadoresMetas(),
        PlaneamientoAction.getIndicadoresInstrumentos(),
      ]);

      setRows(data);
      setIiList(ii);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando metas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const columns = useMemo<ColumnDef<IndicadorMetaListDto>[]>(() => [
    { key: "anio", header: "Año", sortable: true, width: 90 },
    { key: "codigoIndicador", header: "Código", sortable: true, width: 120 },
    { key: "nombreIndicador", header: "Indicador", sortable: true },
    { key: "nombreInstrumento", header: "Instrumento", width: 200 },
    { key: "metaProgramada", header: "Meta", width: 120 },
    { key: "lineaBase", header: "Línea Base", width: 120 },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      width: 110,
      render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
    },
  ], []);

  const onView = (r: IndicadorMetaListDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = (r: IndicadorMetaListDto) => {
    setEditing(r);
    setForm({
      idIndicadorInstrumento: r.idIndicadorInstrumento,
      anio: r.anio,
      lineaBase: r.lineaBase ?? null,
      metaProgramada: r.metaProgramada ?? null,
      metaMinima: r.metaMinima ?? null,
      metaMaxima: r.metaMaxima ?? null,
      metaAcumulada: r.metaAcumulada ?? null,
      estado: r.estado ?? "ACTIVO",
    });
    setOpenEdit(true);
  };

  const save = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      await PlaneamientoAction.updateIndicadorMeta(editing.idMeta, form);
      setOpenEdit(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const iiLabel = (id: number) => {
    const x = iiList.find((z) => z.idIndicadorInstrumento === id);
    if (!x) return `#${id}`;
    return `${x.codigoIndicador ?? ""} - ${x.nombreIndicador ?? ""} (${x.nombreInstrumento ?? ""})`.trim();
  };

  const onNew = () => {
    setCreateError(null);
    setCreateForm(emptyCreate);
    setOpenCreate(true);
  };

  const requiredCreateOk = createForm.idIndicadorInstrumento > 0 && !!createForm.anio;

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      await PlaneamientoAction.createIndicadorMeta(createForm);

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
        title="Planeamiento: Indicadores Metas"
        subtitle="Metas por indicador-instrumento y año."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idMeta}
        searchKeys={["anio", "codigoIndicador", "nombreIndicador", "nombreInstrumento", "estado"]}
        onRefresh={load}
        allowEdit
        onView={onView}
        onEdit={onEdit}
        onNew={onNew}
        newLabel="Nuevo"
      />

      {/* VIEW */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle de Meta</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <LabelValue label="Año" value={viewRow.anio} />
              <LabelValue label="Estado" value={<Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>} />
              <LabelValue label="Unidad" value={viewRow.nombreUnidadMedida ?? "—"} />
              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Indicador" value={`${viewRow.codigoIndicador ?? ""} - ${viewRow.nombreIndicador ?? ""}`} />
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Instrumento" value={viewRow.nombreInstrumento ?? "—"} />
              </Box>
              <LabelValue label="Línea base" value={viewRow.lineaBase ?? "—"} />
              <LabelValue label="Meta programada" value={viewRow.metaProgramada ?? "—"} />
              <LabelValue label="Meta acumulada" value={viewRow.metaAcumulada ?? "—"} />
              <LabelValue label="Meta mínima" value={viewRow.metaMinima ?? "—"} />
              <LabelValue label="Meta máxima" value={viewRow.metaMaxima ?? "—"} />
              <LabelValue label="Id IndicadorInstrumento" value={viewRow.idIndicadorInstrumento} />
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
        <DialogTitle sx={{ fontWeight: 900 }}>Editar Meta</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Indicador - Instrumento"
              select
              value={form.idIndicadorInstrumento}
              onChange={(e) => setForm((p) => ({ ...p, idIndicadorInstrumento: Number(e.target.value) }))}
              fullWidth
            >
              {iiList.map((x) => (
                <MenuItem key={x.idIndicadorInstrumento} value={x.idIndicadorInstrumento}>
                  {iiLabel(x.idIndicadorInstrumento)}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Año"
                type="number"
                value={form.anio}
                onChange={(e) => setForm((p) => ({ ...p, anio: Number(e.target.value) }))}
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

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Línea base"
                type="number"
                value={form.lineaBase ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, lineaBase: e.target.value === "" ? null : Number(e.target.value) }))}
                fullWidth
              />
              <TextField
                label="Meta programada"
                type="number"
                value={form.metaProgramada ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, metaProgramada: e.target.value === "" ? null : Number(e.target.value) }))}
                fullWidth
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Meta mínima"
                type="number"
                value={form.metaMinima ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, metaMinima: e.target.value === "" ? null : Number(e.target.value) }))}
                fullWidth
              />
              <TextField
                label="Meta máxima"
                type="number"
                value={form.metaMaxima ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, metaMaxima: e.target.value === "" ? null : Number(e.target.value) }))}
                fullWidth
              />
            </Box>

            <TextField
              label="Meta acumulada"
              type="number"
              value={form.metaAcumulada ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, metaAcumulada: e.target.value === "" ? null : Number(e.target.value) }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      
        {/* CREATE */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Nueva Meta</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
            <TextField
              label="Indicador - Instrumento"
              select
              value={createForm.idIndicadorInstrumento}
              onChange={(e) => setCreateForm((p) => ({ ...p, idIndicadorInstrumento: Number(e.target.value) }))}
              fullWidth
            >
              {iiList.map((x) => (
                <MenuItem key={x.idIndicadorInstrumento} value={x.idIndicadorInstrumento}>
                  {iiLabel(x.idIndicadorInstrumento)}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Año"
                type="number"
                value={createForm.anio}
                onChange={(e) => setCreateForm((p) => ({ ...p, anio: Number(e.target.value) }))}
                fullWidth
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
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Línea base"
                type="number"
                value={createForm.lineaBase ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, lineaBase: e.target.value === "" ? null : Number(e.target.value) }))}
                fullWidth
              />
              <TextField
                label="Meta programada"
                type="number"
                value={createForm.metaProgramada ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, metaProgramada: e.target.value === "" ? null : Number(e.target.value) }))}
                fullWidth
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Meta mínima"
                type="number"
                value={createForm.metaMinima ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, metaMinima: e.target.value === "" ? null : Number(e.target.value) }))}
                fullWidth
              />
              <TextField
                label="Meta máxima"
                type="number"
                value={createForm.metaMaxima ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, metaMaxima: e.target.value === "" ? null : Number(e.target.value) }))}
                fullWidth
              />
            </Box>

            <TextField
              label="Meta acumulada"
              type="number"
              value={createForm.metaAcumulada ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, metaAcumulada: e.target.value === "" ? null : Number(e.target.value) }))}
              fullWidth
            />

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