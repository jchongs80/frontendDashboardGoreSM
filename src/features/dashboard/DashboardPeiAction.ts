import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";
import type { DashboardNivelAvanceValue } from "./DashboardFiltersTypes";


function descargarBlobEnNavegador(blob: Blob, fileName: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName || "Reporte-PEI.pdf";
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export type DashboardPeiKpiDto = {
  totalOei: number;
  totalIndicadoresOei: number;
  totalAei: number;
  totalIndicadoresAei: number;
  totalIndicadores: number;
  avancePromedio: number;
};

export type DashboardSemaforoDto = {
  rojo: number;
  amarillo: number;
  verde: number;
  azul: number;
};

export type DashboardPeiJerarquiaDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  tipoNivel: string;
  codigoOei: string;
  enunciadoOei: string;
  codigoAei?: string | null;
  enunciadoAei?: string | null;
  cantidadIndicadores: number;
  avancePromedio: number;
  semaforo: string;
};

export type DashboardPeiTendenciaDto = {
  periodo: string;
  metaPromedio: number;
  ejecutadoPromedio: number;
  avancePromedio: number;
  referencia75: number;
  referencia95: number;
};

export type DashboardPeiDto = {
  idPeriodo?: number | null;
  idAnioProyeccion?: number | null;
  idUnidad?: number | null;
  nivelAvance?: DashboardNivelAvanceValue | null;
  idObjetivo?: number | null;
  idAccion?: number | null;
  kpis: DashboardPeiKpiDto;
  semaforo: DashboardSemaforoDto;
  jerarquia: DashboardPeiJerarquiaDto[];
  tendencia: DashboardPeiTendenciaDto[];
};

export type DashboardPeiFiltros = {
  idPeriodo?: number;
  idAnioProyeccion?: number;
  idUnidad?: number;
  nivelAvance?: DashboardNivelAvanceValue;
  idObjetivo?: number;
  idAccion?: number;
};


export type DashboardPeiReporteLogroDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  anio: number;
  valor?: number | null;
};

export type DashboardPeiReporteValorAnualDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  anio: number;
  valorObtenidoSemestre?: number | null;
  valorObtenidoAnual?: number | null;
  avanceSemestre?: number | null;
  avanceAnual?: number | null;
};

export type DashboardPeiReporteFilaDto = {
  idPeiOeiAei: number;
  idIndicadorNombre: number;
  tipoNivel: string;
  codigoNivel: string;
  denominacionNivel: string;
  codigoOei: string;
  denominacionOei: string;
  codigoAei?: string | null;
  denominacionAei?: string | null;
  codigoIndicador: string;
  nombreIndicador: string;
  unidadEjecutora: string;
  unidadOrganizacion: string;
  relevancia: string;
  sentidoEsperado: string;
  tipoAgregacion: string;
  lineaBaseAnio?: number | null;
  lineaBaseValor?: number | null;
  valorObtenidoSemestre?: number | null;
  valorObtenidoAnual?: number | null;
  avanceSemestre?: number | null;
  avanceAnual?: number | null;
  semaforo: string;
  logrosEsperados: DashboardPeiReporteLogroDto[];
  valoresPorAnio: DashboardPeiReporteValorAnualDto[];
};

export type DashboardPeiReporteResumenDto = {
  categoria: string;
  rojo: number;
  amarillo: number;
  verde: number;
  nd: number;
  total: number;
};

export type DashboardPeiReporteDto = {
  titulo: string;
  periodoPei: string;
  nivelGobierno: string;
  sector: string;
  pliego: string;
  idPeriodo?: number | null;
  idAnioProyeccion?: number | null;
  anioReporte?: number | null;
  idUnidad?: number | null;
  unidadFiltro?: string | null;
  nivelAvance?: DashboardNivelAvanceValue | string | null;
  nivelAvanceLabel?: string | null;
  fechaGeneracion: string;
  aniosLogroEsperado: number[];
  aniosEjecutado: number[];
  filas: DashboardPeiReporteFilaDto[];
  resumen: DashboardPeiReporteResumenDto[];
  alertasIdentificadas: string;
  igi: number;
};

const DashboardPeiAction = {
  async getDashboard(filtros?: DashboardPeiFiltros): Promise<DashboardPeiDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.nivelAvance != null) qp.append("nivelAvance", String(filtros.nivelAvance));
    if (filtros?.idObjetivo != null) qp.append("idObjetivo", String(filtros.idObjetivo));
    if (filtros?.idAccion != null) qp.append("idAccion", String(filtros.idAccion));

    const url = qp.toString()
      ? `/api/dashboard/pei?${qp.toString()}`
      : `/api/dashboard/pei`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPeiDto>(resp);
  },


  async getReporte(filtros?: DashboardPeiFiltros): Promise<DashboardPeiReporteDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.nivelAvance != null) qp.append("nivelAvance", String(filtros.nivelAvance));

    const url = qp.toString()
      ? `/api/dashboard/pei/reporte?${qp.toString()}`
      : `/api/dashboard/pei/reporte`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPeiReporteDto>(resp);
  },

  async descargarReportePdf(filtros?: DashboardPeiFiltros): Promise<void> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.nivelAvance != null) qp.append("nivelAvance", String(filtros.nivelAvance));

    const url = qp.toString()
      ? `/api/dashboard/pei/reporte/pdf?${qp.toString()}`
      : `/api/dashboard/pei/reporte/pdf`;

    const result = await api.downloadBlob(url, "Reporte-PEI.pdf");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-PEI.pdf");
  },


  async descargarReporteExcel(filtros?: DashboardPeiFiltros): Promise<void> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.nivelAvance != null) qp.append("nivelAvance", String(filtros.nivelAvance));

    const url = qp.toString()
      ? `/api/dashboard/pei/reporte/excel?${qp.toString()}`
      : `/api/dashboard/pei/reporte/excel`;

    const result = await api.downloadBlob(url, "Reporte-PEI.xlsx");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-PEI.xlsx");
  },

};

export default DashboardPeiAction;
