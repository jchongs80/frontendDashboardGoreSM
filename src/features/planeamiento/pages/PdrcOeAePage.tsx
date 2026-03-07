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
  Divider,
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
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";


import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { UnidadEjecutoraAction } from "../UnidadEjecutoraAction";
import { PdrcOeAeAction } from "../PdrcOeAeAction";
import type {
  PdrcOerAerAsignadoListDto,
  CcResponsableDto,
  CentroCostoDto,
  PoiAnioDto,
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

  async function loadTabla(idUeLocal: number, idCc: number, idPoiAnio: number) {
    if (!idUeLocal || !idCc || !idPoiAnio) {
      setRows([]);
      setPeiResumenMap({});
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    try {
      const data = await PdrcOeAeAction.getAsignacionesOerAer(idUeLocal, idCc, idPoiAnio);
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

    await loadTabla(idUeParam, firstCc, idPoiAnioSel);
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

  const onAnioChange = async (_event: React.SyntheticEvent, newValue: PoiAnioDto | null) => {
    const newId = newValue?.idPoiAnio ?? 0;
    setIdPoiAnioSel(newId);

    await loadTabla(idUeParam, idCcSel, newId);
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

    await loadTabla(idUeParam, newCc, idPoiAnioSel);
  };

  const onRefresh = async () => {
    await loadTabla(idUeParam, idCcSel, idPoiAnioSel);
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

      await loadTabla(idUeParam, idCcSel, idPoiAnioSel);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : "No se pudo eliminar la asignación.";
      setSnack({ open: true, severity: "error", message: msg });
    } finally {
      setDeleting(false);
    }
  };

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
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              POI: OER / AER
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ueLabel}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`OER: ${oerAsignadosCount}`} variant="outlined" />
          <Chip label={`AER: ${aerAsignadosCount}`} variant="outlined" />
          <Tooltip title="Refrescar">
            <IconButton onClick={onRefresh}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
<Tooltip title="Ver OER/AER asignadas" arrow>
  <span>
    <IconButton
      onMouseDown={(e) => e.currentTarget.blur()}
      onClick={() => setOpenOerAerModal(true)}
      disabled={!idPoiAnioSel || !idCcRespSel || !idCcSel || !idUeParam}
      sx={{
        width: 44,
        height: 44,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "rgba(59,130,246,.35)",
        bgcolor: "rgba(59,130,246,.12)",
        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
        transition: "all .15s ease",
        mr: 0.5,
        "&:hover": {
          bgcolor: "rgba(59,130,246,.18)",
          transform: "translateY(-1px)",
        },
        "&.Mui-disabled": {
          opacity: 0.45,
          borderColor: "rgba(59,130,246,.18)",
          bgcolor: "rgba(59,130,246,.06)",
        },
      }}
    >
      <VisibilityOutlinedIcon sx={{ fontSize: 22, color: "rgba(37,99,235,.95)" }} />
    </IconButton>
  </span>
</Tooltip>
        </Stack>
      </Stack>

      <Paper
      sx={{
        mt: 2,
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 30px rgba(0,0,0,.06)",
      }}
    >
        {/* Fila 1: Año + CC Responsable */}
        <Stack direction="row" spacing={2} sx={{ width: "100%", mb: 2 }}>
          {/* ✅ Año */}
          <Autocomplete
            options={anios}
            value={anioSelectedObj}
            onChange={onAnioChange}
            getOptionLabel={(o) => `${o.anio}`}
            isOptionEqualToValue={(o, v) => o.idPoiAnio === v.idPoiAnio}
            noOptionsText="Sin resultados"
            ListboxProps={{ style: { maxHeight: 240 } }}
            renderInput={(params) => <TextField {...params} label="Año" size="small" />}
            sx={{
              width: { xs: 120, md: 120 },
              flex: "0 0 120px",
              "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
            }}
          />

          {/* ✅ CC Responsable */}
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
            sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
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
                    border: "1px solid",
                    borderColor: "rgba(77, 77, 77, 0.35)",
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    color: "rgba(0, 0, 0, 0.95)",
                    minWidth: 64,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {option.codigo ?? "—"}
                </Box>

      <Typography variant="body2" sx={{ fontWeight: 400, lineHeight: 1.2 }}>
        {option.descripcion ?? "—"}
      </Typography>
    </Box>
  </li>
)}
          />
        </Stack>

        {/* Fila 2: Centro de Costo */}
        <Stack direction="row" sx={{ width: "100%" }}>
          {/* ✅ Centro de Costo */}
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
            sx={{ width: "100%", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
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
                    border: "1px solid",
                    borderColor: "rgba(77, 77, 77, 0.35)",
                              bgcolor: "rgba(255, 255, 255, 0.1)",
                              color: "rgba(0, 0, 0, 0.95)",
                    minWidth: 64,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {option.codigo ?? "—"}
                </Box>
      <Typography variant="body2" sx={{ fontWeight: 400, lineHeight: 1.2 }}>
        {option.nombre ?? "—"}
      </Typography>
    </Box>
  </li>
)}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary">
          CC Responsable seleccionado: <b>{ccRespSelectedLabel}</b>
        </Typography>

        <TextField
          value={qSearch}
          onChange={(e) => setQSearch(e.target.value)}
          placeholder="Buscar OER / AER (código o descripción)..."
          size="small"
          fullWidth
          sx={{
            mt: 2,
            mb: 1,
            "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
          }}
        />

        <TableContainer sx={{ mt: 2, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 42 }} />
                <TableCell sx={{ fontWeight: 800 }}>Código OER</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Descripción OER</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Código AER</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Descripción AER</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, width: 170 }}>
                  Acción
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loadingTabla ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CircularProgress size={18} />
                      <Typography variant="body2">Cargando asignaciones...</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No hay OER/AER asignadas para la combinación seleccionada (Año + UE + Centro de Costo).
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                rowsFiltered.map((r) => {
                  const resumen = peiResumenMap[r.idAccion] ?? { oei: 0, aei: 0 };
                  const sinOeiAei = resumen.oei === 0 && resumen.aei === 0;

                  const idKey = r.idAccion; // AER
                  const open = !!openRowMap[idKey];
                  const detail = detailMap[idKey];

                  return (
                    <React.Fragment key={`${r.idOerAer}-${r.idAccion}`}>
                      <TableRow hover>
                        <TableCell sx={{ width: 42 }}>
                          <Tooltip title={open ? "Ocultar detalle" : "Ver detalle OEI/AEI"}>
                            <IconButton
                              size="small"
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: open ? "action.hover" : "transparent",
                                boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                                transition: "all .15s ease",
                                "&:hover": { transform: "translateY(-1px)" },
                              }}
                              onMouseDown={(e) => e.currentTarget.blur()}
                              onClick={() => toggleRowDetail(r)}
                            >
                              {open ? (
                                <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20 }} />
                              ) : (
                                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>

                        <TableCell sx={{ fontWeight: 800 }}>{r.codigoOer}</TableCell>
                        <TableCell>{r.enunciadoOer}</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>{r.codigoAer}</TableCell>
                        <TableCell>{r.enunciadoAer}</TableCell>

                        <TableCell align="right" sx={{ verticalAlign: "top" }}>
                          <Stack direction="column" spacing={0.75} alignItems="flex-end">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
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
                                          sx={{
                                            fontSize: 18,
                                            color: !sinOeiAei ? "rgba(239,68,68,.55)" : "rgba(239,68,68,.95)",
                                          }}
                                        />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </>
                              )}
                            <Stack direction="row" spacing={0.6} justifyContent="flex-end" alignItems="center" flexWrap="wrap">
                              <Chip
                                size="small"
                                label={`OEI: ${resumen.oei}`}
                                variant="outlined"
                                sx={{ fontWeight: 900, height: 20, "& .MuiChip-label": { px: 0.75, fontSize: 11 } }}
                              />

                              <Chip
                                size="small"
                                label={`AEI: ${resumen.aei}`}
                                variant="outlined"
                                sx={{ fontWeight: 900, height: 20, "& .MuiChip-label": { px: 0.75, fontSize: 11 } }}
                              />
                            </Stack>
                              <Tooltip title="Ver OEI/AEI asignadas">
                                <span style={{ display: "inline-flex" }}>
                                  <IconButton
                                    sx={actionIconBtnSx("info")}
                                    onMouseDown={(e) => e.currentTarget.blur()}
                                    onClick={() => openPeiViewModalForRow(r)}
                                    disabled={sinOeiAei}
                                  >
                                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>

                            <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
                              {SHOW_ADD_BTNS_IN_TABLE && (
                                  <>
                                  <Tooltip title="Agregar AER al OER (PDRC)">
                                    <IconButton
                                      sx={actionIconBtnSx("primary")}
                                      onMouseDown={(e) => e.currentTarget.blur()}
                                      onClick={() => openAerModalForRow(r)}
                                    >
                                      <AddCircleRoundedIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Agregar OEI - AEI (PEI)">
                                    <IconButton
                                      sx={peiTealBtnSx()}
                                      onMouseDown={(e) => e.currentTarget.blur()}
                                      onClick={() => openPeiModalForRow(r)}
                                    >
                                      <AddCircleRoundedIcon sx={{ fontSize: 18, color: "rgba(16,185,129,.95)" }} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>

                          </Stack>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                          <Collapse in={open} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: "background.default" }}>
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                <Stack spacing={0.25}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                    Detalle OEI – AEI
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    AER: {r.codigoAer} – {r.enunciadoAer}
                                  </Typography>
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="center">
  {/* chips en columna (CC Resp arriba, CC abajo) */}
  <Stack spacing={0.6} alignItems="flex-end">
    <Chip
      size="small"
      variant="outlined"
      label={`CC Resp: ${ccRespSelectedLabel}`}
      sx={{
        height: 22,
        borderRadius: 2,
        "& .MuiChip-label": { fontSize: 11 },
      }}
    />

    <Chip
      size="small"
      variant="outlined"
      label={`CC: ${ccSelectedObj?.codigo ?? "—"} - ${ccSelectedObj?.nombre ?? "—"}`}
      sx={{
        height: 22,
        borderRadius: 2,
        "& .MuiChip-label": { fontSize: 11 },
      }}
    />
  </Stack>

  <Tooltip title="Recargar detalle">
    <IconButton
      size="small"
      onMouseDown={(e) => e.currentTarget.blur()}
      onClick={() => reloadRowDetail(r)}
      sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}
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
                                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                  {detail.error}
                                </Alert>
                              ) : !detail?.data || detail.data.length === 0 ? (
                                <Alert severity="info" sx={{ borderRadius: 2 }}>
                                  No hay OEI/AEI para este AER con el Centro de Costo seleccionado.
                                </Alert>
                              ) : (
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 900, width: 120 }}>Código OEI</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Enunciado OEI</TableCell>
                                        <TableCell sx={{ fontWeight: 900, width: 120 }}>Código AEI</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>Enunciado AEI</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {detail.data.map((d) => (
                                        <TableRow key={`${d.idOei}-${d.idAei ?? 0}`}>
                                          <TableCell sx={{ fontWeight: 800 }}>{d.oeiCodigo ?? "—"}</TableCell>
                                          <TableCell>{d.oeiEnunciado ?? "—"}</TableCell>
                                          <TableCell sx={{ fontWeight: 800 }}>{d.aeiCodigo ?? "—"}</TableCell>
                                          <TableCell>{d.aeiEnunciado ?? "—"}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
        unidadLabel={ccRespSelectedLabel}
        onSaved={async () => {
          setOpenOerAerModal(false);
          await loadTabla(idUeParam, idCcSel, idPoiAnioSel);
        }}
      />

      <PdrcAerModal
        open={openAerModal}
        onClose={() => setOpenAerModal(false)}
        idUe={idUeParam}
        idCc={idCcSel}
        idPoiAnio={idPoiAnioSel}
        oer={oerRowForAer}
        unidadLabel={ccRespSelectedLabel}
        onSaved={async () => {
          setOpenAerModal(false);
          await loadTabla(idUeParam, idCcSel, idPoiAnioSel);
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
          await loadTabla(idUeParam, idCcSel, idPoiAnioSel);
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