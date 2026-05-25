// AJUSTE_UNIDADES_EJECUTORAS_FONDO_ICONOS_20260520
// AJUSTE_SOLICITADO_SOLO_ICONOS_POI_202605
// AJUSTE_FINAL_ICONOS_PREMIUM_VISIBLES_20260520
// features/planeamiento/pages/UnidadesEjecutorasPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  Button,
  Stack,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import DriveFileRenameOutlineRoundedIcon from "@mui/icons-material/DriveFileRenameOutlineRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";

import { useNavigate } from "react-router-dom";

import { UnidadEjecutoraAction } from "../UnidadEjecutoraAction";
import type { UnidadEjecutoraDto } from "../UnidadEjecutoraAction";

type Estado = "ACTIVO" | "INACTIVO";
type EstadoFilter = "TODOS" | Estado;

type UnidadEjecutoraRow = UnidadEjecutoraDto;

type FormState = {
  idUnidadEjecutora: number;
  codigo: string;
  nombre: string;
  tipo: string;
  idPliego: string;
  estado: Estado;
};

function toText(v: unknown): string {
  return (v ?? "").toString().trim().toLowerCase();
}

function normEstado(v?: string | null): Estado {
  const s = (v ?? "ACTIVO").toString().toUpperCase();
  return s === "INACTIVO" ? "INACTIVO" : "ACTIVO";
}

function getErrorMessage(err: unknown, fallback = "Ocurrió un error."): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err || fallback;
  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}

function pillSx(estado?: string | null) {
  const e = normEstado(estado);
  return {
    display: "inline-flex",
    alignItems: "center",
    px: 1.25,
    py: 0.35,
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 0.3,
    border: "1px solid",
    borderColor: e === "ACTIVO" ? "rgba(46, 125, 50, .25)" : "rgba(237, 108, 2, .25)",
    bgcolor: e === "ACTIVO" ? "rgba(46, 125, 50, .08)" : "rgba(237, 108, 2, .08)",
    color: e === "ACTIVO" ? "success.main" : "warning.main",
  } as const;
}

function actionBtnSx(color: "blue" | "violet" | "slate" | "edit" | "danger" | "success" = "slate") {
  const palette = {
    blue: { main: "#2563eb", soft: "rgba(37,99,235,.10)", border: "rgba(37,99,235,.32)", shadow: "rgba(37,99,235,.22)" },
    violet: { main: "#7c3aed", soft: "rgba(124,58,237,.10)", border: "rgba(124,58,237,.32)", shadow: "rgba(124,58,237,.22)" },
    slate: { main: "#475569", soft: "rgba(71,85,105,.10)", border: "rgba(71,85,105,.28)", shadow: "rgba(15,23,42,.14)" },
    edit: { main: "#1d4ed8", soft: "rgba(29,78,216,.10)", border: "rgba(29,78,216,.34)", shadow: "rgba(29,78,216,.20)" },
    danger: { main: "#ea580c", soft: "rgba(234,88,12,.10)", border: "rgba(234,88,12,.36)", shadow: "rgba(234,88,12,.22)" },
    success: { main: "#16a34a", soft: "rgba(22,163,74,.10)", border: "rgba(22,163,74,.34)", shadow: "rgba(22,163,74,.20)" },
  }[color];

  return {
    width: 31,
    height: 31,
    borderRadius: 2.2,
    mx: 0.2,
    color: palette.main,
    border: `1px solid ${palette.border}`,
    background: `linear-gradient(135deg, #ffffff 0%, ${palette.soft} 100%)`,
    boxShadow: `0 8px 18px ${palette.shadow}`,
    "& .MuiSvgIcon-root": { fontSize: 18 },
    "&:hover": {
      bgcolor: palette.soft,
      borderColor: palette.main,
      transform: "translateY(-1px)",
      boxShadow: `0 12px 24px ${palette.shadow}`,
    },
    "&:active": { transform: "translateY(0px)", boxShadow: `0 6px 14px ${palette.shadow}` },
    transition: "all .15s ease",
  } as const;
}

