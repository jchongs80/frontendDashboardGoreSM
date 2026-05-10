import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import IconButton from "@mui/material/IconButton";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import DashboardIndicadorAction, {
  type DashboardIndicadorDetalleDto,
} from "../../DashboardIndicadorAction";
import { DASHBOARD_COLORS } from "../../constants/dashboardChartColors";

const COLOR_META = "#2563eb";
const COLOR_EJECUTADO = "#16a34a";
const COLOR_SEMESTRE = "#f97316";
const COLOR_AVANCE = "#7c3aed";

// Líneas de referencia con estilo tipo dashboard ejecutivo.
const COLOR_REF_75 = "#f59e0b";
const COLOR_REF_95 = "#22c55e";

type Props = {
  open: boolean;
  onClose: () => void;
  instrumento: string;
  idRegistro: number;
  idIndicadorNombre: number;
  anioResumen?: number | null;
};

type ResumenAnual = {
  anio: string;
  meta: number;
  ejecutado: number;
  semestreI: number;
  avance: number;
  referencia75: number;
  referencia95: number;
};

function formatNumber(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatPercent(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0)}%`;
}

function formatBytes(bytes: number | null | undefined): string {
  const n = Number(bytes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function safeText(value?: string | null): string {
  const txt = (value ?? "").trim();
  return txt.length ? txt : "—";
}

function getAvance(meta: number | null | undefined, ejecutado: number | null | undefined): number | null {
  const m = Number(meta ?? 0);
  const e = Number(ejecutado ?? 0);

  if (!Number.isFinite(m) || !Number.isFinite(e) || m === 0) return null;
  return (e / m) * 100;
}

function getSemaforoFromAvance(avance: number | null | undefined): "ROJO" | "AMARILLO" | "VERDE" {
  const value = Number(avance ?? 0);
  if (value < 75) return "ROJO";
  if (value < 95) return "AMARILLO";
  return "VERDE";
}

function getSemaforoChipSx(semaforo?: string | null) {
  const value = (semaforo ?? "").toUpperCase();

  if (value === "ROJO") {
    return {
      bgcolor: "rgba(239,68,68,0.12)",
      color: "rgb(153,27,27)",
      borderColor: "rgba(239,68,68,0.45)",
      fontWeight: 900,
    };
  }

  if (value === "AMARILLO") {
    return {
      bgcolor: "rgba(245,158,11,0.15)",
      color: "rgb(146,64,14)",
      borderColor: "rgba(245,158,11,0.55)",
      fontWeight: 900,
    };
  }

  return {
    bgcolor: "rgba(34,197,94,0.13)",
    color: "rgb(21,128,61)",
    borderColor: "rgba(34,197,94,0.50)",
    fontWeight: 900,
  };
}

function getProgressColor(avance: number | null | undefined): string {
  const semaforo = getSemaforoFromAvance(avance);
  if (semaforo === "ROJO") return "#ef4444";
  if (semaforo === "AMARILLO") return "#f59e0b";
  return "#22c55e";
}

type MiniCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  borderColor?: string;
};

function MiniCard({ title, value, icon, borderColor = "rgba(0,0,0,0.12)" }: MiniCardProps): React.ReactElement {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.4,
        borderRadius: 2.5,
        borderColor,
        backgroundColor: "rgba(255,255,255,0.96)",
      }}
    >
      <Stack direction="row" spacing={0.8} alignItems="center">
        {icon}
        <Typography sx={{ fontSize: 12.5, color: "text.secondary", fontWeight: 800 }}>
          {title}
        </Typography>
      </Stack>
      <Typography sx={{ mt: 0.7, fontSize: 22, fontWeight: 950 }}>
        {value}
      </Typography>
    </Paper>
  );
}

type InfoRowProps = {
  label: string;
  value?: string | null;
};

function InfoRow({ label, value }: InfoRowProps): React.ReactElement {
  return (
    <Typography sx={{ fontSize: 13.2, lineHeight: 1.5 }}>
      <b>{label}:</b> {safeText(value)}
    </Typography>
  );
}

export default function DashboardIndicadorDrawer(props: Props): React.ReactElement {
  const { open, onClose, instrumento, idRegistro, idIndicadorNombre, anioResumen } = props;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<DashboardIndicadorDetalleDto | null>(null);

  useEffect(() => {
    async function fetchDetalle() {
      if (!open || !instrumento || !idRegistro || !idIndicadorNombre) return;

      setLoading(true);
      setErrorMsg("");

      try {
        const resp = await DashboardIndicadorAction.getDetalle(
          instrumento,
          idRegistro,
          idIndicadorNombre
        );
        setData(resp);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "No se pudo cargar el indicador.");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    void fetchDetalle();
  }, [open, instrumento, idRegistro, idIndicadorNombre]);

  const chartData = useMemo<ResumenAnual[]>(() => {
    const metas = data?.valoresMeta ?? [];
    const ejecutados = data?.valoresEjecutado ?? [];
    const semestres = data?.valoresEjecutadoSemestreI ?? [];

    const years = Array.from(
      new Set([
        ...metas.map((x) => x.anio),
        ...ejecutados.map((x) => x.anio),
        ...semestres.map((x) => x.anio),
      ])
    ).sort((a, b) => a - b);

    return years.map((anio) => {
      const meta = Number(metas.find((m) => m.anio === anio)?.valor ?? 0);
      const ejecutado = Number(ejecutados.find((e) => e.anio === anio)?.valor ?? 0);
      const semestreI = Number(semestres.find((e) => e.anio === anio)?.valor ?? 0);
      const avance = getAvance(meta, ejecutado) ?? 0;

      return {
        anio: String(anio),
        meta,
        ejecutado,
        semestreI,
        avance,
        referencia75: 75,
        referencia95: 95,
      };
    });
  }, [data]);

  const ultimo = useMemo(() => {
    if (chartData.length === 0) {
      return {
        anio: "—",
        meta: 0,
        ejecutado: 0,
        semestreI: 0,
        avance: null as number | null,
        semaforo: "ROJO" as "ROJO" | "AMARILLO" | "VERDE",
      };
    }

    const anioSolicitado = Number(anioResumen ?? 0);
    const anioActual = new Date().getFullYear();

    const item =
      (Number.isFinite(anioSolicitado) && anioSolicitado > 0
        ? chartData.find((x) => Number(x.anio) === anioSolicitado)
        : undefined) ??
      chartData.find((x) => Number(x.anio) === anioActual) ??
      chartData.find((x) => Number(x.ejecutado) !== 0 || Number(x.semestreI) !== 0) ??
      chartData[0];

    const avance = getAvance(item.meta, item.ejecutado);

    return {
      anio: item.anio,
      meta: item.meta,
      ejecutado: item.ejecutado,
      semestreI: item.semestreI,
      avance,
      semaforo: getSemaforoFromAvance(avance),
    };
  }, [chartData, anioResumen]);

  const progressValue = Math.max(0, Math.min(Number(ultimo.avance ?? 0), 100));
  const progressColor = getProgressColor(ultimo.avance);
  const instrumentoKey = (instrumento ?? "").trim().toUpperCase();
  const esPrcp = instrumentoKey === "PRCP";

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 370, sm: 620, md: 720 }, p: 2.2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <InsightsRoundedIcon />
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                Resumen ejecutivo del indicador
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                Meta, ejecutado, avance, semestre I, línea base e información complementaria
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2">Cargando detalle...</Typography>
          </Stack>
        ) : null}

        {!loading && errorMsg ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        ) : null}

        {!loading && !errorMsg && data ? (
          <Stack spacing={2}>
            <Paper
              variant="outlined"
              sx={{
                p: 1.7,
                borderRadius: 2.5,
                borderColor: "rgba(37,99,235,0.35)",
                background:
                  "linear-gradient(180deg, rgba(37,99,235,0.08) 0%, rgba(255,255,255,0.98) 55%)",
              }}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                <Chip
                  size="small"
                  label={data.instrumento}
                  sx={{ borderRadius: 999, fontWeight: 900 }}
                />
                <Chip
                  size="small"
                  label={`Código: ${data.codigoIndicador}`}
                  variant="outlined"
                  sx={{ borderRadius: 999, fontWeight: 800 }}
                />
                <Chip
                  size="small"
                  label={ultimo.semaforo}
                  variant="outlined"
                  sx={{ borderRadius: 999, ...getSemaforoChipSx(ultimo.semaforo) }}
                />
              </Stack>

              <Typography sx={{ mt: 1.2, fontWeight: 950, lineHeight: 1.28 }}>
                {data.nombreIndicador}
              </Typography>

              <Typography sx={{ mt: 0.8, fontSize: 13, color: "text.secondary" }}>
                <b>{esPrcp ? "Objetivo prioritario" : "OEI"}:</b> {safeText(data.nivel1)}
              </Typography>

              {data.nivel2 ? (
                <Typography sx={{ mt: 0.25, fontSize: 13, color: "text.secondary" }}>
                  <b>{esPrcp ? "Medida política" : "AEI"}:</b> {safeText(data.nivel2)}
                </Typography>
              ) : null}
            </Paper>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
                gap: 1.2,
              }}
            >
              <MiniCard
                title={`Meta ${ultimo.anio}`}
                value={formatNumber(ultimo.meta)}
                icon={<FlagRoundedIcon fontSize="small" />}
                borderColor="rgba(37,99,235,0.30)"
              />

              <MiniCard
                title={`Ejecutado ${ultimo.anio}`}
                value={formatNumber(ultimo.ejecutado)}
                icon={<CheckCircleRoundedIcon fontSize="small" />}
                borderColor="rgba(34,197,94,0.35)"
              />

              <MiniCard
                title={`Semestre I ${ultimo.anio}`}
                value={formatNumber(ultimo.semestreI)}
                icon={<CalendarMonthRoundedIcon fontSize="small" />}
                borderColor="rgba(249,115,22,0.38)"
              />

              <MiniCard
                title="Avance"
                value={ultimo.avance == null ? "—" : formatPercent(ultimo.avance)}
                icon={<TrackChangesRoundedIcon fontSize="small" />}
                borderColor="rgba(124,58,237,0.32)"
              />
            </Box>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.8 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 13.2 }}>
                  Progreso anual del indicador
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 13.2 }}>
                  {ultimo.avance == null ? "—" : formatPercent(ultimo.avance)}
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={progressValue}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "rgba(0,0,0,0.08)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundColor: progressColor,
                  },
                }}
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <InfoOutlinedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 900 }}>
                  Información complementaria
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 0.7,
                }}
              >
                {esPrcp ? (
                  <>
                    <InfoRow label="Unidad de medida" value={data.unidadMedida} />
                    <InfoRow label="Sentido" value={data.tipoIndicador ?? data.sentidoEsperado} />
                  </>
                ) : (
                  <>
                    <InfoRow label="Línea base" value={data.lineaBase ? `${data.lineaBase.anio} | ${data.lineaBase.tipoValor ?? "BASE"} | ${formatNumber(data.lineaBase.valor)}` : "—"} />
                    <InfoRow label="Relevancia" value={data.relevancia} />
                    <InfoRow label="Sentido esperado" value={data.sentidoEsperado} />
                    <InfoRow label="Tipo de agregación" value={data.tipoAgregacion} />
                    <InfoRow label="Fuente" value={data.fuente} />
                    <InfoRow label="Tipo de valor" value={data.tipoValor} />
                  </>
                )}
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <CategoryRoundedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 900 }}>
                  Información INFO
                </Typography>
              </Stack>

              <Stack spacing={0.8}>
                <InfoRow
                  label="Factores que contribuyeron o dificultaron el avance"
                  value={data.factoresAvance}
                />
                <InfoRow
                  label="Medidas recomendadas"
                  value={data.medidasRecomendadas}
                />
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <AttachFileRoundedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 900 }}>
                  Ficha del indicador
                </Typography>
              </Stack>

              {data.ficha?.tieneFicha ? (
                <Stack spacing={0.6}>
                  <InfoRow label="Archivo" value={data.ficha.nombreOriginal} />
                  <InfoRow label="Extensión" value={data.ficha.extension} />
                  <Typography sx={{ fontSize: 13.2 }}>
                    <b>Tamaño:</b> {formatBytes(data.ficha.tamanioBytes)}
                  </Typography>
                </Stack>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  El indicador aún no tiene ficha adjunta.
                </Alert>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.6, borderRadius: 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TimelineRoundedIcon fontSize="small" />
                <Typography sx={{ fontWeight: 900 }}>
                  Meta, Ejecutado, Semestre I y Avance
                </Typography>
              </Stack>

              <Box sx={{ height: 310 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke={DASHBOARD_COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="anio" tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                    <YAxis tick={{ fill: DASHBOARD_COLORS.text, fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === "Avance %" || name === "Referencia 75%" || name === "Referencia 95%") {
                          return [formatPercent(value), name];
                        }
                        return [formatNumber(value), name];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: `1px solid ${DASHBOARD_COLORS.grid}`,
                        boxShadow: "0 10px 25px rgba(0,0,0,.08)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      name="Meta"
                      stroke={COLOR_META}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLOR_META }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ejecutado"
                      name="Ejecutado"
                      stroke={COLOR_EJECUTADO}
                      strokeWidth={3}
                      dot={{ r: 4, fill: COLOR_EJECUTADO }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="semestreI"
                      name="Semestre I"
                      stroke={COLOR_SEMESTRE}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: COLOR_SEMESTRE }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avance"
                      name="Avance %"
                      stroke={COLOR_AVANCE}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: COLOR_AVANCE }}
                    />
                    <Line
                      type="monotone"
                      dataKey="referencia75"
                      name="Referencia 75%"
                      stroke={COLOR_REF_75}
                      strokeWidth={2}
                      strokeDasharray="7 5"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="referencia95"
                      name="Referencia 95%"
                      stroke={COLOR_REF_95}
                      strokeWidth={2}
                      strokeDasharray="7 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, fontWeight: 900 }}>
                Cerrar
              </Button>
            </Box>
          </Stack>
        ) : null}
      </Box>
    </Drawer>
  );
}
