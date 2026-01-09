export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
};

export type LoginRequestDto = {
  emailOrUsername: string;
  password: string;
  recordarSesion: boolean;
};

export type UsuarioInfoDto = {
  idUsuario: number;
  email: string;
  username: string;
  nombreCompleto: string;
  perfil?: string | null;
  nivelAcceso?: number | null;
  permisos?: {
    puedeCrearUsuarios: boolean;
    puedeModificarIndicadores: boolean;
    puedeEliminarRegistros: boolean;
    puedeGenerarReportes: boolean;
    puedeGestionarPoi: boolean;
  };
};

export type LoginResponseDto = {
  token: string;
  refreshToken: string;
  tokenExpiration: string; // DateTime -> llega ISO
  usuario: UsuarioInfoDto;
  requiereCambioPassword: boolean;
};

export type RefreshTokenRequestDto = {
  token: string;
  refreshToken: string;
};

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "";

function getToken(): string | null {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    const msg = json.message || (json.errors?.length ? json.errors.join(" | ") : "Error");
    throw new Error(msg);
  }

  return json.data as T;
}

export const AuthAction = {
  login: (payload: LoginRequestDto) =>
    api<LoginResponseDto>("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refreshToken: (payload: RefreshTokenRequestDto) =>
    api<LoginResponseDto>("/api/Auth/refresh-token", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => api<UsuarioInfoDto>("/api/Auth/me"),

  logout: () => api<boolean>("/api/Auth/logout", { method: "POST" }),
};