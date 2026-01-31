import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { api } from "../../../shared/api";
import { CatalogoAction, type DimensionDto, type InstrumentoDto } from "../../catalogos/CatalogoAction";
import {
  PlaneamientoAction,
  type IndicadorListDto,
  type IndicadorInstrumentoListDto,
  type IndicadorInstrumentoCreateUpdateDto,
  type EjeEstrategicoListDto,
  type PoliticaListDto,
  type ObjetivoListDto,
  type AccionListDto,
  type IntervencionListDto,
  type ResultadoListDto,
  type UnidadOrgDto,
} from "../PlaneamientoAction";

/** ========= Helpers (sin any) ========= */
type AnyRow = Record<string, unknown>;

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Ocurrió un error inesperado.";
}

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

function LabelValue({ label, value }: { label: string; value?: ReactNode }) {
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

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box sx={{ mt: 0.5 }}>
      <Typography sx={{ fontWeight: 1000 }}>{title}</Typography>
      {subtitle ? (
        <Typography sx={{ mt: 0.25, fontSize: 12.5, color: "text.secondary", fontWeight: 700 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}

/** ========= Picker reusable (sin any) ========= */
type PickerMode =
  | "indicador"
  | "instrumento"
  | "dimension"
  | "eje"
  | "politica"
  | "objetivo"
  | "accion"
  | "intervencion"
  | "resultado"
  | "unidad";

type PickTarget = "create" | "edit";

type PickerColumnDef<T> = {
  key: string;
  header: string;
  width?: number;
  render?: (row: T) => ReactNode;
};

type PickerDialogProps<T> = {
  open: boolean;
  title: string;
  subtitle?: string;
  rows: T[];
  columns: PickerColumnDef<T>[];
  getRowId: (row: T) => number | string;
  searchKeys: string[];
  onClose: () => void;
  onSelect: (row: T) => void;
};

function PickerDialog<T>({
  open,
  title,
  subtitle,
  rows,
  columns,
  getRowId,
  searchKeys,
  onClose,
  onSelect,
}: PickerDialogProps<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) => {
      const rec = r as unknown as AnyRow;
      for (const k of searchKeys) {
        const v = rec[k];
        if (v === null || v === undefined) continue;
        if (String(v).toLowerCase().includes(term)) return true;
      }
      return false;
    });
  }, [q, rows, searchKeys]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleClose = () => {
    setQ("");
    setPage(0);
    setRowsPerPage(10);
    onClose();
  };

  const handleSelect = (r: T) => {
    onSelect(r);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" PaperProps={{ sx: { overflow: "visible" } }}>
      <DialogTitle
        sx={{
          fontWeight: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 1000, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.25, fontSize: 12.5, color: "text.secondary", fontWeight: 700 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center" }}>
          <TextField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar… (código, nombre, etc.)"
            fullWidth
            size="small"
          />
          <Button variant="outlined" startIcon={<ClearRoundedIcon />} onClick={() => setQ("")} sx={{ whiteSpace: "nowrap" }}>
            Limpiar
          </Button>
        </Box>

        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={c.key} sx={{ fontWeight: 1000, width: c.width }}>
                    {c.header}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 1000, width: 110 }}>Acción</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paged.map((r) => {
                const rec = r as unknown as AnyRow;
                return (
                  <TableRow key={String(getRowId(r))} hover>
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {c.render ? c.render(r) : (rec[c.key] as ReactNode)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="contained" size="small" onClick={() => handleSelect(r)}>
                        Seleccionar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Box sx={{ py: 4, textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 900 }}>Sin resultados</Typography>
                      <Typography sx={{ color: "text.secondary" }}>Prueba con otro criterio de búsqueda.</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/** ========= Page ========= */
export default function IndicadoresInstrumentosPage() {
  /** ===== Catálogos base ===== */
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadorListDto[]>([]);
  const [dimensiones, setDimensiones] = useState<DimensionDto[]>([]);

  const [ejes, setEjes] = useState<EjeEstrategicoListDto[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaListDto[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoListDto[]>([]);
  const [acciones, setAcciones] = useState<AccionListDto[]>([]);
  const [intervenciones, setIntervenciones] = useState<IntervencionListDto[]>([]);
  const [resultados, setResultados] = useState<ResultadoListDto[]>([]);
  const [unidades, setUnidades] = useState<UnidadOrgDto[]>([]);

  /** ===== UI maestro ===== */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [qMaster, setQMaster] = useState("");
  const [pageMaster, setPageMaster] = useState(0);
  const [rppMaster, setRppMaster] = useState(10);

  /** ===== Expand / detail ===== */
  const [expandedInstrumentoId, setExpandedInstrumentoId] = useState<number | null>(null);
  const [qDetail, setQDetail] = useState("");

  const [detailByInstrumento, setDetailByInstrumento] = useState<Record<number, IndicadorInstrumentoListDto[]>>({});
  const [detailLoadingByInstrumento, setDetailLoadingByInstrumento] = useState<Record<number, boolean>>({});
  const [detailErrorByInstrumento, setDetailErrorByInstrumento] = useState<Record<number, string | null>>({});

  /** ===== dialogs (view/edit/create) ===== */
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<IndicadorInstrumentoListDto | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [editingRow, setEditingRow] = useState<IndicadorInstrumentoListDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /** ===== Picker state ===== */
  const [pickOpen, setPickOpen] = useState(false);
  const [pickMode, setPickMode] = useState<PickerMode>("indicador");
  const [pickTarget, setPickTarget] = useState<PickTarget>("create");
  const [pickTitle, setPickTitle] = useState("");
  const [pickSubtitle, setPickSubtitle] = useState<string | undefined>(undefined);
  const [pickRows, setPickRows] = useState<unknown[]>([]);
  const [pickColumns, setPickColumns] = useState<PickerColumnDef<unknown>[]>([]);
  const [pickSearchKeys, setPickSearchKeys] = useState<string[]>([]);

  /** ===== Form models (create/edit) ===== */
  const emptyForm: IndicadorInstrumentoCreateUpdateDto = {
    idIndicador: 0,
    idInstrumento: 0,
    codigoEnInstrumento: "",
    idDimension: null,
    idEje: null,
    idPolitica: null,
    idObjetivo: null,
    idAccion: null,
    idResultado: null,
    idIntervencion: null,
    idUnidadResponsable: null,
    orden: null,
    esIndicadorPrincipal: false,
    observaciones: "",
    estado: "ACTIVO",
  };

  const [formEdit, setFormEdit] = useState<IndicadorInstrumentoCreateUpdateDto>(emptyForm);
  const [formCreate, setFormCreate] = useState<IndicadorInstrumentoCreateUpdateDto>(emptyForm);

  /** Si agregas/edita desde un instrumento, se bloquea la selección en el modal */
  const [lockedInstrumentoId, setLockedInstrumentoId] = useState<number | null>(null);

  /** ===== labels ===== */
  const instrumentoLabel = useCallback(
    (id: number): string => {
      const it = instrumentos.find((x) => x.idInstrumento === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.nombre}`;
    },
    [instrumentos]
  );

  const indicadorLabel = useCallback(
    (id: number): string => {
      const it = indicadores.find((x) => x.idIndicador === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.nombre}`;
    },
    [indicadores]
  );

  const dimensionLabel = useCallback(
    (id?: number | null): string => {
      if (!id) return "";
      const it = dimensiones.find((x) => x.idDimension === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.nombre}`;
    },
    [dimensiones]
  );

  const ejeLabel = useCallback(
    (id?: number | null): string => {
      if (!id) return "";
      const it = ejes.find((x) => x.idEje === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.nombre}`;
    },
    [ejes]
  );

  const politicaLabel = useCallback(
    (id?: number | null): string => {
      if (!id) return "";
      const it = politicas.find((x) => x.idPolitica === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.nombre}`;
    },
    [politicas]
  );

  const objetivoLabel = useCallback(
    (id?: number | null): string => {
      if (!id) return "";
      const it = objetivos.find((x) => x.idObjetivo === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.enunciado}`;
    },
    [objetivos]
  );

  const accionLabel = useCallback(
    (id?: number | null): string => {
      if (!id) return "";
      const it = acciones.find((x) => x.idAccion === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.enunciado}`;
    },
    [acciones]
  );

  const intervencionLabel = useCallback(
    (id?: number | null): string => {
      if (!id) return "";
      const it = intervenciones.find((x) => x.idIntervencion === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.enunciado}`;
    },
    [intervenciones]
  );

  const resultadoLabel = useCallback(
    (id?: number | null): string => {
      if (!id) return "";
      const it = resultados.find((x) => x.idResultado === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.descripcion}`;
    },
    [resultados]
  );

  const unidadLabel = useCallback(
    (id?: number | null): string => {
      if (!id) return "";
      const it = unidades.find((x) => x.idUnidadOrganizacional === id);
      if (!it) return `#${id}`;
      return `${it.codigo ? `${it.codigo} - ` : ""}${it.nombre}`;
    },
    [unidades]
  );

  /** ===== API: detalle por instrumento ===== */
  const fetchDetalleInstrumento = useCallback(async (idInstrumento: number) => {
    // Ajusta la ruta si tu backend usa otra
    return api.get<IndicadorInstrumentoListDto[]>(`/api/indicadoresinstrumentos/instrumento/${idInstrumento}`);
  }, []);

  const loadDetalleInstrumento = useCallback(
    async (idInstrumento: number, force = false) => {
      if (!idInstrumento) return;
      if (!force && detailByInstrumento[idInstrumento]) return;

      setDetailLoadingByInstrumento((p) => ({ ...p, [idInstrumento]: true }));
      setDetailErrorByInstrumento((p) => ({ ...p, [idInstrumento]: null }));

      try {
        const data = (await fetchDetalleInstrumento(idInstrumento)) ?? [];

        // Enriquecer nombres si no vienen del backend
        const enriched = data.map((r) => ({
          ...r,
          nombreIndicador: r.nombreIndicador ?? indicadorLabel(r.idIndicador),
          nombreInstrumento: r.nombreInstrumento ?? instrumentoLabel(r.idInstrumento),
        }));

        setDetailByInstrumento((p) => ({ ...p, [idInstrumento]: enriched }));
      } catch (e: unknown) {
        setDetailByInstrumento((p) => ({ ...p, [idInstrumento]: [] }));
        setDetailErrorByInstrumento((p) => ({ ...p, [idInstrumento]: getErrorMessage(e) }));
      } finally {
        setDetailLoadingByInstrumento((p) => ({ ...p, [idInstrumento]: false }));
      }
    },
    [detailByInstrumento, fetchDetalleInstrumento, indicadorLabel, instrumentoLabel]
  );

  /** ===== Load base ===== */
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        inst,
        inds,
        dims,
        e,
        p,
        o,
        a,
        ints,
        res,
        unds,
      ] = await Promise.all([
        CatalogoAction.getInstrumentos(),
        PlaneamientoAction.getIndicadores(),
        CatalogoAction.getDimensiones(),
        PlaneamientoAction.getEjesEstrategicos(),
        PlaneamientoAction.getPoliticas(),
        PlaneamientoAction.getObjetivos(),
        PlaneamientoAction.getAcciones(),
        PlaneamientoAction.getIntervenciones(),
        PlaneamientoAction.getResultados(),
        PlaneamientoAction.getUnidadesOrg(),
      ]);

      setInstrumentos(inst ?? []);
      setIndicadores(inds ?? []);
      setDimensiones(dims ?? []);
      setEjes(e ?? []);
      setPoliticas(p ?? []);
      setObjetivos(o ?? []);
      setAcciones(a ?? []);
      setIntervenciones(ints ?? []);
      setResultados(res ?? []);
      setUnidades(unds ?? []);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  /** ===== master list ===== */
  const instrumentosFiltered = useMemo(() => {
    const term = qMaster.trim().toLowerCase();
    if (!term) return instrumentos;

    return instrumentos.filter((x) => {
      const a = x.codigo.toLowerCase();
      const b = x.nombre.toLowerCase();
      const c = (x.nivel ?? "").toLowerCase();
      const d = (x.horizonteTemporal ?? "").toLowerCase();
      return a.includes(term) || b.includes(term) || c.includes(term) || d.includes(term);
    });
  }, [instrumentos, qMaster]);

  const instrumentosPaged = useMemo(() => {
    const start = pageMaster * rppMaster;
    return instrumentosFiltered.slice(start, start + rppMaster);
  }, [instrumentosFiltered, pageMaster, rppMaster]);

  /** ===== detail rows for expanded ===== */
  const detailRows = useMemo(() => {
    if (!expandedInstrumentoId) return [];
    const base = detailByInstrumento[expandedInstrumentoId] ?? [];
    const term = qDetail.trim().toLowerCase();
    if (!term) return base;

    return base.filter((r) => {
      const a = String(r.nombreIndicador ?? "").toLowerCase();
      const b = String(r.codigoEnInstrumento ?? "").toLowerCase();
      const c = String(r.estado ?? "").toLowerCase();
      return a.includes(term) || b.includes(term) || c.includes(term);
    });
  }, [expandedInstrumentoId, detailByInstrumento, qDetail]);

  /** ===== expand handler ===== */
  const toggleExpand = async (idInstrumento: number) => {
    if (expandedInstrumentoId === idInstrumento) {
      setExpandedInstrumentoId(null);
      setQDetail("");
      return;
    }
    setExpandedInstrumentoId(idInstrumento);
    setQDetail("");
    await loadDetalleInstrumento(idInstrumento);
  };

  /** ===== pickers ===== */
  const openPicker = (mode: PickerMode, target: PickTarget) => {
    setPickMode(mode);
    setPickTarget(target);

    if (mode === "indicador") {
      setPickTitle("Seleccionar Indicador");
      setPickSubtitle("Busca por código o nombre.");
      setPickRows(indicadores);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "nombre", header: "Nombre" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "nombre", "estado"]);
      setPickOpen(true);
      return;
    }

    if (mode === "instrumento") {
      setPickTitle("Seleccionar Instrumento");
      setPickSubtitle("Busca por código o nombre.");
      setPickRows(instrumentos);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "nombre", header: "Nombre" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "nombre", "estado", "nivel", "horizonteTemporal"]);
      setPickOpen(true);
      return;
    }

    if (mode === "dimension") {
      setPickTitle("Seleccionar Dimensión");
      setPickRows(dimensiones);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "nombre", header: "Nombre" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "nombre", "estado"]);
      setPickOpen(true);
      return;
    }

    // filtros contextuales (para ejes/políticas/objetivos/acciones/intervenciones/resultados)
    const current = target === "create" ? formCreate : formEdit;
    const idInst = current.idInstrumento;

    if (mode === "eje") {
      const list = idInst ? ejes.filter((x) => x.idInstrumento === idInst) : ejes;
      setPickTitle("Seleccionar Eje Estratégico");
      setPickSubtitle(idInst ? `Filtrado por instrumento #${idInst}` : undefined);
      setPickRows(list);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "nombre", header: "Nombre" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "nombre", "estado", "nombreInstrumento", "nombreDimension"]);
      setPickOpen(true);
      return;
    }

    if (mode === "politica") {
      let list = politicas;
      if (idInst) list = list.filter((x) => x.idInstrumento === idInst);
      if (current.idEje) list = list.filter((x) => (x.idEje ?? null) === current.idEje);
      setPickTitle("Seleccionar Política");
      setPickSubtitle("Tip: selecciona instrumento y/o eje para filtrar.");
      setPickRows(list);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "nombre", header: "Nombre" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "nombre", "estado", "nombreEje", "nombreInstrumento"]);
      setPickOpen(true);
      return;
    }

    if (mode === "objetivo") {
      let list = objetivos;
      if (idInst) list = list.filter((x) => x.idInstrumento === idInst);
      if (current.idPolitica) list = list.filter((x) => (x.idPolitica ?? null) === current.idPolitica);
      if (current.idEje) list = list.filter((x) => (x.idEje ?? null) === current.idEje);
      setPickTitle("Seleccionar Objetivo Estratégico");
      setPickSubtitle("Tip: selecciona política/eje para filtrar.");
      setPickRows(list);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "enunciado", header: "Enunciado" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "enunciado", "estado", "nombrePolitica", "nombreEje"]);
      setPickOpen(true);
      return;
    }

    if (mode === "accion") {
      let list = acciones;
      if (current.idObjetivo) {
        list = list.filter((x) => x.idObjetivo === current.idObjetivo);
      } else {
        if (idInst) list = list.filter((x) => (x.idInstrumento ?? null) === idInst || x.idInstrumento === null);
        if (current.idPolitica) list = list.filter((x) => (x.idPolitica ?? null) === current.idPolitica || x.idPolitica === null);
        if (current.idEje) list = list.filter((x) => (x.idEje ?? null) === current.idEje || x.idEje === null);
      }
      setPickTitle("Seleccionar Acción Estratégica");
      setPickSubtitle("Tip: si eliges objetivo, el filtro será exacto.");
      setPickRows(list);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "enunciado", header: "Enunciado" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "enunciado", "estado", "nombreObjetivo", "nombreInstrumento"]);
      setPickOpen(true);
      return;
    }

    if (mode === "intervencion") {
      let list = intervenciones;
      if (current.idAccion) list = list.filter((x) => x.idAccion === current.idAccion);
      else if (idInst) list = list.filter((x) => (x.idInstrumento ?? null) === idInst);
      setPickTitle("Seleccionar Intervención Prioritaria");
      setPickSubtitle("Tip: selecciona acción para filtrar exacto.");
      setPickRows(list);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "enunciado", header: "Enunciado" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "enunciado", "estado", "nombreAccion", "nombreInstrumento"]);
      setPickOpen(true);
      return;
    }

    if (mode === "resultado") {
      let list = resultados;
      if (current.idAccion) list = list.filter((x) => (x.idAccion ?? null) === current.idAccion);
      else if (idInst) list = list.filter((x) => x.idInstrumento === idInst);
      setPickTitle("Seleccionar Resultado Concertado");
      setPickSubtitle("Tip: si seleccionas acción, filtras mejor.");
      setPickRows(list);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "descripcion", header: "Descripción" },
      ]);
      setPickSearchKeys(["codigo", "descripcion", "nombreInstrumento", "nombreAccion"]);
      setPickOpen(true);
      return;
    }

    if (mode === "unidad") {
      setPickTitle("Seleccionar Unidad Responsable");
      setPickRows(unidades);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "nombre", header: "Nombre" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "nombre", "estado"]);
      setPickOpen(true);
      return;
    }
  };

  const clearCascadeAfterInstrumento = (target: PickTarget) => {
    const setter = target === "create" ? setFormCreate : setFormEdit;
    setter((p) => ({
      ...p,
      idDimension: null,
      idEje: null,
      idPolitica: null,
      idObjetivo: null,
      idAccion: null,
      idIntervencion: null,
      idResultado: null,
      idUnidadResponsable: null,
    }));
  };

  const clearAfterEje = (target: PickTarget) => {
    const setter = target === "create" ? setFormCreate : setFormEdit;
    setter((p) => ({
      ...p,
      idPolitica: null,
      idObjetivo: null,
      idAccion: null,
      idIntervencion: null,
      idResultado: null,
    }));
  };

  const clearAfterPolitica = (target: PickTarget) => {
    const setter = target === "create" ? setFormCreate : setFormEdit;
    setter((p) => ({
      ...p,
      idObjetivo: null,
      idAccion: null,
      idIntervencion: null,
      idResultado: null,
    }));
  };

  const clearAfterObjetivo = (target: PickTarget) => {
    const setter = target === "create" ? setFormCreate : setFormEdit;
    setter((p) => ({
      ...p,
      idAccion: null,
      idIntervencion: null,
      idResultado: null,
    }));
  };

  const clearAfterAccion = (target: PickTarget) => {
    const setter = target === "create" ? setFormCreate : setFormEdit;
    setter((p) => ({
      ...p,
      idIntervencion: null,
      idResultado: null,
    }));
  };

  const handlePick = (row: unknown) => {
    const setter = pickTarget === "create" ? setFormCreate : setFormEdit;

    switch (pickMode) {
      case "indicador": {
        const r = row as IndicadorListDto;
        setter((p) => ({ ...p, idIndicador: r.idIndicador }));
        return;
      }
      case "instrumento": {
        const r = row as InstrumentoDto;
        setter((p) => ({ ...p, idInstrumento: r.idInstrumento }));
        clearCascadeAfterInstrumento(pickTarget);
        return;
      }
      case "dimension": {
        const r = row as DimensionDto;
        setter((p) => ({ ...p, idDimension: r.idDimension }));
        return;
      }
      case "eje": {
        const r = row as EjeEstrategicoListDto;
        setter((p) => ({ ...p, idEje: r.idEje, idInstrumento: r.idInstrumento }));
        clearAfterEje(pickTarget);
        return;
      }
      case "politica": {
        const r = row as PoliticaListDto;
        setter((p) => ({
          ...p,
          idPolitica: r.idPolitica,
          idInstrumento: r.idInstrumento,
          idEje: r.idEje ?? p.idEje ?? null,
        }));
        clearAfterPolitica(pickTarget);
        return;
      }
      case "objetivo": {
        const r = row as ObjetivoListDto;
        setter((p) => ({
          ...p,
          idObjetivo: r.idObjetivo,
          idInstrumento: r.idInstrumento,
          idEje: r.idEje ?? p.idEje ?? null,
          idPolitica: r.idPolitica ?? p.idPolitica ?? null,
          idUnidadResponsable: r.idUnidadResponsable ?? p.idUnidadResponsable ?? null,
        }));
        clearAfterObjetivo(pickTarget);
        return;
      }
      case "accion": {
        const r = row as AccionListDto;
        setter((p) => ({
          ...p,
          idAccion: r.idAccion,
          idObjetivo: r.idObjetivo ?? p.idObjetivo ?? null,
          idUnidadResponsable: r.idUnidadResponsable ?? p.idUnidadResponsable ?? null,
          idInstrumento: r.idInstrumento ?? p.idInstrumento,
          idPolitica: r.idPolitica ?? p.idPolitica ?? null,
          idEje: r.idEje ?? p.idEje ?? null,
        }));
        clearAfterAccion(pickTarget);
        return;
      }
      case "intervencion": {
        const r = row as IntervencionListDto;
        setter((p) => ({
          ...p,
          idIntervencion: r.idIntervencion,
          idAccion: r.idAccion ?? p.idAccion ?? null,
          idObjetivo: r.idObjetivo ?? p.idObjetivo ?? null,
          idPolitica: r.idPolitica ?? p.idPolitica ?? null,
          idInstrumento: r.idInstrumento ?? p.idInstrumento,
          idUnidadResponsable: r.idUnidadResponsable ?? p.idUnidadResponsable ?? null,
        }));
        return;
      }
      case "resultado": {
        const r = row as ResultadoListDto;
        setter((p) => ({
          ...p,
          idResultado: r.idResultado,
          idAccion: r.idAccion ?? p.idAccion ?? null,
          idObjetivo: r.idObjetivo ?? p.idObjetivo ?? null,
          idPolitica: r.idPolitica ?? p.idPolitica ?? null,
          idInstrumento: r.idInstrumento,
        }));
        return;
      }
case "unidad": {
  const r = row as UnidadOrgDto;
  setter((p) => ({ ...p, idUnidadResponsable: r.idUnidadOrganizacional }));
  setPickOpen(false);
  return;
}

    }
  };

  /** ===== modal open/close ===== */
  const openViewDialog = (r: IndicadorInstrumentoListDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const openEditDialog = (r: IndicadorInstrumentoListDto) => {
    setSaveError(null);
    setEditingRow(r);
    setLockedInstrumentoId(r.idInstrumento);

    setFormEdit({
      idIndicador: r.idIndicador,
      idInstrumento: r.idInstrumento,
      codigoEnInstrumento: r.codigoEnInstrumento ?? "",
      idDimension: r.idDimension ?? null,
      idEje: r.idEje ?? null,
      idPolitica: r.idPolitica ?? null,
      idObjetivo: r.idObjetivo ?? null,
      idAccion: r.idAccion ?? null,
      idResultado: r.idResultado ?? null,
      idIntervencion: r.idIntervencion ?? null,
      idUnidadResponsable: r.idUnidadResponsable ?? null,
      orden: r.orden ?? null,
      esIndicadorPrincipal: r.esIndicadorPrincipal,
      observaciones: r.observaciones ?? "",
      estado: r.estado,
    });

    setOpenEdit(true);
  };

  const openCreateGlobal = () => {
    setCreateError(null);
    setLockedInstrumentoId(null);
    setFormCreate(emptyForm);
    setOpenCreate(true);
  };

  const openCreateForInstrumento = async (idInstrumento: number) => {
    setCreateError(null);
    setLockedInstrumentoId(idInstrumento);
    setFormCreate({ ...emptyForm, idInstrumento, estado: "ACTIVO" });
    setOpenCreate(true);
    await loadDetalleInstrumento(idInstrumento);
  };

  /** ===== save/create ===== */
  const canSaveEdit = formEdit.idIndicador > 0 && formEdit.idInstrumento > 0;
  const canCreate = formCreate.idIndicador > 0 && formCreate.idInstrumento > 0;

  const saveEdit = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updateIndicadoresInstrumentos(editingRow.idIndicadorInstrumento, formEdit);

      setOpenEdit(false);
      setEditingRow(null);
      setLockedInstrumentoId(null);

      await loadDetalleInstrumento(formEdit.idInstrumento, true);
    } catch (e: unknown) {
      setSaveError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      await PlaneamientoAction.createIndicadoresInstrumentos(formCreate);

      const instId = formCreate.idInstrumento;

      setOpenCreate(false);
      setLockedInstrumentoId(null);

      await loadDetalleInstrumento(instId, true);
      setExpandedInstrumentoId(instId);
    } catch (e: unknown) {
      setCreateError(getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const setFormError = (target: PickTarget, msg: string) => {
  if (target === "create") setCreateError(msg);
  else setSaveError(msg);
};

  /** ===== form renderer ===== */
  const renderForm = (target: PickTarget) => {
    const data = target === "create" ? formCreate : formEdit;
    const setter = target === "create" ? setFormCreate : setFormEdit;

    const isLockedInstrument = lockedInstrumentoId !== null && lockedInstrumentoId === data.idInstrumento;

    return (
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <SectionTitle title="Relación base" subtitle="Selecciona Indicador e Instrumento (si está bloqueado, es porque vienes desde un Instrumento)." />

        {/* Indicador */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Indicador"
            value={data.idIndicador ? indicadorLabel(data.idIndicador) : ""}
            placeholder="Seleccione un indicador…"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Button variant="outlined" startIcon={<SearchRoundedIcon />} onClick={() => openPicker("indicador", target)} sx={{ whiteSpace: "nowrap" }}>
            Buscar
          </Button>
        </Box>

        {/* Instrumento */}
        <Box sx={{ display: "grid", gridTemplateColumns: isLockedInstrument ? "1fr" : "1fr auto", gap: 1 }}>
          <TextField
            label="Instrumento"
            value={data.idInstrumento ? instrumentoLabel(data.idInstrumento) : ""}
            placeholder="Seleccione un instrumento…"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
            helperText={isLockedInstrument ? "Instrumento fijado por selección." : undefined}
          />
          {!isLockedInstrument ? (
            <Button variant="outlined" startIcon={<SearchRoundedIcon />} onClick={() => openPicker("instrumento", target)} sx={{ whiteSpace: "nowrap" }}>
              Buscar
            </Button>
          ) : null}
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 1.5 }}>
          <TextField
            label="Código en instrumento"
            value={data.codigoEnInstrumento ?? ""}
            onChange={(e) => setter((p) => ({ ...p, codigoEnInstrumento: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Orden"
            type="number"
            value={data.orden ?? ""}
            onChange={(e) => setter((p) => ({ ...p, orden: e.target.value === "" ? null : Number(e.target.value) }))}
            fullWidth
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <TextField
            label="Indicador principal"
            select
            value={data.esIndicadorPrincipal ? "1" : "0"}
            onChange={(e) => setter((p) => ({ ...p, esIndicadorPrincipal: e.target.value === "1" }))}
            fullWidth
          >
            <MenuItem value="1">Sí</MenuItem>
            <MenuItem value="0">No</MenuItem>
          </TextField>

          <TextField
            label="Estado"
            select
            value={data.estado}
            onChange={(e) => setter((p) => ({ ...p, estado: e.target.value }))}
            fullWidth
          >
            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
            <MenuItem value="INACTIVO">INACTIVO</MenuItem>
          </TextField>
        </Box>

        <TextField
          label="Observaciones"
          value={data.observaciones ?? ""}
          onChange={(e) => setter((p) => ({ ...p, observaciones: e.target.value }))}
          fullWidth
          multiline
          minRows={2}
        />

        <Divider sx={{ my: 0.5 }} />

        <SectionTitle
          title="Ubicación en Planeamiento (opcional)"
          subtitle="Si cambias Instrumento/Eje/Política/Objetivo/Acción, se limpia lo que ya no aplica."
        />

        {/* Dimensión */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Dimensión"
            value={dimensionLabel(data.idDimension)}
            placeholder="—"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Button variant="outlined" startIcon={<SearchRoundedIcon />} onClick={() => openPicker("dimension", target)}>
            Buscar
          </Button>
        </Box>

        {/* Eje */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Eje"
            value={ejeLabel(data.idEje)}
            placeholder="—"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SearchRoundedIcon />}
              onClick={() => {
                if (!data.idInstrumento) {
                  setFormError(target, "Primero selecciona un instrumento.");
                  return;
                }
                openPicker("eje",target);
              }}

            >
              Buscar
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setter((p) => ({ ...p, idEje: null }));
                clearAfterEje(target);
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

        {/* Política */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Política"
            value={politicaLabel(data.idPolitica)}
            placeholder="—"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SearchRoundedIcon />}
            onClick={() => {
              if (!data.idInstrumento) {
                setFormError(target, "Primero selecciona un instrumento.");
                return;
              }
              openPicker("politica", target);
            }}

            >
              Buscar
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setter((p) => ({ ...p, idPolitica: null }));
                clearAfterPolitica(target);
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

        {/* Objetivo */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Objetivo"
            value={objetivoLabel(data.idObjetivo)}
            placeholder="—"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SearchRoundedIcon />}
            onClick={() => {
              if (!data.idInstrumento) {
                setFormError(target, "Primero selecciona un instrumento.");
                return;
              }
              openPicker("objetivo", target);
            }}

            >
              Buscar
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setter((p) => ({ ...p, idObjetivo: null }));
                clearAfterObjetivo(target);
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

        {/* Acción */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Acción"
            value={accionLabel(data.idAccion)}
            placeholder="—"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SearchRoundedIcon />}
              onClick={() => {
                if (!data.idInstrumento) {
                  setFormError(target, "Primero selecciona un instrumento.");
                  return;
                }
                openPicker("accion", target);
              }}

            >
              Buscar
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setter((p) => ({ ...p, idAccion: null }));
                clearAfterAccion(target);
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

        {/* Intervención */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Intervención"
            value={intervencionLabel(data.idIntervencion)}
            placeholder="—"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Button
            variant="outlined"
            startIcon={<SearchRoundedIcon />}
            onClick={() => {
              if (!data.idInstrumento) {
                setFormError(target, "Primero selecciona un instrumento.");
                return;
              }
              openPicker("intervencion", target);
            }}

          >
            Buscar
          </Button>
        </Box>

        {/* Resultado */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Resultado"
            value={resultadoLabel(data.idResultado)}
            placeholder="—"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Button
            variant="outlined"
            startIcon={<SearchRoundedIcon />}
            onClick={() => {
              if (!data.idInstrumento) {
                setFormError(target, "Primero selecciona un instrumento.");
                return;
              }
              openPicker("resultado", target);
            }}

          >
            Buscar
          </Button>
        </Box>

        {/* Unidad responsable */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Unidad responsable"
            value={unidadLabel(data.idUnidadResponsable)}
            placeholder="—"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Button variant="outlined" startIcon={<SearchRoundedIcon />} onClick={() => openPicker("unidad", target)}>
            Buscar
          </Button>
        </Box>
      </Box>
    );
  };

  /** ===== UI ===== */
  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 1000 }}>
          Planeamiento: Indicadores por Instrumento
        </Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.25 }}>
          Maestro: Instrumentos. Expande un instrumento para gestionar sus indicadores.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #EEF2F7", overflow: "hidden" }}>
        <Toolbar sx={{ gap: 1.5, px: 2 }}>
          <TextField
            value={qMaster}
            onChange={(e) => {
              setQMaster(e.target.value);
              setPageMaster(0);
            }}
            size="small"
            placeholder="Buscar instrumento (código / nombre / nivel / horizonte)..."
            sx={{ width: { xs: "100%", sm: 540 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flex: 1 }} />

          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreateGlobal}>
            Asignar indicador
          </Button>

          <Tooltip title="Refrescar todo">
            <span>
              <IconButton onClick={() => void loadAll()} disabled={loading}>
                <RefreshRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Chip label={`${instrumentosFiltered.length} instrumentos`} variant="outlined" sx={{ borderRadius: 999 }} />
        </Toolbar>

        {loading ? <LinearProgress /> : null}

        {error ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography sx={{ color: "error.main", fontWeight: 900 }}>{error}</Typography>
            <Button onClick={() => void loadAll()} variant="contained" sx={{ mt: 1 }}>
              Reintentar
            </Button>
          </Box>
        ) : null}

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 52, bgcolor: "#FAFBFD" }} />
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 140 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD" }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 160 }}>Nivel</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 160 }}>Horizonte</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 120 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 240 }}>Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {instrumentosPaged.map((inst) => {
                const idInst = inst.idInstrumento;
                const isOpen = expandedInstrumentoId === idInst;

                const detLoading = !!detailLoadingByInstrumento[idInst];
                const detErr = detailErrorByInstrumento[idInst];
                const count = (detailByInstrumento[idInst]?.length ?? 0);

                return (
                  <React.Fragment key={idInst}>
                    <TableRow hover sx={{ "& > td": { borderBottom: "none" } }}>
                      <TableCell>
                        <IconButton size="small" onClick={() => void toggleExpand(idInst)}>
                          {isOpen ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                        </IconButton>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900 }}>{inst.codigo}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{inst.nombre}</TableCell>
                      <TableCell>{inst.nivel ?? "—"}</TableCell>
                      <TableCell>{inst.horizonteTemporal ?? "—"}</TableCell>
                      <TableCell>
                        <Box sx={pillSx(inst.estado)}>{inst.estado}</Box>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                          <Chip label={`${count} indicadores`} size="small" variant="outlined" sx={{ borderRadius: 999 }} />
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => void openCreateForInstrumento(idInst)}
                          >
                            Agregar
                          </Button>

                          <Tooltip title="Refrescar detalle">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => void loadDetalleInstrumento(idInst, true)}
                                disabled={detLoading}
                              >
                                <RefreshRoundedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 0, borderBottom: "1px solid", borderColor: "divider" }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 2, py: 2, bgcolor: "#FBFCFE" }}>
                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1.5 }}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 1000 }}>
                                  Indicadores del instrumento: {inst.codigo} - {inst.nombre}
                                </Typography>
                                <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 700 }}>
                                  Administra (ver/editar/agregar) sin salir del instrumento.
                                </Typography>
                              </Box>

                              <Box sx={{ flex: 1 }} />

                              <TextField
                                value={qDetail}
                                onChange={(e) => setQDetail(e.target.value)}
                                size="small"
                                placeholder="Buscar en indicadores..."
                                sx={{ width: { xs: "100%", sm: 340 } }}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchRoundedIcon fontSize="small" />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Box>

                            {detLoading ? <LinearProgress sx={{ mb: 1.25 }} /> : null}

                            {detErr ? (
                              <Box sx={{ mb: 1.25 }}>
                                <Typography sx={{ color: "error.main", fontWeight: 900 }}>{detErr}</Typography>
                                <Button variant="contained" onClick={() => void loadDetalleInstrumento(idInst, true)} sx={{ mt: 1 }}>
                                  Reintentar
                                </Button>
                              </Box>
                            ) : null}

                            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 90 }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD" }}>Indicador</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 220 }}>Código en instrumento</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 90 }}>Orden</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 110 }}>Principal</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 110 }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 1000, bgcolor: "#FAFBFD", width: 140 }}>Acción</TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {detailRows.map((r) => (
                                    <TableRow key={r.idIndicadorInstrumento} hover>
                                      <TableCell>{r.idIndicadorInstrumento}</TableCell>
                                      <TableCell sx={{ fontWeight: 800 }}>
                                        {r.nombreIndicador ?? indicadorLabel(r.idIndicador)}
                                      </TableCell>
                                      <TableCell>{r.codigoEnInstrumento ?? "—"}</TableCell>
                                      <TableCell>{r.orden ?? "—"}</TableCell>
                                      <TableCell>{r.esIndicadorPrincipal ? "Sí" : "No"}</TableCell>
                                      <TableCell>
                                        <Box sx={pillSx(r.estado)}>{r.estado}</Box>
                                      </TableCell>
                                      <TableCell>
                                        <Tooltip title="Ver">
                                          <IconButton size="small" onClick={() => openViewDialog(r)}>
                                            <VisibilityRoundedIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Editar">
                                          <IconButton size="small" onClick={() => openEditDialog(r)}>
                                            <EditRoundedIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </TableCell>
                                    </TableRow>
                                  ))}

                                  {!detLoading && !detErr && detailRows.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={7}>
                                        <Box sx={{ py: 3, textAlign: "center" }}>
                                          <Typography sx={{ fontWeight: 1000 }}>Sin indicadores</Typography>
                                          <Typography sx={{ color: "text.secondary" }}>
                                            Usa “Agregar” para asignar un indicador a este instrumento.
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}

              {!loading && !error && instrumentosPaged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 1000, mb: 0.5 }}>Sin resultados</Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        Ajusta tu búsqueda de instrumentos.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={instrumentosFiltered.length}
            page={pageMaster}
            onPageChange={(_, p) => setPageMaster(p)}
            rowsPerPage={rppMaster}
            onRowsPerPageChange={(e) => {
              setRppMaster(parseInt(e.target.value, 10));
              setPageMaster(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </TableContainer>
      </Paper>

      {/* ===== VIEW ===== */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md" PaperProps={{ sx: { overflow: "visible" } }}>
        <DialogTitle sx={{ fontWeight: 1000, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Detalle
          <IconButton onClick={() => setOpenView(false)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow ? (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              <LabelValue label="ID" value={viewRow.idIndicadorInstrumento} />
              <LabelValue label="Estado" value={<Box sx={pillSx(viewRow.estado)}>{viewRow.estado}</Box>} />
              <LabelValue label="Orden" value={viewRow.orden ?? "—"} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Indicador" value={viewRow.nombreIndicador ?? indicadorLabel(viewRow.idIndicador)} />
              </Box>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Instrumento" value={viewRow.nombreInstrumento ?? instrumentoLabel(viewRow.idInstrumento)} />
              </Box>

              <LabelValue label="Código en instrumento" value={viewRow.codigoEnInstrumento ?? "—"} />
              <LabelValue label="Principal" value={viewRow.esIndicadorPrincipal ? "Sí" : "No"} />
              <LabelValue label="Unidad responsable" value={viewRow.idUnidadResponsable ? unidadLabel(viewRow.idUnidadResponsable) : "—"} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Dimensión" value={viewRow.idDimension ? dimensionLabel(viewRow.idDimension) : "—"} />
              </Box>

              <LabelValue label="Eje" value={viewRow.idEje ? ejeLabel(viewRow.idEje) : "—"} />
              <LabelValue label="Política" value={viewRow.idPolitica ? politicaLabel(viewRow.idPolitica) : "—"} />
              <LabelValue label="Objetivo" value={viewRow.idObjetivo ? objetivoLabel(viewRow.idObjetivo) : "—"} />

              <LabelValue label="Acción" value={viewRow.idAccion ? accionLabel(viewRow.idAccion) : "—"} />
              <LabelValue label="Intervención" value={viewRow.idIntervencion ? intervencionLabel(viewRow.idIntervencion) : "—"} />
              <LabelValue label="Resultado" value={viewRow.idResultado ? resultadoLabel(viewRow.idResultado) : "—"} />

              <Box sx={{ gridColumn: "1 / -1" }}>
                <LabelValue label="Observaciones" value={viewRow.observaciones ?? "—"} />
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

      {/* ===== EDIT ===== */}
      <Dialog
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setLockedInstrumentoId(null);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { overflow: "visible" } }}
      >
        <DialogTitle sx={{ fontWeight: 1000, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Editar
          <IconButton
            onClick={() => {
              setOpenEdit(false);
              setLockedInstrumentoId(null);
            }}
            size="small"
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {renderForm("edit")}
          {saveError ? (
            <Typography sx={{ mt: 1.5, color: "error.main", fontWeight: 900 }}>
              {saveError}
            </Typography>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setOpenEdit(false);
              setLockedInstrumentoId(null);
            }}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={() => void saveEdit()} variant="contained" disabled={!canSaveEdit || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== CREATE ===== */}
      <Dialog
        open={openCreate}
        onClose={() => {
          setOpenCreate(false);
          setLockedInstrumentoId(null);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { overflow: "visible" } }}
      >
        <DialogTitle sx={{ fontWeight: 1000, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Nuevo Indicador - Instrumento
          <IconButton
            onClick={() => {
              setOpenCreate(false);
              setLockedInstrumentoId(null);
            }}
            size="small"
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {renderForm("create")}
          {createError ? (
            <Typography sx={{ mt: 1.5, color: "error.main", fontWeight: 900 }}>
              {createError}
            </Typography>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => {
              setOpenCreate(false);
              setLockedInstrumentoId(null);
            }}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button onClick={() => void create()} variant="contained" disabled={!canCreate || creating}>
            {creating ? "Registrando..." : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== PICKER ===== */}
      <PickerDialog
        open={pickOpen}
        title={pickTitle}
        subtitle={pickSubtitle}
        rows={pickRows}
        columns={pickColumns}
        searchKeys={pickSearchKeys}
        getRowId={(r) => {
          const rec = r as unknown as AnyRow;
          return (
            (rec["idIndicador"] as number | undefined) ??
            (rec["idInstrumento"] as number | undefined) ??
            (rec["idDimension"] as number | undefined) ??
            (rec["idEje"] as number | undefined) ??
            (rec["idPolitica"] as number | undefined) ??
            (rec["idObjetivo"] as number | undefined) ??
            (rec["idAccion"] as number | undefined) ??
            (rec["idIntervencion"] as number | undefined) ??
            (rec["idResultado"] as number | undefined) ??
            (rec["idUnidadOrganizacional"] as number | undefined) ??
            "row"
          );
        }}
        onClose={() => setPickOpen(false)}
        onSelect={(r) => handlePick(r)}
      />
    </>
  );
}
