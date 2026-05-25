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
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";

import {
  PrcpOpPiMpVistaAction,
  type PrcpIndicadorDetalleResponseDto,
} from "../PrcpOpPiMpVistaAction";

type Props = {
  open: boolean;
  onClose: () => void;
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  objetivoPrioritario?: string | null;
  problemaIdentificado?: string | null;
  medidaPolitica?: string | null;
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

function parseDecimalInput(value: string): number {
  const n = Number(value.replace(",", ".").trim());
  return Number.isFinite(n) ? n : 0;
}

function sanitizeDecimalInput(value: string): string {
  let cleaned = value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot >= 0) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
}

function isValidDecimalInput(value: string): boolean {
  const txt = value.trim().replace(",", ".");
  if (!txt) return true;
  return /^\d+(\.\d+)?$/.test(txt);
}

function parseIntegerInput(value: string): number | null {
  const txt = value.trim();
  if (!txt) return null;
  const n = Number(txt);
  return Number.isInteger(n) ? n : null;
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.96)",
    fontWeight: 700,
  },
  "& .MuiInputLabel-root": {
    fontWeight: 800,
    color: "#64748b",
  },
} as const;

const valueTextFieldSx = {
  ...fieldSx,
  "& .MuiInputBase-input": {
    py: 0.85,
    fontSize: 13,
    fontWeight: 850,
    textAlign: "right",
  },
} as const;

const modalCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(30, 64, 175, 0.14)",
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 14px 34px rgba(15, 23, 42, 0.07)",
} as const;

const blueCardSx = {
  ...modalCardSx,
  border: "1px solid rgba(37, 99, 235, 0.28)",
  background: "linear-gradient(180deg, rgba(239,246,255,0.90), rgba(255,255,255,0.97))",
} as const;

const greenCardSx = {
  ...modalCardSx,
  border: "1px solid rgba(34, 197, 94, 0.28)",
  background: "linear-gradient(180deg, rgba(240,253,244,0.88), rgba(255,255,255,0.97))",
} as const;

