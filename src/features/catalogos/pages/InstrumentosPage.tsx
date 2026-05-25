import { useCallback, useMemo, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import CatalogoCrudPage, { EstadoChip, type CatalogoColumn, type CatalogoField } from "../components/CatalogoCrudPage";
import { CatalogoMantenimientoAction, type CatalogoInstrumentoDto, type CatalogoInstrumentoUpsertDto } from "../CatalogoMantenimientoAction";

const initial: CatalogoInstrumentoUpsertDto = {
  codigo: "",
  nombre: "",
  descripcion: "",
  horizonteTemporal: "",
  nivel: "",
  vigenciaDesde: null,
  vigenciaHasta: null,
  estado: "ACTIVO",
  archivoDocumento: "",
  fechaAprobacion: null,
  resolucionAprobacion: "",
};

function cleanDate(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 10) : null;
}

export default function InstrumentosPage() {
  const [rows, setRows] = useState<CatalogoInstrumentoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRows(await CatalogoMantenimientoAction.getInstrumentos());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando instrumentos");
    } finally {
      setLoading(false);
    }
  }, []);

  const columns = useMemo<CatalogoColumn<CatalogoInstrumentoDto>[]>(() => [
    { key: "idInstrumento", label: "ID", width: 80 },
    { key: "codigo", label: "Código", width: 110 },
    { key: "nombre", label: "Nombre", render: (r: CatalogoInstrumentoDto) => <Typography sx={{ fontWeight: 900 }}>{r.nombre}</Typography> },
    { key: "nivel", label: "Nivel", width: 140, render: (r: CatalogoInstrumentoDto) => r.nivel ? <Chip size="small" label={r.nivel} sx={{ fontWeight: 900 }} /> : "—" },
    { key: "horizonteTemporal", label: "Horizonte", width: 140 },
    { key: "vigenciaDesde", label: "Vigencia desde", width: 130, render: (r: CatalogoInstrumentoDto) => r.vigenciaDesde?.slice(0, 10) ?? "—" },
    { key: "vigenciaHasta", label: "Vigencia hasta", width: 130, render: (r: CatalogoInstrumentoDto) => r.vigenciaHasta?.slice(0, 10) ?? "—" },
    { key: "estado", label: "Estado", width: 120, render: (r: CatalogoInstrumentoDto) => <EstadoChip value={r.estado} /> },
  ], []);

  const fields = useMemo<CatalogoField[]>(() => [
    { key: "codigo", label: "Código", required: true, grid: 4 },
    { key: "nombre", label: "Nombre", required: true, grid: 8 },
    { key: "descripcion", label: "Descripción", type: "textarea", grid: 12 },
    { key: "horizonteTemporal", label: "Horizonte temporal", grid: 4 },
    { key: "nivel", label: "Nivel", grid: 4 },
    { key: "estado", label: "Estado", type: "estado", grid: 4 },
    { key: "vigenciaDesde", label: "Vigencia desde", type: "date", grid: 4 },
    { key: "vigenciaHasta", label: "Vigencia hasta", type: "date", grid: 4 },
    { key: "fechaAprobacion", label: "Fecha aprobación", type: "date", grid: 4 },
    { key: "resolucionAprobacion", label: "Resolución aprobación", grid: 6 },
    { key: "archivoDocumento", label: "Archivo documento / URL", grid: 6 },
  ], []);

  return (
    <Box>
      <CatalogoCrudPage<CatalogoInstrumentoDto, CatalogoInstrumentoUpsertDto>
        title="Catálogo: Instrumentos"
        subtitle="Mantenimiento de cat_instrumentos. Se muestra ID y se omiten campos de auditoría."
        rows={rows}
        loading={loading}
        error={error}
        columns={columns}
        fields={fields}
        idKey="idInstrumento"
        searchKeys={["idInstrumento", "codigo", "nombre", "nivel", "horizonteTemporal"]}
        initialPayload={initial}
        onLoad={load}
        onCreate={CatalogoMantenimientoAction.createInstrumento}
        onUpdate={CatalogoMantenimientoAction.updateInstrumento}
        toPayload={(f: CatalogoInstrumentoUpsertDto) => ({
          ...initial,
          ...f,
          vigenciaDesde: cleanDate(f.vigenciaDesde),
          vigenciaHasta: cleanDate(f.vigenciaHasta),
          fechaAprobacion: cleanDate(f.fechaAprobacion),
        })}
      />
    </Box>
  );
}
