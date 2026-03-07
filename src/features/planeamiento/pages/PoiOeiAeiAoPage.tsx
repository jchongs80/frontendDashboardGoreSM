import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Snackbar,
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

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import { useNavigate, useParams } from "react-router-dom";

import PoiOeiAeiAoModal from "../components/PoiOeiAeiAoModal";
import { PoiOeiAeiAoAction } from "../PoiOeiAeiAoAction";
import type {
  PoiAoFiltrosDto,
  PoiCentroCostoDto,
  PoiOeiAeiAoListDto,
  PoiOeiAeiMasterDto,
  PoiOeiAeiHeaderDto,
} from "../PoiOeiAeiAoAction";

import { UnidadEjecutoraAction } from "../UnidadEjecutoraAction";
import type { UnidadEjecutoraDto } from "../UnidadEjecutoraAction";

function actionIconBtnSx(kind: "primary" | "info" | "error") {
  const palette =
    kind === "primary"
      ? { border: "rgba(59,130,246,.35)", bg: "rgba(59,130,246,.10)", hover: "rgba(59,130,246,.18)" }
      : kind === "info"
      ? { border: "rgba(14,165,233,.35)", bg: "rgba(14,165,233,.10)", hover: "rgba(14,165,233,.18)" }
      : { border: "rgba(239, 68, 68, .45)", bg: "rgba(239, 68, 68, .10)", hover: "rgba(239, 68, 68, .18)" };

  return {
    width: 32,
    height: 32,
    borderRadius: 2,
    border: "1px solid",
    borderColor: palette.border,
    bgcolor: palette.bg,
    "&:hover": { bgcolor: palette.hover, transform: "translateY(-1px)" },
    transition: "all .15s ease",
    boxShadow: "0 6px 16px rgba(0,0,0,.06)",
  } as const;
}

function detailContainerSx() {
  return {
    borderRadius: 2.5,
    border: "1px solid rgba(148,163,184,.45)",
    bgcolor: "#fff",
    overflow: "hidden",
    boxShadow: "0 10px 22px rgba(0,0,0,.06)",
  } as const;
}

function detailHeaderSx() {
  return {
    px: 1.5,
    py: 1.1,
    display: "flex",
    alignItems: "center",
    gap: 1,
    bgcolor: "rgba(59,130,246,.08)",
    borderBottom: "1px solid rgba(148,163,184,.35)",
  } as const;
}

