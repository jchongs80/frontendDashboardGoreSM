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
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {
  PdrcOerAerVistaAction,
  type PdrcIndicadorDetalleAnioDto,
  type PdrcIndicadorDetalleMetValorDto,
  type PdrcIndicadorDetalleResponseDto,
} from "../PdrcOerAerVistaAction";

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

function mapValoresFijos(valoresMet: PdrcIndicadorDetalleMetValorDto[]): ValoresFijos {
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

  const [data, setData] = useState<PdrcIndicadorDetalleResponseDto | null>(null);
  const [anioSel, setAnioSel] = useState<PdrcIndicadorDetalleAnioDto | null>(null);

  const [ejecutadoForm, setEjecutadoForm] = useState<Record<number, string>>({});
  const [savingEjecutado, setSavingEjecutado] = useState<boolean>(false);

  const loadDetalle = async (
    currentIdPdrcOerAer: number,
    currentIdIndicadorNombre: number,
    currentIdAnioProyeccion?: number | null,
    preserveSelection?: boolean
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
        null
      );

      if (!res) {
        setData(null);
        setAnioSel(null);
        setErrorMsg(
          `El endpoint devolvió data = null. idPdrcOerAer=${currentIdPdrcOerAer}, idIndicadorNombre=${currentIdIndicadorNombre}`
        );
        return;
      }

      setData(res);

      const anios = res.anios ?? [];
      const anioSeleccionado =
        anios.find((x) => x.idAnioProyeccion === (currentIdAnioProyeccion ?? -1)) ??
        anios[0] ??
        null;

      setAnioSel(anioSeleccionado);

      if (anios.length === 0) {
        setErrorMsg("La API respondió sin años disponibles para el indicador seleccionado.");
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

  const totalValores = useMemo(() => {
    return (
      Number(valoresFijos.valorAbsolutoA) +
      Number(valoresFijos.valorAbsolutoB) +
      Number(valoresFijos.valorRelativo)
    );
  }, [valoresFijos]);

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

      await loadDetalle(idPdrcOerAer, idIndicadorNombre, anioSel.idAnioProyeccion, true);
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSavingEjecutado(false);
    }
  }

  const handleChangeAnio = async (_event: unknown, value: PdrcIndicadorDetalleAnioDto | null) => {
    setAnioSel(value);

    await loadDetalle(
      idPdrcOerAer,
      idIndicadorNombre,
      value?.idAnioProyeccion ?? null,
      true
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          width: { xs: "96vw", sm: "92vw", md: 820 },
          maxWidth: "820px",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, rgba(27,111,238,0.10) 0%, rgba(27,111,238,0) 100%)",
        }}
      >
        <Stack spacing={0.55} sx={{ pr: 2, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="nowrap">
            <AccountTreeRoundedIcon fontSize="small" sx={{ mt: 0.15, flexShrink: 0 }} />

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 0.45 }}
              >
                <Typography
                  sx={{
                    fontWeight: 950,
                    letterSpacing: 0.1,
                    lineHeight: 1.2,
                    fontSize: { xs: "0.98rem", sm: "1.05rem" },
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                >
                  Indicador PDRC
                </Typography>

                <Chip
                  size="small"
                  variant="outlined"
                  label={data?.tipoNivel ?? "Detalle"}
                  sx={{ borderRadius: 999, fontWeight: 800 }}
                />
              </Stack>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: "12px",
                  mt: 0.2,
                }}
              >
                Indicador: <b>{nombreIndicadorView}</b>
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Tooltip title="Cerrar">
          <IconButton onClick={onClose} sx={{ borderRadius: 2 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {errorMsg ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(248,250,255,0.92)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            mb: 2,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                icon={<TagRoundedIcon />}
                label={`Código: ${codigoIndicadorView}`}
                sx={{ fontWeight: 900, borderRadius: 999 }}
                variant="outlined"
              />
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Chip
              size="small"
              label="Resumen"
              color="success"
              variant="filled"
              sx={{ borderRadius: 999, fontWeight: 900 }}
            />
          </Stack>

          <Box sx={{ mt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                whiteSpace: "pre-line",
                fontSize: "10.5px",
                lineHeight: 1.45,
              }}
            >
              Nivel: {safeText(data?.tipoNivel)}
              {"\n"}OER: {resumenOer}
              {data?.tipoNivel === "AER" ? `\nAER: ${resumenAer}` : ""}
            </Typography>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <ChecklistRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950 }}>Detalle Línea Base</Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.1,
              mb: 1.1,
            }}
          >
            <TextField
              label="Año Proyección"
              size="small"
              fullWidth
              value={data?.lineaBase?.anio != null ? String(data.lineaBase.anio) : "—"}
              sx={fieldSx}
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="Tipo de Valor"
              size="small"
              fullWidth
              value={
                data?.lineaBase?.codigoTipoValor || data?.lineaBase?.nombreTipoValor
                  ? `${safeText(data?.lineaBase?.codigoTipoValor)} - ${safeText(
                      data?.lineaBase?.nombreTipoValor
                    )}`
                  : "—"
              }
              sx={fieldSx}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <TagRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.1}>
            <TextField
              label=""
              value={formatNumber(data?.lineaBase?.valorAbsolutoA)}
              size="small"
              fullWidth
              sx={valueTextFieldSx}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Chip
                      size="small"
                      label="Valor Absoluto A"
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        height: 20,
                        maxWidth: 150,
                        "& .MuiChip-label": {
                          px: 0.7,
                          fontSize: 10.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label=""
              value={formatNumber(data?.lineaBase?.valorAbsolutoB)}
              size="small"
              fullWidth
              sx={valueTextFieldSx}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Chip
                      size="small"
                      label="Valor Absoluto B"
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        height: 20,
                        maxWidth: 150,
                        "& .MuiChip-label": {
                          px: 0.7,
                          fontSize: 10.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label=""
              value={formatNumber(data?.lineaBase?.valorRelativo)}
              size="small"
              fullWidth
              sx={valueTextFieldSx}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Chip
                      size="small"
                      label="Valor Relativo"
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        height: 20,
                        maxWidth: 150,
                        "& .MuiChip-label": {
                          px: 0.7,
                          fontSize: 10.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Paper>

        {(data?.anios?.length ?? 0) > 0 && (
          <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <ChecklistRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 950 }}>Detalle</Typography>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.1,
              }}
            >
              <Autocomplete
                options={data?.anios ?? []}
                value={anioSel}
                onChange={handleChangeAnio}
                getOptionLabel={(o) => `${o.anio}`}
                isOptionEqualToValue={(o, v) => o.idAnioProyeccion === v.idAnioProyeccion}
                noOptionsText={loading ? "Cargando..." : "Sin años"}
                loading={loading || loadingRefresh}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Año Proyección"
                    size="small"
                    sx={fieldSx}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loading || loadingRefresh ? <CircularProgress size={16} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <TextField
                label="Tipo de Valor"
                size="small"
                fullWidth
                value={
                  data?.codigoTipoValor || data?.nombreTipoValor
                    ? `${safeText(data?.codigoTipoValor)} - ${safeText(data?.nombreTipoValor)}`
                    : "—"
                }
                sx={fieldSx}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Paper>
        )}

        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <CalendarMonthRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950 }}>Valores por Indicador</Typography>
            <Box sx={{ flex: 1 }} />
            <Chip
              icon={<FunctionsRoundedIcon />}
              label={`TOTAL: ${formatNumber(totalValores)}`}
              variant="filled"
              color="primary"
              sx={{
                borderRadius: 999,
                fontWeight: 950,
                bgcolor: "rgba(37,99,235,0.12)",
                color: "rgba(37,99,235,0.95)",
              }}
            />
          </Stack>

          {loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Cargando detalle del indicador...</Typography>
            </Stack>
          ) : (
            <>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.1}>
                <TextField
                  label=""
                  value={formatNumber(valoresFijos.valorAbsolutoA)}
                  size="small"
                  fullWidth
                  sx={valueTextFieldSx}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Chip
                          size="small"
                          label="Valor Absoluto A"
                          variant="outlined"
                          sx={{
                            borderRadius: 999,
                            fontWeight: 900,
                            height: 20,
                            maxWidth: 150,
                            "& .MuiChip-label": {
                              px: 0.7,
                              fontSize: 10.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label=""
                  value={formatNumber(valoresFijos.valorAbsolutoB)}
                  size="small"
                  fullWidth
                  sx={valueTextFieldSx}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Chip
                          size="small"
                          label="Valor Absoluto B"
                          variant="outlined"
                          sx={{
                            borderRadius: 999,
                            fontWeight: 900,
                            height: 20,
                            maxWidth: 150,
                            "& .MuiChip-label": {
                              px: 0.7,
                              fontSize: 10.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label=""
                  value={formatNumber(valoresFijos.valorRelativo)}
                  size="small"
                  fullWidth
                  sx={valueTextFieldSx}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Chip
                          size="small"
                          label="Valor Relativo"
                          variant="outlined"
                          sx={{
                            borderRadius: 999,
                            fontWeight: 900,
                            height: 20,
                            maxWidth: 150,
                            "& .MuiChip-label": {
                              px: 0.7,
                              fontSize: 10.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            },
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
                * El valor mostrado corresponde al año seleccionado.
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  El tipo de valor se obtiene automáticamente desde pdrc_ind_tv para el año seleccionado,
                  y los importes se obtienen de pdrc_indicador_valor por cada pdrc_ind_met.
                </Typography>
              </Stack>
            </>
          )}
        </Paper>

        {(data?.anios?.length ?? 0) > 0 && (
          <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <CalendarMonthRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 950 }}>Valores por Indicador - Ejecutado</Typography>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                size="small"
                onClick={guardarEjecutado}
                disabled={savingEjecutado || !anioSel}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                {savingEjecutado ? "Guardando..." : "Guardar"}
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.1}>
              {(data?.valoresEjecutados ?? []).map((item) => (
               <TextField
  key={item.idPdrcIndMet}
  label=""
  value={ejecutadoForm[item.idPdrcIndMet] ?? "0"}
  size="small"
  fullWidth
  onChange={(e) =>
    setEjecutadoForm((prev) => ({
      ...prev,
      [item.idPdrcIndMet]: e.target.value,
    }))
  }
  sx={valueTextFieldSx}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <Chip
          size="small"
          label={item.nombreMet}
          variant="outlined"
          sx={{
            borderRadius: 999,
            fontWeight: 900,
            height: 20,
            maxWidth: 150,
            "& .MuiChip-label": {
              px: 0.7,
              fontSize: 10.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        />
      </InputAdornment>
    ),
  }}
/>
              ))}
            </Stack>

            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
              * Estos valores corresponden al ejecutado real del año seleccionado y sí se pueden editar.
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
        >
          CERRAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}