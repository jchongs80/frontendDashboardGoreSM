import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import CatalogoTablePage, { type ColumnDef } from "../components/CatalogoTablePage";
import { CatalogoAction, type UnidadMedidaDto } from "../CatalogoAction";

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

export default function UnidadesMedidaPage() {
  const [rows, setRows] = useState<UnidadMedidaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openView, setOpenView] = useState(false);
  const [viewRow, setViewRow] = useState<UnidadMedidaDto | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CatalogoAction.getUnidadesMedida();
      setRows(data);
    } catch (e: any) {
      setError(e.message ?? "Error cargando unidades de medida");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  const columns = useMemo<ColumnDef<UnidadMedidaDto>[]>(
    () => [
      { key: "codigo", header: "Código", sortable: true, width: 120 },
      { key: "nombre", header: "Nombre", sortable: true },
      { key: "simbolo", header: "Símbolo", width: 140 },
      { key: "tipo", header: "Tipo", width: 180 },
    ],
    []
  );

  const onView = (r: UnidadMedidaDto) => {
    setViewRow(r);
    setOpenView(true);
  };

  return (
    <>
      <CatalogoTablePage
        title="Catálogo: Unidades de Medida"
        subtitle="Visualiza la lista (solo lectura por ahora)."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        getRowId={(r) => r.idUnidadMedida}
        searchKeys={["codigo", "nombre", "simbolo", "tipo"]}
        onRefresh={load}
        allowEdit={false}
        onView={onView}
      />

      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Detalle — Unidad de Medida</DialogTitle>
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
                  gap: 1,
                }}
              >
                <Typography sx={{ fontWeight: 950, fontSize: 16 }}>
                  {viewRow.nombre}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                  {viewRow.tipo ?? "—"}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <LabelValue label="Código" value={viewRow.codigo} />
                <LabelValue label="Símbolo" value={viewRow.simbolo} />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenView(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}