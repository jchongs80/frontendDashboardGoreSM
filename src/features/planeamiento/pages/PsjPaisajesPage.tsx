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
  PsjPaisajesVistaAction,
  type PsjPeriodoDto,
  type PsjDimensionDto,
  type PsjIndicadorPdrcDto,
  type PsjPaisajesMasterDto,
  type PsjPaisajesDetailDto,
} from "../PsjPaisajesVistaAction";
import PsjIndicadorDetalleModal from "../components/PsjIndicadorDetalleModal";

type DetailState = {
  loading: boolean;
  data: PsjPaisajesDetailDto[];
  error?: string;
};

type IndicadorModalState = {
  open: boolean;
  idPsjOerAer: number;
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  tipoNivel: "OER" | "AER";
  codigoOe: string;
  enunciadoOe: string;
  codigoAe?: string | null;
  enunciadoAe?: string | null;
};

function safeText(value?: string | null): string {
  const txt = (value ?? "").toString().trim();
  return txt.length === 0 ? "—" : txt;
}

function buildIndicadorPdrcLabel(o?: PsjIndicadorPdrcDto | null): string {
  if (!o) return "—";

  const etiqueta = (o.etiqueta ?? "").trim();
  if (etiqueta) return etiqueta;

  const partes = [
    (o as any).codigoEntidad ?? "",
    (o as any).codigoIndicador ?? "",
    (o as any).nombreIndicador ?? "",
    (o as any).anio != null ? String((o as any).anio) : "",
  ]
    .map((x) => (x ?? "").toString().trim())
    .filter((x) => x.length > 0);

  return partes.length > 0 ? partes.join(" · ") : "—";
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

export default function PsjPaisajesPage(): React.ReactElement {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingTabla, setLoadingTabla] = useState(false);

  const [periodos, setPeriodos] = useState<PsjPeriodoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<PsjDimensionDto[]>([]);
  const [indicadoresPdrc, setIndicadoresPdrc] = useState<PsjIndicadorPdrcDto[]>([]);

  const [idPeriodoSel, setIdPeriodoSel] = useState(0);
  const [idDimensionSel, setIdDimensionSel] = useState(0);
  const [idPdrcIndicadorValorSel, setIdPdrcIndicadorValorSel] = useState(0);

  const [rows, setRows] = useState<PsjPaisajesMasterDto[]>([]);
  const [qSearch, setQSearch] = useState("");

  const [openRowMap, setOpenRowMap] = useState<Record<number, boolean>>({});
  const [detailMap, setDetailMap] = useState<Record<number, DetailState>>({});

  const [indicadorModal, setIndicadorModal] = useState<IndicadorModalState>({
    open: false,
    idPsjOerAer: 0,
    idIndicadorNombre: 0,
    codigoIndicador: "",
    nombreIndicador: "",
    tipoNivel: "AER",
    codigoOe: "",
    enunciadoOe: "",
    codigoAe: "",
    enunciadoAe: "",
  });

  const periodoSelectedObj = useMemo(
    () => periodos.find((x) => x.idPeriodo === idPeriodoSel) ?? null,
    [periodos, idPeriodoSel]
  );

  const dimensionSelectedObj = useMemo(
    () => dimensiones.find((x) => x.idDimension === idDimensionSel) ?? null,
    [dimensiones, idDimensionSel]
  );

  const indicadorPdrcSelectedObj = useMemo(
    () =>
      indicadoresPdrc.find((x) => x.idPdrcIndicadorValor === idPdrcIndicadorValorSel) ?? null,
    [indicadoresPdrc, idPdrcIndicadorValorSel]
  );

  const rowsFiltered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      `${r.tipoNivel ?? ""} ${r.codigoOe ?? ""} ${r.enunciadoOe ?? ""} ${r.codigoAe ?? ""} ${r.enunciadoAe ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [rows, qSearch]);

  const oeCount = useMemo(() => new Set(rows.map((x) => x.idObjetivo)).size, [rows]);

  const aeCount = useMemo(
    () => rows.filter((x) => (x.tipoNivel ?? "").toUpperCase() === "AER").length,
    [rows]
  );

  const totalRows = useMemo(() => rows.length, [rows]);

  const getIndicadoresCount = (row: PsjPaisajesMasterDto) => row.cantidadIndicadores ?? 0;

  const filterByTexto = <
    T extends {
      codigo?: string | null;
      descripcion?: string | null;
      nombre?: string | null;
      etiqueta?: string | null;
    }
  >(
    options: readonly T[],
    inputValue: string
  ): T[] => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options.slice() as T[];

    return options.filter((o) => {
      const texto =
        `${o.codigo ?? ""} ${o.descripcion ?? ""} ${o.nombre ?? ""} ${o.etiqueta ?? ""}`.toLowerCase();

      return texto.includes(q);
    }) as T[];
  };

  async function loadCombos() {
    setLoading(true);
    try {
      const [periodosDb, dimensionesDb, indicadoresDb] = await Promise.all([
        PsjPaisajesVistaAction.getPeriodos(),
        PsjPaisajesVistaAction.getDimensiones(),
        PsjPaisajesVistaAction.getIndicadoresPdrc(),
      ]);

      setPeriodos(periodosDb ?? []);
      setDimensiones(dimensionesDb ?? []);
      setIndicadoresPdrc(indicadoresDb ?? []);

      setIdPeriodoSel(periodosDb?.[0]?.idPeriodo ?? 0);
      setIdDimensionSel(dimensionesDb?.[0]?.idDimension ?? 0);
      setIdPdrcIndicadorValorSel(indicadoresDb?.[0]?.idPdrcIndicadorValor ?? 0);
    } catch (error) {
      console.error(error);
      setPeriodos([]);
      setDimensiones([]);
      setIndicadoresPdrc([]);
      setIdPeriodoSel(0);
      setIdDimensionSel(0);
      setIdPdrcIndicadorValorSel(0);
    } finally {
      setLoading(false);
    }
  }

  async function loadTabla(
    idPeriodo: number,
    idDimension: number,
    idPdrcIndicadorValor: number
  ) {
    if (!idPeriodo || !idDimension || !idPdrcIndicadorValor) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    try {
      const data = await PsjPaisajesVistaAction.getMaster(
        idPeriodo,
        idDimension,
        idPdrcIndicadorValor
      );

      setRows(data ?? []);
      setOpenRowMap({});
      setDetailMap({});
    } catch (error) {
      console.error(error);
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
    } finally {
      setLoadingTabla(false);
    }
  }

  async function toggleRowDetail(r: PsjPaisajesMasterDto) {
    const idKey = r.idPsjOerAer;

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

      const data = await PsjPaisajesVistaAction.getDetail(idKey);

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

  async function reloadRowDetail(idPsjOerAer: number) {
    try {
      setDetailMap((prev) => ({
        ...prev,
        [idPsjOerAer]: { loading: true, data: [] },
      }));

      const data = await PsjPaisajesVistaAction.getDetail(idPsjOerAer);

      setDetailMap((prev) => ({
        ...prev,
        [idPsjOerAer]: { loading: false, data: data ?? [] },
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "No se pudo recargar el detalle.";
      setDetailMap((prev) => ({
        ...prev,
        [idPsjOerAer]: { loading: false, data: [], error: msg },
      }));
    }
  }

  function openIndicadorModal(row: PsjPaisajesMasterDto, indicador: PsjPaisajesDetailDto) {
    setIndicadorModal({
      open: true,
      idPsjOerAer: row.idPsjOerAer,
      idIndicadorNombre: indicador.idIndicadorNombre,
      codigoIndicador: indicador.codigoIndicador,
      nombreIndicador: indicador.nombreIndicador,
      tipoNivel: row.tipoNivel,
      codigoOe: row.codigoOe,
      enunciadoOe: row.enunciadoOe,
      codigoAe: row.codigoAe ?? null,
      enunciadoAe: row.enunciadoAe ?? null,
    });
  }

  useEffect(() => {
    void loadCombos();
  }, []);

  useEffect(() => {
    if (!loading && idPeriodoSel && idDimensionSel && idPdrcIndicadorValorSel) {
      void loadTabla(idPeriodoSel, idDimensionSel, idPdrcIndicadorValorSel);
    }
  }, [loading, idPeriodoSel, idDimensionSel, idPdrcIndicadorValorSel]);

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
              PAISAJES
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vista por Periodo, Dimensión e Indicador PDRC
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`OE: ${oeCount}`} variant="outlined" />
          <Chip label={`AE: ${aeCount}`} variant="outlined" />
          <Chip label={`Registros: ${totalRows}`} variant="outlined" />

          <Tooltip title="Refrescar" arrow>
            <IconButton
              onMouseDown={(e) => e.currentTarget.blur()}
              onClick={() => void loadTabla(idPeriodoSel, idDimensionSel, idPdrcIndicadorValorSel)}
            >
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
              options={indicadoresPdrc}
              value={indicadorPdrcSelectedObj}
              onChange={(_e, newValue) =>
                setIdPdrcIndicadorValorSel(newValue?.idPdrcIndicadorValor ?? 0)
              }
              getOptionLabel={(o) => buildIndicadorPdrcLabel(o)}
              isOptionEqualToValue={(o, v) =>
                o.idPdrcIndicadorValor === v.idPdrcIndicadorValor
              }
              filterOptions={(options, state) => {
                const q = state.inputValue.trim().toLowerCase();
                if (!q) return options;

                return options.filter((o) =>
                  buildIndicadorPdrcLabel(o).toLowerCase().includes(q)
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="Indicador PDRC" size="small" />
              )}
              sx={{ width: "100%", ...comboSx }}
            />
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        <TextField
          value={qSearch}
          onChange={(e) => setQSearch(e.target.value)}
          placeholder="Buscar por nivel, OE o AE..."
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
              <TableCell sx={{ fontWeight: 900, width: 120 }}>Código OE</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Enunciado OE</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 120 }}>Código AE</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Enunciado AE</TableCell>
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
                const open = !!openRowMap[r.idPsjOerAer];
                const detail = detailMap[r.idPsjOerAer];
                const indicadoresCount = getIndicadoresCount(r);

                return (
                  <React.Fragment key={r.idPsjOerAer}>
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

                      <TableCell>
                        <Chip
                          size="small"
                          label={safeText(r.tipoNivel)}
                          color={
                            (r.tipoNivel ?? "").toUpperCase() === "AER" ? "primary" : "secondary"
                          }
                          variant="outlined"
                          sx={{ fontWeight: 900 }}
                        />
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900 }}>{safeText(r.codigoOe)}</TableCell>

                      <TableCell
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        {safeText(r.enunciadoOe)}
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900 }}>{safeText(r.codigoAe)}</TableCell>

                      <TableCell
                        sx={{
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        {safeText(r.enunciadoAe)}
                      </TableCell>

                      <TableCell align="right" sx={{ width: 150, ...sxStickyActionCell }}>
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
                                  {r.tipoNivel === "AER"
                                    ? `AE: ${safeText(r.codigoAe)} — ${safeText(r.enunciadoAe)}`
                                    : `OE: ${safeText(r.codigoOe)} — ${safeText(r.enunciadoOe)}`}
                                </Typography>
                              </Stack>

                              <Tooltip title="Recargar detalle" arrow>
                                <IconButton
                                  size="small"
                                  onMouseDown={(e) => e.currentTarget.blur()}
                                  onClick={() => void reloadRowDetail(r.idPsjOerAer)}
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
                              <TableContainer
                                component={Paper}
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                              >
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 900, width: 180 }}>
                                        Código Indicador
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 900 }}>
                                        Nombre Indicador
                                      </TableCell>
                                      <TableCell
                                        align="right"
                                        sx={{ fontWeight: 900, width: 120 }}
                                      >
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

      <PsjIndicadorDetalleModal
        open={indicadorModal.open}
        onClose={() =>
          setIndicadorModal((prev) => ({
            ...prev,
            open: false,
          }))
        }
        idPsjOerAer={indicadorModal.idPsjOerAer}
        idIndicadorNombre={indicadorModal.idIndicadorNombre}
        codigoIndicador={indicadorModal.codigoIndicador}
        nombreIndicador={indicadorModal.nombreIndicador}
        oe={`${safeText(indicadorModal.codigoOe)} - ${safeText(indicadorModal.enunciadoOe)}`}
        ae={
          indicadorModal.tipoNivel === "AER"
            ? `${safeText(indicadorModal.codigoAe)} - ${safeText(indicadorModal.enunciadoAe)}`
            : "—"
        }
      />
    </Box>
  );
}