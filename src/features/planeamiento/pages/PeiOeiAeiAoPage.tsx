// AJUSTE_VISUAL_POI_FONDO_ATENUADO_MODELO_PEI_20260520
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";

import PeiOeiAeiResumenModal from "../components/PeiOeiAeiResumenModal";
import PeiOeiAeiAoDetalleModal from "../components/PeiOeiAeiAoDetalleModal";
import PeiAoIndicadoresModal from "../components/PeiAoIndicadoresModal";

import { UnidadEjecutoraAction } from "../UnidadEjecutoraAction";
import {
  PeiOeiAeiAOAction,
  type PoiAnioDto,
  type PeriodoDto,
  type CcResponsableDto,
  type CentroCostoDto,
  type PeiOeiAeiAoMasterDto,
  type PeiOeiAeiAoDetailDto,
  type PeiOeiAeiAoByIdDto,
} from "../PeiOeiAeiAOAction";

type RouteParams = {
  idUnidadEjecutora?: string;
  idUe?: string;
};

type MasterRowContext = {
  oerCodigo?: string | null;
  oerEnunciado?: string | null;
  aerCodigo?: string | null;
  aerEnunciado?: string | null;

  oeiCodigo?: string | null;
  oeiEnunciado?: string | null;
  aeiCodigo?: string | null;
  aeiEnunciado?: string | null;
};

