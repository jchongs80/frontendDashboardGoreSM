import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";


import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";

import { UnidadEjecutoraAction } from "../UnidadEjecutoraAction";
import { PdrcOeAeAction } from "../PdrcOeAeAction";
import type {
  PdrcOerAerAsignadoListDto,
  CcResponsableDto,
  CentroCostoDto,
  PoiAnioDto,
  PeriodoDto,
  PeiOeiAeiDetalleRowDto,
} from "../PdrcOeAeAction";

import PdrcOerAerModal from "../components/PdrcOerAerModal";
import PdrcAerModal from "../components/PdrcAerModal";
import PeiOeiAeiModal from "../components/PeiOeiAeiModal";

type RouteParams = { idUnidadEjecutora?: string; idUe?: string };

function actionIconBtnSx(color: "primary" | "info") {
  const palette =
    color === "primary"
      ? { border: "primary.light", bg: "primary.50", hover: "primary.100" }
      : { border: "info.light", bg: "info.50", hover: "info.100" };

  return {
    width: 30,
    height: 30,
    borderRadius: 2,
    border: "1px solid",
    borderColor: palette.border,
    bgcolor: palette.bg,
    "&:hover": {
      bgcolor: palette.hover,
      transform: "translateY(-1px)",
    },
    transition: "all .15s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,.05)",
  } as const;
}

function peiTealBtnSx() {
  return {
    width: 30,
    height: 30,
    borderRadius: 2,
    border: "1px solid",
    borderColor: "rgba(16, 185, 129, .45)",
    bgcolor: "rgba(16, 185, 129, .10)",
    "&:hover": {
      bgcolor: "rgba(16, 185, 129, .18)",
      transform: "translateY(-1px)",
    },
    transition: "all .15s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,.05)",
  } as const;
}

function dangerBtnSx(disabled?: boolean) {
  return {
    width: 30,
    height: 30,
    borderRadius: 2,
    border: "1px solid",
    borderColor: disabled ? "rgba(239, 68, 68, .20)" : "rgba(239, 68, 68, .45)",
    bgcolor: disabled ? "rgba(239, 68, 68, .05)" : "rgba(239, 68, 68, .10)",
    opacity: disabled ? 0.45 : 1,
    filter: disabled ? "grayscale(35%)" : "none",
    cursor: disabled ? "not-allowed" : "pointer",
    "&:hover": disabled
      ? {}
      : {
          bgcolor: "rgba(239, 68, 68, .18)",
          transform: "translateY(-1px)",
        },
    transition: "all .15s ease",
    boxShadow: disabled ? "none" : "0 4px 12px rgba(0,0,0,.05)",
  } as const;
}

