import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  MenuItem as MuiMenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";

import CatalogoTablePage, { type ColumnDef } from "../components/CatalogoTablePage";
import {
  CatalogoAction,
  type InstrumentoAccionDto,
  type InstrumentoCreateUpdateDto,
  type InstrumentoDto,
} from "../CatalogoAction";

const toDateOnly = (v?: string | null) => (v ? String(v).slice(0, 10) : "");

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

type LabelValueValue = string | number | boolean | null | undefined;

function LabelValue({ label, value }: { label: string; value?: LabelValueValue }) {
  const display =
    value === null || value === undefined
      ? "—"
      : typeof value === "boolean"
      ? value
        ? "Sí"
        : "No"
      : String(value);

  return (
    <Box sx={{ display: "grid", gap: 0.3 }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
        {display}
      </Typography>
    </Box>
  );
}


function sortAcciones(items: InstrumentoAccionDto[]) {
  const copy = [...items];
  copy.sort((a, b) => {
    const ao = a.orden ?? 9999;
    const bo = b.orden ?? 9999;
    return ao - bo;
  });
  return copy;
}

export default function InstrumentosPage() {
  const [rows, setRows] = useState<InstrumentoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // view
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<InstrumentoDto | null>(null);

  // edit
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<InstrumentoDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<InstrumentoCreateUpdateDto>({
    codigo: "",
    nombre: "",
    descripcion: "",
    horizonteTemporal: "",
    nivel: "",
    vigenciaDesde: null,
    vigenciaHasta: null,
    estado: "ACTIVO",
    archivoDocumento: "",
    fechaAprobacion: null,
    resolucionAprobacion: "",
  });

  // =========================================
  // Menú (3 puntos) - Acciones por instrumento
  // =========================================
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [menuRow, setMenuRow] = useState<InstrumentoDto | null>(null);

  // cache por instrumentoId
  const [accionesByInstrumento, setAccionesByInstrumento] = useState<
    Record<number, InstrumentoAccionDto[]>
  >({});

  const [accionesLoading, setAccionesLoading] = useState(false);
  const [accionesError, setAccionesError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CatalogoAction.getInstrumentos();
      setRows(data);
    } catch (e: any) {
      setError(e.message ?? "Error cargando instrumentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const columns = useMemo<ColumnDef<InstrumentoDto>[]>(
    () => [
      { key: "codigo", header: "Código", sortable: true, width: 120 },
      { key: "nombre", header: "Nombre", sortable: true },
      { key: "nivel", header: "Nivel", width: 140 },
      { key: "horizonteTemporal", header: "Horizonte", width: 140 },
      {
        key: "estado",
        header: "Estado",
        sortable: true,
        width: 120,
        render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
      },
    ],
    []
  );

  const onView = (r: InstrumentoDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = (r: InstrumentoDto) => {
    setEditing(r);
    setSaveError(null);
    setForm({
      codigo: r.codigo,
      nombre: r.nombre,
      descripcion: r.descripcion ?? "",
      horizonteTemporal: r.horizonteTemporal ?? "",
      nivel: r.nivel ?? "",
      vigenciaDesde: toDateOnly(r.vigenciaDesde) || null,
      vigenciaHasta: toDateOnly(r.vigenciaHasta) || null,
      estado: r.estado ?? "ACTIVO",
      archivoDocumento: r.archivoDocumento ?? "",
      fechaAprobacion: toDateOnly(r.fechaAprobacion) || null,
      resolucionAprobacion: r.resolucionAprobacion ?? "",
    });
    setOpenEdit(true);
  };

  const save = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setSaveError(null);
      await CatalogoAction.updateInstrumento(editing.idInstrumento, form);
      setOpenEdit(false);
      await load();
    } catch (e: any) {
      setSaveError(e.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const openMenu = async (ev: React.MouseEvent<HTMLElement>, row: InstrumentoDto) => {
    setMenuAnchorEl(ev.currentTarget);
    setMenuRow(row);

    const id = row.idInstrumento;
    if (accionesByInstrumento[id]) return; // ya está en cache

    try {
      setAccionesLoading(true);
      setAccionesError(null);

      const acciones = await CatalogoAction.getInstrumentoAcciones(id, false);
      setAccionesByInstrumento((prev) => ({
        ...prev,
        [id]: sortAcciones(acciones ?? []),
      }));
    } catch (e: any) {
      setAccionesError(e.message ?? "Error cargando acciones");
    } finally {
      setAccionesLoading(false);
    }
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
    setAccionesError(null);
    setAccionesLoading(false);
  };

const onClickAccion = (a: InstrumentoAccionDto) => {
  closeMenu();

  // ✅ Regla: PDRC + OER => navegar a la página React (interna)
  const instCodigo = (menuRow?.codigo ?? "").trim().toUpperCase();
  const accionCodigo = (a.codigoAccion ?? "").trim().toUpperCase();
  const accionNombre = (a.nombre ?? "").trim().toUpperCase();

  if ((instCodigo === "PDRC" || instCodigo === "PRCD") && (accionCodigo === "OER" || accionNombre === "OER")) {
    // Ruta interna (frontend)
    window.location.href = `/pdrc/oer?returnTo=${encodeURIComponent("/catalogos/instrumentos")}`;
    return;
  }
  // ✅ Regla: PEI + OEI (o si backend lo manda como OER) => abrir página interna PEI
  if (
    instCodigo === "PEI" &&
    (accionCodigo === "OEI" || accionCodigo === "OER" || accionNombre === "OEI" || accionNombre === "OER")
  ) {
    window.location.href = `/pei/oei?returnTo=${encodeURIComponent("/catalogos/instrumentos")}`;
    return;
  }

  const url = (a.url ?? "").trim();
  if (!url) return;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  window.location.href = url;
};


  const currentAcciones =
    menuRow ? accionesByInstrumento[menuRow.idInstrumento] ?? [] : [];

  return (
    <>
      <CatalogoTablePage
        title="Catálogo: Instrumentos"
        subtitle="Visualiza y edita instrumentos (solo campos permitidos por backend)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idInstrumento}
        searchKeys={["codigo", "nombre", "nivel", "horizonteTemporal", "estado"]}
        onRefresh={load}
        allowEdit={true}
        onView={onView}
        onEdit={onEdit}
        renderRowActions={(row) => (
          <>
            <Tooltip title="Acciones">
              <span>
                <IconButton
                  size="small"
                  onClick={(ev) => openMenu(ev, row)}
                  disabled={loading}
                >
                  <MoreHorizRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      />

      {/* MENÚ 3 PUNTOS */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeMenu}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 260 } }}
      >
        {accionesLoading && (
          <MuiMenuItem disabled>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
                Cargando acciones…
              </Typography>
            </Box>
          </MuiMenuItem>
        )}

        {!accionesLoading && accionesError && (
          <MuiMenuItem disabled>
            <Typography sx={{ fontWeight: 800, fontSize: 13, color: "error.main" }}>
              {accionesError}
            </Typography>
          </MuiMenuItem>
        )}

        {!accionesLoading && !accionesError && currentAcciones.length === 0 && (
          <MuiMenuItem disabled>
            <Typography sx={{ fontWeight: 800, fontSize: 13, color: "text.secondary" }}>
              Sin acciones configuradas
            </Typography>
          </MuiMenuItem>
        )}

        {!accionesLoading &&
          !accionesError &&
          currentAcciones.map((a) => (
            <MenuItem key={a.idAccion} onClick={() => onClickAccion(a)}>
              <Box sx={{ display: "grid" }}>
                <Typography sx={{ fontWeight: 900, fontSize: 13.5 }}>
                  {a.nombre}
                </Typography>
                {(a.descripcion || a.codigoAccion) && (
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    {a.descripcion ?? a.codigoAccion}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))}
      </Menu>

      {/* VER */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle — Instrumento</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #EEF2F7",
                  bgcolor: "#FAFBFD",
                  display: "grid",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                    {viewRow.nombre}
                  </Typography>
                  <Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>
                </Box>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  {viewRow.descripcion ?? "—"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                <LabelValue label="Código" value={viewRow.codigo} />
                <LabelValue label="Nivel" value={viewRow.nivel} />
                <LabelValue label="Horizonte" value={viewRow.horizonteTemporal} />
                <LabelValue label="Vigencia desde" value={toDateOnly(viewRow.vigenciaDesde)} />
                <LabelValue label="Vigencia hasta" value={toDateOnly(viewRow.vigenciaHasta)} />
                <LabelValue label="Archivo" value={viewRow.archivoDocumento} />
                <LabelValue label="Fecha aprobación" value={toDateOnly(viewRow.fechaAprobacion)} />
                <LabelValue label="Resolución" value={viewRow.resolucionAprobacion} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* EDITAR */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 900 }}>Editar Instrumento</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {saveError && (
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  bgcolor: "rgba(239,68,68,.08)",
                  border: "1px solid rgba(239,68,68,.25)",
                }}
              >
                <Typography sx={{ fontWeight: 900, color: "error.main" }}>{saveError}</Typography>
              </Box>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 1.5 }}>
              <TextField label="Código" value={form.codigo} fullWidth disabled />
              <TextField
                label="Nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                fullWidth
              />
            </Box>

            <TextField
              label="Descripción"
              value={form.descripcion ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              fullWidth
              multiline
              minRows={3}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Nivel"
                value={form.nivel ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Horizonte temporal"
                value={form.horizonteTemporal ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, horizonteTemporal: e.target.value }))}
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

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Vigencia desde"
                type="date"
                value={form.vigenciaDesde ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, vigenciaDesde: e.target.value || null }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Vigencia hasta"
                type="date"
                value={form.vigenciaHasta ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, vigenciaHasta: e.target.value || null }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fecha aprobación"
                type="date"
                value={form.fechaAprobacion ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, fechaAprobacion: e.target.value || null }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <TextField
                label="Resolución aprobación"
                value={form.resolucionAprobacion ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, resolucionAprobacion: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Archivo documento"
                value={form.archivoDocumento ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, archivoDocumento: e.target.value }))}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? "Guardando..." : "Grabar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
