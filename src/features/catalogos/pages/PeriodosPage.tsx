import { useCallback, useEffect, useMemo, useState } from "react";
import { Chip, Typography } from "@mui/material";
import CatalogoCrudPage, { EstadoChip, type CatalogoColumn, type CatalogoField } from "../components/CatalogoCrudPage";
import { CatalogoMantenimientoAction, type CatalogoComboDto, type CatalogoPeriodoDto, type CatalogoPeriodoUpsertDto } from "../CatalogoMantenimientoAction";

const initial: CatalogoPeriodoUpsertDto = { codigo: "", descripcion: "", estado: true, idInstrumento: 0 };

const comboLabel = (x: CatalogoComboDto) => x.display ?? `${x.codigo} - ${x.nombre}`;
const toBoolean = (value: unknown): boolean => value === true || String(value).toLowerCase() === "true";

export default function PeriodosPage() {
  const [rows, setRows] = useState<CatalogoPeriodoDto[]>([]);
  const [instrumentos, setInstrumentos] = useState<CatalogoComboDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCombos = useCallback(async () => {
    setInstrumentos(await CatalogoMantenimientoAction.getInstrumentosCombo());
  }, []);

  useEffect(() => { void loadCombos(); }, [loadCombos]);

  const load = useCallback(async () => {
    try { setLoading(true); setError(null); setRows(await CatalogoMantenimientoAction.getPeriodos()); }
    catch (e) { setError(e instanceof Error ? e.message : "Error cargando periodos"); }
    finally { setLoading(false); }
  }, []);

  const columns = useMemo<CatalogoColumn<CatalogoPeriodoDto>[]>(() => [
    { key: "idPeriodo", label: "ID", width: 90 },
    { key: "codigo", label: "Código", width: 140 },
    { key: "descripcion", label: "Descripción", render: (r: CatalogoPeriodoDto) => <Typography sx={{ fontWeight: 900 }}>{r.descripcion}</Typography> },
    { key: "idInstrumento", label: "ID Instrumento", width: 130 },
    { key: "instrumentoCodigo", label: "Instrumento", width: 180, render: (r: CatalogoPeriodoDto) => <Chip size="small" label={`${r.instrumentoCodigo ?? ""} - ${r.instrumentoNombre ?? ""}`} sx={{ fontWeight: 900 }} /> },
    { key: "estado", label: "Estado", width: 120, render: (r: CatalogoPeriodoDto) => <EstadoChip value={r.estado} /> },
  ], []);

  const fields = useMemo<CatalogoField[]>(() => [
    { key: "codigo", label: "Código", required: true, grid: 4 },
    { key: "descripcion", label: "Descripción", required: true, grid: 8 },
    { key: "idInstrumento", label: "Instrumento", type: "select", required: true, grid: 8, options: instrumentos.map((x) => ({ value: x.id, label: comboLabel(x) })) },
    { key: "estado", label: "Estado", type: "boolean", grid: 4 },
  ], [instrumentos]);

  return (
    <CatalogoCrudPage<CatalogoPeriodoDto, CatalogoPeriodoUpsertDto>
      title="Catálogo: Periodos"
      subtitle="Mantenimiento de periodo. Se muestra ID y se omiten campos de auditoría."
      rows={rows}
      loading={loading}
      error={error}
      columns={columns}
      fields={fields}
      idKey="idPeriodo"
      searchKeys={["idPeriodo", "codigo", "descripcion", "instrumentoCodigo", "instrumentoNombre"]}
      initialPayload={initial}
      onLoad={load}
      onCreate={CatalogoMantenimientoAction.createPeriodo}
      onUpdate={CatalogoMantenimientoAction.updatePeriodo}
      toPayload={(f: CatalogoPeriodoUpsertDto) => ({ ...initial, ...f, estado: toBoolean(f.estado), idInstrumento: Number(f.idInstrumento) })}
    />
  );
}
