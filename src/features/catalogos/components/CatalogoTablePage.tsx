import { useEffect, useMemo, useState } from "react";
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

type Order = "asc" | "desc";

export type ColumnDef<T> = {
  key: string;
  header: string;
  width?: number | string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
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

  // acciones
  allowEdit?: boolean;
  onView: (row: T) => void;
  onEdit?: (row: T) => void;

  onNew?: () => void;
  newLabel?: string;
  hideNew?: boolean;

};

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
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [orderBy, setOrderBy] = useState<string>(columns[0]?.key ?? "");
  const [order, setOrder] = useState<Order>("asc");

  useEffect(() => setPage(0), [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) =>
      searchKeys.some((k) => {
        const v = (r as any)[k];
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!orderBy) return filtered;
    const copy = [...filtered];

    copy.sort((a: any, b: any) => {
      const av = a[orderBy];
      const bv = b[orderBy];

      const as = av == null ? "" : String(av).toLowerCase();
      const bs = bv == null ? "" : String(bv).toLowerCase();

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
            onChange={(e) => setQuery(e.target.value)}
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

          {/* ✅ AQUÍ va tu botón */}
          {!hideNew && onNew && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={onNew}
            >
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

          <Chip
            label={`${filtered.length} registros`}
            variant="outlined"
            sx={{ borderRadius: 999 }}
          />


          

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
                <TableCell sx={{ fontWeight: 900, bgcolor: "#FAFBFD", width: 120 }}>
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
                    key={getRowId(row)}
                    hover
                    sx={{ "& td": { borderBottom: "1px solid #F0F3F8" } }}
                  >
                    {columns.map((c) => (
                      <TableCell key={c.key}>
                        {c.render ? c.render(row) : (row as any)[c.key]}
                      </TableCell>
                    ))}

                    <TableCell>
                      <Tooltip title="Ver">
                        <IconButton size="small" onClick={() => onView(row)}>
                          <VisibilityRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip
                        title={
                          allowEdit ? "Editar" : "Solo lectura (backend sin endpoint PUT)"
                        }
                      >
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