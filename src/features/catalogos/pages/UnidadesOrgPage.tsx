import { useCallback, useEffect, useMemo, useState } from "react";
import { Tooltip, Typography } from "@mui/material";
import CatalogoCrudPage, { EstadoChip, type CatalogoColumn, type CatalogoField } from "../components/CatalogoCrudPage";
import { CatalogoMantenimientoAction, type CatalogoComboDto, type CatalogoUnidadOrgDto, type CatalogoUnidadOrgUpsertDto } from "../CatalogoMantenimientoAction";

const initial: CatalogoUnidadOrgUpsertDto = {
  codigo: "",
  nombre: "",
  siglas: "",
  tipo: "",
  idUnidadPadre: null,
  responsableCargo: "",
  responsableNombre: "",
  email: "",
  telefono: "",
  estado: "ACTIVO",
};

const comboLabel = (x: CatalogoComboDto) => x.display ?? `${x.codigo} - ${x.nombre}`;
const numberOrNull = (value: unknown): number | null => value === null || value === undefined || String(value).trim() === "" ? null : Number(value);

export default function UnidadesOrgPage() {
  const [rows, setRows] = useState<CatalogoUnidadOrgDto[]>([]);
  const [unidades, setUnidades] = useState<CatalogoComboDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCombos = useCallback(async () => {
    setUnidades(await CatalogoMantenimientoAction.getUnidadesOrgCombo());
  }, []);

  useEffect(() => { void loadCombos(); }, [loadCombos]);

  const load = useCallback(async () => {
    try { setLoading(true); setError(null); setRows(await CatalogoMantenimientoAction.getUnidadesOrg()); await loadCombos(); }
    catch (e) { setError(e instanceof Error ? e.message : "Error cargando unidades organizacionales"); }
    finally { setLoading(false); }
  }, [loadCombos]);

  const columns = useMemo<CatalogoColumn<CatalogoUnidadOrgDto>[]>(() => [
    { key: "idUnidad", label: "ID", width: 80 },
    { key: "codigo", label: "Código", width: 120 },
    { key: "nombre", label: "Nombre", render: (r: CatalogoUnidadOrgDto) => <Typography sx={{ fontWeight: 900 }}>{r.nombre}</Typography> },
    { key: "siglas", label: "Siglas", width: 100 },
    { key: "tipo", label: "Tipo", width: 140 },
    { key: "idUnidadPadre", label: "ID Padre", width: 100 },
    { key: "unidadPadreNombre", label: "Unidad padre", render: (r: CatalogoUnidadOrgDto) => <Tooltip title={r.unidadPadreNombre ?? ""}><Typography sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.unidadPadreNombre ?? "—"}</Typography></Tooltip> },
    { key: "responsableNombre", label: "Responsable", width: 200 },
    { key: "email", label: "Email", width: 220 },
    { key: "estado", label: "Estado", width: 120, render: (r: CatalogoUnidadOrgDto) => <EstadoChip value={r.estado} /> },
  ], []);

  const fields = useMemo<CatalogoField[]>(() => [
    { key: "codigo", label: "Código", required: true, grid: 4 },
    { key: "nombre", label: "Nombre", required: true, grid: 8 },
    { key: "siglas", label: "Siglas", grid: 4 },
    { key: "tipo", label: "Tipo", grid: 4 },
    { key: "estado", label: "Estado", type: "estado", grid: 4 },
    { key: "idUnidadPadre", label: "Unidad padre", type: "select", grid: 12, options: unidades.map((x) => ({ value: x.id, label: comboLabel(x) })) },
    { key: "responsableCargo", label: "Cargo responsable", grid: 6 },
    { key: "responsableNombre", label: "Nombre responsable", grid: 6 },
    { key: "email", label: "Email", grid: 6 },
    { key: "telefono", label: "Teléfono", grid: 6 },
  ], [unidades]);

  return (
    <CatalogoCrudPage<CatalogoUnidadOrgDto, CatalogoUnidadOrgUpsertDto>
      title="Catálogo: Unidades Organizacionales"
      subtitle="Mantenimiento de cat_unidades_org. Se muestra ID y se omiten campos de auditoría."
      rows={rows}
      loading={loading}
      error={error}
      columns={columns}
      fields={fields}
      idKey="idUnidad"
      searchKeys={["idUnidad", "codigo", "nombre", "siglas", "tipo", "responsableNombre", "email"]}
      initialPayload={initial}
      onLoad={load}
      onCreate={CatalogoMantenimientoAction.createUnidadOrg}
      onUpdate={CatalogoMantenimientoAction.updateUnidadOrg}
      toPayload={(f: CatalogoUnidadOrgUpsertDto) => ({ ...initial, ...f, idUnidadPadre: numberOrNull(f.idUnidadPadre) })}
    />
  );
}
