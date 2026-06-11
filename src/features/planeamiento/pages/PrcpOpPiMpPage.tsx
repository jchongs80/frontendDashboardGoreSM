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
  PrcpOpPiMpVistaAction,
  type PrcpMedidaPoliticaDto,
  type PrcpObjetivoPrioritarioDto,
  type PrcpOpPiMpDetailDto,
  type PrcpOpPiMpMasterDto,
  type PrcpPeriodoDto,
} from "../PrcpOpPiMpVistaAction";
import PrcpIndicadorDetalleModal from "../components/PrcpIndicadorDetalleModal";

type DetailState = {
  loading: boolean;
  data: PrcpOpPiMpDetailDto[];
  error?: string;
};

type IndicadorModalState = {
  open: boolean;
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  objetivoPrioritario?: string | null;
  problemaIdentificado?: string | null;
  medidaPolitica?: string | null;
};

function safeText(value?: string | null): string {
  const txt = (value ?? "").toString().trim();
  return txt.length === 0 ? "—" : txt;
}


function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Error no controlado.";
  }
}

function normalize(value?: string | null): string {
  return (value ?? "").toString().toLowerCase().trim();
}

function prcpTheme() {
  return {
    main: "#2563eb",
    dark: "#1d4ed8",
    accent: "#f97316",
    soft: "rgba(37,99,235,.10)",
    soft2: "rgba(37,99,235,.045)",
    border: "rgba(37,99,235,.24)",
    accentSoft: "rgba(249,115,22,.10)",
    accentBorder: "rgba(249,115,22,.28)",
  };
}

function renderHitos(value?: string | null): React.ReactElement {
  const text = (value ?? "").trim();

  if (!text) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }

  const items = text
    .split(/\r?\n|\|/g)
    .map((x) => x.trim())
    .filter(Boolean);

  if (items.length <= 1) {
    return (
      <Typography
        variant="caption"
        sx={{
          display: "block",
          whiteSpace: "normal",
          lineHeight: 1.35,
          fontSize: "15px",
        }}
      >
        {text}
      </Typography>
    );
  }

  return (
    <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
      {items.map((item, index) => (
        <Typography
          key={`${index}-${item.slice(0, 20)}`}
          component="li"
          variant="caption"
          sx={{ lineHeight: 1.35, mb: 0.35, fontSize: "15px" }}
        >
          {item}
        </Typography>
      ))}
    </Box>
  );
}

const comboSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
} as const;

