import { useCallback, useEffect, useMemo, useState } from "react";
import { Chip, Tooltip, Typography } from "@mui/material";
import CatalogoCrudPage, { EstadoChip, type CatalogoColumn, type CatalogoField } from "../components/CatalogoCrudPage";
import { CatalogoMantenimientoAction, type CatalogoCcResponsablePoiDto, type CatalogoCcResponsablePoiUpsertDto, type CatalogoComboDto } from "../CatalogoMantenimientoAction";

const initial: CatalogoCcResponsablePoiUpsertDto = {
  codigo: "",
  descripcion: "",
  idUnidadEjecutora: null,
  estado: "ACTIVO",
};

const comboLabel = (x: CatalogoComboDto) => x.display ?? `${x.codigo} - ${x.nombre}`;
const numberOrNull = (value: unknown): number | null => value === null || value === undefined || String(value).trim() === "" ? null : Number(value);

export default function CentroCostosResponsablePoiPage() {
  const [rows, setRows] = useState<CatalogoCcResponsablePoiDto[]>([]);
  const [unidadesEjecutoras, setUnidadesEjecutoras] = useState<CatalogoComboDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCombos = useCallback(async () => {
    setUnidadesEjecutoras(await CatalogoMantenimientoAction.getUnidadesEjecutorasCombo());
  }, []);

  useEffect(() => { void loadCombos(); }, [loadCombos]);

  const load = useCallback(async () => {
    try { setLoading(true); setError(null); setRows(await CatalogoMantenimientoAction.getCcResponsablesPoi()); await loadCombos(); }
    catch (e) { setError(e instanceof Error ? e.message : "Error cargando responsables de centro de costo"); }
    finally { setLoading(false); }
  }, [loadCombos]);

  const columns = useMemo<CatalogoColumn<CatalogoCcResponsablePoiDto>[]>(() => [
    { key: "idCcResponsable", label: "ID", width: 90 },
    { key: "codigo", label: "Código", width: 120 },
    { key: "descripcion", label: "Descripción", render: (r: CatalogoCcResponsablePoiDto) => <Typography sx={{ fontWeight: 900 }}>{r.descripcion}</Typography> },
    { key: "idUnidadEjecutora", label: "ID UE", width: 100 },
    { key: "unidadEjecutoraCodigo", label: "Unidad Ejecutora", width: 300, render: (r: CatalogoCcResponsablePoiDto) => r.idUnidadEjecutora ? <Tooltip title={r.unidadEjecutoraNombre ?? ""}><Chip size="small" label={`${r.unidadEjecutoraCodigo ?? ""} - ${r.unidadEjecutoraNombre ?? ""}`} sx={{ maxWidth: 280, fontWeight: 900 }} /></Tooltip> : "—" },
    { key: "estado", label: "Estado", width: 120, render: (r: CatalogoCcResponsablePoiDto) => <EstadoChip value={r.estado} /> },
  ], []);

  const fields = useMemo<CatalogoField[]>(() => [
    { key: "codigo", label: "Código", required: true, grid: 4 },
    { key: "descripcion", label: "Descripción", required: true, grid: 8 },
    { key: "idUnidadEjecutora", label: "Unidad Ejecutora", type: "select", grid: 8, options: unidadesEjecutoras.map((x) => ({ value: x.id, label: comboLabel(x) })) },
    { key: "estado", label: "Estado", type: "estado", grid: 4 },
  ], [unidadesEjecutoras]);

  return (
    <CatalogoCrudPage<CatalogoCcResponsablePoiDto, CatalogoCcResponsablePoiUpsertDto>
      title="Catálogo: Responsable de Centro de Costo (POI)"
      subtitle="Mantenimiento de poi_centro_costos_responsable. Se muestra ID y se omiten campos de auditoría."
      rows={rows}
      loading={loading}
      error={error}
      columns={columns}
      fields={fields}
      idKey="idCcResponsable"
      searchKeys={["idCcResponsable", "codigo", "descripcion", "unidadEjecutoraCodigo", "unidadEjecutoraNombre"]}
      initialPayload={initial}
      onLoad={load}
      onCreate={CatalogoMantenimientoAction.createCcResponsablePoi}
      onUpdate={CatalogoMantenimientoAction.updateCcResponsablePoi}
      toPayload={(f: CatalogoCcResponsablePoiUpsertDto) => ({ ...initial, ...f, idUnidadEjecutora: numberOrNull(f.idUnidadEjecutora) })}
    />
  );
}