export default function PrcpIndicadorDetalleModal(props: Props): React.ReactElement {
  const {
    open,
    onClose,
    idPrcpOpPiMp,
    idIndicadorNombre,
    codigoIndicador,
    nombreIndicador,
    objetivoPrioritario,
    medidaPolitica,
  } = props;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingLineaBase, setSavingLineaBase] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<PrcpIndicadorDetalleResponseDto | null>(null);
  const [ejecutadoForm, setEjecutadoForm] = useState<Record<number, string>>({});
  const [unidadMedidaForm, setUnidadMedidaForm] = useState("");
  const [tipoIndicadorForm, setTipoIndicadorForm] = useState("");
  const [anioLineaBaseForm, setAnioLineaBaseForm] = useState("");
  const [tipoValorLineaBaseForm, setTipoValorLineaBaseForm] = useState("");
  const [valorLineaBaseForm, setValorLineaBaseForm] = useState("");

  async function loadDetalle() {
    if (!idPrcpOpPiMp || !idIndicadorNombre) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await PrcpOpPiMpVistaAction.getIndicadorDetalle(idPrcpOpPiMp, idIndicadorNombre);
      setData(res);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al cargar el detalle.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void loadDetalle();
  }, [open, idPrcpOpPiMp, idIndicadorNombre]);

  useEffect(() => {
    const map: Record<number, string> = {};
    for (const item of data?.valoresEjecutadoPorAnio ?? []) {
      map[item.idAnioProyeccion] = String(item.valor ?? 0);
    }
    setEjecutadoForm(map);
  }, [data]);

  useEffect(() => {
    setUnidadMedidaForm(data?.informacionEditable?.unidadMedida ?? data?.nombreUnidadMedida ?? "");
    setTipoIndicadorForm(data?.informacionEditable?.tipoIndicador ?? data?.nombreTipoIndicador ?? "");

    const anioEditable = data?.lineaBaseEditable?.anioProyeccion;
    const tipoValorEditable = data?.lineaBaseEditable?.tipoValor;
    const valorEditable = data?.lineaBaseEditable?.valorLineaBase;

    setAnioLineaBaseForm(
      anioEditable != null
        ? String(anioEditable)
        : data?.lineaBase?.anio != null
          ? String(data.lineaBase.anio)
          : ""
    );

    setTipoValorLineaBaseForm(
      tipoValorEditable ??
        (data?.lineaBase?.codigoTipoValor || data?.lineaBase?.nombreTipoValor
          ? `${safeText(data?.lineaBase?.codigoTipoValor)} - ${safeText(data?.lineaBase?.nombreTipoValor)}`
          : "")
    );

    setValorLineaBaseForm(
      valorEditable != null
        ? String(valorEditable)
        : data?.lineaBase?.valorLineaBase != null
          ? String(data.lineaBase.valorLineaBase)
          : ""
    );
  }, [data]);

  const codigoIndicadorView = useMemo(() => {
    return safeText(data?.codigoIndicador ?? codigoIndicador);
  }, [data, codigoIndicador]);

  const nombreIndicadorView = useMemo(() => {
    return safeText(data?.nombreIndicador ?? nombreIndicador);
  }, [data, nombreIndicador]);

  const objetivoView = useMemo(() => {
    if (data?.codigoObjetivoPrioritario || data?.descripcionObjetivoPrioritario) {
      return `${safeText(data?.codigoObjetivoPrioritario)} - ${safeText(data?.descripcionObjetivoPrioritario)}`;
    }
    return safeText(objetivoPrioritario);
  }, [data, objetivoPrioritario]);

  const medidaView = useMemo(() => {
    if (data?.codigoMedidaPolitica || data?.descripcionMedidaPolitica) {
      return `${safeText(data?.codigoMedidaPolitica)} - ${safeText(data?.descripcionMedidaPolitica)}`;
    }
    return safeText(medidaPolitica);
  }, [data, medidaPolitica]);

  const [mostrarLineaBaseCard] = useState(false);

  async function guardarInfoEditable() {
    try {
      setSavingInfo(true);
      setErrorMsg("");
      await PrcpOpPiMpVistaAction.guardarIndicadorInfoEditable({
        idPrcpOpPiMp,
        idIndicadorNombre,
        unidadMedida: unidadMedidaForm.trim() || null,
        tipoIndicador: tipoIndicadorForm.trim() || null,
      });
      await loadDetalle();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar la información editable.");
    } finally {
      setSavingInfo(false);
    }
  }

  async function guardarLineaBaseEditable() {
    try {
      setSavingLineaBase(true);
      setErrorMsg("");
      const anio = parseIntegerInput(anioLineaBaseForm);
      if (anioLineaBaseForm.trim() && anio == null) {
        setErrorMsg("El año de proyección debe ser un número entero.");
        return;
      }

      if (!isValidDecimalInput(valorLineaBaseForm)) {
        setErrorMsg("El valor de línea base debe ser un número decimal válido. Ejemplo: 123.45");
        return;
      }

      await PrcpOpPiMpVistaAction.guardarIndicadorLineaBaseEditable({
        idPrcpOpPiMp,
        idIndicadorNombre,
        anioProyeccion: anio,
        tipoValor: tipoValorLineaBaseForm.trim() || null,
        valorLineaBase: valorLineaBaseForm.trim() ? parseDecimalInput(valorLineaBaseForm) : null,
      });
      await loadDetalle();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar la línea base editable.");
    } finally {
      setSavingLineaBase(false);
    }
  }

  async function guardarEjecutado() {
    try {
      setSaving(true);
      setErrorMsg("");
      await PrcpOpPiMpVistaAction.guardarIndicadorEjecutado({
        idPrcpOpPiMp,
        idIndicadorNombre,
        valores: (data?.valoresEjecutadoPorAnio ?? []).map((x) => ({
          idAnioProyeccion: x.idAnioProyeccion,
          valor: parseDecimalInput(ejecutadoForm[x.idAnioProyeccion] ?? "0"),
        })),
      });
      await loadDetalle();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
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
          borderRadius: 3.5,
          overflow: "hidden",
          background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 44%)",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 1.7,
          borderBottom: "1px solid rgba(15,23,42,0.09)",
          background: "linear-gradient(90deg, rgba(239,246,255,0.95) 0%, rgba(255,255,255,0.98) 58%, rgba(240,253,244,0.88) 100%)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.45} alignItems="center" sx={{ minWidth: 0 }}>
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
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography sx={{ fontWeight: 950, fontSize: { xs: "1rem", sm: "1.12rem" }, color: "#0f172a" }}>
                  Indicador P.R.C.P.
                </Typography>
                <Chip
                  size="small"
                  label="Detalle"
                  variant="outlined"
                  sx={{
                    height: 23,
                    borderRadius: 999,
                    fontWeight: 900,
                    color: "#334155",
                    borderColor: "rgba(15,23,42,0.28)",
                    backgroundColor: "rgba(255,255,255,0.78)",
                  }}
                />
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  mt: 0.35,
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: { xs: 245, sm: 650 },
                }}
                title={nombreIndicadorView}
              >
                Indicador: {nombreIndicadorView}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <Chip
              size="small"
              label="Resumen"
              color="success"
              variant="outlined"
              sx={{
                height: 27,
                borderRadius: 1.5,
                fontWeight: 950,
                bgcolor: "rgba(240,253,244,0.92)",
                "& .MuiChip-label": { px: 1.15 },
              }}
            />
            <Button
              onClick={onClose}
              sx={{ minWidth: 34, width: 34, height: 34, p: 0, color: "#475569", borderRadius: 2 }}
            >
              <CloseRoundedIcon />
            </Button>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 2.5, pt: 2.2, pb: 2.2 }}>
        {errorMsg ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2.5 }}>
            {errorMsg}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            border: "1px solid rgba(15,23,42,0.10)",
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "170px 1fr" },
              gap: 2,
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={1.35} alignItems="center">
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#16a34a",
                  border: "1px solid rgba(34,197,94,0.35)",
                  background: "linear-gradient(135deg, rgba(240,253,244,1), rgba(255,255,255,1))",
                  flexShrink: 0,
                }}
              >
                <DescriptionRoundedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 850, color: "#64748b" }}>Código</Typography>
                <Typography sx={{ mt: 0.25, fontSize: 14, fontWeight: 950, color: "#0f172a" }}>
                  {codigoIndicadorView}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 1.25,
                borderLeft: { xs: "none", md: "1px solid rgba(15,23,42,0.10)" },
                pl: { xs: 0, md: 2 },
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 850, color: "#64748b" }}>Objetivo Prioritario</Typography>
                <Typography sx={{ mt: 0.35, fontSize: 12, fontWeight: 800, color: "#334155", lineHeight: 1.45 }}>
                  {objetivoView}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 850, color: "#64748b" }}>Medida Política</Typography>
                <Typography sx={{ mt: 0.35, fontSize: 12, fontWeight: 800, color: "#334155", lineHeight: 1.45 }}>
                  {medidaView}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...blueCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.4 }}>
            <SettingsRoundedIcon fontSize="small" sx={{ color: "#2563eb" }} />
            <Typography sx={{ fontWeight: 950, color: "#2563eb" }}>Información</Typography>
            <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "#64748b" }}>
              Estos campos pueden modificarse.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
              gap: 1.1,
              alignItems: "center",
            }}
          >
            <TextField
              label="Unidad de medida"
              size="small"
              fullWidth
              value={unidadMedidaForm}
              onChange={(e) => setUnidadMedidaForm(e.target.value)}
              sx={fieldSx}
            />
            <TextField
              label="Sentido Esperado"
              size="small"
              fullWidth
              value={tipoIndicadorForm}
              onChange={(e) => setTipoIndicadorForm(e.target.value)}
              sx={fieldSx}
            />
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveRoundedIcon />}
              onClick={guardarInfoEditable}
              disabled={savingInfo || loading}
              sx={{
                height: 45,
                px: 2.4,
                borderRadius: 2,
                fontWeight: 950,
                whiteSpace: "nowrap",
                boxShadow: "0 14px 24px rgba(37,99,235,0.22)",
              }}
            >
              {savingInfo ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Box>
        </Paper>

        {mostrarLineaBaseCard ? (
          <Paper elevation={0} sx={{ ...greenCardSx, p: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.35 }}>
              <FlagRoundedIcon fontSize="small" sx={{ color: "#16a34a" }} />
              <Typography sx={{ fontWeight: 950, color: "#16a34a" }}>Detalle Línea Base</Typography>
            </Stack>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.1 }}>
              <TextField
                label="Año Proyección"
                size="small"
                fullWidth
                value={anioLineaBaseForm}
                onChange={(e) => setAnioLineaBaseForm(e.target.value.replace(/[^0-9]/g, ""))}
                sx={fieldSx}
              />
              <TextField
                label="Tipo de Valor"
                size="small"
                fullWidth
                value={tipoValorLineaBaseForm}
                onChange={(e) => setTipoValorLineaBaseForm(e.target.value)}
                sx={fieldSx}
                InputProps={{
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
                value={valorLineaBaseForm}
                onChange={(e) => setValorLineaBaseForm(sanitizeDecimalInput(e.target.value))}
                sx={valueTextFieldSx}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
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
                          "& .MuiChip-label": { px: 0.65, fontSize: 9, lineHeight: 1 },
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveRoundedIcon />}
                onClick={guardarLineaBaseEditable}
                disabled={savingLineaBase || loading}
                sx={{ borderRadius: 2, fontWeight: 900 }}
              >
                {savingLineaBase ? "Guardando..." : "Guardar"}
              </Button>
            </Box>
          </Paper>
        ) : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Paper elevation={0} sx={{ ...blueCardSx, p: 2, minHeight: 250 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1.35 }}>
              <BarChartRoundedIcon fontSize="small" sx={{ color: "#2563eb", mt: 0.1 }} />
              <Box>
                <Typography sx={{ fontWeight: 950, color: "#2563eb" }}>Valores Meta Anual</Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "#64748b" }}>
                  Metas planificadas para cada año.
                </Typography>
              </Box>
            </Stack>

            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando valores...</Typography>
              </Stack>
            ) : !data?.valoresMetaPorAnio?.length ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No existen valores META por año para este indicador.
              </Alert>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.05 }}>
                {data.valoresMetaPorAnio.map((item) => (
                  <TextField
                    key={item.idAnioProyeccion}
                    label=""
                    value={formatNumber(item.valor)}
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
                              fontWeight: 950,
                              height: 22,
                              minWidth: 70,
                              color: "#2563eb",
                              borderColor: "rgba(37,99,235,0.40)",
                              bgcolor: "rgba(239,246,255,0.90)",
                              "& .MuiChip-label": { px: 0.7, fontSize: 10.5 },
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>

          <Paper elevation={0} sx={{ ...greenCardSx, p: 2, minHeight: 250 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1.35 }}>
              <TrendingUpRoundedIcon fontSize="small" sx={{ color: "#16a34a", mt: 0.1 }} />
              <Box>
                <Typography sx={{ fontWeight: 950, color: "#16a34a" }}>Valores Ejecutado Anual</Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 800, color: "#64748b" }}>
                  Ejecución registrada por cada año.
                </Typography>
              </Box>
            </Stack>

            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando valores ejecutados...</Typography>
              </Stack>
            ) : !data?.valoresEjecutadoPorAnio?.length ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No existen años META para este indicador y por tanto no hay ejecutado anual a registrar.
              </Alert>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.05 }}>
                {data.valoresEjecutadoPorAnio.map((item) => (
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
                              fontWeight: 950,
                              height: 22,
                              minWidth: 70,
                              color: "#16a34a",
                              borderColor: "rgba(34,197,94,0.42)",
                              bgcolor: "rgba(240,253,244,0.92)",
                              "& .MuiChip-label": { px: 0.7, fontSize: 10.5 },
                            }}
                          />
                        </InputAdornment>
                      ),
                    }}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.4 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveRoundedIcon />}
                onClick={guardarEjecutado}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  fontWeight: 950,
                  boxShadow: "0 12px 22px rgba(37,99,235,0.22)",
                }}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 1.4,
          borderTop: "1px solid rgba(15,23,42,0.09)",
          background: "rgba(248,250,252,0.96)",
        }}
      >
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            height: 38,
            minWidth: 145,
            fontWeight: 950,
            borderRadius: 2,
            px: 3,
            color: "#111827",
            borderColor: "#111827",
            bgcolor: "#ffffff",
            "&:hover": { bgcolor: "#f8fafc", borderColor: "#111827" },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
