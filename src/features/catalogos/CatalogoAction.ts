// src/features/catalogos/CatalogoAction.ts
import { api } from "../../shared/api";


/* =========================
   DTOs (según tu backend)
========================= */

export type DimensionDto = {
  idDimension: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  orden?: number | null;
  estado: string; // "ACTIVO" | "INACTIVO"
};

export type ActualizarDimensionDto = {
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
  icono?: string | null;
  orden?: number | null;
  estado: string;
};

export type FuenteDatoDto = {
  idFuenteDatos: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  tipoFuente?: string | null;
  periodicidad?: string | null;
  responsable?: string | null;
  emailContacto?: string | null;
  url?: string | null;
  estado?: string | null; // si tu tabla lo tiene
};

export type ActualizarFuenteDatoDto = {
  nombre: string;
  descripcion?: string | null;
  tipoFuente?: string | null;
  periodicidad?: string | null;
  responsable?: string | null;
  emailContacto?: string | null;
  url?: string | null;
  estado?: string | null;
};

export type InstrumentoDto = {
  idInstrumento: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  horizonteTemporal?: string | null;
  nivel?: string | null;
  vigenciaDesde?: string | null; // ISO
  vigenciaHasta?: string | null;
  estado: string;
  archivoDocumento?: string | null;
  fechaAprobacion?: string | null;
  resolucionAprobacion?: string | null;
};

export type InstrumentoCreateUpdateDto = {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  horizonteTemporal?: string | null;
  nivel?: string | null;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
  estado: string;
  archivoDocumento?: string | null;
  fechaAprobacion?: string | null;
  resolucionAprobacion?: string | null;
};

export type TipoIndicadorDto = {
  idTipoIndicador: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  orden?: number | null;
  estado?: string | null; // si aplica
};

export type ActualizarTipoIndicadorDto = {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  orden?: number | null;
  estado?: string | null;
};

export type UnidadMedidaDto = {
  idUnidadMedida: number;
  codigo: string;
  nombre: string;
  simbolo?: string | null;
  tipo?: string | null;
  estado?: string | null; // si aplica
};

export type ActualizarUnidadMedidaDto = {
  codigo: string;
  nombre: string;
  simbolo?: string | null;
  tipo?: string | null;
  estado?: string | null;
};

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
  estado?: string | null;
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
  estado?: string | null;
};

/* =========================
   Actions (usa tus endpoints /api/...)
========================= */

export const CatalogoAction = {
  // LIST (GET)
  getDimensiones: () => api.get<DimensionDto[]>("/api/dimensiones"),
  getFuentesDatos: () => api.get<FuenteDatoDto[]>("/api/fuentesdatos"),
  getInstrumentos: () => api.get<InstrumentoDto[]>("/api/instrumentos"),
  getTiposIndicador: () => api.get<TipoIndicadorDto[]>("/api/tiposindicador"),
  getUnidadesMedida: () => api.get<UnidadMedidaDto[]>("/api/unidadesmedida"),
  getUnidadesOrganizacionales: () => api.get<UnidadOrganizacionalDto[]>("/api/unidades-org"),


  updateDimension: (id: number, payload: ActualizarDimensionDto) =>
    api.put<void>(`/api/dimensiones/${id}`, payload),

  updateFuenteDatos: (id: number, payload: ActualizarFuenteDatoDto) =>
    api.put<void>(`/api/fuentesdatos/${id}`, payload),

  updateInstrumento: (id: number, payload: InstrumentoCreateUpdateDto) =>
    api.put<void>(`/api/instrumentos/${id}`, payload),

  updateTipoIndicador: (id: number, payload: ActualizarTipoIndicadorDto) =>
    api.put<void>(`/api/tiposindicador/${id}`, payload),

  updateUnidadMedida: (id: number, payload: ActualizarUnidadMedidaDto) =>
    api.put<void>(`/api/unidadesmedida/${id}`, payload),

  updateUnidadOrg: (id: number, payload: UnidadOrganizacionalUpdateDto) =>
    api.put<void>(`/api/unidades-org/${id}`, payload),
};