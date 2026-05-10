export type ApiResponseDto<T> = {
  success?: boolean;
  isSuccess?: boolean;
  message?: string;
  data?: T;
  errors?: string[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function unwrapObject<T>(resp: unknown): T | null {
  if (isRecord(resp) && "data" in resp) {
    return ((resp as ApiResponseDto<T>).data ?? null) as T | null;
  }

  return (resp as T) ?? null;
}