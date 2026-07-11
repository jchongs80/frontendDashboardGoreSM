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
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import {
  AgPoRecoInprVistaAction,
  type AgIndicadorDetalleResponseDto,
} from "../AgPoRecoInprVistaAction";
import AgIndicadorFichaModal from "./AgIndicadorFichaModal";
import AgIndicadorInfoModal from "./AgIndicadorInfoModal";

type Props = {
  open: boolean;
  onClose: () => void;
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  politica?: string | null;
  rc?: string | null;
  ip?: string | null;
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
    backgroundColor: "rgba(248,250,252,0.96)",
    fontWeight: 700,
  },
  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148,163,184,0.55)",
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
  border: "1px solid rgba(147,197,253,0.85)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.96))",
  boxShadow: "0 14px 34px rgba(15,23,42,.07)",
} as const;

const headerIconSx = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#16a34a",
  background: "linear-gradient(135deg, rgba(220,252,231,.95), rgba(255,255,255,.92))",
  border: "1px solid rgba(34,197,94,.22)",
  boxShadow: "0 12px 26px rgba(34,197,94,.12)",
} as const;

type AnnualCardProps = {
  color: string;
  bg: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

function AnnualCard({ color, bg, icon, title, subtitle, children }: AnnualCardProps): React.ReactElement {
  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 245,
        p: { xs: 1.65, md: 1.85 },
        borderRadius: 3,
        border: `1px solid ${color === "#16a34a" ? "rgba(134,239,172,.9)" : "rgba(147,197,253,.9)"}`,
        background: `linear-gradient(180deg, ${bg}, rgba(255,255,255,.97))`,
        boxShadow: "0 12px 28px rgba(15,23,42,.06)",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1.35 }}>
        <Box sx={{ color, display: "inline-flex", mt: 0.15 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 950, color, lineHeight: 1.15 }}>{title}</Typography>
          <Typography sx={{ fontSize: 11.3, color: "#64748b", fontWeight: 700, lineHeight: 1.25 }}>{subtitle}</Typography>
        </Box>
      </Stack>
      {children}
    </Paper>
  );
}

function ValueRow({ year, value }: { year: number | string; value: string }): React.ReactElement {
  return (
    <Box
      sx={{
        height: 33,
        px: 1,
        display: "grid",
        gridTemplateColumns: "82px 1fr",
        alignItems: "center",
        gap: 1,
        borderRadius: 2,
        border: "1px solid rgba(191,219,254,.85)",
        background: "rgba(255,255,255,.82)",
      }}
    >
      <Chip
        size="small"
        label={String(year)}
        variant="outlined"
        sx={{
          height: 22,
          minWidth: 62,
          borderRadius: 999,
          color: "#2563eb",
          borderColor: "rgba(96,165,250,.8)",
          backgroundColor: "rgba(239,246,255,.9)",
          fontWeight: 900,
          "& .MuiChip-label": { px: 1, fontSize: 11 },
        }}
      />
      <Typography sx={{ textAlign: "right", fontSize: 13.5, fontWeight: 950, color: "#0f172a" }}>{value}</Typography>
    </Box>
  );
}

function EditableValueRow({ year, value, onChange }: { year: number | string; value: string; onChange: (value: string) => void }): React.ReactElement {
  return (
    <Box
      sx={{
        height: 33,
        px: 1,
        display: "grid",
        gridTemplateColumns: "82px 1fr",
        alignItems: "center",
        gap: 1,
        borderRadius: 2,
        border: "1px solid rgba(134,239,172,.85)",
        background: "rgba(255,255,255,.82)",
      }}
    >
      <Chip
        size="small"
        label={String(year)}
        variant="outlined"
        sx={{
          height: 22,
          minWidth: 62,
          borderRadius: 999,
          color: "#16a34a",
          borderColor: "rgba(74,222,128,.8)",
          backgroundColor: "rgba(240,253,244,.92)",
          fontWeight: 900,
          "& .MuiChip-label": { px: 1, fontSize: 11 },
        }}
      />
      <TextField
        value={value}
        size="small"
        fullWidth
        onChange={(event) => onChange(event.target.value)}
        sx={{
          "& .MuiOutlinedInput-root": {
            height: 24,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,.88)",
            fontWeight: 900,
            "& fieldset": { borderColor: "rgba(148,163,184,.75)" },
          },
          "& .MuiInputBase-input": {
            py: 0,
            px: 1.1,
            height: 24,
            textAlign: "right",
            fontSize: 12.5,
            fontWeight: 900,
          },
        }}
      />
    </Box>
  );
}

function CardNote({ color, text }: { color: string; text: string }): React.ReactElement {
  return (
    <Stack direction="row" spacing={0.7} alignItems="flex-start" sx={{ mt: 1.35 }}>
      <InfoOutlinedIcon sx={{ color, fontSize: 16, mt: 0.15 }} />
      <Typography sx={{ color: "#64748b", fontSize: 11.2, fontWeight: 700, lineHeight: 1.45 }}>{text}</Typography>
    </Stack>
  );
}


