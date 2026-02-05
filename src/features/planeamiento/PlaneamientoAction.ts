import { api } from "../../shared/api";

/** =========
 * Indicadores
 * ========= */

export type IndicadorListDto = {
  idIndicador: number;
  codigo: string;
  nombre: string;
  nombreTipoIndicador?: string | null;
  nombreUnidadMedida?: string | null;
  nombreFuenteDatos?: string | null;
  tendencia?: string | null;
  periodicidad?: string | null;
  esIndicadorResultado: boolean;
  esIndicadorImpacto: boolean;
  esIndicadorGestion: boolean;
  estado: string; // "ACTIVO" | "INACTIVO"
};

export type IndicadorDetailDto = {
  idIndicador: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;

  idTipoIndicador?: number | null;
  idUnidadMedida?: number | null;
  idFuenteDatos?: number | null;

  nombreTipoIndicador?: string | null;
  nombreUnidadMedida?: string | null;
  nombreFuenteDatos?: string | null;

  formulaCalculo?: string | null;
  metodoCalculo?: string | null;

  tendencia?: string | null;
  esAcumulable: boolean;
  periodicidad?: string | null;

  esIndicadorResultado: boolean;
  esIndicadorImpacto: boolean;
  esIndicadorGestion: boolean;

  observaciones?: string | null;
  estado: string;
};

export type IndicadorCreateUpdateDto = {
  codigo: string;
  nombre: string;
  descripcion?: string | null;

  idTipoIndicador?: number | null;
  idUnidadMedida?: number | null;
  idFuenteDatos?: number | null;

  formulaCalculo?: string | null;
  metodoCalculo?: string | null;

  tendencia?: string | null;
  esAcumulable: boolean;
  periodicidad?: string | null;

  esIndicadorResultado: boolean;
  esIndicadorImpacto: boolean;
  esIndicadorGestion: boolean;

  observaciones?: string | null;
  estado: string;
};

/** ===============
 * Indicadores Metas
 * =============== */

export type IndicadorMetaListDto = {
  idMeta: number;
  idIndicadorInstrumento: number;
  anio: number;

  lineaBase?: number | null;
  metaProgramada?: number | null;
  metaMinima?: number | null;
  metaMaxima?: number | null;
  metaAcumulada?: number | null;

  estado: string;

  idIndicador: number;
  idInstrumento: number;

  codigoIndicador?: string | null;
  nombreIndicador?: string | null;
  nombreInstrumento?: string | null;
  nombreUnidadMedida?: string | null;
};

export type IndicadorMetaCreateUpdateDto = {
  idIndicadorInstrumento: number;
  anio: number;

  lineaBase?: number | null;
  metaProgramada?: number | null;
  metaMinima?: number | null;
  metaMaxima?: number | null;
  metaAcumulada?: number | null;

  estado: string;
};

/** ======================
 * Indicadores Instrumentos
 * (se usa como combo en Metas)
 * ====================== */

export type IndicadorInstrumentoListDto = {
  idIndicadorInstrumento: number;
  idIndicador: number;
  idInstrumento: number;

  codigoEnInstrumento?: string | null;

  idDimension?: number | null;
  idEje?: number | null;
  idPolitica?: number | null;
  idObjetivo?: number | null;
  idAccion?: number | null;
  idResultado?: number | null;
  idIntervencion?: number | null;

  idUnidadResponsable?: number | null;

  orden?: number | null;
  esIndicadorPrincipal: boolean;

  observaciones?: string | null;
  estado: string;

  // opcional si tu backend lo expone
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
  usuarioCreacion?: string | null;
  usuarioModificacion?: string | null;

  // opcional si tu endpoint ya “join” a nombres
  nombreIndicador?: string | null;
  nombreInstrumento?: string | null;
};

export type IndicadorInstrumentoCreateUpdateDto = {
  idIndicador: number;
  idInstrumento: number;

  codigoEnInstrumento?: string | null;

  idDimension?: number | null;
  idEje?: number | null;
  idPolitica?: number | null;
  idObjetivo?: number | null;
  idAccion?: number | null;
  idResultado?: number | null;
  idIntervencion?: number | null;

  idUnidadResponsable?: number | null;

  orden?: number | null;
  esIndicadorPrincipal: boolean;

  observaciones?: string | null;
  estado: string;
};
/** ============
 * Planeamiento
 * ============ */

