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
  idAgPoRecoInpr: number,
  idIndicadorNombre: number
): string {
  const qp = new URLSearchParams({
    idAgPoRecoInpr: String(idAgPoRecoInpr),
    idIndicadorNombre: String(idIndicadorNombre),
  });

  return `/api/AgPoRecoInprVista/indicador-ficha/descargar?${qp.toString()}`;
}

export type AgPeriodoDto = {
  idPeriodo: number;
  codigo: string | null;
  descripcion: string | null;
};

export type AgDimensionDto = {
  idDimension: number;
  codigo: string | null;
  nombre: string | null;
  orden?: number | null;
};

export type AgUnidadOrgDto = {
  idUnidad: number;
  codigo: string | null;
  nombre: string | null;
};

export type AgPoliticaDto = {
  idPolitica: number;
  codigo: string | null;
  descripcion: string | null;
};

export type AgPoRecoInprMasterDto = {
  idAgPoRecoInpr: number;
  idPolitica: number;
  idResultado: number;
  idIntervencion: number;
  codigoPolitica?: string | null;
  descripcionPolitica?: string | null;
  codigoRc: string;
  descripcionRc: string;
  codigoIp: string;
  descripcionIp: string;
  cantidadIndicadores: number;
};

export type AgPoRecoInprDetailDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
};

export type AgIndicadorDetalleAnioDto = {
  idAnioProyeccion: number;
  anio: number;
};

export type AgIndicadorDetalleTipoValorDto = {
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idTendenciaIndicador: number;
  nombreTendencia: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idUnidadMedida: number;
  nombreUnidadMedida: string;
  idTipoIndicador: number;
  nombreTipoIndicador: string;
  idMetodoCalculoIndicador: number;
  nombreMetodoCalculo: string;
};

export type AgIndicadorDetalleLineaBaseDto = {
  idAnioProyeccion: number;
  anio: number;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idTendenciaIndicador: number;
  nombreTendencia: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idUnidadMedida: number;
  nombreUnidadMedida: string;
  idTipoIndicador: number;
  nombreTipoIndicador: string;
  idMetodoCalculoIndicador: number;
  nombreMetodoCalculo: string;
  valorLineaBase: number;
};

export type AgIndicadorValorMetaPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valor: number;
};

export type AgIndicadorEjecutadoPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valor: number;
};

export type AgIndicadorEjecutadoUpdateItemDto = {
  idAnioProyeccion: number;
  valor: number;
};

export type AgIndicadorEjecutadoUpdateRequestDto = {
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  valores: AgIndicadorEjecutadoUpdateItemDto[];
};


export type AgIndicadorInfoDto = {
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  factoresFavorecieronAvance: string;
  factoresRetrocesoEstancamiento: string;
  conclusiones: string;
  recomendaciones: string;
  desafios: string;
  fuenteVerificacion: string;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
};

export type AgIndicadorInfoUpdateRequestDto = {
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  factoresFavorecieronAvance?: string | null;
  factoresRetrocesoEstancamiento?: string | null;
  conclusiones?: string | null;
  recomendaciones?: string | null;
  desafios?: string | null;
  fuenteVerificacion?: string | null;
};

export type AgIndicadorFichaArchivoDto = {
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  nombreArchivo?: string | null;
  nombreOriginal?: string | null;
  extension?: string | null;
  contentType?: string | null;
  tamanioBytes: number;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
};

export type AgIndicadorFichaArchivoBlobDto = {
  blob: Blob;
  fileName: string;
  contentType: string;
};

export type AgIndicadorDetalleResponseDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  idAgPoRecoInpr: number;
  idPolitica: number;
  idResultado: number;
  idIntervencion: number;
  codigoPolitica?: string | null;
  descripcionPolitica?: string | null;
  codigoRc: string;
  descripcionRc: string;
  codigoIp: string;
  descripcionIp: string;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idTendenciaIndicador: number;
  nombreTendencia: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idUnidadMedida: number;
  nombreUnidadMedida: string;
  idTipoIndicador: number;
  nombreTipoIndicador: string;
  idMetodoCalculoIndicador: number;
  nombreMetodoCalculo: string;
  lineaBase?: AgIndicadorDetalleLineaBaseDto | null;
  tiposValor: AgIndicadorDetalleTipoValorDto[];
  anios: AgIndicadorDetalleAnioDto[];
  valoresMetaPorAnio: AgIndicadorValorMetaPorAnioDto[];
  valoresEjecutadoPorAnio: AgIndicadorEjecutadoPorAnioDto[];
};

