import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";

import CatalogoTablePage, { type ColumnDef } from "../../catalogos/components/CatalogoTablePage";
import { CatalogoAction } from "../../catalogos/CatalogoAction";
import { api } from "../../../shared/api";
import {
  PlaneamientoAction,
  type IndicadorListDto,
  type IndicadorInstrumentoCreateUpdateDto,
  type IndicadorInstrumentoListDto,
  type EjeEstrategicoListDto,
  type PoliticaListDto,
  type ObjetivoListDto,
  type AccionListDto,
} from "../PlaneamientoAction";

/** ===== Tipos para catálogos/planeamiento que no están en PlaneamientoAction.ts ===== */
type InstrumentoDto = {
  idInstrumento?: number; // camel
  IdInstrumento?: number; // Pascal
  codigo?: string | null;
  Codigo?: string | null;
  nombre?: string;
  Nombre?: string;
  estado?: string | null;
  Estado?: string | null;
};

type DimensionDto = {
  idDimension: number;
  codigo: string;
  nombre: string;
  estado: string;
};

type UnidadOrgDto = {
  idUnidadOrganizacional: number;
  codigo?: string | null;
  nombre: string;
  estado?: string | null;
};

type IntervencionListDto = {
  idIntervencion: number;
  idAccion: number;
  codigo: string;
  enunciado: string;
  orden?: number | null;
  estado: string;
  idObjetivo?: number | null;
  idPolitica?: number | null;
  idInstrumento?: number | null;
  idUnidadResponsable?: number | null;
  nombreAccion?: string | null;
  nombreObjetivo?: string | null;
  nombrePolitica?: string | null;
  nombreInstrumento?: string | null;
  nombreUnidadResponsable?: string | null;
};

type ResultadoListDto = {
  idResultado: number;
  codigo: string;
  descripcion: string;
  idInstrumento: number;
  idPolitica?: number | null;
  idObjetivo?: number | null;
  idAccion?: number | null;
  nombreInstrumento?: string | null;
  nombrePolitica?: string | null;
  nombreObjetivo?: string | null;
  nombreAccion?: string | null;
};

/** ===== UI helpers ===== */
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

/** ===== Picker Dialog reusable (inline) ===== */
type PickerColumnDef<T> = {
  key: keyof T | string;
  header: string;
  width?: number;
  render?: (row: T) => any;
};