export type EjeEstrategicoListDto = {
  idEje: number;
  idInstrumento: number;
  codigo: string;
  nombre: string;
  orden?: number | null;
  estado: string;

  nombreInstrumento?: string | null;
  nombreDimension?: string | null;
};

export type EjeEstrategicoDetailDto = EjeEstrategicoListDto & {
  descripcion?: string | null;
  idDimension?: number | null;
};

export type EjeEstrategicoCreateUpdateDto = {
  idInstrumento: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  idDimension?: number | null;
  orden?: number | null;
  estado: string;
};

export type PoliticaListDto = {
  idPolitica: number;
  idInstrumento: number;
  codigo: string;
  nombre: string;
  orden?: number | null;
  estado: string;

  idEje?: number | null;
  nombreInstrumento?: string | null;
  nombreDimension?: string | null;
  nombreEje?: string | null;
};

export type PoliticaDetailDto = PoliticaListDto & {
  descripcion?: string | null;
  idDimension?: number | null;
};

export type PoliticaCreateUpdateDto = {
  idInstrumento: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  idDimension?: number | null;
  idEje?: number | null;
  orden?: number | null;
  estado: string;
};

export type ObjetivoListDto = {
  idObjetivo: number;
  idInstrumento: number;
  codigo: string;
  enunciado: string;
  orden?: number | null;
  estado: string;

  idEje?: number | null;
  idPolitica?: number | null;
  idUnidadResponsable?: number | null;

  nombreInstrumento?: string | null;
  nombreDimension?: string | null;
  nombreEje?: string | null;
  nombrePolitica?: string | null;
  nombreUnidadResponsable?: string | null;
};

export type ObjetivoDetailDto = ObjetivoListDto & {
  descripcion?: string | null;
  tipo?: string | null;
  idDimension?: number | null;
};

export type ObjetivoCreateUpdateDto = {
  idInstrumento: number;
  codigo: string;
  enunciado: string;
  descripcion?: string | null;
  tipo?: string | null;

  idDimension?: number | null;
  idEje?: number | null;
  idPolitica?: number | null;
  idUnidadResponsable?: number | null;
  orden?: number | null;

  estado: string;
};

export type AccionListDto = {
  idAccion: number;
  idObjetivo: number;
  codigo: string;
  enunciado: string;
  orden?: number | null;
  estado: string;

  presupuestoEstimado?: number | null;
  idUnidadResponsable?: number | null;

  idInstrumento?: number | null;
  idPolitica?: number | null;
  idEje?: number | null;

  nombreObjetivo?: string | null;
  nombreInstrumento?: string | null;
  nombreUnidadResponsable?: string | null;
};

export type AccionDetailDto = AccionListDto & {
  descripcion?: string | null;
  tipo?: string | null;
};

export type AccionCreateUpdateDto = {
  idObjetivo: number;
  codigo: string;
  enunciado: string;
  descripcion?: string | null;
  tipo?: string | null;

  idUnidadResponsable?: number | null;
  orden?: number | null;
  presupuestoEstimado?: number | null;

  estado: string;
};



// ====== Planeamiento: Intervenciones / Resultados / Unidades ======

export type IntervencionListDto = {
  idIntervencion: number;
  idAccion: number;
  codigo: string;
  enunciado: string;
  orden?: number | null;
  estado: string;

  idObjetivo?: number | null;
  idPolitica?: number | null;
  idInstrumento?: number | null;
  idUnidadResponsable?: number | null;

  nombreAccion?: string | null;
  nombreObjetivo?: string | null;
  nombrePolitica?: string | null;
  nombreInstrumento?: string | null;
  nombreUnidadResponsable?: string | null;
};

export type ResultadoListDto = {
  idResultado: number;
  codigo: string;
  descripcion: string;

  idInstrumento: number;
  idPolitica?: number | null;
  idObjetivo?: number | null;
  idAccion?: number | null;

  nombreInstrumento?: string | null;
  nombrePolitica?: string | null;
  nombreObjetivo?: string | null;
  nombreAccion?: string | null;
};

export type UnidadOrgDto = {
  idUnidadOrganizacional: number;
  codigo: string;
  nombre: string;
  estado?: string | null;
};

