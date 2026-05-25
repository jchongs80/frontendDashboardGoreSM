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
  InputAdornment,
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
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";

import { useNavigate } from "react-router-dom";
import {
  PdrcOerAerVistaAction,
  type PdrcPeriodoDto,
  type PdrcDimensionDto,
  type PdrcUnidadOrgDto,
  type PdrcObjetivoDto,
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
  tipoNivel: "OER" | "AER";
  codigoOer: string;
  enunciadoOer: string;
  codigoAer?: string | null;
  enunciadoAer?: string | null;
};

function safeText(value?: string | null): string {
  const txt = (value ?? "").toString().trim();
  return txt.length === 0 ? "—" : txt;
}

function nivelPalette(tipoNivel?: string | null) {
  const nivel = (tipoNivel ?? "").toUpperCase();
  if (nivel === "OER") {
    return {
      main: "#7c3aed",
      soft: "rgba(124,58,237,.10)",
      soft2: "rgba(124,58,237,.045)",
      border: "rgba(124,58,237,.28)",
      label: "OER",
      detailTitle: "Indicadores del OER",
    };
  }

  return {
    main: "#2563eb",
    soft: "rgba(37,99,235,.10)",
    soft2: "rgba(37,99,235,.045)",
    border: "rgba(37,99,235,.28)",
    label: "AER",
    detailTitle: "Indicadores del AER",
  };
}

