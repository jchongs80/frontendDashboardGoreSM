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
  idPeiOeiAei: number,
  idIndicadorNombre: number
): string {
  const qp = new URLSearchParams({
    idPeiOeiAei: String(idPeiOeiAei),
    idIndicadorNombre: String(idIndicadorNombre),
  });

  return `/api/PeiOeiAeiVista/indicador-ficha/descargar?${qp.toString()}`;
}

export type PeiPeriodoDto = {
  idPeriodo: number;
  codigo: string | null;
  descripcion: string | null;
};

export type PeiDimensionDto = {
  idDimension: number;
  codigo: string | null;
  nombre: string | null;
  orden?: number | null;
};

export type PeiUnidadOrgDto = {
  idUnidad: number;
  codigo: string | null;
  nombre: string | null;
};

export type PeiOeiAeiMasterDto = {
  idPeiOeiAei: number;
  idPeiEntidadEstrategica: number;
  tipoNivel: "OEI" | "AEI";
  idObjetivo: number;
  idAccion?: number | null;
  codigoOei: string;
  enunciadoOei: string;
  codigoAei?: string | null;
  enunciadoAei?: string | null;
  cantidadIndicadores: number;
};

export type PeiOeiAeiDetailDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
};

export type PeiIndicadorDetalleAnioDto = {
  idAnioProyeccion: number;
  anio: number;
};

export type PeiIndicadorDetalleTipoValorDto = {
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idMetCalcIndicador: number;
  nombreMetodoCalculo: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idPeriodicidadIndicador: number;
  nombrePeriodicidad: string;
};

export type PeiIndicadorDetalleMetValorDto = {
  idPdrcIndMet: number;
  codigoMet: string;
  nombreMet: string;
  valor: number;
};

export type PeiIndicadorDetalleLineaBaseDto = {
  idAnioProyeccion: number;
  anio: number;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idMetCalcIndicador: number;
  nombreMetodoCalculo: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idPeriodicidadIndicador: number;
  nombrePeriodicidad: string;
  valorLineaBase: number;
};

export type PeiIndicadorValorMetaPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valorAbsolutoA: number;
  valorAbsolutoB: number;
  valorRelativo: number;
};

export type PeiIndicadorEjecutadoPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valor: number;
};

export type PeiIndicadorEjecutadoUpdateItemDto = {
  idAnioProyeccion: number;
  valor: number;
};

export type PeiIndicadorEjecutadoUpdateRequestDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  valores: PeiIndicadorEjecutadoUpdateItemDto[];
};

export type PeiIndicadorInfoDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  factoresAvance: string | null;
  medidasRecomendadas: string | null;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
};

export type PeiIndicadorInfoUpdateRequestDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  factoresAvance: string | null;
  medidasRecomendadas: string | null;
};

export type PeiIndicadorFichaArchivoDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  nombreArchivo: string | null;
  nombreOriginal: string | null;
  extension: string | null;
  contentType: string | null;
  tamanioBytes: number;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
};

export type PeiIndicadorFichaArchivoBlobDto = {
  blob: Blob;
  fileName: string;
  contentType: string;
};

export type PeiCatalogoIndicadorEditableDto = {
  id: number;
  codigo: string;
  nombre: string;
  orden?: number | null;
};

export type PeiIndicadorInfoEditableDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  idRelevancia: number | null;
  codigoRelevancia?: string | null;
  nombreRelevancia?: string | null;
  idSentidoEsperado: number | null;
  codigoSentidoEsperado?: string | null;
  nombreSentidoEsperado?: string | null;
  idTipoAgregacion: number | null;
  codigoTipoAgregacion?: string | null;
  nombreTipoAgregacion?: string | null;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
};

export type PeiIndicadorInfoEditableUpdateRequestDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  idRelevancia: number | null;
  idSentidoEsperado: number | null;
  idTipoAgregacion: number | null;
};