// Lo que realmente devuelve el backend (Aplicacion/DTOs/Catalogos/UnidadOrganizacionalDto.cs)
type UnidadOrgRawDto = {
  idUnidad: number;
  codigo: string;
  nombre: string;
  estado?: string | null;
};

export type PoliticaResponsableDto = {
  idUnidad: number;
  codigoUnidad: string;
  nombreUnidad: string;
  estado?: string | null; // "ACTIVO"/"INACTIVO" si lo mandas
};

export type PoliticaConResponsablesDto = {
  idPolitica: number;
  idInstrumento: number;
  codigo: string;
  politica: string; // <- IMPORTANTE (viene del backend)
  estado: string;
  responsables: PoliticaResponsableDto[];
};

export type PoliticaResponsableCreateDto = {
  idUnidad: number;
};
// ====== Objetivos + Responsables (N a N) - Vista PDRC ======

export type ObjetivoResponsableDto = {
  idUnidad: number;
  codigoUnidad: string;
  nombreUnidad: string;
  estado?: string | null;
};

export type ObjetivoConResponsablesDto = {
  idObjetivo: number;
  idInstrumento: number;
  codigo: string;

  // backend puede devolver "objetivo" o "enunciado" (según tu implementación)
  oer?: string | null;
  enunciado?: string | null;
  objetivo?: string | null;

  estado: string;
  responsables: ObjetivoResponsableDto[];
};

