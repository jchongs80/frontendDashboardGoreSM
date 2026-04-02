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
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TagRoundedIcon from "@mui/icons-material/TagRounded";

import {
  PeiOeiAeiVistaAction,
  type PeiIndicadorDetalleResponseDto,
} from "../PeiOeiAeiVistaAction";

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

  async function guardarEjecutado() {
    try {
      setSavingEjecutado(true);
      setErrorMsg("");

      await PeiOeiAeiVistaAction.guardarIndicadorEjecutado({
        idPeiOeiAei,
        idIndicadorNombre,
        valores: (data?.valoresEjecutadoPorAnio ?? []).map((x) => ({
          idAnioProyeccion: x.idAnioProyeccion,
          valor: parseDecimalInput(ejecutadoForm[x.idAnioProyeccion] ?? "0"),
        })),
      });

      await loadDetalle(idPeiOeiAei, idIndicadorNombre);
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSavingEjecutado(false);
    }
  }

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
                  Indicador PEI
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

        <Button
          onClick={onClose}
          sx={{
            minWidth: "auto",
            p: 0.5,
            color: "text.secondary",
            borderRadius: 2,
          }}
        >
          <CloseRoundedIcon />
        </Button>
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ sm: "center" }}
          >
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
              {"\n"}OEI: {resumenOei}
              {data?.tipoNivel === "AEI" ? `\nAEI: ${resumenAei}` : ""}
            </Typography>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <InfoOutlinedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950 }}>Información</Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1.1,
            }}
          >
            <TextField
              label="Fuente de datos"
              size="small"
              fullWidth
              value={safeText(data?.nombreFuenteDatos)}
              sx={fieldSx}
              InputProps={{ readOnly: true }}
            />

            <TextField
              label="Periodicidad"
              size="small"
              fullWidth
              value={safeText(data?.nombrePeriodicidad)}
              sx={fieldSx}
              InputProps={{ readOnly: true }}
            />

            <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / -1" } }}>
              <TextField
                label="Método de cálculo"
                size="small"
                fullWidth
                value={safeText(data?.nombreMetodoCalculo)}
                sx={fieldSx}
                InputProps={{ readOnly: true }}
              />
            </Box>
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
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
              gap: 1.1,
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

            <TextField
              label=""
              size="small"
              fullWidth
              value={formatNumber(data?.lineaBase?.valorLineaBase)}
              sx={valueTextFieldSx}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <Chip
                      size="small"
                      label="Valor Línea Base"
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        height: 20,
                        minWidth: 68,
                        "& .MuiChip-label": {
                          px: 0.65,
                          fontSize: 9,
                          lineHeight: 1,
                        },
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
          }}
        >
          <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <CalendarMonthRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 950 }}>Valores Meta Anual por Indicador</Typography>
            </Stack>

            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando valores...</Typography>
              </Stack>
            ) : !data?.valoresMetaPorAnio || data.valoresMetaPorAnio.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No existen valores META por año para este indicador.
              </Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 1.1,
                }}
              >
                {(data?.valoresMetaPorAnio ?? []).map((item) => (
                  <TextField
                    key={item.idAnioProyeccion}
                    label=""
                    value={formatNumber(item.valorAbsolutoA)}
                    size="small"
                    fullWidth
                    sx={valueTextFieldSx}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Chip
                            size="small"
                            label={String(item.anio)}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              fontWeight: 900,
                              height: 20,
                              minWidth: 56,
                              "& .MuiChip-label": {
                                px: 0.7,
                                fontSize: 10.5,
                              },
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                ))}
              </Box>
            )}

            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mt: 1 }}
            >
              * Se muestran todos los valores del tipo META por año para el indicador
              seleccionado.
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <CalendarMonthRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 950 }}>
                Valores Ejecutado Anual por Indicador
              </Typography>
            </Stack>

            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando valores ejecutados...</Typography>
              </Stack>
            ) : !data?.valoresEjecutadoPorAnio || data.valoresEjecutadoPorAnio.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No existen años de META para este indicador y por tanto no hay ejecutado anual
                a registrar.
              </Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 1.1,
                }}
              >
                {(data?.valoresEjecutadoPorAnio ?? []).map((item) => (
                  <TextField
                    key={item.idAnioProyeccion}
                    label=""
                    value={ejecutadoForm[item.idAnioProyeccion] ?? "0"}
                    size="small"
                    fullWidth
                    onChange={(e) =>
                      setEjecutadoForm((prev) => ({
                        ...prev,
                        [item.idAnioProyeccion]: e.target.value,
                      }))
                    }
                    sx={valueTextFieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Chip
                            size="small"
                            label={String(item.anio)}
                            variant="outlined"
                            sx={{
                              borderRadius: 999,
                              fontWeight: 900,
                              height: 20,
                              minWidth: 56,
                              "& .MuiChip-label": {
                                px: 0.7,
                                fontSize: 10.5,
                              },
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                ))}
              </Box>
            )}

            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mt: 1 }}
            >
              * Estos valores corresponden al ejecutado real anual y sí se pueden editar.
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>
              <Button
                variant="contained"
                size="small"
                onClick={guardarEjecutado}
                disabled={savingEjecutado}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                {savingEjecutado ? "Guardando..." : "GUARDAR"}
              </Button>
            </Box>
          </Paper>
        </Box>
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