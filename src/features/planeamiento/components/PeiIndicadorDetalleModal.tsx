import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";

import {
  PeiOeiAeiVistaAction,
  type PeiIndicadorDetalleResponseDto,
} from "../PeiOeiAeiVistaAction";
import PeiIndicadorInfoModal from "./PeiIndicadorInfoModal";
import PeiIndicadorFichaModal from "./PeiIndicadorFichaModal";

type Props = {
  open: boolean;
  onClose: () => void;
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  oei?: string | null;
  aei?: string | null;
};

function safeText(value?: string | null): string {
  const txt = (value ?? "").toString().trim();
  return txt.length === 0 ? "—" : txt;
}

function formatNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Error no controlado al cargar el detalle.";
  }
}

function parseDecimalInput(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)}%`;
}

function calcularAvancePorcentaje(
  valorEjecutado: string | number | null | undefined,
  valorMeta: number | null | undefined
): number | null {
  const ejecutado =
    typeof valorEjecutado === "string"
      ? parseDecimalInput(valorEjecutado)
      : Number(valorEjecutado ?? 0);

  const meta = Number(valorMeta ?? 0);

  if (!Number.isFinite(ejecutado) || !Number.isFinite(meta) || meta === 0) {
    return null;
  }

  return (ejecutado / meta) * 100;
}

export default function PeiIndicadorDetalleModal({
  open,
  onClose,
  idPeiOeiAei,
  idIndicadorNombre,
  codigoIndicador,
  nombreIndicador,
  oei,
  aei,
}: Props): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<PeiIndicadorDetalleResponseDto | null>(null);

  const [ejecutadoForm, setEjecutadoForm] = useState<Record<number, string>>({});
  const [savingEjecutado, setSavingEjecutado] = useState<boolean>(false);
  const [semestreIForm, setSemestreIForm] = useState<Record<number, string>>({});
  const [savingSemestreI, setSavingSemestreI] = useState<boolean>(false);
  const [idRelevancia, setIdRelevancia] = useState<string>("");
  const [idSentidoEsperado, setIdSentidoEsperado] = useState<string>("");
  const [idTipoAgregacion, setIdTipoAgregacion] = useState<string>("");
  const [savingInfoEditable, setSavingInfoEditable] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [openInfoModal, setOpenInfoModal] = useState<boolean>(false);
  const [openFichaModal, setOpenFichaModal] = useState<boolean>(false);

  const loadDetalle = async (
    currentIdPeiOeiAei: number,
    currentIdIndicadorNombre: number
  ) => {
    if (!currentIdPeiOeiAei || !currentIdIndicadorNombre) {
      setData(null);
      setErrorMsg("");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await PeiOeiAeiVistaAction.getIndicadorDetalle(
        currentIdPeiOeiAei,
        currentIdIndicadorNombre,
        null,
        null
      );

      if (!res) {
        setData(null);
        setErrorMsg(
          `El endpoint devolvió data = null. idPeiOeiAei=${currentIdPeiOeiAei}, idIndicadorNombre=${currentIdIndicadorNombre}`
        );
        return;
      }

      setData(res);
    } catch (error) {
      setData(null);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadDetalle(idPeiOeiAei, idIndicadorNombre);
  }, [open, idPeiOeiAei, idIndicadorNombre]);

  useEffect(() => {
    const map: Record<number, string> = {};
    for (const item of data?.valoresEjecutadoPorAnio ?? []) {
      map[item.idAnioProyeccion] = String(item.valor ?? 0);
    }
    setEjecutadoForm(map);
  }, [data]);


  useEffect(() => {
    const map: Record<number, string> = {};
    for (const item of data?.valoresEjecutadoSemestreIPorAnio ?? []) {
      map[item.idAnioProyeccion] = String(item.valor ?? 0);
    }
    setSemestreIForm(map);
  }, [data]);

  useEffect(() => {
    setIdRelevancia(data?.infoEditable?.idRelevancia != null ? String(data.infoEditable.idRelevancia) : "");
    setIdSentidoEsperado(
      data?.infoEditable?.idSentidoEsperado != null
        ? String(data.infoEditable.idSentidoEsperado)
        : ""
    );
    setIdTipoAgregacion(
      data?.infoEditable?.idTipoAgregacion != null ? String(data.infoEditable.idTipoAgregacion) : ""
    );
  }, [data]);
  const codigoIndicadorView = useMemo(() => {
    return safeText(data?.codigoIndicador ?? codigoIndicador);
  }, [data, codigoIndicador]);

  const nombreIndicadorView = useMemo(() => {
    return safeText(data?.nombreIndicador ?? nombreIndicador);
  }, [data, nombreIndicador]);

  const resumenOei = useMemo(() => {
    if (data?.codigoOei || data?.enunciadoOei) {
      return `${safeText(data?.codigoOei)} - ${safeText(data?.enunciadoOei)}`;
    }
    return safeText(oei);
  }, [data, oei]);

  const resumenAei = useMemo(() => {
    if (data?.tipoNivel === "OEI") return "—";
    if (data?.codigoAei || data?.enunciadoAei) {
      return `${safeText(data?.codigoAei)} - ${safeText(data?.enunciadoAei)}`;
    }
    return safeText(aei);
  }, [data, aei]);

  const metaPorAnioMap = useMemo(() => {
    const map = new Map<number, number>();

    for (const item of data?.valoresMetaPorAnio ?? []) {
      map.set(item.idAnioProyeccion, Number(item.valorAbsolutoA ?? 0));
    }

    return map;
  }, [data]);

  async function guardarEjecutado() {
    try {
      setSavingEjecutado(true);
      setErrorMsg("");
      setSuccessMsg("");

      await PeiOeiAeiVistaAction.guardarIndicadorEjecutado({
        idPeiOeiAei,
        idIndicadorNombre,
        valores: (data?.valoresEjecutadoPorAnio ?? []).map((x) => ({
          idAnioProyeccion: x.idAnioProyeccion,
          valor: parseDecimalInput(ejecutadoForm[x.idAnioProyeccion] ?? "0"),
        })),
      });

      await loadDetalle(idPeiOeiAei, idIndicadorNombre);

      setSuccessMsg(
        "Los valores ejecutados anuales del indicador PEI se guardaron correctamente.",
      );
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSavingEjecutado(false);
    }
  }

  async function guardarSemestreI() {
    try {
      setSavingSemestreI(true);
      setErrorMsg("");
      setSuccessMsg("");

      await PeiOeiAeiVistaAction.guardarIndicadorEjecutadoSemestreI({
        idPeiOeiAei,
        idIndicadorNombre,
        valores: (data?.valoresEjecutadoSemestreIPorAnio ?? []).map((x) => ({
          idAnioProyeccion: x.idAnioProyeccion,
          valor: parseDecimalInput(semestreIForm[x.idAnioProyeccion] ?? "0"),
        })),
      });

      await loadDetalle(idPeiOeiAei, idIndicadorNombre);

      setSuccessMsg(
        "Los valores ejecutados del Semestre I se guardaron correctamente.",
      );
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSavingSemestreI(false);
    }
  }

  async function guardarInfoEditable() {
    try {
      setSavingInfoEditable(true);
      setErrorMsg("");
      setSuccessMsg("");

      await PeiOeiAeiVistaAction.guardarIndicadorInfoEditable({
        idPeiOeiAei,
        idIndicadorNombre,
        idRelevancia: idRelevancia ? Number(idRelevancia) : null,
        idSentidoEsperado: idSentidoEsperado ? Number(idSentidoEsperado) : null,
        idTipoAgregacion: idTipoAgregacion ? Number(idTipoAgregacion) : null,
      });

      await loadDetalle(idPeiOeiAei, idIndicadorNombre);

      setSuccessMsg(
        "La información editable del indicador PEI se guardó correctamente.",
      );
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSavingInfoEditable(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth={false}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: "calc(100vw - 24px)", md: 1040, lg: 1120 },
            maxWidth: "calc(100vw - 24px)",
            borderRadius: 4,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.96) 100%)",
            boxShadow: "0 24px 70px rgba(15,23,42,0.24)",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2.1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(15,23,42,0.08)",
            background:
              "linear-gradient(90deg, rgba(240,253,244,0.95) 0%, rgba(255,255,255,0.98) 48%, rgba(255,255,255,0.94) 100%)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#16a34a",
                background: "linear-gradient(135deg, rgba(220,252,231,.95), rgba(255,255,255,.92))",
                border: "1px solid rgba(34,197,94,.22)",
                boxShadow: "0 12px 26px rgba(34,197,94,.12)",
                flexShrink: 0,
              }}
            >
              <TrendingUpRoundedIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography sx={{ fontSize: 22, fontWeight: 950, letterSpacing: "-0.03em", color: "#0f172a" }}>
                  Indicador PEI
                </Typography>
                <Chip
                  size="small"
                  label={data?.tipoNivel ?? "OEI"}
                  sx={{
                    height: 26,
                    borderRadius: 999,
                    fontWeight: 950,
                    color: "#15803d",
                    border: "1px solid rgba(34,197,94,.25)",
                    background: "rgba(220,252,231,.8)",
                  }}
                />
              </Stack>
              <Typography sx={{ mt: 0.25, fontSize: 13, color: "#64748b", fontWeight: 600 }} noWrap>
                Indicador: {nombreIndicadorView}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Chip
              label="Resumen"
              icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#16a34a" }} />}
              sx={{
                height: 34,
                borderRadius: 2,
                fontWeight: 900,
                color: "#15803d",
                border: "1px solid rgba(34,197,94,.25)",
                background: "rgba(240,253,244,.95)",
                boxShadow: "0 8px 18px rgba(34,197,94,.08)",
                "& .MuiChip-icon": { ml: 1.1 },
              }}
            />
            <IconButton onClick={onClose} sx={{ borderRadius: 2, color: "#475569" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            px: { xs: 2.2, md: 3.2 },
            py: 3,
            background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.88))",
          }}
        >
          {errorMsg ? (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          ) : null}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.1, md: 2.45 },
              mb: 2.25,
              borderRadius: 3,
              border: "1px solid rgba(148,163,184,.32)",
              background: "rgba(255,255,255,.82)",
              boxShadow: "0 10px 28px rgba(15,23,42,.05)",
            }}
          >
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "88px 180px 1fr" }, gap: 2, alignItems: "center" }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#15803d",
                  border: "1px solid rgba(34,197,94,.25)",
                  background: "linear-gradient(135deg, rgba(240,253,244,.92), rgba(255,255,255,.95))",
                }}
              >
                <DescriptionRoundedIcon fontSize="large" />
              </Box>

              <Stack spacing={0.8}>
                <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Código</Typography>
                <Typography sx={{ fontSize: 15, color: "#0f172a", fontWeight: 950 }}>{codigoIndicadorView}</Typography>
              </Stack>

              <Box sx={{ borderLeft: { xs: "none", md: "1px solid rgba(148,163,184,.35)" }, pl: { xs: 0, md: 3 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 950 }}>
                    Nivel: <Box component="span" sx={{ color: "#0f172a" }}>{safeText(data?.tipoNivel)}</Box>
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 12.5, color: "#475569", fontWeight: 700, lineHeight: 1.55 }}>
                  OEI: {resumenOei}
                </Typography>
                {data?.tipoNivel === "AEI" ? (
                  <Typography sx={{ fontSize: 12.5, color: "#475569", fontWeight: 700, lineHeight: 1.55 }}>
                    AEI: {resumenAei}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.1, md: 2.55 },
              mb: 2.25,
              borderRadius: 3,
              border: "1px solid rgba(191,219,254,.9)",
              background: "rgba(255,255,255,.9)",
              boxShadow: "0 12px 28px rgba(37,99,235,.05)",
            }}
          >
            <SectionTitle icon={<SettingsRoundedIcon />} title="Configuración general" color="#2563eb" />
            <Box sx={{ mt: 1.6, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 0.7fr 1.35fr" }, gap: 2 }}>
              <InfoBox label="Fuente de datos" value={safeText(data?.nombreFuenteDatos)} />
              <InfoBox label="Periodicidad" value={safeText(data?.nombrePeriodicidad)} />
              <InfoBox label="Método de cálculo" value={safeText(data?.nombreMetodoCalculo)} />
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.1, md: 2.55 },
              mb: 2.25,
              borderRadius: 3,
              border: "1px solid rgba(186,230,253,.9)",
              background: "linear-gradient(180deg, rgba(239,246,255,.68), rgba(255,255,255,.94))",
              boxShadow: "0 12px 28px rgba(59,130,246,.06)",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.4 }}>
                  <EditNoteRoundedIcon sx={{ color: "#2563eb" }} />
                  <Typography sx={{ fontSize: 17, fontWeight: 950, color: "#1d4ed8" }}>Información editable</Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#64748b", fontWeight: 700 }}>
                    Estos campos pueden modificarse.
                  </Typography>
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                  <TextField select label="Relevancia" size="small" fullWidth value={idRelevancia} onChange={(e) => setIdRelevancia(e.target.value)} sx={premiumFieldSx}>
                    <MenuItem value="">Seleccionar</MenuItem>
                    {(data?.catalogoRelevancia ?? []).map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>)}
                  </TextField>
                  <TextField select label="Sentido esperado" size="small" fullWidth value={idSentidoEsperado} onChange={(e) => setIdSentidoEsperado(e.target.value)} sx={premiumFieldSx}>
                    <MenuItem value="">Seleccionar</MenuItem>
                    {(data?.catalogoSentidoEsperado ?? []).map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>)}
                  </TextField>
                  <TextField select label="Tipo de agregación" size="small" fullWidth value={idTipoAgregacion} onChange={(e) => setIdTipoAgregacion(e.target.value)} sx={premiumFieldSx}>
                    <MenuItem value="">Seleccionar</MenuItem>
                    {(data?.catalogoTipoAgregacion ?? []).map((item) => <MenuItem key={item.id} value={String(item.id)}>{item.nombre}</MenuItem>)}
                  </TextField>
                </Box>
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={guardarInfoEditable}
                disabled={savingInfoEditable || loading}
                startIcon={<SaveRoundedIcon />}
                sx={{
                  minWidth: 190,
                  height: 48,
                  borderRadius: 2.2,
                  fontWeight: 950,
                  boxShadow: "0 12px 22px rgba(37,99,235,.24)",
                }}
              >
                {savingInfoEditable ? "Guardando..." : "Guardar cambios"}
              </Button>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.1, md: 2.55 },
              mb: 2.25,
              borderRadius: 3,
              border: "1px solid rgba(187,247,208,.9)",
              background: "linear-gradient(135deg, rgba(240,253,244,.9), rgba(255,255,255,.96))",
              boxShadow: "0 12px 28px rgba(34,197,94,.06)",
            }}
          >
            <SectionTitle icon={<FlagRoundedIcon />} title="Línea base" color="#16a34a" />
            <Box sx={{ mt: 1.6, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.1fr 1fr" }, gap: 2 }}>
              <MetricBox icon={<CalendarMonthRoundedIcon />} label="Año de proyección" value={data?.lineaBase?.anio != null ? String(data.lineaBase.anio) : "—"} tone="blue" />
              <MetricBox icon={<TagRoundedIcon />} label="Tipo de valor" value={data?.lineaBase?.codigoTipoValor || data?.lineaBase?.nombreTipoValor ? `${safeText(data?.lineaBase?.codigoTipoValor)} - ${safeText(data?.lineaBase?.nombreTipoValor)}` : "—"} tone="amber" />
              <MetricBox icon={<TrendingUpRoundedIcon />} label="Valor línea base" value={formatNumber(data?.lineaBase?.valorLineaBase)} tone="green" highlight />
            </Box>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2.35 }}>
            <AnnualCard
              color="#2563eb"
              bg="rgba(239,246,255,.78)"
              icon={<BarChartRoundedIcon />}
              title="Valores Meta Anual"
              subtitle="Metas planificadas para cada año."
            >
              {loading ? <LoadingMini text="Cargando valores..." /> : !data?.valoresMetaPorAnio || data.valoresMetaPorAnio.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No existen valores META por año para este indicador.</Alert>
              ) : (
                <Stack spacing={1}>
                  {(data?.valoresMetaPorAnio ?? []).map((item) => (
                    <ValueRow key={item.idAnioProyeccion} year={item.anio} value={formatNumber(item.valorAbsolutoA)} />
                  ))}
                </Stack>
              )}
              <CardNote color="#2563eb" text="Valores definidos como meta anual del indicador." />
            </AnnualCard>

            <AnnualCard
              color="#d97706"
              bg="rgba(255,247,237,.88)"
              icon={<CalendarMonthRoundedIcon />}
              title="Valores Ejecutado Semestral"
              subtitle="Avance real por semestre y % de avance anual."
            >
              {loading ? <LoadingMini text="Cargando valores Semestre I..." /> : !data?.valoresEjecutadoSemestreIPorAnio || data.valoresEjecutadoSemestreIPorAnio.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No existen años de META para este indicador y por tanto no hay ejecutado de Semestre I a registrar.</Alert>
              ) : (
                <Stack spacing={1}>
                  {(data?.valoresEjecutadoSemestreIPorAnio ?? []).map((item) => {
                    const valorSemestreI = semestreIForm[item.idAnioProyeccion] ?? "0";
                    const valorMeta = metaPorAnioMap.get(item.idAnioProyeccion) ?? 0;
                    const avance = calcularAvancePorcentaje(valorSemestreI, valorMeta);
                    return (
                      <EditableValueRow
                        key={item.idAnioProyeccion}
                        year={item.anio}
                        value={valorSemestreI}
                        onChange={(value) => setSemestreIForm((prev) => ({ ...prev, [item.idAnioProyeccion]: value }))}
                        percent={avance == null ? "—" : formatPercent(avance)}
                        tone="amber"
                      />
                    );
                  })}
                </Stack>
              )}
              <CardNote color="#d97706" text="El % de avance se calcula contra la meta anual." />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                <Button variant="contained" size="small" onClick={guardarSemestreI} disabled={savingSemestreI || loading} sx={{ borderRadius: 2, fontWeight: 950, boxShadow: "0 10px 18px rgba(37,99,235,.18)" }}>
                  {savingSemestreI ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            </AnnualCard>

            <AnnualCard
              color="#16a34a"
              bg="rgba(240,253,244,.86)"
              icon={<TrendingUpRoundedIcon />}
              title="Valores Ejecutado Anual"
              subtitle="Ejecución acumulada real vs. meta anual."
            >
              {loading ? <LoadingMini text="Cargando valores ejecutados..." /> : !data?.valoresEjecutadoPorAnio || data.valoresEjecutadoPorAnio.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No existen años de META para este indicador y por tanto no hay ejecutado anual a registrar.</Alert>
              ) : (
                <Stack spacing={1}>
                  {(data?.valoresEjecutadoPorAnio ?? []).map((item) => {
                    const valorEjecutado = ejecutadoForm[item.idAnioProyeccion] ?? "0";
                    const valorMeta = metaPorAnioMap.get(item.idAnioProyeccion) ?? 0;
                    const avance = calcularAvancePorcentaje(valorEjecutado, valorMeta);
                    return (
                      <EditableValueRow
                        key={item.idAnioProyeccion}
                        year={item.anio}
                        value={valorEjecutado}
                        onChange={(value) => setEjecutadoForm((prev) => ({ ...prev, [item.idAnioProyeccion]: value }))}
                        percent={avance == null ? "—" : formatPercent(avance)}
                        tone="green"
                      />
                    );
                  })}
                </Stack>
              )}
              <CardNote color="#16a34a" text="Comparación de ejecución acumulada contra meta anual." />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                <Button variant="contained" size="small" onClick={guardarEjecutado} disabled={savingEjecutado} sx={{ borderRadius: 2, fontWeight: 950, boxShadow: "0 10px 18px rgba(37,99,235,.18)" }}>
                  {savingEjecutado ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            </AnnualCard>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2.2, md: 3.2 },
            py: 2.2,
            borderTop: "1px solid rgba(15,23,42,.08)",
            background: "rgba(255,255,255,.9)",
          }}
        >
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpenFichaModal(true)} variant="outlined" startIcon={<AttachFileRoundedIcon />} sx={{ minWidth: 150, height: 46, fontWeight: 900, borderRadius: 2.2 }}>
            Ficha
          </Button>
          <Button onClick={() => setOpenInfoModal(true)} variant="outlined" color="info" startIcon={<InfoOutlinedIcon />} sx={{ minWidth: 150, height: 46, fontWeight: 900, borderRadius: 2.2 }}>
            Info
          </Button>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 150, height: 46, fontWeight: 900, borderRadius: 2.2 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <PeiIndicadorFichaModal
        open={openFichaModal}
        onClose={() => setOpenFichaModal(false)}
        idPeiOeiAei={idPeiOeiAei}
        idIndicadorNombre={idIndicadorNombre}
        codigoIndicador={codigoIndicadorView}
        nombreIndicador={nombreIndicadorView}
        tipoNivel={data?.tipoNivel ?? null}
      />

      <PeiIndicadorInfoModal
        open={openInfoModal}
        onClose={() => setOpenInfoModal(false)}
        idPeiOeiAei={idPeiOeiAei}
        idIndicadorNombre={idIndicadorNombre}
        codigoIndicador={codigoIndicadorView}
        nombreIndicador={nombreIndicadorView}
        tipoNivel={data?.tipoNivel ?? null}
      />

      <Snackbar
        open={Boolean(successMsg)}
        autoHideDuration={3000}
        onClose={(_event, reason) => {
          if (reason === "clickaway") return;
          setSuccessMsg("");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMsg("")}
          sx={{
            width: "100%",
            minWidth: { xs: 280, sm: 500 },
            borderRadius: 2,
            fontWeight: 900,
            boxShadow: "0 14px 35px rgba(15,23,42,.22)",
          }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

const premiumFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,.94)",
    fontWeight: 800,
  },
  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148,163,184,.36)",
  },
} as const;

function SectionTitle({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <Stack direction="row" spacing={1.1} alignItems="center">
      <Box sx={{ color, display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography sx={{ fontSize: 17, fontWeight: 950, color }}>{title}</Typography>
    </Stack>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800, mb: 0.55 }}>{label}</Typography>
      <Box sx={{ minHeight: 52, px: 2, py: 1.35, borderRadius: 2, border: "1px solid rgba(148,163,184,.34)", background: "rgba(248,250,252,.8)", display: "flex", alignItems: "center" }}>
        <Typography sx={{ fontSize: 14, color: "#0f172a", fontWeight: 750, lineHeight: 1.35 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

function MetricBox({ icon, label, value, tone, highlight }: { icon: React.ReactNode; label: string; value: string; tone: "blue" | "amber" | "green"; highlight?: boolean }) {
  const palette = {
    blue: { color: "#1d4ed8", bg: "rgba(239,246,255,.82)", border: "rgba(191,219,254,.9)" },
    amber: { color: "#d97706", bg: "rgba(255,247,237,.82)", border: "rgba(254,215,170,.9)" },
    green: { color: "#16a34a", bg: "rgba(240,253,244,.82)", border: "rgba(187,247,208,.95)" },
  }[tone];
  return (
    <Box sx={{ minHeight: 70, px: 2, py: 1.4, borderRadius: 2.4, border: `1px solid ${palette.border}`, background: palette.bg, display: "flex", alignItems: "center", gap: 1.4 }}>
      <Box sx={{ color: palette.color, display: "grid", placeItems: "center" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>{label}</Typography>
        <Typography sx={{ fontSize: highlight ? 22 : 16, color: palette.color, fontWeight: 950, lineHeight: 1.15 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

function AnnualCard({ color, bg, icon, title, subtitle, children }: { color: string; bg: string; icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, border: `1px solid ${color}33`, background: bg, minHeight: 290, boxShadow: "0 14px 34px rgba(15,23,42,.06)" }}>
      <Stack direction="row" spacing={1.1} alignItems="flex-start" sx={{ mb: 1.4 }}>
        <Box sx={{ color, mt: 0.1, display: "grid", placeItems: "center" }}>{icon}</Box>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 950, color, lineHeight: 1.15 }}>{title}</Typography>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#64748b", mt: 0.2 }}>{subtitle}</Typography>
        </Box>
      </Stack>
      {children}
    </Paper>
  );
}

function ValueRow({ year, value }: { year: number | string; value: string }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "82px 1fr", alignItems: "center", gap: 1, px: 1.2, py: 0.9, borderRadius: 2, border: "1px solid rgba(148,163,184,.22)", background: "rgba(255,255,255,.84)" }}>
      <Chip label={String(year)} size="small" sx={{ height: 24, borderRadius: 999, fontWeight: 950, color: "#2563eb", border: "1px solid rgba(37,99,235,.24)", background: "rgba(239,246,255,.9)" }} />
      <Typography sx={{ textAlign: "right", fontSize: 14, fontWeight: 850, color: "#0f172a" }}>{value}</Typography>
    </Box>
  );
}

function EditableValueRow({ year, value, onChange, percent, tone }: { year: number | string; value: string; onChange: (value: string) => void; percent: string; tone: "amber" | "green" }) {
  const palette = tone === "green" ? { color: "#16a34a", bg: "rgba(240,253,244,.9)", border: "rgba(34,197,94,.22)" } : { color: "#d97706", bg: "rgba(255,247,237,.9)", border: "rgba(245,158,11,.22)" };
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "72px 1fr 82px", alignItems: "center", gap: 1, px: 1.2, py: 0.7, borderRadius: 2, border: "1px solid rgba(148,163,184,.22)", background: "rgba(255,255,255,.84)" }}>
      <Chip label={String(year)} size="small" sx={{ height: 24, borderRadius: 999, fontWeight: 950, color: palette.color, border: `1px solid ${palette.border}`, background: palette.bg }} />
      <TextField value={value} size="small" onChange={(e) => onChange(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { height: 32, borderRadius: 999, backgroundColor: "rgba(255,255,255,.9)" }, "& .MuiInputBase-input": { textAlign: "right", fontSize: 13, fontWeight: 800, py: 0.5 } }} />
      <Chip label={percent} size="small" sx={{ height: 24, borderRadius: 999, fontWeight: 950, color: palette.color, border: `1px solid ${palette.border}`, background: palette.bg }} />
    </Box>
  );
}

function CardNote({ color, text }: { color: string; text: string }) {
  return (
    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1.5, color: "#64748b" }}>
      <InfoOutlinedIcon sx={{ fontSize: 16, color }} />
      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{text}</Typography>
    </Stack>
  );
}

function LoadingMini({ text }: { text: string }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ py: 2 }}>
      <CircularProgress size={18} />
      <Typography sx={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>{text}</Typography>
    </Stack>
  );
}