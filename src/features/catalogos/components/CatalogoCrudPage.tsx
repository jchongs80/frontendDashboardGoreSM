import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

export type CatalogoFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "boolean"
  | "estado"
  | "color";

export type CatalogoOption = {
  value: string | number | boolean | null;
  label: string;
};

export type CatalogoColumn<TRow extends object> = {
  key: keyof TRow & string;
  label: string;
  width?: number | string;
  align?: "left" | "center" | "right";
  render?: (row: TRow) => ReactNode;
};

export type CatalogoField = {
  key: string;
  label: string;
  type?: CatalogoFieldType;
  required?: boolean;
  disabled?: boolean;
  grid?: number;
  options?: CatalogoOption[];
};

type CatalogoCrudPageProps<TRow extends object, TPayload extends object> = {
  title: string;
  subtitle?: string;
  rows: TRow[];
  loading: boolean;
  error?: string | null;
  columns: CatalogoColumn<TRow>[];
  fields: CatalogoField[];
  idKey: keyof TRow & string;
  searchKeys: Array<keyof TRow & string>;
  initialPayload: TPayload;
  onLoad: () => Promise<void> | void;
  onCreate: (payload: TPayload) => Promise<unknown> | unknown;
  onUpdate: (id: number, payload: TPayload) => Promise<unknown> | unknown;
  toPayload?: (form: TPayload) => TPayload;
};

type DialogMode = "new" | "edit" | "detail";
type EstadoFiltro = "TODOS" | "ACTIVO" | "INACTIVO";

const cardBorder = "1px solid rgba(148,163,184,.28)";
const softShadow = "0 18px 40px rgba(15,23,42,.08)";

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function readRowId<TRow extends object>(row: TRow, idKey: keyof TRow & string): number {
  const raw = (row as Record<string, unknown>)[idKey];
  const id = Number(raw);
  return Number.isFinite(id) ? id : 0;
}

function valueToInput(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean" || typeof value === "number") return value;
  return String(value);
}

function valueToDateInput(value: unknown): string {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 10) : "";
}

function getEstadoText(value: unknown): "ACTIVO" | "INACTIVO" {
  if (typeof value === "boolean") return value ? "ACTIVO" : "INACTIVO";
  const text = String(value ?? "").trim().toUpperCase();
  return text === "INACTIVO" || text === "FALSE" || text === "0" ? "INACTIVO" : "ACTIVO";
}

function getRecordLabel(row: Record<string, unknown> | null): string {
  if (!row) return "Complete la información solicitada";
  return String(row.nombre ?? row.descripcion ?? row.codigo ?? "Registro seleccionado");
}

export function EstadoChip({ value }: { value: string | boolean | null | undefined }) {
  const active = getEstadoText(value) === "ACTIVO";

  return (
    <Chip
      size="small"
      label={active ? "ACTIVO" : "INACTIVO"}
      sx={{
        minWidth: 78,
        height: 22,
        fontSize: 11,
        fontWeight: 900,
        borderRadius: 999,
        color: active ? "#166534" : "#991b1b",
        bgcolor: active ? "#f0fdf4" : "#fff1f2",
        border: `1px solid ${active ? "#86efac" : "#fecaca"}`,
      }}
    />
  );
}

export default function CatalogoCrudPage<
  TRow extends object,
  TPayload extends object