export default function PeiOeiAeiAoPage(): React.ReactElement {
  const navigate = useNavigate();
  const { idUnidadEjecutora, idUe } = useParams<RouteParams>();
  const idUeParam = Number(idUnidadEjecutora ?? idUe ?? 0);

  // =========================
  // UI header info
  // =========================
  const [loading, setLoading] = useState(true);
  const [loadingTabla, setLoadingTabla] = useState(false);

  const [ueLabel, setUeLabel] = useState<string>("Unidad Ejecutora: —");

  const [openResumenModal, setOpenResumenModal] = useState(false);

  // =========================
  // Modal Detalle AO (ojito del detail)
  // =========================
  const [openAoModal, setOpenAoModal] = useState(false);
  const [aoModalLoading, setAoModalLoading] = useState(false);
  const [aoModalData, setAoModalData] = useState<PeiOeiAeiAoByIdDto | null>(null);
  const [aoModalError, setAoModalError] = useState<string | null>(null);

  const [aoCtx, setAoCtx] = useState<{
    oer?: string | null;
    aer?: string | null;
    oei?: string | null;
    aei?: string | null;
  }>({});

  // =========================
  // Modal OER / AER (ojito del master)
  // =========================
  const [openOerAerModal, setOpenOerAerModal] = useState(false);
  const [oerAerCtx, setOerAerCtx] = useState<{ oer: string; aer: string }>({ oer: "—", aer: "—" });

  // =========================
  // Modal Indicadores por AO (botón en el detail)
  // =========================
  const [openIndicadoresModal, setOpenIndicadoresModal] = useState(false);
  const [indAoId, setIndAoId] = useState<number>(0);

  // ✅ valores correctos para el modal (nro POI / codigo AO / nombre AO / año real)
  const [indNroRegistroPoi, setIndNroRegistroPoi] = useState<string | null>(null);
  const [indCodigoAo, setIndCodigoAo] = useState<string | null>(null);
  const [indNombreAo, setIndNombreAo] = useState<string | null>(null);
  const [indAnioLabel, setIndAnioLabel] = useState<number | null>(null);

  const [indCtx, setIndCtx] = useState<{
    oer?: string | null;
    aer?: string | null;
    oei?: string | null;
    aei?: string | null;
  }>({});

  // =========================
  // Filters
  // =========================
  const [periodos, setPeriodos] = useState<PeriodoDto[]>([]);
  const [idPeriodoSel, setIdPeriodoSel] = useState<number>(0);

  const [anios, setAnios] = useState<PoiAnioDto[]>([]);
  const [idPoiAnioSel, setIdPoiAnioSel] = useState<number>(0);

  const [ccRespList, setCcRespList] = useState<CcResponsableDto[]>([]);
  const [idCcRespSel, setIdCcRespSel] = useState<number>(0);

  const [ccList, setCcList] = useState<CentroCostoDto[]>([]);
  const [idCcSel, setIdCcSel] = useState<number>(0);

  const periodoSelectedObj = useMemo(() => periodos.find((x) => x.idPeriodo === idPeriodoSel) ?? null, [periodos, idPeriodoSel]);

  const anioSelectedObj = useMemo(
    () => anios.find((x) => x.idPoiAnio === idPoiAnioSel) ?? null,
    [anios, idPoiAnioSel]
  );

  const ccRespSelectedObj = useMemo(
    () => ccRespList.find((x) => x.idCcResponsable === idCcRespSel) ?? null,
    [ccRespList, idCcRespSel]
  );

  const ccRespSelectedLabel = useMemo(() => {
    const x = ccRespList.find((z) => z.idCcResponsable === idCcRespSel);
    if (!x) return "—";
    return `${x.codigo ?? "—"} - ${x.descripcion ?? "—"}`;
  }, [ccRespList, idCcRespSel]);

  const ccSelectedObj = useMemo(
    () => ccList.find((x) => x.idCentroCosto === idCcSel) ?? null,
    [ccList, idCcSel]
  );

  // =========================
  // Data (Master / Detail)
  // =========================
  const [rows, setRows] = useState<PeiOeiAeiAoMasterDto[]>([]);
  const [qSearch, setQSearch] = useState("");

  const rowsFiltered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      `${r.oeiCodigo} ${r.oeiEnunciado} ${r.aeiCodigo} ${r.aeiEnunciado}`.toLowerCase().includes(q)
    );
  }, [rows, qSearch]);

  // expand/collapse + cache
  const [openRowMap, setOpenRowMap] = useState<Record<number, boolean>>({});
  type RowDetailState = { loading: boolean; data: PeiOeiAeiAoDetailDto[]; error?: string };
  const [detailMap, setDetailMap] = useState<Record<number, RowDetailState>>({});

  // counts for top chips
  const oeiCount = useMemo(() => new Set(rows.map((r) => r.idOei)).size, [rows]);
  const aeiCount = useMemo(() => rows.length, [rows]);

  // =========================
  // Helpers (filter option display)
  // =========================
  const filterByCodigoDescripcion = <T extends { codigo: string | null; descripcion: string | null }>(
    options: readonly T[],
    inputValue: string
  ): T[] => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options.slice() as T[];
    return options.filter((o) => `${o.codigo ?? ""} ${o.descripcion ?? ""}`.toLowerCase().includes(q)) as T[];
  };

  const filterByCodigoNombre = <T extends { codigo: string | null; nombre: string | null }>(
    options: readonly T[],
    inputValue: string
  ): T[] => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options.slice() as T[];
    return options.filter((o) => `${o.codigo ?? ""} ${o.nombre ?? ""}`.toLowerCase().includes(q)) as T[];
  };

  // =========================
  // Loaders
  // =========================
  async function loadTabla(idUeLocal: number, idCc: number, idPoiAnio: number, idPeriodo: number) {
    if (!idUeLocal || !idCc || !idPoiAnio || !idPeriodo) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    try {
      const data = await PeiOeiAeiAOAction.getMaster(idUeLocal, idCc, idPoiAnio, idPeriodo);
      setRows(data ?? []);
      setOpenRowMap({});
      setDetailMap({});
    } catch (e) {
      console.error(e);
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
    } finally {
      setLoadingTabla(false);
    }
  }

  async function loadCcByCcResp(idCcResponsable: number) {
    const list = await PeiOeiAeiAOAction.getCentrosCostoByCcResponsable(idCcResponsable);
    setCcList(list ?? []);

    const firstCc = list?.[0]?.idCentroCosto ?? 0;
    setIdCcSel(firstCc);

    await loadTabla(idUeParam, firstCc, idPoiAnioSel, idPeriodoSel);
  }

  async function loadInit() {
    if (!Number.isFinite(idUeParam) || idUeParam <= 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ue = await UnidadEjecutoraAction.getById(idUeParam);
      if (ue) setUeLabel(`Unidad Ejecutora: ${ue.codigo ?? "—"} - ${ue.nombre ?? "—"}`);
      else setUeLabel("Unidad Ejecutora: —");

      const periodosDb = await PeiOeiAeiAOAction.getPeriodos();
      setPeriodos(periodosDb ?? []);
      const firstPeriodo = periodosDb?.[0]?.idPeriodo ?? 0;
      setIdPeriodoSel(firstPeriodo);

      const aniosDb = await PeiOeiAeiAOAction.getAnios();
      setAnios(aniosDb ?? []);
      const firstAnio = aniosDb?.[0]?.idPoiAnio ?? 0;
      setIdPoiAnioSel(firstAnio);

      const resp = await PeiOeiAeiAOAction.getCcResponsablesByUe(idUeParam);
      setCcRespList(resp ?? []);

      const firstResp = resp?.[0]?.idCcResponsable ?? 0;
      setIdCcRespSel(firstResp);

      if (firstResp) {
        await loadCcByCcResp(firstResp);
      } else {
        setCcList([]);
        setIdCcSel(0);
        setRows([]);
        setOpenRowMap({});
        setDetailMap({});
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUeParam]);

  const onPeriodoChange = async (_event: React.SyntheticEvent, newValue: PeriodoDto | null) => {
    const newId = newValue?.idPeriodo ?? 0;
    setIdPeriodoSel(newId);
    await loadTabla(idUeParam, idCcSel, idPoiAnioSel, newId);
  };

  const onAnioChange = async (_event: React.SyntheticEvent, newValue: PoiAnioDto | null) => {
    const newId = newValue?.idPoiAnio ?? 0;
    setIdPoiAnioSel(newId);
    await loadTabla(idUeParam, idCcSel, newId, idPeriodoSel);
  };

  const onCcRespAutoChange = async (_event: React.SyntheticEvent, newValue: CcResponsableDto | null) => {
    const newId = newValue?.idCcResponsable ?? 0;
    setIdCcRespSel(newId);

    if (!newId) {
      setCcList([]);
      setIdCcSel(0);
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    await loadCcByCcResp(newId);
  };

  const onCcAutoChange = async (_event: React.SyntheticEvent, newValue: CentroCostoDto | null) => {
    const newCc = newValue?.idCentroCosto ?? 0;
    setIdCcSel(newCc);

    if (!newCc) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    await loadTabla(idUeParam, newCc, idPoiAnioSel, idPeriodoSel);
  };

  // =========================
  // Master/Detail actions
  // =========================
  const toggleRowDetail = async (r: PeiOeiAeiAoMasterDto) => {
    const idKey = r.idAei; // detail by AEI
    setOpenRowMap((prev) => ({ ...prev, [idKey]: !prev[idKey] }));

    if (detailMap[idKey]?.data?.length || detailMap[idKey]?.loading) return;

    try {
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: true, data: [] } }));
      const data = await PeiOeiAeiAOAction.getDetailByAei(idKey);
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: data ?? [] } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar el detalle AO.";
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: [], error: msg } }));
    }
  };

  const reloadRowDetail = async (r: PeiOeiAeiAoMasterDto) => {
    const idKey = r.idAei;
    try {
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: true, data: [] } }));
      const data = await PeiOeiAeiAOAction.getDetailByAei(idKey);
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: data ?? [] } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo recargar el detalle AO.";
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: [], error: msg } }));
    }
  };

  const onRefresh = async () => {
    await loadTabla(idUeParam, idCcSel, idPoiAnioSel, idPeriodoSel);
  };

  // ✅ Ojito del MASTER: abre modal con OER/AER (no toca expand/collapse)
  const openOerAerFromMaster = (r: PeiOeiAeiAoMasterDto) => {
    setOerAerCtx({
      oer: `${r.oerCodigo ?? "—"} - ${r.oerEnunciado ?? "—"}`,
      aer: `${r.aerCodigo ?? "—"} - ${r.aerEnunciado ?? "—"}`,
    });
    setOpenOerAerModal(true);
  };

  // ✅ Botón (detail): abre modal de indicadores por AO con info correcta
  const openIndicadoresForAo = (
    aoId: number,
    nroRegistroPoi: string,
    codigoAo: string,
    nombreAo: string,
    masterRow: MasterRowContext
  ) => {
    setIndAoId(aoId);
    setIndNroRegistroPoi(nroRegistroPoi);
    setIndCodigoAo(codigoAo);
    setIndNombreAo(nombreAo);
    setIndAnioLabel(anioSelectedObj?.anio ?? null);

    setIndCtx({
      oer: masterRow.oerCodigo ? `${masterRow.oerCodigo} - ${masterRow.oerEnunciado ?? ""}`.trim() : null,
      aer: masterRow.aerCodigo ? `${masterRow.aerCodigo} - ${masterRow.aerEnunciado ?? ""}`.trim() : null,
      oei: masterRow.oeiCodigo ? `${masterRow.oeiCodigo} - ${masterRow.oeiEnunciado ?? ""}`.trim() : null,
      aei: masterRow.aeiCodigo ? `${masterRow.aeiCodigo} - ${masterRow.aeiEnunciado ?? ""}`.trim() : null,
    });

    setOpenIndicadoresModal(true);
  };

  // ✅ Ojito del DETAIL: abre modal + carga por ID (poi_oei_aei_ao)
  const openDetalleAo = async (idOeiAeiAo: number, masterRow: PeiOeiAeiAoMasterDto) => {
    setAoModalError(null);

    setAoCtx({
      oer: `${masterRow.oerCodigo ?? "—"} - ${masterRow.oerEnunciado ?? "—"}`,
      aer: `${masterRow.aerCodigo ?? "—"} - ${masterRow.aerEnunciado ?? "—"}`,
      oei: `${masterRow.oeiCodigo ?? "—"} - ${masterRow.oeiEnunciado ?? "—"}`,
      aei: `${masterRow.aeiCodigo ?? "—"} - ${masterRow.aeiEnunciado ?? "—"}`,
    });

    setOpenAoModal(true);
    setAoModalLoading(true);
    setAoModalData(null);

    try {
      const data = await PeiOeiAeiAOAction.getAoById(idOeiAeiAo);
      setAoModalData(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar el detalle del AO.";
      setAoModalError(msg);
      setAoModalData(null);
    } finally {
      setAoModalLoading(false);
    }
  };

  // =========================
  // Render
  // =========================
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={22} />
          <Typography>Cargando...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 2, md: 3 },
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
      }}
    >
      {/* Header premium */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Tooltip title="Volver" arrow>
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Volver"
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                border: "1px solid rgba(148,163,184,.30)",
                bgcolor: "rgba(255,255,255,.92)",
                boxShadow: "0 12px 28px rgba(15,23,42,.08)",
                "&:hover": { bgcolor: "rgba(239,246,255,.95)", transform: "translateY(-1px)" },
              }}
            >
              <ArrowBackRoundedIcon sx={{ color: "#2563eb" }} />
            </IconButton>
          </Tooltip>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: "-.04em", lineHeight: 1 }}>
              POI: OEI / AEI / AO
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.55, fontWeight: 600 }} noWrap>
              {ueLabel}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <Chip
            label={`OEI: ${oeiCount}`}
            size="small"
            sx={{
              height: 30,
              borderRadius: 999,
              fontWeight: 900,
              color: "#0369a1",
              bgcolor: "rgba(14,165,233,.10)",
              border: "1px solid rgba(14,165,233,.32)",
            }}
          />
          <Chip
            label={`AEI: ${aeiCount}`}
            size="small"
            sx={{
              height: 30,
              borderRadius: 999,
              fontWeight: 900,
              color: "#6d28d9",
              bgcolor: "rgba(124,58,237,.055)",
              border: "1px solid rgba(124,58,237,.30)",
            }}
          />
          <Chip
            label={`Registros: ${rowsFiltered.length}`}
            size="small"
            sx={{ height: 30, borderRadius: 999, fontWeight: 900, bgcolor: "#fff", border: "1px solid rgba(15,23,42,.14)" }}
          />

          <Tooltip title="Refrescar" arrow>
            <IconButton
              onMouseDown={(e) => e.currentTarget.blur()}
              onClick={onRefresh}
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                border: "1px solid rgba(148,163,184,.30)",
                bgcolor: "#fff",
                boxShadow: "0 10px 24px rgba(15,23,42,.07)",
                "&:hover": { bgcolor: "rgba(239,246,255,.95)", transform: "translateY(-1px)" },
              }}
            >
              <RefreshRoundedIcon sx={{ fontSize: 21, color: "#475569" }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Ver resumen OEI/AEI" arrow>
            <IconButton
              onMouseDown={(e) => e.currentTarget.blur()}
              onClick={() => setOpenResumenModal(true)}
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                border: "1px solid rgba(59,130,246,.34)",
                bgcolor: "rgba(59,130,246,.12)",
                boxShadow: "0 10px 24px rgba(37,99,235,.12)",
                "&:hover": { bgcolor: "rgba(59,130,246,.18)", transform: "translateY(-1px)" },
              }}
            >
              <VisibilityOutlinedIcon sx={{ fontSize: 21, color: "#2563eb" }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filtros premium */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.6, md: 2 },
          mb: 2.25,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.26)",
          bgcolor: "rgba(255,255,255,.96)",
          boxShadow: "0 8px 24px rgba(15,23,42,.045)",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              color: "#2563eb",
              bgcolor: "rgba(59,130,246,.12)",
            }}
          >
            <FilterAltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1.05 }}>Filtros de búsqueda</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Ajuste el contexto para consultar la estructura POI y sus actividades operativas.
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.15fr" }, gap: 1.4, mb: 1.4 }}>
          <Autocomplete
            options={periodos}
            value={periodoSelectedObj}
            onChange={onPeriodoChange}
            getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.descripcion ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idPeriodo === v.idPeriodo}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) => filterByCodigoDescripcion(options as any, state.inputValue)}
            ListboxProps={{ style: { maxHeight: 320 } }}
            renderInput={(params) => <TextField {...params} label="Periodo" size="small" placeholder="Buscar periodo…" />}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff" } }}
          />

          <Autocomplete
            options={ccRespList}
            value={ccRespSelectedObj}
            onChange={onCcRespAutoChange}
            getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.descripcion ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idCcResponsable === v.idCcResponsable}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) => filterByCodigoDescripcion(options, state.inputValue)}
            ListboxProps={{ style: { maxHeight: 320 } }}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Box sx={{ px: 1, py: 0.25, borderRadius: 999, fontSize: 12, fontWeight: 900, border: "1px solid rgba(148,163,184,.5)", bgcolor: "rgba(248,250,252,.9)", minWidth: 64, textAlign: "center", whiteSpace: "nowrap" }}>
                      {option.codigo ?? "—"}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{option.descripcion ?? "—"}</Typography>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => <TextField {...params} label="CC Responsable" size="small" placeholder="Buscar CC responsable…" />}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff" } }}
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" }, gap: 1.4, mb: 1.4 }}>
          <Autocomplete
            options={anios}
            value={anioSelectedObj}
            onChange={onAnioChange}
            getOptionLabel={(o) => `${o.anio}`}
            isOptionEqualToValue={(o, v) => o.idPoiAnio === v.idPoiAnio}
            noOptionsText="Sin resultados"
            ListboxProps={{ style: { maxHeight: 240 } }}
            renderInput={(params) => <TextField {...params} label="Año" size="small" />}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff" } }}
          />

          <Autocomplete
            options={ccList}
            value={ccSelectedObj}
            onChange={onCcAutoChange}
            getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idCentroCosto === v.idCentroCosto}
            noOptionsText={idCcRespSel ? "Sin resultados" : "Selecciona un CC Responsable primero"}
            filterOptions={(options, state) => filterByCodigoNombre(options, state.inputValue)}
            ListboxProps={{ style: { maxHeight: 320 } }}
            disabled={!idCcRespSel}
            renderOption={(props, option) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Box sx={{ px: 1, py: 0.25, borderRadius: 999, fontSize: 12, fontWeight: 900, border: "1px solid rgba(148,163,184,.5)", bgcolor: "rgba(248,250,252,.9)", minWidth: 64, textAlign: "center", whiteSpace: "nowrap" }}>
                      {option.codigo ?? "—"}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{option.nombre ?? "—"}</Typography>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => <TextField {...params} label="Centro de Costo" size="small" placeholder="Buscar centro de costo…" />}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff" } }}
          />
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 1.4 }}>
          <Chip
            size="small"
            icon={<BusinessRoundedIcon sx={{ fontSize: "16px !important" }} />}
            label={`CC Responsable seleccionado: ${ccRespSelectedLabel}`}
            sx={{ justifyContent: "flex-start", maxWidth: "100%", fontWeight: 800, bgcolor: "rgba(15,23,42,.04)", border: "1px solid rgba(148,163,184,.26)" }}
          />
          <Chip
            size="small"
            label={`Centro de costo: ${ccSelectedObj?.codigo ?? "—"} - ${ccSelectedObj?.nombre ?? "—"}`}
            sx={{ justifyContent: "flex-start", maxWidth: "100%", fontWeight: 800, bgcolor: "rgba(59,130,246,.08)", color: "#1d4ed8", border: "1px solid rgba(59,130,246,.22)" }}
          />
        </Stack>

        <TextField
          value={qSearch}
          onChange={(e) => setQSearch(e.target.value)}
          placeholder="Buscar OEI / AEI (código o enunciado)..."
          size="small"
          fullWidth
          InputProps={{ startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "text.secondary", fontSize: 20 }} /> }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "#fff" } }}
        />
      </Paper>

      {/* Estructura premium */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.6, md: 2 },
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.28)",
          bgcolor: "rgba(255,255,255,.98)",
          boxShadow: "0 8px 24px rgba(15,23,42,.045)",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.6 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.6,
              display: "grid",
              placeItems: "center",
              color: "#2563eb",
              bgcolor: "rgba(59,130,246,.12)",
            }}
          >
            <AccountTreeRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1.05 }}>Estructura OEI / AEI / AO</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Use los botones de expansión para revisar las actividades operativas asociadas por AEI.
            </Typography>
          </Box>
        </Stack>

        {loadingTabla ? (
          <Stack spacing={1.2}>
            <Skeleton variant="rounded" height={92} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" height={92} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" height={92} sx={{ borderRadius: 3 }} />
          </Stack>
        ) : rowsFiltered.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            No hay registros para la combinación seleccionada (Periodo + Año + UE + CC Responsable + Centro de costo).
          </Alert>
        ) : (
          <Stack spacing={1.4}>
            {rowsFiltered.map((r) => {
              const idKey = r.idAei;
              const open = !!openRowMap[idKey];
              const detail = detailMap[idKey];

              return (
                <Paper
                  key={`${r.idOei}-${r.idAei}`}
                  elevation={0}
                  sx={{
                    borderRadius: 3.2,
                    overflow: "hidden",
                    border: `1px solid ${open ? "rgba(124,58,237,.44)" : "rgba(59,130,246,.24)"}`,
                    background: "#fff",
                    boxShadow: open
                      ? "0 16px 34px rgba(124,58,237,.08)"
                      : "0 8px 24px rgba(15,23,42,.045)",
                  }}
                >
                  <Box sx={{ p: { xs: 1.4, md: 1.6 } }}>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "auto 1fr", md: "auto 74px minmax(210px,1fr) 92px minmax(240px,1.1fr) auto" },
                        gap: { xs: 1, md: 1.6 },
                        alignItems: "center",
                      }}
                    >
                      <Tooltip title={open ? "Ocultar detalle" : "Ver AO del AEI"} arrow>
                        <IconButton
                          size="small"
                          onMouseDown={(e) => e.currentTarget.blur()}
                          onClick={() => toggleRowDetail(r)}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2.2,
                            border: "1px solid rgba(148,163,184,.35)",
                            bgcolor: open ? "rgba(124,58,237,.12)" : "#fff",
                            color: open ? "#7c3aed" : "#334155",
                            boxShadow: "0 8px 18px rgba(15,23,42,.08)",
                          }}
                        >
                          {open ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                        </IconButton>
                      </Tooltip>

                      <Chip
                        label="OEI"
                        sx={{
                          width: { md: 64 },
                          height: 30,
                          borderRadius: 2,
                          fontWeight: 950,
                          color: "#fff",
                          bgcolor: "#2563eb",
                          justifySelf: { md: "center" },
                        }}
                      />

                      <Box sx={{ minWidth: 0, gridColumn: { xs: "1 / -1", md: "auto" } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Código OEI</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>{r.oeiCodigo}</Typography>
                          <Chip
                            size="small"
                            label={`AO: ${r.totalAo ?? 0}`}
                            sx={{ height: 22, borderRadius: 999, fontWeight: 900, bgcolor: "rgba(59,130,246,.10)", color: "#1d4ed8", border: "1px solid rgba(59,130,246,.25)" }}
                          />
                        </Stack>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.25, mt: 0.35 }}>{r.oeiEnunciado}</Typography>
                      </Box>

                      <Chip
                        label="AEI"
                        sx={{
                          width: { md: 64 },
                          height: 30,
                          borderRadius: 2,
                          fontWeight: 950,
                          color: "#fff",
                          bgcolor: "#7c3aed",
                          justifySelf: { md: "center" },
                          gridColumn: { xs: "1 / span 1", md: "auto" },
                        }}
                      />

                      <Box sx={{ minWidth: 0, gridColumn: { xs: "2 / -1", md: "auto" } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>Código AEI</Typography>
                        <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>{r.aeiCodigo}</Typography>
                        <Typography sx={{ fontWeight: 900, lineHeight: 1.25, mt: 0.35 }}>{r.aeiEnunciado}</Typography>
                      </Box>

                      <Stack direction="row" spacing={0.8} justifyContent="flex-end" alignItems="center" sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                        <Tooltip title="Ver OER / AER" arrow>
                          <IconButton
                            size="small"
                            onMouseDown={(e) => e.currentTarget.blur()}
                            onClick={() => openOerAerFromMaster(r)}
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: 2.3,
                              border: "1px solid rgba(59,130,246,.30)",
                              bgcolor: "rgba(59,130,246,.10)",
                              color: "#2563eb",
                              boxShadow: "0 8px 20px rgba(37,99,235,.12)",
                              "&:hover": { bgcolor: "rgba(59,130,246,.18)", transform: "translateY(-1px)" },
                            }}
                          >
                            <QueryStatsRoundedIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Box>

                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ px: { xs: 1.2, md: 1.6 }, pb: 1.6 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.4,
                          borderRadius: 3,
                          border: "1px solid rgba(124,58,237,.26)",
                          bgcolor: "rgba(255,255,255,.96)",
                        }}
                      >
                        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1.2 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 32, height: 32, borderRadius: 2, display: "grid", placeItems: "center", color: "#7c3aed", bgcolor: "rgba(124,58,237,.12)" }}>
                              <AssignmentTurnedInRoundedIcon fontSize="small" />
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 950 }}>Detalle Actividad Operativa</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                AEI: {r.aeiCodigo} — {r.aeiEnunciado}
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                            <Chip size="small" variant="outlined" label={`CC Resp: ${ccRespSelectedLabel}`} sx={{ height: 23, fontWeight: 800, bgcolor: "#fff" }} />
                            <Chip size="small" variant="outlined" label={`CC: ${ccSelectedObj?.codigo ?? "—"} - ${ccSelectedObj?.nombre ?? "—"}`} sx={{ height: 23, fontWeight: 800, bgcolor: "#fff" }} />
                            <Tooltip title="Recargar detalle" arrow>
                              <IconButton
                                size="small"
                                onMouseDown={(e) => e.currentTarget.blur()}
                                onClick={() => reloadRowDetail(r)}
                                sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,.35)", bgcolor: "#fff" }}
                              >
                                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>

                        {detail?.loading ? (
                          <Stack spacing={1}>
                            <Skeleton variant="rounded" height={38} />
                            <Skeleton variant="rounded" height={38} />
                            <Skeleton variant="rounded" height={38} />
                          </Stack>
                        ) : detail?.error ? (
                          <Alert severity="warning" sx={{ borderRadius: 2 }}>{detail.error}</Alert>
                        ) : !detail?.data || detail.data.length === 0 ? (
                          <Alert severity="info" sx={{ borderRadius: 2 }}>No hay Actividades Operativas registradas para este AEI.</Alert>
                        ) : (
                          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2.5, border: "1px solid rgba(148,163,184,.28)", overflow: "hidden" }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "rgba(124,58,237,.055)" }}>
                                  <TableCell sx={{ fontWeight: 950, color: "#6d28d9", width: 170 }}>Nro Registro POI</TableCell>
                                  <TableCell sx={{ fontWeight: 950, color: "#6d28d9", width: 170 }}>Código AO</TableCell>
                                  <TableCell sx={{ fontWeight: 950, color: "#6d28d9" }}>Actividad Operativa</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 950, color: "#6d28d9", width: 130 }}>Acción</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {detail.data.map((d) => (
                                  <TableRow key={d.idOeiAeiAo} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                                    <TableCell sx={{ fontWeight: 900 }}>{d.nroRegistroPoi}</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>{d.codigoAo}</TableCell>
                                    <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word", fontWeight: 600 }}>{d.nombreAo}</TableCell>
                                    <TableCell align="right">
                                      <Tooltip title="Ver detalle AO" arrow>
                                        <IconButton
                                          size="small"
                                          onMouseDown={(e) => e.currentTarget.blur()}
                                          onClick={() => openDetalleAo(d.idOeiAeiAo, r)}
                                          sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 2,
                                            border: "1px solid rgba(59,130,246,.30)",
                                            bgcolor: "rgba(59,130,246,.10)",
                                            color: "#2563eb",
                                            "&:hover": { bgcolor: "rgba(59,130,246,.18)" },
                                          }}
                                        >
                                          <QueryStatsRoundedIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                      </Tooltip>

                                      {d.idOeiAeiAo > 0 && (
                                        <Tooltip title="Ver unidades de medida" arrow>
                                          <IconButton
                                            size="small"
                                            onMouseDown={(e) => e.currentTarget.blur()}
                                            onClick={() =>
                                              openIndicadoresForAo(
                                                d.idOeiAeiAo,
                                                d.nroRegistroPoi,
                                                d.codigoAo,
                                                d.nombreAo,
                                                r
                                              )
                                            }
                                            sx={{
                                              width: 32,
                                              height: 32,
                                              borderRadius: 2,
                                              border: "1px solid rgba(37,99,235,.30)",
                                              bgcolor: "rgba(37,99,235,.10)",
                                              color: "#1d4ed8",
                                              ml: 0.75,
                                              "&:hover": { bgcolor: "rgba(37,99,235,.18)" },
                                            }}
                                          >
                                            <BarChartRoundedIcon sx={{ fontSize: 18 }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )}
                      </Paper>
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>

      {/* Error del modal AO (si falla el GET byId) */}
      {aoModalError && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
          {aoModalError}
        </Alert>
      )}

      {/* Modal OER / AER (ojito del master) */}
      <Dialog open={openOerAerModal} onClose={() => setOpenOerAerModal(false)} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            pb: 1.25,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg, rgba(27,111,238,0.08) 0%, rgba(27,111,238,0) 100%)",
          }}
        >
          <Typography sx={{ fontWeight: 950 }}>OER / AER</Typography>

          <Tooltip title="Cerrar" arrow>
            <IconButton onClick={() => setOpenOerAerModal(false)} sx={{ borderRadius: 2 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(248,250,255,0.9)",
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.75 }}>
              OER
            </Typography>
            <Typography sx={{ fontWeight: 900, mb: 2 }}>{oerAerCtx.oer}</Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.75 }}>
              AER
            </Typography>
            <Typography sx={{ fontWeight: 900 }}>{oerAerCtx.aer}</Typography>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Box sx={{ flex: 1 }} />
          <Button
            onClick={() => setOpenOerAerModal(false)}
            variant="outlined"
            sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
          >
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Detalle AO */}
      <PeiOeiAeiAoDetalleModal
        open={openAoModal}
        onClose={() => setOpenAoModal(false)}
        data={aoModalLoading ? null : aoModalData}
        anioLabel={anioSelectedObj?.anio ?? null}
        oer={aoCtx.oer}
        aer={aoCtx.aer}
        oei={aoCtx.oei}
        aei={aoCtx.aei}
      />

      {/* ✅ Modal Indicadores por AO (props correctos para tu nuevo diseño) */}
      <PeiAoIndicadoresModal
        open={openIndicadoresModal}
        onClose={() => setOpenIndicadoresModal(false)}
        idOeiAeiAo={indAoId}
        idPoiAnio={idPoiAnioSel}
        anioLabel={indAnioLabel}
        nroRegistroPoi={indNroRegistroPoi}
        codigoAo={indCodigoAo}
        nombreAo={indNombreAo}
        oer={indCtx.oer}
        aer={indCtx.aer}
        oei={indCtx.oei}
        aei={indCtx.aei}
      />

      <PeiOeiAeiResumenModal
        open={openResumenModal}
        onClose={() => setOpenResumenModal(false)}
        rows={rowsFiltered}
        ccRespLabel={ccRespSelectedLabel}
        ccLabel={`${ccSelectedObj?.codigo ?? "—"} - ${ccSelectedObj?.nombre ?? "—"}`}
        anioLabel={`${anioSelectedObj?.anio ?? "—"}`}
      />
    </Box>
  );
}