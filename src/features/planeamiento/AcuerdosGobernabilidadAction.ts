// src/features/acuerdos/AcuerdosGobernabilidadAction.ts
import { api } from "../../shared/api";

/* =========================================================
   DTOs (alineados al backend /api/Politicas)
   ========================================================= */

export type AgIntervencionDto = {
  idIntervencion: number;
  codigo: string;
  descripcion: string;
  idUnidadResponsable?: number | null;
  nombreUnidadResponsable?: string | null;
  presupuestoEstimado?: number | null;
  estado?: string | null;
};

export type AgResultadoDto = {
  idResultado: number;
  codigo: string;
  descripcion: string;
  estado?: string | null;
  intervenciones: AgIntervencionDto[];
};

export type AgAcuerdoDetalleDto = {
  idInstrumento: number;
  idPolitica: number;
  codigoPolitica: string;
  politica: string;

  idUnidad: number;
  codigoUnidad: string;
  nombreUnidad: string;

  estado?: string | null;

  resultados: AgResultadoDto[];
};

export type ResultadoCreateDto = {
  codigo: string;
  descripcion: string;
  idObjetivo?: number | null;
  idAccion?: number | null;
};

export type IntervencionCreateDto = {
  idResultado: number;
  codigo: string;
  descripcion: string;

  idUnidadResponsable?: number | null;
  presupuestoEstimado?: number | null;

  enunciado?: boolean;
  orden?: number | null;
};

// Para futuro (cuando tengas PUT en backend)
export type ResultadoUpdateDto = {
  codigo: string;
  descripcion: string;
  estado?: string | null;
};

export type IntervencionUpdateDto = {
  codigo: string;
  descripcion: string;
  idUnidadResponsable?: number | null;
  presupuestoEstimado?: number | null;
  estado?: string | null;
};

const normalizeEstado = (v: unknown): string | null => {
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "ACTIVO" : "INACTIVO";
  return null;
};

const mapDetalle = (d: AgAcuerdoDetalleDto): AgAcuerdoDetalleDto => ({
  ...d,
  estado: normalizeEstado(d.estado),
  resultados: (d.resultados ?? []).map((r) => ({
    ...r,
    estado: normalizeEstado(r.estado),
    intervenciones: (r.intervenciones ?? []).map((i) => ({
      ...i,
      estado: normalizeEstado(i.estado),
    })),
  })),
});

export const AcuerdosGobernabilidadAction = {
  /** ✅ GET: /api/Politicas/instrumento/{id}/politica/{idPolitica}/unidad/{idUnidad}/acuerdos */
  getDetalle: async (idInstrumento: number, idPolitica: number, idUnidad: number, incluirInactivos = false) => {
    const data = await api.get<AgAcuerdoDetalleDto>(
      `/api/politicas/instrumento/${idInstrumento}/politica/${idPolitica}/unidad/${idUnidad}/acuerdos?incluirInactivos=${incluirInactivos}`
    );
    return mapDetalle(data);
  },

  /** ✅ POST: /api/Politicas/instrumento/{id}/politica/{idPolitica}/unidad/{idUnidad}/resultados */
  crearResultado: (idInstrumento: number, idPolitica: number, idUnidad: number, payload: ResultadoCreateDto) =>
    api.post<number>(
      `/api/politicas/instrumento/${idInstrumento}/politica/${idPolitica}/unidad/${idUnidad}/resultados`,
      payload
    ),

  /** ✅ POST: /api/Politicas/instrumento/{id}/intervenciones */
  crearIntervencion: (idInstrumento: number, payload: IntervencionCreateDto) =>
    api.post<number>(`/api/politicas/instrumento/${idInstrumento}/intervenciones`, payload),

  /** ✅ DELETE: /api/Politicas/intervenciones/{idIntervencion} */
  eliminarIntervencion: (idIntervencion: number) => api.del<boolean>(`/api/politicas/intervenciones/${idIntervencion}`),

  /* ====== Pendiente backend ====== */
   /*editarResultado: (_idResultado: number, _payload: ResultadoUpdateDto) => {
    throw new Error("editarResultado: endpoint PUT no implementado aún en backend.");
  },
  eliminarResultado: (_idResultado: number) => {
    throw new Error("eliminarResultado: endpoint DELETE no implementado aún en backend.");
  },
  editarIntervencion: (_idIntervencion: number, _payload: IntervencionUpdateDto) => {
    throw new Error("editarIntervencion: endpoint PUT no implementado aún en backend.");
  },*/
};
