import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import { PlaneamientoAction } from "../PlaneamientoAction";
import type { ObjetivoListDto, AccionListDto } from "../PlaneamientoAction";

export type OeiDto = {
  idObjetivo: number;
  codigo: string;
  enunciado: string;
};

export type AeiDto = {
  idAccion: number;
  idObjetivo: number;
  codigo: string;
  enunciado: string;
};

type SnackbarSeverity = "success" | "info" | "warning" | "error";
type Mode = "edit" | "view";

type Props = {
  open: boolean;
  onClose: () => void;

  /** ✅ AER seleccionado (acciones_estrategicas.id_accion) */
  idAer: number;

  /** ✅ Centro de costo seleccionado (poi_centros_costo.id_centro_costo) */
  idCc: number;

  oerCodigo?: string;
  oerEnunciado?: string;
  aerCodigo?: string;
  aerEnunciado?: string;
  
  titulo?: string;
  onSaved?: () => void;

  /** ✅ "edit" permite agregar/desasignar; "view" solo lectura */
  mode?: Mode;

  /** Snackbar (opcional). Si no se pasa, usa console.log */
  notify?: (message: string, severity?: SnackbarSeverity) => void;
};

export default function PeiOeiAeiModal({
  open,
  onClose,
  idAer,
  idCc,
  oerCodigo,
  oerEnunciado,
  aerCodigo,
  aerEnunciado,
  titulo,
  onSaved,
  mode = "view",
  notify,
}: Props) {
  const readOnly = mode === "view";

  const notifySafe = (message: string, severity: SnackbarSeverity = "info") => {
    if (notify) notify(message, severity);
    else console.log(`[${severity}] ${message}`);
  };

  const [loadingOei, setLoadingOei] = useState(false);
  const [loadingAei, setLoadingAei] = useState(false);

  const [oeiList, setOeiList] = useState<OeiDto[]>([]);
  const [aeiList, setAeiList] = useState<AeiDto[]>([]);

  const [filterOei, setFilterOei] = useState("");
  const [filterAei, setFilterAei] = useState("");

  const [selectedOeiId, setSelectedOeiId] = useState<number>(0);

  const oeiFiltered = useMemo(() => {
    const q = filterOei.trim().toLowerCase();
    if (!q) return oeiList;
    return oeiList.filter(
      (x) =>
        (x.codigo ?? "").toLowerCase().includes(q) ||
        (x.enunciado ?? "").toLowerCase().includes(q)
    );
  }, [oeiList, filterOei]);

  const aeiFiltered = useMemo(() => {
    const q = filterAei.trim().toLowerCase();
    if (!q) return aeiList;
    return aeiList.filter(
      (x) =>
        (x.codigo ?? "").toLowerCase().includes(q) ||
        (x.enunciado ?? "").toLowerCase().includes(q)
    );
  }, [aeiList, filterAei]);

  const selectedOei = useMemo(
    () => oeiList.find((o) => o.idObjetivo === selectedOeiId) ?? null,
    [oeiList, selectedOeiId]
  );

  async function loadOeiByAer() {
    if (!idAer) {
      setOeiList([]);
      setAeiList([]);
      setSelectedOeiId(0);
      return;
    }

    setLoadingOei(true);
    try {
      const oei = await PlaneamientoAction.getOeiPeiByAer(idAer);
      const mapped: OeiDto[] = (oei ?? []).map((x: ObjetivoListDto) => ({
        idObjetivo: x.idObjetivo,
        codigo: x.codigo,
        enunciado: x.enunciado,
      }));

      setOeiList(mapped);

      const first = mapped[0]?.idObjetivo ?? 0;
      setSelectedOeiId(first);

      if (first) await loadAeiByOeiCc(first);
      else setAeiList([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo cargar OEI.";
      notifySafe(msg, "error");
      setOeiList([]);
      setAeiList([]);
      setSelectedOeiId(0);
    } finally {
      setLoadingOei(false);
    }
  }

  async function loadAeiByOeiCc(idOei: number) {
    if (!idOei || !idCc) {
      setAeiList([]);
      return;
    }

    setLoadingAei(true);
    try {
      const aei = await PlaneamientoAction.getAeiPeiByOeiCc(idOei, idCc);
      const mapped: AeiDto[] = (aei ?? []).map((x: AccionListDto) => ({
        idAccion: x.idAccion,
        idObjetivo: idOei,
        codigo: x.codigo,
        enunciado: x.enunciado,
      }));

      
      setAeiList(mapped);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo cargar AEI.";
      notifySafe(msg, "error");
      setAeiList([]);
    } finally {
      setLoadingAei(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    setFilterOei("");
    setFilterAei("");
    setOeiList([]);
    setAeiList([]);
    setSelectedOeiId(0);

    void loadOeiByAer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idAer, idCc]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 7 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography fontWeight={900}>
              {titulo ?? (readOnly ? "VER OEI - AEI ASIGNADAS" : "AGREGAR OEI - AEI")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {readOnly
                ? "Modo lectura: visualiza OEI y AEI según el AER seleccionado (sin Id_Instrumento)."
                : "Modo edición: visualiza OEI y AEI según el AER seleccionado (sin Id_Instrumento)."}
            </Typography>
            {(oerCodigo || aerCodigo) && (
              <Box sx={{ mt: 1, p: 1.25, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "rgba(0,0,0,.02)" }}>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {oerCodigo ? `OER: ${oerCodigo}` : "OER: —"}{" "}
                  {aerCodigo ? ` / AER: ${aerCodigo}` : ""}
                </Typography>

                {(oerEnunciado || aerEnunciado) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {oerEnunciado ? `${oerEnunciado}` : ""}
                    {oerEnunciado && aerEnunciado ? " — " : ""}
                    {aerEnunciado ? `${aerEnunciado}` : ""}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton onClick={() => void loadOeiByAer()} aria-label="refresh">
              <RefreshRoundedIcon />
            </IconButton>
            <IconButton onClick={onClose} aria-label="close">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          value={filterOei}
          onChange={(e) => setFilterOei(e.target.value)}
          label="FILTRAR OEI"
          size="small"
          fullWidth
        />

        <Box sx={{ mt: 2, border: "1px solid rgba(0,0,0,.12)", borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ p: 1, bgcolor: "rgba(0,0,0,.03)" }}>
            <Typography fontWeight={900}>OBJETIVOS (OEI) - PEI</Typography>
          </Box>

          {loadingOei ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2">Cargando OEI...</Typography>
            </Box>
          ) : oeiFiltered.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No hay OEI para mostrar.
              </Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 140 }}>CÓDIGO</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>DESCRIPCIÓN / ENUNCIADO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {oeiFiltered.map((o) => {
                    const selected = o.idObjetivo === selectedOeiId;
                    return (
                      <TableRow
                        key={o.idObjetivo}
                        hover
                        selected={selected}
                        onClick={() => {
                          setSelectedOeiId(o.idObjetivo);
                          void loadAeiByOeiCc(o.idObjetivo);
                        }}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell sx={{ fontWeight: 900 }}>{o.codigo}</TableCell>
                        <TableCell>{o.enunciado}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <TextField
            value={filterAei}
            onChange={(e) => setFilterAei(e.target.value)}
            label="FILTRAR AEI"
            size="small"
            fullWidth
          />
          <Box sx={{ width: 12 }} />
          {!readOnly && (
            <Tooltip title="Seleccionar todo">
              <Checkbox disabled />
            </Tooltip>
          )}
        </Stack>

        <Box sx={{ mt: 1, border: "1px solid rgba(0,0,0,.12)", borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ p: 1, bgcolor: "rgba(0,0,0,.03)" }}>
            <Typography fontWeight={900}>
              ACCIONES (AEI){selectedOei ? ` / ${selectedOei.codigo}` : ""}
            </Typography>
          </Box>

          {!selectedOeiId ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Selecciona un OEI para ver sus AEI.
              </Alert>
            </Box>
          ) : loadingAei ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2">Cargando AEI...</Typography>
            </Box>
          ) : aeiFiltered.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No hay AEI para el OEI seleccionado (y Centro de Costo).
              </Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 140 }}>CÓDIGO</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>DESCRIPCIÓN / ENUNCIADO</TableCell>
                    {!readOnly && <TableCell sx={{ fontWeight: 900, width: 120 }}>SELECCIÓN</TableCell>}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {aeiFiltered.map((a) => (
                    <TableRow key={a.idAccion} hover>
                      <TableCell sx={{ fontWeight: 900 }}>{a.codigo}</TableCell>
                      <TableCell>{a.enunciado}</TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Checkbox disabled />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 800 }}>
          CERRAR
        </Button>

        {!readOnly && (
          <Button
            variant="contained"
            onClick={() => onClose()}
            sx={{ fontWeight: 900, borderRadius: 2 }}
          >
            CERRAR
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}