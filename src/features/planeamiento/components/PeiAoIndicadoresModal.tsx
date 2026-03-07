import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FunctionsRoundedIcon from "@mui/icons-material/FunctionsRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {
  PeiOeiAeiAOAction,
  type PoiAoIndicadorDto,
  type PoiAoIndicadorMesResponseDto,
  type PeiOeiAeiAoByIdDto,
} from "../PeiOeiAeiAOAction";

type Props = {
  open: boolean;
  onClose: () => void;

  idOeiAeiAo: number;
  idPoiAnio: number;

  anioLabel?: number | null;
  nroRegistroPoi?: string | null;
  codigoAo?: string | null;
  nombreAo?: string | null;

  oer?: string | null;
  aer?: string | null;
  oei?: string | null;
  aei?: string | null;
};

const monthLabels: { m: number; label: string; short: string }[] = [
  { m: 1, label: "", short: "Ene" },
  { m: 2, label: "", short: "Feb" },
  { m: 3, label: "", short: "Mar" },
  { m: 4, label: "", short: "Abr" },
  { m: 5, label: "", short: "May" },
  { m: 6, label: "", short: "Jun" },
  { m: 7, label: "", short: "Jul" },
  { m: 8, label: "", short: "Ago" },
  { m: 9, label: "", short: "Set" },
  { m: 10, label: "", short: "Oct" },
  { m: 11, label: "", short: "Nov" },
  { m: 12, label: "", short: "Dic" },
];

function safe(v?: string | null) {
  const x = (v ?? "").toString().trim();
  return x.length === 0 ? "—" : x;
}
function pairText(a?: string | null, b?: string | null) {
  const sa = safe(a ?? null);
  const sb = safe(b ?? null);
  if (sa === "—" && sb === "—") return "—";
  return `${sa} / ${sb}`;
}

function combo(code?: string | null, name?: string | null) {
  const c = (code ?? "").toString().trim();
  const n = (name ?? "").toString().trim();
  if (!c && !n) return "—";
  if (c && n) return `${c} - ${n}`;
  return c || n;
}

function toNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtNumber(n: number): string {
  return new Intl.NumberFormat("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.75,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.18)" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.70)",
  },
} as const;

// ✅ Solo para los TextField dentro de los cards del cuadro rojo (Detalle + Unidad de Medida)
const fieldSxValueMinus2 = {
  ...fieldSx,
  "& .MuiInputBase-input": {
    fontSize: "12px", // 2px menos dentro del input
  },
} as const;

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 10px 25px rgba(0,0,0,0.06)",
} as const;

