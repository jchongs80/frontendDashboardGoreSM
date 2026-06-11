import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

function descargarBlobEnNavegador(blob: Blob, fileName: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName || "Reporte-PRCP.pdf";
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export type DashboardSemaforoDto = {
  rojo: number;
  amarillo: number;
  verde: number;
  azul: number;
};

export type DashboardPrcpKpiDto = {
  totalOp: number;
  totalMp: number;
  totalHitos: number;
  totalIndicadores: number;
  avancePromedio: number;
};

export type DashboardPrcpIndicadorResumenDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  meta: number;
  ejecutado: number;
  avance: number;
  semaforo: string;
};

export type DashboardPrcpJerarquiaDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  codigoOp: string;
  descripcionOp: string;
  codigoPi: string;
  descripcionPi: string;
  codigoMp: string;
  descripcionMp: string;
  responsableMp?: string | null;
  cantidadIndicadores: number;
  avancePromedio: number;
  semaforo: string;
  indicadores?: DashboardPrcpIndicadorResumenDto[];
};

export type DashboardPrcpTendenciaDto = {
  periodo: string;
  metaPromedio: number;
  ejecutadoPromedio: number;
  avancePromedio: number;
  referencia75: number;
  referencia95: number;
};

export type DashboardPrcpDto = {
  idPeriodo?: number | null;
  idUnidad?: number | null;
  idObjetivoPrioritario?: number | null;
  idAnioProyeccion?: number | null;
  kpis: DashboardPrcpKpiDto;
  semaforo: DashboardSemaforoDto;
  jerarquia: DashboardPrcpJerarquiaDto[];
  tendencia: DashboardPrcpTendenciaDto[];
};

export type DashboardPrcpFiltros = {
  idPeriodo?: number;
  idUnidad?: number;
  idObjetivoPrioritario?: number;
  idAnioProyeccion?: number;
};

export type DashboardPrcpReporteLogroDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  anio: number;
  valor?: number | null;
};

export type DashboardPrcpReporteValorAnualDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  anio: number;
  valorEsperado?: number | null;
  valorObtenidoAnual?: number | null;
  avanceAnual?: number | null;
};

export type DashboardPrcpReporteFilaDto = {
  idPrcpOpPiMp: number;
  idIndicadorNombre: number;
  codigoOp: string;
  descripcionOp: string;
  codigoPi: string;
  descripcionPi: string;
  codigoMp: string;
  descripcionMp: string;
  unidadConductoraOp: string;
  responsableMp: string;
  hitoJulio2025: string;
  hitoJulio2028: string;
  hitoJulio2030: string;
  codigoIndicador: string;
  nombreIndicador: string;
  unidadMedida: string;
  sentido: string;
  valorEsperadoReporte: number;
  valorObtenidoReporte: number;
  cumplimientoReporte: number;
  hitoCumplido: boolean;
  estadoReporte: string;
  logrosEsperados: DashboardPrcpReporteLogroDto[];
  valoresPorAnio: DashboardPrcpReporteValorAnualDto[];
};

export type DashboardPrcpReporteResumenDto = {
  categoria: string;
  rojo: number;
  amarillo: number;
  verde: number;
  nd: number;
  total: number;
};


export type DashboardPrcpReporteGraficoDto = {
  etiqueta: string;
  valor: number;
  cantidad: number;
};

export type DashboardPrcpReporteDto = {
  titulo: string;
  periodoPrcp: string;
  idPeriodo?: number | null;
  idAnioProyeccion?: number | null;
  anioReporte?: number | null;
  idObjetivoPrioritario?: number | null;
  objetivoPrioritarioFiltro?: string | null;
  unidadConductoraFiltro?: string | null;
  fechaGeneracion: string;
  aniosLogroEsperado: number[];
  aniosEjecutado: number[];
  filas: DashboardPrcpReporteFilaDto[];
  resumen: DashboardPrcpReporteResumenDto[];
  graficoAvanceAcumulado: DashboardPrcpReporteGraficoDto[];
  graficoHitosCumplidos: DashboardPrcpReporteGraficoDto[];
  graficoDistribucionEstado: DashboardPrcpReporteGraficoDto[];
  avanceAcumulado: number;
  totalIndicadoresReporte: number;
  indicadoresCumplidos: number;
  indicadoresPendientes: number;
  porcentajeCumplidos: number;
  porcentajePendientes: number;
  alertasIdentificadas: string;
};

const buildQueryString = (filtros?: DashboardPrcpFiltros): string => {
  const qp = new URLSearchParams();

  if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
  if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
  if (filtros?.idObjetivoPrioritario != null) qp.append("idObjetivoPrioritario", String(filtros.idObjetivoPrioritario));
  if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));

  return qp.toString();
};

const DashboardPrcpAction = {
  async getDashboard(filtros?: DashboardPrcpFiltros): Promise<DashboardPrcpDto | null> {
    const query = buildQueryString(filtros);
    const url = query ? `/api/dashboard/prcp?${query}` : `/api/dashboard/prcp`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPrcpDto>(resp);
  },

  async getReporte(filtros?: DashboardPrcpFiltros): Promise<DashboardPrcpReporteDto | null> {
    const query = buildQueryString(filtros);
    const url = query ? `/api/dashboard/prcp/reporte?${query}` : `/api/dashboard/prcp/reporte`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPrcpReporteDto>(resp);
  },

  async descargarReportePdf(filtros?: DashboardPrcpFiltros): Promise<void> {
    const query = buildQueryString(filtros);
    const url = query ? `/api/dashboard/prcp/reporte/pdf?${query}` : `/api/dashboard/prcp/reporte/pdf`;

    const result = await api.downloadBlob(url, "Reporte-PRCP.pdf");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-PRCP.pdf");
  },

  async descargarReporteExcel(filtros?: DashboardPrcpFiltros): Promise<void> {
    const query = buildQueryString(filtros);
    const url = query ? `/api/dashboard/prcp/reporte/excel?${query}` : `/api/dashboard/prcp/reporte/excel`;

    const result = await api.downloadBlob(url, "Reporte-PRCP.xlsx");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-PRCP.xlsx");
  },
};

export default DashboardPrcpAction;
