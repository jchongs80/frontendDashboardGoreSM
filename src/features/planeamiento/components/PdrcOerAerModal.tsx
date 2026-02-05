// src/features/planeamiento/components/PdrcOerAerModal.tsx
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
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import {
  PdrcOeAeAction,
  type PdrcAccionUnidadListDto,
  type PdrcObjetivoUnidadListDto,
} from "../PdrcOeAeAction";

type SnackSeverity = "success" | "info" | "warning" | "error";
type SnackState = { open: boolean; msg: string; sev: SnackSeverity };

type Props = {
  open: boolean;
  idUnidad: number; // responsables_objetivos.id_unidad
  unidadLabel?: string;
  onClose: () => void;

  /**
   * ✅ Nuevo: Aplicar en memoria (sin backend).
   * El padre actualiza la tabla principal con el payload.
   */
  onApply?: (payload: { idObjetivo: number; idsAccion: number[] }) => void;

  /**
   * Compatibilidad: si aún lo tienes en la página, no rompe.
   * (Idealmente ya NO se usa)
   */
  onSuccess?: () => void;
};

function errorMsg(e: unknown, fallback: string): string {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string" && e.trim().length) return e;
  return fallback;
}

function cloneSet(src: Set<number>): Set<number> {
  return new Set<number>(Array.from(src.values()));
}

