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

export type PdrcPeriodoDto = {
  idPeriodo: number;
  codigo: string | null;
  descripcion: string | null;
};

export type PdrcDimensionDto = {
  idDimension: number;
  codigo: string | null;
  nombre: string | null;
  orden?: number | null;
};

export type PdrcUnidadOrgDto = {
  idUnidad: number;
  codigo: string | null;
  nombre: string | null;
};

export type PdrcOerAerMasterDto = {
  idPdrcOerAer: number;
  idPdrcEntidadEstrategica: number;
  tipoNivel: "OER" | "AER";
  idObjetivo: number;
  idAccion?: number | null;
  codigoOer: string;
  enunciadoOer: string;
  codigoAer?: string | null;
  enunciadoAer?: string | null;
  cantidadIndicadores: number;
};

export type PdrcOerAerDetailDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
};

export type PdrcIndicadorDetalleAnioDto = {
  idAnioProyeccion: number;
  anio: number;
};

export type PdrcIndicadorDetalleTipoValorDto = {
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
};

export type PdrcIndicadorDetalleMetValorDto = {
  idPdrcIndMet: number;
  codigoMet: string;
  nombreMet: string;
  valor: number;
};

export type PdrcIndicadorEjecutadoValorDto = {
  idPdrcIndMet: number;
  codigoMet: string;
  nombreMet: string;
  valor: number;
};

export type PdrcIndicadorEjecutadoUpdateItemDto = {
  idPdrcIndMet: number;
  valor: number;
};

export type PdrcIndicadorEjecutadoUpdateRequestDto = {
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  idAnioProyeccion: number;
  valores: PdrcIndicadorEjecutadoUpdateItemDto[];
};

export type PdrcIndicadorDetalleLineaBaseDto = {
  idAnioProyeccion: number;
  anio: number;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  valorAbsolutoA: number;
  valorAbsolutoB: number;
  valorRelativo: number;
};

export type PdrcIndicadorDetalleResponseDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  idPdrcEntidadEstrategica: number;
  tipoNivel: "OER" | "AER";
  codigoOer: string;
  enunciadoOer: string;
  codigoAer?: string | null;
  enunciadoAer?: string | null;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  lineaBase?: PdrcIndicadorDetalleLineaBaseDto | null;
  tiposValor: PdrcIndicadorDetalleTipoValorDto[];
  anios: PdrcIndicadorDetalleAnioDto[];
  valoresMet: PdrcIndicadorDetalleMetValorDto[];
  valoresEjecutados: PdrcIndicadorEjecutadoValorDto[];
};

export const PdrcOerAerVistaAction = {
  async getPeriodos() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/periodos`);
    return unwrapList<PdrcPeriodoDto>(resp);
  },

  async getDimensiones() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/dimensiones`);
    return unwrapList<PdrcDimensionDto>(resp);
  },

  async getUnidadesOrganizacionales() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/unidades-organizacionales`);
    return unwrapList<PdrcUnidadOrgDto>(resp);
  },

  async getMaster(idPeriodo: number, idDimension: number, idUnidad: number) {
    const resp = await api.get<unknown>(
      `/api/PdrcOerAerVista/master?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idUnidad=${idUnidad}`
    );
    return unwrapList<PdrcOerAerMasterDto>(resp);
  },

  async getDetail(idPdrcOerAer: number) {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/${idPdrcOerAer}/detail`);
    return unwrapList<PdrcOerAerDetailDto>(resp);
  },

  async getIndicadorDetalle(
    idPdrcOerAer: number,
    idIndicadorNombre: number,
    idAnioProyeccion?: number | null,
    idPdrcIndTv?: number | null
  ): Promise<PdrcIndicadorDetalleResponseDto | null> {
    const qp = new URLSearchParams({
      idPdrcOerAer: String(idPdrcOerAer),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    if (idAnioProyeccion != null) {
      qp.append("idAnioProyeccion", String(idAnioProyeccion));
    }

    if (idPdrcIndTv != null) {
      qp.append("idPdrcIndTv", String(idPdrcIndTv));
    }

    const resp = await api.get<PdrcIndicadorDetalleResponseDto>(
      `/api/PdrcOerAerVista/indicador-detalle?${qp.toString()}`
    );

    return resp ?? null;
  },

  async guardarIndicadorEjecutado(payload: PdrcIndicadorEjecutadoUpdateRequestDto) {
    return await api.post(`/api/PdrcOerAerVista/indicador-ejecutado`, payload);
  },
};

export default PdrcOerAerVistaAction;