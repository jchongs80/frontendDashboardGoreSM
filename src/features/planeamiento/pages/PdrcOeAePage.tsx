import React, { useEffect, useMemo, useState } from "react";
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../shared/api";

import PdrcOerAerModal from "../components/PdrcOerAerModal";
import { PdrcOeAeAction, type PdrcOerAerAsignadoListDto } from "../PdrcOeAeAction";
import {
  PlaneamientoAction,
  type AccionListDto,
  type ObjetivoConResponsablesDto,
  type UnidadOrgDto,
  type AccionCreateUpdateDto,
} from "../PlaneamientoAction";

const ID_INSTRUMENTO_PDRC = 2;

type SnackSeverity = "success" | "info" | "warning" | "error";
type SnackState = { open: boolean; msg: string; sev: SnackSeverity };

type CentroCostoDto = {
  idCentroCosto: number;
  codigo: string;
  nombre: string;
  estado?: string | null;
};

type UnidadEjecutoraDto = {
  idUnidadEjecutora: number;
  codigo: string;
  nombre: string;
  tipo?: string | null;
  estado?: string | null;
  idPliego?: number | null;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback;

  const e = err as { response?: { data?: unknown } };
  const data = e.response?.data as
    | {
        Message?: string;
        message?: string;
        Errors?: string[];
        errors?: string[];
        title?: string;
      }
    | undefined;

  if (!data) return fallback;

  const msg = data.Message ?? data.message ?? data.title ?? fallback;
  const errs = data.Errors ?? data.errors ?? [];
  if (Array.isArray(errs) && errs.length > 0) return `${msg}: ${errs.join(" | ")}`;
  return msg;
}

