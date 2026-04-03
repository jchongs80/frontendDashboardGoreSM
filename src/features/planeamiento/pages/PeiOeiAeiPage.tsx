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
  PeiOeiAeiVistaAction,
  type PeiPeriodoDto,
  type PeiDimensionDto,
  type PeiUnidadOrgDto,
  type PeiOeiAeiMasterDto,
  type PeiOeiAeiDetailDto,
} from "../PeiOeiAeiVistaAction";
import PeiIndicadorDetalleModal from "../components/PeiIndicadorDetalleModal";

type DetailState = {
  loading: boolean;
  data: PeiOeiAeiDetailDto[];
  error?: string;
};

type IndicadorModalState = {
  open: boolean;
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  tipoNivel: "OEI" | "AEI";
  codigoOei: string;
  enunciadoOei: string;
  codigoAei?: string | null;
  enunciadoAei?: string | null;
};

function safeText(value?: string | null): string {
  const txt = (value ?? "").toString().trim();
  return txt.length === 0 ? "—" : txt;
}
const comboSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0,0,0,0.18)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.7)",
  },
} as const;

export default function PeiOeiAeiPage(): React.ReactElement {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTabla, setLoadingTabla] = useState<boolean>(false);

  const [periodos, setPeriodos] = useState<PeiPeriodoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<PeiDimensionDto[]>([]);
  const [unidades, setUnidades] = useState<PeiUnidadOrgDto[]>([]);

  const [idPeriodoSel, setIdPeriodoSel] = useState<number>(0);
  const [idDimensionSel, setIdDimensionSel] = useState<number>(0);
  const [idUnidadSel, setIdUnidadSel] = useState<number>(0);

  const [rows, setRows] = useState<PeiOeiAeiMasterDto[]>([]);
  const [qSearch, setQSearch] = useState<string>("");

  const [openRowMap, setOpenRowMap] = useState<Record<number, boolean>>({});
  const [detailMap, setDetailMap] = useState<Record<number, DetailState>>({});

  const [indicadorModal, setIndicadorModal] = useState<IndicadorModalState>({
    open: false,
    idPeiOeiAei: 0,
    idIndicadorNombre: 0,
    codigoIndicador: "",
    nombreIndicador: "",
    tipoNivel: "AEI",
    codigoOei: "",
    enunciadoOei: "",
    codigoAei: "",
    enunciadoAei: "",
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
      `${r.tipoNivel ?? ""} ${r.codigoOei ?? ""} ${r.enunciadoOei ?? ""} ${r.codigoAei ?? ""} ${r.enunciadoAei ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, qSearch]);

  const oeiCount = useMemo(() => {
    const ids = new Set(rows.map((x) => x.idObjetivo));
    return ids.size;
  }, [rows]);

  const aeiCount = useMemo(() => {
    return rows.filter((x) => (x.tipoNivel ?? "").toUpperCase() === "AEI").length;
  }, [rows]);

  const totalRows = useMemo(() => rows.length, [rows]);

  const getIndicadoresCount = (row: PeiOeiAeiMasterDto): number => row.cantidadIndicadores ?? 0;

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
        PeiOeiAeiVistaAction.getPeriodos(),
        PeiOeiAeiVistaAction.getDimensiones(),
        PeiOeiAeiVistaAction.getUnidadesOrganizacionales(),
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
      const data = await PeiOeiAeiVistaAction.getMaster(idPeriodo, idDimension, idUnidad);
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

  async function toggleRowDetail(r: PeiOeiAeiMasterDto) {
    const idKey = r.idPeiOeiAei;

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

      const data = await PeiOeiAeiVistaAction.getDetail(idKey);

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

  async function reloadRowDetail(idPeiOeiAei: number) {
    try {
      setDetailMap((prev) => ({
        ...prev,
        [idPeiOeiAei]: { loading: true, data: [] },
      }));

      const data = await PeiOeiAeiVistaAction.getDetail(idPeiOeiAei);

      setDetailMap((prev) => ({
        ...prev,
        [idPeiOeiAei]: { loading: false, data: data ?? [] },
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo recargar el detalle.";
      setDetailMap((prev) => ({
        ...prev,
        [idPeiOeiAei]: { loading: false, data: [], error: msg },
      }));
    }
  }

  async function onRefresh() {
    await loadTabla(idPeriodoSel, idDimensionSel, idUnidadSel);
  }

  function openIndicadorModal(row: PeiOeiAeiMasterDto, indicador: PeiOeiAeiDetailDto) {
    setIndicadorModal({
      open: true,
      idPeiOeiAei: row.idPeiOeiAei,
      idIndicadorNombre: indicador.idIndicadorNombre,
      codigoIndicador: indicador.codigoIndicador,
      nombreIndicador: indicador.nombreIndicador,
      tipoNivel: row.tipoNivel,
      codigoOei: row.codigoOei,
      enunciadoOei: row.enunciadoOei,
      codigoAei: row.codigoAei ?? null,
      enunciadoAei: row.enunciadoAei ?? null,
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
              PEI: OEI / AEI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vista por Periodo, Dimensión y Unidad Organizacional
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`OEI: ${oeiCount}`} variant="outlined" />
          <Chip label={`AEI: ${aeiCount}`} variant="outlined" />
          <Chip label={`Registros: ${totalRows}`} variant="outlined" />

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
    <Box sx={{ width: "100%", mb: 2 }}>
  <Stack
    direction={{ xs: "column", md: "row" }}
    spacing={2}
    sx={{ width: "100%", mb: 2 }}
  >
<Autocomplete
  options={periodos}
  value={periodoSelectedObj}
  onChange={(_e, newValue) => setIdPeriodoSel(newValue?.idPeriodo ?? 0)}
  getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.descripcion ?? "—"}`}
  isOptionEqualToValue={(o, v) => o.idPeriodo === v.idPeriodo}
  filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
  renderInput={(params) => <TextField {...params} label="Periodo" size="small" />}
  sx={{ flex: 1, ...comboSx }}
/>

<Autocomplete
  options={dimensiones}
  value={dimensionSelectedObj}
  onChange={(_e, newValue) => setIdDimensionSel(newValue?.idDimension ?? 0)}
  getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
  isOptionEqualToValue={(o, v) => o.idDimension === v.idDimension}
  filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
  renderInput={(params) => <TextField {...params} label="Dimensión" size="small" />}
  sx={{ flex: 1, ...comboSx }}
/>
  </Stack>

  <Stack direction="column" sx={{ width: "100%" }}>
<Autocomplete
  options={unidades}
  value={unidadSelectedObj}
  onChange={(_e, newValue) => setIdUnidadSel(newValue?.idUnidad ?? 0)}
  getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
  isOptionEqualToValue={(o, v) => o.idUnidad === v.idUnidad}
  filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
  renderInput={(params) => (
    <TextField {...params} label="Unidad Organizacional" size="small" />
  )}
  sx={{ width: "100%", ...comboSx }}
/>
  </Stack>
</Box>

        <Divider sx={{ my: 2 }} />

        <TextField
          value={qSearch}
          onChange={(e) => setQSearch(e.target.value)}
          placeholder="Buscar por nivel, OEI o AEI..."
          fullWidth
          size="small"
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
              <TableCell sx={{ fontWeight: 900, width: 90 }}>Nivel</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 120 }}>Código OEI</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Enunciado OEI</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 120 }}>Código AEI</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Enunciado AEI</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 150, ...sxStickyActionHeader }} align="right">
                Acción
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loadingTabla ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="body2">Cargando registros...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rowsFiltered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Alert severity="info" sx={{ borderRadius: 2, width: "100%" }}>
                    No hay registros para la combinación seleccionada.
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              rowsFiltered.map((r) => {
                const open = !!openRowMap[r.idPeiOeiAei];
                const detail = detailMap[r.idPeiOeiAei];
                const indicadoresCount = getIndicadoresCount(r);

                return (
                  <React.Fragment key={r.idPeiOeiAei}>
                    <TableRow hover>
                      <TableCell sx={{ width: 88, verticalAlign: "middle", py: 1.5 }}>
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

                      <TableCell sx={{ verticalAlign: "middle" }}>
                        <Chip
                          size="small"
                          label={safeText(r.tipoNivel)}
                          color={(r.tipoNivel ?? "").toUpperCase() === "AEI" ? "primary" : "secondary"}
                          variant="outlined"
                          sx={{ fontWeight: 900 }}
                        />
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900, verticalAlign: "middle" }}>
                        {safeText(r.codigoOei)}
                      </TableCell>

                      <TableCell
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          verticalAlign: "middle",
                        }}
                      >
                        {safeText(r.enunciadoOei)}
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900, verticalAlign: "middle" }}>
                        {safeText(r.codigoAei)}
                      </TableCell>

                      <TableCell
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          verticalAlign: "middle",
                        }}
                      >
                        {safeText(r.enunciadoAei)}
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
                      <TableCell colSpan={7} sx={{ p: 0, borderBottom: 0 }}>
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
                                  {r.tipoNivel === "AEI"
                                    ? `AEI: ${safeText(r.codigoAei)} — ${safeText(r.enunciadoAei)}`
                                    : `OEI: ${safeText(r.codigoOei)} — ${safeText(r.enunciadoOei)}`}
                                </Typography>
                              </Stack>

                              <Tooltip title="Recargar detalle" arrow>
                                <IconButton
                                  size="small"
                                  onMouseDown={(e) => e.currentTarget.blur()}
                                  onClick={() => void reloadRowDetail(r.idPeiOeiAei)}
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
                                No hay indicadores registrados para este registro.
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

      <PeiIndicadorDetalleModal
        open={indicadorModal.open}
        onClose={() =>
          setIndicadorModal((prev) => ({
            ...prev,
            open: false,
          }))
        }
        idPeiOeiAei={indicadorModal.idPeiOeiAei}
        idIndicadorNombre={indicadorModal.idIndicadorNombre}
        codigoIndicador={indicadorModal.codigoIndicador}
        nombreIndicador={indicadorModal.nombreIndicador}
        oei={`${safeText(indicadorModal.codigoOei)} - ${safeText(indicadorModal.enunciadoOei)}`}
        aei={
          indicadorModal.tipoNivel === "AEI"
            ? `${safeText(indicadorModal.codigoAei)} - ${safeText(indicadorModal.enunciadoAei)}`
            : "—"
        }
      />
    </Box>
  );
}