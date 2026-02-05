import { api } from "../../shared/api";

export interface UnidadOrganizacionalDto {
  idUnidad: number;
  codigo: string;
  nombre: string;
  siglas?: string | null;
  tipo?: string | null;
  responsable?: string | null;
  email?: string | null;
  estado?: string | null;
}

export interface CentroCostoDto {
  idCentroCosto: number;
  codigo: string;
  nombre: string;
  idUnidadEjecutora?: number | null;
  idUnidadResponsable?: number | null;
  estado?: string | null;

  nombreUnidadResponsable?: string | null;
  nombreUnidadEjecutora?: string | null;
}

export interface CentroCostoCreateUpdateDto {
  codigo: string;
  nombre: string;
  idUnidadEjecutora?: number | null;
  idUnidadResponsable?: number | null;
  estado?: string; // por defecto ACTIVO
}

export interface UnidadEjecutoraDto {
  idUnidadEjecutora: number;
  codigo: string;
  nombre: string;
  tipo?: string | null;
  estado?: string | null;
  idPliego?: number | null;
}

export const UnidadesOrgCentroCostoAction = {
  getUnidadesOrg: (soloActivas = true) =>
    api.get<UnidadOrganizacionalDto[]>(
      `/api/unidades-org?soloActivas=${soloActivas ? "true" : "false"}`
    ),

  getUnidadesEjecutoras: (soloActivos = true) =>
    api.get<UnidadEjecutoraDto[]>(
      `/api/unidades-ejecutoras?soloActivos=${soloActivos ? "true" : "false"}`
    ),

  getCentrosCostoByUnidad: (idUnidad: number, soloActivos = true) =>
    api.get<CentroCostoDto[]>(
      `/api/centros-costo/unidad/${idUnidad}?soloActivos=${soloActivos ? "true" : "false"}`
    ),

  // ✅ Para editar (si tu backend lo expone)
  getCentroCostoById: (idCentroCosto: number) =>
    api.get<CentroCostoDto>(`/api/centros-costo/${idCentroCosto}`),

  createCentroCosto: (dto: CentroCostoCreateUpdateDto) =>
    api.post<number>(`/api/centros-costo`, dto),

  // ✅ Update (PUT)
  updateCentroCosto: (idCentroCosto: number, dto: CentroCostoCreateUpdateDto) =>
    api.put<void>(`/api/centros-costo/${idCentroCosto}`, dto),

  deleteCentroCosto: (idCentroCosto: number) =>
    api.del<void>(`/api/centros-costo/${idCentroCosto}`)
};
