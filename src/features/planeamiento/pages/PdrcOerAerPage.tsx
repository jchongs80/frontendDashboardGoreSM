import React, { useEffect, useMemo, useState } from "react";
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
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";

import { useNavigate } from "react-router-dom";
import {
  PdrcOerAerVistaAction,
  type PdrcPeriodoDto,
  type PdrcDimensionDto,
  type PdrcUnidadOrgDto,
  type PdrcOerAerMasterDto,
  type PdrcOerAerDetailDto,
} from "../PdrcOerAerVistaAction";
import PdrcIndicadorDetalleModal from "../components/PdrcIndicadorDetalleModal";

type DetailState = {
  loading: boolean;
  data: PdrcOerAerDetailDto[];
  error?: string;
};

type IndicadorModalState = {
  open: boolean;
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  codigoOer: string;
  enunciadoOer: string;
  codigoAer: string;
  enunciadoAer: string;
};

export default function PdrcOerAerPage(): React.ReactElement {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTabla, setLoadingTabla] = useState<boolean>(false);

  const [periodos, setPeriodos] = useState<PdrcPeriodoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<PdrcDimensionDto[]>([]);
  const [unidades, setUnidades] = useState<PdrcUnidadOrgDto[]>([]);

  const [idPeriodoSel, setIdPeriodoSel] = useState<number>(0);
  const [idDimensionSel, setIdDimensionSel] = useState<number>(0);
  const [idUnidadSel, setIdUnidadSel] = useState<number>(0);

  const [rows, setRows] = useState<PdrcOerAerMasterDto[]>([]);
  const [qSearch, setQSearch] = useState<string>("");

  const [openRowMap, setOpenRowMap] = useState<Record<number, boolean>>({});
  const [detailMap, setDetailMap] = useState<Record<number, DetailState>>({});

  const [indicadorModal, setIndicadorModal] = useState<IndicadorModalState>({
    open: false,
    idPdrcOerAer: 0,
    idIndicadorNombre: 0,
    codigoIndicador: "",
    nombreIndicador: "",
    codigoOer: "",
    enunciadoOer: "",
    codigoAer: "",
    enunciadoAer: "",
  });

  const periodoSelectedObj = useMemo(
    () => periodos.find((x) => x.idPeriodo === idPeriodoSel) ?? null,
    [periodos, idPeriodoSel]
  );

  const dimensionSelectedObj = useMemo(
    () => dimensiones.find((x) => x.idDimension === idDimensionSel) ?? null,
    [dimensiones, idDimensionSel]
  );

  const unidadSelectedObj = useMemo(
    () => unidades.find((x) => x.idUnidad === idUnidadSel) ?? null,
    [unidades, idUnidadSel]
  );

  const rowsFiltered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      `${r.codigoOer ?? ""} ${r.enunciadoOer ?? ""} ${r.codigoAer ?? ""} ${r.enunciadoAer ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, qSearch]);

  const oerCount = useMemo(() => {
    const ids = new Set(rows.map((x) => x.idObjetivo));
    return ids.size;
  }, [rows]);

  const aerCount = useMemo(() => rows.length, [rows]);

  const getIndicadoresCount = (row: PdrcOerAerMasterDto): number => {
    return row.cantidadIndicadores ?? 0;
  };

  const filterByTexto = <
    T extends { codigo: string | null; descripcion?: string | null; nombre?: string | null }
  >(
    options: readonly T[],
    inputValue: string
  ): T[] => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options.slice() as T[];

    return options.filter((o) =>
      `${o.codigo ?? ""} ${o.descripcion ?? ""} ${o.nombre ?? ""}`
        .toLowerCase()
        .includes(q)
    ) as T[];
  };

  async function loadCombos() {
    setLoading(true);
    try {
      const [periodosDb, dimensionesDb, unidadesDb] = await Promise.all([
        PdrcOerAerVistaAction.getPeriodos(),
        PdrcOerAerVistaAction.getDimensiones(),
        PdrcOerAerVistaAction.getUnidadesOrganizacionales(),
      ]);

      setPeriodos(periodosDb ?? []);
      setDimensiones(dimensionesDb ?? []);
      setUnidades(unidadesDb ?? []);

      setIdPeriodoSel(periodosDb?.[0]?.idPeriodo ?? 0);
      setIdDimensionSel(dimensionesDb?.[0]?.idDimension ?? 0);
      setIdUnidadSel(unidadesDb?.[0]?.idUnidad ?? 0);
    } catch (e) {
      console.error(e);
      setPeriodos([]);
      setDimensiones([]);
      setUnidades([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadTabla(idPeriodo: number, idDimension: number, idUnidad: number) {
    if (!idPeriodo || !idDimension || !idUnidad) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    try {
      const data = await PdrcOerAerVistaAction.getMaster(idPeriodo, idDimension, idUnidad);
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

  async function toggleRowDetail(r: PdrcOerAerMasterDto) {
    const idKey = r.idPdrcOerAer;

    setOpenRowMap((prev) => ({
      ...prev,
      [idKey]: !prev[idKey],
    }));

    if (detailMap[idKey]?.data?.length || detailMap[idKey]?.loading) return;

    try {
      setDetailMap((prev) => ({
        ...prev,
        [idKey]: { loading: true, data: [] },
      }));

      const data = await PdrcOerAerVistaAction.getDetail(idKey);

      setDetailMap((prev) => ({
        ...prev,
        [idKey]: { loading: false, data: data ?? [] },
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo cargar el detalle.";
      setDetailMap((prev) => ({
        ...prev,
        [idKey]: { loading: false, data: [], error: msg },
      }));
    }
  }

  async function reloadRowDetail(idPdrcOerAer: number) {
    try {
      setDetailMap((prev) => ({
        ...prev,
        [idPdrcOerAer]: { loading: true, data: [] },
      }));

      const data = await PdrcOerAerVistaAction.getDetail(idPdrcOerAer);

      setDetailMap((prev) => ({
        ...prev,
        [idPdrcOerAer]: { loading: false, data: data ?? [] },
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo recargar el detalle.";
      setDetailMap((prev) => ({
        ...prev,
        [idPdrcOerAer]: { loading: false, data: [], error: msg },
      }));
    }
  }

  async function onRefresh() {
    await loadTabla(idPeriodoSel, idDimensionSel, idUnidadSel);
  }

  function openIndicadorModal(row: PdrcOerAerMasterDto, indicador: PdrcOerAerDetailDto) {
    setIndicadorModal({
      open: true,
      idPdrcOerAer: row.idPdrcOerAer,
      idIndicadorNombre: indicador.idIndicadorNombre,
      codigoIndicador: indicador.codigoIndicador,
      nombreIndicador: indicador.nombreIndicador,
      codigoOer: row.codigoOer,
      enunciadoOer: row.enunciadoOer,
      codigoAer: row.codigoAer,
      enunciadoAer: row.enunciadoAer,
    });
  }

  useEffect(() => {
    void loadCombos();
  }, []);

  useEffect(() => {
    if (!loading && idPeriodoSel && idDimensionSel && idUnidadSel) {
      void loadTabla(idPeriodoSel, idDimensionSel, idUnidadSel);
    }
  }, [loading, idPeriodoSel, idDimensionSel, idUnidadSel]);

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
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => navigate(-1)} aria-label="Volver">
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              PDRC: OER / AER
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vista por Periodo, Dimensión y Unidad Organizacional
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`OER: ${oerCount}`} variant="outlined" />
          <Chip label={`AER: ${aerCount}`} variant="outlined" />

          <Tooltip title="Refrescar" arrow>
            <IconButton onMouseDown={(e) => e.currentTarget.blur()} onClick={onRefresh}>
              <RefreshRoundedIcon />
            </IconButton>
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ width: "100%", mb: 2 }}>
          <Autocomplete
            options={periodos}
            value={periodoSelectedObj}
            onChange={(_e, newValue) => setIdPeriodoSel(newValue?.idPeriodo ?? 0)}
            getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.descripcion ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idPeriodo === v.idPeriodo}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
            renderInput={(params) => <TextField {...params} label="Periodo" size="small" />}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
            }}
          />

          <Autocomplete
            options={dimensiones}
            value={dimensionSelectedObj}
            onChange={(_e, newValue) => setIdDimensionSel(newValue?.idDimension ?? 0)}
            getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idDimension === v.idDimension}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
            renderInput={(params) => <TextField {...params} label="Dimensión" size="small" />}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
            }}
          />
        </Stack>

        <Stack direction="row" sx={{ width: "100%" }}>
          <Autocomplete
            options={unidades}
            value={unidadSelectedObj}
            onChange={(_e, newValue) => setIdUnidadSel(newValue?.idUnidad ?? 0)}
            getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idUnidad === v.idUnidad}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
            renderInput={(params) => (
              <TextField {...params} label="Unidad Organizacional" size="small" />
            )}
            sx={{
              width: "100%",
              "& .MuiOutlinedInput-root": { borderRadius: 2.5 },
            }}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <TextField
          value={qSearch}
          onChange={(e) => setQSearch(e.target.value)}
          placeholder="Buscar OER / AER (código o enunciado)..."
          size="small"
          fullWidth
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
        />
      </Paper>

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
              <TableCell sx={{ width: 88 }} />
              <TableCell sx={{ fontWeight: 900, width: 120 }}>Código OER</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Enunciado OER</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 120 }}>Código AER</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Enunciado AER</TableCell>
              <TableCell
                sx={{ fontWeight: 900, width: 150, ...sxStickyActionHeader }}
                align="right"
              >
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
                    <Typography variant="body2">Cargando OER/AER...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rowsFiltered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Alert severity="info" sx={{ borderRadius: 2, width: "100%" }}>
                    No hay registros para la combinación seleccionada.
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              rowsFiltered.map((r) => {
                const open = !!openRowMap[r.idPdrcOerAer];
                const detail = detailMap[r.idPdrcOerAer];
                const indicadoresCount = getIndicadoresCount(r);

                return (
                  <React.Fragment key={r.idPdrcOerAer}>
                    <TableRow hover>
                      <TableCell
                        sx={{
                          width: 88,
                          verticalAlign: "middle",
                          py: 1.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                          justifyContent="center"
                          sx={{ minHeight: 56 }}
                        >
                          <Tooltip title={open ? "Ocultar detalle" : "Ver detalle"} arrow>
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.currentTarget.blur()}
                              onClick={() => void toggleRowDetail(r)}
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
                            label={`IND:${indicadoresCount}`}
                            sx={{
                              height: 20,
                              borderRadius: 2,
                              fontWeight: 900,
                              "& .MuiChip-label": { px: 0.75, fontSize: 11 },
                            }}
                          />
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900, verticalAlign: "middle" }}>
                        {r.codigoOer}
                      </TableCell>
                      <TableCell
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "normal",
                          overflowWrap: "break-word",
                          verticalAlign: "middle",
                        }}
                      >
                        {r.enunciadoOer}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 900, verticalAlign: "middle" }}>
                        {r.codigoAer}
                      </TableCell>
                      <TableCell
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "normal",
                          overflowWrap: "break-word",
                          verticalAlign: "middle",
                        }}
                      >
                        {r.enunciadoAer}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{ verticalAlign: "middle", width: 150, ...sxStickyActionCell }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.75}
                          justifyContent="flex-end"
                          alignItems="center"
                        >
                          <Chip
                            size="small"
                            label={`IND:${indicadoresCount}`}
                            variant="outlined"
                            sx={{
                              fontWeight: 900,
                              height: 20,
                              "& .MuiChip-label": { px: 0.75, fontSize: 11 },
                            }}
                          />

                          <Tooltip title={open ? "Ocultar detalle" : "Ver detalle"} arrow>
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.currentTarget.blur()}
                              onClick={() => void toggleRowDetail(r)}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "rgba(59,130,246,.10)",
                                boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                                transition: "all .15s ease",
                                "&:hover": {
                                  transform: "translateY(-1px)",
                                  bgcolor: "rgba(59,130,246,.16)",
                                },
                              }}
                            >
                              <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: "background.default" }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              spacing={2}
                              sx={{ mb: 1 }}
                            >
                              <Stack spacing={0.25}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                  Detalle Indicadores
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  AER: {r.codigoAer} — {r.enunciadoAer}
                                </Typography>
                              </Stack>

                              <Tooltip title="Recargar detalle" arrow>
                                <IconButton
                                  size="small"
                                  onMouseDown={(e) => e.currentTarget.blur()}
                                  onClick={() => void reloadRowDetail(r.idPdrcOerAer)}
                                  sx={{
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: "divider",
                                  }}
                                >
                                  <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>

                            {detail?.loading ? (
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <CircularProgress size={18} />
                                <Typography variant="body2">Cargando detalle...</Typography>
                              </Stack>
                            ) : detail?.error ? (
                              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                {detail.error}
                              </Alert>
                            ) : !detail?.data || detail.data.length === 0 ? (
                              <Alert severity="info" sx={{ borderRadius: 2 }}>
                                No hay indicadores registrados para este AER.
                              </Alert>
                            ) : (
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 900, width: 180 }}>
                                        Código Indicador
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 900 }}>
                                        Nombre Indicador
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 900, width: 120 }}>
                                        Acción
                                      </TableCell>
                                    </TableRow>
                                  </TableHead>

                                  <TableBody>
                                    {detail.data.map((d) => (
                                      <TableRow key={d.idIndicadorNombre} hover>
                                        <TableCell sx={{ fontWeight: 900 }}>
                                          {d.codigoIndicador}
                                        </TableCell>
                                        <TableCell
                                          sx={{
                                            whiteSpace: "normal",
                                            wordBreak: "break-word",
                                          }}
                                        >
                                          {d.nombreIndicador}
                                        </TableCell>
                                        <TableCell align="right">
                                          <Tooltip title="Ver indicador" arrow>
                                            <IconButton
                                              size="small"
                                              onMouseDown={(e) => e.currentTarget.blur()}
                                              onClick={() => openIndicadorModal(r, d)}
                                              sx={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 2,
                                                border: "1px solid",
                                                borderColor: "divider",
                                                bgcolor: "rgba(59,130,246,.10)",
                                                "&:hover": {
                                                  bgcolor: "rgba(59,130,246,.16)",
                                                },
                                              }}
                                            >
                                              <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                          </Tooltip>
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

      <PdrcIndicadorDetalleModal
        open={indicadorModal.open}
        onClose={() =>
          setIndicadorModal((prev) => ({
            ...prev,
            open: false,
          }))
        }
        idPdrcOerAer={indicadorModal.idPdrcOerAer}
        idIndicadorNombre={indicadorModal.idIndicadorNombre}
        codigoIndicador={indicadorModal.codigoIndicador}
        nombreIndicador={indicadorModal.nombreIndicador}
        oer={`${indicadorModal.codigoOer} - ${indicadorModal.enunciadoOer}`}
        aer={`${indicadorModal.codigoAer} - ${indicadorModal.enunciadoAer}`}
      />
    </Box>
  );
}