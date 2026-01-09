import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthAction, type LoginResponseDto, type UsuarioInfoDto } from "./AuthAction";

type AuthState = {
  isReady: boolean;
  isAuthenticated: boolean;
  user: UsuarioInfoDto | null;
  login: (emailOrUsername: string, password: string, recordarSesion: boolean) => Promise<LoginResponseDto>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function getStorage(): Storage {
  // si existe token en localStorage asumimos sesión recordada
  return localStorage.getItem("token") ? localStorage : sessionStorage;
}

function setSession(data: LoginResponseDto, recordarSesion: boolean) {
  const storage = recordarSesion ? localStorage : sessionStorage;

  // limpia ambos para evitar mezclas
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("tokenExpiration");
  localStorage.removeItem("user");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("tokenExpiration");
  sessionStorage.removeItem("user");

  storage.setItem("token", data.token);
  storage.setItem("refreshToken", data.refreshToken);
  storage.setItem("tokenExpiration", data.tokenExpiration);
  storage.setItem("user", JSON.stringify(data.usuario));
}

function clearSession() {
  ["token", "refreshToken", "tokenExpiration", "user"].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

function isExpired(expIso?: string | null) {
  if (!expIso) return true;
  const exp = new Date(expIso).getTime();
  return Number.isNaN(exp) || Date.now() >= exp;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<UsuarioInfoDto | null>(null);

  const isAuthenticated = !!(localStorage.getItem("token") || sessionStorage.getItem("token"));

  useEffect(() => {
    (async () => {
      try {
        const storage = getStorage();
        const token = storage.getItem("token");
        const refreshToken = storage.getItem("refreshToken");
        const tokenExpiration = storage.getItem("tokenExpiration");
        const userRaw = storage.getItem("user");

        if (token && userRaw && !isExpired(tokenExpiration)) {
          setUser(JSON.parse(userRaw));
          setIsReady(true);
          return;
        }

        // Si token expiró y hay refresh, renovamos
        if (token && refreshToken) {
          const refreshed = await AuthAction.refreshToken({ token, refreshToken });
          // conservar “recordar” según storage actual
          const recordarSesion = storage === localStorage;
          setSession(refreshed, recordarSesion);
          setUser(refreshed.usuario);
          setIsReady(true);
          return;
        }

        clearSession();
      } catch {
        clearSession();
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      isReady,
      isAuthenticated,
      user,
      login: async (emailOrUsername, password, recordarSesion) => {
        const data = await AuthAction.login({ emailOrUsername, password, recordarSesion });
        setSession(data, recordarSesion);
        setUser(data.usuario);
        return data;
      },
      logout: async () => {
        try {
          await AuthAction.logout();
        } catch {
          // si falla igual limpiamos
        } finally {
          clearSession();
          setUser(null);
        }
      },
    }),
    [isReady, isAuthenticated, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}