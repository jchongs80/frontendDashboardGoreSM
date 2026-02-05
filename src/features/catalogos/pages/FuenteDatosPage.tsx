import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Tooltip,
  Typography,
} from "@mui/material";

import CatalogoTablePage, { type ColumnDef } from "../components/CatalogoTablePage";
import { CatalogoAction, type FuenteDatoDto } from "../CatalogoAction";

function LabelValue({ label, value }: { label: string; value?: any }) {
  return (
    <Box sx={{ display: "grid", gap: 0.3 }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>{value ?? "—"}</Typography>
    </Box>
  );
}

export default function FuenteDatosPage() {
  const [rows, setRows] = useState<FuenteDatoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<FuenteDatoDto | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CatalogoAction.getFuentesDatos();
      setRows(data);
    } catch (e: any) {
      setError(e.message ?? "Error cargando fuentes de datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const columns = useMemo<ColumnDef<FuenteDatoDto>[]>(() => {
    return [
      { key: "codigo", header: "Código", sortable: true, width: 110 },

      // ✅ Nombre con jerarquía visual (premium)
      {
        key: "nombre",
        header: "Nombre",
        sortable: true,
        render: (r) => (
          <Typography sx={{ fontWeight: 950, lineHeight: 1.15 }}>
            {r.nombre}
          </Typography>
        ),
      },

      // ✅ Tipo como Chip
      {
        key: "tipoFuente",
        header: "Tipo",
        render: (r) =>
          r.tipoFuente ? (
            <Chip
              size="small"
              label={r.tipoFuente}
              sx={{
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: "rgba(59,130,246,.10)",
                border: "1px solid rgba(59,130,246,.25)",
              }}
            />
          ) : (
            "—"
          ),
      },

      // ✅ Periodicidad como Chip
      {
        key: "periodicidad",
        header: "Periodicidad",
        render: (r) =>
          r.periodicidad ? (
            <Chip
              size="small"
              label={r.periodicidad}
              sx={{
                fontWeight: 900,
                borderRadius: 999,
                bgcolor: "rgba(16,185,129,.10)",
                border: "1px solid rgba(16,185,129,.25)",
              }}
            />
          ) : (
            "—"
          ),
      },

      { key: "responsable", header: "Responsable" },

      // ✅ Email con estilo y tooltip
      {
        key: "emailContacto",
        header: "Email",
        render: (r) =>
          r.emailContacto ? (
            <Tooltip title={r.emailContacto} arrow>
              <Typography
                component="a"
                href={`mailto:${r.emailContacto}`}
                sx={{
                  fontSize: 12.5,
                  fontWeight: 900,
                  color: "primary.main",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {r.emailContacto}
              </Typography>
            </Tooltip>
          ) : (
            "—"
          ),
      },

      // ✅ URL: elegancia (ellipsis + tooltip)
      {
        key: "url",
        header: "URL",
        render: (r) =>
          r.url ? (
            <Tooltip title={r.url} arrow placement="top-start">
              <Typography
                sx={{
                  fontSize: 12.5,
                  fontWeight: 900,
                  color: "primary.main",
                  maxWidth: 360,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.url}
              </Typography>
            </Tooltip>
          ) : (
            "—"
          ),
      },
    ];
  }, []);

  const onView = (r: FuenteDatoDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  return (
    <>
      {/* ✅ Skin premium IDENTICO al de Dimensiones (header, sticky, accent line, etc.) */}
      <Box
        sx={{
          "& .MuiTableContainer-root": {
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid rgba(2,6,23,.08)",
            boxShadow: "0 10px 30px rgba(2,6,23,.06)",
          },

          "& .MuiTableHead-root .MuiTableCell-head": {
            position: "sticky",
            top: 0,
            zIndex: 2,
            background:
              "linear-gradient(180deg, rgba(15,118,110,.12) 0%, rgba(15,118,110,.06) 60%, rgba(255,255,255,1) 100%)",
            backdropFilter: "blur(6px)",
            fontWeight: 900,
            letterSpacing: ".4px",
            color: "rgba(2,6,23,.85)",
            borderBottom: "1px solid rgba(2,6,23,.12)",
            boxShadow: "inset 0 -1px 0 rgba(2,6,23,.06)",
          },

          "& .MuiTableHead-root": { position: "relative" },
          "& .MuiTableHead-root::before": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 3,
            background:
              "linear-gradient(90deg, rgba(59,130,246,.9), rgba(16,185,129,.9), rgba(249,115,22,.9))",
            opacity: 0.85,
            zIndex: 3,
          },

          "& .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root": {
            backgroundColor: "rgba(15,118,110,.04)",
          },
        }}
      >
        <CatalogoTablePage
          title="Catálogo: Fuentes de Datos"
          subtitle="Visualiza la lista (solo lectura por ahora)."
          rows={rows}
          loading={loading}
          error={error}
          columns={columns}
          getRowId={(r) => r.idFuenteDatos}
          searchKeys={[
            "codigo",
            "nombre",
            "tipoFuente",
            "periodicidad",
            "responsable",
            "emailContacto",
            "url",
          ]}
          onRefresh={load}
          allowEdit={false}
          onView={onView}
        />
      </Box>

      {/* ✅ Modal también con toque premium (ligero) */}
      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            fontWeight: 950,
            position: "relative",
            background:
              "linear-gradient(180deg, rgba(15,118,110,.10) 0%, rgba(255,255,255,1) 85%)",
            borderBottom: "1px solid rgba(2,6,23,.08)",
          }}
        >
          Detalle — Fuente de Datos
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 3,
              background:
                "linear-gradient(90deg, rgba(59,130,246,.9), rgba(16,185,129,.9), rgba(249,115,22,.9))",
              opacity: 0.85,
            }}
          />
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid rgba(2,6,23,.08)",
                  bgcolor: "rgba(2,6,23,.02)",
                  display: "grid",
                  gap: 1.5,
                }}
              >
                <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                  {viewRow.nombre}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  {viewRow.descripcion ?? "—"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <LabelValue label="Código" value={viewRow.codigo} />
                <LabelValue label="Tipo" value={viewRow.tipoFuente} />
                <LabelValue label="Periodicidad" value={viewRow.periodicidad} />
                <LabelValue label="Responsable" value={viewRow.responsable} />
                <LabelValue label="Email contacto" value={viewRow.emailContacto} />
                <LabelValue label="URL" value={viewRow.url} />
              </Box>

              <Divider />
              <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                * Edición se habilitará cuando el backend exponga endpoint PUT para este catálogo.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
          {viewRow?.url && (
            <Button
              variant="contained"
              onClick={() => window.open(viewRow.url!, "_blank", "noopener,noreferrer")}
            >
              Abrir URL
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