export type PeiIndicadorEjecutadoSemestreIPorAnioDto = {
  idAnioProyeccion: number;
  anio: number;
  valor: number;
};

export type PeiIndicadorEjecutadoSemestreIUpdateItemDto = {
  idAnioProyeccion: number;
  valor: number;
};

export type PeiIndicadorEjecutadoSemestreIUpdateRequestDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  valores: PeiIndicadorEjecutadoSemestreIUpdateItemDto[];
};

export type PeiIndicadorDetalleResponseDto = {
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  idPeiEntidadEstrategica: number;
  tipoNivel: "OEI" | "AEI";
  codigoOei: string;
  enunciadoOei: string;
  codigoAei?: string | null;
  enunciadoAei?: string | null;
  idPdrcIndTv: number;
  codigoTipoValor: string;
  nombreTipoValor: string;
  idMetCalcIndicador: number;
  nombreMetodoCalculo: string;
  idFuenteIndicador: number;
  nombreFuenteDatos: string;
  idPeriodicidadIndicador: number;
  nombrePeriodicidad: string;
  lineaBase?: PeiIndicadorDetalleLineaBaseDto | null;
  tiposValor: PeiIndicadorDetalleTipoValorDto[];
  anios: PeiIndicadorDetalleAnioDto[];
  valoresMet: PeiIndicadorDetalleMetValorDto[];
  valoresMetaPorAnio: PeiIndicadorValorMetaPorAnioDto[];
  infoEditable?: PeiIndicadorInfoEditableDto | null;
  catalogoRelevancia: PeiCatalogoIndicadorEditableDto[];
  catalogoSentidoEsperado: PeiCatalogoIndicadorEditableDto[];
  catalogoTipoAgregacion: PeiCatalogoIndicadorEditableDto[];
  valoresEjecutadoSemestreIPorAnio: PeiIndicadorEjecutadoSemestreIPorAnioDto[];
  valoresEjecutadoPorAnio: PeiIndicadorEjecutadoPorAnioDto[];
};

