// src/features/acuerdos/pages/AcuerdosGobernabilidadPoliticasResponsablesResultadosPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
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

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { CatalogoAction, type InstrumentoDto } from "../../catalogos/CatalogoAction";

import {
  AcuerdosGobernabilidadAction,
  type AgAcuerdoDetalleDto,
  type AgIntervencionDto,
  type AgResultadoDto,
  type IntervencionCreateDto,
  type ResultadoCreateDto,
} from "../AcuerdosGobernabilidadAction";

/* =========================
   Helpers (NO lógica negocio)
========================= */

const getErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Ocurrió un error inesperado.";
};

const pillSx = (estado?: string | null) => ({
  display: "inline-flex",
  px: 1,
  py: 0.25,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  border: "1px solid #E7ECF3",
  bgcolor:
    (estado ?? "ACTIVO").toUpperCase() === "ACTIVO"
      ? "rgba(16,185,129,.10)"
      : "rgba(239,68,68,.10)",
});

const normalizeEstadoText = (v: unknown): "ACTIVO" | "INACTIVO" => {
  if (typeof v === "boolean") return v ? "ACTIVO" : "INACTIVO";
  if (typeof v === "string") {
    const s = v.trim().toUpperCase();
    if (["TRUE", "T", "1", "ACTIVO"].includes(s)) return "ACTIVO";
    if (["FALSE", "F", "0", "INACTIVO"].includes(s)) return "INACTIVO";
  }
  return "ACTIVO";
};

// Estilo premium (similar a AcuerdosGobernabilidadPoliticasPage.tsx)
const pageBgSx = {
  p: { xs: 1.5, md: 2 },
  borderRadius: 3,
  background:
    "radial-gradient(1200px 420px at 0% 0%, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0) 60%)",
};

const cardSx = {
  borderRadius: 3,
  border: "1px solid #EEF2F7",
  bgcolor: "#fff",
  boxShadow: "0 12px 40px rgba(15,23,42,0.08)",
  overflow: "hidden",
};

const headerBarSx = {
  p: 2,
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  bgcolor: "rgba(248,250,252,.9)",
};

const thSx = {
  fontWeight: 900,
  bgcolor: "#FAFBFD",
  borderBottom: "1px solid #EEF2F7",
  whiteSpace: "nowrap",
};

const baseRowSx = {
  "& td": { borderBottom: "1px solid #F0F3F8", py: 1.25 },
  "&:hover": { bgcolor: "rgba(99,102,241,0.04)" },
};

