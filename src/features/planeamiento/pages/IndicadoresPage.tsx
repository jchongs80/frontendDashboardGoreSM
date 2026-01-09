import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import CatalogoTablePage, { type ColumnDef } from "../../catalogos/components/CatalogoTablePage";
import { CatalogoAction, type FuenteDatoDto, type TipoIndicadorDto, type UnidadMedidaDto } from "../../catalogos/CatalogoAction";
import { PlaneamientoAction, type IndicadorCreateUpdateDto, type IndicadorListDto } from "../PlaneamientoAction";

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

export default function IndicadoresPage() {
  const [rows, setRows] = useState<IndicadorListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // combos
  const [tipos, setTipos] = useState<TipoIndicadorDto[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedidaDto[]>([]);
  const [fuentes, setFuentes] = useState<FuenteDatoDto[]>([]);

  // view
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<IndicadorListDto | null>(null);

  // create
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<IndicadorListDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<IndicadorCreateUpdateDto>({
    codigo: "",
    nombre: "",
    descripcion: "",
    idTipoIndicador: null,
    idUnidadMedida: null,
    idFuenteDatos: null,
    formulaCalculo: "",
    metodoCalculo: "",
    tendencia: "",
    esAcumulable: false,
    periodicidad: "",
    esIndicadorResultado: false,
    esIndicadorImpacto: false,
    esIndicadorGestion: true,
    observaciones: "",
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, t, u, f] = await Promise.all([
        PlaneamientoAction.getIndicadores(),
        CatalogoAction.getTiposIndicador(),
        CatalogoAction.getUnidadesMedida(),
        CatalogoAction.getFuentesDatos(),
      ]);

      setRows(data);
      setTipos(t);
      setUnidades(u);
      setFuentes(f);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando indicadores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const columns = useMemo<ColumnDef<IndicadorListDto>[]>(() => [
    { key: "codigo", header: "Código", sortable: true, width: 120 },
    { key: "nombre", header: "Nombre", sortable: true },
    { key: "nombreTipoIndicador", header: "Tipo", width: 170 },
    { key: "nombreUnidadMedida", header: "U. Medida", width: 140 },
    { key: "nombreFuenteDatos", header: "Fuente", width: 180 },
    { key: "tendencia", header: "Tendencia", width: 120 },
    { key: "periodicidad", header: "Periodicidad", width: 130 },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      width: 110,
      render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
    },
  ], []);

  const onView = (r: IndicadorListDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = async (r: IndicadorListDto) => {
    setSaveError(null);
    setEditing(r);

    // si tu api helper no trae el detail por defecto, esto asegura el payload completo para update
    const detail = await PlaneamientoAction.getIndicadorById(r.idIndicador);

    setForm({
      codigo: detail.codigo,
      nombre: detail.nombre,
      descripcion: detail.descripcion ?? "",
      idTipoIndicador: detail.idTipoIndicador ?? null,
      idUnidadMedida: detail.idUnidadMedida ?? null,
      idFuenteDatos: detail.idFuenteDatos ?? null,
      formulaCalculo: detail.formulaCalculo ?? "",
      metodoCalculo: detail.metodoCalculo ?? "",
      tendencia: detail.tendencia ?? "",
      esAcumulable: !!detail.esAcumulable,
      periodicidad: detail.periodicidad ?? "",
      esIndicadorResultado: !!detail.esIndicadorResultado,
      esIndicadorImpacto: !!detail.esIndicadorImpacto,
      esIndicadorGestion: !!detail.esIndicadorGestion,
      observaciones: detail.observaciones ?? "",
      estado: detail.estado ?? "ACTIVO",
    });

    setOpenEdit(true);
  };

  const save = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updateIndicador(editing.idIndicador, form);
      setOpenEdit(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

 

  const emptyIndicador: IndicadorCreateUpdateDto = {
  codigo: "",
  nombre: "",
  descripcion: "",
  idTipoIndicador: null,
  idUnidadMedida: null,
  idFuenteDatos: null,
  formulaCalculo: "",
  metodoCalculo: "",
  tendencia: "",
  esAcumulable: false,
  periodicidad: "",
  esIndicadorResultado: false,
  esIndicadorImpacto: false,
  esIndicadorGestion: true,
  observaciones: "",
  estado: "ACTIVO",
  };

  const onNew = () => {
    setCreateError(null);
    setForm(emptyIndicador);
    setOpenCreate(true);
  };

  const requiredOk = !!form.codigo.trim() && !!form.nombre.trim();

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      await PlaneamientoAction.createIndicador(form);

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
        title="Planeamiento: Indicadores"
        subtitle="Visualiza y edita indicadores (estructura completa del backend)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idIndicador}
        searchKeys={["codigo", "nombre", "nombreTipoIndicador", "nombreUnidadMedida", "nombreFuenteDatos", "tendencia", "periodicidad", "estado"]}
        onRefresh={load}
        allowEdit
        onView={onView}
        onEdit={onEdit}
        onNew={onNew}
        newLabel="Nuevo"
      />

      {/* VIEW */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle del Indicador</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <LabelValue label="Código" value={viewRow.codigo} />
              <LabelValue label="Estado" value={<Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>} />
              <LabelValue label="Periodicidad" value={viewRow.periodicidad ?? "—"} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Nombre" value={viewRow.nombre} />
              </Box>

              <LabelValue label="Tipo de Indicador" value={viewRow.nombreTipoIndicador ?? "—"} />
              <LabelValue label="Unidad de Medida" value={viewRow.nombreUnidadMedida ?? "—"} />
              <LabelValue label="Fuente de Datos" value={viewRow.nombreFuenteDatos ?? "—"} />

              <LabelValue
                label="Clasificación"
                value={
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {viewRow.esIndicadorResultado && <Box sx={{ ...pillSx("ACTIVO"), bgcolor: "rgba(59,130,246,.10)" }}>RESULTADO</Box>}
                    {viewRow.esIndicadorImpacto && <Box sx={{ ...pillSx("ACTIVO"), bgcolor: "rgba(168,85,247,.10)" }}>IMPACTO</Box>}
                    {viewRow.esIndicadorGestion && <Box sx={{ ...pillSx("ACTIVO"), bgcolor: "rgba(245,158,11,.10)" }}>GESTIÓN</Box>}
                  </Box>
                }
              />
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
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Editar Indicador</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mt:0.25 }}>
            <TextField
              label="Código"
              value={form.codigo}
              onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
              InputLabelProps={{
                shrink: true,
                sx: { lineHeight: 1.2, overflow: "visible" },
              }}
            />
            <TextField
              label="Estado"
              select
              value={form.estado}
              onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
              fullWidth
              InputLabelProps={{
                shrink: true,
                sx: { lineHeight: 1.2, overflow: "visible" },
              }}
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <TextField
                label="Nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                fullWidth
              />
            </Box>

            <TextField
              label="Tipo Indicador"
              select
              value={form.idTipoIndicador ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idTipoIndicador: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {tipos.map((x) => (
                <MenuItem key={x.idTipoIndicador} value={x.idTipoIndicador}>
                  {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Unidad de Medida"
              select
              value={form.idUnidadMedida ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idUnidadMedida: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {unidades.map((x) => (
                <MenuItem key={x.idUnidadMedida} value={x.idUnidadMedida}>
                  {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Fuente de Datos"
              select
              value={form.idFuenteDatos ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idFuenteDatos: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {fuentes.map((x) => (
                <MenuItem key={x.idFuenteDatos} value={x.idFuenteDatos}>
                  {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Tendencia"
              select
              value={form.tendencia ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, tendencia: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="ASCENDENTE">ASCENDENTE</MenuItem>
              <MenuItem value="DESCENDENTE">DESCENDENTE</MenuItem>
              <MenuItem value="NEUTRA">NEUTRA</MenuItem>
            </TextField>

            <TextField
              label="Periodicidad"
              select
              value={form.periodicidad ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, periodicidad: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="MENSUAL">MENSUAL</MenuItem>
              <MenuItem value="TRIMESTRAL">TRIMESTRAL</MenuItem>
              <MenuItem value="SEMESTRAL">SEMESTRAL</MenuItem>
              <MenuItem value="ANUAL">ANUAL</MenuItem>
            </TextField>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <TextField
                label="Descripción"
                value={form.descripcion ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
            </Box>

            <TextField
              label="Fórmula de Cálculo"
              value={form.formulaCalculo ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, formulaCalculo: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Método de Cálculo"
              value={form.metodoCalculo ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, metodoCalculo: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />

            <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Switch checked={form.esAcumulable} onChange={(e) => setForm((p) => ({ ...p, esAcumulable: e.target.checked }))} />}
                label="Acumulable"
              />
              <FormControlLabel
                control={<Switch checked={form.esIndicadorResultado} onChange={(e) => setForm((p) => ({ ...p, esIndicadorResultado: e.target.checked }))} />}
                label="Resultado"
              />
              <FormControlLabel
                control={<Switch checked={form.esIndicadorImpacto} onChange={(e) => setForm((p) => ({ ...p, esIndicadorImpacto: e.target.checked }))} />}
                label="Impacto"
              />
              <FormControlLabel
                control={<Switch checked={form.esIndicadorGestion} onChange={(e) => setForm((p) => ({ ...p, esIndicadorGestion: e.target.checked }))} />}
                label="Gestión"
              />
            </Box>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <TextField
                label="Observaciones"
                value={form.observaciones ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
            </Box>

            {saveError && (
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography sx={{ color: "error.main", fontWeight: 800 }}>{saveError}</Typography>
              </Box>
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
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Nuevo Indicador</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mt:0.25 }}>
            <TextField
              label="Código"
              value={form.codigo}
              onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
              InputLabelProps={{
                shrink: true,
                sx: { lineHeight: 1.2, overflow: "visible" },
              }}
            />
            <TextField
              label="Estado"
              select
              value={form.estado}
              onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
              fullWidth
              InputLabelProps={{
                shrink: true,
                sx: { lineHeight: 1.2, overflow: "visible" },
              }}
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <TextField
                label="Nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                fullWidth
              />
            </Box>

            <TextField
              label="Tipo Indicador"
              select
              value={form.idTipoIndicador ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idTipoIndicador: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {tipos.map((x) => (
                <MenuItem key={x.idTipoIndicador} value={x.idTipoIndicador}>
                  {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Unidad de Medida"
              select
              value={form.idUnidadMedida ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idUnidadMedida: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {unidades.map((x) => (
                <MenuItem key={x.idUnidadMedida} value={x.idUnidadMedida}>
                  {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Fuente de Datos"
              select
              value={form.idFuenteDatos ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  idFuenteDatos: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {fuentes.map((x) => (
                <MenuItem key={x.idFuenteDatos} value={x.idFuenteDatos}>
                  {x.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Tendencia"
              select
              value={form.tendencia ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, tendencia: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="ASCENDENTE">ASCENDENTE</MenuItem>
              <MenuItem value="DESCENDENTE">DESCENDENTE</MenuItem>
              <MenuItem value="NEUTRA">NEUTRA</MenuItem>
            </TextField>

            <TextField
              label="Periodicidad"
              select
              value={form.periodicidad ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, periodicidad: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              <MenuItem value="MENSUAL">MENSUAL</MenuItem>
              <MenuItem value="TRIMESTRAL">TRIMESTRAL</MenuItem>
              <MenuItem value="SEMESTRAL">SEMESTRAL</MenuItem>
              <MenuItem value="ANUAL">ANUAL</MenuItem>
            </TextField>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <TextField
                label="Descripción"
                value={form.descripcion ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
            </Box>

            <TextField
              label="Fórmula de Cálculo"
              value={form.formulaCalculo ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, formulaCalculo: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Método de Cálculo"
              value={form.metodoCalculo ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, metodoCalculo: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
            />

            <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Switch checked={form.esAcumulable} onChange={(e) => setForm((p) => ({ ...p, esAcumulable: e.target.checked }))} />}
                label="Acumulable"
              />
              <FormControlLabel
                control={<Switch checked={form.esIndicadorResultado} onChange={(e) => setForm((p) => ({ ...p, esIndicadorResultado: e.target.checked }))} />}
                label="Resultado"
              />
              <FormControlLabel
                control={<Switch checked={form.esIndicadorImpacto} onChange={(e) => setForm((p) => ({ ...p, esIndicadorImpacto: e.target.checked }))} />}
                label="Impacto"
              />
              <FormControlLabel
                control={<Switch checked={form.esIndicadorGestion} onChange={(e) => setForm((p) => ({ ...p, esIndicadorGestion: e.target.checked }))} />}
                label="Gestión"
              />
            </Box>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <TextField
                label="Observaciones"
                value={form.observaciones ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
                fullWidth
                multiline
                minRows={2}
              />
            </Box>

            {createError && (
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography sx={{ color: "error.main", fontWeight: 800 }}>{createError}</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>Cancelar</Button>
          <Button onClick={create} variant="contained" disabled={!requiredOk || creating}>
            {creating ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}