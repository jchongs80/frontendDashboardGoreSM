import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export type PickerColumnDef<T> = {
  key: keyof T | string;
  header: string;
  width?: number;
  render?: (row: T) => any;
};

type Props<T> = {
  open: boolean;
  title: string;
  subtitle?: string;
  rows: T[];
  columns: PickerColumnDef<T>[];
  getRowId: (row: T) => number | string;
  searchKeys: (keyof T | string)[];
  onClose: () => void;
  onSelect: (row: T) => void;
};

export default function EntityPickerDialog<T>({
  open,
  title,
  subtitle,
  rows,
  columns,
  getRowId,
  searchKeys,
  onClose,
  onSelect,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) => {
      for (const k of searchKeys) {
        const v = (r as any)[k as any];
        if (v === null || v === undefined) continue;
        if (String(v).toLowerCase().includes(term)) return true;
      }
      return false;
    });
  }, [q, rows, searchKeys]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleClose = () => {
    setQ("");
    setPage(0);
    setRowsPerPage(10);
    onClose();
  };

  const handleSelect = (r: T) => {
    onSelect(r);
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" PaperProps={{ sx: { overflow: "visible" } }}>
      <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
          {subtitle ? (
            <Typography sx={{ mt: 0.25, fontSize: 12.5, color: "text.secondary", fontWeight: 700 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
          <TextField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar… (código, nombre, etc.)"
            fullWidth
            size="small"
          />
          <Button onClick={() => setQ("")}>Limpiar</Button>
        </Box>

        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((c) => (
                  <TableCell key={String(c.key)} sx={{ fontWeight: 900, width: c.width }}>
                    {c.header}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 120 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((r) => (
                <TableRow key={String(getRowId(r))} hover>
                  {columns.map((c) => (
                    <TableCell key={String(c.key)}>
                      {c.render ? c.render(r) : String((r as any)[c.key] ?? "")}
                    </TableCell>
                  ))}
                  <TableCell align="right">
                    <Button variant="contained" size="small" onClick={() => handleSelect(r)}>
                      Elegir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Typography color="text.secondary">Sin resultados.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
