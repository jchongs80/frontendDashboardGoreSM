import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

function descargarBlobEnNavegador(blob: Blob, fileName: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
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

export type DashboardAgKpiDto = {
  totalPoliticas: number;
  totalResultados: number;
  totalIntervenciones: number;
  totalIndicadores: number;
  avancePromedio: number;
};


export type DashboardAgIndicadorResumenDto = {
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  codigoIndicador: string;
  nombreIndicador: string;
  meta: number;
  ejecutado: number;
  avance: number;
  semaforo: string;
};

export type DashboardAgJerarquiaDto = {
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  codigoPolitica: string;
  descripcionPolitica: string;
  codigoResultado: string;
  descripcionResultado: string;
  codigoIntervencion: string;
  descripcionIntervencion: string;
  cantidadIndicadores: number;
  avancePromedio: number;
  semaforo: string;
  indicadores?: DashboardAgIndicadorResumenDto[];
};

export type DashboardAgTendenciaDto = {
  periodo: string;
  metaPromedio: number;
  ejecutadoPromedio: number;
  avancePromedio: number;
  referencia75: number;
  referencia95: number;
};

export type DashboardAgDto = {
  idPeriodo?: number | null;
  idDimension?: number | null;
  idUnidad?: number | null;
  idPolitica?: number | null;
  idAnioProyeccion?: number | null;
  kpis: DashboardAgKpiDto;
  semaforo: DashboardSemaforoDto;
  jerarquia: DashboardAgJerarquiaDto[];
  tendencia: DashboardAgTendenciaDto[];
};


export type DashboardAgReporteResumenDimensionDto = {
  idDimension: number;
  codigoDimension: string;
  dimension: string;
  indicadoresPriorizados: number;
  porcentajeCumplimiento: number;
  nivelAvance: string;
};

export type DashboardAgReportePoliticaResumenDto = {
  idPolitica: number;
  codigoPolitica: string;
  politica: string;
  indicadoresPriorizados: number;
  porcentajeCumplimiento: number;
  nivelAvance: string;
};

export type DashboardAgReporteIndicadorDto = {
  idAgPoRecoInpr: number;
  idIndicadorNombre: number;
  idDimension: number;
  codigoDimension: string;
  dimension: string;
  idPolitica: number;
  codigoPolitica: string;
  politica: string;
  codigoResultado: string;
  resultadoConcertado: string;
  codigoIntervencion: string;
  intervencionPrioritaria: string;
  codigoIndicador: string;
  nombreIndicador: string;
  metodoCalculo: string;
  tendencia: string;
  tipoIndicador: string;
  unidadMedida: string;
  idAnioProyeccion?: number | null;
  anioProyeccion?: number | null;
  metaProyectada: number;
  valorIndicador: number;
  logroEsperadoPorcentaje: number;
  nivelAvance: string;
  factoresFavorecieronAvance: string;
  factoresRetrocesoEstancamiento: string;
  conclusiones: string;
  recomendaciones: string;
  desafios: string;
  fuenteDatos: string;
  fuenteVerificacion: string;
  responsable: string;
};

export type DashboardAgReporteDimensionDto = {
  idDimension: number;
  codigoDimension: string;
  dimension: string;
  indicadoresPriorizados: number;
  porcentajeCumplimiento: number;
  nivelAvance: string;
  resumenPoliticas: DashboardAgReportePoliticaResumenDto[];
  indicadores: DashboardAgReporteIndicadorDto[];
};

export type DashboardAgReporteDto = {
  titulo: string;
  idPeriodo?: number | null;
  periodoAg: string;
  idAnioProyeccion?: number | null;
  anioReporte?: number | null;
  idDimension?: number | null;
  dimensionFiltro: string;
  idUnidad?: number | null;
  unidadFiltro: string;
  idPolitica?: number | null;
  politicaFiltro: string;
  nivelAvance?: string | null;
  nivelAvanceLabel: string;
  fechaGeneracion: string;
  resumenFinal: DashboardAgReporteResumenDimensionDto[];
  totalFinal: DashboardAgReporteResumenDimensionDto;
  dimensiones: DashboardAgReporteDimensionDto[];
};

export type DashboardAgFiltros = {
  idPeriodo?: number;
  idDimension?: number;
  idUnidad?: number;
  idPolitica?: number;
  idAnioProyeccion?: number;
  nivelAvance?: string;
};

const DashboardAgAction = {
  async getDashboard(filtros?: DashboardAgFiltros): Promise<DashboardAgDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.idPolitica != null) qp.append("idPolitica", String(filtros.idPolitica));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.nivelAvance != null) qp.append("nivelAvance", String(filtros.nivelAvance));

    const url = qp.toString()
      ? `/api/dashboard/ag?${qp.toString()}`
      : `/api/dashboard/ag`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardAgDto>(resp);
  },


  async getReporte(filtros?: DashboardAgFiltros): Promise<DashboardAgReporteDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.idPolitica != null) qp.append("idPolitica", String(filtros.idPolitica));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.nivelAvance != null) qp.append("nivelAvance", String(filtros.nivelAvance));

    const url = qp.toString()
      ? `/api/dashboard/ag/reporte?${qp.toString()}`
      : `/api/dashboard/ag/reporte`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardAgReporteDto>(resp);
  },

  async descargarReportePdf(filtros?: DashboardAgFiltros): Promise<void> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.idPolitica != null) qp.append("idPolitica", String(filtros.idPolitica));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.nivelAvance != null) qp.append("nivelAvance", String(filtros.nivelAvance));

    const url = qp.toString()
      ? `/api/dashboard/ag/reporte/pdf?${qp.toString()}`
      : `/api/dashboard/ag/reporte/pdf`;

    const result = await api.downloadBlob(url, "Reporte-AG.pdf");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-AG.pdf");
  },

  async descargarReporteExcel(filtros?: DashboardAgFiltros): Promise<void> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.idPolitica != null) qp.append("idPolitica", String(filtros.idPolitica));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.nivelAvance != null) qp.append("nivelAvance", String(filtros.nivelAvance));

    const url = qp.toString()
      ? `/api/dashboard/ag/reporte/excel?${qp.toString()}`
      : `/api/dashboard/ag/reporte/excel`;

    const result = await api.downloadBlob(url, "Reporte-AG.xlsx");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-AG.xlsx");
  },

};

export default DashboardAgAction;