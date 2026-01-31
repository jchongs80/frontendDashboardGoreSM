import { api } from "../../shared/api";

/* =========================
   DTOs (según tu backend)
========================= */

export type IndicadorItemDto = {
  idIndicador: number;
  codigoIndicador: string;
  indicador: string;
  estadoIndicador: string; // "ACTIVO" | "INACTIVO"
  estadoRelacion: string;  // "ACTIVO" | "INACTIVO"
};

export type AccionConIndicadoresDto = {
  idAccion: number;
  codigoAccion: string;
  accion: string;
  estadoAccion: string; // "ACTIVO" | "INACTIVO"
  ordenAccion?: number | null;
  indicadores: IndicadorItemDto[];
};

export type ObjetivoResponsableAccionesIndicadoresDto = {
  idInstrumento: number;
  idObjetivo: number;
  codigoObjetivo: string;
  oer: string;

  idUnidad: number;
  codigoUnidad: string;
  nombreUnidad: string;

  estadoResponsable: string; // "ACTIVO" | "INACTIVO"

  acciones: AccionConIndicadoresDto[];
};

export type AccionIndicadorCreateDto = {
  idIndicador: number;
};

export const PdrcObjetivosAccionesIndicadoresAction = {
  // GET: /api/PdrcObjetivos/instrumento/{idInstrumento}/objetivo/{idObjetivo}/unidad/{idUnidad}/acciones-indicadores
  getVista: (
    idInstrumento: number,
    idObjetivo: number,
    idUnidad: number,
    incluirInactivos = false
  ) =>
    api.get<ObjetivoResponsableAccionesIndicadoresDto>(
      `/api/PdrcObjetivos/instrumento/${idInstrumento}/objetivo/${idObjetivo}/unidad/${idUnidad}/acciones-indicadores?incluirInactivos=${incluirInactivos}`
    ),

  // GET: /api/AccionesEstrategicas/{idAccion}/indicadores
  getIndicadoresByAccion: (idAccion: number, incluirInactivos = false) =>
    api.get<IndicadorItemDto[]>(
      `/api/AccionesEstrategicas/${idAccion}/indicadores?incluirInactivos=${incluirInactivos}`
    ),

  // POST: /api/AccionesEstrategicas/{idAccion}/indicadores
  addIndicadorToAccion: (idAccion: number, payload: AccionIndicadorCreateDto) =>
    api.post<void>(`/api/AccionesEstrategicas/${idAccion}/indicadores`, payload),

  // DELETE: /api/AccionesEstrategicas/{idAccion}/indicadores/{idIndicador}
  removeIndicadorFromAccion: (idAccion: number, idIndicador: number) =>
    api.del<void>(`/api/AccionesEstrategicas/${idAccion}/indicadores/${idIndicador}`),
};
