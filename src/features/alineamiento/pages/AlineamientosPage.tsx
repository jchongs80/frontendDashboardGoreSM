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
import { CatalogoAction } from "../../catalogos/CatalogoAction";
import {
  PlaneamientoAction,
  type AlineamientoInstrumentoCreateUpdateDto,
  type AlineamientoInstrumentoListDto,
} from "../PlaneamientoAction";

type InstrumentoDto = { idInstrumento: number; codigo?: string | null; nombre: string };
type ObjetivoDto = { idObjetivo: number; idInstrumento: number; codigo: string; enunciado: string; estado: string };
type AccionDto = { idAccion: number; idObjetivo: number; codigo: string; enunciado: string; estado: string };

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

function byId<T extends { [k: string]: any }>(list: T[], idKey: keyof T) {
  const map = new Map<number, T>();
  for (const x of list) {
    const id = Number(x[idKey]);
    if (!Number.isNaN(id)) map.set(id, x);
  }
  return map;
}

function formatEntidad(inst?: InstrumentoDto | null, objetivo?: ObjetivoDto | null, accion?: AccionDto | null) {
  const instTxt = inst ? `${inst.codigo ?? ""} ${inst.nombre}`.trim() : "—";
  if (accion) return `${instTxt} / ${accion.codigo} - ${accion.enunciado}`;
  if (objetivo) return `${instTxt} / ${objetivo.codigo} - ${objetivo.enunciado}`;
  return instTxt;
}

