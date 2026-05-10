// src/shared/api.ts

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: string[];
};

export type DownloadBlobResult = {
  blob: Blob;
  fileName: string;
  contentType: string;
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

function buildApiUrl(path: string): string {
  const base = (API_URL ?? "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
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
      if (parts.length) return clip(parts.join(" | "));
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

function getFileNameFromContentDisposition(
  contentDisposition: string | null,
  fallbackFileName: string
): string {
  if (!contentDisposition) return fallbackFileName;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["]/g, ""));
    } catch {
      return utf8Match[1].replace(/["]/g, "");
    }
  }

  const normalMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (normalMatch?.[1]) {
    return normalMatch[1].replace(/["]/g, "");
  }

  return fallbackFileName;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const url = buildApiUrl(path);

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

  if (isRecord(payload) && "success" in payload) {
    const success = payload["success"];

    if (success === false) {
      throw new Error(buildErrorMessage(payload, "Error inesperado"));
    }

    return (payload["data"] as T) ?? (undefined as unknown as T);
  }

  return payload as T;
}

async function downloadBlob(
  path: string,
  fallbackFileName = "archivo"
): Promise<DownloadBlobResult> {
  const token = getToken();
  const url = buildApiUrl(path);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    const payload = await parseResponseBody(res);
    throw new Error(buildErrorMessage(payload, `HTTP ${res.status} - ${path}`));
  }

  if (contentType.toLowerCase().includes("text/html")) {
    const html = await res.text();

    throw new Error(
      clip(
        `El endpoint devolvió HTML en lugar del archivo. Verifica VITE_API_URL, ruta del backend o autenticación. Respuesta: ${html}`,
        600
      )
    );
  }

  const blob = await res.blob();

  const fileName = getFileNameFromContentDisposition(
    res.headers.get("content-disposition"),
    fallbackFileName
  );

  return {
    blob,
    fileName,
    contentType,
  };
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

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),

  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  downloadBlob,
};