export default function PdrcOerAerModal({
  open,
  idUnidad,
  unidadLabel,
  onClose,
  onApply,
  onSuccess,
}: Props) {
  const [loadingOer, setLoadingOer] = useState(false);
  const [loadingAer, setLoadingAer] = useState(false);

  const [oer, setOer] = useState<PdrcObjetivoUnidadListDto[]>([]);
  const [acciones, setAcciones] = useState<PdrcAccionUnidadListDto[]>([]);
  const [oerSelected, setOerSelected] = useState<PdrcObjetivoUnidadListDto | null>(null);

  const [filterOer, setFilterOer] = useState("");

  // selección visible actual
  const [selectedAcciones, setSelectedAcciones] = useState<Set<number>>(new Set());

  // ✅ memoria por objetivo: idObjetivo -> Set<idAccion>
  const [selectedByObjetivo, setSelectedByObjetivo] = useState<Record<number, Set<number>>>({});

  // ✅ para requisito (1): “Seleccionar todo” NO se marca automático
  const [selectAllTouched, setSelectAllTouched] = useState<Set<number>>(new Set());

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

  const accionesSeleccionables = useMemo(
    () => acciones.filter((a) => !a.asignadaAOtraUnidad),
    [acciones]
  );

  const isAllChecked = useMemo(() => {
    if (accionesSeleccionables.length === 0) return false;
    return accionesSeleccionables.every((a) => selectedAcciones.has(a.idAccion));
  }, [accionesSeleccionables, selectedAcciones]);

  const isIndeterminate = useMemo(() => {
    if (accionesSeleccionables.length === 0) return false;
    const checkedCount = accionesSeleccionables.filter((a) => selectedAcciones.has(a.idAccion)).length;
    return checkedCount > 0 && checkedCount < accionesSeleccionables.length;
  }, [accionesSeleccionables, selectedAcciones]);

  const currentObjetivoId = oerSelected?.idObjetivo ?? 0;
  const headerTouchedForCurrent = useMemo(() => {
    if (!currentObjetivoId) return false;
    return selectAllTouched.has(currentObjetivoId);
  }, [selectAllTouched, currentObjetivoId]);

  // ✅ Cargar OER al abrir modal (manteniendo el estilo original)
  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoadingOer(true);
      try {
        setFilterOer("");
        setOerSelected(null);
        setAcciones([]);
        setSelectedAcciones(new Set());

        // ✅ IMPORTANTE: NO borramos selectedByObjetivo para mantener memoria aunque cierres el modal
        // setSelectedByObjetivo({});  <-- ya NO
        // setSelectAllTouched(new Set()); <-- opcional: lo mantenemos por memoria también

        const list = await PdrcOeAeAction.getObjetivosByUnidad(idUnidad, false);
        setOer(list ?? []);
      } catch (e: unknown) {
        setOer([]);
        setSnack({ open: true, msg: errorMsg(e, "No se pudo cargar los OER."), sev: "error" });
      } finally {
        setLoadingOer(false);
      }
    })();
  }, [open, idUnidad]);

  const persistSelection = (idObjetivo: number, next: Set<number>) => {
    setSelectedByObjetivo((prev) => ({ ...prev, [idObjetivo]: cloneSet(next) }));
  };

  const loadAcciones = async (idObjetivo: number) => {
    setLoadingAer(true);
    try {
      setAcciones([]);

      const list = await PdrcOeAeAction.getAccionesByUnidadObjetivo(idUnidad, idObjetivo, false);
      const safeList = list ?? [];
      setAcciones(safeList);

      // ✅ Recuperar selección del objetivo desde memoria
      setSelectedByObjetivo((prev) => {
        const exists = prev[idObjetivo];
        if (exists) {
          setSelectedAcciones(cloneSet(exists));
          return prev;
        }

        // Si es primera vez, inicializamos con las que ya están asignadas a la unidad (comportamiento original)
        const initial = new Set<number>();
        for (const a of safeList) {
          if (a.asignadaAUnidad) initial.add(a.idAccion);
        }

        setSelectedAcciones(cloneSet(initial));
        return { ...prev, [idObjetivo]: initial };
      });

      // ✅ requisito (1): NO marcamos touched aquí
    } catch (e: unknown) {
      setAcciones([]);
      setSelectedAcciones(new Set());
      setSnack({ open: true, msg: errorMsg(e, "No se pudo cargar las AER."), sev: "error" });
    } finally {
      setLoadingAer(false);
    }
  };

  const handleSelectOer = (row: PdrcObjetivoUnidadListDto) => {
    setOerSelected(row);
    void loadAcciones(row.idObjetivo);
  };

  const toggleAccion = (idAccion: number) => {
    if (!oerSelected) return;

    setSelectedAcciones((prev) => {
      const next = new Set(prev);
      if (next.has(idAccion)) next.delete(idAccion);
      else next.add(idAccion);

      persistSelection(oerSelected.idObjetivo, next);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!oerSelected) return;

    // ✅ desde aquí recién se “habilita” el check del header
    setSelectAllTouched((prev) => {
      const n = new Set(prev);
      n.add(oerSelected.idObjetivo);
      return n;
    });

    setSelectedAcciones((prev) => {
      const next = new Set(prev);

      if (isAllChecked) accionesSeleccionables.forEach((a) => next.delete(a.idAccion));
      else accionesSeleccionables.forEach((a) => next.add(a.idAccion));

      persistSelection(oerSelected.idObjetivo, next);
      return next;
    });
  };

  // ✅ AGREGAR: SOLO EN MEMORIA (NO backend)
  const handleAgregar = () => {
    if (!oerSelected) {
      setSnack({ open: true, msg: "Selecciona un OER.", sev: "warning" });
      return;
    }

    const idsAccion = Array.from(selectedAcciones.values());
    if (idsAccion.length === 0) {
      setSnack({ open: true, msg: "Selecciona al menos una AER.", sev: "warning" });
      return;
    }

    // ✅ Construir payload y entregar al padre
    onApply?.({ idObjetivo: oerSelected.idObjetivo, idsAccion });

    // Compatibilidad (idealmente ya no lo uses)
    // onSuccess?.();

    onClose();
  };

  return (
    <>
      {/* ✅ Layout/estilo como tu modal original (2da captura) */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pr: 6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                OBJETIVO ESTRATÉGICOS REGIONALES / UNIDAD ORG. SELECCIONADA
              </Typography>
              {unidadLabel ? (
                <Typography variant="body2" color="text.secondary">
                  {unidadLabel}
                </Typography>
              ) : null}
            </Box>

            <IconButton onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {/* FILTRO */}
          <Box sx={{ mb: 2 }}>
            <TextField
              value={filterOer}
              onChange={(e) => setFilterOer(e.target.value)}
              label="FILTRAR OBJETIVO"
              size="small"
              fullWidth
            />
          </Box>

          {/* TABLA OER */}
          <Box sx={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 1, bgcolor: "rgba(0,0,0,0.03)" }}>
              <Typography fontWeight={800}>OBJETIVOS ESTRATÉGICOS REGIONALES (OER)</Typography>
            </Box>

            {loadingOer ? (
              <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 140, fontWeight: 800 }}>CÓDIGO</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>DESCRIPCIÓN / ENUNCIADO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {oerFiltered.map((x) => {
                    const selected = oerSelected?.idObjetivo === x.idObjetivo;
                    return (
                      <TableRow
                        key={x.idObjetivo}
                        hover
                        onClick={() => handleSelectOer(x)}
                        sx={{
                          cursor: "pointer",
                          bgcolor: selected ? "rgba(25,118,210,0.12)" : "inherit",
                        }}
                      >
                        <TableCell>{x.codigo}</TableCell>
                        <TableCell>{x.enunciado}</TableCell>
                      </TableRow>
                    );
                  })}

                  {oerFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" color="text.secondary">
                          No hay objetivos para mostrar.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* TABLA AER */}
          <Box sx={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ p: 1, bgcolor: "rgba(0,0,0,0.03)" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography fontWeight={800}>
                  ACCIONES ESTRATÉGICAS REGIONALES {oerSelected ? `/ ${oerSelected.codigo}` : ""}
                </Typography>

                <Tooltip title="Seleccionar todo (solo acciones disponibles)">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      SELECCIONAR TODO
                    </Typography>

                    <Checkbox
                      size="small"
                      disabled={!oerSelected || accionesSeleccionables.length === 0}
                      checked={headerTouchedForCurrent ? isAllChecked : false}
                      indeterminate={headerTouchedForCurrent ? isIndeterminate : false}
                      onChange={toggleSelectAll}
                    />
                  </Box>
                </Tooltip>
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
                    <TableCell sx={{ width: 140, fontWeight: 800 }}>CÓDIGO</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>DESCRIPCIÓN / ENUNCIADO</TableCell>
                    <TableCell sx={{ width: 120, fontWeight: 800 }}>SELECCIÓN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {acciones.map((a) => {
                    const disabled = a.asignadaAOtraUnidad;
                    const checked = selectedAcciones.has(a.idAccion);
                    const hint = disabled
                      ? `Asignada a otra unidad (id=${a.idUnidadActual ?? "?"})`
                      : a.asignadaAUnidad
                      ? "Ya asignada a esta unidad"
                      : "Disponible";

                    return (
                      <TableRow key={a.idAccion} hover>
                        <TableCell>{a.codigo}</TableCell>
                        <TableCell>
                          <Stack direction="row" gap={1} alignItems="center">
                            <Typography variant="body2">{a.enunciado}</Typography>
                            {disabled ? (
                              <Typography variant="caption" color="error">
                                (bloqueada)
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={hint}>
                            <span>
                              <Checkbox
                                size="small"
                                disabled={disabled}
                                checked={checked}
                                onChange={() => toggleAccion(a.idAccion)}
                              />
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>CANCELAR</Button>
          <Button variant="contained" onClick={handleAgregar}>
            AGREGAR
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