export default function AgIndicadorDetalleModal({
  open,
  onClose,
  idAgPoRecoInpr,
  idIndicadorNombre,
  codigoIndicador,
  nombreIndicador,
}: Props): React.ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [data, setData] = useState<AgIndicadorDetalleResponseDto | null>(null);
  const [ejecutadoForm, setEjecutadoForm] = useState<Record<number, string>>({});
  const [savingEjecutado, setSavingEjecutado] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [fichaOpen, setFichaOpen] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);

  const loadDetalle = async (currentIdAgPoRecoInpr: number, currentIdIndicadorNombre: number) => {
    if (!currentIdAgPoRecoInpr || !currentIdIndicadorNombre) {
      setData(null);
      setErrorMsg("");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await AgPoRecoInprVistaAction.getIndicadorDetalle(
        currentIdAgPoRecoInpr,
        currentIdIndicadorNombre,
        null,
        null
      );

      if (!res) {
        setData(null);
        setErrorMsg(
          `El endpoint devolvió data = null. idAgPoRecoInpr=${currentIdAgPoRecoInpr}, idIndicadorNombre=${currentIdIndicadorNombre}`
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
    void loadDetalle(idAgPoRecoInpr, idIndicadorNombre);
  }, [open, idAgPoRecoInpr, idIndicadorNombre]);

  useEffect(() => {
    const map: Record<number, string> = {};
    for (const item of data?.valoresEjecutadoPorAnio ?? []) {
      map[item.idAnioProyeccion] = String(item.valor ?? 0);
    }
    setEjecutadoForm(map);
  }, [data]);

  const codigoIndicadorView = useMemo(() => safeText(data?.codigoIndicador ?? codigoIndicador), [data, codigoIndicador]);
  const nombreIndicadorView = useMemo(() => safeText(data?.nombreIndicador ?? nombreIndicador), [data, nombreIndicador]);


  async function guardarEjecutado() {
    try {
      setSavingEjecutado(true);
      setErrorMsg("");
      setSuccessMsg("");

      await AgPoRecoInprVistaAction.guardarIndicadorEjecutado({
        idAgPoRecoInpr,
        idIndicadorNombre,
        valores: (data?.valoresEjecutadoPorAnio ?? []).map((x) => ({
          idAnioProyeccion: x.idAnioProyeccion,
          valor: parseDecimalInput(ejecutadoForm[x.idAnioProyeccion] ?? "0"),
        })),
      });

      await loadDetalle(idAgPoRecoInpr, idIndicadorNombre);

      setSuccessMsg(
        "Los valores ejecutados del indicador AG se guardaron correctamente.",
      );
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSavingEjecutado(false);
    }
  }

  return (
    <>
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <DialogTitle
        sx={{
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(90deg, rgba(240,253,244,0.96), rgba(255,255,255,0.98))",
        }}
      >
        <Stack spacing={0.55} sx={{ pr: 2, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start" flexWrap="nowrap">
            <Box sx={headerIconSx}>
              <TrendingUpRoundedIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.45 }}>
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
                  Indicador A.G.
                </Typography>
                <Chip size="small" variant="outlined" label="AG" sx={{ borderRadius: 999, fontWeight: 900, color: "#16a34a", borderColor: "rgba(34,197,94,.45)", backgroundColor: "rgba(240,253,244,.9)" }} />
              </Stack>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px", mt: 0.2 }}>
                Indicador: <b>{nombreIndicadorView}</b>
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1.1} alignItems="center" sx={{ flexShrink: 0 }}>
          <Chip
            size="small"
            label="Resumen"
            color="success"
            variant="outlined"
            sx={{
              height: 30,
              borderRadius: 2,
              fontWeight: 950,
              color: "#15803d",
              border: "1px solid rgba(34,197,94,.28)",
              background: "rgba(240,253,244,.95)",
              boxShadow: "0 8px 18px rgba(34,197,94,.08)",
              "& .MuiChip-label": { px: 1.25 },
            }}
          />
          <Button onClick={onClose} sx={{ minWidth: "auto", p: 0.5, color: "text.secondary", borderRadius: 2 }}>
            <CloseRoundedIcon />
          </Button>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2, background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.88))" }}>
        {errorMsg ? <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert> : null}

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
              <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 950, mb: 0.75 }}>
                Nivel: <Box component="span" sx={{ color: "#0f172a" }}>AG</Box>
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: "#475569", fontWeight: 800, lineHeight: 1.55 }}>
                AG: {nombreIndicadorView}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...sectionCardSx, p: 2, mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
            <InfoOutlinedIcon fontSize="small" sx={{ color: "#2563eb" }} />
            <Typography sx={{ fontWeight: 950, color: "#2563eb" }}>Información</Typography>
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.1 }}>
            <TextField label="Fuente de datos" size="small" fullWidth value={safeText(data?.nombreFuenteDatos)} sx={fieldSx} InputProps={{ readOnly: true }} />
            <TextField label="Tendencia" size="small" fullWidth value={safeText(data?.nombreTendencia)} sx={fieldSx} InputProps={{ readOnly: true }} />
            <TextField label="Método de cálculo" size="small" fullWidth value={safeText(data?.nombreMetodoCalculo)} sx={{ ...fieldSx, gridColumn: { xs: "1", md: "1 / span 2" } }} InputProps={{ readOnly: true }} />
            <TextField label="Unidad de medida" size="small" fullWidth value={safeText(data?.nombreUnidadMedida)} sx={fieldSx} InputProps={{ readOnly: true }} />
            <TextField label="Tipo de indicador" size="small" fullWidth value={safeText(data?.nombreTipoIndicador)} sx={fieldSx} InputProps={{ readOnly: true }} />
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.35 }}>
          <AnnualCard
            color="#2563eb"
            bg="rgba(239,246,255,.78)"
            icon={<BarChartRoundedIcon fontSize="small" />}
            title="Valores Meta Anual"
            subtitle="Metas planificadas para cada año."
          >
            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando valores...</Typography>
              </Stack>
            ) : !data?.valoresMetaPorAnio || data.valoresMetaPorAnio.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No existen valores META por año para este indicador.</Alert>
            ) : (
              <Stack spacing={1}>
                {(data?.valoresMetaPorAnio ?? []).map((item) => (
                  <ValueRow key={item.idAnioProyeccion} year={item.anio} value={formatNumber(item.valor)} />
                ))}
              </Stack>
            )}

            <CardNote color="#2563eb" text="Se muestran todos los valores del tipo META por año para el indicador seleccionado." />
          </AnnualCard>

          <AnnualCard
            color="#16a34a"
            bg="rgba(240,253,244,.86)"
            icon={<TrendingUpRoundedIcon fontSize="small" />}
            title="Valores Ejecutado Anual"
            subtitle="Ejecución acumulada real vs. meta anual."
          >
            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando valores ejecutados...</Typography>
              </Stack>
            ) : !data?.valoresEjecutadoPorAnio || data.valoresEjecutadoPorAnio.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No existen años de META para este indicador y por tanto no hay ejecutado anual a registrar.</Alert>
            ) : (
              <Stack spacing={1}>
                {(data?.valoresEjecutadoPorAnio ?? []).map((item) => (
                  <EditableValueRow
                    key={item.idAnioProyeccion}
                    year={item.anio}
                    value={ejecutadoForm[item.idAnioProyeccion] ?? "0"}
                    onChange={(value) => setEjecutadoForm((prev) => ({ ...prev, [item.idAnioProyeccion]: value }))}
                  />
                ))}
              </Stack>
            )}

            <CardNote color="#16a34a" text="Estos valores corresponden al ejecutado real anual y sí se pueden editar." />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
              <Button variant="contained" size="small" onClick={guardarEjecutado} disabled={savingEjecutado} sx={{ borderRadius: 2, fontWeight: 950, boxShadow: "0 10px 18px rgba(37,99,235,.18)" }}>
                {savingEjecutado ? "Guardando..." : "GUARDAR"}
              </Button>
            </Box>
          </AnnualCard>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<AttachFileRoundedIcon />}
            onClick={() => setFichaOpen(true)}
            sx={{ fontWeight: 900, borderRadius: 2.2, px: 3.5, minWidth: 118, height: 42, borderColor: "#1976d2", backgroundColor: "#fff" }}
          >
            FICHA
          </Button>
          <Button
            variant="outlined"
            startIcon={<InfoRoundedIcon />}
            onClick={() => setInfoOpen(true)}
            sx={{ fontWeight: 900, borderRadius: 2.2, px: 3.5, minWidth: 118, height: 42, borderColor: "#1976d2", backgroundColor: "#fff" }}
          >
            INFO
          </Button>
          <Button onClick={onClose} variant="outlined" sx={{ fontWeight: 900, borderRadius: 2.2, px: 3.5, minWidth: 132, height: 42, color: "#111827", borderColor: "#111827", backgroundColor: "#fff" }}>CERRAR</Button>
        </Stack>
      </DialogActions>
    </Dialog>

    <AgIndicadorFichaModal
      open={fichaOpen}
      onClose={() => setFichaOpen(false)}
      idAgPoRecoInpr={idAgPoRecoInpr}
      idIndicadorNombre={idIndicadorNombre}
      codigoIndicador={codigoIndicadorView}
      nombreIndicador={nombreIndicadorView}
      tipoNivel="AG"
    />

    <AgIndicadorInfoModal
      open={infoOpen}
      onClose={() => setInfoOpen(false)}
      idAgPoRecoInpr={idAgPoRecoInpr}
      idIndicadorNombre={idIndicadorNombre}
      codigoIndicador={codigoIndicadorView}
      nombreIndicador={nombreIndicadorView}
      tipoNivel="AG"
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
          minWidth: { xs: 280, sm: 460 },
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