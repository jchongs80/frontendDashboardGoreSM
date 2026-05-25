import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import CatalogoCrudPage, { EstadoChip, type CatalogoColumn, type CatalogoField } from "../components/CatalogoCrudPage";
import { CatalogoMantenimientoAction, type CatalogoComboDto, type CatalogoDimensionDto, type CatalogoDimensionUpsertDto } from "../CatalogoMantenimientoAction";

const initial: CatalogoDimensionUpsertDto = {
  codigo: "",
  nombre: "",
  descripcion: "",
  color: "#2563eb",
  icono: "",
  orden: null,
  estado: "ACTIVO",
  idInstrumento: 0,
};

const comboLabel = (x: CatalogoComboDto) => x.display ?? `${x.codigo} - ${x.nombre}`;
const safeHex = (value?: string | null) => /^#([0-9A-Fa-f]{3}){1,2}$/.test(value ?? "") ? value! : "#e5e7eb";
const numberOrNull = (value: unknown): number | null => value === null || value === undefined || String(value).trim() === "" ? null : Number(value);

export default function DimensionesPage() {
  const [rows, setRows] = useState<CatalogoDimensionDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<CatalogoComboDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCombos = useCallback(async () => {
    setInstrumentos(await CatalogoMantenimientoAction.getInstrumentosCombo());
  }, []);

  useEffect(() => { void loadCombos(); }, [loadCombos]);

  const load = useCallback(async () => {
    try { setLoading(true); setError(null); setRows(await CatalogoMantenimientoAction.getDimensiones()); }
    catch (e) { setError(e instanceof Error ? e.message : "Error cargando dimensiones"); }
    finally { setLoading(false); }
  }, []);

  const columns = useMemo<CatalogoColumn<CatalogoDimensionDto>[]>(() => [
    { key: "idDimension", label: "ID", width: 90 },
    { key: "codigo", label: "Código", width: 120 },
    { key: "nombre", label: "Nombre", render: (r: CatalogoDimensionDto) => <Typography sx={{ fontWeight: 900 }}>{r.nombre}</Typography> },
    { key: "color", label: "Color", width: 130, render: (r: CatalogoDimensionDto) => {
      const color = safeHex(r.color);
      return <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Box sx={{ width: 18, height: 18, borderRadius: 1.2, bgcolor: color, border: "1px solid rgba(15,23,42,.20)", boxShadow: `0 0 0 4px ${color}22` }} /><Typography sx={{ fontSize: 12, fontWeight: 800 }}>{color}</Typography></Box>;
    }},
    { key: "orden", label: "Orden", width: 90 },
    { key: "idInstrumento", label: "ID Instrumento", width: 130 },
    { key: "instrumentoCodigo", label: "Instrumento", width: 200, render: (r: CatalogoDimensionDto) => <Chip size="small" label={`${r.instrumentoCodigo ?? ""} - ${r.instrumentoNombre ?? ""}`} sx={{ fontWeight: 900 }} /> },
    { key: "descripcion", label: "Descripción", render: (r: CatalogoDimensionDto) => <Tooltip title={r.descripcion ?? ""}><Typography sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.descripcion ?? "—"}</Typography></Tooltip> },
    { key: "estado", label: "Estado", width: 120, render: (r: CatalogoDimensionDto) => <EstadoChip value={r.estado} /> },
  ], []);

  const fields = useMemo<CatalogoField[]>(() => [
    { key: "codigo", label: "Código", required: true, grid: 4 },
    { key: "nombre", label: "Nombre", required: true, grid: 8 },
    { key: "idInstrumento", label: "Instrumento", type: "select", required: true, grid: 8, options: instrumentos.map((x) => ({ value: x.id, label: comboLabel(x) })) },
    { key: "estado", label: "Estado", type: "estado", grid: 4 },
    { key: "descripcion", label: "Descripción", type: "textarea", grid: 12 },
    { key: "color", label: "Color", type: "color", grid: 4 },
    { key: "icono", label: "Icono", grid: 4 },
    { key: "orden", label: "Orden", type: "number", grid: 4 },
  ], [instrumentos]);

  return (
    <CatalogoCrudPage<CatalogoDimensionDto, CatalogoDimensionUpsertDto>
      title="Catálogo: Dimensiones"
      subtitle="Mantenimiento de cat_dimensiones. Se muestra ID y se omiten campos de auditoría."
      rows={rows}
      loading={loading}
      error={error}
      columns={columns}
      fields={fields}
      idKey="idDimension"
      searchKeys={["idDimension", "codigo", "nombre", "descripcion", "instrumentoCodigo", "instrumentoNombre"]}
      initialPayload={initial}
      onLoad={load}
      onCreate={CatalogoMantenimientoAction.createDimension}
      onUpdate={CatalogoMantenimientoAction.updateDimension}
      toPayload={(f: CatalogoDimensionUpsertDto) => ({ ...initial, ...f, idInstrumento: Number(f.idInstrumento), orden: numberOrNull(f.orden) })}
    />
  );
}