export default function PdrcOeAePage() {
  const navigate = useNavigate();
  const { idUnidadEjecutora, idUe } = useParams<RouteParams>();
  const idUeParam = Number(idUnidadEjecutora ?? idUe ?? 0);

  const blurActiveElement = () => {
    const el = document.activeElement as HTMLElement | null;
    if (el?.blur) el.blur();
  };

  const [loading, setLoading] = useState(true);
  const [loadingTabla, setLoadingTabla] = useState(false);

  const [ueLabel, setUeLabel] = useState<string>("Unidad Ejecutora: —");

  // ✅ PERIODO
  const [periodos, setPeriodos] = useState<PeriodoDto[]>([]);
  const [idPeriodoSel, setIdPeriodoSel] = useState<number>(0);

  // ✅ AÑO
  const [anios, setAnios] = useState<PoiAnioDto[]>([]);
  const [idPoiAnioSel, setIdPoiAnioSel] = useState<number>(0);

  // ✅ CC Responsable + CC
  const [ccRespList, setCcRespList] = useState<CcResponsableDto[]>([]);
  const [idCcRespSel, setIdCcRespSel] = useState<number>(0);

  const [ccList, setCcList] = useState<CentroCostoDto[]>([]);
  const [idCcSel, setIdCcSel] = useState<number>(0);

  const [rows, setRows] = useState<PdrcOerAerAsignadoListDto[]>([]);

  const [qSearch, setQSearch] = useState("");
  const rowsFiltered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      `${r.codigoOer} ${r.enunciadoOer} ${r.codigoAer} ${r.enunciadoAer}`.toLowerCase().includes(q)
    );
  }, [rows, qSearch]);

  const [peiResumenMap, setPeiResumenMap] = useState<Record<number, { oei: number; aei: number }>>({});

  // ✅ Master/Detail (detalle OEI-AEI por AER + CC)
  const [openRowMap, setOpenRowMap] = useState<Record<number, boolean>>({});
  type RowDetailState = { loading: boolean; data: PeiOeiAeiDetalleRowDto[]; error?: string };
  const [detailMap, setDetailMap] = useState<Record<number, RowDetailState>>({});

  const oerAsignadosCount = useMemo(() => new Set(rows.map((r) => r.idObjetivo)).size, [rows]);
  const aerAsignadosCount = useMemo(() => rows.length, [rows]);

  const [openOerAerModal, setOpenOerAerModal] = useState(false);

  const [openAerModal, setOpenAerModal] = useState(false);
  const [oerRowForAer, setOerRowForAer] = useState<{ idObjetivo: number; codigo: string; enunciado: string } | null>(
    null
  );

  // PEI (se mantiene)
  const [openPeiModal, setOpenPeiModal] = useState(false);
  const [openPeiViewModal, setOpenPeiViewModal] = useState(false);

  const [openDeleteDlg, setOpenDeleteDlg] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PdrcOerAerAsignadoListDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

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

  const ccSelectedObj = useMemo(() => ccList.find((x) => x.idCentroCosto === idCcSel) ?? null, [ccList, idCcSel]);

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

  async function loadTabla(idUeLocal: number, idCc: number, idPoiAnio: number, idPeriodo: number) {
    if (!idUeLocal || !idCc || !idPoiAnio || !idPeriodo) {
      setRows([]);
      setPeiResumenMap({});
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    try {
      const data = await PdrcOeAeAction.getAsignacionesOerAer(idUeLocal, idCc, idPoiAnio, idPeriodo);
      setRows(data ?? []);

      // ✅ Chips OEI/AEI (modelo nuevo): por AER + CC
      const idsAer = (data ?? [])
        .map((x) => x.idAccion)
        .filter((x): x is number => typeof x === "number" && x > 0);

      const resumen = await PdrcOeAeAction.getPeiResumenByAerCc(idCc, idsAer);
      const map: Record<number, { oei: number; aei: number }> = {};
      (resumen ?? []).forEach((r) => {
        map[r.idAer] = { oei: r.totalOei, aei: r.totalAei };
      });
      setPeiResumenMap(map);

      // reset detalle al recargar master
      setOpenRowMap({});
      setDetailMap({});
    } catch {
      setRows([]);
      setPeiResumenMap({});
      setOpenRowMap({});
      setDetailMap({});
    } finally {
      setLoadingTabla(false);
    }
  }

  async function loadCcByCcResp(idCcResponsable: number) {
    const list = await PdrcOeAeAction.getCentrosCostoByCcResponsable(idCcResponsable);
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
      // UE label
      const ue = await UnidadEjecutoraAction.getById(idUeParam);
      if (ue) setUeLabel(`Unidad Ejecutora: ${ue.codigo ?? "—"} - ${ue.nombre ?? "—"}`);
      else setUeLabel("Unidad Ejecutora: —");

      const periodosDb = await PdrcOeAeAction.getPeriodos();
      setPeriodos(periodosDb ?? []);
      const firstPeriodo = periodosDb?.[0]?.idPeriodo ?? 0;
      setIdPeriodoSel(firstPeriodo);

      // ✅ Años (primero)
      const aniosDb = await PdrcOeAeAction.getAnios();
      setAnios(aniosDb ?? []);
      const firstAnio = aniosDb?.[0]?.idPoiAnio ?? 0;
      setIdPoiAnioSel(firstAnio);

      // CC responsables por UE
      const resp = await PdrcOeAeAction.getCcResponsablesByUe(idUeParam);
      setCcRespList(resp ?? []);

      const firstResp = resp?.[0]?.idCcResponsable ?? 0;
      setIdCcRespSel(firstResp);

      if (firstResp) {
        // carga cc y tabla
        await loadCcByCcResp(firstResp);
      } else {
        setCcList([]);
        setIdCcSel(0);
        setRows([]);
        setPeiResumenMap({});
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
      setPeiResumenMap({});
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
      setPeiResumenMap({});
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    await loadTabla(idUeParam, newCc, idPoiAnioSel, idPeriodoSel);
  };

  const onRefresh = async () => {
    await loadTabla(idUeParam, idCcSel, idPoiAnioSel, idPeriodoSel);
  };

  // ✅ Master/Detail: carga detalle OEI-AEI por fila
  const toggleRowDetail = async (r: PdrcOerAerAsignadoListDto) => {
    const idKey = r.idAccion; // AER
    setOpenRowMap((prev) => ({ ...prev, [idKey]: !prev[idKey] }));

    // cache
    if (detailMap[idKey]?.data?.length || detailMap[idKey]?.loading) return;
    if (!idCcSel) return;

    try {
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: true, data: [] } }));
      const data = await PdrcOeAeAction.getPeiDetalleOeiAeiByAerCc(idCcSel, idKey);
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: data ?? [] } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar el detalle OEI/AEI.";
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: [], error: msg } }));
    }
  };

  const reloadRowDetail = async (r: PdrcOerAerAsignadoListDto) => {
    const idKey = r.idAccion;
    if (!idCcSel) return;

    try {
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: true, data: [] } }));
      const data = await PdrcOeAeAction.getPeiDetalleOeiAeiByAerCc(idCcSel, idKey);
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: data ?? [] } }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo recargar el detalle OEI/AEI.";
      setDetailMap((prev) => ({ ...prev, [idKey]: { loading: false, data: [], error: msg } }));
    }
  };

  const openAerModalForRow = (r: PdrcOerAerAsignadoListDto) => {
    blurActiveElement();
    setOerRowForAer({
      idObjetivo: r.idObjetivo,
      codigo: r.codigoOer ?? "",
      enunciado: r.enunciadoOer ?? "",
    });
    setOpenAerModal(true);
  };

  const openPeiModalForRow = async (r: PdrcOerAerAsignadoListDto) => {
    blurActiveElement();
    setPeiCtx({
      oerCodigo: r.codigoOer,
      oerEnunciado: r.enunciadoOer,
      aerCodigo: r.codigoAer,
      aerEnunciado: r.enunciadoAer,
    });
    setPeiTargetIdAer(r.idAccion);
    setOpenPeiModal(true);
  };

  const openPeiViewModalForRow = async (r: PdrcOerAerAsignadoListDto) => {
    blurActiveElement();
    setPeiViewCtx({
      oerCodigo: r.codigoOer,
      oerEnunciado: r.enunciadoOer,
      aerCodigo: r.codigoAer,
      aerEnunciado: r.enunciadoAer,
    });
    setPeiViewTargetIdAer(r.idAccion);
    setOpenPeiViewModal(true);
  };

  const [peiCtx, setPeiCtx] = useState<{
    oerCodigo: string;
    oerEnunciado: string;
    aerCodigo: string;
    aerEnunciado: string;
  } | null>(null);

  const [peiViewCtx, setPeiViewCtx] = useState<{
    oerCodigo: string;
    oerEnunciado: string;
    aerCodigo: string;
    aerEnunciado: string;
  } | null>(null);

  const [peiTargetIdAer, setPeiTargetIdAer] = useState<number>(0);
  const [peiViewTargetIdAer, setPeiViewTargetIdAer] = useState<number>(0);

  const requestDeleteRow = (r: PdrcOerAerAsignadoListDto) => {
    blurActiveElement();
    setDeleteTarget(r);
    setOpenDeleteDlg(true);
  };

  const SHOW_ADD_BTNS_IN_TABLE = false;

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await PdrcOeAeAction.inactivarOerAer(deleteTarget.idOerAer);

      setSnack({
        open: true,
        severity: "success",
        message: `OER–AER inactivada: ${deleteTarget.codigoOer} / ${deleteTarget.codigoAer}`,
      });

      setOpenDeleteDlg(false);
      setDeleteTarget(null);

      await loadTabla(idUeParam, idCcSel, idPoiAnioSel, idPeriodoSel);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "No se pudo eliminar la asignación.";
      setSnack({ open: true, severity: "error", message: msg });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Paper
          sx={{
            p: 2,
            borderRadius: 4,
            border: "1px solid rgba(148,163,184,.24)",
            boxShadow: "0 18px 45px rgba(15,23,42,.06)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography sx={{ fontWeight: 800 }}>Cargando información POI...</Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        minHeight: "100vh",
        bgcolor: "linear-gradient(180deg, rgba(248,250,252,.92), rgba(255,255,255,1))",
      }}
    >
      {/* Header premium */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
          <IconButton
            onClick={() => navigate(-1)}
            aria-label="Volver"
            sx={{
              width: 46,
              height: 46,
              borderRadius: 3,
              border: "1px solid rgba(148,163,184,.28)",
              bgcolor: "rgba(255,255,255,.92)",
              boxShadow: "0 12px 26px rgba(15,23,42,.08)",
              "&:hover": { bgcolor: "rgba(239,246,255,.95)", transform: "translateY(-1px)" },
              transition: "all .18s ease",
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box minWidth={0}>
            <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: "-.03em", lineHeight: 1.05 }}>
              POI: OER / AER
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }} noWrap>
              {ueLabel}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
          <Chip
            size="small"
            label={`OER: ${oerAsignadosCount}`}
            sx={{
              fontWeight: 900,
              borderRadius: 999,
              color: "#047857",
              bgcolor: "rgba(16,185,129,.10)",
              border: "1px solid rgba(16,185,129,.35)",
            }}
          />
          <Chip
            size="small"
            label={`AER: ${aerAsignadosCount}`}
            sx={{
              fontWeight: 900,
              borderRadius: 999,
              color: "#6d28d9",
              bgcolor: "rgba(124,58,237,.10)",
              border: "1px solid rgba(124,58,237,.35)",
            }}
          />
          <Tooltip title="Refrescar">
            <IconButton
              onClick={onRefresh}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,.28)",
                bgcolor: "rgba(255,255,255,.92)",
                boxShadow: "0 8px 20px rgba(15,23,42,.06)",
                "&:hover": { bgcolor: "rgba(241,245,249,.95)", transform: "translateY(-1px)" },
              }}
            >
              <RefreshRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ver OER/AER asignadas" arrow>
            <span>
              <IconButton
                onMouseDown={(e) => e.currentTarget.blur()}
                onClick={() => setOpenOerAerModal(true)}
                disabled={!idPoiAnioSel || !idCcRespSel || !idCcSel || !idUeParam}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 3,
                  border: "1px solid rgba(59,130,246,.35)",
                  bgcolor: "rgba(59,130,246,.10)",
                  boxShadow: "0 8px 20px rgba(37,99,235,.10)",
                  transition: "all .15s ease",
                  "&:hover": { bgcolor: "rgba(59,130,246,.16)", transform: "translateY(-1px)" },
                  "&.Mui-disabled": { opacity: 0.45 },
                }}
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 20, color: "rgba(37,99,235,.95)" }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Paper
        sx={{
          p: { xs: 1.75, md: 2 },
          mb: 2.5,
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.24)",
          bgcolor: "rgba(255,255,255,.94)",
          boxShadow: "0 18px 45px rgba(15,23,42,.06)",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(59,130,246,.12)",
              color: "#2563eb",
            }}
          >
            <FilterAltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>Filtros de búsqueda</Typography>
            <Typography variant="caption" color="text.secondary">
              Ajusta el contexto para consultar la estructura POI y sus asociaciones.
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.45fr" }, gap: 1.5, mb: 1.5 }}>
          <Autocomplete
            options={periodos}
            value={periodoSelectedObj}
            onChange={onPeriodoChange}
            getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.descripcion ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idPeriodo === v.idPeriodo}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) => filterByCodigoDescripcion(options as any, state.inputValue)}
            ListboxProps={{ style: { maxHeight: 320 } }}
            renderInput={(params) => <TextField {...params} label="Periodo" placeholder="Buscar periodo..." size="small" />}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "rgba(248,250,252,.7)" } }}
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
            renderInput={(params) => (
              <TextField {...params} label="CC Responsable" placeholder="Buscar CC responsable..." size="small" />
            )}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "rgba(248,250,252,.7)" } }}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 900,
                      border: "1px solid rgba(148,163,184,.45)",
                      bgcolor: "rgba(248,250,252,.9)",
                      minWidth: 64,
                      textAlign: "center",
                    }}
                  >
                    {option.codigo ?? "—"}
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                    {option.descripcion ?? "—"}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "120px 1fr" }, gap: 1.5, mb: 1.5 }}>
          <Autocomplete
            options={anios}
            value={anioSelectedObj}
            onChange={onAnioChange}
            getOptionLabel={(o) => `${o.anio}`}
            isOptionEqualToValue={(o, v) => o.idPoiAnio === v.idPoiAnio}
            noOptionsText="Sin resultados"
            ListboxProps={{ style: { maxHeight: 240 } }}
            renderInput={(params) => <TextField {...params} label="Año" size="small" />}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "rgba(248,250,252,.7)" } }}
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
            renderInput={(params) => (
              <TextField {...params} label="Centro de Costo" placeholder="Buscar centro de costo..." size="small" />
            )}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "rgba(248,250,252,.7)" } }}
            renderOption={(props, option) => (
              <li {...props}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 900,
                      border: "1px solid rgba(148,163,184,.45)",
                      bgcolor: "rgba(248,250,252,.9)",
                      minWidth: 64,
                      textAlign: "center",
                    }}
                  >
                    {option.codigo ?? "—"}
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                    {option.nombre ?? "—"}
                  </Typography>
                </Box>
              </li>
            )}
          />
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
          <TextField
            value={qSearch}
            onChange={(e) => setQSearch(e.target.value)}
            placeholder="Buscar OER / AER (código o descripción)..."
            size="small"
            fullWidth
            InputProps={{ startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "text.secondary", fontSize: 19 }} /> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5, bgcolor: "rgba(255,255,255,.95)" } }}
          />
        </Stack>

        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
          <Chip size="small" label={`CC Resp: ${ccRespSelectedLabel}`} variant="outlined" sx={{ fontWeight: 800 }} />
          {ccSelectedObj && (
            <Chip
              size="small"
              label={`CC: ${ccSelectedObj.codigo ?? "—"} - ${ccSelectedObj.nombre ?? "—"}`}
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          )}
          {qSearch.trim() && <Chip size="small" label={`Búsqueda: ${qSearch.trim()}`} onDelete={() => setQSearch("")} />}
        </Stack>
      </Paper>

      {/* Estructura */}
      <Paper
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 4,
          border: "1px solid rgba(148,163,184,.24)",
          bgcolor: "rgba(255,255,255,.96)",
          boxShadow: "0 22px 55px rgba(15,23,42,.07)",
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(59,130,246,.12)",
              color: "#2563eb",
            }}
          >
            <AccountTreeRoundedIcon />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1.1 }}>Estructura OER / AER y detalle OEI / AEI</Typography>
            <Typography variant="caption" color="text.secondary">
              Usa los botones de expansión para revisar las relaciones institucionales asociadas.
            </Typography>
          </Box>
        </Stack>

        {loadingTabla ? (
          <Stack spacing={1.2}>
            <Skeleton variant="rounded" height={108} />
            <Skeleton variant="rounded" height={108} />
            <Skeleton variant="rounded" height={108} />
          </Stack>
        ) : rows.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            No hay OER/AER asignadas para la combinación seleccionada (Periodo + Año + UE + Centro de Costo).
          </Alert>
        ) : rowsFiltered.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            No se encontraron coincidencias con la búsqueda ingresada.
          </Alert>
        ) : (
          <Stack spacing={1.4}>
            {rowsFiltered.map((r) => {
              const resumen = peiResumenMap[r.idAccion] ?? { oei: 0, aei: 0 };
              const sinOeiAei = resumen.oei === 0 && resumen.aei === 0;

              const idKey = r.idAccion;
              const open = !!openRowMap[idKey];
              const detail = detailMap[idKey];

              return (
                <Paper
                  key={`${r.idOerAer}-${r.idAccion}`}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    borderColor: open ? "rgba(59,130,246,.55)" : "rgba(148,163,184,.26)",
                    bgcolor: open
                      ? "linear-gradient(135deg, rgba(239,246,255,.94), rgba(255,255,255,.98))"
                      : "rgba(255,255,255,.98)",
                    boxShadow: open ? "0 18px 42px rgba(37,99,235,.10)" : "0 10px 28px rgba(15,23,42,.045)",
                    transition: "all .18s ease",
                  }}
                >
                  <Box
                    sx={{
                      p: { xs: 1.25, md: 1.5 },
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "42px 58px 1fr",
                        md: "42px 66px minmax(180px, .85fr) minmax(180px, .95fr) 126px",
                      },
                      gap: { xs: 1, md: 1.5 },
                      alignItems: "center",
                    }}
                  >
                    <Tooltip title={open ? "Ocultar detalle" : "Ver detalle OEI/AEI"}>
                      <IconButton
                        size="small"
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2.2,
                          border: "1px solid",
                          borderColor: open ? "rgba(37,99,235,.38)" : "rgba(148,163,184,.32)",
                          bgcolor: open ? "rgba(219,234,254,.9)" : "rgba(255,255,255,.92)",
                          boxShadow: "0 8px 18px rgba(15,23,42,.06)",
                          "&:hover": { transform: "translateY(-1px)" },
                        }}
                        onMouseDown={(e) => e.currentTarget.blur()}
                        onClick={() => toggleRowDetail(r)}
                      >
                        {open ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20 }} /> : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </Tooltip>

                    <Chip
                      label="OER"
                      size="small"
                      sx={{
                        fontWeight: 950,
                        height: 28,
                        color: "#fff",
                        bgcolor: "#2563eb",
                        borderRadius: 2,
                      }}
                    />

                    <Box minWidth={0}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        Código OER
                      </Typography>
                      <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>{r.codigoOer}</Typography>
                      <Typography sx={{ fontWeight: 850, mt: 0.25, lineHeight: 1.25 }}>
                        {r.enunciadoOer}
                      </Typography>
                    </Box>

                    <Box minWidth={0} sx={{ gridColumn: { xs: "2 / 4", md: "auto" } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                        AER: {r.codigoAer}
                      </Typography>
                      <Typography sx={{ fontWeight: 850, lineHeight: 1.25 }}>{r.enunciadoAer}</Typography>
                    </Box>

                    <Stack direction="row" spacing={0.7} justifyContent={{ xs: "flex-start", md: "flex-end" }} alignItems="center" sx={{ gridColumn: { xs: "1 / 4", md: "auto" } }}>
                      <Chip
                        size="small"
                        label={`OEI: ${resumen.oei}`}
                        sx={{
                          fontWeight: 900,
                          color: "#1d4ed8",
                          bgcolor: "rgba(59,130,246,.10)",
                          border: "1px solid rgba(59,130,246,.30)",
                        }}
                      />
                      <Chip
                        size="small"
                        label={`AEI: ${resumen.aei}`}
                        sx={{
                          fontWeight: 900,
                          color: "#6d28d9",
                          bgcolor: "rgba(124,58,237,.10)",
                          border: "1px solid rgba(124,58,237,.30)",
                        }}
                      />
                      <Tooltip title="Ver OEI/AEI asignadas">
                        <span style={{ display: "inline-flex" }}>
                          <IconButton
                            sx={{ ...actionIconBtnSx("info"), width: 34, height: 34 }}
                            onMouseDown={(e) => e.currentTarget.blur()}
                            onClick={() => openPeiViewModalForRow(r)}
                            disabled={sinOeiAei}
                          >
                            <QueryStatsRoundedIcon sx={{ fontSize: 19 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {SHOW_ADD_BTNS_IN_TABLE && (
                        <>
                          <Tooltip
                            title={
                              sinOeiAei
                                ? "Eliminar OER - AER (borrado lógico)"
                                : "No se puede eliminar: existen OEI/AEI asignadas."
                            }
                          >
                            <span style={{ display: "inline-flex" }}>
                              <IconButton
                                sx={dangerBtnSx(!sinOeiAei)}
                                onMouseDown={(e) => e.currentTarget.blur()}
                                onClick={() => requestDeleteRow(r)}
                                disabled={!sinOeiAei}
                              >
                                <DeleteOutlineRoundedIcon
                                  sx={{ fontSize: 18, color: !sinOeiAei ? "rgba(239,68,68,.55)" : "rgba(239,68,68,.95)" }}
                                />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Agregar AER al OER (PDRC)">
                            <IconButton sx={actionIconBtnSx("primary")} onMouseDown={(e) => e.currentTarget.blur()} onClick={() => openAerModalForRow(r)}>
                              <AddCircleRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Agregar OEI - AEI (PEI)">
                            <IconButton sx={peiTealBtnSx()} onMouseDown={(e) => e.currentTarget.blur()} onClick={() => openPeiModalForRow(r)}>
                              <AddCircleRoundedIcon sx={{ fontSize: 18, color: "rgba(16,185,129,.95)" }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </Box>

                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ p: { xs: 1.25, md: 1.5 }, pt: 0 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.4,
                          borderRadius: 3,
                          borderColor: "rgba(59,130,246,.26)",
                          bgcolor: "rgba(248,250,252,.80)",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2.2,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: "rgba(37,99,235,.12)",
                                color: "#2563eb",
                              }}
                            >
                              <HubRoundedIcon fontSize="small" />
                            </Box>
                            <Box minWidth={0}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
                                Detalle OEI – AEI
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                AER: {r.codigoAer} – {r.enunciadoAer}
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack direction="row" spacing={1} alignItems="center">
                            <Stack spacing={0.6} alignItems="flex-end" sx={{ display: { xs: "none", sm: "flex" } }}>
                              <Chip size="small" variant="outlined" label={`CC Resp: ${ccRespSelectedLabel}`} sx={{ height: 22, borderRadius: 2, "& .MuiChip-label": { fontSize: 11 } }} />
                              <Chip size="small" variant="outlined" label={`CC: ${ccSelectedObj?.codigo ?? "—"} - ${ccSelectedObj?.nombre ?? "—"}`} sx={{ height: 22, borderRadius: 2, "& .MuiChip-label": { fontSize: 11 } }} />
                            </Stack>

                            <Tooltip title="Recargar detalle">
                              <IconButton
                                size="small"
                                onMouseDown={(e) => e.currentTarget.blur()}
                                onClick={() => reloadRowDetail(r)}
                                sx={{ borderRadius: 2, border: "1px solid", borderColor: "rgba(148,163,184,.35)", bgcolor: "#fff" }}
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
                          <Alert severity="info" sx={{ borderRadius: 2 }}>No hay OEI/AEI para este AER con el Centro de Costo seleccionado.</Alert>
                        ) : (
                          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "rgba(59,130,246,.08)" }}>
                                  <TableCell sx={{ fontWeight: 950, width: 120, color: "#1d4ed8" }}>Código OEI</TableCell>
                                  <TableCell sx={{ fontWeight: 950, color: "#1d4ed8" }}>Objetivo Estratégico Institucional</TableCell>
                                  <TableCell sx={{ fontWeight: 950, width: 120, color: "#6d28d9" }}>Código AEI</TableCell>
                                  <TableCell sx={{ fontWeight: 950, color: "#6d28d9" }}>Acción Estratégica Institucional</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {detail.data.map((d) => (
                                  <TableRow key={`${d.idOei}-${d.idAei ?? 0}`} hover>
                                    <TableCell sx={{ fontWeight: 900 }}>{d.oeiCodigo ?? "—"}</TableCell>
                                    <TableCell>{d.oeiEnunciado ?? "—"}</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>{d.aeiCodigo ?? "—"}</TableCell>
                                    <TableCell>{d.aeiEnunciado ?? "—"}</TableCell>
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

      <Dialog open={openDeleteDlg} onClose={() => (deleting ? null : setOpenDeleteDlg(false))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Eliminar OER - AER</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            Se inactivará la asignación (borrado lógico). Esta acción es auditable y reversible.
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(0,0,0,.02)",
            }}
          >
            <Typography sx={{ fontWeight: 900 }}>
              {deleteTarget ? `${deleteTarget.codigoOer} / ${deleteTarget.codigoAer}` : "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {deleteTarget ? deleteTarget.enunciadoOer : "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {deleteTarget ? deleteTarget.enunciadoAer : "—"}
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "rgba(239,68,68,.35)",
              bgcolor: "rgba(239,68,68,.06)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              ¿Qué hará el sistema?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - Se actualizará el estado en <b>poi_oer_aer</b> a <b>INACTIVO</b>.
              <br />- No se elimina físicamente, por lo que es <b>auditable</b> y <b>reversible</b>.
              <br />- Si existieran OEI/AEI activas, el backend <b>bloqueará</b> la acción.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDlg(false)} disabled={deleting} sx={{ fontWeight: 800 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={confirmDelete}
            disabled={deleting}
            sx={{
              fontWeight: 900,
              borderRadius: 2,
              bgcolor: "rgba(239,68,68,.95)",
              "&:hover": { bgcolor: "rgba(220,38,38,.95)" },
            }}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

      <PdrcOerAerModal
        open={openOerAerModal}
        onClose={() => setOpenOerAerModal(false)}
        idUe={idUeParam}
        idCc={idCcSel}
        idPoiAnio={idPoiAnioSel}
        idPeriodo={idPeriodoSel}
        unidadLabel={ccRespSelectedLabel}
        onSaved={async () => {
          setOpenOerAerModal(false);
          await loadTabla(idUeParam, idCcSel, idPoiAnioSel, idPeriodoSel);
        }}
      />

      <PdrcAerModal
        open={openAerModal}
        onClose={() => setOpenAerModal(false)}
        idUe={idUeParam}
        idCc={idCcSel}
        idPoiAnio={idPoiAnioSel}
        idPeriodo={idPeriodoSel}
        oer={oerRowForAer}
        unidadLabel={ccRespSelectedLabel}
        onSaved={async () => {
          setOpenAerModal(false);
          await loadTabla(idUeParam, idCcSel, idPoiAnioSel, idPeriodoSel);
        }}
      />

      <PeiOeiAeiModal
        open={openPeiModal}
        onClose={() => setOpenPeiModal(false)}
        idAer={peiTargetIdAer}
        idCc={idCcSel}
        titulo="AGREGAR OEI - AEI"
        mode="edit"
        oerCodigo={peiCtx?.oerCodigo}
        oerEnunciado={peiCtx?.oerEnunciado}
        aerCodigo={peiCtx?.aerCodigo}
        aerEnunciado={peiCtx?.aerEnunciado}
        onSaved={async () => {
          await loadTabla(idUeParam, idCcSel, idPoiAnioSel, idPeriodoSel);
          setOpenPeiModal(false);
        }}
      />

      <PeiOeiAeiModal
        open={openPeiViewModal}
        onClose={() => setOpenPeiViewModal(false)}
        idAer={peiViewTargetIdAer}
        idCc={idCcSel}
        titulo="VER OEI - AEI ASIGNADAS"
        mode="view"
        oerCodigo={peiViewCtx?.oerCodigo}
        oerEnunciado={peiViewCtx?.oerEnunciado}
        aerCodigo={peiViewCtx?.aerCodigo}
        aerEnunciado={peiViewCtx?.aerEnunciado}
      />
    </Box>
  );
}