export const PeiOeiAeiVistaAction = {
  async getPeriodos() {
    const resp = await api.get<unknown>(`/api/PeiOeiAeiVista/periodos`);
    return unwrapList<PeiPeriodoDto>(resp);
  },

  async getDimensiones() {
    const resp = await api.get<unknown>(`/api/PeiOeiAeiVista/dimensiones`);
    return unwrapList<PeiDimensionDto>(resp);
  },

  async getUnidadesOrganizacionales() {
    const resp = await api.get<unknown>(`/api/PeiOeiAeiVista/unidades-organizacionales`);
    return unwrapList<PeiUnidadOrgDto>(resp);
  },

  async getMaster(idPeriodo: number, idDimension: number, idUnidad: number) {
    const resp = await api.get<unknown>(
      `/api/PeiOeiAeiVista/master?idPeriodo=${idPeriodo}&idDimension=${idDimension}&idUnidad=${idUnidad}`
    );

    return unwrapList<PeiOeiAeiMasterDto>(resp);
  },

  async getDetail(idPeiOeiAei: number) {
    const resp = await api.get<unknown>(`/api/PeiOeiAeiVista/${idPeiOeiAei}/detail`);
    return unwrapList<PeiOeiAeiDetailDto>(resp);
  },

  async getIndicadorDetalle(
    idPeiOeiAei: number,
    idIndicadorNombre: number,
    idAnioProyeccion?: number | null,
    idPdrcIndTv?: number | null
  ): Promise<PeiIndicadorDetalleResponseDto | null> {
    const qp = new URLSearchParams({
      idPeiOeiAei: String(idPeiOeiAei),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    if (idAnioProyeccion != null) {
      qp.append("idAnioProyeccion", String(idAnioProyeccion));
    }

    if (idPdrcIndTv != null) {
      qp.append("idPdrcIndTv", String(idPdrcIndTv));
    }

    const resp = await api.get<unknown>(
      `/api/PeiOeiAeiVista/indicador-detalle?${qp.toString()}`
    );

    return unwrapData<PeiIndicadorDetalleResponseDto>(resp);
  },

  async guardarIndicadorEjecutado(payload: PeiIndicadorEjecutadoUpdateRequestDto) {
    return await api.post(`/api/PeiOeiAeiVista/indicador-ejecutado`, payload);
  },

  async guardarIndicadorEjecutadoSemestreI(
    payload: PeiIndicadorEjecutadoSemestreIUpdateRequestDto
  ) {
    return await api.post(`/api/PeiOeiAeiVista/indicador-ejecutado-semestre-i`, payload);
  },

  async guardarIndicadorInfoEditable(payload: PeiIndicadorInfoEditableUpdateRequestDto) {
    return await api.post(`/api/PeiOeiAeiVista/indicador-info-editable`, payload);
  },

  async getIndicadorInfo(
    idPeiOeiAei: number,
    idIndicadorNombre: number
  ): Promise<PeiIndicadorInfoDto | null> {
    const qp = new URLSearchParams({
      idPeiOeiAei: String(idPeiOeiAei),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    const resp = await api.get<unknown>(
      `/api/PeiOeiAeiVista/indicador-info?${qp.toString()}`
    );

    return unwrapData<PeiIndicadorInfoDto>(resp);
  },

  async guardarIndicadorInfo(payload: PeiIndicadorInfoUpdateRequestDto) {
    return await api.post(`/api/PeiOeiAeiVista/indicador-info`, payload);
  },

  async getIndicadorFichaArchivo(
    idPeiOeiAei: number,
    idIndicadorNombre: number
  ): Promise<PeiIndicadorFichaArchivoDto | null> {
    const qp = new URLSearchParams({
      idPeiOeiAei: String(idPeiOeiAei),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    const resp = await api.get<unknown>(
      `/api/PeiOeiAeiVista/indicador-ficha?${qp.toString()}`
    );

    return unwrapData<PeiIndicadorFichaArchivoDto>(resp);
  },

  async guardarIndicadorFichaArchivo(
    idPeiOeiAei: number,
    idIndicadorNombre: number,
    archivo: File
  ) {
    const formData = new FormData();

    formData.append("idPeiOeiAei", String(idPeiOeiAei));
    formData.append("idIndicadorNombre", String(idIndicadorNombre));
    formData.append("archivo", archivo);

    return await api.post(`/api/PeiOeiAeiVista/indicador-ficha`, formData);
  },

  getIndicadorFichaArchivoDownloadUrl(
    idPeiOeiAei: number,
    idIndicadorNombre: number
  ): string {
    return buildIndicadorFichaArchivoDownloadPath(idPeiOeiAei, idIndicadorNombre);
  },

  async obtenerIndicadorFichaArchivoBlob(
    idPeiOeiAei: number,
    idIndicadorNombre: number,
    fallbackFileName?: string | null
  ): Promise<PeiIndicadorFichaArchivoBlobDto> {
    const result = await api.downloadBlob(
      buildIndicadorFichaArchivoDownloadPath(idPeiOeiAei, idIndicadorNombre),
      fallbackFileName || "ficha_indicador"
    );

    return {
      blob: result.blob,
      fileName: result.fileName || fallbackFileName || "ficha_indicador",
      contentType: result.contentType || result.blob.type || "",
    };
  },

  async descargarIndicadorFichaArchivo(
    idPeiOeiAei: number,
    idIndicadorNombre: number,
    fallbackFileName?: string | null
  ): Promise<void> {
    const result = await PeiOeiAeiVistaAction.obtenerIndicadorFichaArchivoBlob(
      idPeiOeiAei,
      idIndicadorNombre,
      fallbackFileName
    );

    descargarBlobEnNavegador(result.blob, result.fileName);
  },
};

export default PeiOeiAeiVistaAction;