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

import PeiOeiAeiResumenModal from "../components/PeiOeiAeiResumenModal";
import PeiOeiAeiAoDetalleModal from "../components/PeiOeiAeiAoDetalleModal";
import PeiAoIndicadoresModal from "../components/PeiAoIndicadoresModal";

import { UnidadEjecutoraAction } from "../UnidadEjecutoraAction";
import {
  PeiOeiAeiAOAction,
  type PoiAnioDto,
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
  const [anios, setAnios] = useState<PoiAnioDto[]>([]);
  const [idPoiAnioSel, setIdPoiAnioSel] = useState<number>(0);

  const [ccRespList, setCcRespList] = useState<CcResponsableDto[]>([]);
  const [idCcRespSel, setIdCcRespSel] = useState<number>(0);

  const [ccList, setCcList] = useState<CentroCostoDto[]>([]);
  const [idCcSel, setIdCcSel] = useState<number>(0);

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
  async function loadTabla(idUeLocal: number, idCc: number, idPoiAnio: number) {
    if (!idUeLocal || !idCc || !idPoiAnio) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    try {
      const data = await PeiOeiAeiAOAction.getMaster(idUeLocal, idCc, idPoiAnio);
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

    await loadTabla(idUeParam, firstCc, idPoiAnioSel);
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

    await loadTabla(idUeParam, newCc, idPoiAnioSel);
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
    await loadTabla(idUeParam, idCcSel, idPoiAnioSel);
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

  // === estilos sticky para Acción (móvil/angosto) ===
  const sxStickyActionHeader = {
    position: "sticky" as const,
    right: 0,
    zIndex: 3,
    bgcolor: "background.paper",
    boxShadow: "-8px 0 12px rgba(0,0,0,.05)",
  };

  const sxStickyActionCell = {
    position: "sticky" as const,
    right: 0,
    zIndex: 2,
    bgcolor: "background.paper",
    boxShadow: "-8px 0 12px rgba(0,0,0,.05)",
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              POI: OEI / AEI / AO PeiOeiAeiAoPage.tsx
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ueLabel}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`OEI: ${oeiCount}`} variant="outlined" />
          <Chip label={`AEI: ${aeiCount}`} variant="outlined" />

          <Tooltip title="Refrescar" arrow>
            <IconButton onMouseDown={(e) => e.currentTarget.blur()} onClick={onRefresh}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>

          {/* Ojito superior: resumen OEI/AEI */}
          <Tooltip title="Ver resumen OEI/AEI" arrow>
            <IconButton
              onMouseDown={(e) => e.currentTarget.blur()}
              onClick={() => setOpenResumenModal(true)}
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "rgba(59,130,246,.35)",
                bgcolor: "rgba(59,130,246,.12)",
                boxShadow: "0 10px 25px rgba(0,0,0,.08)",
                transition: "all .15s ease",
                "&:hover": { bgcolor: "rgba(59,130,246,.18)", transform: "translateY(-1px)" },
              }}
            >
              <VisibilityOutlinedIcon sx={{ fontSize: 22, color: "rgba(37,99,235,.95)" }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filter Card */}
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
        <Stack direction="row" spacing={2} sx={{ width: "100%", mb: 2 }}>
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
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="CC Responsable" size="small" placeholder="Buscar CC responsable…" />
            )}
            sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
          />
        </Stack>

        <Stack direction="row" sx={{ width: "100%" }}>
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
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Centro de Costo" size="small" placeholder="Buscar centro de costo…" />
            )}
            sx={{ width: "100%", "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary">
          CC Responsable seleccionado: <b>{ccRespSelectedLabel}</b>
        </Typography>

        <TextField
          value={qSearch}
          onChange={(e) => setQSearch(e.target.value)}
          placeholder="Buscar OEI / AEI (código o enunciado)..."
          size="small"
          fullWidth
          sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
        />
      </Paper>

      {/* Tabla master */}
      <TableContainer
        sx={{
          mt: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 110 }} />
              <TableCell sx={{ fontWeight: 900, width: 120 }}>Código OEI</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Enunciado OEI</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 120 }}>Código AEI</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Enunciado AEI</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 180, ...sxStickyActionHeader }} align="right">
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
                    <Typography variant="body2">Cargando OEI/AEI...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rowsFiltered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Alert severity="info" sx={{ borderRadius: 2, width: "100%" }}>
                    No hay registros para la combinación seleccionada (Año + UE + CC Responsable + Centro de costo).
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              rowsFiltered.map((r) => {
                const idKey = r.idAei;
                const open = !!openRowMap[idKey];
                const detail = detailMap[idKey];

                return (
                  <React.Fragment key={`${r.idOei}-${r.idAei}`}>
                    <TableRow hover>
                      <TableCell sx={{ width: 110 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Tooltip title={open ? "Ocultar detalle" : "Ver AO del AEI"} arrow>
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.currentTarget.blur()}
                              onClick={() => toggleRowDetail(r)}
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
                            >
                              {open ? (
                                <KeyboardArrowUpRoundedIcon sx={{ fontSize: 20 }} />
                              ) : (
                                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 20 }} />
                              )}
                            </IconButton>
                          </Tooltip>

                          <Chip
                            size="small"
                            variant="outlined"
                            label={`AO: ${r.totalAo ?? 0}`}
                            sx={{
                              height: 20,
                              borderRadius: 2,
                              fontWeight: 900,
                              "& .MuiChip-label": { px: 0.75, fontSize: 11 },
                            }}
                          />
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900 }}>{r.oeiCodigo}</TableCell>
                      <TableCell sx={{ whiteSpace: "normal", wordBreak: "normal", overflowWrap: "break-word" }}>
                        {r.oeiEnunciado}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>{r.aeiCodigo}</TableCell>
                      <TableCell sx={{ whiteSpace: "normal", wordBreak: "normal", overflowWrap: "break-word" }}>
                        {r.aeiEnunciado}
                      </TableCell>

                      <TableCell align="right" sx={{ verticalAlign: "top", width: 180, ...sxStickyActionCell }}>
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
                          <Chip
                            size="small"
                            label={`AO: ${r.totalAo ?? 0}`}
                            variant="outlined"
                            sx={{ fontWeight: 900, height: 20, "& .MuiChip-label": { px: 0.75, fontSize: 11 } }}
                          />
                          <Tooltip title="Ver OER / AER" arrow>
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.currentTarget.blur()}
                              onClick={() => openOerAerFromMaster(r)}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "rgba(59,130,246,.10)",
                                boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                                transition: "all .15s ease",
                                "&:hover": { transform: "translateY(-1px)", bgcolor: "rgba(59,130,246,.16)" },
                              }}
                            >
                              <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* Detail */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: "background.default" }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                              <Stack spacing={0.25}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                  Detalle Actividad Operativa
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  AEI: {r.aeiCodigo} — {r.aeiEnunciado}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={1} alignItems="center">
                                <Stack spacing={0.6} alignItems="flex-end">
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`CC Resp: ${ccRespSelectedLabel}`}
                                    sx={{ height: 22, "& .MuiChip-label": { fontSize: 11 } }}
                                  />
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    label={`CC: ${ccSelectedObj?.codigo ?? "—"} - ${ccSelectedObj?.nombre ?? "—"}`}
                                    sx={{ height: 22, "& .MuiChip-label": { fontSize: 11 } }}
                                  />
                                </Stack>

                                <Tooltip title="Recargar detalle" arrow>
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
                                No hay Actividades Operativas registradas para este AEI.
                              </Alert>
                            ) : (
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 900, width: 170 }}>Nro Registro POI</TableCell>
                                      <TableCell sx={{ fontWeight: 900, width: 170 }}>Código AO</TableCell>
                                      <TableCell sx={{ fontWeight: 900 }}>Actividad Operativa</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 900, width: 120 }}>
                                        Acción
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>

                                  <TableBody>
                                    {detail.data.map((d) => (
                                      <TableRow key={d.idOeiAeiAo} hover>
                                        <TableCell sx={{ fontWeight: 900 }}>{d.nroRegistroPoi}</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>{d.codigoAo}</TableCell>
                                        <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                                          {d.nombreAo}
                                        </TableCell>

                                        <TableCell align="right">
                                          {/* Ojito: detalle AO */}
                                          <Tooltip title="Ver detalle AO" arrow>
                                            <IconButton
                                              size="small"
                                              onMouseDown={(e) => e.currentTarget.blur()}
                                              onClick={() => openDetalleAo(d.idOeiAeiAo, r)}
                                              sx={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 2,
                                                border: "1px solid",
                                                borderColor: "divider",
                                                bgcolor: "rgba(59,130,246,.10)",
                                                "&:hover": {
                                                  bgcolor: "rgba(59,130,246,.20)",
                                                  borderColor: "rgba(59,130,246,.5)",
                                                },
                                              }}
                                            >
                                              <VisibilityOutlinedIcon sx={{ fontSize: 18, color: "rgba(37,99,235,.95)" }} />
                                            </IconButton>
                                          </Tooltip>

                                          {/* ✅ NUEVO: Indicadores */}
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
        width: 30,
        height: 30,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "rgba(59,130,246,.10)",
        ml: 0.75,
        "&:hover": {
          bgcolor: "rgba(59,130,246,.20)",
          borderColor: "rgba(59,130,246,.5)",
        },
      }}
    >
      <BarChartRoundedIcon sx={{ fontSize: 18, color: "rgba(37,99,235,.95)" }} />
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