function rowCrudIconSx(color: "view" | "edit" | "danger" | "success" = "view") {
  const palette = {
    view: {
      main: "#2563eb",
      bg1: "#eff6ff",
      bg2: "#dbeafe",
      border: "rgba(37,99,235,.52)",
      shadow: "rgba(37,99,235,.28)",
    },
    edit: {
      main: "#7c3aed",
      bg1: "#f5f3ff",
      bg2: "#ede9fe",
      border: "rgba(124,58,237,.52)",
      shadow: "rgba(124,58,237,.26)",
    },
    danger: {
      main: "#ea580c",
      bg1: "#fff7ed",
      bg2: "#ffedd5",
      border: "rgba(234,88,12,.58)",
      shadow: "rgba(234,88,12,.26)",
    },
    success: {
      main: "#16a34a",
      bg1: "#f0fdf4",
      bg2: "#dcfce7",
      border: "rgba(22,163,74,.54)",
      shadow: "rgba(22,163,74,.24)",
    },
  }[color];

  return {
    width: 34,
    height: 34,
    borderRadius: 2.35,
    mx: 0.18,
    color: palette.main,
    border: `1.8px solid ${palette.border}`,
    background: `linear-gradient(145deg, ${palette.bg1} 0%, #ffffff 46%, ${palette.bg2} 100%)`,
    boxShadow: `0 10px 22px ${palette.shadow}, inset 0 1px 0 rgba(255,255,255,.95)`,
    "& .MuiSvgIcon-root": { fontSize: 18.8 },
    "&:hover": {
      color: palette.main,
      borderColor: palette.main,
      background: `linear-gradient(145deg, #ffffff 0%, ${palette.bg2} 100%)`,
      transform: "translateY(-2px) scale(1.04)",
      boxShadow: `0 16px 30px ${palette.shadow}, 0 0 0 3px ${palette.bg2}`,
    },
    "&:active": {
      transform: "translateY(0px) scale(.98)",
      boxShadow: `0 6px 14px ${palette.shadow}`,
    },
    transition: "all .16s ease-in-out",
  } as const;
}

function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "rgba(0,0,0,.03)" }}>
      <Typography variant="caption" sx={{ fontWeight: 900, color: "text.secondary" }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.4, fontWeight: 800 }}>{value || "—"}</Box>
    </Box>
  );
}

