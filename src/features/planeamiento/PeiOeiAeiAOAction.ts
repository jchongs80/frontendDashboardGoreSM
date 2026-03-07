import { api } from "../../shared/api";

export type PoiAnioDto = { idPoiAnio: number; anio: number };
export type CcResponsableDto = { idCcResponsable: number; codigo: string | null; descripcion: string | null };
export type CentroCostoDto = { idCentroCosto: number; codigo: string | null; nombre: string | null };

export type PeiOeiAeiAoMasterDto = {
  idOer: number;
  oerCodigo: string;
  oerEnunciado: string;

  idAer: number;
  aerCodigo: string;
  aerEnunciado: string;

  idOei: number;
  oeiCodigo: string;
  oeiEnunciado: string;

  idAei: number;
  aeiCodigo: string;
  aeiEnunciado: string;

  totalAo: number;
};

export type PeiOeiAeiAoDetailDto = {
  idOeiAeiAo: number;
  nroRegistroPoi: string;
  codigoAo: string;
  nombreAo: string;
};

// ✅ DTO del modal (byId)
export type PeiOeiAeiAoByIdDto = {
  idOeiAeiAo: number;
  nroRegistroPoi: string | null;
  codigoAo: string | null;

  categoriaCodigo?: string | null;
  categoriaNombre?: string | null;

  productoProyectoCodigo?: string | null;
  productoProyectoNombre?: string | null;

  funcionCodigo?: string | null;
  funcionNombre?: string | null;

  divisionCodigo?: string | null;
  divisionNombre?: string | null;

  grupoCodigo?: string | null;
  grupoNombre?: string | null;

  actividadPresupCodigo?: string | null;
  actividadPresupNombre?: string | null;

  actividadOperativaNombre?: string | null;

  // aunque venga del API, el modal no lo mostrará (según tu requerimiento)
  fechaCreacion?: string | null;
  usuarioCreacion?: string | null;
  ipCreacion?: string | null;
  fechaModificacion?: string | null;
  usuarioModificacion?: string | null;
  ipModificacion?: string | null;
  // ✅ NUEVO
  aoSectorialCodigo?: string | null;
  aoSectorialNombre?: string | null;
    // ✅ NUEVO: Detalle (poi_oei_aei_ao)
  acumulado?: string | null;
  consPia?: string | null;
  consPim?: string | null;
  tipoFinPia?: string | null;
  tipoFinPim?: string | null;
  tipo?: string | null;

  // ✅ NUEVO: labels (joins)
  prioridadCodigo?: string | null;
  prioridadNombre?: string | null;

  umCodigo?: string | null;
  umNombre?: string | null;

  departamentoCodigo?: string | null;
  departamentoNombre?: string | null;

  provinciaCodigo?: string | null;
  provinciaNombre?: string | null;

  distritoCodigo?: string | null;
  distritoNombre?: string | null;
};

export type PoiAoIndicadorDto = {
  idIndicador: number;
  codigo: string;
  nombre: string;
  unidad: string;
  orden: number;
};

export type PoiAoIndicadorMesValueDto = {
  idIndicador: number;
  mes: number;     // 1..12
  valor: number;   // numeric(18,2)
};

export type PoiAoIndicadorMesResponseDto = {
  indicadores: PoiAoIndicadorDto[];
  valores: PoiAoIndicadorMesValueDto[];
};

export const PeiOeiAeiAOAction = {
  async getAnios() {
    return (await api.get<PoiAnioDto[]>(`/api/PdrcOeAe/anios`)) ?? [];
  },
  async getCcResponsablesByUe(idUe: number) {
    return (await api.get<CcResponsableDto[]>(`/api/PdrcOeAe/ue/${idUe}/cc-responsables`)) ?? [];
  },
  async getCentrosCostoByCcResponsable(idCcResp: number) {
    return (await api.get<CentroCostoDto[]>(`/api/PdrcOeAe/cc-responsable/${idCcResp}/centros-costo`)) ?? [];
  },

  async getMaster(idUe: number, idCc: number, idPoiAnio: number) {
    return (
      (await api.get<PeiOeiAeiAoMasterDto[]>(`/api/PeiOeiAeiAo/ue/${idUe}/cc/${idCc}/anio/${idPoiAnio}/master`)) ??
      []
    );
  },
  async getDetailByAei(idAei: number) {
    return (await api.get<PeiOeiAeiAoDetailDto[]>(`/api/PeiOeiAeiAo/aei/${idAei}/detail`)) ?? [];
  },

  // ✅ nuevo: por idOeiAeiAo (para el modal)
  async getAoById(idOeiAeiAo: number) {
    return (await api.get<PeiOeiAeiAoByIdDto>(`/api/PeiOeiAeiAo/ao/${idOeiAeiAo}`)) ?? null;
  },
    async getIndicadoresMesByAo(idOeiAeiAo: number, idPoiAnio: number) {
    return (await api.get<PoiAoIndicadorMesResponseDto>(`/api/PoiAoIndicadorMes/ao/${idOeiAeiAo}/anio/${idPoiAnio}`));
  },
};