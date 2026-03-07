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

/**
 * FIX: unwrapItem ahora también extrae el mensaje de error de la respuesta
 * cuando el backend devuelve { success: false, message: "..." } sin campo "data".
 * Así el frontend puede mostrar el motivo real del error.
 */
function unwrapItem<T>(resp: unknown): T | null {
  if (isRecord(resp) && "data" in resp) {
    return ((resp as ApiResponseDto<T>).data ?? null) as T | null;
  }
  return null;
}

/**
 * Extrae el mensaje de error del body de la respuesta del backend.
 * Se usa cuando unwrapItem devuelve null para mostrar info al usuario.
 */
export function extractApiErrorMessage(resp: unknown): string | null {
  if (isRecord(resp) && "message" in resp) {
    return (resp as { message?: string }).message ?? null;
  }
  return null;
}

// ── DTOs de Filtros ──────────────────────────────────────────────────────────

export type PdrcPeriodoDto = {
  idPeriodo: number;
  codigo: string | null;
  descripcion: string | null;
};

export type PdrcDimensionDto = {
  idDimension: number;
  codigo: string | null;
  nombre: string | null;
  /** Orden de presentación (puede ser null en BD) */
  orden?: number | null;
};

export type PdrcUnidadOrgDto = {
  idUnidad: number;
  codigo: string | null;
  nombre: string | null;
};

// ── DTOs de Master/Detail ────────────────────────────────────────────────────

export type PdrcOerAerMasterDto = {
  /** bigserial en BD → long en C# → number en JS (seguro hasta 2^53) */
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

// ── DTOs del Modal de Indicador Detalle ──────────────────────────────────────

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
  /** Tipo de valor actualmente seleccionado por el backend */
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  /** Lista de tipos de valor disponibles para este indicador (pdrc_ind_tv) */
  tiposValor: PdrcIndicadorDetalleTipoValorDto[];
  /** Años disponibles para el tipo de valor seleccionado (anio_proyeccion) */
  anios: PdrcIndicadorDetalleAnioDto[];
  /** Valores por pdrc_ind_met (Valor Absoluto A / B / Relativo) */
  valoresMet: PdrcIndicadorDetalleMetValorDto[];
};

// ── Actions ──────────────────────────────────────────────────────────────────

export const PdrcOerAerVistaAction = {

  /** Periodos con registros en pdrc_oer_aer, filtrado por instrumento PDRC */
  async getPeriodos() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/periodos`);
    return unwrapList<PdrcPeriodoDto>(resp);
  },

  /** Dimensiones activas con registros en pdrc_oer_aer para PDRC */
  async getDimensiones() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/dimensiones`);
    return unwrapList<PdrcDimensionDto>(resp);
  },

  /** Unidades organizacionales activas con registros en pdrc_oer_aer */
  async getUnidadesOrganizacionales() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/unidades-organizacionales`);
    return unwrapList<PdrcUnidadOrgDto>(resp);
  },

  /** Fila master: OER-AER combinados con conteo de indicadores */
  async getMaster(idPeriodo: number, idDimension: number, idUnidad: number) {
    const resp = await api.get<unknown>(
      `/api/PdrcOerAerVista/master?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idUnidad=${idUnidad}`
    );
    return unwrapList<PdrcOerAerMasterDto>(resp);
  },

  /**
   * Indicadores (DISTINCT) para un id_pdrc_oer_aer dado.
   * Fuente: pdrc_indicador_valor → pdrc_indicador_nombre
   */
  async getDetail(idPdrcOerAer: number) {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/${idPdrcOerAer}/detail`);
    return unwrapList<PdrcOerAerDetailDto>(resp);
  },

  /**
   * Detalle completo del indicador para el modal.
   *
   * Circuito:
   *   pdrc_indicador_valor
   *     → pdrc_ind_tv   (filtro Tipo de Valor)
   *     → anio_proyeccion (filtro Año)
   *     → pdrc_ind_met  (filas: Valor Abs A / B / Relativo)
   *
   * @param idPdrcOerAer      - id_pdrc_oer_aer (bigint)
   * @param idIndicadorNombre - id_indicador_nombre de pdrc_indicador_nombre
   * @param idAnioProyeccion  - null = primer año disponible
   * @param idPdrcIndTv       - null = primer tipo de valor disponible
   *
   * Retorna null si no existen registros en pdrc_indicador_valor
   * para esa combinación oer_aer + indicador_nombre.
   */
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

    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/indicador-detalle?${qp.toString()}`);
    return unwrapItem<PdrcIndicadorDetalleResponseDto>(resp);
  },
};

export default PdrcOerAerVistaAction;
