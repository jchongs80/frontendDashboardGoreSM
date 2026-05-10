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

function unwrapData<T>(resp: unknown): T | null {
  if (resp == null) return null;
  if (isRecord(resp) && "data" in resp) {
    return ((resp as ApiResponseDto<T>).data ?? null) as T | null;
  }
  return resp as T;
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
  codigoUnidad?: string | null;
  nombreUnidad?: string | null;
};

export type PrcpMedidaPoliticaDto = {
  idMedidaPolitica: number;
  codigo: string | null;
  denominacion: string | null;
  idUnidad?: number | null;
  codigoUnidad?: string | null;
  nombreUnidad?: string | null;
};

export type PrcpOpPiMpMasterDto = {
  idPrcpOpPiMp: number;
  idPeriodo: number;
  idObjetivoPrioritario: number;
  idProblemaIdentificado: number;
  idMedidaPolitica: number;
  codigoObjetivoPrioritario?: string | null;
  descripcionObjetivoPrioritario?: string | null;
  codigoProblemaIdentificado: string;
  descripcionProblemaIdentificado: string;
  codigoMedidaPolitica: string;
  descripcionMedidaPolitica: string;
  hitosJulio2025: string;
  hitosJulio2028: string;
  hitosJulio2030: string;
  cantidadIndicadores: number;
};

export type PrcpOpPiMpDetailDto = {
  idPrcpOpPiMp: number;
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

export type PrcpIndicadorInfoEditableDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  unidadMedida: string | null;
  tipoIndicador: string | null;
};

export type PrcpIndicadorInfoEditableUpdateRequestDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  unidadMedida: string | null;
  tipoIndicador: string | null;
};

export type PrcpIndicadorLineaBaseEditableDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  anioProyeccion: number | null;
  tipoValor: string | null;
  valorLineaBase: number | null;
};

export type PrcpIndicadorLineaBaseEditableUpdateRequestDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  anioProyeccion: number | null;
  tipoValor: string | null;
  valorLineaBase: number | null;
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
  informacionEditable?: PrcpIndicadorInfoEditableDto | null;
  lineaBaseEditable?: PrcpIndicadorLineaBaseEditableDto | null;
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

  async getObjetivosPrioritarios(idPeriodo: number) {
    const resp = await api.get<unknown>(
      `/api/PrcpOpPiMpVista/objetivos-prioritarios?idPeriodo=${idPeriodo}`
    );
    return unwrapList<PrcpObjetivoPrioritarioDto>(resp);
  },

  async getMedidasPoliticas(idPeriodo: number, idObjetivoPrioritario?: number | null) {
    const qp = new URLSearchParams({ idPeriodo: String(idPeriodo) });

    if (idObjetivoPrioritario != null && idObjetivoPrioritario > 0) {
      qp.append("idObjetivoPrioritario", String(idObjetivoPrioritario));
    }

    const resp = await api.get<unknown>(
      `/api/PrcpOpPiMpVista/medidas-politicas?${qp.toString()}`
    );
    return unwrapList<PrcpMedidaPoliticaDto>(resp);
  },

  async getMaster(idPeriodo: number, idObjetivoPrioritario: number, idMedidaPolitica: number) {
    const qp = new URLSearchParams({
      idPeriodo: String(idPeriodo),
      idObjetivoPrioritario: String(idObjetivoPrioritario || 0),
      idMedidaPolitica: String(idMedidaPolitica || 0),
    });

    const resp = await api.get<unknown>(`/api/PrcpOpPiMpVista/master?${qp.toString()}`);
    return unwrapList<PrcpOpPiMpMasterDto>(resp);
  },

  async getDetail(idPrcpOpPiMp: number) {
    const resp = await api.get<unknown>(`/api/PrcpOpPiMpVista/${idPrcpOpPiMp}/detail`);
    return unwrapList<PrcpOpPiMpDetailDto>(resp);
  },

  async getDetailByMaster(
    idPeriodo: number,
    idMedidaPolitica: number,
    idObjetivoPrioritario?: number | null
  ) {
    const qp = new URLSearchParams({
      idPeriodo: String(idPeriodo),
      idMedidaPolitica: String(idMedidaPolitica),
    });

    if (idObjetivoPrioritario != null && idObjetivoPrioritario > 0) {
      qp.append("idObjetivoPrioritario", String(idObjetivoPrioritario));
    }

    const resp = await api.get<unknown>(`/api/PrcpOpPiMpVista/detail?${qp.toString()}`);
    return unwrapList<PrcpOpPiMpDetailDto>(resp);
  },

  async getIndicadorDetalle(idPrcpOpPiMp: number, idIndicadorNombre: number) {
    const resp = await api.get<unknown>(
      `/api/PrcpOpPiMpVista/indicador-detalle?idPrcpOpPiMp=${idPrcpOpPiMp}&idIndicadorNombre=${idIndicadorNombre}`
    );
    return unwrapData<PrcpIndicadorDetalleResponseDto>(resp);
  },

  async guardarIndicadorEjecutado(payload: PrcpIndicadorEjecutadoUpdateRequestDto) {
    return await api.post(`/api/PrcpOpPiMpVista/indicador-ejecutado`, payload);
  },

  async guardarIndicadorInfoEditable(payload: PrcpIndicadorInfoEditableUpdateRequestDto) {
    return await api.post(`/api/PrcpOpPiMpVista/indicador-info-editable`, payload);
  },

  async guardarIndicadorLineaBaseEditable(payload: PrcpIndicadorLineaBaseEditableUpdateRequestDto) {
    return await api.post(`/api/PrcpOpPiMpVista/indicador-linea-base-editable`, payload);
  },
};

export default PrcpOpPiMpVistaAction;
