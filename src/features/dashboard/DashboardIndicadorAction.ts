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

function unwrapObject<T>(resp: unknown): T | null {
  if (resp == null) return null;

  if (isRecord(resp) && "data" in resp) {
    return ((resp as ApiResponseDto<T>).data ?? null) as T | null;
  }

  return resp as T;
}

export type DashboardIndicadorLineaBaseDto = {
  anio: number;
  valor: number;
  tipoValor?: string | null;
};

export type DashboardIndicadorValorDto = {
  anio: number;
  valor: number;
};

export type DashboardIndicadorFichaDto = {
  tieneFicha: boolean;
  nombreOriginal?: string | null;
  extension?: string | null;
  contentType?: string | null;
  tamanioBytes?: number | null;
};

export type DashboardIndicadorDetalleDto = {
  instrumento: string;
  idRegistro: number;
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  nivel1: string;
  nivel2?: string | null;
  nivel3?: string | null;
  fuente?: string | null;
  tipoValor?: string | null;
  tendencia?: string | null;
  unidadMedida?: string | null;
  tipoIndicador?: string | null;
  relevancia?: string | null;
  sentidoEsperado?: string | null;
  tipoAgregacion?: string | null;
  factoresAvance?: string | null;
  medidasRecomendadas?: string | null;
  ficha?: DashboardIndicadorFichaDto | null;
  lineaBase?: DashboardIndicadorLineaBaseDto | null;
  valoresMeta: DashboardIndicadorValorDto[];
  valoresEjecutado: DashboardIndicadorValorDto[];
  valoresEjecutadoSemestreI: DashboardIndicadorValorDto[];
  semaforo: string;
};

const DashboardIndicadorAction = {
  async getDetalle(
    instrumento: string,
    idRegistro: number,
    idIndicadorNombre: number
  ): Promise<DashboardIndicadorDetalleDto | null> {
    const qp = new URLSearchParams({
      instrumento,
      idRegistro: String(idRegistro),
      idIndicadorNombre: String(idIndicadorNombre),
    });

    const resp = await api.get<unknown>(`/api/dashboard/indicador-detalle?${qp.toString()}`);
    return unwrapObject<DashboardIndicadorDetalleDto>(resp);
  },
};

export default DashboardIndicadorAction;
