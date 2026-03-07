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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";

import {
  PdrcOerAerVistaAction,
  type PdrcIndicadorDetalleAnioDto,
  type PdrcIndicadorDetalleMetValorDto,
  type PdrcIndicadorDetalleResponseDto,
  type PdrcIndicadorDetalleTipoValorDto,
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

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 10px 24px rgba(0,0,0,.06)",
} as const;

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
  const [tipoValorSel, setTipoValorSel] = useState<PdrcIndicadorDetalleTipoValorDto | null>(null);

  const loadDetalle = async (
    currentIdPdrcOerAer: number,
    currentIdIndicadorNombre: number,
    currentIdAnioProyeccion?: number | null,
    currentIdPdrcIndTv?: number | null,
    preserveSelection?: boolean
  ) => {
    if (!currentIdPdrcOerAer || !currentIdIndicadorNombre) {
      setData(null);
      setAnioSel(null);
      setTipoValorSel(null);
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
        currentIdPdrcIndTv ?? null
      );

      console.log("PDRC modal response:", res);

      if (!res) {
        setData(null);
        setAnioSel(null);
        setTipoValorSel(null);
        setErrorMsg(
          `El endpoint devolvió data = null. idPdrcOerAer=${currentIdPdrcOerAer}, idIndicadorNombre=${currentIdIndicadorNombre}`
        );
        return;
      }

      setData(res);

      const tipos = res.tiposValor ?? [];
      const anios = res.anios ?? [];

      const tipoSeleccionado =
        tipos.find((x) => x.idPdrcIndTv === (currentIdPdrcIndTv ?? res.idPdrcIndTv)) ??
        tipos.find((x) => x.idPdrcIndTv === res.idPdrcIndTv) ??
        tipos[0] ??
        null;

      const anioSeleccionado =
        anios.find((x) => x.idAnioProyeccion === (currentIdAnioProyeccion ?? -1)) ??
        anios[0] ??
        null;

      setTipoValorSel(tipoSeleccionado);
      setAnioSel(anioSeleccionado);

      if (tipos.length === 0 || anios.length === 0) {
        setErrorMsg(
          `La API respondió sin datos completos. tiposValor=${tipos.length}, anios=${anios.length}`
        );
      }
    } catch (error) {
      console.error("Error real del modal PDRC:", error);
      setData(null);
      setAnioSel(null);
      setTipoValorSel(null);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadDetalle(idPdrcOerAer, idIndicadorNombre, null, null, false);
  }, [open, idPdrcOerAer, idIndicadorNombre]);

  const tituloIndicador = useMemo(() => {
    const cod = safeText(data?.codigoIndicador ?? codigoIndicador);
    const nom = safeText(data?.nombreIndicador ?? nombreIndicador);
    if (cod === "—" && nom === "—") return "Indicador";
    return `[${cod}] - [${nom}]`;
  }, [data, codigoIndicador, nombreIndicador]);

  const resumenOer = useMemo(() => {
    if (data?.codigoOer || data?.enunciadoOer) {
      return `${safeText(data?.codigoOer)} - ${safeText(data?.enunciadoOer)}`;
    }
    return safeText(oer);
  }, [data, oer]);

  const resumenAer = useMemo(() => {
    if (data?.codigoAer || data?.enunciadoAer) {
      return `${safeText(data?.codigoAer)} - ${safeText(data?.enunciadoAer)}`;
    }
    return safeText(aer);
  }, [data, aer]);

  const totalValores = useMemo(() => {
    const vals = data?.valoresMet ?? [];
    return vals.reduce((acc, item) => acc + Number(item.valor ?? 0), 0);
  }, [data]);

  const handleChangeAnio = async (_event: unknown, value: PdrcIndicadorDetalleAnioDto | null) => {
    setAnioSel(value);

    await loadDetalle(
      idPdrcOerAer,
      idIndicadorNombre,
      value?.idAnioProyeccion ?? null,
      tipoValorSel?.idPdrcIndTv ?? null,
      true
    );
  };

  const handleChangeTipoValor = async (
    _event: unknown,
    value: PdrcIndicadorDetalleTipoValorDto | null
  ) => {
    setTipoValorSel(value);
    setAnioSel(null);

    await loadDetalle(
      idPdrcOerAer,
      idIndicadorNombre,
      null,
      value?.idPdrcIndTv ?? null,
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
          width: { xs: "96vw", sm: "92vw", md: 760 },
          maxWidth: "760px",
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
        <Stack spacing={0.25}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <AccountTreeRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950, letterSpacing: 0.2 }}>
              {tituloIndicador}
            </Typography>
            <Chip size="small" variant="outlined" label="Detalle" sx={{ borderRadius: 999, fontWeight: 800 }} />
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px" }}>
            Indicador PDRC
          </Typography>
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

        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(248,250,255,0.92)", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                icon={<TagRoundedIcon />}
                label={`Código: ${safeText(data?.codigoIndicador ?? codigoIndicador)}`}
                sx={{ fontWeight: 900, borderRadius: 999 }}
                variant="outlined"
              />
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Chip size="small" label="Resumen" color="success" variant="filled" sx={{ borderRadius: 999, fontWeight: 900 }} />
          </Stack>

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line", fontSize: "10.5px", lineHeight: 1.45 }}>
              OER: {resumenOer}
              {"\n"}AER: {resumenAer}
            </Typography>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <ChecklistRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950 }}>Detalle</Typography>
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.1 }}>
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
                  label="Año"
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

            <Autocomplete
              options={data?.tiposValor ?? []}
              value={tipoValorSel}
              onChange={handleChangeTipoValor}
              getOptionLabel={(o) => `${o.nombreTipoValor ?? ""}`}
              isOptionEqualToValue={(o, v) => o.idPdrcIndTv === v.idPdrcIndTv}
              noOptionsText={loading ? "Cargando..." : "Sin tipos de valor"}
              loading={loading || loadingRefresh}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tipo de Valor"
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
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <CalendarMonthRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950 }}>Valores por Indicador</Typography>
            <Box sx={{ flex: 1 }} />
            <Chip
              icon={<FunctionsRoundedIcon />}
              label={`TOTAL: ${formatNumber(totalValores)}`}
              variant="filled"
              color="primary"
              sx={{ borderRadius: 999, fontWeight: 950, bgcolor: "rgba(37,99,235,0.12)", color: "rgba(37,99,235,0.95)" }}
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
                {(data?.valoresMet ?? []).map((item: PdrcIndicadorDetalleMetValorDto) => (
                  <TextField
                    key={item.idPdrcIndMet}
                    label={item.nombreMet}
                    value={formatNumber(item.valor)}
                    size="small"
                    fullWidth
                    sx={{ ...fieldSx, "& .MuiInputBase-input": { py: 0.95, fontSize: 13, textAlign: "right" } }}
                    InputProps={{
                      readOnly: true,
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
                              "& .MuiChip-label": { px: 0.7, fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis" },
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                ))}
              </Stack>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.1, mt: 1.1 }}>
                <TextField
                  label="Nombre Indicador"
                  value={safeText(data?.nombreIndicador ?? nombreIndicador)}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <ViewListRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Año Seleccionado"
                  value={anioSel?.anio ?? "—"}
                  size="small"
                  fullWidth
                  sx={fieldSx}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </>
          )}

          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
            * El valor mostrado corresponde al año y tipo de valor seleccionados.
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              El filtro Tipo de Valor proviene de pdrc_ind_tv y los importes mostrados se obtienen
              de pdrc_indicador_valor para cada pdrc_ind_met.
            </Typography>
          </Stack>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="outlined" sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}>
          CERRAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}