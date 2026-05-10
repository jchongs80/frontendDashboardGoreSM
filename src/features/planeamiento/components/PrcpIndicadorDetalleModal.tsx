import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, InputAdornment, Paper, Stack, TextField, Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import { PrcpOpPiMpVistaAction, type PrcpIndicadorDetalleResponseDto } from "../PrcpOpPiMpVistaAction";

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

function safeText(value?: string | null): string { const txt = (value ?? "").toString().trim(); return txt.length === 0 ? "—" : txt; }
function formatNumber(value: number | null | undefined): string { const n = Number(value ?? 0); return new Intl.NumberFormat("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0); }
function parseDecimalInput(value: string): number { const n = Number(value.replace(",", ".").trim()); return Number.isFinite(n) ? n : 0; }
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
function parseIntegerInput(value: string): number | null { const txt = value.trim(); if (!txt) return null; const n = Number(txt); return Number.isInteger(n) ? n : null; }
const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.96)" } } as const;
const valueTextFieldSx = { ...fieldSx, "& .MuiInputBase-input": { py: 0.95, fontSize: 13, textAlign: "right" } } as const;
const sectionCardSx = { borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.92)", boxShadow: "0 10px 24px rgba(0,0,0,.06)" } as const;

export default function PrcpIndicadorDetalleModal(props: Props): React.ReactElement {
  const { open, onClose, idPrcpOpPiMp, idIndicadorNombre, codigoIndicador, nombreIndicador, objetivoPrioritario, medidaPolitica } = props;
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
    setLoading(true); setErrorMsg("");
    try {
      const res = await PrcpOpPiMpVistaAction.getIndicadorDetalle(idPrcpOpPiMp, idIndicadorNombre);
      setData(res);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al cargar el detalle.");
    } finally { setLoading(false); }
  }

  useEffect(() => { if (open) void loadDetalle(); }, [open, idPrcpOpPiMp, idIndicadorNombre]);
  useEffect(() => {
    const map: Record<number, string> = {};
    for (const item of data?.valoresEjecutadoPorAnio ?? []) map[item.idAnioProyeccion] = String(item.valor ?? 0);
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

  const objetivoView = useMemo(() => data?.codigoObjetivoPrioritario || data?.descripcionObjetivoPrioritario ? `${safeText(data?.codigoObjetivoPrioritario)} - ${safeText(data?.descripcionObjetivoPrioritario)}` : safeText(objetivoPrioritario), [data, objetivoPrioritario]);
  const medidaView = useMemo(() => data?.codigoMedidaPolitica || data?.descripcionMedidaPolitica ? `${safeText(data?.codigoMedidaPolitica)} - ${safeText(data?.descripcionMedidaPolitica)}` : safeText(medidaPolitica), [data, medidaPolitica]);
  const [mostrarLineaBaseCard] = useState(false);

  async function guardarInfoEditable() {
    try {
      setSavingInfo(true); setErrorMsg("");
      await PrcpOpPiMpVistaAction.guardarIndicadorInfoEditable({
        idPrcpOpPiMp,
        idIndicadorNombre,
        unidadMedida: unidadMedidaForm.trim() || null,
        tipoIndicador: tipoIndicadorForm.trim() || null,
      });
      await loadDetalle();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar la información editable.");
    } finally { setSavingInfo(false); }
  }

  async function guardarLineaBaseEditable() {
    try {
      setSavingLineaBase(true); setErrorMsg("");
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
    } finally { setSavingLineaBase(false); }
  }

  async function guardarEjecutado() {
    try {
      setSaving(true); setErrorMsg("");
      await PrcpOpPiMpVistaAction.guardarIndicadorEjecutado({
        idPrcpOpPiMp,
        idIndicadorNombre,
        valores: (data?.valoresEjecutadoPorAnio ?? []).map((x) => ({ idAnioProyeccion: x.idAnioProyeccion, valor: parseDecimalInput(ejecutadoForm[x.idAnioProyeccion] ?? "0") }))
      });
      await loadDetalle();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(180deg, rgba(27,111,238,0.10) 0%, rgba(27,111,238,0) 100%)" }}>
        <Stack spacing={0.55} sx={{ pr: 2, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="nowrap">
            <PolicyRoundedIcon fontSize="small" sx={{ mt: 0.15, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.45 }}>
                <Typography sx={{ fontWeight: 950, fontSize: { xs: "0.98rem", sm: "1.05rem" } }}>Indicador P.R.C.P.</Typography>
                <Chip size="small" variant="outlined" label="Detalle" sx={{ borderRadius: 999, fontWeight: 800 }} />
              </Stack>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px", mt: 0.2 }}>Indicador: <b>{safeText(data?.nombreIndicador ?? nombreIndicador)}</b></Typography>
            </Box>
          </Stack>
        </Stack>
        <Button onClick={onClose} sx={{ minWidth: "auto", p: 0.5, color: "text.secondary", borderRadius: 2 }}><CloseRoundedIcon /></Button>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {errorMsg ? <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert> : null}
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(248,250,255,0.92)", boxShadow: "0 10px 25px rgba(0,0,0,0.05)", mb: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Chip icon={<TagRoundedIcon />} label={`Código: ${safeText(data?.codigoIndicador ?? codigoIndicador)}`} sx={{ fontWeight: 900, borderRadius: 999 }} variant="outlined" />
            <Box sx={{ flex: 1 }} /><Chip size="small" label="Resumen" color="success" variant="filled" sx={{ borderRadius: 999, fontWeight: 900 }} />
          </Stack>
          <Stack spacing={0.35} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "11.5px", lineHeight: 1.45 }}>
              Objetivo Prioritario: {objetivoView}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "11.5px", lineHeight: 1.45 }}>
              Medida Política: {medidaView}
            </Typography>
          </Stack>
        </Paper>
        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}><InfoOutlinedIcon fontSize="small" /><Typography sx={{ fontWeight: 950 }}>Información</Typography></Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.1 }}>
            <TextField label="Unidad de medida" size="small" fullWidth value={unidadMedidaForm} onChange={(e) => setUnidadMedidaForm(e.target.value)} sx={fieldSx} />
            <TextField label="Sentido" size="small" fullWidth value={tipoIndicadorForm} onChange={(e) => setTipoIndicadorForm(e.target.value)} sx={fieldSx} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}><Button variant="contained" size="small" onClick={guardarInfoEditable} disabled={savingInfo || loading} sx={{ borderRadius: 2, fontWeight: 900 }}>{savingInfo ? "Guardando..." : "GUARDAR"}</Button></Box>
        </Paper>
        {mostrarLineaBaseCard ? (
        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}><ChecklistRoundedIcon fontSize="small" /><Typography sx={{ fontWeight: 950 }}>Detalle Línea Base</Typography></Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 1.1 }}>
            <TextField label="Año Proyección" size="small" fullWidth value={anioLineaBaseForm} onChange={(e) => setAnioLineaBaseForm(e.target.value.replace(/[^0-9]/g, ""))} sx={fieldSx} />
            <TextField label="Tipo de Valor" size="small" fullWidth value={tipoValorLineaBaseForm} onChange={(e) => setTipoValorLineaBaseForm(e.target.value)} sx={fieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><TagRoundedIcon fontSize="small" /></InputAdornment> }} />
            <TextField label="" size="small" fullWidth value={valorLineaBaseForm} onChange={(e) => setValorLineaBaseForm(sanitizeDecimalInput(e.target.value))} sx={valueTextFieldSx} inputProps={{ inputMode: "decimal" }} InputProps={{ startAdornment: <InputAdornment position="start"><Chip size="small" label="Valor Línea Base" variant="outlined" sx={{ borderRadius: 999, fontWeight: 900, height: 20, minWidth: 68, "& .MuiChip-label": { px: 0.65, fontSize: 9, lineHeight: 1 } }} /></InputAdornment> }} />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}><Button variant="contained" size="small" onClick={guardarLineaBaseEditable} disabled={savingLineaBase || loading} sx={{ borderRadius: 2, fontWeight: 900 }}>{savingLineaBase ? "Guardando..." : "GUARDAR"}</Button></Box>
        </Paper>
        ) : null}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}><CalendarMonthRoundedIcon fontSize="small" /><Typography sx={{ fontWeight: 950 }}>Valores Meta Anual por Indicador</Typography></Stack>
            {loading ? <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}><CircularProgress size={18} /><Typography variant="body2">Cargando valores...</Typography></Stack> : !data?.valoresMetaPorAnio?.length ? <Alert severity="info" sx={{ borderRadius: 2 }}>No existen valores META por año para este indicador.</Alert> : <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.1 }}>{data.valoresMetaPorAnio.map((item) => <TextField key={item.idAnioProyeccion} label="" value={formatNumber(item.valor)} size="small" fullWidth sx={valueTextFieldSx} InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><Chip size="small" label={String(item.anio)} variant="outlined" sx={{ borderRadius: 999, fontWeight: 900, height: 20, minWidth: 56, "& .MuiChip-label": { px: 0.7, fontSize: 10.5 } }} /></InputAdornment> }} />)}</Box>}
          </Paper>
          <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}><CalendarMonthRoundedIcon fontSize="small" /><Typography sx={{ fontWeight: 950 }}>Valores Ejecutado Anual por Indicador</Typography></Stack>
            {loading ? <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}><CircularProgress size={18} /><Typography variant="body2">Cargando valores ejecutados...</Typography></Stack> : !data?.valoresEjecutadoPorAnio?.length ? <Alert severity="info" sx={{ borderRadius: 2 }}>No existen años META para este indicador y por tanto no hay ejecutado anual a registrar.</Alert> : <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.1 }}>{data.valoresEjecutadoPorAnio.map((item) => <TextField key={item.idAnioProyeccion} label="" value={ejecutadoForm[item.idAnioProyeccion] ?? "0"} size="small" fullWidth onChange={(e) => setEjecutadoForm((prev) => ({ ...prev, [item.idAnioProyeccion]: e.target.value }))} sx={valueTextFieldSx} InputProps={{ startAdornment: <InputAdornment position="start"><Chip size="small" label={String(item.anio)} variant="outlined" sx={{ borderRadius: 999, fontWeight: 900, height: 20, minWidth: 56, "& .MuiChip-label": { px: 0.7, fontSize: 10.5 } }} /></InputAdornment> }} />)}</Box>}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}><Button variant="contained" size="small" onClick={guardarEjecutado} disabled={saving} sx={{ borderRadius: 2, fontWeight: 900 }}>{saving ? "Guardando..." : "GUARDAR"}</Button></Box>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}><Box sx={{ flex: 1 }} /><Button onClick={onClose} variant="outlined" sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}>CERRAR</Button></DialogActions>
    </Dialog>
  );
}