export default function PeiAoIndicadoresModal({
  open,
  onClose,
  idOeiAeiAo,
  idPoiAnio,
  anioLabel,
  nroRegistroPoi,
  codigoAo,
  nombreAo,
  oer,
  aer,
  oei,
  aei,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PoiAoIndicadorMesResponseDto | null>(null);
  const [selected, setSelected] = useState<PoiAoIndicadorDto | null>(null);

  // Detalle AO (poi_oei_aei_ao)
  const [detalleAo, setDetalleAo] = useState<PeiOeiAeiAoByIdDto | null>(null);

  const valuesMap = useMemo(() => {
    const map = new Map<number, number[]>();
    if (!data) return map;

    for (const ind of data.indicadores ?? []) map.set(ind.idIndicador, Array(12).fill(0));

    for (const v of data.valores ?? []) {
      const arr = map.get(v.idIndicador) ?? Array(12).fill(0);
      const idx = (v.mes ?? 0) - 1;
      if (idx >= 0 && idx < 12) arr[idx] = toNumber(v.valor);
      map.set(v.idIndicador, arr);
    }
    return map;
  }, [data]);

  const currentMonths = useMemo(() => {
    if (!selected) return Array(12).fill(0);
    return valuesMap.get(selected.idIndicador) ?? Array(12).fill(0);
  }, [selected, valuesMap]);

  const total = useMemo(() => currentMonths.reduce((acc, x) => acc + toNumber(x), 0), [currentMonths]);

  // Indicadores
  useEffect(() => {
    if (!open) return;
    const run = async () => {
      setLoading(true);
      try {
        const res = await PeiOeiAeiAOAction.getIndicadoresMesByAo(idOeiAeiAo, idPoiAnio);
        setData(res ?? null);
        setSelected(res?.indicadores?.[0] ?? null);
      } catch (e) {
        console.error(e);
        setData({ indicadores: [], valores: [] });
        setSelected(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [open, idOeiAeiAo, idPoiAnio]);

  // Detalle AO
  useEffect(() => {
    if (!open) return;
    const run = async () => {
      try {
        const res = await PeiOeiAeiAOAction.getAoById(idOeiAeiAo);
        setDetalleAo(res ?? null);
      } catch (e) {
        console.error(e);
        setDetalleAo(null);
      }
    };
    void run();
  }, [open, idOeiAeiAo]);

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
          width: { xs: "96vw", sm: "86vw", md: 750 },
          maxWidth: "750px",
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1.0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(27,111,238,0.10) 0%, rgba(27,111,238,0) 100%)",
        }}
      >
        <Stack spacing={0.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccountTreeRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950, letterSpacing: 0.2 }}>
              Unidad de Medida por Actividad Operativa
            </Typography>
            <Chip size="small" variant="outlined" label="Detalle" sx={{ borderRadius: 999, fontWeight: 800 }} />
          </Stack>

<Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px" }}>
  AO: <b>{safe(nombreAo)}</b>
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
        {/* Card superior */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(248,250,255,0.9)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            mb: 2,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
              <Chip
                icon={<TagRoundedIcon />}
                label={`Nro POI: ${safe(nroRegistroPoi)}`}
                sx={{ fontWeight: 900, borderRadius: 999 }}
                variant="outlined"
              />
              <Chip
                icon={<TagRoundedIcon />}
                label={`Código AO: ${safe(codigoAo)}`}
                sx={{ fontWeight: 800, borderRadius: 999 }}
                variant="outlined"
              />
              <Chip
                icon={<CalendarMonthRoundedIcon />}
                label={`Año: ${anioLabel ?? "—"}`}
                sx={{ fontWeight: 800, borderRadius: 999 }}
                variant="outlined"
              />
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Chip
              size="small"
              label={loading ? "Cargando…" : "Resumen"}
              color={loading ? "default" : "success"}
              variant={loading ? "outlined" : "filled"}
              sx={{ borderRadius: 999, fontWeight: 900 }}
            />
          </Stack>

          <Box sx={{ mt: 1.0 }}>
<Typography
  variant="body2"
  sx={{
    color: "text.secondary",
    whiteSpace: "pre-line",
    fontSize: "10.5px", // ✅ 12.5 - 2 = 10.5
  }}
>
  OER: {safe(oer)}
  {"\n"}AER: {safe(aer)}
  {"\n"}OEI: {safe(oei)}
  {"\n"}AEI: {safe(aei)}
</Typography>
          </Box>
        </Paper>

        {/* Detalle */}
        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <ChecklistRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950 }}>Detalle</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              (poi_oei_aei_ao)
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 1.1,
            }}
          >
<TextField
  label="Acumulado / Tipo"
  value={pairText(detalleAo?.acumulado ?? null, detalleAo?.tipo ?? null)}
  size="small"
  fullWidth
  sx={fieldSxValueMinus2}
  InputProps={{ readOnly: true }}
/>

<TextField
  label="Cons PIA / PIM"
  value={pairText(detalleAo?.consPia ?? null, detalleAo?.consPim ?? null)}
  size="small"
  fullWidth
  sx={fieldSxValueMinus2}
  InputProps={{ readOnly: true }}
/>

<TextField
  label="Tipo Fin PIA / PIM"
  value={pairText(detalleAo?.tipoFinPia ?? null, detalleAo?.tipoFinPim ?? null)}
  size="small"
  fullWidth
  sx={fieldSxValueMinus2}
  InputProps={{ readOnly: true }}
/>


            <TextField
              label="Prioridad"
              value={combo(detalleAo?.prioridadCodigo ?? null, detalleAo?.prioridadNombre ?? null)}
              size="small"
              fullWidth
              sx={fieldSxValueMinus2}
              InputProps={{ readOnly: true }}
            />



{/* ✅ Fila Dep/Prov/Dist ocupando TODO el ancho del card */}
<Box
  sx={{
    gridColumn: { xs: "auto", sm: "auto", md: "1 / -1" }, // 👈 en md+ ocupa todas las columnas del grid padre
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, // 3 columnas
    gap: 1.1,
    width: "100%",
  }}
