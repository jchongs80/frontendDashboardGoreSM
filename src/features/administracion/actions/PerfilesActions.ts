import { api } from "./../../../shared/api"; // 🔁 ajusta ruta

export type PerfilDto = {
  idPerfil: number;
  nombre: string;
  descripcion?: string | null;
  nivelAcceso?: number | null;
  activo: boolean;

  puedeCrearUsuarios: boolean;
  puedeModificarIndicadores: boolean;
  puedeEliminarRegistros: boolean;
  puedeGenerarReportes: boolean;
  puedeGestionarPoi: boolean;
  puedeVerDashboard: boolean;
};

export const PerfilesAction = {
  listar: () => api.get<PerfilDto[]>("/api/Perfiles"),
};