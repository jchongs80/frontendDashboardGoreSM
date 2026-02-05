import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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
      </Box>


      <Dialog open={openView} onClose={() => setOpenView(false)} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            fontWeight: 950,
            position: "relative",
            background: "linear-gradient(180deg, rgba(15,118,110,.10) 0%, rgba(255,255,255,1) 85%)",
            borderBottom: "1px solid rgba(2,6,23,.08)",
          }}
        >
          Detalle — Unidad de Medida
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 3,
              background: "linear-gradient(90deg, rgba(59,130,246,.9), rgba(16,185,129,.9), rgba(249,115,22,.9))",
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