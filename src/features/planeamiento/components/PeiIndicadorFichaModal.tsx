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
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import {
  PeiOeiAeiVistaAction,
  type PeiIndicadorFichaArchivoDto,
} from "../PeiOeiAeiVistaAction";

type Props = {
  open: boolean;
  onClose: () => void;
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  tipoNivel?: "OEI" | "AEI" | string | null;
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

export default function PeiIndicadorFichaModal({
  open,
  onClose,
  idPeiOeiAei,
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

  const [ficha, setFicha] = useState<PeiIndicadorFichaArchivoDto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const codigoView = useMemo(() => safeText(codigoIndicador), [codigoIndicador]);
  const nombreView = useMemo(() => safeText(nombreIndicador), [nombreIndicador]);

  const loadFicha = async () => {
    if (!idPeiOeiAei || !idIndicadorNombre) {
      setFicha(null);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const data = await PeiOeiAeiVistaAction.getIndicadorFichaArchivo(
        idPeiOeiAei,
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
  }, [open, idPeiOeiAei, idIndicadorNombre]);

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
      await PeiOeiAeiVistaAction.guardarIndicadorFichaArchivo(
        idPeiOeiAei,
        idIndicadorNombre,
        selectedFile
      );

      setSelectedFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await loadFicha();

      setSuccessMsg(
        "La ficha del indicador PEI se guardó correctamente.",
      );
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
      await PeiOeiAeiVistaAction.descargarIndicadorFichaArchivo(
        idPeiOeiAei,
        idIndicadorNombre,
        ficha.nombreOriginal ?? "ficha_indicador"
      );

      setSuccessMsg(
        "La ficha del indicador PEI se descargó correctamente.",
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
      const result = await PeiOeiAeiVistaAction.obtenerIndicadorFichaArchivoBlob(
        idPeiOeiAei,
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
            width: { xs: "calc(100vw - 24px)", sm: 620, md: 680 },
            maxWidth: "calc(100vw - 24px)",
            borderRadius: 4,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(248,251,255,.96) 100%)",
            boxShadow: "0 24px 70px rgba(15,23,42,.22)",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(15,23,42,.08)",
            background:
              "linear-gradient(90deg, rgba(239,246,255,.95) 0%, rgba(255,255,255,.98) 55%, rgba(255,255,255,.95) 100%)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: "#2563eb",
                background: "linear-gradient(135deg, rgba(219,234,254,.95), rgba(255,255,255,.92))",
                border: "1px solid rgba(37,99,235,.22)",
                flexShrink: 0,
              }}
            >
              <AttachFileRoundedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography sx={{ fontSize: 20, fontWeight: 950, letterSpacing: "-0.03em", color: "#0f172a" }}>
                  Ficha del Indicador PEI
                </Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={tipoNivel ?? "Detalle"}
                  sx={{ height: 24, borderRadius: 999, fontWeight: 950, color: "#15803d", background: "rgba(240,253,244,.9)", borderColor: "rgba(34,197,94,.25)" }}
                />
              </Stack>
              <Typography sx={{ mt: 0.25, fontSize: 12.5, color: "#64748b", fontWeight: 650 }} noWrap>
                Indicador: {nombreView}
              </Typography>
            </Box>
          </Stack>
          <Button onClick={onClose} sx={{ minWidth: "auto", p: 0.7, color: "#475569", borderRadius: 2 }}>
            <CloseRoundedIcon />
          </Button>
        </DialogTitle>

        <DialogContent
          sx={{
            px: { xs: 2.2, md: 3 },
            py: 3,
            background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(248,250,252,.86))",
          }}
        >
          {errorMsg ? <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{errorMsg}</Alert> : null}
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

          <Paper
            elevation={0}
            sx={{
              p: 2.4,
              borderRadius: 3,
              border: "1px solid rgba(191,219,254,.9)",
              background: "linear-gradient(180deg, rgba(239,246,255,.55), rgba(255,255,255,.95))",
              boxShadow: "0 14px 34px rgba(15,23,42,.06)",
            }}
          >
            <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.5 }}>
              <AttachFileRoundedIcon sx={{ color: "#2563eb" }} />
              <Typography sx={{ fontSize: 16, color: "#0f172a", fontWeight: 950 }}>Adjuntar ficha del indicador</Typography>
            </Stack>

            {loading ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={18} />
                <Typography sx={{ fontSize: 13, color: "#64748b", fontWeight: 700 }}>Cargando ficha...</Typography>
              </Stack>
            ) : (
              <Stack spacing={1.6}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 150px" }, gap: 1.4 }}>
                  <ReadonlyBox label="Archivo actual" value={ficha?.nombreOriginal ?? "Aún no se ha adjuntado ficha"} />
                  <ReadonlyBox label="Tamaño" value={ficha ? formatBytes(ficha.tamanioBytes) : "—"} />
                </Box>

                {selectedFile ? (
                  <Box sx={{ p: 1.5, borderRadius: 2.5, border: "1px solid rgba(37,99,235,.18)", background: "rgba(239,246,255,.8)" }}>
                    <Typography sx={{ fontSize: 12, color: "#2563eb", fontWeight: 950 }}>Archivo seleccionado para guardar</Typography>
                    <Typography sx={{ mt: 0.2, fontSize: 13, color: "#0f172a", fontWeight: 750, wordBreak: "break-word" }}>
                      {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </Typography>
                  </Box>
                ) : null}

                <Box>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: "none" }}
                    onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUploadRoundedIcon />}
                      onClick={() => {
                        if (inputRef.current) inputRef.current.value = "";
                        inputRef.current?.click();
                      }}
                      disabled={saving || downloading || previewLoading}
                      sx={{ height: 40, borderRadius: 2.2, fontWeight: 950 }}
                    >
                      Seleccionar archivo
                    </Button>
                    <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 650, wordBreak: "break-word" }}>
                      PDF, XLS o XLSX. Máximo 20 MB.
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end" sx={{ pt: 0.4 }}>
                  <Button variant="outlined" startIcon={<VisibilityRoundedIcon />} onClick={() => void visualizarFicha()} disabled={loading || saving || downloading || previewLoading || !ficha} sx={{ height: 40, borderRadius: 2.2, fontWeight: 950 }}>
                    {previewLoading ? "Visualizando..." : "Visualizar"}
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => void descargarFicha()} disabled={loading || saving || downloading || previewLoading || !ficha} sx={{ height: 40, borderRadius: 2.2, fontWeight: 950 }}>
                    {downloading ? "Descargando..." : "Descargar"}
                  </Button>
                  <Button variant="contained" onClick={guardarFicha} disabled={saving || downloading || previewLoading || !selectedFile} sx={{ height: 40, borderRadius: 2.2, fontWeight: 950, boxShadow: "0 12px 22px rgba(37,99,235,.24)" }}>
                    {saving ? "Guardando..." : "Guardar"}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>

          <Typography sx={{ color: "#64748b", display: "block", mt: 1.3, fontSize: 11.5, fontWeight: 650 }}>
            * La ficha se guarda por indicador dentro del OEI/AEI seleccionado. Al subir una nueva ficha, reemplaza la anterior.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.2, md: 3 }, py: 2.2, borderTop: "1px solid rgba(15,23,42,.08)", background: "rgba(255,255,255,.9)" }}>
          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose} variant="outlined" sx={{ minWidth: 130, height: 42, fontWeight: 900, borderRadius: 2.2 }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={cerrarPreview}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 4, overflow: "hidden", height: { xs: "85vh", md: "90vh" } } }}
      >
        <DialogTitle
          sx={{
            px: 2.5,
            py: 1.6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(15,23,42,.08)",
            background: "linear-gradient(90deg, rgba(239,246,255,.95), rgba(255,255,255,.98))",
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
            <VisibilityRoundedIcon fontSize="small" sx={{ color: "#2563eb" }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, lineHeight: 1.2 }}>Visualizar ficha del indicador</Typography>
              <Typography sx={{ color: "#64748b", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: { xs: 260, sm: 650 } }} title={previewFileName}>
                {previewFileName}
              </Typography>
            </Box>
          </Stack>
          <Button onClick={cerrarPreview} sx={{ minWidth: "auto", p: 0.7, color: "#475569", borderRadius: 2 }}>
            <CloseRoundedIcon />
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: "100%" }}>
          {previewUrl ? (
            <Box component="iframe" src={previewUrl} title={previewFileName || "Ficha del indicador"} sx={{ width: "100%", height: "100%", minHeight: { xs: "70vh", md: "78vh" }, border: 0, display: "block" }} />
          ) : (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2">Preparando vista previa...</Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={Boolean(successMsg)}
        autoHideDuration={3000}
        onClose={(_event, reason) => {
          if (reason === "clickaway") return;
          setSuccessMsg("");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMsg("")}
          sx={{
            width: "100%",
            minWidth: { xs: 280, sm: 440 },
            borderRadius: 2,
            fontWeight: 900,
            boxShadow: "0 14px 35px rgba(15,23,42,.22)",
          }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

function ReadonlyBox({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 850, mb: 0.55 }}>{label}</Typography>
      <Box sx={{ minHeight: 42, px: 1.5, py: 1, borderRadius: 2, border: "1px solid rgba(148,163,184,.34)", background: "rgba(255,255,255,.95)", display: "flex", alignItems: "center" }}>
        <Typography sx={{ fontSize: 13, color: "#0f172a", fontWeight: 750, lineHeight: 1.35, wordBreak: "break-word" }}>{value}</Typography>
      </Box>
    </Box>
  );
}