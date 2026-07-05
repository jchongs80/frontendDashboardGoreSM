import type { UsuarioInfoDto } from "./AuthAction";

export const PerfilId = {
  Administrador: 1,
  GestorIndicadores: 2,
  GestorPoi: 3,
  Analista: 4,
  Consultor: 5,
  Lector: 6,
} as const;

export type PerfilId = (typeof PerfilId)[keyof typeof PerfilId];

export type PerfilPermission = keyof NonNullable<UsuarioInfoDto["permisos"]>;

function normalizar(texto?: string | null): string {
  return (texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getPerfilId(user: UsuarioInfoDto | null | undefined): PerfilId | null {
  if (!user) return null;

  if (typeof user.idPerfil === "number" && user.idPerfil > 0) {
    return user.idPerfil as PerfilId;
  }

  const nombrePerfil = normalizar(user.perfilNombre ?? user.perfil);

  if (nombrePerfil === "administrador") return PerfilId.Administrador;
  if (nombrePerfil === "gestor de indicadores") return PerfilId.GestorIndicadores;
  if (nombrePerfil === "gestor poi") return PerfilId.GestorPoi;
  if (nombrePerfil === "analista") return PerfilId.Analista;
  if (nombrePerfil === "consultor") return PerfilId.Consultor;
  if (nombrePerfil === "lector") return PerfilId.Lector;

  return null;
}

export function esAdministrador(user: UsuarioInfoDto | null | undefined): boolean {
  return (
    getPerfilId(user) === PerfilId.Administrador ||
    user?.permisos?.puedeCrearUsuarios === true
  );
}

export function tienePermiso(
  user: UsuarioInfoDto | null | undefined,
  permiso: PerfilPermission
): boolean {
  if (!user) return false;
  if (esAdministrador(user)) return true;

  return user.permisos?.[permiso] === true;
}

export function tieneAlgunPermiso(
  user: UsuarioInfoDto | null | undefined,
  permisos: PerfilPermission[]
): boolean {
  if (!permisos.length) return true;
  return permisos.some((permiso) => tienePermiso(user, permiso));
}

export function tieneTodosLosPermisos(
  user: UsuarioInfoDto | null | undefined,
  permisos: PerfilPermission[]
): boolean {
  if (!permisos.length) return true;
  return permisos.every((permiso) => tienePermiso(user, permiso));
}

export function tienePerfil(
  user: UsuarioInfoDto | null | undefined,
  perfilesPermitidos: PerfilId[]
): boolean {
  if (!user) return false;
  if (esAdministrador(user)) return true;

  const idPerfil = getPerfilId(user);
  return !!idPerfil && perfilesPermitidos.includes(idPerfil);
}

export function puedeAcceder(
  user: UsuarioInfoDto | null | undefined,
  opciones?: {
    perfilesPermitidos?: PerfilId[];
    permisosPermitidos?: PerfilPermission[];
    requiereTodosLosPermisos?: boolean;
  }
): boolean {
  if (!user) return false;

  const perfilesPermitidos = opciones?.perfilesPermitidos ?? [];
  const permisosPermitidos = opciones?.permisosPermitidos ?? [];
  const requiereTodosLosPermisos = opciones?.requiereTodosLosPermisos ?? false;

  if (!perfilesPermitidos.length && !permisosPermitidos.length) {
    return true;
  }

  if (esAdministrador(user)) {
    return true;
  }

  const okPerfil = perfilesPermitidos.length
    ? tienePerfil(user, perfilesPermitidos)
    : false;

  const okPermisos = permisosPermitidos.length
    ? requiereTodosLosPermisos
      ? tieneTodosLosPermisos(user, permisosPermitidos)
      : tieneAlgunPermiso(user, permisosPermitidos)
    : false;

  return okPerfil || okPermisos;
}