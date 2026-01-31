import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import type { ReactNode } from "react";

type Order = "asc" | "desc";

export type ColumnDef<T> = {
  key: string;
  header: string;
  width?: number | string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
};

type Props<T> = {
  title: string;
  subtitle?: string;
  rows: T[];
  loading: boolean;
  error?: string | null;
  columns: ColumnDef<T>[];
  getRowId: (row: T) => number | string;
  searchKeys: (keyof T)[];
  onRefresh: () => void;

  allowEdit?: boolean;
  onView: (row: T) => void;
  onEdit?: (row: T) => void;

  onNew?: () => void;
  newLabel?: string;
  hideNew?: boolean;

  // ✅ acciones adicionales por fila (ej: botón ⋮ con menú)
  renderRowActions?: (row: T) => ReactNode;
};

// --------- helpers sin any ----------
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getValue<T>(row: T, key: keyof T): unknown {
  if (!isRecord(row)) return undefined;
  return row[String(key)];
}

function toComparableString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.toLowerCase();
  if (typeof v === "number" || typeof v === "boolean") return String(v).toLowerCase();
  if (v instanceof Date) return v.toISOString().toLowerCase();
  try {
    return String(v).toLowerCase();
  } catch {
    return "";
  }
}

function toReactNode(v: unknown): ReactNode {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number") return v;
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (v instanceof Date) return v.toLocaleDateString();

  // Si es objeto/array, mejor algo controlado para no reventar UI
  if (typeof v === "object") {
    try {
      const json = JSON.stringify(v);
      // evita columnas enormes
      return json.length > 120 ? `${json.slice(0, 117)}...` : json;
    } catch {
      return "[objeto]";
    }
  }

  // fallback
  try {
    return String(v);
  } catch {
    return "";
  }
}

export default function CatalogoTablePage<T>({
  title,
  subtitle,
  rows,
  loading,
  error,
  columns,
  getRowId,
  searchKeys,
  onRefresh,
  allowEdit = true,
  onView,
  onEdit,
  onNew,
  newLabel,
  hideNew,
  renderRowActions,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [orderBy, setOrderBy] = useState<string>(columns[0]?.key ?? "");
  const [order, setOrder] = useState<Order>("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      searchKeys.some((k) => {
        const v = getValue(r, k);
        return toComparableString(v).includes(q);
      })
    );
  }, [rows, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!orderBy) return filtered;

    const copy = [...filtered];

    copy.sort((a, b) => {
      const av = isRecord(a) ? a[orderBy] : undefined;
      const bv = isRecord(b) ? b[orderBy] : undefined;

      const as = toComparableString(av);
      const bs = toComparableString(bv);

      if (as < bs) return order === "asc" ? -1 : 1;
      if (as > bs) return order === "asc" ? 1 : -1;
      return 0;
    });

    return copy;
  }, [filtered, orderBy, order]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const handleSort = (key: string) => {
    if (orderBy === key) {
      setOrder((p) => (p === "asc" ? "desc" : "asc"));
      return;
    }
    setOrderBy(key);
    setOrder("asc");
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{title}</Typography>
        {subtitle && (
          <Typography sx={{ color: "text.secondary", mt: 0.25 }}>{subtitle}</Typography>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #EEF2F7",
          overflow: "hidden",
        }}
      >
        <Toolbar sx={{ gap: 1.5, px: 2 }}>
          <TextField
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (page !== 0) setPage(0);
            }}
            size="small"
            placeholder="Buscar..."
            sx={{ width: { xs: "100%", sm: 420 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flex: 1 }} />

          {!hideNew && onNew && (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onNew}>
              {newLabel ?? "Nuevo"}
            </Button>
          )}

          <Tooltip title="Refrescar">
            <span>
              <IconButton onClick={onRefresh} disabled={loading}>
                <RefreshRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Chip label={`${filtered.length} registros`} variant="outlined" sx={{ borderRadius: 999 }} />
        </Toolbar>

        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell
                    key={c.key}
                    sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: c.width }}
                  >
                    {c.sortable ? (
                      <TableSortLabel
                        active={orderBy === c.key}
                        direction={orderBy === c.key ? order : "asc"}
                        onClick={() => handleSort(c.key)}
                      >
                        {c.header}
                      </TableSortLabel>
                    ) : (
                      c.header
                    )}
                  </TableCell>
                ))}
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 160 }}>
                  Acción
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                      <CircularProgress size={26} />
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Box sx={{ py: 3 }}>
                      <Typography sx={{ color: "error.main", fontWeight: 800 }}>
                        {error}
                      </Typography>
                      <Button onClick={onRefresh} sx={{ mt: 1 }} variant="contained">
                        Reintentar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading && !error && paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Box sx={{ py: 5, textAlign: "center" }}>
                      <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                        Sin resultados
                      </Typography>
                      <Typography sx={{ color: "text.secondary" }}>
                        Prueba cambiando el texto de búsqueda.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                paged.map((row) => (
                  <TableRow
                    key={String(getRowId(row))}
                    hover
                    sx={{ "& td": { borderBottom: "1px solid #F0F3F8" } }}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {c.render
                          ? c.render(row)
                          : toReactNode(isRecord(row) ? (row as Record<string, unknown>)[c.key] : undefined)}
                      </TableCell>
                    ))}

                    <TableCell>
                      <Tooltip title="Ver">
                        <IconButton size="small" onClick={() => onView(row)}>
                          <VisibilityRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={allowEdit ? "Editar" : "Solo lectura (backend sin endpoint PUT)"}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={!allowEdit || !onEdit}
                            onClick={() => onEdit?.(row)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {renderRowActions?.(row)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Box>
  );
}