export default function PrcpOpPiMpPage(): React.ReactElement {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingTabla, setLoadingTabla] = useState<boolean>(false);
  const [loadingObjetivos, setLoadingObjetivos] = useState<boolean>(false);
  const [loadingMedidas, setLoadingMedidas] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [periodos, setPeriodos] = useState<PrcpPeriodoDto[]>([]);
  const [objetivos, setObjetivos] = useState<PrcpObjetivoPrioritarioDto[]>([]);
  const [medidas, setMedidas] = useState<PrcpMedidaPoliticaDto[]>([]);

  const [idPeriodoSel, setIdPeriodoSel] = useState<number>(0);
  const [idObjetivoSel, setIdObjetivoSel] = useState<number>(0);
  const [idMedidaSel, setIdMedidaSel] = useState<number>(0);

  const [rows, setRows] = useState<PrcpOpPiMpMasterDto[]>([]);
  const [qSearch, setQSearch] = useState<string>("");
  const [openRowMap, setOpenRowMap] = useState<Record<number, boolean>>({});
  const [detailMap, setDetailMap] = useState<Record<number, DetailState>>({});

  const [indicadorModal, setIndicadorModal] = useState<IndicadorModalState>({
    open: false,
    idPrcpOpPiMp: 0,
    idIndicadorNombre: 0,
    codigoIndicador: "",
    nombreIndicador: "",
    objetivoPrioritario: "",
    problemaIdentificado: "",
    medidaPolitica: "",
  });

  const periodoSelectedObj = useMemo(
    () => periodos.find((x) => x.idPeriodo === idPeriodoSel) ?? null,
    [periodos, idPeriodoSel],
  );

  const objetivoSelectedObj = useMemo(
    () =>
      objetivos.find((x) => x.idObjetivoPrioritario === idObjetivoSel) ?? null,
    [objetivos, idObjetivoSel],
  );

  const medidaSelectedObj = useMemo(
    () => medidas.find((x) => x.idMedidaPolitica === idMedidaSel) ?? null,
    [medidas, idMedidaSel],
  );

  const unidadObjetivoTexto = useMemo(() => {
    if (!objetivoSelectedObj) return "";

    const codigo = safeText(objetivoSelectedObj.codigoUnidad);
    const nombre = safeText(objetivoSelectedObj.nombreUnidad);

    if (codigo === "—" && nombre === "—") return "";
    if (codigo === "—") return nombre;
    if (nombre === "—") return codigo;

    return `${codigo} - ${nombre}`;
  }, [objetivoSelectedObj]);

  const unidadMedidaTexto = useMemo(() => {
    if (!medidaSelectedObj) return "";

    const codigo = safeText(medidaSelectedObj.codigoUnidad);
    const nombre = safeText(medidaSelectedObj.nombreUnidad);

    if (codigo === "—" && nombre === "—") return "";
    if (codigo === "—") return nombre;
    if (nombre === "—") return codigo;

    return `${codigo} - ${nombre}`;
  }, [medidaSelectedObj]);

  const rowsFiltered = useMemo(() => {
    const q = normalize(qSearch);
    if (!q) return rows;

    return rows.filter((r) => {
      const content = [
        r.codigoObjetivoPrioritario,
        r.descripcionObjetivoPrioritario,
        r.codigoProblemaIdentificado,
        r.descripcionProblemaIdentificado,
        r.codigoMedidaPolitica,
        r.descripcionMedidaPolitica,
        r.hitosJulio2025,
        r.hitosJulio2028,
        r.hitosJulio2030,
      ]
        .map((x) => x ?? "")
        .join(" ")
        .toLowerCase();

      return content.includes(q);
    });
  }, [rows, qSearch]);

  const objetivoCount = useMemo(
    () => new Set(rows.map((x) => x.idObjetivoPrioritario)).size,
    [rows],
  );

  const mpCount = useMemo(
    () => new Set(rows.map((x) => x.idMedidaPolitica)).size,
    [rows],
  );

  const filterByTexto = <
    T extends {
      codigo: string | null;
      descripcion?: string | null;
      denominacion?: string | null;
      nombre?: string | null;
    },
  >(
    options: readonly T[],
    inputValue: string,
  ): T[] => {
    const q = normalize(inputValue);
    if (!q) return options.slice() as T[];

    return options.filter((o) => {
      const content =
        `${o.codigo ?? ""} ${o.descripcion ?? ""} ${o.denominacion ?? ""} ${o.nombre ?? ""}`.toLowerCase();
      return content.includes(q);
    }) as T[];
  };

  async function loadPeriodos(): Promise<void> {
    setLoading(true);
    setErrorMsg("");

    try {
      const periodosDb = await PrcpOpPiMpVistaAction.getPeriodos();
      setPeriodos(periodosDb ?? []);
      setIdPeriodoSel(periodosDb?.[0]?.idPeriodo ?? 0);
    } catch (error) {
      setPeriodos([]);
      setIdPeriodoSel(0);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function loadFiltrosPorPeriodo(idPeriodo: number): Promise<void> {
    if (!idPeriodo) {
      setObjetivos([]);
      setMedidas([]);
      setIdObjetivoSel(0);
      setIdMedidaSel(0);
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingObjetivos(true);
    setLoadingMedidas(true);
    setErrorMsg("");

    try {
      const objetivosDb =
        await PrcpOpPiMpVistaAction.getObjetivosPrioritarios(idPeriodo);
      setObjetivos(objetivosDb ?? []);

      const objetivoVigente = objetivosDb?.some(
        (x) => x.idObjetivoPrioritario === idObjetivoSel,
      )
        ? idObjetivoSel
        : 0;

      if (objetivoVigente !== idObjetivoSel) {
        setIdObjetivoSel(objetivoVigente);
      }

      const medidasDb = await PrcpOpPiMpVistaAction.getMedidasPoliticas(
        idPeriodo,
        objetivoVigente || null,
      );

      setMedidas(medidasDb ?? []);
      setIdMedidaSel((current) =>
        medidasDb?.some((x) => x.idMedidaPolitica === current) ? current : 0,
      );
    } catch (error) {
      setObjetivos([]);
      setMedidas([]);
      setIdObjetivoSel(0);
      setIdMedidaSel(0);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoadingObjetivos(false);
      setLoadingMedidas(false);
    }
  }

  async function loadMedidasPorPeriodoObjetivo(
    idPeriodo: number,
    idObjetivoPrioritario: number,
  ): Promise<void> {
    if (!idPeriodo) {
      setMedidas([]);
      setIdMedidaSel(0);
      return;
    }

    setLoadingMedidas(true);
    setErrorMsg("");

    try {
      const medidasDb = await PrcpOpPiMpVistaAction.getMedidasPoliticas(
        idPeriodo,
        idObjetivoPrioritario || null,
      );

      setMedidas(medidasDb ?? []);
      setIdMedidaSel((current) =>
        medidasDb?.some((x) => x.idMedidaPolitica === current) ? current : 0,
      );
    } catch (error) {
      setMedidas([]);
      setIdMedidaSel(0);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoadingMedidas(false);
    }
  }

  async function loadTabla(
    idPeriodo: number,
    idObjetivoPrioritario: number,
    idMedidaPolitica: number,
  ): Promise<void> {
    if (!idPeriodo) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      return;
    }

    setLoadingTabla(true);
    setErrorMsg("");

    try {
      const data = await PrcpOpPiMpVistaAction.getMaster(
        idPeriodo,
        idObjetivoPrioritario || 0,
        idMedidaPolitica || 0,
      );

      setRows(data ?? []);
      setOpenRowMap({});
      setDetailMap({});
    } catch (error) {
      setRows([]);
      setOpenRowMap({});
      setDetailMap({});
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoadingTabla(false);
    }
  }

  async function toggleRowDetail(row: PrcpOpPiMpMasterDto): Promise<void> {
    const idKey = row.idMedidaPolitica;

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

      const data = await PrcpOpPiMpVistaAction.getDetailByMaster(
        row.idPeriodo || idPeriodoSel,
        row.idMedidaPolitica,
        idObjetivoSel || row.idObjetivoPrioritario || null,
      );

      setDetailMap((prev) => ({
        ...prev,
        [idKey]: { loading: false, data: data ?? [] },
      }));
    } catch (error) {
      setDetailMap((prev) => ({
        ...prev,
        [idKey]: {
          loading: false,
          data: [],
          error: getErrorMessage(error) || "No se pudo cargar el detalle.",
        },
      }));
    }
  }

  async function reloadRowDetail(row: PrcpOpPiMpMasterDto): Promise<void> {
    const idKey = row.idMedidaPolitica;

    try {
      setDetailMap((prev) => ({
        ...prev,
        [idKey]: { loading: true, data: [] },
      }));

      const data = await PrcpOpPiMpVistaAction.getDetailByMaster(
        row.idPeriodo || idPeriodoSel,
        row.idMedidaPolitica,
        idObjetivoSel || row.idObjetivoPrioritario || null,
      );

      setDetailMap((prev) => ({
        ...prev,
        [idKey]: { loading: false, data: data ?? [] },
      }));
    } catch (error) {
      setDetailMap((prev) => ({
        ...prev,
        [idKey]: {
          loading: false,
          data: [],
          error: getErrorMessage(error) || "No se pudo recargar el detalle.",
        },
      }));
    }
  }

  function openIndicadorModal(
    row: PrcpOpPiMpMasterDto,
    indicador: PrcpOpPiMpDetailDto,
  ): void {
    setIndicadorModal({
      open: true,
      idPrcpOpPiMp: indicador.idPrcpOpPiMp || row.idPrcpOpPiMp,
      idIndicadorNombre: indicador.idIndicadorNombre,
      codigoIndicador: indicador.codigoIndicador,
      nombreIndicador: indicador.nombreIndicador,
      objetivoPrioritario: `${safeText(row.codigoObjetivoPrioritario)} - ${safeText(
        row.descripcionObjetivoPrioritario,
      )}`,
      problemaIdentificado: `${safeText(row.codigoProblemaIdentificado)} - ${safeText(
        row.descripcionProblemaIdentificado,
      )}`,
      medidaPolitica: `${safeText(row.codigoMedidaPolitica)} - ${safeText(
        row.descripcionMedidaPolitica,
      )}`,
    });
  }

  useEffect(() => {
    void loadPeriodos();
  }, []);

  useEffect(() => {
    if (loading) return;
    void loadFiltrosPorPeriodo(idPeriodoSel);
  }, [loading, idPeriodoSel]);

  useEffect(() => {
    if (loading) return;
    void loadMedidasPorPeriodoObjetivo(idPeriodoSel, idObjetivoSel);
  }, [loading, idPeriodoSel, idObjetivoSel]);

  useEffect(() => {
    if (loading) return;
    void loadTabla(idPeriodoSel, idObjetivoSel, idMedidaSel);
  }, [loading, idPeriodoSel, idObjetivoSel, idMedidaSel]);

  const palette = prcpTheme();
  const totalRows = rows.length;

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
              Cargando información PRCP...
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
              P.R.C.P.: OP / MP / HITO / INDICADOR
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Vista por Horizonte, Objetivo Prioritario y Medida Política
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`OP: ${objetivoCount}`}
            variant="outlined"
            sx={{
              height: 34,
              fontWeight: 900,
              color: palette.dark,
              borderColor: palette.border,
              bgcolor: palette.soft,
            }}
          />
          <Chip
            label={`MP: ${mpCount}`}
            variant="outlined"
            sx={{
              height: 34,
              fontWeight: 900,
              color: "#c2410c",
              borderColor: palette.accentBorder,
              bgcolor: palette.accentSoft,
            }}
          />
          <Chip
            label={`Registros: ${totalRows}`}
            variant="outlined"
            sx={{ height: 34, fontWeight: 900, bgcolor: "background.paper" }}
          />

          <Tooltip title="Refrescar" arrow>
            <IconButton
              onMouseDown={(event) => event.currentTarget.blur()}
              onClick={() =>
                void loadTabla(idPeriodoSel, idObjetivoSel, idMedidaSel)
              }
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
        {errorMsg ? (
          <Alert severity="warning" sx={{ borderRadius: 3, mb: 2 }}>
            {errorMsg}
          </Alert>
        ) : null}

        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: palette.soft,
              color: palette.main,
            }}
          >
            <FilterAltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
              Filtros de búsqueda
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ajuste el contexto para consultar la estructura PRCP y sus
              indicadores.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="column" spacing={2} sx={{ width: "100%" }}>
          <Autocomplete
            options={periodos}
            value={periodoSelectedObj}
            onChange={(_event, value) => {
              setIdPeriodoSel(value?.idPeriodo ?? 0);
              setIdObjetivoSel(0);
              setIdMedidaSel(0);
            }}
            getOptionLabel={(option) =>
              `${option.codigo ?? "—"} - ${option.descripcion ?? "—"}`
            }
            isOptionEqualToValue={(option, value) =>
              option.idPeriodo === value.idPeriodo
            }
            noOptionsText="Sin resultados"
            filterOptions={(options, state) =>
              filterByTexto(options, state.inputValue)
            }
            renderInput={(params) => (
              <TextField {...params} label="Horizonte" size="small" />
            )}
            sx={{ flex: 1, ...comboSx }}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ width: "100%" }}
          >
            <Autocomplete
              options={objetivos}
              value={objetivoSelectedObj}
              loading={loadingObjetivos}
              onChange={(_event, value) => {
                setIdObjetivoSel(value?.idObjetivoPrioritario ?? 0);
                setIdMedidaSel(0);
              }}
              getOptionLabel={(option) =>
                `${option.codigo ?? "—"} - ${option.descripcion ?? "—"}`
              }
              isOptionEqualToValue={(option, value) =>
                option.idObjetivoPrioritario === value.idObjetivoPrioritario
              }
              noOptionsText="Sin resultados"
              filterOptions={(options, state) =>
                filterByTexto(options, state.inputValue)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Objetivo Prioritario"
                  size="small"
                />
              )}
              sx={{ flex: 1, ...comboSx }}
            />

            <TextField
              label="Conductor del Objetivo Prioritario"
              size="small"
              value={unidadObjetivoTexto}
              fullWidth
              sx={{ flex: 1, ...comboSx }}
              InputProps={{ readOnly: true }}
            />
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ width: "100%" }}
          >
            <Autocomplete
              options={medidas}
              value={medidaSelectedObj}
              loading={loadingMedidas}
              onChange={(_event, value) =>
                setIdMedidaSel(value?.idMedidaPolitica ?? 0)
              }
              getOptionLabel={(option) =>
                `${option.codigo ?? "—"} - ${option.denominacion ?? "—"}`
              }
              isOptionEqualToValue={(option, value) =>
                option.idMedidaPolitica === value.idMedidaPolitica
              }
              noOptionsText="Sin resultados"
              filterOptions={(options, state) =>
                filterByTexto(options, state.inputValue)
              }
              renderInput={(params) => (
                <TextField {...params} label="Medida Política" size="small" />
              )}
              sx={{ flex: 1, ...comboSx }}
            />

            <TextField
              label="Responsable de la Medida Política"
              size="small"
              value={unidadMedidaTexto}
              fullWidth
              sx={{ flex: 1, ...comboSx }}
              InputProps={{ readOnly: true }}
            />
          </Stack>

          <TextField
            value={qSearch}
            onChange={(event) => setQSearch(event.target.value)}
            placeholder="Buscar por objetivo prioritario, problema identificado, medida política o hitos..."
            fullWidth
            size="small"
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
              bgcolor: palette.soft,
              color: palette.main,
            }}
          >
            <AccountTreeRoundedIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 950, lineHeight: 1.1 }}>
              Estructura OP / PI / MP e Indicadores
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use los botones de expansión para revisar los indicadores
              asociados por medida política.
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
            {rowsFiltered.map((row) => {
              const idKey = row.idMedidaPolitica;
              const open = !!openRowMap[idKey];
              const detail = detailMap[idKey];
              const indicadoresCount = row.cantidadIndicadores ?? 0;

              return (
                <Paper
                  key={`${row.idPeriodo}-${row.idObjetivoPrioritario}-${row.idMedidaPolitica}`}
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
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", lg: "center" }}
                    sx={{ p: 1.6 }}
                  >
                    <Tooltip
                      title={open ? "Ocultar indicadores" : "Ver indicadores"}
                      arrow
                    >
                      <IconButton
                        size="small"
                        onMouseDown={(event) => event.currentTarget.blur()}
                        onClick={() => void toggleRowDetail(row)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: "rgba(148,163,184,.45)",
                          bgcolor: open ? palette.soft : "#fff",
                          color: open ? palette.main : "text.primary",
                          boxShadow: "0 8px 18px rgba(15,23,42,.08)",
                          alignSelf: { xs: "flex-start", lg: "center" },
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
                      label="MP"
                      sx={{
                        minWidth: 64,
                        height: 34,
                        fontWeight: 950,
                        borderRadius: 2.2,
                        color: "#fff",
                        bgcolor: palette.main,
                        alignSelf: { xs: "flex-start", lg: "center" },
                      }}
                    />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          lg: "110px minmax(260px, 1.05fr) minmax(210px, .9fr) minmax(210px, .9fr) minmax(210px, .9fr)",
                        },
                        columnGap: 2.2,
                        rowGap: 1,
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
                          Código MP
                        </Typography>
                        <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>
                          {safeText(row.codigoMedidaPolitica)}
                        </Typography>
                      </Box>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 800 }}
                        >
                          Descripción MP
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            color: "#0f172a",
                            lineHeight: 1.35,
                          }}
                        >
                          {safeText(row.descripcionMedidaPolitica)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 800 }}
                        >
                          Hasta Julio 2025
                        </Typography>
                        {renderHitos(row.hitosJulio2025)}
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 800 }}
                        >
                          Hasta Julio 2028
                        </Typography>
                        {renderHitos(row.hitosJulio2028)}
                      </Box>

                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 800 }}
                        >
                          Hasta Julio 2030
                        </Typography>
                        {renderHitos(row.hitosJulio2030)}
                      </Box>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.8}
                      alignItems="center"
                      justifyContent="flex-end"
                      sx={{ minWidth: { xs: "100%", lg: 142 } }}
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
                          onMouseDown={(event) => event.currentTarget.blur()}
                          onClick={() => void toggleRowDetail(row)}
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
                                Indicadores de la Medida Política
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                MP: {safeText(row.codigoMedidaPolitica)} —{" "}
                                {safeText(row.descripcionMedidaPolitica)}
                              </Typography>
                            </Box>
                          </Stack>

                          <Tooltip title="Recargar detalle" arrow>
                            <IconButton
                              size="small"
                              onMouseDown={(event) =>
                                event.currentTarget.blur()
                              }
                              onClick={() => void reloadRowDetail(row)}
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
                        ) : !detail?.data?.length ? (
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
                                {detail.data.map((indicador) => (
                                  <TableRow
                                    key={`${indicador.idPrcpOpPiMp}-${indicador.idIndicadorNombre}`}
                                    hover
                                  >
                                    <TableCell sx={{ fontWeight: 950 }}>
                                      {indicador.codigoIndicador}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        whiteSpace: "normal",
                                        wordBreak: "break-word",
                                        lineHeight: 1.45,
                                      }}
                                    >
                                      {indicador.nombreIndicador}
                                    </TableCell>
                                    <TableCell align="right">
                                      <Tooltip title="Abrir indicador" arrow>
                                        <IconButton
                                          size="small"
                                          onMouseDown={(event) =>
                                            event.currentTarget.blur()
                                          }
                                          onClick={() =>
                                            openIndicadorModal(row, indicador)
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

      <PrcpIndicadorDetalleModal
        open={indicadorModal.open}
        onClose={() => setIndicadorModal((prev) => ({ ...prev, open: false }))}
        idPrcpOpPiMp={indicadorModal.idPrcpOpPiMp}
        idIndicadorNombre={indicadorModal.idIndicadorNombre}
        codigoIndicador={indicadorModal.codigoIndicador}
        nombreIndicador={indicadorModal.nombreIndicador}
        objetivoPrioritario={indicadorModal.objetivoPrioritario}
        problemaIdentificado={indicadorModal.problemaIdentificado}
        medidaPolitica={indicadorModal.medidaPolitica}
      />
    </Box>
  );
}
