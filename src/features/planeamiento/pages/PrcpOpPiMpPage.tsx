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
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
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
          sx={{ lineHeight: 1.35, mb: 0.35 }}
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
    [periodos, idPeriodoSel]
  );

  const objetivoSelectedObj = useMemo(
    () => objetivos.find((x) => x.idObjetivoPrioritario === idObjetivoSel) ?? null,
    [objetivos, idObjetivoSel]
  );

  const medidaSelectedObj = useMemo(
    () => medidas.find((x) => x.idMedidaPolitica === idMedidaSel) ?? null,
    [medidas, idMedidaSel]
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
    [rows]
  );

  const mpCount = useMemo(
    () => new Set(rows.map((x) => x.idMedidaPolitica)).size,
    [rows]
  );

  const filterByTexto = <
    T extends {
      codigo: string | null;
      descripcion?: string | null;
      denominacion?: string | null;
      nombre?: string | null;
    }
  >(
    options: readonly T[],
    inputValue: string
  ): T[] => {
    const q = normalize(inputValue);
    if (!q) return options.slice() as T[];

    return options.filter((o) => {
      const content = `${o.codigo ?? ""} ${o.descripcion ?? ""} ${o.denominacion ?? ""} ${o.nombre ?? ""}`.toLowerCase();
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
      const objetivosDb = await PrcpOpPiMpVistaAction.getObjetivosPrioritarios(idPeriodo);
      setObjetivos(objetivosDb ?? []);

      const objetivoVigente = objetivosDb?.some((x) => x.idObjetivoPrioritario === idObjetivoSel)
        ? idObjetivoSel
        : 0;

      if (objetivoVigente !== idObjetivoSel) {
        setIdObjetivoSel(objetivoVigente);
      }

      const medidasDb = await PrcpOpPiMpVistaAction.getMedidasPoliticas(
        idPeriodo,
        objetivoVigente || null
      );

      setMedidas(medidasDb ?? []);
      setIdMedidaSel((current) =>
        medidasDb?.some((x) => x.idMedidaPolitica === current) ? current : 0
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
    idObjetivoPrioritario: number
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
        idObjetivoPrioritario || null
      );

      setMedidas(medidasDb ?? []);
      setIdMedidaSel((current) =>
        medidasDb?.some((x) => x.idMedidaPolitica === current) ? current : 0
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
    idMedidaPolitica: number
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
        idMedidaPolitica || 0
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
        idObjetivoSel || row.idObjetivoPrioritario || null
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

  function openIndicadorModal(row: PrcpOpPiMpMasterDto, indicador: PrcpOpPiMpDetailDto): void {
    setIndicadorModal({
      open: true,
      idPrcpOpPiMp: indicador.idPrcpOpPiMp || row.idPrcpOpPiMp,
      idIndicadorNombre: indicador.idIndicadorNombre,
      codigoIndicador: indicador.codigoIndicador,
      nombreIndicador: indicador.nombreIndicador,
      objetivoPrioritario: `${safeText(row.codigoObjetivoPrioritario)} - ${safeText(
        row.descripcionObjetivoPrioritario
      )}`,
      problemaIdentificado: `${safeText(row.codigoProblemaIdentificado)} - ${safeText(
        row.descripcionProblemaIdentificado
      )}`,
      medidaPolitica: `${safeText(row.codigoMedidaPolitica)} - ${safeText(
        row.descripcionMedidaPolitica
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

  const colSpanMaster = 7;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBackRoundedIcon />
          </IconButton>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              P.R.C.P.: OP / PI / MP
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vista por Horizonte, Objetivo Prioritario y Medida Política
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`OP: ${objetivoCount}`} variant="outlined" />
          <Chip label={`MP: ${mpCount}`} variant="outlined" />
          <Chip label={`Registros: ${rowsFiltered.length}`} variant="outlined" />
          <Tooltip title="Refrescar">
            <IconButton onClick={() => void loadTabla(idPeriodoSel, idObjetivoSel, idMedidaSel)}>
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
        {errorMsg ? (
          <Alert severity="warning" sx={{ borderRadius: 2, mb: 1.5 }}>
            {errorMsg}
          </Alert>
        ) : null}

        <Stack direction="column" spacing={1.25} sx={{ width: "100%" }}>
          <Autocomplete
            options={periodos}
            value={periodoSelectedObj}
            onChange={(_event, value) => {
              setIdPeriodoSel(value?.idPeriodo ?? 0);
              setIdObjetivoSel(0);
              setIdMedidaSel(0);
            }}
            getOptionLabel={(option) => `${option.codigo ?? "—"} - ${option.descripcion ?? "—"}`}
            isOptionEqualToValue={(option, value) => option.idPeriodo === value.idPeriodo}
            filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
            renderInput={(params) => <TextField {...params} label="Horizonte" size="small" />}
            sx={{ width: "100%", ...comboSx }}
          />

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ width: "100%" }}>
            <Autocomplete
              options={objetivos}
              value={objetivoSelectedObj}
              loading={loadingObjetivos}
              onChange={(_event, value) => {
                setIdObjetivoSel(value?.idObjetivoPrioritario ?? 0);
                setIdMedidaSel(0);
              }}
              getOptionLabel={(option) => `${option.codigo ?? "—"} - ${option.descripcion ?? "—"}`}
              isOptionEqualToValue={(option, value) =>
                option.idObjetivoPrioritario === value.idObjetivoPrioritario
              }
              filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
              renderInput={(params) => <TextField {...params} label="Objetivo Prioritario" size="small" />}
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

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ width: "100%" }}>
            <Autocomplete
              options={medidas}
              value={medidaSelectedObj}
              loading={loadingMedidas}
              onChange={(_event, value) => setIdMedidaSel(value?.idMedidaPolitica ?? 0)}
              getOptionLabel={(option) => `${option.codigo ?? "—"} - ${option.denominacion ?? "—"}`}
              isOptionEqualToValue={(option, value) => option.idMedidaPolitica === value.idMedidaPolitica}
              filterOptions={(options, state) => filterByTexto(options, state.inputValue)}
              renderInput={(params) => <TextField {...params} label="Medida Política" size="small" />}
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
        </Stack>

        <Divider sx={{ my: 2 }} />

        <TextField
          value={qSearch}
          onChange={(event) => setQSearch(event.target.value)}
          placeholder="Buscar por objetivo prioritario, problema identificado, medida política o hitos..."
          fullWidth
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
            },
          }}
        />
      </Paper>

      <TableContainer
        sx={{
          mt: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflowX: "auto",
        }}
      >
        <Table size="small" sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 96 }} />
              <TableCell sx={{ fontWeight: 900, width: 140 }}>Código MP</TableCell>
              <TableCell sx={{ fontWeight: 900, minWidth: 260 }}>Descripción MP</TableCell>
              <TableCell sx={{ fontWeight: 900, minWidth: 260 }}>Hasta Julio 2025</TableCell>
              <TableCell sx={{ fontWeight: 900, minWidth: 260 }}>Hasta Julio 2028</TableCell>
              <TableCell sx={{ fontWeight: 900, minWidth: 260 }}>Hasta Julio 2030</TableCell>
              <TableCell sx={{ fontWeight: 900, width: 110, ...sxStickyActionHeader }} align="right">
                Acción
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loadingTabla ? (
              <TableRow>
                <TableCell colSpan={colSpanMaster}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="body2">Cargando registros...</Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : rowsFiltered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpanMaster}>
                  <Alert severity="info" sx={{ borderRadius: 2, width: "100%" }}>
                    No hay registros para la combinación seleccionada.
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              rowsFiltered.map((row) => {
                const idKey = row.idMedidaPolitica;
                const open = !!openRowMap[idKey];
                const detail = detailMap[idKey];
                const indicadoresCount = row.cantidadIndicadores ?? 0;

                return (
                  <React.Fragment key={`${row.idPeriodo}-${row.idObjetivoPrioritario}-${row.idMedidaPolitica}`}>
                    <TableRow hover>
                      <TableCell sx={{ width: 96, verticalAlign: "middle", py: 1.5 }}>
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                          justifyContent="center"
                          sx={{ minHeight: 56 }}
                        >
                          <Tooltip title={open ? "Ocultar detalle" : "Ver detalle"}>
                            <IconButton
                              size="small"
                              onClick={() => void toggleRowDetail(row)}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 2,
                                border: "1px solid",
                                borderColor: "divider",
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
                            sx={{ height: 20, borderRadius: 2, fontWeight: 900 }}
                          />
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900 }}>{safeText(row.codigoMedidaPolitica)}</TableCell>
                      <TableCell>{safeText(row.descripcionMedidaPolitica)}</TableCell>
                      <TableCell sx={{ verticalAlign: "top" }}>{renderHitos(row.hitosJulio2025)}</TableCell>
                      <TableCell sx={{ verticalAlign: "top" }}>{renderHitos(row.hitosJulio2028)}</TableCell>
                      <TableCell sx={{ verticalAlign: "top" }}>{renderHitos(row.hitosJulio2030)}</TableCell>

                      <TableCell align="right" sx={{ width: 110, ...sxStickyActionCell }}>
                        <Tooltip title={open ? "Ocultar detalle" : "Ver detalle"}>
                          <IconButton
                            size="small"
                            onClick={() => void toggleRowDetail(row)}
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

                    <TableRow>
                      <TableCell colSpan={colSpanMaster} sx={{ p: 0, borderBottom: 0 }}>
                        <Collapse in={open} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: "background.default" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
                              Detalle Indicadores
                            </Typography>

                            {detail?.loading ? (
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <CircularProgress size={18} />
                                <Typography variant="body2">Cargando detalle...</Typography>
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
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 900, width: 180 }}>
                                        Código Indicador
                                      </TableCell>
                                      <TableCell sx={{ fontWeight: 900 }}>Nombre Indicador</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 900, width: 120 }}>
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
                                        <TableCell sx={{ fontWeight: 900 }}>
                                          {indicador.codigoIndicador}
                                        </TableCell>
                                        <TableCell>{indicador.nombreIndicador}</TableCell>
                                        <TableCell align="right">
                                          <Tooltip title="Ver indicador">
                                            <IconButton
                                              size="small"
                                              onClick={() => openIndicadorModal(row, indicador)}
                                              sx={{
                                                width: 30,
                                                height: 30,
                                                borderRadius: 2,
                                                border: "1px solid",
                                                borderColor: "divider",
                                                bgcolor: "rgba(59,130,246,.10)",
                                              }}
                                            >
                                              <PolicyRoundedIcon sx={{ fontSize: 18 }} />
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
