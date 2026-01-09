import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
      <Typography sx={{ fontSize: 13.5, fontWeight: 800 }}>
        {value ?? "—"}
      </Typography>
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

  const columns = useMemo<ColumnDef<FuenteDatoDto>[]>(
    () => [
      { key: "codigo", header: "Código", sortable: true, width: 110 },
      { key: "nombre", header: "Nombre", sortable: true },
      { key: "tipoFuente", header: "Tipo" },
      { key: "periodicidad", header: "Periodicidad" },
      { key: "responsable", header: "Responsable" },
      { key: "emailContacto", header: "Email" },
      {
        key: "url",
        header: "URL",
        render: (r) => (r.url ? (
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "primary.main" }}>
            {r.url}
          </Typography>
        ) : "—"),
      },
    ],
    []
  );

  const onView = (r: FuenteDatoDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  return (
    <>
      <CatalogoTablePage
        title="Catálogo: Fuentes de Datos"
        subtitle="Visualiza la lista (solo lectura por ahora)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idFuenteDatos}
        searchKeys={["codigo", "nombre", "tipoFuente", "periodicidad", "responsable", "emailContacto", "url"]}
        onRefresh={load}
        allowEdit={false}
        onView={onView}
      />

      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle — Fuente de Datos</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          {viewRow && (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #EEF2F7",
                  bgcolor: "#FAFBFD",
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