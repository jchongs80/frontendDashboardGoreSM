// AJUSTE_POI_MODAL_INDICADORES_ESTILO_PEI_20260520
import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
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
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.94)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.9)",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(148,163,184,.42)" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.48)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.78)",
  },
} as const;

// ✅ Solo para los TextField dentro de los cards del cuadro rojo (Detalle + Unidad de Medida)
const fieldSxValueMinus2 = {
  ...fieldSx,
  "& .MuiInputBase-input": {
    fontSize: "13px",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  "& .MuiInputLabel-root": {
    fontSize: "12px",
    fontWeight: 800,
    color: "#64748b",
  },
  "& .MuiInputBase-root": {
    minHeight: 42,
  },
} as const;

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(191,219,254,.85)",
  background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.90))",
  boxShadow: "0 12px 28px rgba(15,23,42,.055)",
} as const;

const dialogPaperSx = {
  width: { xs: "calc(100vw - 24px)", sm: 760, md: 820 },
  maxWidth: "calc(100vw - 24px)",
  borderRadius: 4,
  overflow: "hidden",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.96) 100%)",
  boxShadow: "0 24px 70px rgba(15,23,42,0.24)",
} as const;

const headerIconSx = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  color: "#2563eb",
  background: "linear-gradient(135deg, rgba(219,234,254,.95), rgba(255,255,255,.92))",
  border: "1px solid rgba(59,130,246,.24)",
  boxShadow: "0 12px 26px rgba(37,99,235,.13)",
  flexShrink: 0,
} as const;

const summaryCardSx = {
  p: { xs: 2.1, md: 2.55 },
  mb: 2.25,
  borderRadius: 3,
  border: "1px solid rgba(148,163,184,.32)",
  background: "rgba(255,255,255,.82)",
  boxShadow: "0 10px 28px rgba(15,23,42,.05)",
} as const;

const blueSectionCardSx = {
  ...sectionCardSx,
  border: "1px solid rgba(191,219,254,.9)",
  background: "rgba(255,255,255,.9)",
  boxShadow: "0 12px 28px rgba(37,99,235,.05)",
} as const;

const greenSectionCardSx = {
  ...sectionCardSx,
  border: "1px solid rgba(191,219,254,.9)",
  background: "rgba(255,255,255,.9)",
  boxShadow: "0 12px 28px rgba(37,99,235,.05)",
} as const;


const monthlyOrangeCardSx = {
  ...sectionCardSx,
  border: "1px solid rgba(251,146,60,.58)",
  background: "linear-gradient(180deg, rgba(255,247,237,.94) 0%, rgba(255,255,255,.96) 100%)",
  boxShadow: "0 14px 30px rgba(217,119,6,.10)",
} as const;