export default function PoiOeiAeiAoPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { idUnidadEjecutora } = useParams();

  const idUe = useMemo(() => {
    const n = Number.parseInt(idUnidadEjecutora ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [idUnidadEjecutora]);

  const [loading, setLoading] = useState(true);
  const [loadingMaster, setLoadingMaster] = useState(false);

  const [ue, setUe] = useState<UnidadEjecutoraDto | null>(null);

  const [ccOpt, setCcOpt] = useState<PoiCentroCostoDto[]>([]);
  const [ccSel, setCcSel] = useState<PoiCentroCostoDto | null>(null);

  const filtrosAo: PoiAoFiltrosDto = useMemo(
    () => ({
      idCategoria: null,
      idProductoProyecto: null,
      idFuncion: null,
      idDivision: null,
      idGrupo: null,
      idActividadPresupuesto: null,
      nroRegistroPoi: null,
    }),
    []
  );

  const [master, setMaster] = useState<PoiOeiAeiMasterDto[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const [aoMap, setAoMap] = useState<Record<number, PoiOeiAeiAoListDto[]>>({});
  const [aoLoading, setAoLoading] = useState<Record<number, boolean>>({});

  // ✅ Header cache (OER + AER) por idOeiAei
  const [headerMap, setHeaderMap] = useState<Record<number, PoiOeiAeiHeaderDto>>({});

  const [openModal, setOpenModal] = useState(false);
  const [modalIdOeiAei, setModalIdOeiAei] = useState<number>(0);
  const [modalIdAo, setModalIdAo] = useState<number | null>(null);

  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  const loadUE = async () => {
    if (!idUe) return;
    try {
      const data = await UnidadEjecutoraAction.getById(idUe);
      setUe(data);
    } catch {
      setUe(null);
    }
  };

  const loadCC = async () => {
    if (!idUe) return;
    const data = await PoiOeiAeiAoAction.getCentrosCostoByUnidadEjecutora(idUe);
    setCcOpt(data);
    setCcSel(data.length ? data[0] : null);
  };

  const buscarMaster = async () => {
    if (!idUe) return;
    setLoadingMaster(true);
    try {
      const data = await PoiOeiAeiAoAction.getMasterOeiAei({
        idUnidadEjecutora: idUe,
        idCentroCosto: ccSel?.idCentroCosto ?? null,
      });
      setMaster(data);
      setExpanded({});
      setAoMap({});
      setHeaderMap({});
    } catch {
      setSnack({ open: true, message: "No se pudo cargar OEI/AEI.", severity: "error" });
    } finally {
      setLoadingMaster(false);
    }
  };

  const loadAo = async (idOeiAei: number) => {
    setAoLoading((p) => ({ ...p, [idOeiAei]: true }));
    try {
      const data = await PoiOeiAeiAoAction.getAoByOeiAei(idOeiAei, filtrosAo);
      setAoMap((p) => ({ ...p, [idOeiAei]: data }));
    } finally {
      setAoLoading((p) => ({ ...p, [idOeiAei]: false }));
    }
  };

  const loadHeader = async (idOeiAei: number) => {
    if (headerMap[idOeiAei]) return;
    try {
      const h = await PoiOeiAeiAoAction.getHeaderByOeiAei(idOeiAei);
      if (!h) return;
      setHeaderMap((p) => ({ ...p, [idOeiAei]: h }));
    } catch {
      // no romper UI
    }
  };

  const toggleExpand = async (idOeiAei: number) => {
    const next = !expanded[idOeiAei];
    setExpanded((p) => ({ ...p, [idOeiAei]: next }));
    if (next) {
      await Promise.all([loadAo(idOeiAei), loadHeader(idOeiAei)]);
    }
  };

  const openNuevoAo = (idOeiAei: number) => {
    setModalIdOeiAei(idOeiAei);
    setModalIdAo(null);
    setOpenModal(true);
  };

  const eliminarAo = async (idOeiAei: number, idOeiAeiAo: number) => {
    try {
      await PoiOeiAeiAoAction.eliminarAo(idOeiAeiAo);
      setSnack({ open: true, message: "AO eliminada.", severity: "success" });
      await loadAo(idOeiAei);
    } catch {
      setSnack({ open: true, message: "No se pudo eliminar la AO.", severity: "error" });
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadUE(), loadCC()]);
      } finally {
        setLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUe]);

  useEffect(() => {
    if (!loading && idUe && ccSel) {
      void buscarMaster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccSel?.idCentroCosto]);

  const totalMaster = master.length;

  if (!idUe) {
    return (
      <Box sx={{ p: 2.5 }}>
        <Alert severity="error">Parámetro inválido: idUnidadEjecutora.</Alert>
      </Box>
    );
  }

  const ueLabel = ue?.codigo && ue?.nombre ? `Unidad Ejecutora: ${ue.codigo} - ${ue.nombre}` : `Unidad Ejecutora: ${idUe}`;

  return (
    <Box sx={{ p: 2.5 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "1px solid rgba(148,163,184,.35)",
          background:
            "linear-gradient(135deg, rgba(59,130,246,.10) 0%, rgba(14,165,233,.08) 40%, rgba(99,102,241,.06) 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start">
            <IconButton onClick={() => navigate("/planeamiento/unidades-ejecutoras")} aria-label="Volver">
              <ArrowBackRoundedIcon />
            </IconButton>

            <Box>
              <Typography variant="h5" fontWeight={950} lineHeight={1.1}>
                POI – OEI/AEI / Actividades Operativas
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 700 }}>
                {ueLabel} · Filtra solo por Centro de Costo.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} justifyContent="flex-end" alignItems="center">
            <Chip
              label={`OEI/AEI: ${totalMaster}`}
              sx={{
                height: 32,
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: "rgba(59,130,246,.10)",
                border: "1px solid rgba(59,130,246,.25)",
                px: 0.75,
                "& .MuiChip-label": { px: 1.0 },
              }}
            />

            <Tooltip title="Refrescar">
              <span style={{ display: "inline-flex" }}>
                <IconButton onClick={() => void buscarMaster()} sx={actionIconBtnSx("info")} disabled={loading || loadingMaster}>
                  <RefreshRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<SearchRoundedIcon />}
              onClick={() => void buscarMaster()}
              disabled={loading || loadingMaster}
              sx={{ borderRadius: 2.25, px: 2.25, boxShadow: "0 16px 34px rgba(0,0,0,.14)" }}
            >
              {loadingMaster ? "BUSCANDO..." : "BUSCAR"}
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.25 }}>
          <Autocomplete
            options={ccOpt}
            value={ccSel}
            onChange={(_, v) => setCcSel(v)}
            getOptionLabel={(o) => `${o.codigo ?? ""} - ${o.nombre ?? ""}`}
            renderInput={(p) => <TextField {...p} label="Centro de Costo (por UE)" size="small" />}
          />
        </Box>
      </Paper>

      <Paper sx={{ mt: 2, borderRadius: 3, overflow: "hidden", boxShadow: "0 12px 28px rgba(0,0,0,.07)" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "rgba(2,6,23,.04)" }}>
                <TableCell sx={{ width: 52 }} />
                <TableCell sx={{ fontWeight: 950 }}>Código OEI</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Descripción OEI</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Código AEI</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Descripción AEI</TableCell>
                <TableCell sx={{ fontWeight: 950 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 950 }} align="right">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {master.map((m) => {
                const isOpen = !!expanded[m.idOeiAei];
                const aoRows = aoMap[m.idOeiAei] ?? [];
                const isAoLoading = !!aoLoading[m.idOeiAei];

                return (
                  <React.Fragment key={m.idOeiAei}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton size="small" onClick={() => void toggleExpand(m.idOeiAei)}>
                          {isOpen ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                        </IconButton>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900 }}>{m.codigoOei ?? "—"}</TableCell>
                      <TableCell>{m.descripcionOei ?? "—"}</TableCell>
                      <TableCell sx={{ fontWeight: 900 }}>{m.codigoAei ?? "—"}</TableCell>
                      <TableCell>{m.descripcionAei ?? "—"}</TableCell>

                      <TableCell>
                        <Chip
                          label={m.estado ? "ACTIVO" : "INACTIVO"}
                          size="small"
                          sx={{
                            fontWeight: 900,
                            bgcolor: m.estado ? "rgba(16,185,129,.10)" : "rgba(245,158,11,.10)",
                            border: "1px solid",
                            borderColor: m.estado ? "rgba(16,185,129,.25)" : "rgba(245,158,11,.25)",
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Agregar AO">
                          <IconButton sx={actionIconBtnSx("primary")} onClick={() => openNuevoAo(m.idOeiAei)}>
                            <AddRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Refrescar AO">
                          <span style={{ display: "inline-flex" }}>
                            <IconButton sx={actionIconBtnSx("info")} onClick={() => void loadAo(m.idOeiAei)} disabled={!isOpen}>
                              <RefreshRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, borderBottom: "0" }}>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: "rgba(2,6,23,.02)" }}>
                            <Box sx={detailContainerSx()}>
                              <Box sx={detailHeaderSx()}>
                                <Box sx={{ width: 4, height: 18, borderRadius: 99, bgcolor: "rgba(59,130,246,.75)" }} />

                                {/* ✅ Título + 2 filas OER/AER */}
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.15, minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>Detalle [ Actividad Operativa ]</Typography>

                                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, lineHeight: 1.2 }}>
                                    <b>OER:</b> {headerMap[m.idOeiAei]?.oerCodigo ?? "—"} — {headerMap[m.idOeiAei]?.oerEnunciado ?? "—"}
                                  </Typography>

                                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, lineHeight: 1.2 }}>
                                    <b>AER:</b> {headerMap[m.idOeiAei]?.aerCodigo ?? "—"} — {headerMap[m.idOeiAei]?.aerEnunciado ?? "—"}
                                  </Typography>
                                </Box>
                              </Box>

                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "rgba(59,130,246,.06)" }}>
                                    <TableCell sx={{ fontWeight: 950 }}>Nro. Registro POI</TableCell>
                                    <TableCell sx={{ fontWeight: 950 }}>Código</TableCell>
                                    <TableCell sx={{ fontWeight: 950 }}>Actividad Operativa</TableCell>
                                    <TableCell sx={{ fontWeight: 950 }} align="right">
                                      Acciones
                                    </TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {isAoLoading ? (
                                    <TableRow>
                                      <TableCell colSpan={4} sx={{ py: 2, color: "text.secondary", fontWeight: 800 }}>
                                        Cargando AO…
                                      </TableCell>
                                    </TableRow>
                                  ) : aoRows.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={4} sx={{ py: 2, color: "text.secondary", fontWeight: 800 }}>
                                        No hay registros.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    aoRows.map((r) => (
                                      <TableRow key={r.idOeiAeiAo} hover>
                                        <TableCell sx={{ fontWeight: 900 }}>{r.nroRegistroPoi}</TableCell>
                                        <TableCell sx={{ fontWeight: 900 }}>{r.codigoAo ?? "—"}</TableCell>
                                        <TableCell>{r.nombreActividadOperativa ?? "—"}</TableCell>

                                        <TableCell align="right">
                                          <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                                            <Tooltip title="Editar">
                                              <IconButton
                                                sx={actionIconBtnSx("info")}
                                                onClick={() => {
                                                  setModalIdOeiAei(m.idOeiAei);
                                                  setModalIdAo(r.idOeiAeiAo);
                                                  setOpenModal(true);
                                                }}
                                              >
                                                <EditRoundedIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Eliminar">
                                              <IconButton sx={actionIconBtnSx("error")} onClick={() => void eliminarAo(m.idOeiAei, r.idOeiAeiAo)}>
                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                              </IconButton>
                                            </Tooltip>
                                          </Stack>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}

              {!loadingMaster && master.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 4, textAlign: "center", color: "text.secondary", fontWeight: 900 }}>
                    No hay OEI/AEI para mostrar con el Centro de Costo seleccionado.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <PoiOeiAeiAoModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setModalIdAo(null);
        }}
        idOeiAei={modalIdOeiAei}
        idOeiAeiAo={modalIdAo}
        onSaved={async () => {
          await loadAo(modalIdOeiAei);
          setSnack({
            open: true,
            message: modalIdAo ? "AO actualizada." : "AO registrada.",
            severity: "success",
          });
          setModalIdAo(null);
        }}
      />

      <Snackbar open={snack.open} autoHideDuration={2800} onClose={() => setSnack((p) => ({ ...p, open: false }))}>
        <Alert severity={snack.severity} variant="filled" sx={{ fontWeight: 900 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
