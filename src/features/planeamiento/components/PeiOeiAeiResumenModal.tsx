import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
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

import type { PeiOeiAeiAoMasterDto } from "../PeiOeiAeiAOAction";

type Props = {
  open: boolean;
  onClose: () => void;

  // Datos ya cargados en la vista (master OEI/AEI)
  rows: PeiOeiAeiAoMasterDto[];

  // Para mostrar en el título / contexto
  ccRespLabel: string;
  ccLabel: string;
  anioLabel: string;
};

export default function PeiOeiAeiResumenModal({
  open,
  onClose,
  rows,
  ccRespLabel,
  ccLabel,
  anioLabel,
}: Props) {
  const [qOei, setQOei] = useState("");
  const [qAei, setQAei] = useState("");

  const groupedOei = useMemo(() => {
    const map = new Map<
      number,
      { idOei: number; codigo: string; enunciado: string; aeis: PeiOeiAeiAoMasterDto[] }
    >();

    (rows ?? []).forEach((r) => {
      if (!map.has(r.idOei)) {
        map.set(r.idOei, { idOei: r.idOei, codigo: r.oeiCodigo, enunciado: r.oeiEnunciado, aeis: [] });
      }
      map.get(r.idOei)!.aeis.push(r);
    });

    return Array.from(map.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [rows]);

  const oeiFiltered = useMemo(() => {
    const q = qOei.trim().toLowerCase();
    if (!q) return groupedOei;
    return groupedOei.filter((o) => `${o.codigo} ${o.enunciado}`.toLowerCase().includes(q));
  }, [groupedOei, qOei]);

  const [selectedOeiId, setSelectedOeiId] = useState<number>(0);

  const selectedOei = useMemo(
    () => oeiFiltered.find((x) => x.idOei === selectedOeiId) ?? null,
    [oeiFiltered, selectedOeiId]
  );

  const aeiList = useMemo(() => {
    const base = selectedOei?.aeis ?? [];
    const q = qAei.trim().toLowerCase();
    if (!q) return base;
    return base.filter((a) => `${a.aeiCodigo} ${a.aeiEnunciado}`.toLowerCase().includes(q));
  }, [selectedOei, qAei]);

  // Cuando cambia la lista (por filtros externos), selecciona el primero si el actual ya no existe
  React.useEffect(() => {
    if (!open) return;
    if (!oeiFiltered.length) {
      setSelectedOeiId(0);
      return;
    }
    if (selectedOeiId && oeiFiltered.some((x) => x.idOei === selectedOeiId)) return;
    setSelectedOeiId(oeiFiltered[0].idOei);
  }, [open, oeiFiltered, selectedOeiId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        OEI / AEI (Resumen) / {ccRespLabel}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 10, top: 10 }}
          aria-label="Cerrar"
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
          Año: {anioLabel} — Centro de costo: {ccLabel}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            value={qOei}
            onChange={(e) => setQOei(e.target.value)}
            placeholder="FILTRAR OEI"
            size="small"
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
          />

          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1, bgcolor: "rgba(0,0,0,.03)" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                OBJETIVOS (OEI)
              </Typography>
            </Box>

            {oeiFiltered.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No hay OEI para la combinación seleccionada.
                </Alert>
              </Box>
            ) : (
              <Table size="small" sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 140 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Enunciado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {oeiFiltered.map((o) => (
                    <TableRow
                      key={o.idOei}
                      hover
                      selected={o.idOei === selectedOeiId}
                      onClick={() => setSelectedOeiId(o.idOei)}
                      sx={{
                        cursor: "pointer",
                        "&.Mui-selected": { bgcolor: "rgba(59,130,246,.10) !important" },
                        "&.Mui-selected:hover": { bgcolor: "rgba(59,130,246,.14) !important" },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 900 }}>{o.codigo}</TableCell>
                      <TableCell>{o.enunciado}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>

          <Divider />

          <TextField
            value={qAei}
            onChange={(e) => setQAei(e.target.value)}
            placeholder="FILTRAR AEI"
            size="small"
            fullWidth
            disabled={!selectedOei}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
          />

          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1, bgcolor: "rgba(0,0,0,.03)" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                ACCIONES (AEI){selectedOei ? ` / ${selectedOei.codigo}` : ""}
              </Typography>
            </Box>

            {!selectedOei ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Selecciona un OEI para ver sus AEI.
                </Alert>
              </Box>
            ) : aeiList.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No hay AEI para el OEI seleccionado.
                </Alert>
              </Box>
            ) : (
              <Table size="small" sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 140 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Descripción / Enunciado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aeiList.map((a) => (
                    <TableRow key={a.idAei} hover>
                      <TableCell sx={{ fontWeight: 900 }}>{a.aeiCodigo}</TableCell>
                      <TableCell>{a.aeiEnunciado}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>

          <Stack direction="row" justifyContent="flex-end">
            <Typography
              variant="button"
              sx={{ color: "primary.main", cursor: "pointer", fontWeight: 900 }}
              onClick={onClose}
            >
              CERRAR
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}