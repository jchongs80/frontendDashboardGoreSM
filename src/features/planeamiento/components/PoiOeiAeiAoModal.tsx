import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  InputAdornment,
  Skeleton,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import TagRoundedIcon from "@mui/icons-material/TagRounded";
import NumbersRoundedIcon from "@mui/icons-material/NumbersRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";

import { PoiOeiAeiAoAction } from "../PoiOeiAeiAoAction";
import type {
  PoiComboItemDto,
  PoiOeiAeiAoCreateDto,
  PoiActividadOperativaNombreDto,
  PoiOeiAeiHeaderDto,
} from "../PoiOeiAeiAoAction";

type Props = {
  open: boolean;
  onClose: () => void;
  idOeiAei: number;
  onSaved: () => Promise<void> | void;
  idOeiAeiAo?: number | null; // null = crear, number = editar
  idAer: number;
  idCc: number;
};

function filterByCodigoNombre(options: PoiComboItemDto[], inputValue: string) {
  const q = (inputValue ?? "").trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => `${o.codigo ?? ""} ${o.nombre ?? ""}`.toLowerCase().includes(q));
}

function filterByNombre(options: PoiActividadOperativaNombreDto[], inputValue: string) {
  const q = (inputValue ?? "").trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => `${o.nombre ?? ""}`.toLowerCase().includes(q));
}

const listboxProps = { style: { maxHeight: 340 } } as const;

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.75,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
} as const;

const autoSx = {
  width: "100%",
  ...fieldSx,
} as const;

function isNonEmpty(s: string) {
  return (s ?? "").trim().length > 0;
}

