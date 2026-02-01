import { api } from "./../../../shared/api"; // 🔁 ajusta ruta según tu estructura

export type UsuarioDto = {
  idUsuario: number;
  nombre: string;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  nombreCompleto?: string | null;
  email: string;
  username: string;
  telefono?: string | null;
  cargo?: string | null;

  idPerfil?: number | null;
  perfilNombre?: string | null;

  activo: boolean;
  bloqueado?: boolean;
  ultimoAcceso?: string | null;
  fechaCreacion?: string | null;
};

export type CreateUsuarioDto = {
  nombre: string;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  email: string;
  username: string;
  password: string;
  idPerfil: number;
  idUnidad?: number | null;
  telefono?: string | null;
  cargo?: string | null;
};

export type UpdateUsuarioDto = {
  idUsuario: number;
  nombre: string;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  email: string;
  idPerfil?: number | null;
  idUnidad?: number | null;
  telefono?: string | null;
  cargo?: string | null;
  fotoUrl?: string | null;
};

export const UsuariosAction = {
  listar: () => api.get<UsuarioDto[]>("/api/Usuarios"),
  obtener: (id: number) => api.get<UsuarioDto>(`/api/Usuarios/${id}`),
  crear: (dto: CreateUsuarioDto) => api.post<number>("/api/Usuarios", dto),
  actualizar: (id: number, dto: UpdateUsuarioDto) => api.put<boolean>(`/api/Usuarios/${id}`, dto),
  inactivar: (id: number) => api.del<boolean>(`/api/Usuarios/${id}`),
};