export default function PdrcOeAePage() {
  const navigate = useNavigate();
  const { idUnidad: idUnidadParam } = useParams();
  const idUnidad = Number(idUnidadParam);

  const [loading, setLoading] = useState<boolean>(true);

  const [unidad, setUnidad] = useState<UnidadOrgDto | null>(null);

  const [centrosCosto, setCentrosCosto] = useState<CentroCostoDto[]>([]);
  const [idCentroCostoSel, setIdCentroCostoSel] = useState<number>(0);

  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<UnidadEjecutoraDto[]>([]);
  const [idUnidadEjecutoraSel, setIdUnidadEjecutoraSel] = useState<number>(0);

  const [oerAll, setOerAll] = useState<ObjetivoConResponsablesDto[]>([]);
  const [aerAll, setAerAll] = useState<AccionListDto[]>([]);

  // Resultado visible en la tabla
  const [asignaciones, setAsignaciones] = useState<PdrcOerAerAsignadoListDto[]>([]);
  const [loadingAsignaciones, setLoadingAsignaciones] = useState<boolean>(false);
  const [combosReady, setCombosReady] = useState<boolean>(false);

  const [snack, setSnack] = useState<SnackState>({ open: false, msg: "", sev: "info" });

  // ===== Asignaciones en MEMORIA (sin backend al cerrar modal) =====
  type ApplyPayload = { idObjetivo: number; idsAccion: number[] };
  type MemKey = string; // `${idUnidad}-${idUe}-${idCc}`
  type MemAsignaciones = Record<number, Set<number>>; // idObjetivo -> Set<idAccion>

  const [memByKey, setMemByKey] = useState<Record<MemKey, MemAsignaciones>>({});

  const memKey = useMemo<MemKey>(() => {
    return `${idUnidad}-${idUnidadEjecutoraSel}-${idCentroCostoSel}`;
  }, [idUnidad, idUnidadEjecutoraSel, idCentroCostoSel]);

  // ===== Modal OER/AER (Asignación masiva) =====
  const [openOerAer, setOpenOerAer] = useState<boolean>(false);

  // ===== Modal Crear/Editar AER =====
  const [openAddAer, setOpenAddAer] = useState<boolean>(false);
  const [openEditAer, setOpenEditAer] = useState<boolean>(false);
  const [savingAer, setSavingAer] = useState<boolean>(false);

  const [idObjetivoAer, setIdObjetivoAer] = useState<number>(0);
  const [idAccionEdit, setIdAccionEdit] = useState<number>(0);

  const [formAer, setFormAer] = useState<AccionCreateUpdateDto>({
    idObjetivo: 0,
    codigo: "",
    enunciado: "",
    orden: 1,
    estado: "ACTIVO",
    idUnidadResponsable: 0,
  });

  // ===== Delete =====
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  const [accionToDelete, setAccionToDelete] = useState<AccionListDto | null>(null);

  const titleResponsable = useMemo(() => {
    if (!unidad) return `UO ${idUnidad}`;
    const cod = (unidad.codigo ?? "").trim();
    const nom = (unidad.nombre ?? "").trim();
    return `${cod} - ${nom}`.trim() || `UO ${idUnidad}`;
  }, [unidad, idUnidad]);

  const asignacionesByObjetivo = useMemo(() => {
    const map = new Map<number, PdrcOerAerAsignadoListDto[]>();
    for (const r of asignaciones ?? []) {
      if (!map.has(r.idObjetivo)) map.set(r.idObjetivo, []);
      map.get(r.idObjetivo)!.push(r);
    }
    return map;
  }, [asignaciones]);

  const oerAsignadosCount = useMemo(() => {
    return new Set((asignaciones ?? []).map((x) => x.idObjetivo)).size;
  }, [asignaciones]);

  const aerAsignadosCount = useMemo(() => {
    return new Set((asignaciones ?? []).map((x) => x.idAccion)).size;
  }, [asignaciones]);

  async function loadAll(): Promise<void> {
    if (!idUnidad || Number.isNaN(idUnidad)) {
      setSnack({ open: true, msg: "ID de unidad inválido en la URL.", sev: "error" });
      setLoading(false);
      return;
    }

    setLoading(true);
    setCombosReady(false);
    setAsignaciones([]);

    try {
      // 1) Unidad (para título)
      const unidades = await PlaneamientoAction.getUnidadesOrg();
      const u = unidades.find((x) => x.idUnidadOrganizacional === idUnidad) ?? null;
      setUnidad(u);

      // 2) Unidades ejecutoras (Combo Unidad Ejecutora)
      try {
        const ueResp = await api.get<UnidadEjecutoraDto[]>(
          `/api/unidades-ejecutoras?soloActivos=true`
        );
        const ue = ueResp ?? [];
        setUnidadesEjecutoras(ue);
        setIdUnidadEjecutoraSel(ue[0]?.idUnidadEjecutora ?? 0);
      } catch {
        setUnidadesEjecutoras([]);
        setIdUnidadEjecutoraSel(0);
      }

      // 3) Centros de costo (Combo Centro de Costo)
      try {
        const ccResp = await api.get<CentroCostoDto[]>(
          `/api/centros-costo/unidad/${idUnidad}?soloActivos=true`
        );
        const cc = ccResp ?? [];
        setCentrosCosto(cc);
        setIdCentroCostoSel(cc[0]?.idCentroCosto ?? 0);
      } catch {
        setCentrosCosto([]);
        setIdCentroCostoSel(0);
      }

      // 4) OER + responsables (PDRC) (se usa para el modal)
      const oer = await PlaneamientoAction.getObjetivosConResponsablesByInstrumento(
        ID_INSTRUMENTO_PDRC,
        true
      );
      setOerAll(oer ?? []);

      // 5) AER (PDRC)
      const aer = await PlaneamientoAction.getAccionesByInstrumento(ID_INSTRUMENTO_PDRC);
      setAerAll(aer ?? []);

      setCombosReady(true);
    } catch (err: unknown) {
      setSnack({
        open: true,
        msg: getErrorMessage(err, "No se pudo cargar la información."),
        sev: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUnidad]);

  function onUnidadEjecutoraChange(e: SelectChangeEvent<number>): void {
    const v = Number(e.target.value);
    setIdUnidadEjecutoraSel(Number.isFinite(v) ? v : 0);
  }

  function onCentroCostoChange(e: SelectChangeEvent<number>): void {
    const v = Number(e.target.value);
    setIdCentroCostoSel(Number.isFinite(v) ? v : 0);
  }

  async function loadAsignaciones(): Promise<void> {
    if (!combosReady) return;
    if (!idUnidad || Number.isNaN(idUnidad)) return;
    if (!idUnidadEjecutoraSel || !idCentroCostoSel) {
      setAsignaciones([]);
      return;
    }

    setLoadingAsignaciones(true);
    try {
      const rows = await PdrcOeAeAction.getAsignacionesOerAer(
        idUnidad,
        idUnidadEjecutoraSel,
        idCentroCostoSel
      );

      // Carga base desde backend
      const base = (rows ?? []) as PdrcOerAerAsignadoListDto[];

      // Overlay en memoria (si existe) para esta combinación unidad + UE + CC
      const bucket = memByKey[memKey] ?? {};
      if (Object.keys(bucket).length === 0) {
        setAsignaciones(base);
      } else {
        const oerMap = new Map(oerAll.map((o) => [o.idObjetivo, o]));
        const aerMap = new Map(aerAll.map((a) => [a.idAccion, a]));

        // Remueve objetivos que estén en memoria y reemplázalos por memoria
        const kept = base.filter((r) => bucket[r.idObjetivo] === undefined);

        const overlay: PdrcOerAerAsignadoListDto[] = [];
        for (const [idObjStr, setAcc] of Object.entries(bucket)) {
          const idObj = Number(idObjStr);
          const oer = oerMap.get(idObj);
          if (!oer) continue;

          for (const idAcc of Array.from(setAcc.values())) {
            const aer = aerMap.get(idAcc);
            if (!aer) continue;

            overlay.push({
              idObjetivo: idObj,
              codigoOer: oer.codigo ?? "",
              enunciadoOer: oer.enunciado ?? "",
              idAccion: aer.idAccion,
              codigoAer: aer.codigo ?? "",
              enunciadoAer: aer.enunciado ?? "",
            });
          }
        }

        const merged = [...kept, ...overlay].sort(
          (a, b) => a.codigoOer.localeCompare(b.codigoOer) || a.codigoAer.localeCompare(b.codigoAer)
        );
        setAsignaciones(merged);
      }
    } catch (err: unknown) {
      setAsignaciones([]);
      setSnack({
        open: true,
        msg: getErrorMessage(err, "No se pudo cargar la tabla OER/AER."),
        sev: "error",
      });
    } finally {
      setLoadingAsignaciones(false);
    }
  }

  useEffect(() => {
    void loadAsignaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combosReady, idUnidad, idUnidadEjecutoraSel, idCentroCostoSel]);

  function handleApplyFromModal(payload: ApplyPayload): void {
    // Guarda en memoria por combinación (unidad + UE + CC)
    setMemByKey((prev) => {
      const next = { ...prev };
      const current: MemAsignaciones = next[memKey] ? { ...next[memKey] } : {};

      // Reemplaza la asignación del OER con lo seleccionado en el modal
      current[payload.idObjetivo] = new Set<number>(payload.idsAccion);

      next[memKey] = current;
      return next;
    });

    // Actualiza la tabla principal EN MEMORIA (sin backend)
    const oerMap = new Map(oerAll.map((o) => [o.idObjetivo, o]));
    const aerMap = new Map(aerAll.map((a) => [a.idAccion, a]));

    const oer = oerMap.get(payload.idObjetivo);
    if (!oer) {
      setSnack({ open: true, msg: "No se encontró el OER seleccionado en memoria.", sev: "warning" });
      return;
    }

    const newRows: PdrcOerAerAsignadoListDto[] = payload.idsAccion
      .map((idAccion) => {
        const aer = aerMap.get(idAccion);
        if (!aer) return null;
        return {
          idObjetivo: oer.idObjetivo,
          codigoOer: oer.codigo ?? "",
          enunciadoOer: oer.enunciado ?? "",
          idAccion: aer.idAccion,
          codigoAer: aer.codigo ?? "",
          enunciadoAer: aer.enunciado ?? "",
        } as PdrcOerAerAsignadoListDto;
      })
      .filter((x): x is PdrcOerAerAsignadoListDto => x !== null);

    setAsignaciones((prev) => {
      // Reemplaza filas solo del OER afectado
      const kept = (prev ?? []).filter((r) => r.idObjetivo !== payload.idObjetivo);
      return [...kept, ...newRows].sort(
        (a, b) => a.codigoOer.localeCompare(b.codigoOer) || a.codigoAer.localeCompare(b.codigoAer)
      );
    });

    setSnack({ open: true, msg: "Asignación aplicada en memoria.", sev: "success" });
  }

  function openOerAerModal(): void {
    if (!idUnidad || Number.isNaN(idUnidad)) {
      setSnack({ open: true, msg: "ID de unidad inválido.", sev: "error" });
      return;
    }
    setOpenOerAer(true);
  }

  // ---- Resto de tu CRUD AER (lo dejo igual a tu archivo actual) ----
  function openAddAerModal(idObjetivo: number): void {
    setIdObjetivoAer(idObjetivo);
    setIdAccionEdit(0);
    setFormAer({
      idObjetivo,
      codigo: "",
      enunciado: "",
      orden: 1,
      estado: "ACTIVO",
      idUnidadResponsable: idUnidad,
    });
    setOpenAddAer(true);
  }

  function openEditAccion(a: AccionListDto): void {
    setIdAccionEdit(a.idAccion);
    setIdObjetivoAer(a.idObjetivo);
    setFormAer({
      idObjetivo: a.idObjetivo,
      codigo: a.codigo ?? "",
      enunciado: a.enunciado ?? "",
      orden: a.orden ?? 1,
      estado: (a.estado ?? "ACTIVO") as "ACTIVO" | "INACTIVO",
      idUnidadResponsable: idUnidad,
    });
    setOpenEditAer(true);
  }

  async function saveAerCreate(): Promise<void> {
    if (!idObjetivoAer) return;

    if (!formAer.codigo.trim() || !formAer.enunciado.trim()) {
      setSnack({ open: true, msg: "Completa Código y Enunciado.", sev: "warning" });
      return;
    }

    setSavingAer(true);
    try {
      await PlaneamientoAction.createAccion({
        ...formAer,
        idObjetivo: idObjetivoAer,
        idUnidadResponsable: idUnidad,
      });

      setSnack({ open: true, msg: "AER creada correctamente.", sev: "success" });
      setOpenAddAer(false);
      await loadAsignaciones();
    } catch (err: unknown) {
      setSnack({ open: true, msg: getErrorMessage(err, "No se pudo crear la AER."), sev: "error" });
    } finally {
      setSavingAer(false);
    }
  }

  async function saveAerEdit(): Promise<void> {
    if (!idAccionEdit) return;

    if (!formAer.codigo.trim() || !formAer.enunciado.trim()) {
      setSnack({ open: true, msg: "Completa Código y Enunciado.", sev: "warning" });
      return;
    }

    setSavingAer(true);
    try {
      await PlaneamientoAction.updateAccion(idAccionEdit, {
        ...formAer,
        idUnidadResponsable: idUnidad,
      });

      setSnack({ open: true, msg: "AER actualizada correctamente.", sev: "success" });
      setOpenEditAer(false);
      await loadAsignaciones();
    } catch (err: unknown) {
      setSnack({ open: true, msg: getErrorMessage(err, "No se pudo actualizar la AER."), sev: "error" });
    } finally {
      setSavingAer(false);
    }
  }

  function askDelete(a: AccionListDto): void {
    setAccionToDelete(a);
    setOpenDelete(true);
  }

  async function doDelete(): Promise<void> {
    if (!accionToDelete) return;

    try {
      setLoading(true);
      await api.del<void>(`/api/accionesestrategicas/${accionToDelete.idAccion}`);
      setSnack({ open: true, msg: "AER eliminada/inactivada.", sev: "success" });
      setOpenDelete(false);
      setAccionToDelete(null);
      await loadAsignaciones();
    } catch (err: unknown) {
      setSnack({ open: true, msg: getErrorMessage(err, "No se pudo eliminar/inactivar."), sev: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={900}>
            {titleResponsable}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Relación OER ↔ AER del instrumento <b>PDRC</b> (id_instrumento = 2). Se trabaja por unidad responsable.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void loadAsignaciones()}
            disabled={loading || loadingAsignaciones}
          >
            Refrescar
          </Button>
          <Button variant="outlined" startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate(-1)}>
            Volver
          </Button>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openOerAerModal}>
            + O.E.R.
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {/* Toolbar superior con Unidad Ejecutora + Centro de Costo */}
        <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <FormControl sx={{ minWidth: 320 }} size="small">
              <InputLabel id="ue-label">Unidad Ejecutora</InputLabel>
              <Select<number>
                labelId="ue-label"
                label="Unidad Ejecutora"
                value={idUnidadEjecutoraSel}
                onChange={onUnidadEjecutoraChange}
              >
                {unidadesEjecutoras.map((x) => (
                  <MenuItem key={x.idUnidadEjecutora} value={x.idUnidadEjecutora}>
                    {x.codigo} - {x.nombre}
                  </MenuItem>
                ))}
                {unidadesEjecutoras.length === 0 ? (
                  <MenuItem value={0} disabled>
                    (Sin unidades ejecutoras)
                  </MenuItem>
                ) : null}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 360 }} size="small">
              <InputLabel id="cc-label">Centro de Costo</InputLabel>
              <Select<number>
                labelId="cc-label"
                label="Centro de Costo"
                value={idCentroCostoSel}
                onChange={onCentroCostoChange}
              >
                {centrosCosto.map((x) => (
                  <MenuItem key={x.idCentroCosto} value={x.idCentroCosto}>
                    {x.codigo} - {x.nombre}
                  </MenuItem>
                ))}
                {centrosCosto.length === 0 ? (
                  <MenuItem value={0} disabled>
                    (Sin centros de costo)
                  </MenuItem>
                ) : null}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip label={`OER asignados: ${oerAsignadosCount}`} variant="outlined" />
            <Chip label={`AER asignadas: ${aerAsignadosCount}`} variant="outlined" />
          </Box>
        </Box>

        <Divider />

        {loading || loadingAsignaciones ? (
          <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography fontWeight={900} sx={{ mb: 1 }}>
              OBJETIVOS ESTRATÉGICOS REGIONALES (OER) y ACCIONES ESTRATÉGICAS REGIONALES (AER)
            </Typography>

            <TableContainer sx={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900, width: 130 }}>Código OER</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Descripción OER</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 130 }}>Código AER</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Descripción AER</TableCell>
                    <TableCell sx={{ fontWeight: 900, width: 160 }}>Acción</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {asignaciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Alert severity="info">
                          No hay OER/AER asignadas para la combinación seleccionada (UE + Centro de Costo).
                        </Alert>
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.from(asignacionesByObjetivo.entries()).map(([idObjetivo, rows]) =>
                      rows.map((r, idx) => {
                        const aFull = (aerAll ?? []).find((x) => x.idAccion === r.idAccion) ?? null;

                        return (
                          <TableRow key={`${idObjetivo}-${r.idAccion}-${idx}`} hover>
                            <TableCell>{r.codigoOer}</TableCell>
                            <TableCell>{r.enunciadoOer}</TableCell>

                            <TableCell>{r.codigoAer}</TableCell>
                            <TableCell>{r.enunciadoAer}</TableCell>

                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Nueva AER">
                                  <IconButton size="small" onClick={() => openAddAerModal(idObjetivo)}>
                                    <AddRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Editar AER">
                                  <span>
                                    <IconButton size="small" disabled={!aFull} onClick={() => aFull && openEditAccion(aFull)}>
                                      <EditRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>

                                <Tooltip title="Eliminar / Inactivar AER">
                                  <span>
                                    <IconButton size="small" disabled={!aFull} onClick={() => aFull && askDelete(aFull)}>
                                      <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Modal Asignación OER/AER */}
      <PdrcOerAerModal
        open={openOerAer}
        idUnidad={idUnidad}
        unidadLabel={titleResponsable}
        onClose={() => setOpenOerAer(false)}
        onApply={handleApplyFromModal}
      />

      {/* CRUD AER: modales create/edit/delete (igual a tu archivo original) */}
      <Dialog open={openAddAer} onClose={() => setOpenAddAer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva AER</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Código"
              size="small"
              value={formAer.codigo}
              onChange={(e) => setFormAer((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Orden"
              size="small"
              type="number"
              value={formAer.orden ?? 1}
              onChange={(e) => setFormAer((p) => ({ ...p, orden: Number(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Enunciado"
              size="small"
              value={formAer.enunciado}
              onChange={(e) => setFormAer((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              sx={{ gridColumn: "1 / -1" }}
            />
            <FormControl size="small" fullWidth sx={{ gridColumn: "1 / -1" }}>
              <InputLabel id="estado-aer-label">Estado</InputLabel>
              <Select<string>
                labelId="estado-aer-label"
                label="Estado"
                value={formAer.estado ?? "ACTIVO"}
                onChange={(e) =>
                  setFormAer((p) => ({ ...p, estado: e.target.value as "ACTIVO" | "INACTIVO" }))
                }
              >
                <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                <MenuItem value="INACTIVO">INACTIVO</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddAer(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void saveAerCreate()} disabled={savingAer}>
            {savingAer ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditAer} onClose={() => setOpenEditAer(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar AER</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Código"
              size="small"
              value={formAer.codigo}
              onChange={(e) => setFormAer((p) => ({ ...p, codigo: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Orden"
              size="small"
              type="number"
              value={formAer.orden ?? 1}
              onChange={(e) => setFormAer((p) => ({ ...p, orden: Number(e.target.value) }))}
              fullWidth
            />
            <TextField
              label="Enunciado"
              size="small"
              value={formAer.enunciado}
              onChange={(e) => setFormAer((p) => ({ ...p, enunciado: e.target.value }))}
              fullWidth
              sx={{ gridColumn: "1 / -1" }}
            />
            <FormControl size="small" fullWidth sx={{ gridColumn: "1 / -1" }}>
              <InputLabel id="estado-aer-label2">Estado</InputLabel>
              <Select<string>
                labelId="estado-aer-label2"
                label="Estado"
                value={formAer.estado ?? "ACTIVO"}
                onChange={(e) =>
                  setFormAer((p) => ({ ...p, estado: e.target.value as "ACTIVO" | "INACTIVO" }))
                }
              >
                <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                <MenuItem value="INACTIVO">INACTIVO</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditAer(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => void saveAerEdit()} disabled={savingAer}>
            {savingAer ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            ¿Deseas eliminar/inactivar la acción{" "}
            <b>{accionToDelete ? `${accionToDelete.codigo} - ${accionToDelete.enunciado}` : ""}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => void doDelete()}>
            Eliminar
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
    </Box>
  );
}
