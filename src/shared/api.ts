// src/shared/api.ts

export type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  mensaje?: string;
  data?: T;
  errors?: string[];
  errores?: unknown[];
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

function clip(text: string, max = 900): string {
  const t = (text ?? "").trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length
    ? value.trim()
    : null;
}

function buildApiUrl(path: string): string {
  const base = (API_URL ?? "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function extraerMensajeDeErrorItem(item: unknown): string | null {
  if (typeof item === "string" && item.trim().length) {
    return item.trim();
  }

  if (!isRecord(item)) {
    return null;
  }

  const numeroFila = item["numeroFila"] ?? item["fila"];
  const campo = item["campo"];
  const mensaje = item["mensaje"] ?? item["message"];
  const valor = item["valor"];

  const partes: string[] = [];

  if (typeof numeroFila === "number" && numeroFila > 0) {
    partes.push(`Fila ${numeroFila}`);
  }

  if (typeof campo === "string" && campo.trim().length) {
    partes.push(`Campo: ${campo.trim()}`);
  }

  if (typeof mensaje === "string" && mensaje.trim().length) {
    partes.push(mensaje.trim());
  }

  if (typeof valor === "string" && valor.trim().length) {
    partes.push(`Valor: ${valor.trim()}`);
  }

  return partes.length ? partes.join(" - ") : null;
}

function buildErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload)) {
    const msg =
      getString(payload["mensaje"]) ||
      getString(payload["message"]) ||
      getString(payload["title"]);

    const errores = payload["errores"] ?? payload["errors"];

    if (Array.isArray(errores) && errores.length > 0) {
      const detalles = errores
        .map(extraerMensajeDeErrorItem)
        .filter((x): x is string => !!x);

      if (detalles.length > 0) {
        if (msg) {
          return clip(`${msg}: ${detalles.join(" | ")}`);
        }

        return clip(detalles.join(" | "));
      }
    }

    if (msg) {
      return clip(msg);
    }

    try {
      const json = JSON.stringify(payload);
      if (json && json !== "{}") {
        return clip(json);
      }
    } catch {
      return fallback;
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
    if (contentType.includes("application/json")) {
      return await res.json();
    }

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

  /*
    Caso 1:
    Backend devuelve:
    {
      success: false,
      mensaje: "...",
      errores: [...]
    }

    En ese caso lanzamos el error con el detalle real.
  */
  if (isRecord(payload) && "success" in payload) {
    const success = payload["success"];

    if (success === false) {
      throw new Error(buildErrorMessage(payload, "Error inesperado"));
    }

    /*
      Caso 2:
      Backend devuelve envoltorio:
      {
        success: true,
        data: {...}
      }

      Se retorna data.
    */
    if ("data" in payload) {
      return payload["data"] as T;
    }

    /*
      Caso 3:
      Backend devuelve directamente el DTO:
      {
        success: true,
        mensaje: "...",
        totalFilasLeidas: ...
      }

      Se retorna payload completo.
    */
    return payload as T;
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
        900
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