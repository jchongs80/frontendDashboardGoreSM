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

export type PeiPeriodoDto = {
  idPeriodo: number;
  codigo: string | null;
  descripcion: string | null;
};

export type PeiDimensionDto = {
  idDimension: number;
  codigo: string | null;
  nombre: string | null;
  orden?: number | null;
};

export type PeiUnidadOrgDto = {
  idUnidad: number;
  codigo: string | null;
  nombre: string | null;
};

export type PeiOeiAeiMasterDto = {
  idPeiOeiAei: number;
  idPeiEntidadEstrategica: number;
  tipoNivel: "OEI" | "AEI";
  idObjetivo: number;
  idAccion?: number | null;
  codigoOei: string;
  enunciadoOei: string;
  codigoAei?: string | null;
  enunciadoAei?: string | null;
  cantidadIndicadores: number;
};

export type PeiOeiAeiDetailDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
};

export type PeiIndicadorDetalleAnioDto = {
  idAnioProyeccion: number;
  anio: number;
};

export type PeiIndicadorDetalleTipoValorDto = {
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idMetCalcIndicador: number;
  nombreMetodoCalculo: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idPeriodicidadIndicador: number;
  nombrePeriodicidad: string;
};

export type PeiIndicadorDetalleMetValorDto = {
  idPdrcIndMet: number;
  codigoMet: string;
  nombreMet: string;
  valor: number;
};

export type PeiIndicadorDetalleLineaBaseDto = {
  idAnioProyeccion: number;
  anio: number;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idMetCalcIndicador: number;
  nombreMetodoCalculo: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idPeriodicidadIndicador: number;
  nombrePeriodicidad: string;
  valorLineaBase: number;
};

export type PeiIndicadorValorMetaPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valorAbsolutoA: number;
  valorAbsolutoB: number;
  valorRelativo: number;
};

export type PeiIndicadorEjecutadoPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valor: number;
};

export type PeiIndicadorEjecutadoUpdateItemDto = {
  idAnioProyeccion: number;
  valor: number;
};

export type PeiIndicadorEjecutadoUpdateRequestDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  valores: PeiIndicadorEjecutadoUpdateItemDto[];
};

export type PeiIndicadorDetalleResponseDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  idPeiEntidadEstrategica: number;
  tipoNivel: "OEI" | "AEI";
  codigoOei: string;
  enunciadoOei: string;
  codigoAei?: string | null;
  enunciadoAei?: string | null;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idMetCalcIndicador: number;
  nombreMetodoCalculo: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idPeriodicidadIndicador: number;
  nombrePeriodicidad: string;
  lineaBase?: PeiIndicadorDetalleLineaBaseDto | null;
  tiposValor: PeiIndicadorDetalleTipoValorDto[];
  anios: PeiIndicadorDetalleAnioDto[];
  valoresMet: PeiIndicadorDetalleMetValorDto[];
  valoresMetaPorAnio: PeiIndicadorValorMetaPorAnioDto[];
  valoresEjecutadoPorAnio: PeiIndicadorEjecutadoPorAnioDto[];
};

export const PeiOeiAeiVistaAction = {
  async getPeriodos() {
    const resp = await api.get<unknown>(`/api/PeiOeiAeiVista/periodos`);
    return unwrapList<PeiPeriodoDto>(resp);
  },

  async getDimensiones() {
    const resp = await api.get<unknown>(`/api/PeiOeiAeiVista/dimensiones`);
    return unwrapList<PeiDimensionDto>(resp);
  },

  async getUnidadesOrganizacionales() {
    const resp = await api.get<unknown>(`/api/PeiOeiAeiVista/unidades-organizacionales`);
    return unwrapList<PeiUnidadOrgDto>(resp);
  },

  async getMaster(idPeriodo: number, idDimension: number, idUnidad: number) {
    const resp = await api.get<unknown>(
      `/api/PeiOeiAeiVista/master?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idUnidad=${idUnidad}`
    );
    return unwrapList<PeiOeiAeiMasterDto>(resp);
  },

  async getDetail(idPeiOeiAei: number) {
    const resp = await api.get<unknown>(`/api/PeiOeiAeiVista/${idPeiOeiAei}/detail`);
    return unwrapList<PeiOeiAeiDetailDto>(resp);
  },

  async getIndicadorDetalle(
    idPeiOeiAei: number,
    idIndicadorNombre: number,
    idAnioProyeccion?: number | null,
    idPdrcIndTv?: number | null
  ): Promise<PeiIndicadorDetalleResponseDto | null> {
    const qp = new URLSearchParams({
      idPeiOeiAei: String(idPeiOeiAei),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    if (idAnioProyeccion != null) {
      qp.append("idAnioProyeccion", String(idAnioProyeccion));
    }

    if (idPdrcIndTv != null) {
      qp.append("idPdrcIndTv", String(idPdrcIndTv));
    }

    const resp = await api.get<PeiIndicadorDetalleResponseDto>(
      `/api/PeiOeiAeiVista/indicador-detalle?${qp.toString()}`
    );

    return resp ?? null;
  },

  async guardarIndicadorEjecutado(payload: PeiIndicadorEjecutadoUpdateRequestDto) {
    return await api.post(`/api/PeiOeiAeiVista/indicador-ejecutado`, payload);
  },
};

export default PeiOeiAeiVistaAction;