export const AgPoRecoInprVistaAction = {
  async getPeriodos() {
    const resp = await api.get<unknown>(`/api/AgPoRecoInprVista/periodos`);
    return unwrapList<AgPeriodoDto>(resp);
  },

  async getDimensiones() {
    const resp = await api.get<unknown>(`/api/AgPoRecoInprVista/dimensiones`);
    return unwrapList<AgDimensionDto>(resp);
  },

  async getUnidadesOrganizacionales() {
    const resp = await api.get<unknown>(`/api/AgPoRecoInprVista/unidades-organizacionales`);
    return unwrapList<AgUnidadOrgDto>(resp);
  },

  async getPoliticas(idPeriodo: number, idDimension: number, idUnidad: number) {
    const resp = await api.get<unknown>(
      `/api/AgPoRecoInprVista/politicas?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idUnidad=${idUnidad}`
    );
    return unwrapList<AgPoliticaDto>(resp);
  },

  async getMaster(idPeriodo: number, idDimension: number, idUnidad: number, idPolitica: number) {
    const resp = await api.get<unknown>(
      `/api/AgPoRecoInprVista/master?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idUnidad=${idUnidad}&idPolitica=${idPolitica}`
    );
    return unwrapList<AgPoRecoInprMasterDto>(resp);
  },

  async getDetail(idAgPoRecoInpr: number) {
    const resp = await api.get<unknown>(`/api/AgPoRecoInprVista/${idAgPoRecoInpr}/detail`);
    return unwrapList<AgPoRecoInprDetailDto>(resp);
  },

  async getIndicadorDetalle(
    idAgPoRecoInpr: number,
    idIndicadorNombre: number,
    idAnioProyeccion?: number | null,
    idPdrcIndTv?: number | null
  ): Promise<AgIndicadorDetalleResponseDto | null> {
    const qp = new URLSearchParams({
      idAgPoRecoInpr: String(idAgPoRecoInpr),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    if (idAnioProyeccion != null) qp.append("idAnioProyeccion", String(idAnioProyeccion));
    if (idPdrcIndTv != null) qp.append("idPdrcIndTv", String(idPdrcIndTv));

    const resp = await api.get<AgIndicadorDetalleResponseDto>(
      `/api/AgPoRecoInprVista/indicador-detalle?${qp.toString()}`
    );

    return resp ?? null;
  },

  async guardarIndicadorEjecutado(payload: AgIndicadorEjecutadoUpdateRequestDto) {
    return await api.post(`/api/AgPoRecoInprVista/indicador-ejecutado`, payload);
  },

  async getIndicadorInfo(
    idAgPoRecoInpr: number,
    idIndicadorNombre: number
  ): Promise<AgIndicadorInfoDto | null> {
    const qp = new URLSearchParams({
      idAgPoRecoInpr: String(idAgPoRecoInpr),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    const resp = await api.get<unknown>(
      `/api/AgPoRecoInprVista/indicador-info?${qp.toString()}`
    );

    return unwrapData<AgIndicadorInfoDto>(resp);
  },

  async guardarIndicadorInfo(payload: AgIndicadorInfoUpdateRequestDto) {
    return await api.post(`/api/AgPoRecoInprVista/indicador-info`, payload);
  },

  async getIndicadorFichaArchivo(
    idAgPoRecoInpr: number,
    idIndicadorNombre: number
  ): Promise<AgIndicadorFichaArchivoDto | null> {
    const qp = new URLSearchParams({
      idAgPoRecoInpr: String(idAgPoRecoInpr),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    const resp = await api.get<unknown>(
      `/api/AgPoRecoInprVista/indicador-ficha?${qp.toString()}`
    );

    return unwrapData<AgIndicadorFichaArchivoDto>(resp);
  },

  async guardarIndicadorFichaArchivo(
    idAgPoRecoInpr: number,
    idIndicadorNombre: number,
    archivo: File
  ) {
    const formData = new FormData();

    formData.append("idAgPoRecoInpr", String(idAgPoRecoInpr));
    formData.append("idIndicadorNombre", String(idIndicadorNombre));
    formData.append("archivo", archivo);

    return await api.post(`/api/AgPoRecoInprVista/indicador-ficha`, formData);
  },

  getIndicadorFichaArchivoDownloadUrl(
    idAgPoRecoInpr: number,
    idIndicadorNombre: number
  ): string {
    return buildIndicadorFichaArchivoDownloadPath(idAgPoRecoInpr, idIndicadorNombre);
  },

  async obtenerIndicadorFichaArchivoBlob(
    idAgPoRecoInpr: number,
    idIndicadorNombre: number,
    fallbackFileName?: string | null
  ): Promise<AgIndicadorFichaArchivoBlobDto> {
    const result = await api.downloadBlob(
      buildIndicadorFichaArchivoDownloadPath(idAgPoRecoInpr, idIndicadorNombre),
      fallbackFileName || "ficha_indicador_ag"
    );

    return {
      blob: result.blob,
      fileName: result.fileName || fallbackFileName || "ficha_indicador_ag",
      contentType: result.contentType || result.blob.type || "",
    };
  },

  async descargarIndicadorFichaArchivo(
    idAgPoRecoInpr: number,
    idIndicadorNombre: number,
    fallbackFileName?: string | null
  ): Promise<void> {
    const result = await AgPoRecoInprVistaAction.obtenerIndicadorFichaArchivoBlob(
      idAgPoRecoInpr,
      idIndicadorNombre,
      fallbackFileName
    );

    descargarBlobEnNavegador(result.blob, result.fileName);
  },
};

export default AgPoRecoInprVistaAction;
