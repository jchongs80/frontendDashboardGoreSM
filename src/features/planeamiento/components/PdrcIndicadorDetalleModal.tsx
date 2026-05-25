import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";

import {
  PdrcOerAerVistaAction,
  type PdrcIndicadorDetalleAnioDto,
  type PdrcIndicadorDetalleMetValorDto,
  type PdrcIndicadorDetalleResponseDto,
} from "../PdrcOerAerVistaAction";
import PdrcIndicadorFichaModal from "./PdrcIndicadorFichaModal";
import PdrcIndicadorInfoModal from "./PdrcIndicadorInfoModal";

type Props = {
  open: boolean;
  onClose: () => void;
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  oer?: string | null;
  aer?: string | null;
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

const fieldSx = {
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

const valueTextFieldSx = {
  ...fieldSx,
  "& .MuiInputBase-input": {
    py: 0.95,
    fontSize: 13,
    textAlign: "right",
  },
} as const;

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 10px 24px rgba(0,0,0,.06)",
} as const;

type ValoresFijos = {
  valorAbsolutoA: number;
  valorAbsolutoB: number;
  valorRelativo: number;
};

function normalizarNombreMet(nombre?: string | null): string {
  return (nombre ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mapValoresFijos(
  valoresMet: PdrcIndicadorDetalleMetValorDto[],
): ValoresFijos {
  let valorAbsolutoA = 0;
  let valorAbsolutoB = 0;
  let valorRelativo = 0;

  for (const item of valoresMet) {
    const nombre = normalizarNombreMet(item.nombreMet);

    if (nombre === "VALOR EN ABSOLUTO A") {
      valorAbsolutoA = Number(item.valor ?? 0);
    } else if (nombre === "VALOR EN ABSOLUTO B") {
      valorAbsolutoB = Number(item.valor ?? 0);
    } else if (nombre === "VALOR EN RELATIVO") {
      valorRelativo = Number(item.valor ?? 0);
    }
  }

  return { valorAbsolutoA, valorAbsolutoB, valorRelativo };
}

export default function PdrcIndicadorDetalleModal({
  open,
  onClose,
  idPdrcOerAer,
  idIndicadorNombre,
  codigoIndicador,
  nombreIndicador,
  oer,
  aer,
}: Props): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingRefresh, setLoadingRefresh] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [data, setData] = useState<PdrcIndicadorDetalleResponseDto | null>(
    null,
  );
  const [anioSel, setAnioSel] = useState<PdrcIndicadorDetalleAnioDto | null>(
    null,
  );

  const [ejecutadoForm, setEjecutadoForm] = useState<Record<number, string>>(
    {},
  );
  const [savingEjecutado, setSavingEjecutado] = useState<boolean>(false);
  const [fichaOpen, setFichaOpen] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);

  const loadDetalle = async (
    currentIdPdrcOerAer: number,
    currentIdIndicadorNombre: number,
    currentIdAnioProyeccion?: number | null,
    preserveSelection?: boolean,
  ) => {
    if (!currentIdPdrcOerAer || !currentIdIndicadorNombre) {
      setData(null);
      setAnioSel(null);
      setErrorMsg("");
      return;
    }

    const setBusy = preserveSelection ? setLoadingRefresh : setLoading;
    setBusy(true);
    setErrorMsg("");

    try {
      const res = await PdrcOerAerVistaAction.getIndicadorDetalle(
        currentIdPdrcOerAer,
        currentIdIndicadorNombre,
        currentIdAnioProyeccion ?? null,
        null,
      );

      if (!res) {
        setData(null);
        setAnioSel(null);
        setErrorMsg(
          `El endpoint devolvió data = null. idPdrcOerAer=${currentIdPdrcOerAer}, idIndicadorNombre=${currentIdIndicadorNombre}`,
        );
        return;
      }

      setData(res);

      const anios = res.anios ?? [];
      const anioSeleccionado =
        anios.find(
          (x) => x.idAnioProyeccion === (currentIdAnioProyeccion ?? -1),
        ) ??
        anios[0] ??
        null;

      setAnioSel(anioSeleccionado);

      if (anios.length === 0) {
        setErrorMsg(
          "La API respondió sin años disponibles para el indicador seleccionado.",
        );
      }
    } catch (error) {
      setData(null);
      setAnioSel(null);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadDetalle(idPdrcOerAer, idIndicadorNombre, null, false);
  }, [open, idPdrcOerAer, idIndicadorNombre]);

  useEffect(() => {
    const map: Record<number, string> = {};
    for (const item of data?.valoresEjecutados ?? []) {
      map[item.idPdrcIndMet] = String(item.valor ?? 0);
    }
    setEjecutadoForm(map);
  }, [data]);

  const codigoIndicadorView = useMemo(() => {
    return safeText(data?.codigoIndicador ?? codigoIndicador);
  }, [data, codigoIndicador]);

  const nombreIndicadorView = useMemo(() => {
    return safeText(data?.nombreIndicador ?? nombreIndicador);
  }, [data, nombreIndicador]);

  const resumenOer = useMemo(() => {
    if (data?.codigoOer || data?.enunciadoOer) {
      return `${safeText(data?.codigoOer)} - ${safeText(data?.enunciadoOer)}`;
    }
    return safeText(oer);
  }, [data, oer]);

  const resumenAer = useMemo(() => {
    if (data?.tipoNivel === "OER") return "—";
    if (data?.codigoAer || data?.enunciadoAer) {
      return `${safeText(data?.codigoAer)} - ${safeText(data?.enunciadoAer)}`;
    }
    return safeText(aer);
  }, [data, aer]);

  const valoresFijos = useMemo(() => {
    return mapValoresFijos(data?.valoresMet ?? []);
  }, [data]);

  async function guardarEjecutado() {
    if (!anioSel) return;

    try {
      setSavingEjecutado(true);
      setErrorMsg("");

      await PdrcOerAerVistaAction.guardarIndicadorEjecutado({
        idPdrcOerAer,
        idIndicadorNombre,
        idAnioProyeccion: anioSel.idAnioProyeccion,
        valores: (data?.valoresEjecutados ?? []).map((x) => ({
          idPdrcIndMet: x.idPdrcIndMet,
          valor: parseDecimalInput(ejecutadoForm[x.idPdrcIndMet] ?? "0"),
        })),
      });

      await loadDetalle(
        idPdrcOerAer,
        idIndicadorNombre,
        anioSel.idAnioProyeccion,
        true,
      );
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSavingEjecutado(false);
    }
  }

  const handleChangeAnio = async (
    _event: unknown,
    value: PdrcIndicadorDetalleAnioDto | null,
  ) => {
    setAnioSel(value);

    await loadDetalle(
      idPdrcOerAer,
      idIndicadorNombre,
      value?.idAnioProyeccion ?? null,
      true,
    );
  };

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
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#16a34a",
                background:
                  "linear-gradient(135deg, rgba(220,252,231,.95), rgba(255,255,255,.92))",
                border: "1px solid rgba(34,197,94,.22)",
                boxShadow: "0 12px 26px rgba(34,197,94,.12)",
                flexShrink: 0,
              }}
            >
              <TrendingUpRoundedIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
              >
                <Typography
                  sx={{
                    fontSize: 22,
                    fontWeight: 950,
                    letterSpacing: "-0.03em",
                    color: "#0f172a",
                  }}
                >
                  Indicador PDRC
                </Typography>
                <Chip
                  size="small"
                  label={data?.tipoNivel ?? "OER"}
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
              <Typography
                sx={{
                  mt: 0.25,
                  fontSize: 13,
                  color: "#64748b",
                  fontWeight: 600,
                }}
                noWrap
              >
                Indicador: {nombreIndicadorView}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Chip
              label="Resumen"
              icon={
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#16a34a",
                  }}
                />
              }
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
            <IconButton
              onClick={onClose}
              sx={{ borderRadius: 2, color: "#475569" }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            px: { xs: 2.2, md: 3.2 },
            py: 3,
            background:
              "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.88))",
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
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "88px 180px 1fr" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#15803d",
                  border: "1px solid rgba(34,197,94,.25)",
                  background:
                    "linear-gradient(135deg, rgba(240,253,244,.92), rgba(255,255,255,.95))",
                }}
              >
                <DescriptionRoundedIcon fontSize="large" />
              </Box>

              <Stack spacing={0.8}>
                <Typography
                  sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}
                >
                  Código
                </Typography>
                <Typography
                  sx={{ fontSize: 15, color: "#0f172a", fontWeight: 950 }}
                >
                  {codigoIndicadorView}
                </Typography>
              </Stack>

              <Box
                sx={{
                  borderLeft: {
                    xs: "none",
                    md: "1px solid rgba(148,163,184,.35)",
                  },
                  pl: { xs: 0, md: 3 },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ mb: 1 }}
                >
                  <Typography
                    sx={{ fontSize: 13, color: "#334155", fontWeight: 950 }}
                  >
                    Nivel:{" "}
                    <Box component="span" sx={{ color: "#0f172a" }}>
                      {safeText(data?.tipoNivel)}
                    </Box>
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: "#475569",
                    fontWeight: 700,
                    lineHeight: 1.55,
                  }}
                >
                  OER: {resumenOer}
                </Typography>
                {data?.tipoNivel === "AER" ? (
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      color: "#475569",
                      fontWeight: 700,
                      lineHeight: 1.55,
                    }}
                  >
                    AER: {resumenAer}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.4,
              mb: 2.2,
              borderRadius: 3,
              border: "1px solid rgba(187,247,208,.9)",
              background:
                "linear-gradient(135deg, rgba(240,253,244,.92), rgba(255,255,255,.96))",
              boxShadow: "0 12px 28px rgba(34,197,94,.06)",
            }}
          >
            <PremiumSectionTitle
              icon={<FlagRoundedIcon />}
              title="Línea base"
              color="#16a34a"
            />

            <Box
              sx={{
                mt: 1.6,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "0.85fr 1.3fr" },
                gap: 2,
              }}
            >
              <PremiumMetricBox
                icon={<CalendarMonthRoundedIcon />}
                label="Año de proyección"
                value={
                  data?.lineaBase?.anio != null
                    ? String(data.lineaBase.anio)
                    : "—"
                }
                tone="blue"
              />
              <PremiumMetricBox
                icon={<TagRoundedIcon />}
                label="Tipo de valor"
                value={
                  data?.lineaBase?.codigoTipoValor ||
                  data?.lineaBase?.nombreTipoValor
                    ? `${safeText(data?.lineaBase?.codigoTipoValor)} - ${safeText(data?.lineaBase?.nombreTipoValor)}`
                    : "—"
                }
                tone="amber"
              />
            </Box>

            <Box
              sx={{
                mt: 1.4,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                gap: 2,
              }}
            >
              <PremiumMetricBox
                icon={<DescriptionRoundedIcon />}
                label="Valor absoluto A"
                value={formatNumber(data?.lineaBase?.valorAbsolutoA)}
                tone="green"
                compact
              />
              <PremiumMetricBox
                icon={<DescriptionRoundedIcon />}
                label="Valor absoluto B"
                value={formatNumber(data?.lineaBase?.valorAbsolutoB)}
                tone="green"
                compact
              />
              <PremiumMetricBox
                icon={<TrendingUpRoundedIcon />}
                label="Valor relativo"
                value={formatNumber(data?.lineaBase?.valorRelativo)}
                tone="green"
                highlight
                compact
              />
            </Box>
          </Paper>

          {(data?.anios?.length ?? 0) > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2.4,
                mb: 2.2,
                borderRadius: 3,
                border: "1px solid rgba(191,219,254,.9)",
                background:
                  "linear-gradient(135deg, rgba(239,246,255,.78), rgba(255,255,255,.96))",
                boxShadow: "0 12px 28px rgba(37,99,235,.06)",
              }}
            >
              <PremiumSectionTitle
                icon={<ChecklistRoundedIcon />}
                title="Detalle"
                color="#2563eb"
              />

              <Box
                sx={{
                  mt: 1.6,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "0.85fr 1.3fr" },
                  gap: 2,
                }}
              >
                <Autocomplete
                  options={data?.anios ?? []}
                  value={anioSel}
                  onChange={handleChangeAnio}
                  getOptionLabel={(o) => `${o.anio}`}
                  isOptionEqualToValue={(o, v) =>
                    o.idAnioProyeccion === v.idAnioProyeccion
                  }
                  noOptionsText={loading ? "Cargando..." : "Sin años"}
                  loading={loading || loadingRefresh}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Año de proyección"
                      size="small"
                      sx={premiumFieldSx}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonthRoundedIcon
                              fontSize="small"
                              sx={{ color: "#2563eb" }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {loading || loadingRefresh ? (
                              <CircularProgress size={16} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />

                <TextField
                  label="Tipo de valor"
                  size="small"
                  fullWidth
                  value={
                    data?.codigoTipoValor || data?.nombreTipoValor
                      ? `${safeText(data?.codigoTipoValor)} - ${safeText(data?.nombreTipoValor)}`
                      : "—"
                  }
                  sx={premiumFieldSx}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <TagRoundedIcon
                          fontSize="small"
                          sx={{ color: "#d97706" }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Paper>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 2.4,
              mb: 2.2,
              borderRadius: 3,
              border: "1px solid rgba(191,219,254,.9)",
              background:
                "linear-gradient(135deg, rgba(239,246,255,.82), rgba(255,255,255,.96))",
              boxShadow: "0 12px 28px rgba(37,99,235,.06)",
            }}
          >
            <PremiumSectionTitle
              icon={<BarChartRoundedIcon />}
              title="Valores por indicador"
              color="#2563eb"
            />
            <Typography
              sx={{
                mt: 0.35,
                mb: 1.5,
                fontSize: 12.5,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              El valor mostrado corresponde al año seleccionado.
            </Typography>

            {loading ? (
              <LoadingMini text="Cargando detalle del indicador..." />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                  gap: 2,
                }}
              >
                <PremiumMetricBox
                  icon={<DescriptionRoundedIcon />}
                  label="Valor absoluto A"
                  value={formatNumber(valoresFijos.valorAbsolutoA)}
                  tone="blue"
                  compact
                />
                <PremiumMetricBox
                  icon={<DescriptionRoundedIcon />}
                  label="Valor absoluto B"
                  value={formatNumber(valoresFijos.valorAbsolutoB)}
                  tone="blue"
                  compact
                />
                <PremiumMetricBox
                  icon={<TrendingUpRoundedIcon />}
                  label="Valor relativo"
                  value={formatNumber(valoresFijos.valorRelativo)}
                  tone="blue"
                  highlight
                  compact
                />
              </Box>
            )}
          </Paper>

          {(data?.anios?.length ?? 0) > 0 && (
            <PremiumAnnualCard
              color="#16a34a"
              bg="rgba(240,253,244,.88)"
              icon={<TrendingUpRoundedIcon />}
              title="Valores por indicador - Ejecutado"
              subtitle="Ejecución real del año seleccionado. Estos valores sí se pueden editar."
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1.4,
                }}
              >
                {(data?.valoresEjecutados ?? []).map((item) => (
                  <Box key={item.idPdrcIndMet} sx={{ minWidth: 0 }}>
                    <TextField
                      value={ejecutadoForm[item.idPdrcIndMet] ?? "0"}
                      size="small"
                      fullWidth
                      onChange={(e) =>
                        setEjecutadoForm((prev) => ({
                          ...prev,
                          [item.idPdrcIndMet]: e.target.value,
                        }))
                      }
                      sx={{
                        ...premiumFieldSx,
                        "& .MuiInputBase-input": {
                          py: 0.9,
                          textAlign: "right",
                          fontWeight: 900,
                          fontSize: 13,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Chip
                              size="small"
                              label={safeText(item.nombreMet)}
                              variant="outlined"
                              sx={{
                                height: 24,
                                maxWidth: 136,
                                borderRadius: 999,
                                fontWeight: 900,
                                color: "#15803d",
                                borderColor: "rgba(34,197,94,.35)",
                                background: "rgba(240,253,244,.92)",
                                "& .MuiChip-label": {
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  px: 1,
                                },
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                ))}
              </Box>

              <PremiumCardNote
                color="#16a34a"
                text="Estos valores corresponden al ejecutado real del año seleccionado."
              />

              <Box
                sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}
              >
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SaveRoundedIcon />}
                  onClick={guardarEjecutado}
                  disabled={savingEjecutado || !anioSel}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 950,
                    boxShadow: "0 10px 18px rgba(37,99,235,.18)",
                  }}
                >
                  {savingEjecutado ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            </PremiumAnnualCard>
          )}
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
          <Button
            onClick={() => setFichaOpen(true)}
            variant="outlined"
            startIcon={<AttachFileRoundedIcon />}
            sx={{
              minWidth: 150,
              height: 46,
              fontWeight: 900,
              borderRadius: 2.2,
            }}
          >
            Ficha
          </Button>
          <Button
            onClick={() => setInfoOpen(true)}
            variant="outlined"
            color="info"
            startIcon={<InfoOutlinedIcon />}
            sx={{
              minWidth: 150,
              height: 46,
              fontWeight: 900,
              borderRadius: 2.2,
            }}
          >
            Info
          </Button>
          <Button
            onClick={onClose}
            variant="outlined"
            color="inherit"
            sx={{
              minWidth: 150,
              height: 46,
              fontWeight: 900,
              borderRadius: 2.2,
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <PdrcIndicadorFichaModal
        open={fichaOpen}
        onClose={() => setFichaOpen(false)}
        idPdrcOerAer={idPdrcOerAer}
        idIndicadorNombre={idIndicadorNombre}
        codigoIndicador={codigoIndicadorView}
        nombreIndicador={nombreIndicadorView}
        tipoNivel={data?.tipoNivel ?? "PDRC"}
      />

      <PdrcIndicadorInfoModal
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        idPdrcOerAer={idPdrcOerAer}
        idIndicadorNombre={idIndicadorNombre}
        codigoIndicador={codigoIndicadorView}
        nombreIndicador={nombreIndicadorView}
        tipoNivel={data?.tipoNivel ?? "PDRC"}
      />
    </>
  );
}

const premiumFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,.94)",
    fontWeight: 800,
    minHeight: 54,
  },
  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148,163,184,.36)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,.68)",
  },
} as const;

