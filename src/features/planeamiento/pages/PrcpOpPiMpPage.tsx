import React, { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, Chip, CircularProgress, Collapse, Divider, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import { useNavigate } from "react-router-dom";
import { PrcpOpPiMpVistaAction, type PrcpObjetivoPrioritarioDto, type PrcpPeriodoDto, type PrcpOpPiMpDetailDto, type PrcpOpPiMpMasterDto, type PrcpUnidadOrgDto } from "../PrcpOpPiMpVistaAction";
import PrcpIndicadorDetalleModal from "../components/PrcpIndicadorDetalleModal";

type DetailState = { loading: boolean; data: PrcpOpPiMpDetailDto[]; error?: string; };
type IndicadorModalState = { open: boolean; idPrcpOpPiMp: number; idIndicadorNombre: number; codigoIndicador: string; nombreIndicador: string; objetivoPrioritario?: string | null; problemaIdentificado?: string | null; medidaPolitica?: string | null; };
function safeText(value?: string | null): string { const txt = (value ?? "").toString().trim(); return txt.length === 0 ? "—" : txt; }
const comboSx = { "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.96)" } } as const;

export default function PrcpOpPiMpPage(): React.ReactElement {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingTabla, setLoadingTabla] = useState(false);
  const [loadingObjetivos, setLoadingObjetivos] = useState(false);
  const [periodos, setPeriodos] = useState<PrcpPeriodoDto[]>([]);
  const [unidades, setUnidades] = useState<PrcpUnidadOrgDto[]>([]);
  const [objetivos, setObjetivos] = useState<PrcpObjetivoPrioritarioDto[]>([]);
  const [idPeriodoSel, setIdPeriodoSel] = useState(0);
  const [idUnidadSel, setIdUnidadSel] = useState(0);
  const [idObjetivoSel, setIdObjetivoSel] = useState(0);
  const [rows, setRows] = useState<PrcpOpPiMpMasterDto[]>([]);
  const [qSearch, setQSearch] = useState("");
  const [openRowMap, setOpenRowMap] = useState<Record<number, boolean>>({});
  const [detailMap, setDetailMap] = useState<Record<number, DetailState>>({});
  const [indicadorModal, setIndicadorModal] = useState<IndicadorModalState>({ open: false, idPrcpOpPiMp: 0, idIndicadorNombre: 0, codigoIndicador: "", nombreIndicador: "", objetivoPrioritario: "", problemaIdentificado: "", medidaPolitica: "" });

  const periodoSelectedObj = useMemo(() => periodos.find((x) => x.idPeriodo === idPeriodoSel) ?? null, [periodos, idPeriodoSel]);
  const unidadSelectedObj = useMemo(() => unidades.find((x) => x.idUnidad === idUnidadSel) ?? null, [unidades, idUnidadSel]);
  const objetivoSelectedObj = useMemo(() => objetivos.find((x) => x.idObjetivoPrioritario === idObjetivoSel) ?? null, [objetivos, idObjetivoSel]);
  const rowsFiltered = useMemo(() => { const q = qSearch.trim().toLowerCase(); if (!q) return rows; return rows.filter((r) => `${r.codigoObjetivoPrioritario ?? ""} ${r.descripcionObjetivoPrioritario ?? ""} ${r.codigoProblemaIdentificado ?? ""} ${r.descripcionProblemaIdentificado ?? ""} ${r.codigoMedidaPolitica ?? ""} ${r.descripcionMedidaPolitica ?? ""}`.toLowerCase().includes(q)); }, [rows, qSearch]);
  const piCount = useMemo(() => new Set(rows.map((x) => x.idProblemaIdentificado)).size, [rows]);
  const mpCount = useMemo(() => new Set(rows.map((x) => x.idMedidaPolitica)).size, [rows]);

  const filterByTexto = <T extends { codigo: string | null; descripcion?: string | null; nombre?: string | null }>(options: readonly T[], inputValue: string): T[] => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options.slice() as T[];
    return options.filter((o) => `${o.codigo ?? ""} ${o.descripcion ?? ""} ${o.nombre ?? ""}`.toLowerCase().includes(q)) as T[];
  };

  async function loadCombos() {
    setLoading(true);
    try {
      const [periodosDb, unidadesDb] = await Promise.all([PrcpOpPiMpVistaAction.getPeriodos(), PrcpOpPiMpVistaAction.getUnidadesOrganizacionales()]);
      setPeriodos(periodosDb ?? []); setUnidades(unidadesDb ?? []);
      setIdPeriodoSel(periodosDb?.[0]?.idPeriodo ?? 0); setIdUnidadSel(unidadesDb?.[0]?.idUnidad ?? 0);
    } finally { setLoading(false); }
  }

  async function loadObjetivos(idPeriodo: number, idUnidad: number) {
    if (!idPeriodo || !idUnidad) { setObjetivos([]); setIdObjetivoSel(0); return; }
    setLoadingObjetivos(true);
    try {
      const data = await PrcpOpPiMpVistaAction.getObjetivosPrioritarios(idPeriodo, idUnidad);
      setObjetivos(data ?? []);
      setIdObjetivoSel((current) => (data?.some((x) => x.idObjetivoPrioritario === current) ? current : data?.[0]?.idObjetivoPrioritario ?? 0));
    } finally { setLoadingObjetivos(false); }
  }

  async function loadTabla(idPeriodo: number, idUnidad: number, idObjetivo: number) {
    if (!idPeriodo || !idUnidad || !idObjetivo) { setRows([]); setOpenRowMap({}); setDetailMap({}); return; }
    setLoadingTabla(true);
    try { const data = await PrcpOpPiMpVistaAction.getMaster(idPeriodo, idUnidad, idObjetivo); setRows(data ?? []); setOpenRowMap({}); setDetailMap({}); }
    finally { setLoadingTabla(false); }
  }

  async function toggleRowDetail(r: PrcpOpPiMpMasterDto) {
    const idKey = r.idPrcpOpPiMp;
    setOpenRowMap((prev) => ({ ...prev, [idKey]: !prev[idKey] }));
    if (detailMap[idKey]?.data?.length || detailMap[idKey]?.loading) return;
    try {
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: true, data: [] } }));
      const data = await PrcpOpPiMpVistaAction.getDetail(idKey);
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: data ?? [] } }));
    } catch (e) {
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: [], error: e instanceof Error ? e.message : "No se pudo cargar el detalle." } }));
    }
  }

  function openIndicadorModal(row: PrcpOpPiMpMasterDto, indicador: PrcpOpPiMpDetailDto) {
    setIndicadorModal({ open: true, idPrcpOpPiMp: row.idPrcpOpPiMp, idIndicadorNombre: indicador.idIndicadorNombre, codigoIndicador: indicador.codigoIndicador, nombreIndicador: indicador.nombreIndicador, objetivoPrioritario: `${safeText(row.codigoObjetivoPrioritario)} - ${safeText(row.descripcionObjetivoPrioritario)}`, problemaIdentificado: `${safeText(row.codigoProblemaIdentificado)} - ${safeText(row.descripcionProblemaIdentificado)}`, medidaPolitica: `${safeText(row.codigoMedidaPolitica)} - ${safeText(row.descripcionMedidaPolitica)}` });
  }

  useEffect(() => { void loadCombos(); }, []);
  useEffect(() => { if (!loading && idPeriodoSel && idUnidadSel) void loadObjetivos(idPeriodoSel, idUnidadSel); }, [loading, idPeriodoSel, idUnidadSel]);
  useEffect(() => { if (!loading && idPeriodoSel && idUnidadSel && idObjetivoSel) void loadTabla(idPeriodoSel, idUnidadSel, idObjetivoSel); }, [loading, idPeriodoSel, idUnidadSel, idObjetivoSel]);

  if (loading) return <Box sx={{ p: 3 }}><Stack direction="row" spacing={1.5} alignItems="center"><CircularProgress size={22} /><Typography>Cargando...</Typography></Stack></Box>;
  const sxStickyActionHeader = { position: "sticky" as const, right: 0, zIndex: 3, bgcolor: "background.paper", boxShadow: "-8px 0 12px rgba(0,0,0,.05)" };
  const sxStickyActionCell = { position: "sticky" as const, right: 0, zIndex: 2, bgcolor: "background.paper", boxShadow: "-8px 0 12px rgba(0,0,0,.05)" };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center"><IconButton onClick={() => navigate(-1)}><ArrowBackRoundedIcon /></IconButton><Box><Typography variant="h5" sx={{ fontWeight: 800 }}>P.R.C.P.: OP / PI / MP</Typography><Typography variant="body2" color="text.secondary">Vista por Periodo, Unidad Organizacional y Objetivo Prioritario</Typography></Box></Stack>
        <Stack direction="row" spacing={1} alignItems="center"><Chip label={`PI: ${piCount}`} variant="outlined" /><Chip label={`MP: ${mpCount}`} variant="outlined" /><Chip label={`Registros: ${rows.length}`} variant="outlined" /><Tooltip title="Refrescar"><IconButton onClick={() => void loadTabla(idPeriodoSel, idUnidadSel, idObjetivoSel)}><RefreshRoundedIcon /></IconButton></Tooltip></Stack>
      </Stack>

      <Paper sx={{ mt: 2, p: 2, borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "0 10px 30px rgba(0,0,0,.06)" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ width: "100%", mb: 2 }}>
          <Autocomplete options={periodos} value={periodoSelectedObj} onChange={(_e, v) => setIdPeriodoSel(v?.idPeriodo ?? 0)} getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.descripcion ?? "—"}`} isOptionEqualToValue={(o, v) => o.idPeriodo === v.idPeriodo} filterOptions={(options, state) => filterByTexto(options, state.inputValue)} renderInput={(params) => <TextField {...params} label="Periodo" size="small" />} sx={{ flex: 1, ...comboSx }} />
          <Autocomplete options={unidades} value={unidadSelectedObj} onChange={(_e, v) => setIdUnidadSel(v?.idUnidad ?? 0)} getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`} isOptionEqualToValue={(o, v) => o.idUnidad === v.idUnidad} filterOptions={(options, state) => filterByTexto(options, state.inputValue)} renderInput={(params) => <TextField {...params} label="Unidad Orgánica" size="small" />} sx={{ flex: 1, ...comboSx }} />
        </Stack>
        <Autocomplete options={objetivos} value={objetivoSelectedObj} loading={loadingObjetivos} onChange={(_e, v) => setIdObjetivoSel(v?.idObjetivoPrioritario ?? 0)} getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.descripcion ?? "—"}`} isOptionEqualToValue={(o, v) => o.idObjetivoPrioritario === v.idObjetivoPrioritario} filterOptions={(options, state) => filterByTexto(options, state.inputValue)} renderInput={(params) => <TextField {...params} label="Objetivo Prioritario" size="small" />} sx={{ width: "100%", ...comboSx }} />
        <Divider sx={{ my: 2 }} />
        <TextField value={qSearch} onChange={(e) => setQSearch(e.target.value)} placeholder="Buscar por objetivo prioritario, problema identificado o medida política..." fullWidth size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }} />
      </Paper>

      <TableContainer sx={{ mt: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Table size="small">
          <TableHead><TableRow><TableCell sx={{ width: 88 }} /><TableCell sx={{ fontWeight: 900, width: 170 }}>Código PI</TableCell><TableCell sx={{ fontWeight: 900 }}>Descripción PI</TableCell><TableCell sx={{ fontWeight: 900, width: 170 }}>Código MP</TableCell><TableCell sx={{ fontWeight: 900 }}>Descripción MP</TableCell><TableCell sx={{ fontWeight: 900, width: 150, ...sxStickyActionHeader }} align="right">Acción</TableCell></TableRow></TableHead>
          <TableBody>
            {loadingTabla ? <TableRow><TableCell colSpan={6}><Stack direction="row" spacing={1.5} alignItems="center"><CircularProgress size={18} /><Typography variant="body2">Cargando registros...</Typography></Stack></TableCell></TableRow> : rowsFiltered.length === 0 ? <TableRow><TableCell colSpan={6}><Alert severity="info" sx={{ borderRadius: 2, width: "100%" }}>No hay registros para la combinación seleccionada.</Alert></TableCell></TableRow> : rowsFiltered.map((r) => {
              const open = !!openRowMap[r.idPrcpOpPiMp]; const detail = detailMap[r.idPrcpOpPiMp]; const indicadoresCount = r.cantidadIndicadores ?? 0;
              return <React.Fragment key={r.idPrcpOpPiMp}><TableRow hover>
                <TableCell sx={{ width: 88, verticalAlign: "middle", py: 1.5 }}><Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ minHeight: 56 }}><Tooltip title={open ? "Ocultar detalle" : "Ver detalle"}><IconButton size="small" onClick={() => void toggleRowDetail(r)} sx={{ width: 30, height: 30, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>{open ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20 }} /> : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />}</IconButton></Tooltip><Chip size="small" variant="outlined" label={`IND:${indicadoresCount}`} sx={{ height: 20, borderRadius: 2, fontWeight: 900 }} /></Stack></TableCell>
                <TableCell sx={{ fontWeight: 900 }}>{safeText(r.codigoProblemaIdentificado)}</TableCell><TableCell>{safeText(r.descripcionProblemaIdentificado)}</TableCell><TableCell sx={{ fontWeight: 900 }}>{safeText(r.codigoMedidaPolitica)}</TableCell><TableCell>{safeText(r.descripcionMedidaPolitica)}</TableCell>
                <TableCell align="right" sx={{ width: 150, ...sxStickyActionCell }}><Tooltip title={open ? "Ocultar detalle" : "Ver detalle"}><IconButton size="small" onClick={() => void toggleRowDetail(r)} sx={{ width: 30, height: 30, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "rgba(59,130,246,.10)" }}><VisibilityOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip></TableCell>
              </TableRow>
              <TableRow><TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}><Collapse in={open} timeout="auto" unmountOnExit><Box sx={{ p: 2, bgcolor: "background.default" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Detalle Indicadores</Typography>
                {detail?.loading ? <Stack direction="row" spacing={1.5} alignItems="center"><CircularProgress size={18} /><Typography variant="body2">Cargando detalle...</Typography></Stack> : detail?.error ? <Alert severity="warning" sx={{ borderRadius: 2 }}>{detail.error}</Alert> : !detail?.data?.length ? <Alert severity="info" sx={{ borderRadius: 2 }}>No hay indicadores registrados para este registro.</Alert> : <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}><Table size="small"><TableHead><TableRow><TableCell sx={{ fontWeight: 900, width: 180 }}>Código Indicador</TableCell><TableCell sx={{ fontWeight: 900 }}>Nombre Indicador</TableCell><TableCell align="right" sx={{ fontWeight: 900, width: 120 }}>Acción</TableCell></TableRow></TableHead><TableBody>{detail.data.map((d) => <TableRow key={d.idIndicadorNombre} hover><TableCell sx={{ fontWeight: 900 }}>{d.codigoIndicador}</TableCell><TableCell>{d.nombreIndicador}</TableCell><TableCell align="right"><Tooltip title="Ver indicador"><IconButton size="small" onClick={() => openIndicadorModal(r, d)} sx={{ width: 30, height: 30, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "rgba(59,130,246,.10)" }}><PolicyRoundedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip></TableCell></TableRow>)}</TableBody></Table></TableContainer>}
              </Box></Collapse></TableCell></TableRow></React.Fragment>;
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <PrcpIndicadorDetalleModal open={indicadorModal.open} onClose={() => setIndicadorModal((prev) => ({ ...prev, open: false }))} idPrcpOpPiMp={indicadorModal.idPrcpOpPiMp} idIndicadorNombre={indicadorModal.idIndicadorNombre} codigoIndicador={indicadorModal.codigoIndicador} nombreIndicador={indicadorModal.nombreIndicador} objetivoPrioritario={indicadorModal.objetivoPrioritario} problemaIdentificado={indicadorModal.problemaIdentificado} medidaPolitica={indicadorModal.medidaPolitica} />
    </Box>
  );
}