const codeChipSx = {
  borderRadius: 999,
  fontWeight: 900,
  bgcolor: "#fff",
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

type ResultadoFormState = {
  codigo: string;
  descripcion: string;
};

type IntervFormState = {
  idResultado: number;
  codigo: string;
  descripcion: string;
  presupuestoEstimado: string; // input -> string
};

type SnackState = {
  open: boolean;
  type: "success" | "error";
  msg: string;
};

export default function AcuerdosGobernabilidadPoliticasResponsablesResultadosPage() {
  const { idInstrumento, idPolitica, idUnidad } = useParams();

  const instrumentoId = useMemo(
    () => (idInstrumento ? parseInt(idInstrumento, 10) : NaN),
    [idInstrumento]
  );
  const politicaId = useMemo(
    () => (idPolitica ? parseInt(idPolitica, 10) : NaN),
    [idPolitica]
  );
  const unidadId = useMemo(() => (idUnidad ? parseInt(idUnidad, 10) : NaN), [idUnidad]);

  const [detalle, setDetalle] = useState<AgAcuerdoDetalleDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instrumento, setInstrumento] = useState<InstrumentoDto | null>(null);


  // dialogs
  const [openNuevoResultado, setOpenNuevoResultado] = useState(false);
  const [openNuevaInterv, setOpenNuevaInterv] = useState(false);

  const [resultadoForm, setResultadoForm] = useState<ResultadoFormState>({
    codigo: "",
    descripcion: "",
  });

  const [intervForm, setIntervForm] = useState<IntervFormState>({
    idResultado: 0,
    codigo: "",
    descripcion: "",
    presupuestoEstimado: "",
  });

  const [snack, setSnack] = useState<SnackState>({ open: false, type: "success", msg: "" });
  const showOk = (msg: string) => setSnack({ open: true, type: "success", msg });
  const showErr = (msg: string) => setSnack({ open: true, type: "error", msg });

  const navigate = useNavigate();
  const location = useLocation();

  const handleVolver = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    const sp = new URLSearchParams(location.search);
    const returnTo = sp.get("returnTo") || "/ag/politica"; // fallback
    navigate(returnTo);
  };


  const load = useCallback(async () => {
    if (
      !instrumentoId ||
      Number.isNaN(instrumentoId) ||
      !politicaId ||
      Number.isNaN(politicaId) ||
      !unidadId ||
      Number.isNaN(unidadId)
    ) {
      setError("Parámetros inválidos en la ruta (idInstrumento/idPolitica/idUnidad).");
      return;
    }

    try {
    setLoading(true);
    setError(null);

    const [res, inst] = await Promise.all([
      AcuerdosGobernabilidadAction.getDetalle(instrumentoId, politicaId, unidadId),
      CatalogoAction.getInstrumentoById(instrumentoId),
    ]);

    setDetalle(res);
    setInstrumento(inst);


    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [instrumentoId, politicaId, unidadId]);

  useEffect(() => {
    load();
  }, [load]);

  const openDialogNuevoResultado = () => {
    setResultadoForm({ codigo: "", descripcion: "" });
    setOpenNuevoResultado(true);
  };

  const openDialogNuevaInterv = (r: AgResultadoDto) => {
    setIntervForm({
      idResultado: r.idResultado,
      codigo: "",
      descripcion: "",
      presupuestoEstimado: "",
    });
    setOpenNuevaInterv(true);
  };

  const parsePresupuesto = (raw: string): number | null | "invalid" => {
    const v = raw.trim();
    if (v === "") return null;
    const n = Number(v);
    if (Number.isNaN(n)) return "invalid";
    return n;
  };

  const guardarNuevoResultado = async () => {
    if (!detalle) return;

    if (!resultadoForm.codigo.trim() || !resultadoForm.descripcion.trim()) {
      showErr("Completa código y descripción del resultado.");
      return;
    }

    try {
      const payload: ResultadoCreateDto = {
        codigo: resultadoForm.codigo.trim(),
        descripcion: resultadoForm.descripcion.trim(),
      };

      await AcuerdosGobernabilidadAction.crearResultado(
        detalle.idInstrumento,
        detalle.idPolitica,
        detalle.idUnidad,
        payload
      );

      showOk("Resultado creado.");
      setOpenNuevoResultado(false);
      await load();
    } catch (e: unknown) {
      showErr(getErrorMessage(e));
    }
  };

  const guardarNuevaInterv = async () => {
    if (!detalle) return;

    if (!intervForm.codigo.trim() || !intervForm.descripcion.trim()) {
      showErr("Completa código y descripción de la intervención.");
      return;
    }

    const presupuesto = parsePresupuesto(intervForm.presupuestoEstimado);
    if (presupuesto === "invalid") {
      showErr("Presupuesto estimado debe ser numérico.");
      return;
    }

    try {
      const payload: IntervencionCreateDto = {
        idResultado: intervForm.idResultado,
        codigo: intervForm.codigo.trim(),
        descripcion: intervForm.descripcion.trim(),
        idUnidadResponsable: detalle.idUnidad,
        presupuestoEstimado: presupuesto,
      };

      await AcuerdosGobernabilidadAction.crearIntervencion(detalle.idInstrumento, payload);

      showOk("Intervención creada.");
      setOpenNuevaInterv(false);
      await load();
    } catch (e: unknown) {
      showErr(getErrorMessage(e));
    }
  };

  const eliminarIntervencion = async (idIntervencion: number) => {
    const ok = window.confirm("¿Eliminar (inactivar) la intervención?");
    if (!ok) return;

    try {
      await AcuerdosGobernabilidadAction.eliminarIntervencion(idIntervencion);
      showOk("Intervención inactivada.");
      await load();
    } catch (e: unknown) {
      showErr(getErrorMessage(e));
    }
  };

  const totalResultados = detalle?.resultados?.length ?? 0;

  // Para alinear verticalmente código/desc/acciones del resultado con sus intervenciones
  const resultadoCellInner = (children: React.ReactNode) => (
    <Box sx={{ height: "100%", display: "flex", alignItems: "center", minHeight: 52 }}>
      {children}
    </Box>
  );

  // “card” único (código + descripción) para intervención (igual a Responsables)
  const intervCardSx = {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    alignItems: "center",
    gap: 1,
    px: 1.25,
    py: 0.9,
    borderRadius: 2,
    border: "1px solid #EEF2F7",
    bgcolor: "rgba(15,23,42,0.02)",
    transition: "all .15s ease",
    "&:hover": {
      bgcolor: "rgba(99,102,241,0.06)",
      borderColor: "rgba(99,102,241,0.22)",
    },
  } as const;

  return (
    <Box sx={pageBgSx}>
      {/* Título + acciones superiores */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 950, letterSpacing: -0.2 }}>
          {instrumento?.nombre
            ? `${instrumento.nombre.toUpperCase()}: POLÍTICAS / RESPONSABLES / RESULTADOS / INTERVENCIONES`
            : "POLÍTICAS / RESPONSABLES / RESULTADOS / INTERVENCIONES"}
        </Typography>


          <Typography sx={{ color: "text.secondary", mt: 0.25 }}>
            Visualiza resultados concertados e intervenciones prioritarias por Política y Responsable.
          </Typography>
        </Box>

        <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={handleVolver}>
          VOLVER
        </Button>

        <Tooltip title="Refrescar">
          <span>
            <IconButton onClick={load} disabled={loading}>
              <RefreshRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Card principal */}
      <Paper elevation={0} sx={cardSx}>
        {/* Barra superior del card */}
        <Box sx={headerBarSx}>
          <TextField
            size="small"
            placeholder="Buscar..."
            disabled
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: "100%", sm: 460 },
              "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
            }}
          />

          <Box sx={{ flex: 1 }} />

          <Chip
            label={`${totalResultados} resultados`}
            variant="outlined"
            sx={{ borderRadius: 999, fontWeight: 900, bgcolor: "#fff" }}
          />
        </Box>

        <Divider />

        {/* Estado / mensajes */}
        {loading && (
          <Box sx={{ px: 2, py: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={18} />
            <Typography sx={{ fontWeight: 800 }}>Cargando...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ px: 2, py: 2 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {!loading && !error && !detalle && (
          <Box sx={{ px: 2, py: 2 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              No se encontró información para la combinación Política/Responsable.
            </Alert>
          </Box>
        )}

        {detalle && (
          <Box sx={{ px: 0, pb: 0 }}>
            {/* Cabecera política/responsable */}
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...thSx, width: 90 }}>CÓDIGO</TableCell>
                    <TableCell sx={thSx}>política</TableCell>
                    <TableCell sx={{ ...thSx, width: 160 }}>código responsable</TableCell>
                    <TableCell sx={thSx}>nombre responsable</TableCell>
                    <TableCell sx={{ ...thSx, width: 110 }}>ESTADO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover sx={baseRowSx}>
                    <TableCell sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>
                      {detalle.codigoPolitica}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 900, lineHeight: 1.15 }}>
                        {detalle.politica}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={detalle.codigoUnidad}
                        size="small"
                        variant="outlined"
                        sx={codeChipSx}
                      />
                    </TableCell>

                    <TableCell sx={{ fontWeight: 800 }}>{detalle.nombreUnidad}</TableCell>
                    <TableCell>
                      <Box component="span" sx={pillSx(detalle.estado ?? "ACTIVO")}>
                        {(detalle.estado ?? "ACTIVO").toUpperCase() === "ACTIVO"
                          ? "Activo"
                          : detalle.estado}
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />

            {/* Header resultados + botón */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "rgba(248,250,252,.9)",
              }}
            >
              <Box>
               <Typography sx={{ fontWeight: 950 }}>
                {instrumento?.nombre
                ? `${instrumento.nombre.toUpperCase()}: RESULTADOS E INTERVENCIONES`
                : "RESULTADOS E INTERVENCIONES"}

            </Typography>

                <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.25 }}>
                  Cada resultado concertado puede tener una o más intervenciones prioritarias.
                </Typography>
              </Box>

              <Button
                size="small"
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={openDialogNuevoResultado}
                sx={{ textTransform: "none", fontWeight: 900, borderRadius: 2 }}
              >
                + NUEVO RESULTADO
              </Button>
            </Box>

            <Divider />

            {/* Tabla resultados / intervenciones */}
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...thSx, width: 90 }}>código</TableCell>
                    <TableCell sx={thSx}>resultados concertados</TableCell>
                    <TableCell sx={{ ...thSx, width: 120 }}>acciones</TableCell>
                    <TableCell sx={{ ...thSx, width: 220 }}>código intervenciones prioritarias</TableCell>
                    <TableCell sx={thSx}>intervenciones prioritarias</TableCell>
                    <TableCell sx={{ ...thSx, width: 110 }}>estado</TableCell>
                    <TableCell sx={{ ...thSx, width: 140 }}>acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {detalle.resultados?.length ? (
                    detalle.resultados.map((r) => {
                      const intervs: Array<AgIntervencionDto | null> = r.intervenciones?.length
                        ? r.intervenciones
                        : [null];

                      return intervs.map((i, idx) => (
                        <TableRow
                          key={`${r.idResultado}-${i?.idIntervencion ?? "none"}-${idx}`}
                          hover
                          sx={baseRowSx}
                        >
                          {/* Resultado: CÓDIGO */}
                          {idx === 0 && (
                            <TableCell
                              rowSpan={intervs.length}
                              sx={{
                                width: 90,
                                whiteSpace: "nowrap",
                                fontWeight: 900,
                                verticalAlign: "middle",
                              }}
                            >
                              {resultadoCellInner(
                                <Typography sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>
                                  {r.codigo}
                                </Typography>
                              )}
                            </TableCell>
                          )}

                          {/* Resultado: DESCRIPCIÓN */}
                          {idx === 0 && (
                            <TableCell rowSpan={intervs.length} sx={{ minWidth: 320, verticalAlign: "middle" }}>
                              {resultadoCellInner(
                                <Typography sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                                  {r.descripcion}
                                </Typography>
                              )}
                            </TableCell>
                          )}

                          {/* Resultado: ACCIONES (ojo, lápiz, +) */}
                          {idx === 0 && (
                            <TableCell
                              rowSpan={intervs.length}
                              sx={{ width: 120, textAlign: "center", verticalAlign: "middle" }}
                            >
                              {resultadoCellInner(
                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                                  <Tooltip title="Ver (pendiente backend)">
                                    <span>
                                      <IconButton size="small" disabled sx={{ color: "text.secondary" }}>
                                        <VisibilityRoundedIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>

                                  <Tooltip title="Editar (pendiente backend)">
                                    <span>
                                      <IconButton size="small" disabled sx={{ color: "text.secondary" }}>
                                        <EditRoundedIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>

                                  {/* ✅ Icono plus con misma funcionalidad del botón azul */}
                                  <Tooltip title="Nueva intervención prioritaria">
                                    <IconButton
                                      size="small"
                                      onClick={() => openDialogNuevaInterv(r)}
                                      sx={{ color: "text.secondary" }}
                                    >
                                      <AddRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )}
                            </TableCell>
                          )}

                          {/* ✅ Intervención: “card” ÚNICO (código + descripción en el mismo cuadro, hover igual que Responsables)
                              Importante: no se sombrea todo el grupo, solo el card donde está el mouse */}
                          <TableCell colSpan={2} sx={{ py: 0.9 }}>
                            {i ? (
                              <Box sx={intervCardSx}>
                                <Chip label={i.codigo} size="small" variant="outlined" sx={codeChipSx} />
                                <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                  {i.descripcion}
                                </Typography>
                              </Box>
                            ) : (
                              <Box sx={{ ...intervCardSx, bgcolor: "transparent", borderColor: "transparent" }}>
                                <Typography sx={{ color: "text.secondary", fontWeight: 800 }}>—</Typography>
                                <Typography sx={{ color: "text.secondary", fontWeight: 800 }}>—</Typography>
                              </Box>
                            )}
                          </TableCell>

                          {/* Intervención: ESTADO (TRUE/FALSE => Activo/Inactivo) */}
                          <TableCell sx={{ width: 110 }}>
                            {(() => {
                              const est = normalizeEstadoText(i?.estado ?? r.estado ?? "ACTIVO");
                              return (
                                <Box component="span" sx={pillSx(est)}>
                                  {est === "ACTIVO" ? "Activo" : "Inactivo"}
                                </Box>
                              );
                            })()}
                          </TableCell>

                          {/* Intervención: ACCIONES (solo intervención) */}
                          <TableCell sx={{ width: 140 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                              {i && (
                                <>
                                  <Tooltip title="Abrir (opcional)">
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        window.open("about:blank", "_blank", "noopener,noreferrer")
                                      }
                                      sx={{ color: "text.secondary" }}
                                    >
                                      <OpenInNewRoundedIcon  fontSize="small" />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Eliminar intervención">
                                    <IconButton
                                      size="small"
                                      onClick={() => eliminarIntervencion(i.idIntervencion)}
                                      sx={{ color: "error.main" }}
                                    >
                                      <DeleteRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Editar intervención (pendiente backend)">
                                    <span>
                                      <IconButton size="small" disabled sx={{ color: "text.secondary" }}>
                                        <EditRoundedIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ));
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 3 }}>
                        <Box sx={{ px: 1 }}>
                          <Alert severity="info" sx={{ borderRadius: 2 }}>
                            No hay resultados concertados registrados para esta política/responsable.
                          </Alert>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Snack */}
      <Dialog open={snack.open} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <DialogTitle>{snack.type === "success" ? "✅ Listo" : "⚠️ Atención"}</DialogTitle>
        <DialogContent>
          <Alert severity={snack.type} sx={{ borderRadius: 2 }}>
            {snack.msg}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnack((s) => ({ ...s, open: false }))}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Nuevo Resultado */}
      <Dialog
        open={openNuevoResultado}
        onClose={() => setOpenNuevoResultado(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Nuevo Resultado Concertado</DialogTitle>
        <DialogContent sx={{ pt: 1.5, display: "grid", gap: 1.25 }}>
          <TextField
            label="Código"
            value={resultadoForm.codigo}
            onChange={(e) => setResultadoForm((s) => ({ ...s, codigo: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Resultado concertado"
            value={resultadoForm.descripcion}
            onChange={(e) => setResultadoForm((s) => ({ ...s, descripcion: e.target.value }))}
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNuevoResultado(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarNuevoResultado}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Nueva Intervención */}
      <Dialog open={openNuevaInterv} onClose={() => setOpenNuevaInterv(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Intervención Prioritaria</DialogTitle>
        <DialogContent sx={{ pt: 1.5, display: "grid", gap: 1.25 }}>
          <TextField
            label="Código"
            value={intervForm.codigo}
            onChange={(e) => setIntervForm((s) => ({ ...s, codigo: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Intervención prioritaria"
            value={intervForm.descripcion}
            onChange={(e) => setIntervForm((s) => ({ ...s, descripcion: e.target.value }))}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label="Presupuesto estimado (opcional)"
            value={intervForm.presupuestoEstimado}
            onChange={(e) => setIntervForm((s) => ({ ...s, presupuestoEstimado: e.target.value }))}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNuevaInterv(false)}>Cancelar</Button>
          <Button variant="contained" onClick={guardarNuevaInterv}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
