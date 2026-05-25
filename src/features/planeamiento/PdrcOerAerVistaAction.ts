import { api } from "../../shared/api";

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

function unwrapList<T>(resp: unknown): T[] {
  if (Array.isArray(resp)) return resp as T[];

  if (isRecord(resp) && "data" in resp) {
    const data = (resp as ApiResponseDto<T[]>).data;
    return Array.isArray(data) ? data : [];
  }

  return [];
}

function unwrapData<T>(resp: unknown): T | null {
  if (resp == null) return null;

  if (isRecord(resp) && "data" in resp) {
    return ((resp as ApiResponseDto<T>).data ?? null) as T | null;
  }

  return resp as T;
}

function descargarBlobEnNavegador(blob: Blob, fileName: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName || "archivo";
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

function buildIndicadorFichaArchivoDownloadPath(
  idPdrcOerAer: number,
  idIndicadorNombre: number
): string {
  const qp = new URLSearchParams({
    idPdrcOerAer: String(idPdrcOerAer),
    idIndicadorNombre: String(idIndicadorNombre),
  });

  return `/api/PdrcOerAerVista/indicador-ficha/descargar?${qp.toString()}`;
}

export type PdrcPeriodoDto = {
  idPeriodo: number;
  codigo: string | null;
  descripcion: string | null;
};

export type PdrcDimensionDto = {
  idDimension: number;
  codigo: string | null;
  nombre: string | null;
  orden?: number | null;
};

export type PdrcUnidadOrgDto = {
  idUnidad: number;
  codigo: string | null;
  nombre: string | null;
};

export type PdrcObjetivoDto = {
  idObjetivo: number;
  codigo: string | null;
  enunciado: string | null;
};

export type PdrcOerAerMasterDto = {
  idPdrcOerAer: number;
  idPdrcEntidadEstrategica: number;
  tipoNivel: "OER" | "AER";
  idObjetivo: number;
  idAccion?: number | null;
  codigoOer: string;
  enunciadoOer: string;
  codigoAer?: string | null;
  enunciadoAer?: string | null;
  cantidadIndicadores: number;
};

export type PdrcOerAerDetailDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
};

export type PdrcIndicadorDetalleAnioDto = {
  idAnioProyeccion: number;
  anio: number;
};

export type PdrcIndicadorDetalleTipoValorDto = {
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
};

export type PdrcIndicadorDetalleMetValorDto = {
  idPdrcIndMet: number;
  codigoMet: string;
  nombreMet: string;
  valor: number;
};

export type PdrcIndicadorEjecutadoValorDto = {
  idPdrcIndMet: number;
  codigoMet: string;
  nombreMet: string;
  valor: number;
};

export type PdrcIndicadorEjecutadoUpdateItemDto = {
  idPdrcIndMet: number;
  valor: number;
};

export type PdrcIndicadorEjecutadoUpdateRequestDto = {
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  idAnioProyeccion: number;
  valores: PdrcIndicadorEjecutadoUpdateItemDto[];
};

export type PdrcIndicadorDetalleLineaBaseDto = {
  idAnioProyeccion: number;
  anio: number;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  valorAbsolutoA: number;
  valorAbsolutoB: number;
  valorRelativo: number;
};

export type PdrcIndicadorDetalleResponseDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  idPdrcEntidadEstrategica: number;
  tipoNivel: "OER" | "AER";
  codigoOer: string;
  enunciadoOer: string;
  codigoAer?: string | null;
  enunciadoAer?: string | null;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  lineaBase?: PdrcIndicadorDetalleLineaBaseDto | null;
  tiposValor: PdrcIndicadorDetalleTipoValorDto[];
  anios: PdrcIndicadorDetalleAnioDto[];
  valoresMet: PdrcIndicadorDetalleMetValorDto[];
  valoresEjecutados: PdrcIndicadorEjecutadoValorDto[];
};

export type PdrcIndicadorInfoDto = {
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  factoresAvance: string | null;
  medidasRecomendadas: string | null;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
};

export type PdrcIndicadorInfoUpdateRequestDto = {
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  factoresAvance: string | null;
  medidasRecomendadas: string | null;
};

export type PdrcIndicadorFichaArchivoDto = {
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  nombreArchivo: string | null;
  nombreOriginal: string | null;
  extension: string | null;
  contentType: string | null;
  tamanioBytes: number;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
};

export type PdrcIndicadorFichaArchivoBlobDto = {
  blob: Blob;
  fileName: string;
  contentType: string;
};