export default function PoiOeiAeiAoModal({
  open,
  onClose,
  idOeiAei,
  onSaved,
  idOeiAeiAo = null,
}: Props): React.JSX.Element {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // modo “Nueva AO”
  const [isCreatingNewName, setIsCreatingNewName] = useState(false);

  // Header OER/AER
  const [header, setHeader] = useState<PoiOeiAeiHeaderDto | null>(null);
  const [loadingHeader, setLoadingHeader] = useState(false);

  // Catálogos
  const [catOpt, setCatOpt] = useState<PoiComboItemDto[]>([]);
  const [prodOpt, setProdOpt] = useState<PoiComboItemDto[]>([]);
  const [funOpt, setFunOpt] = useState<PoiComboItemDto[]>([]);
  const [divOpt, setDivOpt] = useState<PoiComboItemDto[]>([]);
  const [gruOpt, setGruOpt] = useState<PoiComboItemDto[]>([]);
  const [apOpt, setApOpt] = useState<PoiComboItemDto[]>([]);
  const [nombreAoOpt, setNombreAoOpt] = useState<PoiActividadOperativaNombreDto[]>([]);

  // Selecciones
  const [catSel, setCatSel] = useState<PoiComboItemDto | null>(null);
  const [prodSel, setProdSel] = useState<PoiComboItemDto | null>(null);
  const [funSel, setFunSel] = useState<PoiComboItemDto | null>(null);
  const [divSel, setDivSel] = useState<PoiComboItemDto | null>(null);
  const [gruSel, setGruSel] = useState<PoiComboItemDto | null>(null);
  const [apSel, setApSel] = useState<PoiComboItemDto | null>(null);
  const [nombreAoSel, setNombreAoSel] = useState<PoiActividadOperativaNombreDto | null>(null);

  // Campos de texto
  const [nroRegistroPoi, setNroRegistroPoi] = useState<string>("");
  const [aoCodigo, setAoCodigo] = useState<string>("");
  const [nuevoNombreAo, setNuevoNombreAo] = useState<string>("");

  const isEditMode = idOeiAeiAo != null && idOeiAeiAo > 0;

  // Validación UX (sin molestar al usuario con alertas agresivas)
  const hasNombreAO = useMemo(() => {
    if (isCreatingNewName) return isNonEmpty(nuevoNombreAo);
    return nombreAoSel !== null;
  }, [isCreatingNewName, nuevoNombreAo, nombreAoSel]);

  const canSave = useMemo(() => {
    return idOeiAei > 0 && isNonEmpty(nroRegistroPoi) && isNonEmpty(aoCodigo) && hasNombreAO;
  }, [idOeiAei, nroRegistroPoi, aoCodigo, hasNombreAO]);

  const missingHints = useMemo(() => {
    const misses: string[] = [];
    if (!isNonEmpty(nroRegistroPoi)) misses.push("Nro. Registro POI");
    if (!isNonEmpty(aoCodigo)) misses.push("Código Actividad Operativa");
    if (!hasNombreAO) misses.push(isCreatingNewName ? "Nuevo Nombre AO" : "Nombre Actividad Operativa");
    return misses;
  }, [nroRegistroPoi, aoCodigo, hasNombreAO, isCreatingNewName]);

  const loadBase = async () => {
    const [c, p, f, d, ap, g, nombres] = await Promise.all([
      PoiOeiAeiAoAction.getCategorias(""),
      PoiOeiAeiAoAction.getProductosProyectos(""),
      PoiOeiAeiAoAction.getFunciones(""),
      PoiOeiAeiAoAction.getDivisiones(""),
      PoiOeiAeiAoAction.getActividadesPresupuestales(""),
      PoiOeiAeiAoAction.getGrupos(null, ""),
      PoiOeiAeiAoAction.getNombresActividadesOperativas(),
    ]);

    setCatOpt(c);
    setProdOpt(p);
    setFunOpt(f);
    setDivOpt(d);
    setApOpt(ap);
    setGruOpt(g);
    setNombreAoOpt(nombres);
  };

  const loadHeader = async () => {
    if (!idOeiAei || idOeiAei <= 0) return;
    setLoadingHeader(true);
    try {
      const h = await PoiOeiAeiAoAction.getHeaderByOeiAei(idOeiAei);
      setHeader(h);
    } catch (e) {
      console.error("❌ Header OER/AER:", e);
      setHeader(null);
    } finally {
      setLoadingHeader(false);
    }
  };

  const loadDataForEdit = async () => {
    if (!isEditMode) return;
    setLoading(true);
    try {
      const detalle = await PoiOeiAeiAoAction.getDetalleAo(idOeiAeiAo as number);
      if (!detalle) return;

      setCatSel(catOpt.find((x) => x.id === detalle.idCategoria) ?? null);
      setProdSel(prodOpt.find((x) => x.id === detalle.idProductoProyecto) ?? null);
      setFunSel(funOpt.find((x) => x.id === detalle.idFuncion) ?? null);
      setDivSel(divOpt.find((x) => x.id === detalle.idDivision) ?? null);
      setGruSel(gruOpt.find((x) => x.id === detalle.idGrupo) ?? null);
      setApSel(apOpt.find((x) => x.id === detalle.idActividadPresupuesto) ?? null);
      setNombreAoSel(
        nombreAoOpt.find((x) => x.idActividadOperativa === detalle.idActividadOperativa) ?? null
      );

      setNroRegistroPoi(detalle.nroRegistroPoi || "");
      setAoCodigo(detalle.codigoAo || "");

      // En edición, por UX dejamos en “Seleccionar AO” por defecto
      setIsCreatingNewName(false);
      setNuevoNombreAo("");
    } catch (err) {
      console.error("❌ loadDataForEdit:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    // reset
    setCatSel(null);
    setProdSel(null);
    setFunSel(null);
    setDivSel(null);
    setGruSel(null);
    setApSel(null);
    setNombreAoSel(null);
    setNroRegistroPoi("");
    setAoCodigo("");
    setNuevoNombreAo("");
    setIsCreatingNewName(false);
    setHeader(null);

    void loadBase();
    void loadHeader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !isEditMode) return;
    if (catOpt.length === 0 || nombreAoOpt.length === 0) return;
    void loadDataForEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, idOeiAeiAo, catOpt.length, nombreAoOpt.length]);

  const handleToggleNewAO = () => {
    setIsCreatingNewName((v) => !v);
    setNombreAoSel(null);
    setNuevoNombreAo("");
  };

  const headerLines = useMemo(() => {
    const oer =
      header && (header.oerCodigo || header.oerEnunciado)
        ? `OER: ${header.oerCodigo ?? "—"} — ${header.oerEnunciado ?? "—"}`
        : null;

    const aer =
      header && (header.aerCodigo || header.aerEnunciado)
        ? `AER: ${header.aerCodigo ?? "—"} — ${header.aerEnunciado ?? "—"}`
        : null;

    return { oer, aer };
  }, [header]);

  const save = async () => {
    if (!canSave) return;

    const payload: PoiOeiAeiAoCreateDto = {
      idOeiAei,
      idCategoria: catSel?.id ?? null,
      idProductoProyecto: prodSel?.id ?? null,
      idFuncion: funSel?.id ?? null,
      idDivision: divSel?.id ?? null,
      idGrupo: gruSel?.id ?? null,
      idActividadPresupuesto: apSel?.id ?? null,

      idActividadOperativa: isCreatingNewName ? null : nombreAoSel?.idActividadOperativa ?? null,
      nuevoNombreActividadOperativa: isCreatingNewName ? nuevoNombreAo.trim() : null,

      codigoAo: aoCodigo.trim(),
      nroRegistroPoi: nroRegistroPoi.trim(),
    };

    setSaving(true);
    try {
      if (isEditMode && idOeiAeiAo) {
        await PoiOeiAeiAoAction.actualizarAo(idOeiAeiAo, payload);
      } else {
        await PoiOeiAeiAoAction.crearAo(payload);
      }

      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const titleText = isEditMode ? "Editar Actividad Operativa (AO)" : "Agregar Actividad Operativa (AO)";
  const primaryText = isEditMode ? "Actualizar" : "Guardar";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {/* Header premium */}
      <DialogTitle
        sx={{
          pb: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, rgba(27,111,238,0.08) 0%, rgba(27,111,238,0) 100%)",
        }}
      >
        <Stack spacing={0.25}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccountTreeRoundedIcon fontSize="small" />
            <Typography sx={{ fontWeight: 950, letterSpacing: 0.2 }}>{titleText}</Typography>
            <Chip
              size="small"
              variant="outlined"
              label={isEditMode ? "Edición" : "Registro"}
              sx={{ borderRadius: 999, fontWeight: 800 }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Completa los datos mínimos para guardar. Los catálogos te ayudan a estandarizar.
          </Typography>
        </Stack>

        <Tooltip title="Cerrar">
          <IconButton onClick={onClose} sx={{ borderRadius: 2 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* Card informativa OEI/AEI + OER + AER */}
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(248,250,255,0.9)",
            mb: 2,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
              <Chip
                icon={<NumbersRoundedIcon />}
                label={`AO ID: ${idOeiAei}`}
                sx={{ fontWeight: 900, borderRadius: 999 }}
                variant="outlined"
              />
              {isEditMode && (
                <Chip
                  icon={<TagRoundedIcon />}
                  label={`Registro: ${idOeiAeiAo}`}
                  sx={{ fontWeight: 800, borderRadius: 999 }}
                  variant="outlined"
                />
              )}
            </Stack>

            <Box sx={{ flex: 1 }} />

            <Chip
              size="small"
              icon={<FactCheckRoundedIcon />}
              label={canSave ? "Listo para guardar" : "Faltan datos"}
              color={canSave ? "success" : "default"}
              variant={canSave ? "filled" : "outlined"}
              sx={{ borderRadius: 999, fontWeight: 900 }}
            />
          </Stack>

          <Box sx={{ mt: 1.25 }}>
            {loadingHeader ? (
              <Stack spacing={0.75}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="90%" />
              </Stack>
            ) : (
              <Stack spacing={0.5}>
                <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
                  {headerLines.oer ?? "OER: —"}
                  {"\n"}
                  {headerLines.aer ?? "AER: —"}
                </Typography>
              </Stack>
            )}
          </Box>
        </Paper>

        {/* Hint suave de campos faltantes */}
        {!canSave && missingHints.length > 0 && (
          <Alert
            severity="info"
            variant="outlined"
            sx={{
              borderRadius: 3,
              mb: 2,
              "& .MuiAlert-message": { width: "100%" },
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 0.25 }}>Para guardar, completa:</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {missingHints.join(" • ")}
            </Typography>
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 3 }}>
            <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
          </Box>
        ) : (
          <>
            {/* Sección: Clasificación */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Inventory2RoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 950 }}>Contexto</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                (catálogos POI)
              </Typography>
            </Stack>

            {/* ✅ 2 columnas por fila (como pediste) */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mb: 2 }}>
              <Autocomplete
                options={catOpt}
                value={catSel}
                onChange={(_, v) => setCatSel(v)}
                getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Sin resultados"
                filterOptions={(options, state) => filterByCodigoNombre(options, state.inputValue)}
                ListboxProps={listboxProps}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Chip size="small" label={option.codigo ?? "—"} sx={{ mr: 1, borderRadius: 2 }} />
                    <Typography variant="body2">{option.nombre ?? "—"}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoría (POI)"
                    placeholder="Buscar..."
                    size="small"
                    helperText="Selecciona una categoría para clasificar el registro."
                    sx={fieldSx}
                  />
                )}
                sx={autoSx}
              />

              <Autocomplete
                options={prodOpt}
                value={prodSel}
                onChange={(_, v) => setProdSel(v)}
                getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Sin resultados"
                filterOptions={(options, state) => filterByCodigoNombre(options, state.inputValue)}
                ListboxProps={listboxProps}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Chip size="small" label={option.codigo ?? "—"} sx={{ mr: 1, borderRadius: 2 }} />
                    <Typography variant="body2">{option.nombre ?? "—"}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Producto / Proyecto"
                    placeholder="Buscar..."
                    size="small"
                    helperText="Ayuda a mantener consistencia entre registros."
                    sx={fieldSx}
                  />
                )}
                sx={autoSx}
              />

              <Autocomplete
                options={apOpt}
                value={apSel}
                onChange={(_, v) => setApSel(v)}
                getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Sin resultados"
                filterOptions={(options, state) => filterByCodigoNombre(options, state.inputValue)}
                ListboxProps={listboxProps}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Chip size="small" label={option.codigo ?? "—"} sx={{ mr: 1, borderRadius: 2 }} />
                    <Typography variant="body2">{option.nombre ?? "—"}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Actividad Presupuestal"
                    placeholder="Buscar..."
                    size="small"
                    sx={fieldSx}
                  />
                )}
                sx={autoSx}
              />

              <Autocomplete
                options={funOpt}
                value={funSel}
                onChange={(_, v) => setFunSel(v)}
                getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Sin resultados"
                filterOptions={(options, state) => filterByCodigoNombre(options, state.inputValue)}
                ListboxProps={listboxProps}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Chip size="small" label={option.codigo ?? "—"} sx={{ mr: 1, borderRadius: 2 }} />
                    <Typography variant="body2">{option.nombre ?? "—"}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Función" placeholder="Buscar..." size="small" sx={fieldSx} />
                )}
                sx={autoSx}
              />

              <Autocomplete
                options={divOpt}
                value={divSel}
                onChange={(_, v) => setDivSel(v)}
                getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Sin resultados"
                filterOptions={(options, state) => filterByCodigoNombre(options, state.inputValue)}
                ListboxProps={listboxProps}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Chip size="small" label={option.codigo ?? "—"} sx={{ mr: 1, borderRadius: 2 }} />
                    <Typography variant="body2">{option.nombre ?? "—"}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="División Funcional"
                    placeholder="Buscar..."
                    size="small"
                    sx={fieldSx}
                  />
                )}
                sx={autoSx}
              />


              <Autocomplete
                options={gruOpt}
                value={gruSel}
                onChange={(_, v) => setGruSel(v)}
                getOptionLabel={(o) => `${o.codigo ?? "—"} - ${o.nombre ?? "—"}`}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                noOptionsText="Sin resultados"
                filterOptions={(options, state) => filterByCodigoNombre(options, state.inputValue)}
                ListboxProps={listboxProps}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Chip size="small" label={option.codigo ?? "—"} sx={{ mr: 1, borderRadius: 2 }} />
                    <Typography variant="body2">{option.nombre ?? "—"}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Grupo Funcional"
                    placeholder="Buscar..."
                    size="small"
                    sx={fieldSx}
                  />
                )}
                sx={autoSx}
              />

            </Box>

            {/* Sección: Registro */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TagRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 950 }}>Registro - Código</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                (datos mínimos)
              </Typography>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mb: 2 }}>
              <TextField
                value={nroRegistroPoi}
                onChange={(e) => setNroRegistroPoi(e.target.value)}
                label="Nro. Registro POI"
                size="small"
                error={!isNonEmpty(nroRegistroPoi)}
                helperText={!isNonEmpty(nroRegistroPoi) ? "Obligatorio para guardar." : "OK"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />

              <TextField
                value={aoCodigo}
                onChange={(e) => setAoCodigo(e.target.value)}
                label="Código Actividad Operativa"
                size="small"
                error={!isNonEmpty(aoCodigo)}
                helperText={!isNonEmpty(aoCodigo) ? "Obligatorio para guardar." : "OK"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={fieldSx}
              />
            </Box>

            {/* Sección: Actividad Operativa */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <AccountTreeRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 950 }}>Actividad Operativa</Typography>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                borderRadius: 3,
                border: "1px dashed rgba(0,0,0,0.16)",
                background: "rgba(255,255,255,0.8)",
              }}
            >
              <Box sx={{ display: "flex", gap: 1.25, alignItems: "stretch" }}>
                <Box sx={{ flex: 1 }}>
                  {!isCreatingNewName ? (
                    <Autocomplete
                      options={nombreAoOpt}
                      value={nombreAoSel}
                      onChange={(_, v) => setNombreAoSel(v)}
                      getOptionLabel={(o) => o.nombre ?? "—"}
                      isOptionEqualToValue={(o, v) => o.idActividadOperativa === v.idActividadOperativa}
                      noOptionsText="Sin resultados"
                      filterOptions={(options, state) => filterByNombre(options, state.inputValue)}
                      ListboxProps={listboxProps}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Nombre Actividad Operativa"
                          placeholder="Buscar..."
                          size="small"
                          error={!hasNombreAO}
                          helperText={!hasNombreAO ? "Selecciona una AO." : "OK"}
                          sx={fieldSx}
                        />
                      )}
                      sx={autoSx}
                    />
                  ) : (
                    <TextField
                      value={nuevoNombreAo}
                      onChange={(e) => setNuevoNombreAo(e.target.value)}
                      label="Nuevo Nombre Actividad Operativa"
                      placeholder="Ingrese el nombre..."
                      size="small"
                      error={!hasNombreAO}
                      helperText={!hasNombreAO ? "Ingresa el nombre para crear." : "OK"}
                      fullWidth
                      sx={fieldSx}
                    />
                  )}
                </Box>

                <Button
                  onClick={handleToggleNewAO}
                  startIcon={<AddCircleOutlineRoundedIcon sx={{ fontSize: "1.2rem" }} />}
                  variant={isCreatingNewName ? "contained" : "outlined"}
                  sx={{
                    height: 40,
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 900,
                    px: 2,
                    whiteSpace: "nowrap",
                    ...(isCreatingNewName
                      ? {
                          background:
                            "linear-gradient(90deg, rgba(27,111,238,1) 0%, rgba(26,166,255,1) 100%)",
                          boxShadow: "0 10px 24px rgba(27,111,238,0.25)",
                          "&:hover": {
                            filter: "brightness(0.98)",
                            boxShadow: "0 14px 32px rgba(27,111,238,0.28)",
                          },
                        }
                      : {
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2, transform: "translateY(-1px)" },
                        }),
                    transition: "all .18s ease",
                  }}
                >
                  {isCreatingNewName ? "Seleccionar AO" : "Nueva AO"}
                </Button>
              </Box>
            </Paper>
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 2.25, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ borderRadius: 3, textTransform: "none", fontWeight: 800 }}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          disabled={!canSave || saving || loading}
          onClick={() => void save()}
          sx={{
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 950,
            px: 2.5,
            background:
              "linear-gradient(90deg, rgb(55, 171, 206) 0%, rgba(55, 171, 206) 50%, rgba(55, 171, 206) 100%)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
            "&:hover": {
              filter: "brightness(0.98)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.16)",
            },
          }}
        >
          {saving ? "Guardando..." : primaryText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
