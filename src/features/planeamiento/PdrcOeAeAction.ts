import { api } from "../../shared/api";

/** ===== DTOs ===== */

export type PoiAnioDto = { idPoiAnio: number; anio: number };

export type CcResponsableDto = {
  idCcResponsable: number;
  codigo: string | null;
  descripcion: string | null;
};

export type CentroCostoDto = {
  idCentroCosto: number;
  codigo: string | null;
  nombre: string | null;
};

export type PdrcOerListDto = {
  idObjetivo: number;
  codigo: string;
  enunciado: string;
};

export type PdrcAccionUnidadListDto = {
  idAccion: number;
  codigo: string;
  enunciado: string;
  yaAsignada?: boolean;
  asignadaAUnidad?: boolean;
};

export type PdrcOerAerAsignadoListDto = {
  idOerAer: number;
  idObjetivo: number;
  idAccion: number;
  codigoOer: string;
  enunciadoOer: string;
  codigoAer: string;
  enunciadoAer: string;
};

export type PeiOeiAeiDetalleRowDto = {
  idOei: number;
  oeiCodigo: string | null;
  oeiEnunciado: string | null;
  idAei: number | null;
  aeiCodigo: string | null;
  aeiEnunciado: string | null;
};

export type PeiResumenPorAerDto = {
  idAer: number;
  totalOei: number;
  totalAei: number;
};

export type AsignarAccionesPoiRequestDto = { idsAccion: number[] };

export const PdrcOeAeAction = {
  // ✅ Años
  async getAnios() {
    const resp = await api.get<PoiAnioDto[]>(`/api/PdrcOeAe/anios`);
    return resp ?? [];
  },

  // ✅ CC responsables por UE
  async getCcResponsablesByUe(idUe: number) {
    const resp = await api.get<CcResponsableDto[]>(`/api/PdrcOeAe/ue/${idUe}/cc-responsables`);
    return resp ?? [];
  },

  // ✅ Centros de costo por CC responsable
  async getCentrosCostoByCcResponsable(idCcResponsable: number) {
    const resp = await api.get<CentroCostoDto[]>(
      `/api/PdrcOeAe/cc-responsable/${idCcResponsable}/centros-costo`
    );
    return resp ?? [];
  },

  // ✅ Tabla principal (UE + CC + Año)
  async getAsignacionesOerAer(idUe: number, idCc: number, idPoiAnio: number) {
    const resp = await api.get<PdrcOerAerAsignadoListDto[]>(
      `/api/PdrcOeAe/ue/${idUe}/cc/${idCc}/anio/${idPoiAnio}/asignaciones`
    );
    return resp ?? [];
  },

  // ✅ OER disponibles por UE + CC + Año (modal)
  async getObjetivosByUeCc(idUe: number, idCc: number, idPoiAnio: number) {
    const resp = await api.get<PdrcOerListDto[]>(
      `/api/PdrcOeAe/ue/${idUe}/cc/${idCc}/anio/${idPoiAnio}/objetivos`
    );
    return resp ?? [];
  },

  // ✅ AER por OER + marca ya asignada por Año
  async getAccionesByObjetivoPoi(
    idObjetivo: number,
    idUe: number,
    idCc: number,
    idPoiAnio: number,
    incluirInactivos = false
  ) {
    const resp = await api.get<PdrcAccionUnidadListDto[]>(
      `/api/PdrcOeAe/objetivo/${idObjetivo}/acciones?idUe=${idUe}&idCc=${idCc}&idPoiAnio=${idPoiAnio}&incluirInactivos=${incluirInactivos}`
    );
    return resp ?? [];
  },

  // ✅ Asignar AER (institucional + poi_oer_aer por Año)
  async asignarAccionesPoi(idUe: number, idCc: number, idPoiAnio: number, idObjetivo: number, idsAccion: number[]) {
    const payload: AsignarAccionesPoiRequestDto = { idsAccion };
    await api.post(
      `/api/PdrcOeAe/ue/${idUe}/cc/${idCc}/anio/${idPoiAnio}/objetivo/${idObjetivo}/acciones/asignar`,
      payload
    );
    return true;
  },

  // ✅ Inactivar
  async inactivarOerAer(idOerAer: number) {
    await api.put(`/api/PdrcOeAe/oer-aer/${idOerAer}/inactivar`, {});
    return true;
  },

  // ✅ NUEVO: Resumen OEI/AEI por AER para un Centro de Costo (modelo nuevo)
  async getPeiResumenByAerCc(idCc: number, idsAer: number[]) {
    if (!idCc || !idsAer?.length) return [];
    const ids = idsAer.filter((x) => Number.isFinite(x) && x > 0).join(",");
    if (!ids) return [];
    const resp = await api.get<PeiResumenPorAerDto[]>(`/api/PdrcOeAe/cc/${idCc}/pei-resumen?idsAer=${ids}`);
    return resp ?? [];
  },

  // ✅ NUEVO: Detalle OEI-AEI (tabla única) por AER y Centro de Costo
  async getPeiDetalleOeiAeiByAerCc(idCc: number, idAer: number) {
    if (!idCc || !idAer) return [];
    const resp = await api.get<PeiOeiAeiDetalleRowDto[]>(`/api/PdrcOeAe/cc/${idCc}/aer/${idAer}/pei-detalle`);
    return resp ?? [];
  },
};

export default PdrcOeAeAction;