>({
  title,
  subtitle,
  rows,
  loading,
  error,
  columns,
  fields,
  idKey,
  searchKeys,
  initialPayload,
  onLoad,
  onCreate,
  onUpdate,
  toPayload,
}: CatalogoCrudPageProps<TRow, TPayload>) {
  const [query, setQuery] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("TODOS");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("new");
  const [selectedRow, setSelectedRow] = useState<TRow | null>(null);
  const [form, setForm] = useState<TPayload>(initialPayload);
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    void onLoad();
  }, [onLoad]);

  useEffect(() => {
    setPage(0);
  }, [query, estadoFiltro, rows.length]);

  const hasEstadoColumn = useMemo(
    () => columns.some((column: CatalogoColumn<TRow>) => column.key === "estado"),
    [columns]
  );

  const activeCount = useMemo(
    () => rows.filter((row: TRow) => getEstadoText((row as Record<string, unknown>).estado) === "ACTIVO").length,
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = normalizeText(query);

    return rows.filter((row: TRow) => {
      const rowAsRecord = row as Record<string, unknown>;
      const matchesQuery = !q || searchKeys.some((key: keyof TRow & string) => normalizeText(rowAsRecord[key]).includes(q));
      const matchesEstado = !hasEstadoColumn || estadoFiltro === "TODOS" || getEstadoText(rowAsRecord.estado) === estadoFiltro;
      return matchesQuery && matchesEstado;
    });
  }, [query, rows, searchKeys, estadoFiltro, hasEstadoColumn]);

  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const titleByMode: Record<DialogMode, string> = {
    new: "Nuevo registro",
    edit: "Editar registro",
    detail: "Detalle del registro",
  };

  const modeText: Record<DialogMode, string> = {
    new: "Complete los datos del catálogo.",
    edit: "Actualice únicamente los campos necesarios.",
    detail: "Consulta de información registrada.",
  };

  const openNew = () => {
    setDialogMode("new");
    setSelectedRow(null);
    setForm(initialPayload);
    setLocalError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: TRow) => {
    setDialogMode("edit");
    setSelectedRow(row);
    setForm({ ...initialPayload, ...(row as unknown as TPayload) });
    setLocalError(null);
    setDialogOpen(true);
  };

  const openDetail = (row: TRow) => {
    setDialogMode("detail");
    setSelectedRow(row);
    setForm({ ...initialPayload, ...(row as unknown as TPayload) });
    setLocalError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setSelectedRow(null);
    setLocalError(null);
  };

  const handleChange = (key: string, value: unknown) => {
    setForm((prev: TPayload) => ({ ...(prev as Record<string, unknown>), [key]: value } as TPayload));
  };

  const validateRequired = (): string | null => {
    const missing = fields.find((field: CatalogoField) => {
      if (!field.required) return false;
      const value = (form as Record<string, unknown>)[field.key];
      return value === null || value === undefined || String(value).trim() === "" || Number(value) === 0;
    });

    return missing ? `Debe ingresar/seleccionar: ${missing.label}` : null;
  };

  const save = async () => {
    const validationMessage = validateRequired();
    if (validationMessage) {
      setLocalError(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setLocalError(null);
      const payload = toPayload ? toPayload(form) : form;

      if (dialogMode === "new") {
        await onCreate(payload);
      } else if (selectedRow) {
        await onUpdate(readRowId(selectedRow, idKey), payload);
      }

      setDialogOpen(false);
      await onLoad();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "No se pudo guardar el registro");
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: "#f8fafc",
      fontWeight: 800,
      "& fieldset": { borderColor: "#cbd5e1" },
      "&:hover fieldset": { borderColor: "#60a5fa" },
      "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 1.5 },
      "&.Mui-disabled": { bgcolor: "#f1f5f9" },
    },
    "& .MuiInputLabel-root": {
      color: "#64748b",
      fontSize: 12,
      fontWeight: 900,
    },
    "& .MuiInputBase-input": {
      color: "#0f172a",
      fontSize: 13,
      fontWeight: 800,
    },
  };

  const renderField = (field: CatalogoField) => {
    const disabled = dialogMode === "detail" || field.disabled;
    const type = field.type ?? "text";
    const value = (form as Record<string, unknown>)[field.key];

    if (type === "select") {
      return (
        <TextField
          select
          fullWidth
          size="small"
          label={field.label}
          value={valueToInput(value)}
          required={field.required}
          disabled={disabled}
          onChange={(e) => handleChange(field.key, e.target.value)}
          sx={fieldSx}
        >
          <MenuItem value="">— Seleccione —</MenuItem>
          {(field.options ?? []).map((option: CatalogoOption) => (
            <MenuItem key={`${field.key}-${String(option.value)}`} value={option.value as string | number}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (type === "boolean") {
      return (
        <TextField
          select
          fullWidth
          size="small"
          label={field.label}
          value={String(Boolean(value))}
          required={field.required}
          disabled={disabled}
          onChange={(e) => handleChange(field.key, e.target.value === "true")}
          sx={fieldSx}
        >
          <MenuItem value="true">ACTIVO</MenuItem>
          <MenuItem value="false">INACTIVO</MenuItem>
        </TextField>
      );
    }

    if (type === "estado") {
      return (
        <TextField
          select
          fullWidth
          size="small"
          label={field.label}
          value={String(value ?? "ACTIVO")}
          required={field.required}
          disabled={disabled}
          onChange={(e) => handleChange(field.key, e.target.value)}
          sx={fieldSx}
        >
          <MenuItem value="ACTIVO">ACTIVO</MenuItem>
          <MenuItem value="INACTIVO">INACTIVO</MenuItem>
        </TextField>
      );
    }

    return (
      <TextField
        fullWidth
        size="small"
        label={field.label}
        type={type === "date" ? "date" : type === "color" ? "color" : type === "number" ? "number" : "text"}
        value={type === "date" ? valueToDateInput(value) : valueToInput(value)}
        required={field.required}
        disabled={disabled}
        multiline={type === "textarea"}
        minRows={type === "textarea" ? 2 : undefined}
        InputLabelProps={type === "date" || type === "color" ? { shrink: true } : undefined}
        onChange={(e) => handleChange(field.key, e.target.value)}
        sx={fieldSx}
      />
    );
  };

  const getDialogGridSize = (field: CatalogoField): number => {
    if (field.type === "textarea" || field.grid === 12) return 12;
    if ((field.grid ?? 6) >= 8) return 12;
    return 6;
  };

  const selectedRecord = selectedRow as Record<string, unknown> | null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: { xs: 2, md: 2.5 },
        bgcolor: "#f8fafc",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 1.8 }}>
        <Stack direction="row" alignItems="center" gap={1.2}>
          <IconButton
            size="small"
            onClick={() => window.history.back()}
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              bgcolor: "#ffffff",
              border: "1px solid #dbeafe",
              color: "#2563eb",
              boxShadow: "0 8px 20px rgba(37,99,235,.10)",
              "&:hover": { bgcolor: "#eff6ff" },
            }}
          >
            <KeyboardArrowLeftRoundedIcon />
          </IconButton>

          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "#e0f2fe",
              border: "1px solid #bfdbfe",
              color: "#2563eb",
            }}
          >
            <Inventory2OutlinedIcon fontSize="small" />
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 950, color: "#020617", letterSpacing: -0.7, lineHeight: 1.1 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography sx={{ mt: 0.25, color: "#64748b", fontSize: 12.5, fontWeight: 700 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            size="small"
            label={`${activeCount} activos`}
            sx={{ bgcolor: "#e0f2fe", color: "#2563eb", border: "1px solid #bfdbfe", fontWeight: 950 }}
          />
          <Chip
            size="small"
            label={`${rows.length} registros`}
            sx={{ bgcolor: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", fontWeight: 950 }}
          />
          <Tooltip title="Actualizar">
            <span>
              <IconButton
                size="small"
                onClick={() => void onLoad()}
                disabled={loading}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                <RefreshRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 1.4,
          mb: 2,
          borderRadius: 3,
          border: cardBorder,
          bgcolor: "#ffffff",
          boxShadow: "0 14px 35px rgba(15,23,42,.05)",
        }}
      >
        <Stack direction="row" alignItems="flex-start" gap={1.2} sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              bgcolor: "#eff6ff",
              color: "#2563eb",
            }}
          >
            <FilterAltRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 950, color: "#0f172a", lineHeight: 1.1 }}>
              Filtros de búsqueda
            </Typography>
            <Typography sx={{ color: "#64748b", fontSize: 11.5, fontWeight: 700 }}>
              Ajuste el contexto para consultar y mantener los registros del catálogo.
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            size="small"
            placeholder="Buscar por ID, código, nombre o descripción..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "#ffffff",
                height: 36,
                "& fieldset": { borderColor: "#cbd5e1" },
              },
              "& .MuiInputBase-input": { fontSize: 13, fontWeight: 700 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
          />

          {hasEstadoColumn ? (
            <TextField
              select
              size="small"
              label="Estado"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value as EstadoFiltro)}
              sx={{
                minWidth: { xs: "100%", md: 150 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  height: 36,
                  fontWeight: 900,
                  bgcolor: "#ffffff",
                  "& fieldset": { borderColor: "#cbd5e1" },
                },
                "& .MuiInputLabel-root": { fontSize: 12, fontWeight: 900 },
                "& .MuiInputBase-input": { fontSize: 12, fontWeight: 900 },
              }}
            >
              <MenuItem value="TODOS">TODOS</MenuItem>
              <MenuItem value="ACTIVO">ACTIVO</MenuItem>
              <MenuItem value="INACTIVO">INACTIVO</MenuItem>
            </TextField>
          ) : null}

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openNew}
            sx={{
              height: 36,
              borderRadius: 2,
              px: 2,
              fontSize: 12,
              fontWeight: 950,
              bgcolor: "#2563eb",
              boxShadow: "0 10px 22px rgba(37,99,235,.22)",
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
          >
            Nuevo
          </Button>
        </Stack>

        <Stack direction="row" spacing={0.8} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            label={query.trim() ? `Búsqueda: ${query.trim()}` : "Sin búsqueda activa"}
            sx={{ height: 22, fontSize: 11, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", fontWeight: 850 }}
          />
          {hasEstadoColumn ? (
            <Chip
              size="small"
              label={`Estado: ${estadoFiltro}`}
              sx={{ height: 22, fontSize: 11, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", fontWeight: 850 }}
            />
          ) : null}
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: cardBorder,
          overflow: "hidden",
          bgcolor: "#ffffff",
          boxShadow: softShadow,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.4, py: 1.15 }} gap={2}>
          <Stack direction="row" alignItems="center" gap={1.1}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: "#eff6ff",
                color: "#2563eb",
              }}
            >
              <TuneRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 950, color: "#0f172a", lineHeight: 1.1 }}>
                Registros del catálogo
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: 11.5, fontWeight: 700 }}>
                Use las acciones rápidas para consultar, editar o registrar información.
              </Typography>
            </Box>
          </Stack>

          <Chip
            size="small"
            label={`${filteredRows.length} registros`}
            sx={{ bgcolor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", fontWeight: 950 }}
          />
        </Stack>

        <Divider />

        {error ? <Alert severity="error" sx={{ m: 2 }}>{error}</Alert> : null}

        <TableContainer sx={{ maxHeight: "calc(100vh - 355px)", minHeight: 360 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((column: CatalogoColumn<TRow>) => (
                  <TableCell
                    key={column.key}
                    align={column.align ?? "left"}
                    sx={{
                      width: column.width,
                      bgcolor: "#f8fafc",
                      color: "#0f172a",
                      fontWeight: 950,
                      fontSize: 11.5,
                      borderBottom: "1px solid #cbd5e1",
                      py: 1.1,
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell
                  align="center"
                  sx={{
                    width: 116,
                    bgcolor: "#f8fafc",
                    color: "#0f172a",
                    fontWeight: 950,
                    fontSize: 11.5,
                    borderBottom: "1px solid #cbd5e1",
                    py: 1.1,
                  }}
                >
                  Acción
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                    <Typography sx={{ mt: 1, color: "#64748b", fontWeight: 800 }}>Cargando información...</Typography>
                  </TableCell>
                </TableRow>
              ) : visibleRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ color: "#64748b", fontWeight: 900 }}>No se encontraron registros.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                visibleRows.map((row: TRow, index: number) => (
                  <TableRow
                    key={`${readRowId(row, idKey)}-${index}`}
                    hover
                    sx={{
                      "& .MuiTableCell-root": {
                        borderBottom: "1px solid #e2e8f0",
                      },
                      "&:hover .MuiTableCell-root": {
                        bgcolor: "#f8fbff",
                      },
                    }}
                  >
                    {columns.map((column: CatalogoColumn<TRow>) => (
                      <TableCell
                        key={column.key}
                        align={column.align ?? "left"}
                        sx={{ py: 1.05, color: "#0f172a", fontSize: 12, fontWeight: 750 }}
                      >
                        {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "—")}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Ver detalle">
                        <IconButton
                          size="small"
                          onClick={() => openDetail(row)}
                          sx={{
                            width: 28,
                            height: 28,
                            mr: 0.5,
                            color: "#2563eb",
                            bgcolor: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            "&:hover": { bgcolor: "#dbeafe" },
                          }}
                        >
                          <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => openEdit(row)}
                          sx={{
                            width: 28,
                            height: 28,
                            color: "#7c3aed",
                            bgcolor: "#f5f3ff",
                            border: "1px solid #ddd6fe",
                            "&:hover": { bgcolor: "#ede9fe" },
                          }}
                        >
                          <EditRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, newPage: number) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Rows per page:"
          sx={{
            borderTop: "1px solid #e2e8f0",
            "& .MuiTablePagination-toolbar": { minHeight: 42 },
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
              fontSize: 12,
              fontWeight: 800,
              color: "#0f172a",
            },
          }}
        />
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            width: "min(860px, calc(100vw - 32px))",
            borderRadius: 3.5,
            overflow: "hidden",
            boxShadow: "0 28px 70px rgba(15,23,42,.22)",
            border: "1px solid rgba(219,234,254,.95)",
          },
        }}
      >
        <Box
          sx={{
            px: 2.4,
            py: 1.45,
            borderBottom: "1px solid #dbeafe",
            bgcolor: "#ffffff",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" gap={1.25}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: dialogMode === "detail" ? "#f0fdf4" : "#eff6ff",
                  color: dialogMode === "detail" ? "#16a34a" : "#2563eb",
                  border: `1px solid ${dialogMode === "detail" ? "#bbf7d0" : "#bfdbfe"}`,
                }}
              >
                {dialogMode === "detail" ? <InfoOutlinedIcon fontSize="small" /> : <EditRoundedIcon fontSize="small" />}
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" sx={{ fontWeight: 950, color: "#0f172a", lineHeight: 1.15 }}>
                    {titleByMode[dialogMode]}
                  </Typography>
                  <Chip
                    size="small"
                    label={dialogMode === "new" ? "NUEVO" : dialogMode === "edit" ? "EDICIÓN" : "DETALLE"}
                    sx={{
                      height: 22,
                      fontSize: 11,
                      fontWeight: 950,
                      bgcolor: dialogMode === "detail" ? "#f0fdf4" : "#eff6ff",
                      color: dialogMode === "detail" ? "#15803d" : "#2563eb",
                      border: `1px solid ${dialogMode === "detail" ? "#bbf7d0" : "#bfdbfe"}`,
                    }}
                  />
                </Stack>
                <Typography sx={{ color: "#64748b", fontSize: 12, fontWeight: 750 }}>
                  {modeText[dialogMode]}
                </Typography>
              </Box>
            </Stack>

            <IconButton onClick={closeDialog} disabled={saving} sx={{ color: "#475569" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ p: 2.2, bgcolor: "#f8fafc", maxHeight: "calc(100vh - 190px)", overflowY: "auto" }}>
          {localError ? <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{localError}</Alert> : null}

          <Paper
            elevation={0}
            sx={{
              p: 1.8,
              mb: 1.6,
              borderRadius: 3,
              border: "1px solid #bfdbfe",
              bgcolor: "#ffffff",
              background: "linear-gradient(135deg, rgba(239,246,255,.90), rgba(255,255,255,1))",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#e0f2fe",
                    border: "1px solid #bfdbfe",
                    color: "#2563eb",
                    flex: "0 0 auto",
                  }}
                >
                  <Inventory2OutlinedIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 900 }}>
                    ID REGISTRO
                  </Typography>
                  <Typography sx={{ color: "#0f172a", fontWeight: 950 }}>
                    {dialogMode === "new" ? "Nuevo" : selectedRow ? readRowId(selectedRow, idKey) : "—"}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{ borderLeft: { md: "1px solid #cbd5e1" }, pl: { md: 2.4 } }}>
                <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 900 }}>
                  REGISTRO DEL CATÁLOGO
                </Typography>
                <Typography sx={{ color: "#0f172a", fontWeight: 950, fontSize: 13.5 }}>
                  {dialogMode === "new" ? title : getRecordLabel(selectedRecord)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 1.8,
              borderRadius: 3,
              border: "1px solid #bfdbfe",
              bgcolor: "#ffffff",
              boxShadow: "0 10px 25px rgba(37,99,235,.05)",
            }}
          >
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.6 }}>
              <TuneRoundedIcon fontSize="small" sx={{ color: "#2563eb" }} />
              <Box>
                <Typography sx={{ color: "#2563eb", fontWeight: 950, lineHeight: 1.1 }}>
                  Información editable
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: 11.5, fontWeight: 750 }}>
                  Estos campos permiten registrar o actualizar la información del catálogo.
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              {fields.map((field: CatalogoField) => (
                <Box
                  key={field.key}
                  sx={{
                    gridColumn: {
                      xs: "1 / -1",
                      sm: getDialogGridSize(field) === 12 ? "1 / -1" : "auto",
                    },
                  }}
                >
                  {renderField(field)}
                </Box>
              ))}
            </Box>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ px: 2.2, py: 1.35, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0", justifyContent: "flex-end", gap: 1 }}>
          {dialogMode !== "detail" ? (
            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              onClick={() => void save()}
              disabled={saving}
              sx={{
                borderRadius: 2,
                px: 2.5,
                height: 36,
                fontWeight: 950,
                bgcolor: "#2563eb",
                boxShadow: "0 10px 22px rgba(37,99,235,.22)",
                "&:hover": { bgcolor: "#1d4ed8" },
              }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          ) : null}
          <Button
            onClick={closeDialog}
            disabled={saving}
            variant="outlined"
            sx={{
              borderRadius: 2,
              px: 3.5,
              height: 36,
              fontWeight: 950,
              color: "#0f172a",
              borderColor: "#0f172a",
              "&:hover": { borderColor: "#0f172a", bgcolor: "#f8fafc" },
            }}
          >
            {dialogMode === "detail" ? "Cerrar" : "Cancelar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