export const PdrcOerAerVistaAction = {
  async getPeriodos() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/periodos`);
    return unwrapList<PdrcPeriodoDto>(resp);
  },

  async getDimensiones() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/dimensiones`);
    return unwrapList<PdrcDimensionDto>(resp);
  },

  async getUnidadesOrganizacionales() {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/unidades-organizacionales`);
    return unwrapList<PdrcUnidadOrgDto>(resp);
  },

  async getMaster(idPeriodo: number, idDimension: number, idUnidad: number) {
    const resp = await api.get<unknown>(
      `/api/PdrcOerAerVista/master?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idUnidad=${idUnidad}`
    );
    return unwrapList<PdrcOerAerMasterDto>(resp);
  },

  async getDetail(idPdrcOerAer: number) {
    const resp = await api.get<unknown>(`/api/PdrcOerAerVista/${idPdrcOerAer}/detail`);
    return unwrapList<PdrcOerAerDetailDto>(resp);
  },

  async getIndicadorDetalle(
    idPdrcOerAer: number,
    idIndicadorNombre: number,
    idAnioProyeccion?: number | null,
    idPdrcIndTv?: number | null
  ): Promise<PdrcIndicadorDetalleResponseDto | null> {
    const qp = new URLSearchParams({
      idPdrcOerAer: String(idPdrcOerAer),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    if (idAnioProyeccion != null) {
      qp.append("idAnioProyeccion", String(idAnioProyeccion));
    }

    if (idPdrcIndTv != null) {
      qp.append("idPdrcIndTv", String(idPdrcIndTv));
    }

    const resp = await api.get<unknown>(
      `/api/PdrcOerAerVista/indicador-detalle?${qp.toString()}`
    );

    return unwrapData<PdrcIndicadorDetalleResponseDto>(resp);
  },

  async guardarIndicadorEjecutado(payload: PdrcIndicadorEjecutadoUpdateRequestDto) {
    return await api.post(`/api/PdrcOerAerVista/indicador-ejecutado`, payload);
  },

  async getObjetivosFiltro(idPeriodo: number, idDimension: number, idUnidad: number) {
    const resp = await api.get<unknown>(
      `/api/PdrcOerAerVista/objetivos?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idUnidad=${idUnidad}`
    );
    return unwrapList<PdrcObjetivoDto>(resp);
  },

  async getIndicadorInfo(
    idPdrcOerAer: number,
    idIndicadorNombre: number
  ): Promise<PdrcIndicadorInfoDto | null> {
    const qp = new URLSearchParams({
      idPdrcOerAer: String(idPdrcOerAer),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    const resp = await api.get<unknown>(
      `/api/PdrcOerAerVista/indicador-info?${qp.toString()}`
    );

    return unwrapData<PdrcIndicadorInfoDto>(resp);
  },

  async guardarIndicadorInfo(payload: PdrcIndicadorInfoUpdateRequestDto) {
    return await api.post(`/api/PdrcOerAerVista/indicador-info`, payload);
  },

  async getIndicadorFichaArchivo(
    idPdrcOerAer: number,
    idIndicadorNombre: number
  ): Promise<PdrcIndicadorFichaArchivoDto | null> {
    const qp = new URLSearchParams({
      idPdrcOerAer: String(idPdrcOerAer),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    const resp = await api.get<unknown>(
      `/api/PdrcOerAerVista/indicador-ficha?${qp.toString()}`
    );

    return unwrapData<PdrcIndicadorFichaArchivoDto>(resp);
  },

  async guardarIndicadorFichaArchivo(
    idPdrcOerAer: number,
    idIndicadorNombre: number,
    archivo: File
  ) {
    const formData = new FormData();

    formData.append("idPdrcOerAer", String(idPdrcOerAer));
    formData.append("idIndicadorNombre", String(idIndicadorNombre));
    formData.append("archivo", archivo);

    return await api.post(`/api/PdrcOerAerVista/indicador-ficha`, formData);
  },

  getIndicadorFichaArchivoDownloadUrl(
    idPdrcOerAer: number,
    idIndicadorNombre: number
  ): string {
    return buildIndicadorFichaArchivoDownloadPath(idPdrcOerAer, idIndicadorNombre);
  },

  async obtenerIndicadorFichaArchivoBlob(
    idPdrcOerAer: number,
    idIndicadorNombre: number,
    fallbackFileName?: string | null
  ): Promise<PdrcIndicadorFichaArchivoBlobDto> {
    const result = await api.downloadBlob(
      buildIndicadorFichaArchivoDownloadPath(idPdrcOerAer, idIndicadorNombre),
      fallbackFileName || "ficha_indicador"
    );

    return {
      blob: result.blob,
      fileName: result.fileName || fallbackFileName || "ficha_indicador",
      contentType: result.contentType || result.blob.type || "",
    };
  },

  async descargarIndicadorFichaArchivo(
    idPdrcOerAer: number,
    idIndicadorNombre: number,
    fallbackFileName?: string | null
  ): Promise<void> {
    const result = await PdrcOerAerVistaAction.obtenerIndicadorFichaArchivoBlob(
      idPdrcOerAer,
      idIndicadorNombre,
      fallbackFileName
    );

    descargarBlobEnNavegador(result.blob, result.fileName);
  },
};

export default PdrcOerAerVistaAction;