export type ObjetivoResponsableCreateDto = {
  idUnidad: number;
};
// ========= Helpers de respuesta (sin any) =========
type ApiResponseDto<T> = {
  isSuccess?: boolean;
  message?: string;
  data?: T;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function unwrapApi<T>(resp: unknown): { ok: boolean; data: T; message?: string } {
  // Si ya vino como array/objeto final (sin wrapper)
  if (!isRecord(resp)) {
    return { ok: true, data: resp as T };
  }

  // Si vino con wrapper ApiResponseDto
  if ("data" in resp) {
    const r = resp as ApiResponseDto<T>;
    const ok = r.isSuccess ?? true;
    return { ok, data: (r.data as T) ?? (undefined as unknown as T), message: r.message };
  }

  // fallback
  return { ok: true, data: resp as T };
}

// ========= DTOs Unidades Org (completo) =========
export type UnidadOrganizacionalDto = {
  idUnidad: number;
  codigo: string;
  nombre: string;
  siglas?: string | null;
  tipo?: string | null;

  idUnidadPadre?: number | null;

  responsableCargo?: string | null;
  responsableNombre?: string | null;
  email?: string | null;
  telefono?: string | null;

  estado?: string | null; // ACTIVO/INACTIVO
};

export type UnidadOrganizacionalUpdateDto = {
  nombre: string;
  siglas?: string | null;
  tipo?: string | null;

  idUnidadPadre?: number | null;

  responsableCargo?: string | null;
  responsableNombre?: string | null;
  email?: string | null;
  telefono?: string | null;

  estado: string; // ACTIVO/INACTIVO
};

/** =========
 * Actions
 * ========= */

export const PlaneamientoAction = {
  // ===============================
// Unidades Org (Catálogo)
// ===============================
getUnidadesOrganizacionales: async (soloActivas = true) => {
  const resp = await api.get<unknown>(`/api/unidades-org?soloActivas=${soloActivas}`);
  const u = unwrapApi<UnidadOrganizacionalDto[]>(resp);

  if (!u.ok) throw new Error(u.message || "No se pudo listar unidades organizacionales.");
  return u.data ?? [];
},

updateUnidadOrganizacional: async (idUnidad: number, payload: UnidadOrganizacionalUpdateDto) => {
  const resp = await api.put<unknown>(`/api/unidades-org/${idUnidad}`, payload);
  const u = unwrapApi<boolean>(resp);

  if (!u.ok) throw new Error(u.message || "No se pudo actualizar la unidad organizacional.");
  return true;
},

  // ==========================================================
  // Objetivos + Responsables (N a N) - Vista PDRC
  // ==========================================================
  getObjetivosConResponsablesByInstrumento: (idInstrumento: number, incluirInactivos = false) =>
    api.get<ObjetivoConResponsablesDto[]>(
      `/api/objetivosestrategicos/instrumento/${idInstrumento}/responsables?incluirInactivos=${incluirInactivos}`
    ),

  getResponsablesByObjetivo: (idObjetivo: number, incluirInactivos = false) =>
    api.get<ObjetivoResponsableDto[]>(
      `/api/objetivosestrategicos/${idObjetivo}/responsables?incluirInactivos=${incluirInactivos}`
    ),

  addResponsableToObjetivo: (idObjetivo: number, payload: ObjetivoResponsableCreateDto) =>
    api.post<void>(`/api/objetivosestrategicos/${idObjetivo}/responsables`, payload),

  removeResponsableFromObjetivo: (idObjetivo: number, idUnidad: number) =>
    api.del<void>(`/api/objetivosestrategicos/${idObjetivo}/responsables/${idUnidad}`),

  // Indicadores
  getIndicadores: () => api.get<IndicadorListDto[]>("/api/indicadores"),
  getIndicadorById: (id: number) => api.get<IndicadorDetailDto>(`/api/indicadores/${id}`),
  updateIndicador: (id: number, payload: IndicadorCreateUpdateDto) =>
    api.put<void>(`/api/indicadores/${id}`, payload),
  createIndicador:(payload: IndicadorCreateUpdateDto) => 
    api.post<void>("/api/indicadores", payload),

  // IndicadorInstrumento (para combos)
  getIndicadoresInstrumentos: () => api.get<IndicadorInstrumentoListDto[]>("/api/indicadoresinstrumentos"),
  updateIndicadoresInstrumentos: (id: number, payload: IndicadorInstrumentoCreateUpdateDto)=>
    api.put<void>(`/api/indicadoresinstrumentos/${id}`, payload),
  createIndicadoresInstrumentos: (payload: IndicadorInstrumentoCreateUpdateDto)=>
    api.post<void>("/api/indicadoresinstrumentos",payload),

  getIndicadoresInstrumentosByInstrumento: (idInstrumento: number) =>
  api.get<IndicadorInstrumentoListDto[]>(
    `/api/indicadoresinstrumentos/instrumento/${idInstrumento}`
  ),

  // Metas
  getIndicadoresMetas: () => api.get<IndicadorMetaListDto[]>("/api/indicadoresmetas"),
  updateIndicadorMeta: (id: number, payload: IndicadorMetaCreateUpdateDto) =>
    api.put<void>(`/api/indicadoresmetas/${id}`, payload),
  createIndicadorMeta: (payload: IndicadorMetaCreateUpdateDto) => 
    api.post<void>("/api/indicadoresmetas",payload),

  // Planeamiento
  getEjesEstrategicos: () => api.get<EjeEstrategicoListDto[]>("/api/ejesestrategicos"),
  updateEjeEstrategico: (id: number, payload: EjeEstrategicoCreateUpdateDto) =>
    api.put<void>(`/api/ejesestrategicos/${id}`, payload),
  createEjeEstrategico: (payload: EjeEstrategicoCreateUpdateDto)=>
    api.post<void>("api/ejesestrategicos", payload),

  getPoliticas: () => api.get<PoliticaListDto[]>("/api/politicas"),
  updatePolitica: (id: number, payload: PoliticaCreateUpdateDto) =>
    api.put<void>(`/api/politicas/${id}`, payload),
  createPolitica: (payload: PoliticaCreateUpdateDto)=>
    api.post<void>("/api/politicas", payload),

  getObjetivos: () => api.get<ObjetivoListDto[]>("/api/objetivosestrategicos"),
  updateObjetivo: (id: number, payload: ObjetivoCreateUpdateDto) =>
    api.put<void>(`/api/objetivosestrategicos/${id}`, payload),
  createObjetivo: (payload: ObjetivoCreateUpdateDto)=>
    api.post<void>("/api/objetivosestrategicos", payload),

  getAcciones: () => api.get<AccionListDto[]>("/api/accionesestrategicas"),
  updateAccion: (id: number, payload: AccionCreateUpdateDto) =>
    api.put<void>(`/api/accionesestrategicas/${id}`, payload),
  //createAccion: (payload: AccionCreateUpdateDto)=>
  //  api.post<void>("/api/accionesestrategicos", payload),
createAccion: (payload: AccionCreateUpdateDto) =>
  api.post<void>("/api/accionesestrategicas", payload),

  // Ejes
  getEjesByInstrumento: (idInstrumento: number) =>
    api.get<EjeEstrategicoListDto[]>(`/api/ejesestrategicos/instrumento/${idInstrumento}`),

  // Políticas
  getPoliticasByInstrumento: (idInstrumento: number) =>
    api.get<PoliticaListDto[]>(`/api/politicas/instrumento/${idInstrumento}`),
  getPoliticasByEje: (idEje: number) =>
    api.get<PoliticaListDto[]>(`/api/politicas/eje/${idEje}`),

  // Objetivos
  getObjetivosByInstrumento: (idInstrumento: number) =>
    api.get<ObjetivoListDto[]>(`/api/objetivosestrategicos/instrumento/${idInstrumento}`),
  getObjetivosByEje: (idEje: number) =>
    api.get<ObjetivoListDto[]>(`/api/objetivosestrategicos/eje/${idEje}`),
  getObjetivosByPolitica: (idPolitica: number) =>
    api.get<ObjetivoListDto[]>(`/api/objetivosestrategicos/politica/${idPolitica}`),

  // Acciones
  getAccionesByInstrumento: (idInstrumento: number) =>
    api.get<AccionListDto[]>(`/api/accionesestrategicas/instrumento/${idInstrumento}`),
  getAccionesByPolitica: (idPolitica: number) =>
    api.get<AccionListDto[]>(`/api/accionesestrategicas/politica/${idPolitica}`),
  getAccionesByObjetivo: (idObjetivo: number) =>
    api.get<AccionListDto[]>(`/api/accionesestrategicas/objetivo/${idObjetivo}`),

  // Intervenciones
  getIntervenciones: () => api.get<IntervencionListDto[]>(`/api/intervencionesprioritarias`),
  getIntervencionesByInstrumento: (idInstrumento: number) =>
    api.get<IntervencionListDto[]>(`/api/intervencionesprioritarias/instrumento/${idInstrumento}`),
  getIntervencionesByObjetivo: (idObjetivo: number) =>
    api.get<IntervencionListDto[]>(`/api/intervencionesprioritarias/objetivo/${idObjetivo}`),
  getIntervencionesByAccion: (idAccion: number) =>
    api.get<IntervencionListDto[]>(`/api/intervencionesprioritarias/accion/${idAccion}`),

  // Resultados
  getResultados: () => api.get<ResultadoListDto[]>(`/api/resultadosconcertados`),
  getResultadosByInstrumento: (idInstrumento: number) =>
    api.get<ResultadoListDto[]>(`/api/resultadosconcertados/instrumento/${idInstrumento}`),
  getResultadosByAccion: (idAccion: number) =>
    api.get<ResultadoListDto[]>(`/api/resultadosconcertados/accion/${idAccion}`),

  // Unidades Org (ojo: ruta es /api/unidades-org)
  //getUnidadesOrg: () => api.get<UnidadOrgDto[]>(`/api/unidades-org`),
  getUnidadesOrg: async () => {
    const raw = await api.get<UnidadOrgRawDto[]>(`/api/unidades-org`);


    // normalizamos a la forma que usa el frontend
    return raw.map((u) => ({
      idUnidadOrganizacional: u.idUnidad,
      codigo: u.codigo,
      nombre: u.nombre,
      estado: u.estado ?? "ACTIVO",
    })) as UnidadOrgDto[];
    
  },

  // ==========================================================
  // Políticas + Responsables (N a N) - Vista AG
  // ==========================================================
  getPoliticasConResponsablesByInstrumento: (idInstrumento: number, incluirInactivos = false) =>
    api.get<PoliticaConResponsablesDto[]>(
      `/api/politicas/instrumento/${idInstrumento}/responsables?incluirInactivos=${incluirInactivos}`
    ),

  getResponsablesByPolitica: (idPolitica: number, incluirInactivos = false) =>
    api.get<PoliticaResponsableDto[]>(
      `/api/politicas/${idPolitica}/responsables?incluirInactivos=${incluirInactivos}`
    ),

  addResponsableToPolitica: (idPolitica: number, payload: PoliticaResponsableCreateDto) =>
    api.post<void>(`/api/politicas/${idPolitica}/responsables`, payload),

  removeResponsableFromPolitica: (idPolitica: number, idUnidad: number) =>
    api.del<void>(`/api/politicas/${idPolitica}/responsables/${idUnidad}`),

};