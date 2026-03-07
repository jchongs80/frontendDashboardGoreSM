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

function unwrapItem<T>(resp: unknown): T | null {
  if (isRecord(resp) && "data" in resp) {
    return ((resp as ApiResponseDto<T>).data ?? null) as T | null;
  }
  return null;
}

export function extractApiErrorMessage(resp: unknown): string | null {
  if (isRecord(resp) && "message" in resp) {
    return (resp as { message?: string }).message ?? null;
  }
  return null;
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
  idObjetivo: number;
  idAccion: number;
  codigoOer: string;
  enunciadoOer: string;
  codigoAer: string;
  enunciadoAer: string;
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

export type PdrcIndicadorDetalleResponseDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  codigoOer: string;
  enunciadoOer: string;
  codigoAer: string;
  enunciadoAer: string;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  tiposValor: PdrcIndicadorDetalleTipoValorDto[];
  anios: PdrcIndicadorDetalleAnioDto[];
  valoresMet: PdrcIndicadorDetalleMetValorDto[];
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
};

export default PdrcOerAerVistaAction;