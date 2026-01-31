import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
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
import { CatalogoAction, type InstrumentoDto } from "../../catalogos/CatalogoAction";
import { PlaneamientoAction, type ObjetivoListDto, type AccionListDto } from "../../planeamiento/PlaneamientoAction";

import {
  AlineamientoAction,
  type AlineamientoCreateUpdateDto,
  type AlineamientoListDto,
} from "../AlineamientoAction";

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

function errMsg(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

function objetivoLabel(o: ObjetivoListDto) {
  const cod = (o.codigo ?? "").trim();
  const enu = (o.enunciado ?? "").trim();
  if (cod && enu) return `${cod} - ${enu}`;
  return cod || enu || `Objetivo ${o.idObjetivo}`;
}

function accionLabel(a: AccionListDto) {
  const cod = (a.codigo ?? "").trim();
  const enu = (a.enunciado ?? "").trim();
  if (cod && enu) return `${cod} - ${enu}`;
  return cod || enu || `Acción ${a.idAccion}`;
}

export default function AlineamientosInstrumentosPage() {
  const [rows, setRows] = useState<AlineamientoListDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [fOrigen, setFOrigen] = useState<number | "">("");
  const [fDestino, setFDestino] = useState<number | "">("");

  // combos dinámicos (form)
  const [objOrigen, setObjOrigen] = useState<ObjetivoListDto[]>([]);
  const [objDestino, setObjDestino] = useState<ObjetivoListDto[]>([]);
  const [accOrigen, setAccOrigen] = useState<AccionListDto[]>([]);
  const [accDestino, setAccDestino] = useState<AccionListDto[]>([]);

  // create/edit
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<AlineamientoListDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<AlineamientoCreateUpdateDto>({
    idInstrumentoOrigen: 0,
    idObjetivoOrigen: null,
    idAccionOrigen: null,
    idInstrumentoDestino: 0,
    idObjetivoDestino: null,
    idAccionDestino: null,
    tipoAlineamiento: "",
    nivelAlineamiento: "",
    porcentajeContribucion: null,
    descripcionAlineamiento: "",
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [inst, data] = await Promise.all([
        CatalogoAction.getInstrumentos(),
        AlineamientoAction.getAlineamientos(
          fOrigen === "" ? null : Number(fOrigen),
          fDestino === "" ? null : Number(fDestino)
        ),
      ]);

      setInstrumentos(inst);
      setRows(data);
    } catch (e: unknown) {
      setError(errMsg(e, "Error cargando alineamientos"));
    } finally {
      setLoading(false);
    }
  }, [fOrigen, fDestino]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDependientesOrigen = useCallback(async (idInstrumento: number) => {
    if (!idInstrumento) {
      setObjOrigen([]);
      setAccOrigen([]);
      return;
    }

    const [o, a] = await Promise.all([
      PlaneamientoAction.getObjetivosByInstrumento(idInstrumento),
      PlaneamientoAction.getAccionesByInstrumento(idInstrumento),
    ]);

    setObjOrigen(o);
    setAccOrigen(a);
  }, []);

  const loadDependientesDestino = useCallback(async (idInstrumento: number) => {
    if (!idInstrumento) {
      setObjDestino([]);
      setAccDestino([]);
      return;
    }

    const [o, a] = await Promise.all([
      PlaneamientoAction.getObjetivosByInstrumento(idInstrumento),
      PlaneamientoAction.getAccionesByInstrumento(idInstrumento),
    ]);

    setObjDestino(o);
    setAccDestino(a);
  }, []);

  const columns = useMemo<ColumnDef<AlineamientoListDto>[]>(() => [
    {
      key: "origen",
      header: "Origen",
      render: (r) => (
        <Box sx={{ display: "grid", gap: 0.2 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            {r.nombreInstrumentoOrigen ?? `Instrumento ${r.idInstrumentoOrigen}`}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            {r.codigoObjetivoOrigen ? `Obj: ${r.codigoObjetivoOrigen}` : "Obj: —"}{"  "}
            {r.codigoAccionOrigen ? `Acc: ${r.codigoAccionOrigen}` : "Acc: —"}
          </Typography>
        </Box>
      ),
    },
    {
      key: "destino",
      header: "Destino",
      render: (r) => (
        <Box sx={{ display: "grid", gap: 0.2 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
            {r.nombreInstrumentoDestino ?? `Instrumento ${r.idInstrumentoDestino}`}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            {r.codigoObjetivoDestino ? `Obj: ${r.codigoObjetivoDestino}` : "Obj: —"}{"  "}
            {r.codigoAccionDestino ? `Acc: ${r.codigoAccionDestino}` : "Acc: —"}
          </Typography>
        </Box>
      ),
    },
    { key: "tipoAlineamiento", header: "Tipo", width: 140 },
    { key: "nivelAlineamiento", header: "Nivel", width: 140 },
    {
      key: "porcentajeContribucion",
      header: "% Contrib.",
      width: 120,
      render: (r) => (r.porcentajeContribucion ?? "—"),
    },
    {
      key: "estado",
      header: "Estado",
      width: 120,
      render: (r) => <Box sx={pillSx(r.estado)}>{r.estado ?? "—"}</Box>,
    },
  ], []);

  const onNew = () => {
    setEditing(null);
    setSaveError(null);
    setForm({
      idInstrumentoOrigen: 0,
      idObjetivoOrigen: null,
      idAccionOrigen: null,
      idInstrumentoDestino: 0,
      idObjetivoDestino: null,
      idAccionDestino: null,
      tipoAlineamiento: "",
      nivelAlineamiento: "",
      porcentajeContribucion: null,
      descripcionAlineamiento: "",
      estado: "ACTIVO",
    });
    setObjOrigen([]);
    setAccOrigen([]);
    setObjDestino([]);
    setAccDestino([]);
    setOpenForm(true);
  };

  const onEdit = async (r: AlineamientoListDto) => {
    setEditing(r);
    setSaveError(null);

    setForm({
      idInstrumentoOrigen: r.idInstrumentoOrigen,
      idObjetivoOrigen: r.idObjetivoOrigen ?? null,
      idAccionOrigen: r.idAccionOrigen ?? null,
      idInstrumentoDestino: r.idInstrumentoDestino,
      idObjetivoDestino: r.idObjetivoDestino ?? null,
      idAccionDestino: r.idAccionDestino ?? null,
      tipoAlineamiento: r.tipoAlineamiento ?? "",
      nivelAlineamiento: r.nivelAlineamiento ?? "",
      porcentajeContribucion: r.porcentajeContribucion ?? null,
      descripcionAlineamiento: "",
      estado: r.estado ?? "ACTIVO",
    });

    await Promise.all([
      loadDependientesOrigen(r.idInstrumentoOrigen),
      loadDependientesDestino(r.idInstrumentoDestino),
    ]);

    setOpenForm(true);
  };

  const save = async () => {
    try {
      if (!form.idInstrumentoOrigen || !form.idInstrumentoDestino) {
        setSaveError("Selecciona Instrumento Origen y Destino.");
        return;
      }

      setSaving(true);
      setSaveError(null);

      if (editing) {
        await AlineamientoAction.updateAlineamiento(editing.idAlineamiento, form);
      } else {
        await AlineamientoAction.createAlineamiento(form);
      }

      setOpenForm(false);
      await load();
    } catch (e: unknown) {
      setSaveError(errMsg(e, "Error al guardar"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setSaveError(null);
      await AlineamientoAction.deleteAlineamiento(editing.idAlineamiento);
      setOpenForm(false);
      await load();
    } catch (e: unknown) {
      setSaveError(errMsg(e, "Error al eliminar"));
    } finally {
      setSaving(false);
    }
  };

  // valores seleccionados para los Autocomplete (porque el form guarda IDs)
  const selectedObjOrigen = form.idObjetivoOrigen ? objOrigen.find(o => o.idObjetivo === form.idObjetivoOrigen) ?? null : null;
  const selectedAccOrigen = form.idAccionOrigen ? accOrigen.find(a => a.idAccion === form.idAccionOrigen) ?? null : null;
  const selectedObjDestino = form.idObjetivoDestino ? objDestino.find(o => o.idObjetivo === form.idObjetivoDestino) ?? null : null;
  const selectedAccDestino = form.idAccionDestino ? accDestino.find(a => a.idAccion === form.idAccionDestino) ?? null : null;

  return (
    <>
      {/* Filtros arriba */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label="Filtro Origen"
          value={fOrigen}
          onChange={(e) => setFOrigen(e.target.value === "" ? "" : Number(e.target.value))}
          sx={{ width: 260 }}
        >
          <MenuItem value="">(Todos)</MenuItem>
          {instrumentos.map((i) => (
            <MenuItem key={i.idInstrumento} value={i.idInstrumento}>
              {i.codigo} - {i.nombre}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Filtro Destino"
          value={fDestino}
          onChange={(e) => setFDestino(e.target.value === "" ? "" : Number(e.target.value))}
          sx={{ width: 260 }}
        >
          <MenuItem value="">(Todos)</MenuItem>
          {instrumentos.map((i) => (
            <MenuItem key={i.idInstrumento} value={i.idInstrumento}>
              {i.codigo} - {i.nombre}
            </MenuItem>
          ))}
        </TextField>

        <Button variant="outlined" onClick={() => void load()}>
          Aplicar
        </Button>
      </Box>

      <CatalogoTablePage
        title="Alineamiento: Articulación entre instrumentos"
        subtitle="Registra cómo un objetivo/acción de un instrumento contribuye a otro (CEPLAN)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idAlineamiento}
        searchKeys={[
          "nombreInstrumentoOrigen",
          "nombreInstrumentoDestino",
          "codigoObjetivoOrigen",
          "codigoAccionOrigen",
          "codigoObjetivoDestino",
          "codigoAccionDestino",
          "tipoAlineamiento",
          "nivelAlineamiento",
          "estado",
        ]}
        onRefresh={load}
        onView={onEdit}
        onEdit={onEdit}
        onNew={onNew}
        newLabel="Nuevo Alineamiento"
        allowEdit={true}
      />

      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>
          {editing ? "Editar Alineamiento" : "Nuevo Alineamiento"}
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {saveError && (
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                bgcolor: "rgba(239,68,68,.08)",
                border: "1px solid rgba(239,68,68,.25)",
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontWeight: 900, color: "error.main" }}>
                {saveError}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            {/* ORIGEN */}
            <Box sx={{ display: "grid", gap: 1.2 }}>
              <Typography sx={{ fontWeight: 950 }}>Origen</Typography>

              <TextField
                select
                label="Instrumento Origen"
                value={form.idInstrumentoOrigen || ""}
                onChange={async (e) => {
                  const v = Number(e.target.value || 0);
                  setForm((p) => ({
                    ...p,
                    idInstrumentoOrigen: v,
                    idObjetivoOrigen: null,
                    idAccionOrigen: null,
                  }));
                  await loadDependientesOrigen(v);
                }}
                fullWidth
              >
                <MenuItem value="">Seleccionar...</MenuItem>
                {instrumentos.map((i) => (
                  <MenuItem key={i.idInstrumento} value={i.idInstrumento}>
                    {i.codigo} - {i.nombre}
                  </MenuItem>
                ))}
              </TextField>

              {/* OBJETIVO ORIGEN (buscable) */}
              <Autocomplete<ObjetivoListDto, false, false, false>
                options={objOrigen}
                value={selectedObjOrigen}
                onChange={(_, v) =>
                  setForm((p) => ({ ...p, idObjetivoOrigen: v ? v.idObjetivo : null }))
                }
                getOptionLabel={objetivoLabel}
                isOptionEqualToValue={(opt, val) => opt.idObjetivo === val.idObjetivo}
                disabled={!form.idInstrumentoOrigen}
                renderInput={(params) => (
                  <TextField {...params} label="Objetivo Origen (opcional)" />
                )}
              />

              {/* ACCION ORIGEN (buscable) */}
              <Autocomplete<AccionListDto, false, false, false>
                options={accOrigen}
                value={selectedAccOrigen}
                onChange={(_, v) =>
                  setForm((p) => ({ ...p, idAccionOrigen: v ? v.idAccion : null }))
                }
                getOptionLabel={accionLabel}
                isOptionEqualToValue={(opt, val) => opt.idAccion === val.idAccion}
                disabled={!form.idInstrumentoOrigen}
                renderInput={(params) => (
                  <TextField {...params} label="Acción Origen (opcional)" />
                )}
              />
            </Box>

            {/* DESTINO */}
            <Box sx={{ display: "grid", gap: 1.2 }}>
              <Typography sx={{ fontWeight: 950 }}>Destino</Typography>

              <TextField
                select
                label="Instrumento Destino"
                value={form.idInstrumentoDestino || ""}
                onChange={async (e) => {
                  const v = Number(e.target.value || 0);
                  setForm((p) => ({
                    ...p,
                    idInstrumentoDestino: v,
                    idObjetivoDestino: null,
                    idAccionDestino: null,
                  }));
                  await loadDependientesDestino(v);
                }}
                fullWidth
              >
                <MenuItem value="">Seleccionar...</MenuItem>
                {instrumentos.map((i) => (
                  <MenuItem key={i.idInstrumento} value={i.idInstrumento}>
                    {i.codigo} - {i.nombre}
                  </MenuItem>
                ))}
              </TextField>

              {/* OBJETIVO DESTINO (buscable) */}
              <Autocomplete<ObjetivoListDto, false, false, false>
                options={objDestino}
                value={selectedObjDestino}
                onChange={(_, v) =>
                  setForm((p) => ({ ...p, idObjetivoDestino: v ? v.idObjetivo : null }))
                }
                getOptionLabel={objetivoLabel}
                isOptionEqualToValue={(opt, val) => opt.idObjetivo === val.idObjetivo}
                disabled={!form.idInstrumentoDestino}
                renderInput={(params) => (
                  <TextField {...params} label="Objetivo Destino (opcional)" />
                )}
              />

              {/* ACCION DESTINO (buscable) */}
              <Autocomplete<AccionListDto, false, false, false>
                options={accDestino}
                value={selectedAccDestino}
                onChange={(_, v) =>
                  setForm((p) => ({ ...p, idAccionDestino: v ? v.idAccion : null }))
                }
                getOptionLabel={accionLabel}
                isOptionEqualToValue={(opt, val) => opt.idAccion === val.idAccion}
                disabled={!form.idInstrumentoDestino}
                renderInput={(params) => (
                  <TextField {...params} label="Acción Destino (opcional)" />
                )}
              />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mt: 1.5 }}>
            <TextField
              label="Tipo"
              value={form.tipoAlineamiento ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, tipoAlineamiento: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Nivel"
              value={form.nivelAlineamiento ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, nivelAlineamiento: e.target.value }))}
              fullWidth
            />
            <TextField
              label="% Contribución"
              type="number"
              value={form.porcentajeContribucion ?? ""}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  porcentajeContribucion: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              fullWidth
            />
          </Box>

          <TextField
            sx={{ mt: 1.5 }}
            label="Descripción"
            value={form.descripcionAlineamiento ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, descripcionAlineamiento: e.target.value }))}
            fullWidth
            multiline
            minRows={3}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 1.5, mt: 1.5 }}>
            <TextField
              select
              label="Estado"
              value={form.estado}
              onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
              fullWidth
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {editing && (
            <Button color="error" onClick={() => void remove()} disabled={saving}>
              Eliminar
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpenForm(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void save()} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