export default function PdrcOerAerPage(): React.ReactElement {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTabla, setLoadingTabla] = useState<boolean>(false);

  const [periodos, setPeriodos] = useState<PdrcPeriodoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<PdrcDimensionDto[]>([]);
  const [unidades, setUnidades] = useState<PdrcUnidadOrgDto[]>([]);
  const [objetivos, setObjetivos] = useState<PdrcObjetivoDto[]>([]);

  const [idPeriodoSel, setIdPeriodoSel] = useState<number>(0);
  const [idDimensionSel, setIdDimensionSel] = useState<number>(0);
  const [idUnidadSel, setIdUnidadSel] = useState<number>(0);
  const [idObjetivoSel, setIdObjetivoSel] = useState<number>(0);

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
    tipoNivel: "AER",
    codigoOer: "",
    enunciadoOer: "",
    codigoAer: "",
    enunciadoAer: "",
  });

  const periodoSelectedObj = useMemo(
    () => periodos.find((x) => x.idPeriodo === idPeriodoSel) ?? null,
    [periodos, idPeriodoSel],
  );

  const dimensionSelectedObj = useMemo(
    () => dimensiones.find((x) => x.idDimension === idDimensionSel) ?? null,
    [dimensiones, idDimensionSel],
  );

  const unidadSelectedObj = useMemo(
    () => unidades.find((x) => x.idUnidad === idUnidadSel) ?? null,
    [unidades, idUnidadSel],
  );

  const objetivoSelectedObj = useMemo(
    () => objetivos.find((x) => x.idObjetivo === idObjetivoSel) ?? null,
    [objetivos, idObjetivoSel],
  );

  const rowsFiltered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();

    return rows.filter((r) => {
      if (idObjetivoSel && r.idObjetivo !== idObjetivoSel) return false;
      if (!q) return true;

      return `${r.tipoNivel ?? ""} ${r.codigoOer ?? ""} ${r.enunciadoOer ?? ""} ${r.codigoAer ?? ""} ${r.enunciadoAer ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [rows, qSearch, idObjetivoSel]);

  const oerCount = useMemo(() => {
    const ids = new Set(rows.map((x) => x.idObjetivo));
    return ids.size;
  }, [rows]);

  const aerCount = useMemo(() => {
    return rows.filter((x) => (x.tipoNivel ?? "").toUpperCase() === "AER")
      .length;
  }, [rows]);

  const totalRows = useMemo(() => rows.length, [rows]);

  const getIndicadoresCount = (row: PdrcOerAerMasterDto): number =>
    row.cantidadIndicadores ?? 0;

  const filterByTexto = <
    T extends {
      codigo: string | null;
      descripcion?: string | null;
      nombre?: string | null;
      enunciado?: string | null;
    },
  >(
    options: readonly T[],
    inputValue: string,
  ): T[] => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options.slice() as T[];

    return options.filter((o) =>
      `${o.codigo ?? ""} ${o.descripcion ?? ""} ${o.nombre ?? ""} ${o.enunciado ?? ""}`
        .toLowerCase()
        .includes(q),
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

  async function loadTabla(
    idPeriodo: number,
    idDimension: number,
    idUnidad: number,
  ) {
    if (!idPeriodo || !idDimension || !idUnidad) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    try {
      const data = await PdrcOerAerVistaAction.getMaster(
        idPeriodo,
        idDimension,
        idUnidad,
      );
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

  async function loadObjetivosFiltro(
    idPeriodo: number,
    idDimension: number,
    idUnidad: number,
  ) {
    if (!idPeriodo || !idDimension || !idUnidad) {
      setObjetivos([]);
      setIdObjetivoSel(0);
      return;
    }

    try {
      const data = await PdrcOerAerVistaAction.getObjetivosFiltro(
        idPeriodo,
        idDimension,
        idUnidad,
      );
      setObjetivos(data ?? []);
      setIdObjetivoSel(0);
    } catch (e) {
      console.error(e);
      setObjetivos([]);
      setIdObjetivoSel(0);
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
      const msg =
        e instanceof Error ? e.message : "No se pudo cargar el detalle.";
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
      const msg =
        e instanceof Error ? e.message : "No se pudo recargar el detalle.";
      setDetailMap((prev) => ({
        ...prev,
        [idPdrcOerAer]: { loading: false, data: [], error: msg },
      }));
    }
  }

  async function onRefresh() {
    await loadTabla(idPeriodoSel, idDimensionSel, idUnidadSel);
  }

  function openIndicadorModal(
    row: PdrcOerAerMasterDto,
    indicador: PdrcOerAerDetailDto,
  ) {
    setIndicadorModal({
      open: true,
      idPdrcOerAer: row.idPdrcOerAer,
      idIndicadorNombre: indicador.idIndicadorNombre,
      codigoIndicador: indicador.codigoIndicador,
      nombreIndicador: indicador.nombreIndicador,
      tipoNivel: row.tipoNivel,
      codigoOer: row.codigoOer,
      enunciadoOer: row.enunciadoOer,
      codigoAer: row.codigoAer ?? null,
      enunciadoAer: row.enunciadoAer ?? null,
    });
  }

  useEffect(() => {
    void loadCombos();
  }, []);

  useEffect(() => {
    if (!loading && idPeriodoSel && idDimensionSel && idUnidadSel) {
      void loadObjetivosFiltro(idPeriodoSel, idDimensionSel, idUnidadSel);
      void loadTabla(idPeriodoSel, idDimensionSel, idUnidadSel);
    }
  }, [loading, idPeriodoSel, idDimensionSel, idUnidadSel]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 18px 45px rgba(15,23,42,.08)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography sx={{ fontWeight: 700 }}>
              Cargando información PDRC...
            </Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3.5 },
        py: { xs: 2, md: 3 },
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title="Volver" arrow>
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Volver"
              sx={{
                width: 54,
                height: 54,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "primary.main",
                boxShadow: "0 10px 28px rgba(15,23,42,.10)",
                transition: "all .18s ease",
                "&:hover": {
                  transform: "translateY(-1px)",
                  bgcolor: "rgba(37,99,235,.08)",
                },
              }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
          </Tooltip>

          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 950,
                letterSpacing: "-.04em",
                lineHeight: 1.05,
              }}
            >
              PDRC: OER / AER
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Vista por Periodo, Dimensión y Unidad Organizacional
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`OER: ${oerCount}`}
            variant="outlined"
            sx={{
              height: 34,
              fontWeight: 900,
              color: "success.dark",
              borderColor: "rgba(22,163,74,.45)",
              bgcolor: "rgba(22,163,74,.06)",
            }}
          />
          <Chip
            label={`AER: ${aerCount}`}
            variant="outlined"
            sx={{
              height: 34,
              fontWeight: 900,
              color: "#6d28d9",
              borderColor: "rgba(124,58,237,.45)",
              bgcolor: "rgba(124,58,237,.06)",
            }}
          />
          <Chip
            label={`Registros: ${totalRows}`}
            variant="outlined"
            sx={{ height: 34, fontWeight: 900, bgcolor: "background.paper" }}
          />

          <Tooltip title="Refrescar" arrow>
            <IconButton
              onMouseDown={(e) => e.currentTarget.blur()}
              onClick={onRefresh}
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                boxShadow: "0 10px 28px rgba(15,23,42,.08)",
                "&:hover": {
                  transform: "translateY(-1px)",
                  bgcolor: "action.hover",
                },
              }}
            >
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "rgba(148,163,184,.35)",
          boxShadow: "0 18px 45px rgba(15,23,42,.08)",
          bgcolor: "rgba(255,255,255,.96)",
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(37,99,235,.10)",
              color: "primary.main",
            }}
          >
            <FilterAltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
              Filtros de búsqueda
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ajuste el contexto para consultar la estructura PDRC y sus
              indicadores.
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ width: "100%", mb: 2 }}
        >
          <Autocomplete
            options={periodos}
            value={periodoSelectedObj}
            onChange={(_e, newValue) =>
              setIdPeriodoSel(newValue?.idPeriodo ?? 0)
            }
            getOptionLabel={(o) =>
              `${o.codigo ?? "—"} - ${o.descripcion ?? "—"}`
            }
            isOptionEqualToValue={(o, v) => o.idPeriodo === v.idPeriodo}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) =>
              filterByTexto(options, state.inputValue)
            }
            renderInput={(params) => (
              <TextField {...params} label="Periodo" size="small" />
            )}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "#fff",
              },
            }}
          />

          <Autocomplete
            options={dimensiones}
            value={dimensionSelectedObj}
            onChange={(_e, newValue) =>
              setIdDimensionSel(newValue?.idDimension ?? 0)
            }
            getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idDimension === v.idDimension}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) =>
              filterByTexto(options, state.inputValue)
            }
            renderInput={(params) => (
              <TextField {...params} label="Dimensión" size="small" />
            )}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "#fff",
              },
            }}
          />

          <Autocomplete
            options={unidades}
            value={unidadSelectedObj}
            onChange={(_e, newValue) => setIdUnidadSel(newValue?.idUnidad ?? 0)}
            getOptionLabel={(o) => `${o.nombre ?? "—"}`}
            isOptionEqualToValue={(o, v) => o.idUnidad === v.idUnidad}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) =>
              filterByTexto(options, state.inputValue)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Unidad Organizacional"
                size="small"
              />
            )}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "#fff",
              },
            }}
          />
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ width: "100%" }}
        >
          <Autocomplete
            options={objetivos}
            value={objetivoSelectedObj}
            onChange={(_e, newValue) =>
              setIdObjetivoSel(newValue?.idObjetivo ?? 0)
            }
            getOptionLabel={(o) =>
              o ? `${o.codigo ?? "—"} - ${o.enunciado ?? "—"}` : ""
            }
            isOptionEqualToValue={(o, v) => o.idObjetivo === v.idObjetivo}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) =>
              filterByTexto(options, state.inputValue)
            }
            renderInput={(params) => (
              <TextField {...params} label="OER" size="small" />
            )}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "#fff",
              },
            }}
          />

          <TextField
            value={qSearch}
            onChange={(e) => setQSearch(e.target.value)}
            placeholder="Buscar por nivel, OER o AER..."
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1.4,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "#fff",
              },
            }}
          />
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: { xs: 2, md: 2.5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "rgba(148,163,184,.35)",
          boxShadow: "0 18px 45px rgba(15,23,42,.08)",
          bgcolor: "rgba(255,255,255,.98)",
        }}
      >
        <Stack direction="row" spacing={1.4} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(37,99,235,.10)",
              color: "primary.main",
            }}
          >
            <AccountTreeRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
              Estructura OER / AER e Indicadores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use los botones de expansión para revisar los indicadores
              asociados por nivel.
            </Typography>
          </Box>
        </Stack>

        {loadingTabla ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={18} />
              <Typography variant="body2">Cargando registros...</Typography>
            </Stack>
          </Paper>
        ) : rowsFiltered.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 3, width: "100%" }}>
            No hay registros para la combinación seleccionada.
          </Alert>
        ) : (
          <Stack spacing={1.6}>
            {rowsFiltered.map((r) => {
              const open = !!openRowMap[r.idPdrcOerAer];
              const detail = detailMap[r.idPdrcOerAer];
              const indicadoresCount = getIndicadoresCount(r);
              const palette = nivelPalette(r.tipoNivel);

              return (
                <Paper
                  key={r.idPdrcOerAer}
                  elevation={0}
                  sx={{
                    borderRadius: 3.5,
                    border: "1px solid",
                    borderColor: open
                      ? palette.border
                      : "rgba(148,163,184,.32)",
                    overflow: "hidden",
                    bgcolor: "#fff",
                    boxShadow: open
                      ? `0 16px 34px ${palette.soft}`
                      : "0 8px 24px rgba(15,23,42,.045)",
                    transition: "all .18s ease",
                    "&:hover": {
                      borderColor: palette.border,
                      boxShadow: `0 16px 34px ${palette.soft}`,
                    },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", md: "center" }}
                    sx={{ p: 1.6 }}
                  >
                    <Tooltip
                      title={open ? "Ocultar indicadores" : "Ver indicadores"}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onMouseDown={(e) => e.currentTarget.blur()}
                        onClick={() => void toggleRowDetail(r)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: "rgba(148,163,184,.45)",
                          bgcolor: open ? palette.soft : "#fff",
                          color: open ? palette.main : "text.primary",
                          boxShadow: "0 8px 18px rgba(15,23,42,.08)",
                          alignSelf: { xs: "flex-start", md: "center" },
                          "&:hover": {
                            bgcolor: palette.soft,
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        {open ? (
                          <KeyboardArrowUpRoundedIcon />
                        ) : (
                          <KeyboardArrowDownRoundedIcon />
                        )}
                      </IconButton>
                    </Tooltip>

                    <Chip
                      label={r.tipoNivel}
                      sx={{
                        minWidth: 64,
                        height: 34,
                        fontWeight: 950,
                        borderRadius: 2.2,
                        color: "#fff",
                        bgcolor: palette.main,
                        alignSelf: { xs: "flex-start", md: "center" },
                      }}
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "120px minmax(0, 1fr)",
                        },
                        columnGap: 2.2,
                        rowGap: 0.4,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>
                        {r.tipoNivel === "AER"
                          ? safeText(r.codigoAer)
                          : safeText(r.codigoOer)}
                      </Typography>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            color: "#0f172a",
                            lineHeight: 1.35,
                            textTransform: "uppercase",
                          }}
                        >
                          {r.tipoNivel === "AER"
                            ? safeText(r.enunciadoAer)
                            : safeText(r.enunciadoOer)}
                        </Typography>

                        {r.tipoNivel === "AER" && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.35 }}
                          >
                            Pertenece a:{" "}
                            <b style={{ color: "#2563eb" }}>
                              {safeText(r.codigoOer)}
                            </b>
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.8}
                      alignItems="center"
                      justifyContent="flex-end"
                      sx={{ minWidth: { xs: "100%", md: 140 } }}
                    >
                      <Chip
                        size="small"
                        label={`IND: ${indicadoresCount}`}
                        variant="outlined"
                        sx={{
                          fontWeight: 950,
                          height: 28,
                          color: palette.main,
                          bgcolor: palette.soft,
                          borderColor: palette.border,
                          "& .MuiChip-label": { px: 1.1 },
                        }}
                      />

                      <Tooltip
                        title={
                          open ? "Ocultar indicadores" : "Abrir indicadores"
                        }
                        arrow
                      >
                        <IconButton
                          size="small"
                          onMouseDown={(e) => e.currentTarget.blur()}
                          onClick={() => void toggleRowDetail(r)}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2.5,
                            border: "1px solid",
                            borderColor: palette.border,
                            color: palette.main,
                            bgcolor: palette.soft,
                            "&:hover": {
                              bgcolor: palette.soft,
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <QueryStatsRoundedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ px: { xs: 1.4, md: 2 }, pb: 2 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.4, md: 1.8 },
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: palette.border,
                          bgcolor: palette.soft2,
                        }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={2}
                          sx={{ mb: 1.2 }}
                        >
                          <Stack
                            direction="row"
                            spacing={1.2}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 2.3,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: palette.soft,
                                color: palette.main,
                              }}
                            >
                              <BarChartRoundedIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 950, color: palette.main }}
                              >
                                {palette.detailTitle}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {r.tipoNivel === "AER"
                                  ? `AER: ${safeText(r.codigoAer)} — ${safeText(r.enunciadoAer)}`
                                  : `OER: ${safeText(r.codigoOer)} — ${safeText(r.enunciadoOer)}`}
                              </Typography>
                            </Box>
                          </Stack>

                          <Tooltip title="Recargar detalle" arrow>
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.currentTarget.blur()}
                              onClick={() =>
                                void reloadRowDetail(r.idPdrcOerAer)
                              }
                              sx={{
                                borderRadius: 2.5,
                                border: "1px solid",
                                borderColor: palette.border,
                                bgcolor: "#fff",
                                color: palette.main,
                              }}
                            >
                              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                        {detail?.loading ? (
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ p: 1 }}
                          >
                            <CircularProgress size={18} />
                            <Typography variant="body2">
                              Cargando detalle...
                            </Typography>
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
                            sx={{
                              borderRadius: 2.5,
                              overflow: "hidden",
                              borderColor: palette.border,
                              bgcolor: "#fff",
                            }}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: palette.soft }}>
                                  <TableCell
                                    sx={{
                                      fontWeight: 950,
                                      width: 190,
                                      color: palette.main,
                                    }}
                                  >
                                    Código Indicador
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 950,
                                      color: palette.main,
                                    }}
                                  >
                                    Nombre Indicador
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{
                                      fontWeight: 950,
                                      width: 120,
                                      color: palette.main,
                                    }}
                                  >
                                    Acción
                                  </TableCell>
                                </TableRow>
                              </TableHead>

                              <TableBody>
                                {detail.data.map((d) => (
                                  <TableRow key={d.idIndicadorNombre} hover>
                                    <TableCell sx={{ fontWeight: 950 }}>
                                      {d.codigoIndicador}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        lineHeight: 1.45,
                                      }}
                                    >
                                      {d.nombreIndicador}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Tooltip title="Abrir indicador" arrow>
                                        <IconButton
                                          size="small"
                                          onMouseDown={(e) =>
                                            e.currentTarget.blur()
                                          }
                                          onClick={() =>
                                            openIndicadorModal(r, d)
                                          }
                                          sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 2.3,
                                            border: "1px solid",
                                            borderColor: palette.border,
                                            bgcolor: palette.soft,
                                            color: palette.main,
                                            "&:hover": {
                                              bgcolor: palette.soft,
                                              transform: "translateY(-1px)",
                                            },
                                          }}
                                        >
                                          <QueryStatsRoundedIcon
                                            sx={{ fontSize: 18 }}
                                          />
                                        </IconButton>
                                      </Tooltip>
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
        oer={`${safeText(indicadorModal.codigoOer)} - ${safeText(indicadorModal.enunciadoOer)}`}
        aer={
          indicadorModal.tipoNivel === "AER"
            ? `${safeText(indicadorModal.codigoAer)} - ${safeText(indicadorModal.enunciadoAer)}`
            : "—"
        }
      />
    </Box>
  );
}