type PickerDialogProps<T> = {
  open: boolean;
  title: string;
  subtitle?: string;
  rows: T[];
  columns: PickerColumnDef<T>[];
  getRowId: (row: T) => number | string;
  searchKeys: (keyof T | string)[];
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
      for (const k of searchKeys) {
        const v = (r as any)[k as any];
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
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { overflow: "visible" } }}
    >
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
          <Button
            variant="outlined"
            startIcon={<ClearRoundedIcon />}
            onClick={() => setQ("")}
            sx={{ whiteSpace: "nowrap" }}
          >
            Limpiar
          </Button>
        </Box>

        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={String(c.key)} sx={{ fontWeight: 1000, width: c.width }}>
                    {c.header}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 120 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((r) => (
                <TableRow key={String(getRowId(r))} hover>
                  {columns.map((c) => (
                    <TableCell key={String(c.key)}>
                      {c.render ? c.render(r) : String((r as any)[c.key] ?? "")}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <Button variant="contained" size="small" onClick={() => handleSelect(r)}>
                      Elegir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Typography color="text.secondary">Sin resultados.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
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

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

type PickMode =
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

export default function IndicadoresInstrumentosPage() {
  const [rows, setRows] = useState<IndicadorInstrumentoListDto[]>([]);
  const [indicadores, setIndicadores] = useState<IndicadorListDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<InstrumentoDto[]>([]);

  const [dimensiones, setDimensiones] = useState<DimensionDto[]>([]);
  const [unidades, setUnidades] = useState<UnidadOrgDto[]>([]);
  const [ejes, setEjes] = useState<EjeEstrategicoListDto[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaListDto[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoListDto[]>([]);
  const [acciones, setAcciones] = useState<AccionListDto[]>([]);
  const [intervenciones, setIntervenciones] = useState<IntervencionListDto[]>([]);
  const [resultados, setResultados] = useState<ResultadoListDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** VIEW */
  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<IndicadorInstrumentoListDto | null>(null);

  /** EDIT */
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<IndicadorInstrumentoListDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /** CREATE */
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

  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<IndicadorInstrumentoCreateUpdateDto>(emptyForm);

  const [form, setForm] = useState<IndicadorInstrumentoCreateUpdateDto>(emptyForm);

  /** Picker state */
  const [pickOpen, setPickOpen] = useState(false);
  const [pickMode, setPickMode] = useState<PickMode>("indicador");
  const [pickTarget, setPickTarget] = useState<PickTarget>("create");
  const [pickTitle, setPickTitle] = useState("");
  const [pickSubtitle, setPickSubtitle] = useState<string | undefined>(undefined);
  const [pickRows, setPickRows] = useState<any[]>([]);
  const [pickColumns, setPickColumns] = useState<PickerColumnDef<any>[]>([]);
  const [pickSearchKeys, setPickSearchKeys] = useState<(string)[]>([]);

  const normalizeInstrumentId = (x: InstrumentoDto): number =>
    (x.idInstrumento ?? x.IdInstrumento ?? 0) as number;

  const instrumentoLabel = (id: number) => {
    const x = instrumentos.find((a) => normalizeInstrumentId(a) === id);
    if (!x) return `#${id}`;
    const codigo = (x.codigo ?? x.Codigo ?? "") as string;
    const nombre = (x.nombre ?? x.Nombre ?? "") as string;
    return `${codigo ? `${codigo} - ` : ""}${nombre}`;
  };

  const indicadorLabel = (id: number) => {
    const x = indicadores.find((a) => a.idIndicador === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.nombre}`;
  };

  const dimensionLabel = (id?: number | null) => {
    if (!id) return "";
    const x = dimensiones.find((d) => d.idDimension === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.nombre}`;
  };

  const ejeLabel = (id?: number | null) => {
    if (!id) return "";
    const x = ejes.find((d) => d.idEje === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.nombre}`;
  };

  const politicaLabel = (id?: number | null) => {
    if (!id) return "";
    const x = politicas.find((d) => d.idPolitica === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.nombre}`;
  };

  const objetivoLabel = (id?: number | null) => {
    if (!id) return "";
    const x = objetivos.find((d) => d.idObjetivo === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.enunciado}`;
  };

  const accionLabel = (id?: number | null) => {
    if (!id) return "";
    const x = acciones.find((d) => d.idAccion === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.enunciado}`;
  };

  const intervencionLabel = (id?: number | null) => {
    if (!id) return "";
    const x = intervenciones.find((d) => d.idIntervencion === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.enunciado}`;
  };

  const resultadoLabel = (id?: number | null) => {
    if (!id) return "";
    const x = resultados.find((d) => d.idResultado === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.descripcion}`;
  };

  const unidadLabel = (id?: number | null) => {
    if (!id) return "";
    const x = unidades.find((d) => d.idUnidadOrganizacional === id);
    if (!x) return `#${id}`;
    return `${x.codigo ? `${x.codigo} - ` : ""}${x.nombre}`;
  };

  /** ===== Loads ===== */
  const loadBaseCatalogs = useCallback(async () => {
    // Dimensiones, Unidades, etc. (carga ligera)
    const [dims, unds] = await Promise.all([
      api.get<DimensionDto[]>("/api/dimensiones"),
      api.get<UnidadOrgDto[]>("/api/unidades-org?soloActivas=false"),
    ]);

    setDimensiones(dims ?? []);
    setUnidades(unds ?? []);
  }, []);

  const loadPlaneamientoCatalogs = useCallback(async () => {
    // Ejes/Políticas/Objetivos/Acciones (ya existen actions)
    const [e, p, o, a] = await Promise.all([
      PlaneamientoAction.getEjesEstrategicos(),
      PlaneamientoAction.getPoliticas(),
      PlaneamientoAction.getObjetivos(),
      PlaneamientoAction.getAcciones(),
    ]);

    setEjes(e ?? []);
    setPoliticas(p ?? []);
    setObjetivos(o ?? []);
    setAcciones(a ?? []);
  }, []);

  const loadOtherPlaneamiento = useCallback(async () => {
    const [ints, res] = await Promise.all([
      api.get<IntervencionListDto[]>("/api/IntervencionesPrioritarias"),
      api.get<ResultadoListDto[]>("/api/ResultadosConcertados"),
    ]);
    setIntervenciones(ints ?? []);
    setResultados(res ?? []);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, ind, inst] = await Promise.all([
        PlaneamientoAction.getIndicadoresInstrumentos(),
        PlaneamientoAction.getIndicadores(),
        CatalogoAction.getInstrumentos() as Promise<InstrumentoDto[]>,
      ]);

      // Mapas para “enriquecer” nombres sin depender del state (evita #id por timing)
      const indMap = new Map<number, string>();
      ind.forEach((x) => indMap.set(x.idIndicador, `${x.codigo ? `${x.codigo} - ` : ""}${x.nombre}`));

      const instMap = new Map<number, string>();
      (inst ?? []).forEach((x) => {
        const id = normalizeInstrumentId(x);
        const codigo = (x.codigo ?? x.Codigo ?? "") as string;
        const nombre = (x.nombre ?? x.Nombre ?? "") as string;
        instMap.set(id, `${codigo ? `${codigo} - ` : ""}${nombre}`);
      });

      const enriched = (data ?? []).map((r) => ({
        ...r,
        nombreIndicador: r.nombreIndicador ?? indMap.get(r.idIndicador) ?? `#${r.idIndicador}`,
        nombreInstrumento: r.nombreInstrumento ?? instMap.get(r.idInstrumento) ?? `#${r.idInstrumento}`,
      }));

      setRows(enriched);
      setIndicadores(ind ?? []);
      setInstrumentos(inst ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando Indicadores - Instrumentos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [loadBaseCatalogs, loadPlaneamientoCatalogs, loadOtherPlaneamiento]);

  useEffect(() => {
    // Carga de catálogos “once”
    (async () => {
      try {
        await Promise.allSettled([loadBaseCatalogs(), loadPlaneamientoCatalogs(), loadOtherPlaneamiento()]);
      } catch {
        // si algo falla aquí, igual dejaremos que el load principal muestre el error cuando toque
      } finally {
        await load();
      }
    })();
  }, [load, loadBaseCatalogs, loadPlaneamientoCatalogs, loadOtherPlaneamiento]);

  /** ===== Columns table ===== */
  const columns = useMemo<ColumnDef<IndicadorInstrumentoListDto>[]>(() => {
    return [
      { key: "idIndicadorInstrumento", header: "ID", width: 80 },
      { key: "nombreIndicador", header: "Indicador", sortable: true, width: 360 },
      { key: "nombreInstrumento", header: "Instrumento", sortable: true, width: 280 },
      { key: "codigoEnInstrumento", header: "Código en instrumento", width: 220 },
      { key: "orden", header: "Orden", width: 90 },
      {
        key: "esIndicadorPrincipal",
        header: "Principal",
        width: 110,
        render: (r) => (r.esIndicadorPrincipal ? "Sí" : "No"),
      },
      {
        key: "estado",
        header: "Estado",
        width: 110,
        render: (r) => <Box sx={pillSx(r.estado)}>{r.estado}</Box>,
      },
    ];
  }, []);

  /** ===== Open pick helper ===== */
  const openPicker = (mode: PickMode, target: PickTarget) => {
    setPickMode(mode);
    setPickTarget(target);

    if (mode === "indicador") {
      setPickTitle("Seleccionar Indicador");
      setPickSubtitle("Busca por código o nombre.");
      setPickRows(indicadores);
      setPickColumns([
        { key: "codigo", header: "Código", width: 150 },
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
        { key: "codigo", header: "Código", width: 150, render: (r: InstrumentoDto) => String(r.codigo ?? r.Codigo ?? "") },
        { key: "nombre", header: "Nombre", render: (r: InstrumentoDto) => String(r.nombre ?? r.Nombre ?? "") },
        { key: "estado", header: "Estado", width: 110, render: (r: InstrumentoDto) => String(r.estado ?? r.Estado ?? "") },
      ]);
      setPickSearchKeys(["codigo", "Codigo", "nombre", "Nombre", "estado", "Estado"]);
      setPickOpen(true);
      return;
    }

    // Para la cascada, filtramos según instrumento seleccionado (si aplica)
    const current = target === "create" ? createForm : form;
    const idInst = current.idInstrumento;

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
      setPickSearchKeys(["codigo", "nombre", "estado", "nombreEje", "nombreInstrumento", "nombreDimension"]);
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
      setPickSearchKeys(["codigo", "enunciado", "estado", "nombrePolitica", "nombreEje", "nombreInstrumento"]);
      setPickOpen(true);
      return;
    }

    if (mode === "accion") {
      let list = acciones;
      if (current.idObjetivo) list = list.filter((x) => x.idObjetivo === current.idObjetivo);
      else {
        // si no hay objetivo, intentamos filtrar por instrumento/política/eje
        if (idInst) list = list.filter((x) => (x.idInstrumento ?? null) === idInst || !x.idInstrumento);
        if (current.idPolitica) list = list.filter((x) => (x.idPolitica ?? null) === current.idPolitica || !x.idPolitica);
        if (current.idEje) list = list.filter((x) => (x.idEje ?? null) === current.idEje || !x.idEje);
      }

      setPickTitle("Seleccionar Acción Estratégica");
      setPickSubtitle("Tip: si eliges objetivo, el filtro será exacto.");
      setPickRows(list);
      setPickColumns([
        { key: "codigo", header: "Código", width: 140 },
        { key: "enunciado", header: "Enunciado" },
        { key: "estado", header: "Estado", width: 110 },
      ]);
      setPickSearchKeys(["codigo", "enunciado", "estado", "nombreObjetivo", "nombreInstrumento", "nombreUnidadResponsable"]);
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
      setPickSearchKeys(["codigo", "enunciado", "estado", "nombreAccion", "nombreObjetivo", "nombrePolitica", "nombreInstrumento"]);
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
      setPickSearchKeys(["codigo", "descripcion", "nombreInstrumento", "nombrePolitica", "nombreObjetivo", "nombreAccion"]);
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
    const setter = target === "create" ? setCreateForm : setForm;
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

  const clearCascadeAfterEje = (target: PickTarget) => {
    const setter = target === "create" ? setCreateForm : setForm;
    setter((p) => ({
      ...p,
      idPolitica: null,
      idObjetivo: null,
      idAccion: null,
      idIntervencion: null,
      idResultado: null,
      idUnidadResponsable: p.idUnidadResponsable ?? null,
    }));
  };

  const clearCascadeAfterPolitica = (target: PickTarget) => {
    const setter = target === "create" ? setCreateForm : setForm;
    setter((p) => ({
      ...p,
      idObjetivo: null,
      idAccion: null,
      idIntervencion: null,
      idResultado: null,
    }));
  };

  const clearCascadeAfterObjetivo = (target: PickTarget) => {
    const setter = target === "create" ? setCreateForm : setForm;
    setter((p) => ({
      ...p,
      idAccion: null,
      idIntervencion: null,
      idResultado: null,
    }));
  };

  const clearCascadeAfterAccion = (target: PickTarget) => {
    const setter = target === "create" ? setCreateForm : setForm;
    setter((p) => ({
      ...p,
      idIntervencion: null,
      idResultado: null,
    }));
  };

  /** ===== Handlers ===== */
  const onView = (r: IndicadorInstrumentoListDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = (r: IndicadorInstrumentoListDto) => {
    setSaveError(null);
    setEditing(r);

    setForm({
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
      esIndicadorPrincipal: !!r.esIndicadorPrincipal,
      observaciones: r.observaciones ?? "",
      estado: r.estado ?? "ACTIVO",
    });

    setOpenEdit(true);
  };

  const onNew = () => {
    setCreateError(null);
    setCreateForm(emptyForm);
    setOpenCreate(true);
  };

  const requiredOk = form.idIndicador > 0 && form.idInstrumento > 0;
  const requiredCreateOk = createForm.idIndicador > 0 && createForm.idInstrumento > 0;

  const save = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setSaveError(null);

      await PlaneamientoAction.updateIndicadoresInstrumentos(editing.idIndicadorInstrumento, form);

      setOpenEdit(false);
      await load();
    } catch (e: any) {
      setSaveError(e?.message ?? "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const create = async () => {
    try {
      setCreating(true);
      setCreateError(null);

      await PlaneamientoAction.createIndicadoresInstrumentos(createForm);

      setOpenCreate(false);
      await load();
    } catch (e: any) {
      setCreateError(e?.message ?? "No se pudo registrar");
    } finally {
      setCreating(false);
    }
  };

  /** ===== Render: shared form section ===== */
  const renderRelacionForm = (target: PickTarget) => {
    const data = target === "create" ? createForm : form;
    const setter = target === "create" ? setCreateForm : setForm;

    return (
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <SectionTitle title="Relación base" subtitle="Selecciona Indicador e Instrumento con buscador (no combo gigante)." />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Indicador"
            value={data.idIndicador ? indicadorLabel(data.idIndicador) : ""}
            placeholder="Seleccione un indicador…"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Button
            variant="outlined"
            startIcon={<SearchRoundedIcon />}
            onClick={() => openPicker("indicador", target)}
            sx={{ whiteSpace: "nowrap" }}
          >
            Buscar
          </Button>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Instrumento"
            value={data.idInstrumento ? instrumentoLabel(data.idInstrumento) : ""}
            placeholder="Seleccione un instrumento…"
            fullWidth
            InputLabelProps={{ shrink: true }}
            InputProps={{ readOnly: true }}
          />
          <Button
            variant="outlined"
            startIcon={<SearchRoundedIcon />}
            onClick={() => openPicker("instrumento", target)}
            sx={{ whiteSpace: "nowrap" }}
          >
            Buscar
          </Button>
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
            onChange={(e) =>
              setter((p) => ({ ...p, orden: e.target.value === "" ? null : Number(e.target.value) }))
            }
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
          subtitle="Selecciona valores jerárquicos. Si cambias instrumento/eje/política/objetivo/acción, se limpiará lo que ya no aplica."
        />

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
                  (target === "create" ? setCreateError : setSaveError)("Primero selecciona un instrumento.");
                  return;
                }
                openPicker("eje", target);
              }}
            >
              Buscar
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setter((p) => ({ ...p, idEje: null }));
                clearCascadeAfterEje(target);
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

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
                  (target === "create" ? setCreateError : setSaveError)("Primero selecciona un instrumento.");
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
                clearCascadeAfterPolitica(target);
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

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
                  (target === "create" ? setCreateError : setSaveError)("Primero selecciona un instrumento.");
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
                clearCascadeAfterObjetivo(target);
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

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
                  (target === "create" ? setCreateError : setSaveError)("Primero selecciona un instrumento.");
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
                clearCascadeAfterAccion(target);
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Box>

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
                (target === "create" ? setCreateError : setSaveError)("Primero selecciona un instrumento.");
                return;
              }
              openPicker("intervencion", target);
            }}
          >
            Buscar
          </Button>
        </Box>

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
                (target === "create" ? setCreateError : setSaveError)("Primero selecciona un instrumento.");
                return;
              }
              openPicker("resultado", target);
            }}
          >
            Buscar
          </Button>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
          <TextField
            label="Unidad Responsable"
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

  /** ===== Picker select handler ===== */
  const handlePick = (row: any) => {
    const setter = pickTarget === "create" ? setCreateForm : setForm;

    if (pickMode === "indicador") {
      setter((p) => ({ ...p, idIndicador: row.idIndicador }));
      return;
    }

    if (pickMode === "instrumento") {
      const id = normalizeInstrumentId(row as InstrumentoDto);
      setter((p) => ({ ...p, idInstrumento: id }));
      clearCascadeAfterInstrumento(pickTarget);
      return;
    }

    if (pickMode === "dimension") {
      setter((p) => ({ ...p, idDimension: row.idDimension }));
      return;
    }

    if (pickMode === "eje") {
      const r = row as EjeEstrategicoListDto;
      setter((p) => ({
        ...p,
        idInstrumento: r.idInstrumento ?? p.idInstrumento,
        idEje: r.idEje,
        // si el eje ya trae nombreDimension, normalmente también trae idDimension en detail;
        // aquí lo dejamos solo si el form ya lo tenía.
      }));
      clearCascadeAfterEje(pickTarget);
      return;
    }

    if (pickMode === "politica") {
      const r = row as PoliticaListDto;
      setter((p) => ({
        ...p,
        idInstrumento: r.idInstrumento ?? p.idInstrumento,
        idEje: r.idEje ?? p.idEje ?? null,
        idPolitica: r.idPolitica,
      }));
      clearCascadeAfterPolitica(pickTarget);
      return;
    }

    if (pickMode === "objetivo") {
      const r = row as ObjetivoListDto;
      setter((p) => ({
        ...p,
        idInstrumento: r.idInstrumento ?? p.idInstrumento,
        idEje: r.idEje ?? p.idEje ?? null,
        idPolitica: r.idPolitica ?? p.idPolitica ?? null,
        idObjetivo: r.idObjetivo,
        idUnidadResponsable: r.idUnidadResponsable ?? p.idUnidadResponsable ?? null,
      }));
      clearCascadeAfterObjetivo(pickTarget);
      return;
    }

    if (pickMode === "accion") {
      const r = row as AccionListDto;
      setter((p) => ({
        ...p,
        idObjetivo: r.idObjetivo ?? p.idObjetivo ?? null,
        idAccion: r.idAccion,
        idUnidadResponsable: r.idUnidadResponsable ?? p.idUnidadResponsable ?? null,
        // si vienen ids opcionales, los usamos
        idInstrumento: r.idInstrumento ?? p.idInstrumento,
        idPolitica: r.idPolitica ?? p.idPolitica ?? null,
        idEje: r.idEje ?? p.idEje ?? null,
      }));
      clearCascadeAfterAccion(pickTarget);
      return;
    }

    if (pickMode === "intervencion") {
      const r = row as IntervencionListDto;
      setter((p) => ({
        ...p,
        idInstrumento: r.idInstrumento ?? p.idInstrumento,
        idPolitica: r.idPolitica ?? p.idPolitica ?? null,
        idObjetivo: r.idObjetivo ?? p.idObjetivo ?? null,
        idAccion: r.idAccion ?? p.idAccion ?? null,
        idIntervencion: r.idIntervencion,
        idUnidadResponsable: r.idUnidadResponsable ?? p.idUnidadResponsable ?? null,
      }));
      return;
    }

    if (pickMode === "resultado") {
      const r = row as ResultadoListDto;
      setter((p) => ({
        ...p,
        idInstrumento: r.idInstrumento ?? p.idInstrumento,
        idPolitica: r.idPolitica ?? p.idPolitica ?? null,
        idObjetivo: r.idObjetivo ?? p.idObjetivo ?? null,
        idAccion: r.idAccion ?? p.idAccion ?? null,
        idResultado: r.idResultado,
      }));
      return;
    }

    if (pickMode === "unidad") {
      const r = row as UnidadOrgDto;
      setter((p) => ({ ...p, idUnidadResponsable: r.idUnidadOrganizacional }));
      return;
    }
  };

  /** ===== UI ===== */
  return (
    <>
      <CatalogoTablePage
        title="Planeamiento: Indicadores - Instrumentos"
        subtitle="Relación del indicador con el instrumento. Esto alimenta las Metas."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idIndicadorInstrumento}
        searchKeys={["nombreIndicador", "nombreInstrumento", "codigoEnInstrumento", "estado"]}
        onRefresh={load}
        allowEdit
        onView={onView}
        onEdit={onEdit}
        onNew={onNew}
        newLabel="Nuevo"
      />

      {/* VIEW */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="md" PaperProps={{ sx: { overflow: "visible" } }}>
        <DialogTitle sx={{ fontWeight: 1000 }}>Detalle</DialogTitle>
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

      {/* EDIT */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md" PaperProps={{ sx: { overflow: "visible" } }}>
        <DialogTitle sx={{ fontWeight: 1000, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Editar
          <IconButton onClick={() => setOpenEdit(false)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {renderRelacionForm("edit")}
          {saveError ? <Typography sx={{ mt: 1.5, color: "error.main", fontWeight: 900 }}>{saveError}</Typography> : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} variant="contained" disabled={!requiredOk || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CREATE */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md" PaperProps={{ sx: { overflow: "visible" } }}>
        <DialogTitle sx={{ fontWeight: 1000, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Nuevo Indicador - Instrumento
          <IconButton onClick={() => setOpenCreate(false)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {renderRelacionForm("create")}
          {createError ? <Typography sx={{ mt: 1.5, color: "error.main", fontWeight: 900 }}>{createError}</Typography> : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>Cancelar</Button>
          <Button onClick={create} variant="contained" disabled={!requiredCreateOk || creating}>
            {creating ? "Registrando..." : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PICKER */}
      <PickerDialog
        open={pickOpen}
        title={pickTitle}
        subtitle={pickSubtitle}
        rows={pickRows}
        columns={pickColumns}
        searchKeys={pickSearchKeys as any}
        getRowId={(r: any) =>
          r.idIndicador ??
          (r.idInstrumento ?? r.IdInstrumento) ??
          r.idDimension ??
          r.idEje ??
          r.idPolitica ??
          r.idObjetivo ??
          r.idAccion ??
          r.idIntervencion ??
          r.idResultado ??
          r.idUnidadOrganizacional ??
          "row"
        }
        onClose={() => setPickOpen(false)}
        onSelect={(r: any) => handlePick(r)}
      />
    </>
  );
}