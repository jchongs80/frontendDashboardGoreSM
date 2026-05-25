import { api } from "../../shared/api";

export type EstadoTexto = "ACTIVO" | "INACTIVO";

export type CatalogoComboDto = {
  id: number;
  codigo: string;
  nombre: string;
  display?: string;
};

export type CatalogoInstrumentoDto = {
  idInstrumento: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  horizonteTemporal?: string | null;
  nivel?: string | null;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
  estado: EstadoTexto | string;
  archivoDocumento?: string | null;
  fechaAprobacion?: string | null;
  resolucionAprobacion?: string | null;
};

export type CatalogoInstrumentoUpsertDto = Omit<CatalogoInstrumentoDto, "idInstrumento">;

export type CatalogoPeriodoDto = {
  idPeriodo: number;
  codigo: string;
  descripcion: string;
  estado: boolean;
  idInstrumento: number;
  instrumentoCodigo?: string | null;
  instrumentoNombre?: string | null;
};

export type CatalogoPeriodoUpsertDto = {
  codigo: string;
  descripcion: string;
  estado: boolean;
  idInstrumento: number;
};

export type CatalogoDimensionDto = {
  idDimension: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  orden?: number | null;
  estado: EstadoTexto | string;
  idInstrumento: number;
  instrumentoCodigo?: string | null;
  instrumentoNombre?: string | null;
};

export type CatalogoDimensionUpsertDto = Omit<CatalogoDimensionDto, "idDimension" | "instrumentoCodigo" | "instrumentoNombre">;

export type CatalogoUnidadOrgDto = {
  idUnidad: number;
  codigo: string;
  nombre: string;
  siglas?: string | null;
  tipo?: string | null;
  idUnidadPadre?: number | null;
  unidadPadreNombre?: string | null;
  responsableCargo?: string | null;
  responsableNombre?: string | null;
  email?: string | null;
  telefono?: string | null;
  estado: EstadoTexto | string;
};

export type CatalogoUnidadOrgUpsertDto = Omit<CatalogoUnidadOrgDto, "idUnidad" | "unidadPadreNombre">;

export type CatalogoCcResponsablePoiDto = {
  idCcResponsable: number;
  codigo: string;
  descripcion: string;
  idUnidadEjecutora?: number | null;
  unidadEjecutoraCodigo?: string | null;
  unidadEjecutoraNombre?: string | null;
  estado: EstadoTexto | string;
};

export type CatalogoCcResponsablePoiUpsertDto = Omit<CatalogoCcResponsablePoiDto, "idCcResponsable" | "unidadEjecutoraCodigo" | "unidadEjecutoraNombre">;

const base = "/api/catalogos-mantenimiento";

export const CatalogoMantenimientoAction = {
  getInstrumentos: () => api.get<CatalogoInstrumentoDto[]>(`${base}/instrumentos`),
  createInstrumento: (payload: CatalogoInstrumentoUpsertDto) => api.post<void>(`${base}/instrumentos`, payload),
  updateInstrumento: (id: number, payload: CatalogoInstrumentoUpsertDto) => api.put<void>(`${base}/instrumentos/${id}`, payload),

  getPeriodos: () => api.get<CatalogoPeriodoDto[]>(`${base}/periodos`),
  createPeriodo: (payload: CatalogoPeriodoUpsertDto) => api.post<void>(`${base}/periodos`, payload),
  updatePeriodo: (id: number, payload: CatalogoPeriodoUpsertDto) => api.put<void>(`${base}/periodos/${id}`, payload),

  getDimensiones: () => api.get<CatalogoDimensionDto[]>(`${base}/dimensiones`),
  createDimension: (payload: CatalogoDimensionUpsertDto) => api.post<void>(`${base}/dimensiones`, payload),
  updateDimension: (id: number, payload: CatalogoDimensionUpsertDto) => api.put<void>(`${base}/dimensiones/${id}`, payload),

  getUnidadesOrg: () => api.get<CatalogoUnidadOrgDto[]>(`${base}/unidades-org`),
  createUnidadOrg: (payload: CatalogoUnidadOrgUpsertDto) => api.post<void>(`${base}/unidades-org`, payload),
  updateUnidadOrg: (id: number, payload: CatalogoUnidadOrgUpsertDto) => api.put<void>(`${base}/unidades-org/${id}`, payload),

  getCcResponsablesPoi: () => api.get<CatalogoCcResponsablePoiDto[]>(`${base}/cc-responsables-poi`),
  createCcResponsablePoi: (payload: CatalogoCcResponsablePoiUpsertDto) => api.post<void>(`${base}/cc-responsables-poi`, payload),
  updateCcResponsablePoi: (id: number, payload: CatalogoCcResponsablePoiUpsertDto) => api.put<void>(`${base}/cc-responsables-poi/${id}`, payload),

  getInstrumentosCombo: () => api.get<CatalogoComboDto[]>(`${base}/combos/instrumentos`),
  getUnidadesOrgCombo: () => api.get<CatalogoComboDto[]>(`${base}/combos/unidades-org`),
  getUnidadesEjecutorasCombo: () => api.get<CatalogoComboDto[]>(`${base}/combos/unidades-ejecutoras`),
};
