// src/features/planeamiento/PdrcOeAeAction.ts
import { api } from "../../shared/api";

export interface PdrcObjetivoUnidadListDto {
  idObjetivo: number;
  codigo: string;
  enunciado: string;
  asignadoAUnidad: boolean;
}

export interface PdrcAccionUnidadListDto {
  idAccion: number;
  codigo: string;
  enunciado: string;
  asignadaAUnidad: boolean;
  idUnidadActual?: number | null;
  asignadaAOtraUnidad: boolean;
}

export interface PdrcAsignarAccionesRequestDto {
  idsAccion: number[];
  permitirReasignacion?: boolean;
}

export interface PdrcAsignarAccionesResponseDto {
  idObjetivo: number;
  idUnidad: number;
  totalSolicitadas: number;
  totalActualizadas: number;
  conflictos: Array<{ idAccion: number; codigo: string; idUnidadActual?: number | null }>;
  mensaje: string;
}

// Resultado para tabla principal (consulta poi_oer_aer)
export interface PdrcOerAerAsignadoListDto {
  idObjetivo: number;
  codigoOer: string;
  enunciadoOer: string;
  idAccion: number;
  codigoAer: string;
  enunciadoAer: string;
}

/**
 * IMPORTANTE:
 * Tu api.ts ya "unwrappea" {success,message,data} y retorna DIRECTO "data".
 * Por eso aquí devolvemos arrays directamente (NO ApiResponseDto).
 */
export const PdrcOeAeAction = {
  async getObjetivosByUnidad(
    idUnidad: number,
    incluirInactivos = false
  ): Promise<PdrcObjetivoUnidadListDto[]> {
    return await api.get<PdrcObjetivoUnidadListDto[]>(
      `/api/PdrcOeAe/unidad/${idUnidad}/objetivos?incluirInactivos=${incluirInactivos}`
    );
  },

  async getAccionesByUnidadObjetivo(
    idUnidad: number,
    idObjetivo: number,
    incluirInactivos = false
  ): Promise<PdrcAccionUnidadListDto[]> {
    return await api.get<PdrcAccionUnidadListDto[]>(
      `/api/PdrcOeAe/unidad/${idUnidad}/objetivo/${idObjetivo}/acciones?incluirInactivos=${incluirInactivos}`
    );
  },

  async asignarAcciones(
    idUnidad: number,
    idObjetivo: number,
    payload: PdrcAsignarAccionesRequestDto
  ): Promise<PdrcAsignarAccionesResponseDto> {
    return await api.post<PdrcAsignarAccionesResponseDto>(
      `/api/PdrcOeAe/unidad/${idUnidad}/objetivo/${idObjetivo}/acciones/asignar`,
      payload
    );
  },

  // 🔎 Carga las asignaciones para pintar la tabla principal
  async getAsignacionesOerAer(
    idUnidad: number,
    idUe: number,
    idCc: number
  ): Promise<PdrcOerAerAsignadoListDto[]> {
    return await api.get<PdrcOerAerAsignadoListDto[]>(
      `/api/PdrcOeAe/unidad/${idUnidad}/ue/${idUe}/cc/${idCc}/asignaciones`
    );
  },
};
