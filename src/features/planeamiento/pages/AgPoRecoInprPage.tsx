import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Collapse,
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
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";

import { useNavigate } from "react-router-dom";
import {
  AgPoRecoInprVistaAction,
  type AgDimensionDto,
  type AgPeriodoDto,
  type AgPoliticaDto,
  type AgPoRecoInprDetailDto,
  type AgPoRecoInprMasterDto,
  type AgUnidadOrgDto,
} from "../AgPoRecoInprVistaAction";
import AgIndicadorDetalleModal from "../components/AgIndicadorDetalleModal";

type DetailState = {
  loading: boolean;
  data: AgPoRecoInprDetailDto[];
  error?: string;
};

type IndicadorModalState = {
  open: boolean;
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  politica?: string | null;
  rc?: string | null;
  ip?: string | null;
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

export default function AgPoRecoInprPage(): React.ReactElement {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTabla, setLoadingTabla] = useState<boolean>(false);
  const [loadingPoliticas, setLoadingPoliticas] = useState<boolean>(false);

  const [periodos, setPeriodos] = useState<AgPeriodoDto[]>([]);
  const [dimensiones, setDimensiones] = useState<AgDimensionDto[]>([]);
  const [unidades, setUnidades] = useState<AgUnidadOrgDto[]>([]);
  const [politicas, setPoliticas] = useState<AgPoliticaDto[]>([]);

  const [idPeriodoSel, setIdPeriodoSel] = useState<number>(0);
  const [idDimensionSel, setIdDimensionSel] = useState<number>(0);
  const [idUnidadSel, setIdUnidadSel] = useState<number>(0);
  const [idPoliticaSel, setIdPoliticaSel] = useState<number>(0);

  const [rows, setRows] = useState<AgPoRecoInprMasterDto[]>([]);
  const [qSearch, setQSearch] = useState<string>("");
  const [openRowMap, setOpenRowMap] = useState<Record<number, boolean>>({});
  const [detailMap, setDetailMap] = useState<Record<number, DetailState>>({});

  const [indicadorModal, setIndicadorModal] = useState<IndicadorModalState>({
    open: false,
    idAgPoRecoInpr: 0,
    idIndicadorNombre: 0,
    codigoIndicador: "",
    nombreIndicador: "",
    politica: "",
    rc: "",
    ip: "",
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
  const politicaSelectedObj = useMemo(
    () => politicas.find((x) => x.idPolitica === idPoliticaSel) ?? null,
    [politicas, idPoliticaSel],
  );

  const rowsFiltered = useMemo(() => {
    const q = qSearch.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      `${r.codigoPolitica ?? ""} ${r.descripcionPolitica ?? ""} ${r.codigoRc ?? ""} ${r.descripcionRc ?? ""} ${r.codigoIp ?? ""} ${r.descripcionIp ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [rows, qSearch]);

  const rcCount = useMemo(
    () => new Set(rows.map((x) => x.idResultado)).size,
    [rows],
  );
  const ipCount = useMemo(
    () => new Set(rows.map((x) => x.idIntervencion)).size,
    [rows],
  );
  const totalRows = useMemo(() => rows.length, [rows]);
  const getIndicadoresCount = (row: AgPoRecoInprMasterDto): number =>
    row.cantidadIndicadores ?? 0;

  const filterByTexto = <
    T extends {
      codigo: string | null;
      descripcion?: string | null;
      nombre?: string | null;
    },
  >(
    options: readonly T[],
    inputValue: string,
  ): T[] => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return options.slice() as T[];

    return options.filter((o) =>
      `${o.codigo ?? ""} ${o.descripcion ?? ""} ${o.nombre ?? ""}`
        .toLowerCase()
        .includes(q),
    ) as T[];
  };

  async function loadCombos() {
    setLoading(true);
    try {
      const [periodosDb, dimensionesDb, unidadesDb] = await Promise.all([
        AgPoRecoInprVistaAction.getPeriodos(),
        AgPoRecoInprVistaAction.getDimensiones(),
        AgPoRecoInprVistaAction.getUnidadesOrganizacionales(),
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

  async function loadPoliticas(
    idPeriodo: number,
    idDimension: number,
    idUnidad: number,
  ) {
    if (!idPeriodo || !idDimension || !idUnidad) {
      setPoliticas([]);
      setIdPoliticaSel(0);
      return;
    }

    setLoadingPoliticas(true);
    try {
      const data = await AgPoRecoInprVistaAction.getPoliticas(
        idPeriodo,
        idDimension,
        idUnidad,
      );
      setPoliticas(data ?? []);
      setIdPoliticaSel((current) =>
        data?.some((x) => x.idPolitica === current)
          ? current
          : (data?.[0]?.idPolitica ?? 0),
      );
    } catch (e) {
      console.error(e);
      setPoliticas([]);
      setIdPoliticaSel(0);
    } finally {
      setLoadingPoliticas(false);
    }
  }

  async function loadTabla(
    idPeriodo: number,
    idDimension: number,
    idUnidad: number,
    idPolitica: number,
  ) {
    if (!idPeriodo || !idDimension || !idUnidad || !idPolitica) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    try {
      const data = await AgPoRecoInprVistaAction.getMaster(
        idPeriodo,
        idDimension,
        idUnidad,
        idPolitica,
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

  async function toggleRowDetail(r: AgPoRecoInprMasterDto) {
    const idKey = r.idAgPoRecoInpr;

    setOpenRowMap((prev) => ({ ...prev, [idKey]: !prev[idKey] }));
    if (detailMap[idKey]?.data?.length || detailMap[idKey]?.loading) return;

    try {
      setDetailMap((prev) => ({
        ...prev,
        [idKey]: { loading: true, data: [] },
      }));
      const data = await AgPoRecoInprVistaAction.getDetail(idKey);
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

  async function reloadRowDetail(idAgPoRecoInpr: number) {
    try {
      setDetailMap((prev) => ({
        ...prev,
        [idAgPoRecoInpr]: { loading: true, data: [] },
      }));
      const data = await AgPoRecoInprVistaAction.getDetail(idAgPoRecoInpr);
      setDetailMap((prev) => ({
        ...prev,
        [idAgPoRecoInpr]: { loading: false, data: data ?? [] },
      }));
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No se pudo recargar el detalle.";
      setDetailMap((prev) => ({
        ...prev,
        [idAgPoRecoInpr]: { loading: false, data: [], error: msg },
      }));
    }
  }

  async function onRefresh() {
    await loadTabla(idPeriodoSel, idDimensionSel, idUnidadSel, idPoliticaSel);
  }

  function openIndicadorModal(
    row: AgPoRecoInprMasterDto,
    indicador: AgPoRecoInprDetailDto,
  ) {
    setIndicadorModal({
      open: true,
      idAgPoRecoInpr: row.idAgPoRecoInpr,
      idIndicadorNombre: indicador.idIndicadorNombre,
      codigoIndicador: indicador.codigoIndicador,
      nombreIndicador: indicador.nombreIndicador,
      politica: `${safeText(row.codigoPolitica)} - ${safeText(row.descripcionPolitica)}`,
      rc: `${safeText(row.codigoRc)} - ${safeText(row.descripcionRc)}`,
      ip: `${safeText(row.codigoIp)} - ${safeText(row.descripcionIp)}`,
    });
  }

  useEffect(() => {
    void loadCombos();
  }, []);

  useEffect(() => {
    if (!loading && idPeriodoSel && idDimensionSel && idUnidadSel) {
      void loadPoliticas(idPeriodoSel, idDimensionSel, idUnidadSel);
    }
  }, [loading, idPeriodoSel, idDimensionSel, idUnidadSel]);

  useEffect(() => {
    if (
      !loading &&
      idPeriodoSel &&
      idDimensionSel &&
      idUnidadSel &&
      idPoliticaSel
    ) {
      void loadTabla(idPeriodoSel, idDimensionSel, idUnidadSel, idPoliticaSel);
    }
  }, [loading, idPeriodoSel, idDimensionSel, idUnidadSel, idPoliticaSel]);

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

  const agPalette = {
    main: "#2563eb",
    soft: "rgba(37,99,235,.10)",
    soft2: "rgba(37,99,235,.045)",
    border: "rgba(37,99,235,.28)",
    rcMain: "#16a34a",
    rcSoft: "rgba(22,163,74,.10)",
    rcBorder: "rgba(22,163,74,.28)",
  } as const;

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
              A.G.: Políticas / RC / IP
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Vista por Periodo, Dimensión, Unidad Organizacional y Política
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`RC: ${rcCount}`}
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
            label={`IP: ${ipCount}`}
            variant="outlined"
            sx={{
              height: 34,
              fontWeight: 900,
              color: "#1d4ed8",
              borderColor: "rgba(37,99,235,.45)",
              bgcolor: "rgba(37,99,235,.06)",
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
              Ajuste el contexto para consultar la estructura AG y sus
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
            sx={{ flex: 1, ...comboSx }}
          />

          <Autocomplete
            options={dimensiones}
            value={dimensionSelectedObj}
            onChange={(_e, newValue) =>
              setIdDimensionSel(newValue?.idDimension ?? 0)
            }
            getOptionLabel={(o) => safeText(o.nombre)}
            isOptionEqualToValue={(o, v) => o.idDimension === v.idDimension}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) =>
              filterByTexto(options, state.inputValue)
            }
            renderInput={(params) => (
              <TextField {...params} label="Dimensión" size="small" />
            )}
            sx={{ flex: 1, ...comboSx }}
          />
        </Stack>

        <Stack spacing={2} sx={{ width: "100%", mb: 2 }}>
          <Autocomplete
            options={unidades}
            value={unidadSelectedObj}
            onChange={(_e, newValue) => setIdUnidadSel(newValue?.idUnidad ?? 0)}
            getOptionLabel={(o) => safeText(o.nombre)}
            isOptionEqualToValue={(o, v) => o.idUnidad === v.idUnidad}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) =>
              filterByTexto(options, state.inputValue)
            }
            renderInput={(params) => (
              <TextField {...params} label="Unidad Orgánica" size="small" />
            )}
            sx={{ width: "100%", ...comboSx }}
          />

          <Autocomplete
            options={politicas}
            value={politicaSelectedObj}
            loading={loadingPoliticas}
            onChange={(_e, newValue) =>
              setIdPoliticaSel(newValue?.idPolitica ?? 0)
            }
            getOptionLabel={(o) => safeText(o.descripcion)}
            isOptionEqualToValue={(o, v) => o.idPolitica === v.idPolitica}
            noOptionsText="Sin resultados"
            filterOptions={(options, state) =>
              filterByTexto(options, state.inputValue)
            }
            renderInput={(params) => (
              <TextField {...params} label="Política" size="small" />
            )}
            sx={{ width: "100%", ...comboSx }}
          />
        </Stack>

        <TextField
          value={qSearch}
          onChange={(e) => setQSearch(e.target.value)}
          placeholder="Buscar por política, RC o IP..."
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
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
              bgcolor: "#fff",
            },
          }}
        />
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
              Estructura RC / IP e Indicadores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use los botones de expansión para revisar los indicadores
              asociados por intervención prioritaria.
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
              const open = !!openRowMap[r.idAgPoRecoInpr];
              const detail = detailMap[r.idAgPoRecoInpr];
              const indicadoresCount = getIndicadoresCount(r);

              return (
                <Paper
                  key={r.idAgPoRecoInpr}
                  elevation={0}
                  sx={{
                    borderRadius: 3.5,
                    border: "1px solid",
                    borderColor: open
                      ? agPalette.border
                      : "rgba(148,163,184,.32)",
                    overflow: "hidden",
                    bgcolor: "#fff",
                    boxShadow: open
                      ? `0 16px 34px ${agPalette.soft}`
                      : "0 8px 24px rgba(15,23,42,.045)",
                    transition: "all .18s ease",
                    "&:hover": {
                      borderColor: agPalette.border,
                      boxShadow: `0 16px 34px ${agPalette.soft}`,
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
                          bgcolor: open ? agPalette.soft : "#fff",
                          color: open ? agPalette.main : "text.primary",
                          boxShadow: "0 8px 18px rgba(15,23,42,.08)",
                          alignSelf: { xs: "flex-start", md: "center" },
                          "&:hover": {
                            bgcolor: agPalette.soft,
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
                      label="IP"
                      sx={{
                        minWidth: 64,
                        height: 34,
                        fontWeight: 950,
                        borderRadius: 2.2,
                        color: "#fff",
                        bgcolor: agPalette.main,
                        alignSelf: { xs: "flex-start", md: "center" },
                      }}
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "120px minmax(0, 1fr) minmax(0, 1fr)",
                        },
                        columnGap: 2.2,
                        rowGap: 0.9,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 800 }}
                        >
                          Código RC
                        </Typography>
                        <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>
                          {safeText(r.codigoRc)}
                        </Typography>
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 800 }}
                        >
                          Resultado Concertado
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: "#0f172a",
                            lineHeight: 1.35,
                          }}
                        >
                          {safeText(r.descripcionRc)}
                        </Typography>
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 800 }}
                        >
                          Intervención Prioritaria
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            color: "#0f172a",
                            lineHeight: 1.35,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              color: agPalette.main,
                              fontWeight: 950,
                              mr: 0.6,
                            }}
                          >
                            {safeText(r.codigoIp)}
                          </Box>
                          {safeText(r.descripcionIp)}
                        </Typography>
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
                          color: agPalette.main,
                          bgcolor: agPalette.soft,
                          borderColor: agPalette.border,
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
                            borderColor: agPalette.border,
                            color: agPalette.main,
                            bgcolor: agPalette.soft,
                            "&:hover": {
                              bgcolor: agPalette.soft,
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
                          borderColor: agPalette.border,
                          bgcolor: agPalette.soft2,
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
                                bgcolor: agPalette.soft,
                                color: agPalette.main,
                              }}
                            >
                              <BarChartRoundedIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: 950, color: agPalette.main }}
                              >
                                Indicadores de la Intervención Prioritaria
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                IP: {safeText(r.codigoIp)} —{" "}
                                {safeText(r.descripcionIp)}
                              </Typography>
                            </Box>
                          </Stack>

                          <Tooltip title="Recargar detalle" arrow>
                            <IconButton
                              size="small"
                              onMouseDown={(e) => e.currentTarget.blur()}
                              onClick={() =>
                                void reloadRowDetail(r.idAgPoRecoInpr)
                              }
                              sx={{
                                borderRadius: 2.5,
                                border: "1px solid",
                                borderColor: agPalette.border,
                                bgcolor: "#fff",
                                color: agPalette.main,
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
                              borderColor: agPalette.border,
                              bgcolor: "#fff",
                            }}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: agPalette.soft }}>
                                  <TableCell
                                    sx={{
                                      fontWeight: 950,
                                      width: 190,
                                      color: agPalette.main,
                                    }}
                                  >
                                    Código Indicador
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontWeight: 950,
                                      color: agPalette.main,
                                    }}
                                  >
                                    Nombre Indicador
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    sx={{
                                      fontWeight: 950,
                                      width: 120,
                                      color: agPalette.main,
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
                                            borderColor: agPalette.border,
                                            bgcolor: agPalette.soft,
                                            color: agPalette.main,
                                            "&:hover": {
                                              bgcolor: agPalette.soft,
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

      <AgIndicadorDetalleModal
        open={indicadorModal.open}
        onClose={() => setIndicadorModal((prev) => ({ ...prev, open: false }))}
        idAgPoRecoInpr={indicadorModal.idAgPoRecoInpr}
        idIndicadorNombre={indicadorModal.idIndicadorNombre}
        codigoIndicador={indicadorModal.codigoIndicador}
        nombreIndicador={indicadorModal.nombreIndicador}
        politica={indicadorModal.politica}
        rc={indicadorModal.rc}
        ip={indicadorModal.ip}
      />
    </Box>
  );
}
