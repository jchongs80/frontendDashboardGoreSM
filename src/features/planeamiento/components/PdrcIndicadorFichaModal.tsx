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
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";


import {
  PdrcOerAerVistaAction,
  type PdrcIndicadorFichaArchivoDto,
} from "../PdrcOerAerVistaAction";

type Props = {
  open: boolean;
  onClose: () => void;
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  tipoNivel?: "OER" | "AER" | string | null;
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
  const ok = name.endsWith(".pdf") || name.endsWith(".xls") || name.endsWith(".xlsx");

  if (!ok) return "Solo se permiten archivos PDF, XLS o XLSX.";
  if (file.size > 20_000_000) return "El archivo no debe superar los 20 MB.";

  return "";
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0,0,0,0.18)",
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
  border: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 10px 24px rgba(0,0,0,.06)",
} as const;

export default function PdrcIndicadorFichaModal({
  open,
  onClose,
  idPdrcOerAer,
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

  const [ficha, setFicha] = useState<PdrcIndicadorFichaArchivoDto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const codigoView = useMemo(() => safeText(codigoIndicador), [codigoIndicador]);
  const nombreView = useMemo(() => safeText(nombreIndicador), [nombreIndicador]);

  const archivoMostrado = selectedFile
    ? selectedFile.name
    : ficha?.nombreOriginal ?? "Aún no se ha adjuntado ficha";

  const tamanioMostrado = selectedFile
    ? formatBytes(selectedFile.size)
    : ficha
      ? formatBytes(ficha.tamanioBytes)
      : "—";

  const labelArchivoMostrado = selectedFile ? "Archivo seleccionado para guardar" : "Archivo actual";
  const labelTamanioMostrado = selectedFile ? "Tamaño seleccionado" : "Tamaño";

  const loadFicha = async () => {
    if (!idPdrcOerAer || !idIndicadorNombre) {
      setFicha(null);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const data = await PdrcOerAerVistaAction.getIndicadorFichaArchivo(
        idPdrcOerAer,
        idIndicadorNombre
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
  }, [open, idPdrcOerAer, idIndicadorNombre]);

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
      await PdrcOerAerVistaAction.guardarIndicadorFichaArchivo(
        idPdrcOerAer,
        idIndicadorNombre,
        selectedFile
      );

      setSuccessMsg("Ficha del indicador guardada correctamente.");
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
      await PdrcOerAerVistaAction.descargarIndicadorFichaArchivo(
        idPdrcOerAer,
        idIndicadorNombre,
        ficha.nombreOriginal ?? "ficha_indicador"
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
      const result = await PdrcOerAerVistaAction.obtenerIndicadorFichaArchivoBlob(
        idPdrcOerAer,
        idIndicadorNombre,
        ficha.nombreOriginal ?? "ficha_indicador"
      );

      const fileName = result.fileName || ficha.nombreOriginal || "ficha_indicador";

      const contentType = (
        result.contentType ||
        result.blob.type ||
        ficha.contentType ||
        ""
      ).toLowerCase();

      const isPdf = contentType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setErrorMsg(
          "La visualización en línea está disponible para archivos PDF. Para archivos Excel use el botón DESCARGAR."
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
        fullWidth={false}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: "calc(100vw - 24px)", sm: 620 },
            maxWidth: "calc(100vw - 24px)",
            borderRadius: 4,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(248,251,255,.96) 100%)",
            boxShadow: "0 24px 70px rgba(15,23,42,.24)",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2.1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(15,23,42,.08)",
            background:
              "linear-gradient(90deg, rgba(240,253,244,.95) 0%, rgba(255,255,255,.98) 52%, rgba(255,255,255,.94) 100%)",
          }}
        >
          <Stack direction="row" spacing={1.4} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#16a34a",
                background: "linear-gradient(135deg, rgba(220,252,231,.95), rgba(255,255,255,.92))",
                border: "1px solid rgba(34,197,94,.22)",
                boxShadow: "0 12px 26px rgba(34,197,94,.12)",
                flexShrink: 0,
              }}
            >
              <AttachFileRoundedIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography sx={{ fontWeight: 950, fontSize: 20, letterSpacing: "-0.03em", color: "#0f172a" }}>
                  Ficha del Indicador PDRC
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={tipoNivel ?? "Detalle"}
                  sx={{
                    height: 24,
                    borderRadius: 999,
                    fontWeight: 950,
                    color: "#15803d",
                    borderColor: "rgba(34,197,94,.25)",
                    background: "rgba(220,252,231,.75)",
                  }}
                />
              </Stack>
              <Typography sx={{ color: "#64748b", fontSize: 12.5, mt: 0.25, fontWeight: 600 }} noWrap>
                Indicador: {nombreView}
              </Typography>
            </Box>
          </Stack>

          <Button
            onClick={onClose}
            sx={{
              minWidth: "auto",
              p: 0.8,
              color: "#475569",
              borderRadius: 2,
            }}
          >
            <CloseRoundedIcon />
          </Button>
        </DialogTitle>

        <Divider />

        <DialogContent
          sx={{
            px: { xs: 2.2, md: 3 },
            py: 3,
            background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.88))",
          }}
        >
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
              p: 2,
              mb: 2,
              borderRadius: 3,
              border: "1px solid rgba(148,163,184,.28)",
              background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,250,252,.96))",
              boxShadow: "0 10px 28px rgba(15,23,42,.05)",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "64px 142px 1px 1fr" },
                gap: { xs: 1.4, sm: 2 },
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#15803d",
                  background: "linear-gradient(135deg, rgba(220,252,231,.95), rgba(255,255,255,.92))",
                  border: "1px solid rgba(34,197,94,.25)",
                  boxShadow: "0 12px 26px rgba(34,197,94,.12)",
                }}
              >
                <DescriptionRoundedIcon />
              </Box>

              <Box>
                <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 900 }}>Código</Typography>
                <Typography sx={{ mt: 0.45, fontSize: 14, color: "#0f172a", fontWeight: 950 }}>
                  {codigoView}
                </Typography>
              </Box>

              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />

              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={0.8} alignItems="center" useFlexGap flexWrap="wrap">
                  <Typography sx={{ fontSize: 12, color: "#334155", fontWeight: 950 }}>
                    Nivel: {safeText(tipoNivel)}
                  </Typography>
                  <Chip
                    size="small"
                    label="Archivo de ficha"
                    sx={{
                      height: 22,
                      borderRadius: 999,
                      fontWeight: 950,
                      color: "#1d4ed8",
                      background: "rgba(219,234,254,.95)",
                      border: "1px solid rgba(37,99,235,.22)",
                    }}
                  />
                </Stack>
                <Typography sx={{ mt: 0.55, fontSize: 12, color: "#475569", fontWeight: 750, lineHeight: 1.45 }}>
                  Indicador: {nombreView}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...sectionCardSx, p: { xs: 2.1, md: 2.5 }, border: "1px solid rgba(191,219,254,.9)", background: "rgba(255,255,255,.92)" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <AttachFileRoundedIcon fontSize="small" />
              <Typography sx={{ fontWeight: 950 }}>Adjuntar ficha del indicador</Typography>
            </Stack>

            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando ficha...</Typography>
              </Stack>
            ) : (
              <Stack spacing={1.4}>
                <TextField
                  label={labelArchivoMostrado}
                  size="small"
                  fullWidth
                  value={archivoMostrado}
                  sx={{
                    ...fieldSx,
                    ...(selectedFile
                      ? {
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2.5,
                            backgroundColor: "rgba(239,246,255,0.98)",
                            fontWeight: 800,
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(37,99,235,0.65)",
                          },
                        }
                      : {}),
                  }}
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label={labelTamanioMostrado}
                  size="small"
                  fullWidth
                  value={tamanioMostrado}
                  sx={fieldSx}
                  InputProps={{ readOnly: true }}
                />

                <Box>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: "none" }}
                    onClick={(e) => {
                      // Permite volver a seleccionar el mismo archivo y disparar onChange nuevamente.
                      (e.currentTarget as HTMLInputElement).value = "";
                    }}
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
                      sx={{ borderRadius: 2, fontWeight: 900 }}
                    >
                      SELECCIONAR ARCHIVO
                    </Button>

                    <Typography
                      variant="body2"
                      sx={{
                        color: selectedFile ? "primary.main" : "text.secondary",
                        fontWeight: selectedFile ? 900 : 400,
                        wordBreak: "break-word",
                      }}
                    >
                      {selectedFile
                        ? `Archivo listo para guardar: ${selectedFile.name} (${formatBytes(selectedFile.size)})`
                        : "PDF, XLS o XLSX. Máximo 20 MB."}
                    </Typography>
                  </Stack>
                </Box>

                {selectedFile ? (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Archivo seleccionado: <b>{selectedFile.name}</b>. Presione <b>GUARDAR</b> para adjuntarlo al indicador.
                  </Alert>
                ) : null}

                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 0.5 }}>
                  <Button
                    variant="outlined"
                    startIcon={<VisibilityRoundedIcon />}
                    onClick={() => void visualizarFicha()}
                    disabled={loading || saving || downloading || previewLoading || !ficha}
                    sx={{ borderRadius: 2, fontWeight: 900 }}
                  >
                    {previewLoading ? "Visualizando..." : "VISUALIZAR"}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={() => void descargarFicha()}
                    disabled={loading || saving || downloading || previewLoading || !ficha}
                    sx={{ borderRadius: 2, fontWeight: 900 }}
                  >
                    {downloading ? "Descargando..." : "DESCARGAR"}
                  </Button>

                  <Button
                    variant="contained"
                    onClick={guardarFicha}
                    disabled={saving || downloading || previewLoading || !selectedFile}
                    sx={{ borderRadius: 2, fontWeight: 900 }}
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
            * La ficha se guarda por indicador dentro del OER/AER seleccionado. Al subir una nueva
            ficha, reemplaza la anterior.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Box sx={{ flex: 1 }} />

          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ fontWeight: 900, borderRadius: 2, px: 2.5 }}
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
              "linear-gradient(180deg, rgba(27,111,238,0.10) 0%, rgba(27,111,238,0) 100%)",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
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
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Preparando vista previa...</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}