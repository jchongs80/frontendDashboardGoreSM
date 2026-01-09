// src/shared/api.ts
export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: string[];
};

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "";

function getToken(): string | null {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("token") ||
    null
  );
}

function clip(text: string, max = 450): string {
  const t = (text ?? "").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function buildErrorMessage(payload: any, fallback: string): string {
  const msg =
    payload?.message ||
    (Array.isArray(payload?.errors) && payload.errors.length
      ? payload.errors.join(" | ")
      : null);

  if (msg) return msg;

  if (typeof payload === "string" && payload.trim().length) {
    return clip(payload);
  }

  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const url =
    API_URL && API_URL.endsWith("/") && path.startsWith("/")
      ? `${API_URL.slice(0, -1)}${path}`
      : `${API_URL}${path}`;

  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as unknown as T;

  const contentType = res.headers.get("content-type") || "";
  let payload: any = null;

  try {
    if (contentType.includes("application/json")) payload = await res.json();
    else payload = await res.text();
  } catch {
    try {
      payload = await res.text();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    throw new Error(buildErrorMessage(payload, `HTTP ${res.status} - ${path}`));
  }

  // Wrapper ApiResponseDto<T>
  if (payload && typeof payload === "object" && "success" in payload) {
    if (payload.success === false) {
      throw new Error(buildErrorMessage(payload, "Error inesperado"));
    }
    return payload.data as T;
  }

  // JSON “plano”
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: <T>(path: string, body?: any) =>
    request<T>(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};