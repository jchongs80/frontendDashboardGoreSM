import { api } from "../../shared/api";

export type ApiResponseDto<T> = {
  success?: boolean;
  isSuccess?: boolean;
  message?: string;
  data?: T;
  errors?: string[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function unwrapList<T>(resp: unknown): T[] {
  if (Array.isArray(resp)) return resp as T[];
  if (isRecord(resp) && "data" in resp) {
    const data = (resp as ApiResponseDto<T[]>).data;
    return Array.isArray(data) ? data : [];
  }
  return [];
}

export type PrcpPeriodoDto = {
  idPeriodo: number;
  codigo: string | null;
  descripcion: string | null;
};

export type PrcpUnidadOrgDto = {
  idUnidad: number;
  codigo: string | null;
  nombre: string | null;
};

export type PrcpObjetivoPrioritarioDto = {
  idObjetivoPrioritario: number;
  codigo: string | null;
  descripcion: string | null;
};

export type PrcpOpPiMpMasterDto = {
  idPrcpOpPiMp: number;
  idObjetivoPrioritario: number;
  idProblemaIdentificado: number;
  idMedidaPolitica: number;
  codigoObjetivoPrioritario?: string | null;
  descripcionObjetivoPrioritario?: string | null;
  codigoProblemaIdentificado: string;
  descripcionProblemaIdentificado: string;
  codigoMedidaPolitica: string;
  descripcionMedidaPolitica: string;
  cantidadIndicadores: number;
};

export type PrcpOpPiMpDetailDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
};

export type PrcpIndicadorDetalleLineaBaseDto = {
  idAnioProyeccion: number;
  anio: number;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idTendenciaIndicador: number;
  nombreTendencia: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idUnidadMedida: number;
  nombreUnidadMedida: string;
  idTipoIndicador: number;
  nombreTipoIndicador: string;
  valorLineaBase: number;
};

export type PrcpIndicadorValorMetaPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valor: number;
};

export type PrcpIndicadorEjecutadoPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valor: number;
};

export type PrcpIndicadorEjecutadoUpdateItemDto = {
  idAnioProyeccion: number;
  valor: number;
};

export type PrcpIndicadorEjecutadoUpdateRequestDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  valores: PrcpIndicadorEjecutadoUpdateItemDto[];
};

export type PrcpIndicadorDetalleResponseDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  idPrcpOpPiMp: number;
  idObjetivoPrioritario: number;
  idProblemaIdentificado: number;
  idMedidaPolitica: number;
  codigoObjetivoPrioritario?: string | null;
  descripcionObjetivoPrioritario?: string | null;
  codigoProblemaIdentificado: string;
  descripcionProblemaIdentificado: string;
  codigoMedidaPolitica: string;
  descripcionMedidaPolitica: string;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idTendenciaIndicador: number;
  nombreTendencia: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idUnidadMedida: number;
  nombreUnidadMedida: string;
  idTipoIndicador: number;
  nombreTipoIndicador: string;
  lineaBase?: PrcpIndicadorDetalleLineaBaseDto | null;
  valoresMetaPorAnio: PrcpIndicadorValorMetaPorAnioDto[];
  valoresEjecutadoPorAnio: PrcpIndicadorEjecutadoPorAnioDto[];
};

export const PrcpOpPiMpVistaAction = {
  async getPeriodos() {
    const resp = await api.get<unknown>(`/api/PrcpOpPiMpVista/periodos`);
    return unwrapList<PrcpPeriodoDto>(resp);
  },

  async getUnidadesOrganizacionales() {
    const resp = await api.get<unknown>(`/api/PrcpOpPiMpVista/unidades-organizacionales`);
    return unwrapList<PrcpUnidadOrgDto>(resp);
  },

  async getObjetivosPrioritarios(idPeriodo: number, idUnidad: number) {
    const resp = await api.get<unknown>(
      `/api/PrcpOpPiMpVista/objetivos-prioritarios?idPeriodo=${idPeriodo}&idUnidad=${idUnidad}`
    );
    return unwrapList<PrcpObjetivoPrioritarioDto>(resp);
  },

  async getMaster(idPeriodo: number, idUnidad: number, idObjetivoPrioritario: number) {
    const resp = await api.get<unknown>(
      `/api/PrcpOpPiMpVista/master?idPeriodo=${idPeriodo}&idUnidad=${idUnidad}&idObjetivoPrioritario=${idObjetivoPrioritario}`
    );
    return unwrapList<PrcpOpPiMpMasterDto>(resp);
  },

  async getDetail(idPrcpOpPiMp: number) {
    const resp = await api.get<unknown>(`/api/PrcpOpPiMpVista/${idPrcpOpPiMp}/detail`);
    return unwrapList<PrcpOpPiMpDetailDto>(resp);
  },

  async getIndicadorDetalle(idPrcpOpPiMp: number, idIndicadorNombre: number) {
    const resp = await api.get<PrcpIndicadorDetalleResponseDto>(
      `/api/PrcpOpPiMpVista/indicador-detalle?idPrcpOpPiMp=${idPrcpOpPiMp}&idIndicadorNombre=${idIndicadorNombre}`
    );
    return resp ?? null;
  },

  async guardarIndicadorEjecutado(payload: PrcpIndicadorEjecutadoUpdateRequestDto) {
    return await api.post(`/api/PrcpOpPiMpVista/indicador-ejecutado`, payload);
  },
};

export default PrcpOpPiMpVistaAction;
