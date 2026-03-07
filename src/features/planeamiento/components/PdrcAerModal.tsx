import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { PdrcOeAeAction, type PdrcAccionUnidadListDto } from "../PdrcOeAeAction";

type SnackSeverity = "success" | "info" | "warning" | "error";
type SnackState = { open: boolean; msg: string; sev: SnackSeverity };

type OerPrefill = {
  idObjetivo: number;
  codigo: string;
  enunciado: string;
};

type Props = {
  open: boolean;
  idUe: number;
  idCc: number;
  idPoiAnio: number;
  unidadLabel?: string;
  oer?: OerPrefill | null;
  onClose: () => void;
  onSaved?: () => void;
};

function toMsg(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string") return e;
  return fallback;
}

function cloneSet(src: Set<number>): Set<number> {
  return new Set<number>(Array.from(src.values()));
}

function isAsignadaAUnidad(a: PdrcAccionUnidadListDto): boolean {
  return Boolean(a.asignadaAUnidad ?? a.yaAsignada);
}

export default function PdrcAerModal({
  open,
  idUe,
  idCc,
  idPoiAnio,
  unidadLabel,
  oer,
  onClose,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [acciones, setAcciones] = useState<PdrcAccionUnidadListDto[]>([]);
  const [selectedAcciones, setSelectedAcciones] = useState<Set<number>>(new Set());

  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<SnackState>({ open: false, msg: "", sev: "info" });

  const isAllChecked = useMemo(() => {
    if (acciones.length === 0) return false;
    return acciones.every((a) => selectedAcciones.has(a.idAccion));
  }, [acciones, selectedAcciones]);

  const isIndeterminate = useMemo(() => {
    if (acciones.length === 0) return false;
    const checkedCount = acciones.filter((a) => selectedAcciones.has(a.idAccion)).length;
    return checkedCount > 0 && checkedCount < acciones.length;
  }, [acciones, selectedAcciones]);

  const loadAcciones = async (idObjetivo: number) => {
    setLoading(true);
    try {
      const list = await PdrcOeAeAction.getAccionesByObjetivoPoi(idObjetivo, idUe, idCc, idPoiAnio, false);
      const safe = list ?? [];
      setAcciones(safe);

      const init = new Set<number>();
      for (const a of safe) if (isAsignadaAUnidad(a)) init.add(a.idAccion);
      setSelectedAcciones(init);
    } catch (e: unknown) {
      setAcciones([]);
      setSelectedAcciones(new Set());
      setSnack({ open: true, msg: toMsg(e, "No se pudo cargar las AER."), sev: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setAcciones([]);
    setSelectedAcciones(new Set());

    if (!idUe || !idCc || !idPoiAnio || !oer?.idObjetivo) return;
    void loadAcciones(oer.idObjetivo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idUe, idCc, idPoiAnio, oer?.idObjetivo]);

  const toggleAccion = (idAccion: number) => {
    setSelectedAcciones((prev) => {
      const next = cloneSet(prev);
      if (next.has(idAccion)) next.delete(idAccion);
      else next.add(idAccion);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedAcciones((prev) => {
      const next = cloneSet(prev);
      if (isAllChecked) acciones.forEach((a) => next.delete(a.idAccion));
      else acciones.forEach((a) => next.add(a.idAccion));
      return next;
    });
  };

  const handleGuardar = async () => {
    if (!oer?.idObjetivo) {
      setSnack({ open: true, msg: "No se detectó el OER de la fila.", sev: "warning" });
      return;
    }

    const idsAccion = Array.from(selectedAcciones.values());
    if (idsAccion.length === 0) {
      setSnack({ open: true, msg: "Selecciona al menos una AER.", sev: "warning" });
      return;
    }

    setSaving(true);
    try {
      await PdrcOeAeAction.asignarAccionesPoi(idUe, idCc, idPoiAnio, oer.idObjetivo, idsAccion);
      setSnack({ open: true, msg: "AER asignadas correctamente.", sev: "success" });
      onSaved?.();
      onClose();
    } catch (e: unknown) {
      setSnack({ open: true, msg: toMsg(e, "No se pudo guardar la asignación."), sev: "error" });
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
                {oer ? (
                  <>
                    <b>{oer.codigo}:</b> {oer.enunciado}
                  </>
                ) : (
                  "Selecciona una fila para cargar su OER."
                )}
              </Typography>
            </Box>

            <IconButton onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {!oer?.idObjetivo ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No se recibió el OER de la fila. Cierra y vuelve a intentar.
            </Alert>
          ) : loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2">Cargando AER…</Typography>
            </Stack>
          ) : acciones.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No hay AER disponibles para este OER.
            </Alert>
          ) : (
            <Box sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(0,0,0,0.12)" }}>
              <Box sx={{ p: 1, bgcolor: "rgba(0,0,0,0.03)" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={900}>ACCIONES (AER)</Typography>

                  <Tooltip title="Seleccionar todo">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        SELECCIONAR TODO
                      </Typography>
                      <Checkbox
                        size="small"
                        checked={isAllChecked}
                        indeterminate={isIndeterminate}
                        onChange={toggleSelectAll}
                      />
                    </Box>
                  </Tooltip>
                </Stack>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 900, width: 56 }}>
                      ✓
                    </TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 120 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Enunciado</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 150 }} align="center">
                      Estado
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {acciones.map((a) => {
                    const assigned = isAsignadaAUnidad(a);
                    const checked = selectedAcciones.has(a.idAccion);

                    return (
                      <TableRow key={a.idAccion} hover>
                        <TableCell align="center">
                          <Checkbox size="small" checked={checked} onChange={() => toggleAccion(a.idAccion)} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 900 }}>{a.codigo}</TableCell>
                        <TableCell>{a.enunciado}</TableCell>
                        <TableCell align="center">
                          {assigned ? (
                            <Typography variant="caption" color="success.main" fontWeight={900}>
                              YA ASIGNADA
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary" fontWeight={900}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving} sx={{ borderRadius: 2 }}>
            CANCELAR
          </Button>
          <Button
            onClick={handleGuardar}
            variant="contained"
            disabled={saving || !oer?.idObjetivo}
            sx={{ borderRadius: 2, fontWeight: 900 }}
          >
            {saving ? "GUARDANDO..." : "GUARDAR"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.sev} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}