const monthlyOrangeFieldSx = {
  ...fieldSx,
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.96)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.9)",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(251,146,60,.34)" },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(217,119,6,.55)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(217,119,6,.78)",
  },
  "& .MuiInputBase-input": { py: 0.95, fontSize: 13 },
  "& input": { textAlign: "right" },
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
      fullWidth={false}
      maxWidth={false}
      PaperProps={{ sx: dialogPaperSx }}
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
            "linear-gradient(90deg, rgba(239,246,255,0.96) 0%, rgba(255,255,255,0.98) 50%, rgba(255,255,255,0.94) 100%)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={headerIconSx}>
            <TrendingUpRoundedIcon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography sx={{ fontSize: 21, fontWeight: 950, letterSpacing: "-0.03em", color: "#0f172a" }}>
                Unidad de Medida por Actividad Operativa
              </Typography>
              <Chip
                size="small"
                label="Detalle"
                sx={{
                  height: 26,
                  borderRadius: 999,
                  fontWeight: 950,
                  color: "#1d4ed8",
                  border: "1px solid rgba(59,130,246,.25)",
                  background: "rgba(219,234,254,.78)",
                }}
              />
            </Stack>
            <Typography sx={{ mt: 0.25, fontSize: 13, color: "#64748b", fontWeight: 600 }} noWrap>
              AO: {safe(nombreAo)}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip
            label={loading ? "Cargando..." : "Resumen"}
            icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: loading ? "#94a3b8" : "#16a34a" }} />}
            sx={{
              height: 34,
              borderRadius: 2,
              fontWeight: 900,
              color: loading ? "#64748b" : "#15803d",
              border: loading ? "1px solid rgba(148,163,184,.35)" : "1px solid rgba(34,197,94,.25)",
              background: loading ? "rgba(248,250,252,.95)" : "rgba(240,253,244,.95)",
              boxShadow: "0 8px 18px rgba(15,23,42,.06)",
              "& .MuiChip-icon": { ml: 1.1 },
            }}
          />
          <Tooltip title="Cerrar">
            <IconButton onClick={onClose} sx={{ borderRadius: 2, color: "#475569" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2.2, md: 3.2 }, py: 3, background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.88))" }}>
        {/* Card superior */}
        <Paper elevation={0} sx={summaryCardSx}>
          <Box
            sx={{
              display: "grid",
              // Ajuste visual del card superior:
              // 88px = columna del ícono; 190px = datos POI/AO/Año.
              // Si necesitas mover la línea divisoria, modifica el valor 190px.
              // Menor valor mueve la línea a la izquierda; mayor valor la mueve a la derecha.
              gridTemplateColumns: { xs: "1fr", md: "88px 190px minmax(0, 1fr)" },
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
                background: "linear-gradient(135deg, rgba(240,253,244,.92), rgba(255,255,255,.95))",
              }}
            >
              <DescriptionRoundedIcon fontSize="large" />
            </Box>

            <Stack
              spacing={1.25}
              sx={{
                minWidth: 0,
                pr: { xs: 0, md: 2 },
              }}
            >
              <Box>
                <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Nro Registro POI</Typography>
                <Typography sx={{ fontSize: 15, color: "#0f172a", fontWeight: 950 }}>{safe(nroRegistroPoi)}</Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Código AO</Typography>
                <Typography sx={{ fontSize: 15, color: "#0f172a", fontWeight: 950 }}>{safe(codigoAo)}</Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>Año</Typography>
                <Typography sx={{ fontSize: 15, color: "#0f172a", fontWeight: 950 }}>{anioLabel ?? "—"}</Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                borderLeft: { xs: "none", md: "1px solid rgba(148,163,184,.35)" },
                pl: { xs: 0, md: 2.25 },
                minWidth: 0,
              }}
            >
              <Stack spacing={0.65}>
                {[
                  ["OER", safe(oer)],
                  ["AER", safe(aer)],
                  ["OEI", safe(oei)],
                  ["AEI", safe(aei)],
                ].map(([label, value]) => (
                  <Typography
                    key={label}
                    sx={{
                      fontSize: 12.5,
                      color: "#475569",
                      fontWeight: 700,
                      lineHeight: 1.55,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <Box component="span" sx={{ color: "#0f172a", fontWeight: 950 }}>
                      {label}:
                    </Box>{" "}
                    {value}
                  </Typography>
                ))}
              </Stack>
            </Box>
          </Box>
        </Paper>

        {/* Detalle */}
        <Paper elevation={0} sx={{ ...blueSectionCardSx, p: { xs: 2.1, md: 2.55 }, mb: 2.25 }}>
          <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.6 }}>
            <SettingsRoundedIcon sx={{ color: "#2563eb" }} />
            <Typography sx={{ fontSize: 17, fontWeight: 950, color: "#1d4ed8" }}>Detalle</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
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
        <Paper elevation={0} sx={{ ...greenSectionCardSx, p: { xs: 2.1, md: 2.45 }, mb: 2.25 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <ChecklistRoundedIcon sx={{ color: "#16a34a" }} />
<Typography sx={{ fontSize: 17, fontWeight: 950, color: "#15803d" }}>
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

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 180px" },
              gap: 1.25,
              alignItems: "flex-start",
            }}
          >
            <Autocomplete
              options={data?.indicadores ?? []}
              value={selected}
              onChange={(_e, v) => setSelected(v)}
              getOptionLabel={(o) => combo(o?.codigo ?? null, o?.nombre ?? null)}
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
                  {combo(option?.codigo ?? null, option?.nombre ?? null)}
                </li>
              )}

              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nombre de Etapas"
                  size="small"
                  sx={{ ...fieldSxValueMinus2, width: "100%" }}
                />
              )}
            />

            <TextField
              label="Unidad"
              value={selected?.unidad ?? ""}
              size="small"
              fullWidth
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">∑</InputAdornment>,
              }}
              sx={fieldSxValueMinus2}
            />
          </Box>
        </Paper>

        {/* Valores por Mes */}
        <Paper elevation={0} sx={{ ...monthlyOrangeCardSx, p: { xs: 2.1, md: 2.45 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <CalendarMonthRoundedIcon sx={{ color: "#d97706" }} />
            <Typography sx={{ fontSize: 17, fontWeight: 950, color: "#c2410c" }}>Valores / Cantidades por Mes</Typography>
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
                          fontWeight: 950,
                          height: 22,
                          color: "#d97706",
                          background: "rgba(255,237,213,.72)",
                          borderColor: "rgba(251,146,60,.46)",
                          "& .MuiChip-label": { px: 0.8, fontSize: 11 },
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={monthlyOrangeFieldSx}
              />
            ))}
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid rgba(15,23,42,0.08)", background: "rgba(255,255,255,.94)" }}>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} variant="outlined" sx={{ fontWeight: 950, borderRadius: 2, px: 3.2, height: 40, color: "#0f172a", borderColor: "rgba(15,23,42,.55)", "&:hover": { borderColor: "#0f172a", background: "rgba(15,23,42,.03)" } }}>
          CERRAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}