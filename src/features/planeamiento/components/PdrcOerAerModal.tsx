import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  PdrcOeAeAction,
  type PdrcAccionUnidadListDto,
  type PdrcOerListDto,
} from "../PdrcOeAeAction";

type SnackSeverity = "success" | "info" | "warning" | "error";
type SnackState = { open: boolean; msg: string; sev: SnackSeverity };

type Props = {
  open: boolean;
  idUe: number;
  idCc: number;
  idPoiAnio: number;
  unidadLabel?: string;
  onClose: () => void;
  onSaved?: () => void;
};

function errorMsg(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message || fallback;
  return fallback;
}

function cloneSet(src: Set<number>): Set<number> {
  return new Set<number>(Array.from(src.values()));
}

function isAsignadaAUnidad(a: PdrcAccionUnidadListDto): boolean {
  return Boolean(a.asignadaAUnidad ?? a.yaAsignada);
}

export default function PdrcOerAerModal({
  open,
  idUe,
  idCc,
  idPoiAnio,
  unidadLabel,
  onClose,
  onSaved,
}: Props) {
  const [loadingOer, setLoadingOer] = useState(false);
  const [loadingAer, setLoadingAer] = useState(false);

  const [oer, setOer] = useState<PdrcOerListDto[]>([]);
  const [acciones, setAcciones] = useState<PdrcAccionUnidadListDto[]>([]);
  const [oerSelected, setOerSelected] = useState<PdrcOerListDto | null>(null);

  const [filterOer, setFilterOer] = useState("");
  const [selectedAcciones, setSelectedAcciones] = useState<Set<number>>(new Set());

  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ open: false, msg: "", sev: "info" });

  const oerFiltered = useMemo(() => {
    const f = filterOer.trim().toLowerCase();
    if (!f) return oer;
    return oer.filter(
      (x) =>
        (x.codigo ?? "").toLowerCase().includes(f) ||
        (x.enunciado ?? "").toLowerCase().includes(f)
    );
  }, [oer, filterOer]);


  useEffect(() => {
    if (!open) return;

    if (!idUe || !idCc || !idPoiAnio) {
      setOer([]);
      setAcciones([]);
      setOerSelected(null);
      setSelectedAcciones(new Set());
      return;
    }

    (async () => {
      setLoadingOer(true);
      try {
        setFilterOer("");
        setOerSelected(null);
        setAcciones([]);
        setSelectedAcciones(new Set());

        const list = await PdrcOeAeAction.getObjetivosByUeCc(idUe, idCc, idPoiAnio);
        setOer(list ?? []);
      } catch (e: unknown) {
        setOer([]);
        setSnack({ open: true, msg: errorMsg(e, "No se pudo cargar los OER."), sev: "error" });
      } finally {
        setLoadingOer(false);
      }
    })();
  }, [open, idUe, idCc, idPoiAnio]);

  const loadAcciones = async (idObjetivo: number) => {
    setLoadingAer(true);
    try {
      setAcciones([]);
      const list = await PdrcOeAeAction.getAccionesByObjetivoPoi(idObjetivo, idUe, idCc, idPoiAnio, false);

      const safe = list ?? [];
      setAcciones(safe);

      // Inicializa selección con lo ya asignado (Año + UE + CC)
      const init = new Set<number>();
      for (const a of safe) if (isAsignadaAUnidad(a)) init.add(a.idAccion);
      setSelectedAcciones(init);
    } catch (e: unknown) {
      setAcciones([]);
      setSelectedAcciones(new Set());
      setSnack({ open: true, msg: errorMsg(e, "No se pudo cargar las AER."), sev: "error" });
    } finally {
      setLoadingAer(false);
    }
  };

  // ✅ 1) NO hay botón “VER AER”: al seleccionar OER se carga la tabla inferior
  const handleSelectOer = (row: PdrcOerListDto) => {
    setOerSelected(row);
    void loadAcciones(row.idObjetivo);
  };

  const toggleAccion = (idAccion: number) => {
    setSelectedAcciones((prev) => {
      const next = cloneSet(prev);
      if (next.has(idAccion)) next.delete(idAccion);
      else next.add(idAccion);
      return next;
    });
  };


  const handleAgregar = async () => {
    if (!oerSelected) {
      setSnack({ open: true, msg: "Selecciona un OER.", sev: "warning" });
      return;
    }

    const idsAccion = Array.from(selectedAcciones.values());
    if (idsAccion.length === 0) {
      setSnack({ open: true, msg: "Selecciona al menos una AER.", sev: "warning" });
      return;
    }

    setSaving(true);
    try {
      await PdrcOeAeAction.asignarAccionesPoi(idUe, idCc, idPoiAnio, oerSelected.idObjetivo, idsAccion);
      setSnack({ open: true, msg: "Asignación guardada correctamente.", sev: "success" });
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      setSnack({ open: true, msg: errorMsg(e, "No se pudo guardar la asignación."), sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pr: 6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="h6" fontWeight={900}>
                ACCIONES ESTRATÉGICAS REGIONALES / {unidadLabel ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Asignación persistente (BD) para UE + Centro de Costo + Año.
              </Typography>
            </Box>

            <IconButton onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <TextField
              value={filterOer}
              onChange={(e) => setFilterOer(e.target.value)}
              label="FILTRAR OER"
              size="small"
              fullWidth
            />
          </Box>

          {/* OER */}
          <Box sx={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 1, bgcolor: "rgba(0,0,0,0.03)" }}>
              <Typography fontWeight={900}>OBJETIVOS (OER)</Typography>
            </Box>

            {loadingOer ? (
              <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 110 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Enunciado</TableCell>
                    {/* ❌ ELIMINAR columna Acción */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {oerFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          No hay OER para mostrar.
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    oerFiltered.map((x) => {
                      const selected = oerSelected?.idObjetivo === x.idObjetivo;

                      return (
                        <TableRow
                          key={x.idObjetivo}
                          hover
                          selected={selected}
                          onClick={() => handleSelectOer(x)}     // ✅ click fila
                          sx={{ cursor: "pointer" }}             // ✅ UX
                        >
                          <TableCell sx={{ fontWeight: 900 }}>{x.codigo}</TableCell>
                          <TableCell>{x.enunciado}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* AER */}
          <Box sx={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 1, bgcolor: "rgba(0,0,0,0.03)" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography fontWeight={900}>
                  ACCIONES (AER) {oerSelected ? `/ ${oerSelected.codigo}` : ""}
                </Typography>

                
              </Stack>
            </Box>

            {!oerSelected ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="info">Selecciona un OER para cargar sus acciones.</Alert>
              </Box>
            ) : loadingAer ? (
              <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={24} />
              </Box>
            ) : acciones.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="info">No hay acciones para el OER seleccionado.</Alert>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 140, fontWeight: 900 }}>CÓDIGO</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>DESCRIPCIÓN / ENUNCIADO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {acciones.map((a) => {
                    const checked = selectedAcciones.has(a.idAccion);
                    const asignada = isAsignadaAUnidad(a);

                    return (
                      <TableRow
  key={a.idAccion}
  hover
  selected={checked}
  onClick={() => {
    if (!asignada) toggleAccion(a.idAccion); // ✅ no permitir desmarcar "YA ASIGNADA"
  }}
  sx={{
    cursor: asignada ? "default" : "pointer",
    "&.Mui-selected": {
      bgcolor: "rgba(59,130,246,.10) !important",
    },
    "&.Mui-selected:hover": {
      bgcolor: "rgba(59,130,246,.14) !important",
    },
  }}
>
  <TableCell sx={{ fontWeight: 800 }}>{a.codigo}</TableCell>
  <TableCell>{a.enunciado}</TableCell>

</TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "flex-end" }}>
        <Button
          onMouseDown={(e) => e.currentTarget.blur()}
          onClick={onClose}
          sx={{ fontWeight: 800, borderRadius: 2 }}
        >
          CERRAR
        </Button>
      </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.sev}
          variant="filled"
          onClose={() => setSnack((p) => ({ ...p, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}