type Tone = "blue" | "amber" | "green";

function toneStyles(tone: Tone) {
  if (tone === "green") {
    return {
      color: "#16a34a",
      border: "1px solid rgba(34,197,94,.30)",
      background:
        "linear-gradient(135deg, rgba(240,253,244,.94), rgba(255,255,255,.96))",
    };
  }

  if (tone === "amber") {
    return {
      color: "#d97706",
      border: "1px solid rgba(251,191,36,.42)",
      background:
        "linear-gradient(135deg, rgba(255,247,237,.94), rgba(255,255,255,.96))",
    };
  }

  return {
    color: "#2563eb",
    border: "1px solid rgba(147,197,253,.46)",
    background:
      "linear-gradient(135deg, rgba(239,246,255,.94), rgba(255,255,255,.96))",
  };
}

function PremiumSectionTitle({
  icon,
  title,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
}) {
  return (
    <Stack direction="row" spacing={1.1} alignItems="center">
      <Box sx={{ color, display: "grid", placeItems: "center" }}>{icon}</Box>
      <Typography sx={{ fontSize: 17, fontWeight: 950, color }}>
        {title}
      </Typography>
    </Stack>
  );
}

function PremiumMetricBox({
  icon,
  label,
  value,
  tone,
  highlight,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: Tone;
  highlight?: boolean;
  compact?: boolean;
}) {
  const t = toneStyles(tone);

  return (
    <Box
      sx={{
        minHeight: compact ? 62 : 72,
        px: 2,
        py: compact ? 1.15 : 1.45,
        borderRadius: 2.4,
        border: t.border,
        background: t.background,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
      }}
    >
      <Box
        sx={{
          color: t.color,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: 11.5,
            color: "#64748b",
            fontWeight: 850,
            lineHeight: 1.15,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.25,
            fontSize: highlight ? 20 : 14,
            color: highlight ? t.color : "#0f172a",
            fontWeight: 950,
            lineHeight: 1.25,
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function PremiumAnnualCard({
  color,
  bg,
  icon,
  title,
  subtitle,
  children,
}: {
  color: string;
  bg: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.4,
        borderRadius: 3,
        border: `1px solid ${color}33`,
        background: `linear-gradient(180deg, ${bg}, rgba(255,255,255,.96))`,
        boxShadow: "0 12px 28px rgba(15,23,42,.06)",
      }}
    >
      <Stack
        direction="row"
        spacing={1.1}
        alignItems="flex-start"
        sx={{ mb: 1.5 }}
      >
        <Box sx={{ color, display: "grid", placeItems: "center", mt: 0.15 }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontSize: 17, fontWeight: 950, color, lineHeight: 1.15 }}
          >
            {title}
          </Typography>
          <Typography
            sx={{ mt: 0.25, fontSize: 12.2, color: "#64748b", fontWeight: 700 }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Stack>
      {children}
    </Paper>
  );
}

function PremiumEditableMetricRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ sm: "center" }}
    >
      <Chip
        size="small"
        label={label}
        variant="outlined"
        sx={{
          minWidth: { sm: 150 },
          height: 26,
          borderRadius: 999,
          fontWeight: 900,
          color: "#15803d",
          borderColor: "rgba(34,197,94,.35)",
          background: "rgba(240,253,244,.92)",
          "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
        }}
      />
      <TextField
        value={value}
        size="small"
        fullWidth
        onChange={(e) => onChange(e.target.value)}
        sx={{
          ...premiumFieldSx,
          "& .MuiInputBase-input": {
            py: 0.9,
            textAlign: "right",
            fontWeight: 900,
            fontSize: 13,
          },
        }}
      />
    </Stack>
  );
}

function PremiumCardNote({ color, text }: { color: string; text: string }) {
  return (
    <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1.5 }}>
      <InfoOutlinedIcon sx={{ fontSize: 16, color }} />
      <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
        {text}
      </Typography>
    </Stack>
  );
}

function LoadingMini({ text }: { text: string }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
      <CircularProgress size={18} />
      <Typography variant="body2">{text}</Typography>
    </Stack>
  );
}
