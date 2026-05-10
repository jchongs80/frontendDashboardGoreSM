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

export type PsjPeriodoDto = { idPeriodo: number; codigo: string | null; descripcion: string | null; };
export type PsjDimensionDto = { idDimension: number; codigo: string | null; nombre: string | null; orden?: number | null; };
export type PsjIndicadorPdrcDto = {
  idPdrcIndicadorValor: number;
  codigoEntidad: string;
  nombreEntidad: string;
  codigoIndicador: string;
  nombreIndicador: string;
  codigoTipoValor: string;
  nombreTipoValor: string;
  anio?: number | null;
  etiqueta: string;
};

export type PsjPaisajesMasterDto = {
  idPsjOerAer: number;
  tipoNivel: "OER" | "AER";
  idObjetivo: number;
  idAccion?: number | null;
  codigoOe: string;
  enunciadoOe: string;
  codigoAe?: string | null;
  enunciadoAe?: string | null;
  cantidadIndicadores: number;
};

export type PsjPaisajesDetailDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
};

export type PsjIndicadorDetalleAnioDto = { idAnioProyeccion: number; anio: number; };
export type PsjIndicadorDetalleTipoValorDto = {
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
};
export type PsjIndicadorDetalleLineaBaseDto = {
  idAnioProyeccion: number;
  anio: number;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  valorLineaBase: number;
};
export type PsjIndicadorValorMetaPorAnioDto = { idAnioProyeccion: number; anio: number; valor: number; };
export type PsjIndicadorEjecutadoPorAnioDto = { idAnioProyeccion: number; anio: number; valor: number; };
export type PsjIndicadorEjecutadoUpdateItemDto = { idAnioProyeccion: number; valor: number; };
export type PsjIndicadorEjecutadoUpdateRequestDto = {
  idPsjOerAer: number;
  idIndicadorNombre: number;
  idFuenteIndicador: number;
  valores: PsjIndicadorEjecutadoUpdateItemDto[];
};
export type PsjIndicadorDetalleResponseDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  tipoNivel: "OER" | "AER";
  codigoOe: string;
  enunciadoOe: string;
  codigoAe?: string | null;
  enunciadoAe?: string | null;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  lineaBase?: PsjIndicadorDetalleLineaBaseDto | null;
  tiposValor: PsjIndicadorDetalleTipoValorDto[];
  anios: PsjIndicadorDetalleAnioDto[];
  valoresMetaPorAnio: PsjIndicadorValorMetaPorAnioDto[];
  valoresEjecutadoPorAnio: PsjIndicadorEjecutadoPorAnioDto[];
};

export const PsjPaisajesVistaAction = {
  async getPeriodos() {
    const resp = await api.get<unknown>(`/api/PsjPaisajesVista/periodos`);
    return unwrapList<PsjPeriodoDto>(resp);
  },
  async getDimensiones() {
    const resp = await api.get<unknown>(`/api/PsjPaisajesVista/dimensiones`);
    return unwrapList<PsjDimensionDto>(resp);
  },
  async getIndicadoresPdrc() {
    const resp = await api.get<unknown>(`/api/PsjPaisajesVista/indicadores-pdrc`);
    return unwrapList<PsjIndicadorPdrcDto>(resp);
  },
  async getMaster(idPeriodo: number, idDimension: number, idPdrcIndicadorValor: number) {
    const resp = await api.get<unknown>(`/api/PsjPaisajesVista/master?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idPdrcIndicadorValor=${idPdrcIndicadorValor}`);
    return unwrapList<PsjPaisajesMasterDto>(resp);
  },
  async getDetail(idPsjOerAer: number) {
    const resp = await api.get<unknown>(`/api/PsjPaisajesVista/${idPsjOerAer}/detail`);
    return unwrapList<PsjPaisajesDetailDto>(resp);
  },
  async getIndicadorDetalle(idPsjOerAer: number, idIndicadorNombre: number, idAnioProyeccion?: number | null, idPdrcIndTv?: number | null, idFuenteIndicador?: number | null): Promise<PsjIndicadorDetalleResponseDto | null> {
    const qp = new URLSearchParams({ idPsjOerAer: String(idPsjOerAer), idIndicadorNombre: String(idIndicadorNombre) });
    if (idAnioProyeccion != null) qp.append("idAnioProyeccion", String(idAnioProyeccion));
    if (idPdrcIndTv != null) qp.append("idPdrcIndTv", String(idPdrcIndTv));
    if (idFuenteIndicador != null) qp.append("idFuenteIndicador", String(idFuenteIndicador));
    const resp = await api.get<PsjIndicadorDetalleResponseDto>(`/api/PsjPaisajesVista/indicador-detalle?${qp.toString()}`);
    return resp ?? null;
  },
  async guardarIndicadorEjecutado(payload: PsjIndicadorEjecutadoUpdateRequestDto) {
    return await api.post(`/api/PsjPaisajesVista/indicador-ejecutado`, payload);
  },
};

export default PsjPaisajesVistaAction;