export default function AlineamientosPage() {
  const [rows, setRows] = useState<AlineamientoInstrumentoListDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoDto[]>([]);
  const [acciones, setAcciones] = useState<AccionDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VIEW
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<AlineamientoInstrumentoListDto | null>(null);

  // EDIT
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<AlineamientoInstrumentoListDto | null>(null);
  const [form, setForm] = useState<AlineamientoInstrumentoCreateUpdateDto>({
    idInstrumentoOrigen: 0,
    idObjetivoOrigen: null,
    idAccionOrigen: null,
    idInstrumentoDestino: 0,
    idObjetivoDestino: null,
    idAccionDestino: null,
    tipoAlineamiento: "DIRECTO",
    nivelAlineamiento: "ESTRATEGICO",
    porcentajeContribucion: 100,
    descripcion: "",
    estado: "ACTIVO",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // CREATE
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<AlineamientoInstrumentoCreateUpdateDto>({
    idInstrumentoOrigen: 0,
    idObjetivoOrigen: null,
    idAccionOrigen: null,
    idInstrumentoDestino: 0,
    idObjetivoDestino: null,
    idAccionDestino: null,
    tipoAlineamiento: "DIRECTO",
    nivelAlineamiento: "ESTRATEGICO",
    porcentajeContribucion: 100,
    descripcion: "",
    estado: "ACTIVO",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [alineamientos, inst, obj, acc] = await Promise.all([
        PlaneamientoAction.getAlineamientosInstrumentos(),
        CatalogoAction.getInstrumentos(),
        PlaneamientoAction.getObjetivos(),
        PlaneamientoAction.getAcciones(),
      ]);

      setRows(alineamientos);
      setInstrumentos(inst);
      setObjetivos(obj);
      setAcciones(acc);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando Alineamientos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const instById = useMemo(() => byId(instrumentos, "idInstrumento"), [instrumentos]);
  const objById = useMemo(() => byId(objetivos, "idObjetivo"), [objetivos]);
  const accById = useMemo(() => byId(acciones, "idAccion"), [acciones]);

  const resolveRow = useCallback(
    (r: AlineamientoInstrumentoListDto) => {
      const instO = instById.get(r.idInstrumentoOrigen) ?? null;
      const instD = instById.get(r.idInstrumentoDestino) ?? null;
      const objO = r.idObjetivoOrigen ? (objById.get(r.idObjetivoOrigen) ?? null) : null;
      const objD = r.idObjetivoDestino ? (objById.get(r.idObjetivoDestino) ?? null) : null;
      const accO = r.idAccionOrigen ? (accById.get(r.idAccionOrigen) ?? null) : null;
      const accD = r.idAccionDestino ? (accById.get(r.idAccionDestino) ?? null) : null;
      return { instO, instD, objO, objD, accO, accD };
    },
    [instById, objById, accById]
  );

  const columns = useMemo<ColumnDef<AlineamientoInstrumentoListDto>[]>(
    () => [
      {
        key: "origen",
        header: "Origen",
        sortable: false,
        render: (r) => {
          const x = resolveRow(r);
          return <Typography sx={{ fontWeight: 800 }}>{formatEntidad(x.instO, x.objO, x.accO)}</Typography>;
        },
      },
      {
        key: "destino",
        header: "Destino",
        sortable: false,
        render: (r) => {
          const x = resolveRow(r);
          return <Typography sx={{ fontWeight: 800 }}>{formatEntidad(x.instD, x.objD, x.accD)}</Typography>;
        },
      },
      { key: "tipoAlineamiento", header: "Tipo", width: 130, sortable: true },
      { key: "nivelAlineamiento", header: "Nivel", width: 140, sortable: true },
      {
        key: "porcentajeContribucion",
        header: "%",
        width: 80,
        sortable: true,
        render: (r) => <Typography sx={{ fontWeight: 900 }}>{r.porcentajeContribucion ?? "—"}</Typography>,
      },
      {
        key: "estado",
        header: "Estado",
        width: 110,
        sortable: true,
        render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
      },
    ],
    [resolveRow]
  );

  const objetivosByInstrumento = useCallback(
    (idInstrumento: number) => objetivos.filter((o) => o.idInstrumento === idInstrumento),
    [objetivos]
  );

  const accionesByObjetivo = useCallback(
    (idObjetivo: number) => acciones.filter((a) => a.idObjetivo === idObjetivo),
    [acciones]
  );

  const validate = (p: AlineamientoInstrumentoCreateUpdateDto) => {
    if (!p.idInstrumentoOrigen) return "Selecciona Instrumento ORIGEN";
    if (!p.idInstrumentoDestino) return "Selecciona Instrumento DESTINO";

    const hasOrigenEntidad = !!p.idAccionOrigen || !!p.idObjetivoOrigen;
    const hasDestinoEntidad = !!p.idAccionDestino || !!p.idObjetivoDestino;

    if (!hasOrigenEntidad) return "En ORIGEN selecciona un Objetivo o una Acción";
    if (!hasDestinoEntidad) return "En DESTINO selecciona un Objetivo o una Acción";

    if (p.porcentajeContribucion != null && (p.porcentajeContribucion < 0 || p.porcentajeContribucion > 100)) {
      return "El % de contribución debe estar entre 0 y 100";
    }

    return null;
  };

  const openEditDialog = (r: AlineamientoInstrumentoListDto) => {
    setEditing(r);
    setSaveError(null);
    setForm({
      idInstrumentoOrigen: r.idInstrumentoOrigen,
      idObjetivoOrigen: r.idObjetivoOrigen ?? null,
      idAccionOrigen: r.idAccionOrigen ?? null,
      idInstrumentoDestino: r.idInstrumentoDestino,
      idObjetivoDestino: r.idObjetivoDestino ?? null,
      idAccionDestino: r.idAccionDestino ?? null,
      tipoAlineamiento: r.tipoAlineamiento ?? "DIRECTO",
      nivelAlineamiento: r.nivelAlineamiento ?? "ESTRATEGICO",
      porcentajeContribucion: r.porcentajeContribucion ?? 100,
      descripcion: r.descripcion ?? "",
      estado: r.estado ?? "ACTIVO",
    });
    setOpenEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const err = validate(form);
    if (err) return setSaveError(err);

    try {
      setSaving(true);
      setSaveError(null);
      await PlaneamientoAction.updateAlineamientoInstrumento(editing.idAlineamiento, form);
      setOpenEdit(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.message ?? "Error guardando cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const err = validate(createForm);
    if (err) return setCreateError(err);

    try {
      setCreating(true);
      setCreateError(null);
      await PlaneamientoAction.createAlineamientoInstrumento(createForm);
      setOpenCreate(false);
      await load();
    } catch (e: any) {
      setCreateError(e?.message ?? "Error creando alineamiento");
    } finally {
      setCreating(false);
    }
  };

  const SidePicker = ({
    label,
    payload,
    setPayload,
    side,
  }: {
    label: string;
    payload: AlineamientoInstrumentoCreateUpdateDto;
    setPayload: (p: AlineamientoInstrumentoCreateUpdateDto) => void;
    side: "O" | "D";
  }) => {
    const isO = side === "O";
    const idInstrumento = isO ? payload.idInstrumentoOrigen : payload.idInstrumentoDestino;
    const idObjetivo = isO ? payload.idObjetivoOrigen : payload.idObjetivoDestino;
    const idAccion = isO ? payload.idAccionOrigen : payload.idAccionDestino;

    const objetivosFiltrados = idInstrumento ? objetivosByInstrumento(idInstrumento) : [];
    const accionesFiltradas = idObjetivo ? accionesByObjetivo(idObjetivo) : [];

    return (
      <Box sx={{ display: "grid", gap: 1.25, p: 1.5, border: "1px solid #EEF2F7", borderRadius: 2 }}>
        <Typography sx={{ fontWeight: 900 }}>{label}</Typography>

        <TextField
          select
          size="small"
          label="Instrumento"
          value={idInstrumento || ""}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (isO) setPayload({ ...payload, idInstrumentoOrigen: v, idObjetivoOrigen: null, idAccionOrigen: null });
            else setPayload({ ...payload, idInstrumentoDestino: v, idObjetivoDestino: null, idAccionDestino: null });
          }}
          fullWidth
        >
          <MenuItem value="">(Seleccione)</MenuItem>
          {instrumentos.map((i) => (
            <MenuItem key={i.idInstrumento} value={i.idInstrumento}>
              {(i.codigo ?? "—") + " - " + i.nombre}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Objetivo (opcional si usas Acción)"
          value={idObjetivo || ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            if (isO) setPayload({ ...payload, idObjetivoOrigen: v, idAccionOrigen: null });
            else setPayload({ ...payload, idObjetivoDestino: v, idAccionDestino: null });
          }}
          disabled={!idInstrumento}
          fullWidth
        >
          <MenuItem value="">(Sin objetivo)</MenuItem>
          {objetivosFiltrados.map((o) => (
            <MenuItem key={o.idObjetivo} value={o.idObjetivo}>
              {o.codigo + " - " + o.enunciado}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Acción (opcional)"
          value={idAccion || ""}
          onChange={(e) => {
            const v = e.target.value ? Number(e.target.value) : null;
            if (isO) setPayload({ ...payload, idAccionOrigen: v });
            else setPayload({ ...payload, idAccionDestino: v });
          }}
          disabled={!idObjetivo}
          fullWidth
        >
          <MenuItem value="">(Sin acción)</MenuItem>
          {accionesFiltradas.map((a) => (
            <MenuItem key={a.idAccion} value={a.idAccion}>
              {a.codigo + " - " + a.enunciado}
            </MenuItem>
          ))}
        </TextField>

        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          Regla: ORIGEN y DESTINO deben tener al menos Objetivo o Acción (no puede ir vacío).
        </Typography>
      </Box>
    );
  };

  return (
    <>
      <CatalogoTablePage<AlineamientoInstrumentoListDto>
        title="Alineamiento CEPLAN"
        subtitle="Articulación entre instrumentos (origen → destino) a nivel de objetivo o acción."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idAlineamiento}
        searchKeys={["tipoAlineamiento", "nivelAlineamiento", "estado", "descripcion"]}
        onRefresh={load}
        onView={(r) => {
          setViewRow(r);
          setOpenView(true);
        }}
        onEdit={(r) => openEditDialog(r)}
        onNew={() => {
          setCreateError(null);
          setCreateForm({
            idInstrumentoOrigen: 0,
            idObjetivoOrigen: null,
            idAccionOrigen: null,
            idInstrumentoDestino: 0,
            idObjetivoDestino: null,
            idAccionDestino: null,
            tipoAlineamiento: "DIRECTO",
            nivelAlineamiento: "ESTRATEGICO",
            porcentajeContribucion: 100,
            descripcion: "",
            estado: "ACTIVO",
          });
          setOpenCreate(true);
        }}
        newLabel="Nuevo alineamiento"
      />

      {/* VIEW */}
      <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de Alineamiento</DialogTitle>
        <DialogContent dividers>
          {viewRow &&
            (() => {
              const x = resolveRow(viewRow);
              return (
                <Box sx={{ display: "grid", gap: 1.2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 900, mb: 0.4 }}>Origen</Typography>
                    <Typography>{formatEntidad(x.instO, x.objO, x.accO)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 900, mb: 0.4 }}>Destino</Typography>
                    <Typography>{formatEntidad(x.instD, x.objD, x.accD)}</Typography>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 900 }}>Tipo</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRow.tipoAlineamiento ?? "—"}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 900 }}>Nivel</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRow.nivelAlineamiento ?? "—"}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 900 }}>%</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{viewRow.porcentajeContribucion ?? "—"}</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 900 }}>Descripción</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{viewRow.descripcion ?? "—"}</Typography>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 900 }}>Estado</Typography>
                    <Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>
                  </Box>
                </Box>
              );
            })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
          {viewRow && (
            <Button variant="contained" onClick={() => { setOpenView(false); openEditDialog(viewRow); }}>
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* CREATE */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Alineamiento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
              <SidePicker label="ORIGEN" payload={createForm} setPayload={setCreateForm} side="O" />
              <SidePicker label="DESTINO" payload={createForm} setPayload={setCreateForm} side="D" />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <TextField
                select size="small" label="Tipo"
                value={createForm.tipoAlineamiento ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, tipoAlineamiento: e.target.value }))}
              >
                {["DIRECTO", "INDIRECTO", "COMPLEMENTARIO"].map((x) => (
                  <MenuItem key={x} value={x}>{x}</MenuItem>
                ))}
              </TextField>

              <TextField
                select size="small" label="Nivel"
                value={createForm.nivelAlineamiento ?? ""}
                onChange={(e) => setCreateForm((p) => ({ ...p, nivelAlineamiento: e.target.value }))}
              >
                {["ESTRATEGICO", "TACTICO", "OPERATIVO"].map((x) => (
                  <MenuItem key={x} value={x}>{x}</MenuItem>
                ))}
              </TextField>

              <TextField
                size="small" label="% Contribución" type="number"
                value={createForm.porcentajeContribucion ?? ""}
                onChange={(e) =>
                  setCreateForm((p) => ({
                    ...p,
                    porcentajeContribucion: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Box>

            <TextField
              size="small" label="Descripción"
              value={createForm.descripcion ?? ""}
              onChange={(e) => setCreateForm((p) => ({ ...p, descripcion: e.target.value }))}
              multiline minRows={3}
            />

            <TextField
              select size="small" label="Estado"
              value={createForm.estado}
              onChange={(e) => setCreateForm((p) => ({ ...p, estado: e.target.value }))}
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>

            {createError && <Typography sx={{ color: "error.main", fontWeight: 900 }}>{createError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? "Grabando..." : "Grabar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Alineamiento</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
              <SidePicker label="ORIGEN" payload={form} setPayload={setForm} side="O" />
              <SidePicker label="DESTINO" payload={form} setPayload={setForm} side="D" />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <TextField
                select size="small" label="Tipo"
                value={form.tipoAlineamiento ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, tipoAlineamiento: e.target.value }))}
              >
                {["DIRECTO", "INDIRECTO", "COMPLEMENTARIO"].map((x) => (
                  <MenuItem key={x} value={x}>{x}</MenuItem>
                ))}
              </TextField>

              <TextField
                select size="small" label="Nivel"
                value={form.nivelAlineamiento ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, nivelAlineamiento: e.target.value }))}
              >
                {["ESTRATEGICO", "TACTICO", "OPERATIVO"].map((x) => (
                  <MenuItem key={x} value={x}>{x}</MenuItem>
                ))}
              </TextField>

              <TextField
                size="small" label="% Contribución" type="number"
                value={form.porcentajeContribucion ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    porcentajeContribucion: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Box>

            <TextField
              size="small" label="Descripción"
              value={form.descripcion ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              multiline minRows={3}
            />

            <TextField
              select size="small" label="Estado"
              value={form.estado}
              onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}
            >
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>

            {saveError && <Typography sx={{ color: "error.main", fontWeight: 900 }}>{saveError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
