import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import {
  AgPoRecoInprVistaAction,
  type AgIndicadorFichaArchivoDto,
} from "../AgPoRecoInprVistaAction";

type Props = {
  open: boolean;
  onClose: () => void;
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  tipoNivel?: string | null;
};

function safeText(value?: string | null): string {
  const txt = (value ?? "").toString().trim();
  return txt.length === 0 ? "—" : txt;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Error no controlado.";
  }
}

function formatBytes(bytes: number | null | undefined): string {
  const n = Number(bytes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "0 KB";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function validarArchivo(file: File): string {
  const name = file.name.toLowerCase();
  const ok =
    name.endsWith(".pdf") || name.endsWith(".xls") || name.endsWith(".xlsx");

  if (!ok) return "Solo se permiten archivos PDF, XLS o XLSX.";
  if (file.size > 20_000_000) return "El archivo no debe superar los 20 MB.";

  return "";
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "rgba(248,250,252,0.96)",
    fontWeight: 700,
  },
  "& .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(148,163,184,0.55)",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.45)",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(37,99,235,0.7)",
  },
} as const;

const sectionCardSx = {
  borderRadius: 3,
  border: "1px solid rgba(147,197,253,0.85)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.96))",
  boxShadow: "0 14px 34px rgba(15,23,42,.07)",
} as const;

const headerIconSx = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#2563eb",
  background:
    "linear-gradient(135deg, rgba(219,234,254,.95), rgba(255,255,255,.92))",
  border: "1px solid rgba(37,99,235,.24)",
  boxShadow: "0 12px 26px rgba(37,99,235,.12)",
} as const;