>
  <TextField
    label="Departamento"
    value={combo(detalleAo?.departamentoCodigo ?? null, detalleAo?.departamentoNombre ?? null)}
    size="small"
    fullWidth
    sx={fieldSxValueMinus2}
    InputProps={{ readOnly: true }}
  />
  <TextField
    label="Provincia"
    value={combo(detalleAo?.provinciaCodigo ?? null, detalleAo?.provinciaNombre ?? null)}
    size="small"
    fullWidth
    sx={fieldSxValueMinus2}
    InputProps={{ readOnly: true }}
  />
  <TextField
    label="Distrito"
    value={combo(detalleAo?.distritoCodigo ?? null, detalleAo?.distritoNombre ?? null)}
    size="small"
    fullWidth
    sx={fieldSxValueMinus2}
    InputProps={{ readOnly: true }}
  />
</Box>
          </Box>
        </Paper>

        {/* Unidad de Medida */}
        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <ChecklistRoundedIcon fontSize="small" />
<Typography sx={{ fontWeight: 950 }}>
  Unidad de Medida:{" "}
  <Box
    component="span"
    sx={{
      color: "rgba(37,99,235,0.95)",     // ✅ aquí cambias el color
      fontWeight: 950,
    }}
  >
    {combo(detalleAo?.umCodigo ?? null, detalleAo?.umNombre ?? null)}
  </Box>
</Typography>
            <Tooltip title="Selecciona una unidad de medida para ver sus valores mensuales." arrow>
              <InfoOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            </Tooltip>
          </Stack>

          <Autocomplete
            options={data?.indicadores ?? []}
            value={selected}
            onChange={(_e, v) => setSelected(v)}
            getOptionLabel={(o) => o?.nombre ?? ""}
            isOptionEqualToValue={(o, v) => o.idIndicador === v.idIndicador}
            noOptionsText={loading ? "Cargando..." : "Sin indicadores"}

            // ✅ NUEVO: baja 2px el tamaño del texto del dropdown
            ListboxProps={{
              sx: {
                "& .MuiAutocomplete-option": {
                  fontSize: "12px", // antes ~14px
                },
              },
            }}
            renderOption={(props, option) => (
              <li {...props} style={{ fontSize: 12 }}>
                {option?.nombre ?? ""}
              </li>
            )}

            renderInput={(params) => (
              <TextField
                {...params}
                label="Nombre de Unidades de Medida"
                size="small"
                sx={{ ...fieldSxValueMinus2, width: "100%", mb: 1.0 }}
              />
            )}
          />

          <Box sx={{ display: "flex", gap: 1.25, justifyContent: "flex-start", alignItems: "flex-start" }}>
            <TextField
              label="Código"
              value={selected?.codigo ?? ""}
              size="small"
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">#</InputAdornment>,
              }}
              sx={{ ...fieldSxValueMinus2, width: 180 }}
            />
            <TextField
              label="Unidad"
              value={selected?.unidad ?? ""}
              size="small"
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">∑</InputAdornment>,
              }}
              sx={{ ...fieldSxValueMinus2, width: 180 }}
            />
          </Box>
        </Paper>

        {/* Valores por Mes */}
        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <CalendarMonthRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950 }}>Valores / Cantidades por Mes</Typography>

            <Box sx={{ flex: 1 }} />

            <Chip
              icon={<FunctionsRoundedIcon />}
              label={`TOTAL:  ${fmtNumber(total)}`}
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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
              gap: 1.1,
            }}
          >
            {monthLabels.map((x) => (
              <TextField
                key={x.m}
                label={x.label}
                value={fmtNumber(toNumber(currentMonths[x.m - 1] ?? 0))}
                size="small"
                fullWidth
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Chip
                        size="small"
                        label={x.short}
                        variant="outlined"
                        sx={{
                          borderRadius: 999,
                          fontWeight: 900,
                          height: 20,
                          "& .MuiChip-label": { px: 0.7, fontSize: 11 },
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  ...fieldSx,
                  "& .MuiInputBase-input": { py: 0.95, fontSize: 13 },
                  "& input": { textAlign: "right" },
                }}
              />
            ))}
          </Box>

          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1.0 }}>
            * El TOTAL es la suma de Enero a Diciembre para el indicador seleccionado.
          </Typography>
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