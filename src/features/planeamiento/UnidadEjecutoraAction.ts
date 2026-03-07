// features/planeamiento/UnidadEjecutoraAction.ts
import { api } from "../../shared/api";

export type UnidadEjecutoraDto = {
  idUnidadEjecutora: number;
  codigo: string;
  nombre: string;
  tipo?: string | null;
  idPliego?: number | null;
  estado?: string | null;
};

export type UnidadEjecutoraCreateUpdateDto = {
  codigo: string;
  nombre: string;
  tipo?: string | null;
  idPliego?: number | null;
  estado: string; // "ACTIVO" | "INACTIVO"
};

export const UnidadEjecutoraAction = {
  getUnidadesEjecutoras: (soloActivos = true) =>
    api.get<UnidadEjecutoraDto[]>(`/api/unidades-ejecutoras?soloActivos=${soloActivos}`),

  getById: (id: number) => api.get<UnidadEjecutoraDto>(`/api/unidades-ejecutoras/${id}`),

  createUnidadEjecutora: (payload: UnidadEjecutoraCreateUpdateDto) =>
    api.post<void>(`/api/unidades-ejecutoras`, payload),

  updateUnidadEjecutora: (id: number, payload: UnidadEjecutoraCreateUpdateDto) =>
    api.put<void>(`/api/unidades-ejecutoras/${id}`, payload),

  cambiarEstado: (id: number, estado: "ACTIVO" | "INACTIVO") =>
    api.patch<void>(`/api/unidades-ejecutoras/${id}/estado`, { estado }),
};