export default function AgIndicadorFichaModal({
  open,
  onClose,
  idAgPoRecoInpr,
  idIndicadorNombre,
  codigoIndicador,
  nombreIndicador,
  tipoNivel,
}: Props): React.ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewFileName, setPreviewFileName] = useState<string>("");

  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const [ficha, setFicha] = useState<AgIndicadorFichaArchivoDto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const codigoView = useMemo(
    () => safeText(codigoIndicador),
    [codigoIndicador],
  );
  const nombreView = useMemo(
    () => safeText(nombreIndicador),
    [nombreIndicador],
  );

  const loadFicha = async () => {
    if (!idAgPoRecoInpr || !idIndicadorNombre) {
      setFicha(null);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const data = await AgPoRecoInprVistaAction.getIndicadorFichaArchivo(
        idAgPoRecoInpr,
        idIndicadorNombre,
      );

      setFicha(data);
    } catch (error) {
      setFicha(null);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const cerrarPreview = () => {
    setPreviewOpen(false);

    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        window.URL.revokeObjectURL(currentUrl);
      }

      return "";
    });

    setPreviewFileName("");
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;

    setSelectedFile(null);
    cerrarPreview();
    void loadFicha();
  }, [open, idAgPoRecoInpr, idIndicadorNombre]);

  const onSelectFile = (file: File | null) => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validarArchivo(file);

    if (validation) {
      setSelectedFile(null);
      setErrorMsg(validation);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  };

  const guardarFicha = async () => {
    if (!selectedFile) {
      setErrorMsg("Seleccione un archivo PDF o Excel antes de guardar.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await AgPoRecoInprVistaAction.guardarIndicadorFichaArchivo(
        idAgPoRecoInpr,
        idIndicadorNombre,
        selectedFile,
      );

      setSuccessMsg("Ficha del indicador AG guardada correctamente.");
      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await loadFicha();
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const descargarFicha = async () => {
    if (!ficha) {
      setErrorMsg("El indicador no tiene ficha adjunta para descargar.");
      return;
    }

    setDownloading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await AgPoRecoInprVistaAction.descargarIndicadorFichaArchivo(
        idAgPoRecoInpr,
        idIndicadorNombre,
        ficha.nombreOriginal ?? "ficha_indicador",
      );
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  const visualizarFicha = async () => {
    if (!ficha) {
      setErrorMsg("El indicador no tiene ficha adjunta para visualizar.");
      return;
    }

    setPreviewLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result =
        await AgPoRecoInprVistaAction.obtenerIndicadorFichaArchivoBlob(
          idAgPoRecoInpr,
          idIndicadorNombre,
          ficha.nombreOriginal ?? "ficha_indicador",
        );

      const fileName =
        result.fileName || ficha.nombreOriginal || "ficha_indicador";

      const contentType = (
        result.contentType ||
        result.blob.type ||
        ficha.contentType ||
        ""
      ).toLowerCase();

      const isPdf =
        contentType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setErrorMsg(
          "La visualización en línea está disponible para archivos PDF. Para archivos Excel use el botón DESCARGAR.",
        );
        return;
      }

      cerrarPreview();

      const pdfBlob = result.blob.type
        ? result.blob
        : new Blob([result.blob], { type: "application/pdf" });

      const blobUrl = window.URL.createObjectURL(pdfBlob);

      setPreviewUrl(blobUrl);
      setPreviewFileName(fileName);
      setPreviewOpen(true);
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(90deg, rgba(239,246,255,0.96), rgba(255,255,255,0.98))",
          }}
        >
          <Stack spacing={0.55} sx={{ pr: 2, minWidth: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="flex-start"
              flexWrap="nowrap"
            >
              <Box sx={headerIconSx}>
                <AttachFileRoundedIcon fontSize="small" />
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Typography
                    sx={{
                      fontWeight: 950,
                      letterSpacing: 0.1,
                      lineHeight: 1.2,
                      fontSize: { xs: "0.98rem", sm: "1.05rem" },
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    Ficha del Indicador AG
                  </Typography>

                  <Chip
                    size="small"
                    variant="outlined"
                    label={tipoNivel ?? "Detalle"}
                    sx={{
                      borderRadius: 999,
                      fontWeight: 900,
                      color: "#2563eb",
                      borderColor: "rgba(37,99,235,.45)",
                      backgroundColor: "rgba(239,246,255,.9)",
                    }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontSize: "12px", mt: 0.45 }}
                >
                  Indicador: <b>{nombreView}</b>
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Button
            onClick={onClose}
            sx={{
              minWidth: "auto",
              p: 0.5,
              color: "text.secondary",
              borderRadius: 2,
            }}
          >
            <CloseRoundedIcon />
          </Button>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {errorMsg ? (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          ) : null}

          {successMsg ? (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {successMsg}
            </Alert>
          ) : null}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.6, md: 2 },
              borderRadius: 3,
              border: "1px solid rgba(203,213,225,.95)",
              background: "rgba(255,255,255,.82)",
              boxShadow: "0 10px 28px rgba(15,23,42,.05)",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "72px 150px 1fr" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#15803d",
                  border: "1px solid rgba(34,197,94,.25)",
                  background:
                    "linear-gradient(135deg, rgba(240,253,244,.92), rgba(255,255,255,.95))",
                }}
              >
                <DescriptionRoundedIcon fontSize="large" />
              </Box>

              <Stack spacing={0.7}>
                <Typography
                  sx={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}
                >
                  Código
                </Typography>
                <Typography
                  sx={{ fontSize: 14.5, color: "#0f172a", fontWeight: 950 }}
                >
                  {codigoView}
                </Typography>
              </Stack>

              <Box
                sx={{
                  borderLeft: {
                    xs: "none",
                    md: "1px solid rgba(148,163,184,.35)",
                  },
                  pl: { xs: 0, md: 3 },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.8 }}
                >
                  <Typography
                    sx={{ fontSize: 13, color: "#334155", fontWeight: 950 }}
                  >
                    Nivel:{" "}
                    <Box component="span" sx={{ color: "#0f172a" }}>
                      {safeText(tipoNivel)}
                    </Box>
                  </Typography>
                  <Chip
                    size="small"
                    label="Archivo de ficha"
                    color="primary"
                    variant="filled"
                    sx={{ borderRadius: 999, fontWeight: 900, height: 22 }}
                  />
                </Stack>
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: "#475569",
                    fontWeight: 700,
                    lineHeight: 1.55,
                  }}
                >
                  Indicador: {nombreView}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...sectionCardSx, p: 2 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1.25 }}
            >
              <AttachFileRoundedIcon
                fontSize="small"
                sx={{ color: "#2563eb" }}
              />
              <Typography sx={{ fontWeight: 950, color: "#2563eb" }}>
                Adjuntar ficha del indicador
              </Typography>
            </Stack>

            {loading ? (
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ py: 2 }}
              >
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando ficha...</Typography>
              </Stack>
            ) : (
              <Stack spacing={1.4}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 150px" },
                    gap: 1.2,
                  }}
                >
                  <TextField
                    label="Archivo actual"
                    size="small"
                    fullWidth
                    value={
                      ficha?.nombreOriginal ?? "Aún no se ha adjuntado ficha"
                    }
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />

                  <TextField
                    label="Tamaño"
                    size="small"
                    fullWidth
                    value={ficha ? formatBytes(ficha.tamanioBytes) : "—"}
                    sx={fieldSx}
                    InputProps={{ readOnly: true }}
                  />
                </Box>

                <Box>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: "none" }}
                    onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
                  />

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ sm: "center" }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<CloudUploadRoundedIcon />}
                      onClick={() => inputRef.current?.click()}
                      disabled={saving || downloading || previewLoading}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 900,
                        px: 2.2,
                        minWidth: 190,
                      }}
                    >
                      SELECCIONAR ARCHIVO
                    </Button>

                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary", wordBreak: "break-word" }}
                    >
                      {selectedFile
                        ? `${selectedFile.name} (${formatBytes(selectedFile.size)})`
                        : "PDF, XLS o XLSX. Máximo 20 MB."}
                    </Typography>
                  </Stack>
                </Box>

                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="flex-end"
                  sx={{ pt: 0.5 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityRoundedIcon />}
                    onClick={() => void visualizarFicha()}
                    disabled={
                      loading ||
                      saving ||
                      downloading ||
                      previewLoading ||
                      !ficha
                    }
                    sx={{
                      borderRadius: 2,
                      fontWeight: 900,
                      px: 2.4,
                      minWidth: 130,
                      backgroundColor: "#fff",
                    }}
                  >
                    {previewLoading ? "Visualizando..." : "VISUALIZAR"}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={() => void descargarFicha()}
                    disabled={
                      loading ||
                      saving ||
                      downloading ||
                      previewLoading ||
                      !ficha
                    }
                    sx={{
                      borderRadius: 2,
                      fontWeight: 900,
                      px: 2.4,
                      minWidth: 130,
                      backgroundColor: "#fff",
                    }}
                  >
                    {downloading ? "Descargando..." : "DESCARGAR"}
                  </Button>

                  <Button
                    variant="contained"
                    onClick={guardarFicha}
                    disabled={
                      saving || downloading || previewLoading || !selectedFile
                    }
                    sx={{
                      borderRadius: 2,
                      fontWeight: 900,
                      px: 2.4,
                      minWidth: 120,
                    }}
                  >
                    {saving ? "Guardando..." : "GUARDAR"}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>

          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: 1.2 }}
          >
            * La ficha se guarda por indicador dentro del registro AG
            seleccionado. Al subir una nueva ficha, reemplaza la anterior.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Box sx={{ flex: 1 }} />

          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              fontWeight: 900,
              borderRadius: 2,
              px: 3.5,
              minWidth: 132,
              color: "#111827",
              borderColor: "#111827",
              backgroundColor: "#fff",
            }}
          >
            CERRAR
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={cerrarPreview}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            height: { xs: "85vh", md: "90vh" },
          },
        }}
      >
        <DialogTitle
          sx={{
            py: 1.4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(90deg, rgba(239,246,255,0.96), rgba(255,255,255,0.98))",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <VisibilityRoundedIcon fontSize="small" />

            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, lineHeight: 1.2 }}>
                Visualizar ficha del indicador
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: 12,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: { xs: 260, sm: 650 },
                }}
                title={previewFileName}
              >
                {previewFileName}
              </Typography>
            </Box>
          </Stack>

          <Button
            onClick={cerrarPreview}
            sx={{
              minWidth: "auto",
              p: 0.5,
              color: "text.secondary",
              borderRadius: 2,
            }}
          >
            <CloseRoundedIcon />
          </Button>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0, height: "100%" }}>
          {previewUrl ? (
            <Box
              component="iframe"
              src={previewUrl}
              title={previewFileName || "Ficha del indicador"}
              sx={{
                width: "100%",
                height: "100%",
                minHeight: { xs: "70vh", md: "78vh" },
                border: 0,
                display: "block",
              }}
            />
          ) : (
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ p: 2 }}
            >
              <CircularProgress size={18} />
              <Typography variant="body2">
                Preparando vista previa...
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