export default function UnidadesEjecutorasPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<UnidadEjecutoraRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [q, setQ] = useState<string>("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("TODOS");

  const [page, setPage] = useState<number>(0);
  const [rpp, setRpp] = useState<number>(10);

  // Modales
  const [openView, setOpenView] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [isCreate, setIsCreate] = useState<boolean>(false); // ✅ NUEVO
  const [viewRow, setViewRow] = useState<UnidadEjecutoraRow | null>(null);

  const [form, setForm] = useState<FormState>({
    idUnidadEjecutora: 0,
    codigo: "",
    nombre: "",
    tipo: "",
    idPliego: "",
    estado: "ACTIVO",
  });

  // Guardado de edición/registro
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>("");

  // Confirmación de cambio de estado
  const [openEstado, setOpenEstado] = useState<boolean>(false);
  const [estadoTarget, setEstadoTarget] = useState<UnidadEjecutoraRow | null>(null);
  const [estadoSaving, setEstadoSaving] = useState<boolean>(false);
  const [estadoError, setEstadoError] = useState<string>("");

  const load = async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      const data = await UnidadEjecutoraAction.getUnidadesEjecutoras(true);
      const projected: UnidadEjecutoraRow[] = data.map((u) => ({
        ...u,
        estado: u.estado ?? "ACTIVO",
      }));
      setRows(projected);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error al listar unidades ejecutoras."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = toText(q);
    return rows.filter((r) => {
      const e = normEstado(r.estado ?? "ACTIVO");
      if (estadoFilter !== "TODOS" && e !== estadoFilter) return false;
      if (!qq) return true;

      return (
        toText(r.codigo).includes(qq) ||
        toText(r.nombre).includes(qq) ||
        toText(r.tipo).includes(qq) ||
        toText(r.idPliego).includes(qq)
      );
    });
  }, [rows, q, estadoFilter]);

  const paged = useMemo(() => {
    const start = page * rpp;
    return filtered.slice(start, start + rpp);
  }, [filtered, page, rpp]);

  const onView = (r: UnidadEjecutoraRow): void => {
    setViewRow(r);
    setOpenView(true);
  };

  const onEdit = (r: UnidadEjecutoraRow): void => {
    setSaveError("");
    setIsCreate(false);
    setViewRow(r);

    setForm({
      idUnidadEjecutora: r.idUnidadEjecutora,
      codigo: r.codigo,
      nombre: r.nombre,
      tipo: r.tipo ?? "",
      idPliego: r.idPliego != null ? String(r.idPliego) : "",
      estado: normEstado(r.estado),
    });

    setOpenEdit(true);
  };

  const onConfirmEstado = (r: UnidadEjecutoraRow): void => {
    setEstadoError("");
    setEstadoTarget(r);
    setOpenEstado(true);
  };

  const patchForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSave = useMemo(() => {
    return form.codigo.trim().length >= 2 && form.nombre.trim().length >= 3;
  }, [form.codigo, form.nombre]);

  const save = async (): Promise<void> => {
    setSaving(true);
    setSaveError("");
    try {
      const idPliegoNum = form.idPliego.trim().length === 0 ? null : Number(form.idPliego);
      if (idPliegoNum !== null && Number.isNaN(idPliegoNum)) {
        setSaveError("El campo Pliego debe ser numérico (o vacío).");
        return;
      }

      const payload = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        tipo: form.tipo.trim() || null,
        idPliego: idPliegoNum,
        estado: form.estado,
      };

      if (isCreate) {
        // ✅ NUEVO: crear
        await UnidadEjecutoraAction.createUnidadEjecutora(payload);
      } else {
        // ✅ existente: editar
        await UnidadEjecutoraAction.updateUnidadEjecutora(form.idUnidadEjecutora, payload);
      }

      setOpenEdit(false);
      await load();
    } catch (err: unknown) {
      setSaveError(getErrorMessage(err, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  };

  const doCambiarEstado = async (): Promise<void> => {
    if (!estadoTarget) return;

    setEstadoSaving(true);
    setEstadoError("");
    try {
      const actual = normEstado(estadoTarget.estado);
      const nuevo: Estado = actual === "ACTIVO" ? "INACTIVO" : "ACTIVO";
      await UnidadEjecutoraAction.cambiarEstado(estadoTarget.idUnidadEjecutora, nuevo);

      setOpenEstado(false);
      setEstadoTarget(null);
      await load();
    } catch (err: unknown) {
      setEstadoError(getErrorMessage(err, "No se pudo cambiar el estado."));
    } finally {
      setEstadoSaving(false);
    }
  };

  const estadoConfirmText = useMemo(() => {
    if (!estadoTarget) return "";
    const actual = normEstado(estadoTarget.estado);
    const accion = actual === "ACTIVO" ? "inactivar" : "activar";
    return `¿Deseas ${accion} la unidad ejecutora ${estadoTarget.codigo} - ${estadoTarget.nombre}?`;
  }, [estadoTarget]);

  const goOerAer = (r: UnidadEjecutoraRow) => {
    navigate(`/planeamiento/pdrc-oer-aer/ue/${r.idUnidadEjecutora}`);
  };

  const goActividadOperativa = (r: UnidadEjecutoraRow) => {
    navigate(`/poi/oei-aei-ao/ue/${r.idUnidadEjecutora}`);
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        p: { xs: 1.5, md: 2.75 },
        background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
      }}
    >
      {/* Header premium */}
      <Box sx={{ mb: 2.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.4} sx={{ minWidth: 0 }}>
            <Tooltip title="Volver">
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,.92)",
                  border: "1px solid rgba(148,163,184,.28)",
                  boxShadow: "0 12px 28px rgba(15,23,42,.08)",
                  color: "primary.main",
                  "&:hover": { bgcolor: "rgba(239,246,255,.95)", transform: "translateY(-1px)" },
                  transition: "all .15s ease",
                }}
              >
                <ArrowBackRoundedIcon />
              </IconButton>
            </Tooltip>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.4,
                    display: { xs: "none", sm: "grid" },
                    placeItems: "center",
                    background: "linear-gradient(135deg, rgba(37,99,235,.14), rgba(124,58,237,.10))",
                    color: "primary.main",
                    border: "1px solid rgba(37,99,235,.18)",
                  }}
                >
                  <ApartmentRoundedIcon />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.8, lineHeight: 1.05 }}>
                  POI: Unidades Ejecutoras
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700, mt: 0.35 }}>
                Lista y edición de unidades ejecutoras para la gestión del POI.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={`${rows.length} UE`}
              size="small"
              sx={{
                fontWeight: 950,
                color: "primary.main",
                bgcolor: "rgba(37,99,235,.08)",
                border: "1px solid rgba(37,99,235,.24)",
              }}
            />
            <Chip
              label={`${filtered.length} registros`}
              size="small"
              sx={{
                fontWeight: 950,
                bgcolor: "#fff",
                border: "1px solid rgba(15,23,42,.16)",
                boxShadow: "0 8px 18px rgba(15,23,42,.06)",
              }}
            />
            <Tooltip title="Refrescar">
              <IconButton
                onClick={() => void load()}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2.3,
                  bgcolor: "#fff",
                  border: "1px solid rgba(148,163,184,.30)",
                  boxShadow: "0 10px 22px rgba(15,23,42,.07)",
                  "&:hover": { bgcolor: "rgba(239,246,255,.95)", transform: "translateY(-1px)" },
                  transition: "all .15s ease",
                }}
              >
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {/* Filtros premium */}
      <Paper
        sx={{
          mb: 2.25,
          borderRadius: 3.2,
          p: { xs: 1.5, md: 2 },
          border: "1px solid rgba(148,163,184,.26)",
          background: "rgba(255,255,255,.98)",
          boxShadow: "0 16px 38px rgba(15,23,42,.055)",
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2.2,
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              bgcolor: "rgba(37,99,235,.10)",
            }}
          >
            <FilterAltRoundedIcon />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1.1 }}>Filtros de búsqueda</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              Ajuste el contexto para consultar las unidades ejecutoras y sus accesos POI.
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 190px auto" }, gap: 1.25 }}>
          <TextField
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar por código, nombre, tipo o pliego..."
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.2,
                bgcolor: "#fff",
                fontWeight: 700,
              },
            }}
          />

          <TextField
            select
            size="small"
            label="Estado"
            value={estadoFilter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setEstadoFilter(e.target.value as EstadoFilter);
              setPage(0);
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.2,
                bgcolor: "#fff",
                fontWeight: 800,
              },
            }}
          >
            <MenuItem value="TODOS">TODOS</MenuItem>
            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
            <MenuItem value="INACTIVO">INACTIVO</MenuItem>
          </TextField>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1.4 }}>
          <Chip
            icon={<BadgeRoundedIcon sx={{ fontSize: 16 }} />}
            label={q.trim() ? `Búsqueda: ${q.trim()}` : "Sin búsqueda activa"}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 850, bgcolor: "rgba(255,255,255,.8)" }}
          />
          <Chip
            label={`Estado: ${estadoFilter}`}
            size="small"
            sx={{
              fontWeight: 900,
              color: estadoFilter === "ACTIVO" ? "success.main" : estadoFilter === "INACTIVO" ? "warning.main" : "text.primary",
              bgcolor:
                estadoFilter === "ACTIVO"
                  ? "rgba(46,125,50,.08)"
                  : estadoFilter === "INACTIVO"
                  ? "rgba(237,108,2,.08)"
                  : "rgba(15,23,42,.04)",
              border: "1px solid rgba(148,163,184,.26)",
            }}
          />
        </Stack>
      </Paper>

      <Paper
        sx={{
          borderRadius: 3.2,
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,.24)",
          background: "rgba(255,255,255,.96)",
          boxShadow: "0 18px 42px rgba(15,23,42,.06)",
        }}
      >
        {loading ? <LinearProgress /> : null}

        <Box sx={{ p: { xs: 1.5, md: 2 }, pb: 1.2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.2,
                  display: "grid",
                  placeItems: "center",
                  color: "primary.main",
                  bgcolor: "rgba(37,99,235,.10)",
                }}
              >
                <BusinessRoundedIcon />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 950, fontSize: 18, lineHeight: 1.15 }}>
                  Unidades Ejecutoras registradas
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  Use los accesos rápidos para consultar OER/AER, actividades operativas, detalle, edición o estado.
                </Typography>
              </Box>
            </Stack>
            <Chip
              label={`${filtered.length} registros`}
              size="small"
              sx={{ fontWeight: 950, bgcolor: "rgba(37,99,235,.08)", color: "primary.main" }}
            />
          </Stack>
        </Box>

        <Divider />

        {error ? (
          <Box sx={{ p: 2 }}>
            <Typography sx={{ color: "error.main", fontWeight: 900 }}>{error}</Typography>
          </Box>
        ) : null}

        <TableContainer>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 950,
                    color: "#0f172a",
                    bgcolor: "rgba(248,250,252,.96)",
                    borderBottom: "1px solid rgba(148,163,184,.28)",
                    py: 1.25,
                  },
                }}
              >
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Pliego</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acción</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paged.map((r) => (
                <TableRow
                  key={r.idUnidadEjecutora}
                  hover
                  sx={{
                    "& td": { py: 1.15, borderColor: "rgba(148,163,184,.18)" },
                    "&:hover": { bgcolor: "rgba(239,246,255,.55)" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 950, color: "#0f172a" }}>{r.codigo}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 850, color: "#111827" }}>{r.nombre}</Typography>
                  </TableCell>
                  <TableCell>{r.tipo ?? "—"}</TableCell>
                  <TableCell>{r.idPliego ?? "—"}</TableCell>
                  <TableCell>
                    <Box sx={pillSx(r.estado)}>{normEstado(r.estado).toUpperCase()}</Box>
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={0.45} justifyContent="flex-end" alignItems="center">
                      <Tooltip title="Actividad Operativa">
                        <IconButton
                          size="small"
                          onClick={() => goActividadOperativa(r)}
                          sx={actionBtnSx("blue")}
                        >
                          <FactCheckRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="OER/AER (PDRC)">
                        <IconButton
                          size="small"
                          onClick={() => goOerAer(r)}
                          sx={actionBtnSx("violet")}
                        >
                          <HubRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => onView(r)} sx={rowCrudIconSx("view")}>
                          <ManageSearchRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => onEdit(r)} sx={rowCrudIconSx("edit")}>
                          <DriveFileRenameOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={normEstado(r.estado) === "ACTIVO" ? "Inactivar" : "Activar"}>
                        <IconButton
                          size="small"
                          onClick={() => onConfirmEstado(r)}
                          sx={rowCrudIconSx(normEstado(r.estado) === "ACTIVO" ? "danger" : "success")}
                        >
                          <PowerSettingsNewRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {!loading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 5, textAlign: "center" }}>
                    <Typography sx={{ color: "text.secondary", fontWeight: 900 }}>
                      No hay registros para mostrar.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rpp}
          onRowsPerPageChange={(e) => {
            setRpp(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* ===== Dialog Ver ===== */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Detalle de Unidad Ejecutora
          <IconButton onClick={() => setOpenView(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <LabelValue label="Código" value={viewRow?.codigo} />
            <LabelValue label="Estado" value={<Box sx={pillSx(viewRow?.estado)}>{normEstado(viewRow?.estado)}</Box>} />
            <LabelValue label="Nombre" value={viewRow?.nombre} />
            <LabelValue label="Tipo" value={viewRow?.tipo} />
            <LabelValue label="Pliego" value={viewRow?.idPliego} />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Editar/Crear ===== */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {isCreate ? "Nueva Unidad Ejecutora" : "Editar Unidad Ejecutora"}
          <IconButton onClick={() => setOpenEdit(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {saveError ? (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ color: "error.main", fontWeight: 900 }}>{saveError}</Typography>
            </Box>
          ) : null}

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.25 }}>
            <TextField label="Código" value={form.codigo} onChange={(e) => patchForm("codigo", e.target.value)} fullWidth />
            <TextField label="Nombre" value={form.nombre} onChange={(e) => patchForm("nombre", e.target.value)} fullWidth />
            <TextField label="Tipo" value={form.tipo} onChange={(e) => patchForm("tipo", e.target.value)} fullWidth />
            <TextField label="Pliego" value={form.idPliego} onChange={(e) => patchForm("idPliego", e.target.value)} fullWidth placeholder="(opcional)" />
            <TextField label="Estado" select value={form.estado} onChange={(e) => patchForm("estado", e.target.value as Estado)} fullWidth>
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void save()} disabled={saving || !canSave}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Dialog Estado ===== */}
      <Dialog open={openEstado} onClose={() => setOpenEstado(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 950, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Confirmar
          <IconButton onClick={() => setOpenEstado(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {estadoError ? (
            <Typography sx={{ color: "error.main", fontWeight: 900, mb: 1 }}>{estadoError}</Typography>
          ) : null}
          <Typography sx={{ fontWeight: 800 }}>{estadoConfirmText}</Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenEstado(false)} disabled={estadoSaving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void doCambiarEstado()} disabled={estadoSaving}>
            {estadoSaving ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
