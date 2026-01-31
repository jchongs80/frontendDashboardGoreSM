// src/shared/api.ts

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: string[];
};

const API_URL = import.meta.env?.VITE_API_URL ?? "";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload)) {
    const msg = payload["message"];
    const errors = payload["errors"];

    if (typeof msg === "string" && msg.trim().length) {
    if (Array.isArray(errors) && errors.length) {
      const parts = errors.filter((x) => typeof x === "string") as string[];
      if (parts.length) return clip(`${msg}: ${parts.join(" | ")}`);
    }
    return clip(msg);
  }


    if (Array.isArray(errors) && errors.length) {
      const parts = errors.filter((x) => typeof x === "string") as string[];
      if (parts.length) return parts.join(" | ");
    }
  }

  if (typeof payload === "string" && payload.trim().length) {
    return clip(payload);
  }

  return fallback;
}

async function parseResponseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;

  const contentType = res.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) return await res.json();
    return await res.text();
  } catch {
    try {
      return await res.text();
    } catch {
      return null;
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();

  const base = (API_URL ?? "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = base ? `${base}${p}` : p;

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

  const payload = await parseResponseBody(res);

  if (!res.ok) {
    throw new Error(buildErrorMessage(payload, `HTTP ${res.status} - ${path}`));
  }

  // Wrapper ApiResponseDto<T>
  if (isRecord(payload) && "success" in payload) {
    const success = payload["success"];
    if (success === false) {
      throw new Error(buildErrorMessage(payload, "Error inesperado"));
    }
    return (payload["data"] as T) ?? (undefined as unknown as T);
  }

  // JSON “plano”
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),

  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
