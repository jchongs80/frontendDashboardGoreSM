import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

function descargarBlobEnNavegador(blob: Blob, fileName: string): void {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName || "Reporte-POI.xlsx";
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

export type DashboardPoiKpiDto = {
  ejecucionFisica: number;
  ejecucionFisicaMensual: number;
  ejecucionFisicaPeriodo: number;
  avanceFisicoAnual: number;
  ejecucionPresupuestal: number;
  totalInconsistencias: number;
  totalPendientesSeguimiento: number;
};

export type DashboardPoiComparativoDto = {
  periodo: string;
  poi: number;
  siaf: number;
};

export type DashboardPoiEjecutoraDto = {
  unidadEjecutora: string;
  ejecucionFisica: number;
  ejecucionPresupuestal: number;
  semaforo: string;
};

export type DashboardPoiInconsistenciaDto = {
  actividadOperativa: string;
  centroCosto: string;
  descripcion: string;
  nivel: string;
};

export type DashboardPoiSeguimientoDto = {
  unidadEjecutora: string;
  centroCosto: string;
  pendientes: number;
};

export type DashboardPoiCumplimientoDto = {
  grupo: string;
  codigo?: string | null;
  descripcion?: string | null;
  idProvincia?: number | null;
  idDistrito?: number | null;
  provincia?: string | null;
  distrito?: string | null;
  fisicaBaseMes: number;
  fisicaComparacionMes: number;
  cumplimientoMes: number;
  fisicaBasePeriodo: number;
  fisicaComparacionPeriodo: number;
  cumplimientoPeriodo: number;
  fisicaBaseAnual: number;
  fisicaComparacionAnual: number;
  cumplimientoAnual: number;
  fisicaBaseFinal: number;
  fisicaComparacionFinal: number;
  cumplimientoFinal: number;
  cantidadAoTotalMes?: number;
  cantidadAoMayorCeroMes?: number;
  cantidadAoTotalPeriodo?: number;
  cantidadAoMayorCeroPeriodo?: number;
  cantidadAoTotalAnual?: number;
  cantidadAoMayorCeroAnual?: number;
};

export type DashboardPoiAoEjecucionDto = {
  idOeiAeiAo: number;
  idCentroCosto?: number | null;
  centroCosto: string;
  codigoAo: string;
  actividadOperativa: string;
  fisicaBaseMes: number;
  fisicaComparacionMes: number;
  cumplimientoMes: number;
  fisicaBasePeriodo: number;
  fisicaComparacionPeriodo: number;
  cumplimientoPeriodo: number;
  fisicaBaseAnual: number;
  fisicaComparacionAnual: number;
  cumplimientoAnual: number;
};

export type DashboardPoiDto = {
  anio?: number | null;
  idPeriodo?: number | null;
  idPoiAnio?: number | null;
  mes?: number | null;
  trimestre?: number | null;
  idUnidadEjecutora?: number | null;
  idCentroCosto?: number | null;
  nivelCumplimiento?: string | null;
  kpis: DashboardPoiKpiDto;
  semaforo: DashboardSemaforoDto;
  comparativoPoiSiaf: DashboardPoiComparativoDto[];
  ejecucionPorEjecutora: DashboardPoiEjecutoraDto[];
  inconsistencias: DashboardPoiInconsistenciaDto[];
  seguimientoPendiente: DashboardPoiSeguimientoDto[];
  ejecucionFisicaPorUnidad: DashboardPoiCumplimientoDto[];
  ejecucionFisicaPorOeiAei: DashboardPoiCumplimientoDto[];
  programacionFisicaPorUnidad: DashboardPoiCumplimientoDto[];
  programacionFisicaPorOeiAei: DashboardPoiCumplimientoDto[];
  ejecucionFisicaPorProvinciaDistrito: DashboardPoiCumplimientoDto[];
  programacionFisicaPorProvinciaDistrito: DashboardPoiCumplimientoDto[];
  ejecucionFisicaPorAo: DashboardPoiAoEjecucionDto[];
};

export type DashboardPoiSeccion =
  | "resumen"
  | "fisica"
  | "fisica-seguimiento-unidad"
  | "fisica-seguimiento-oei-aei"
  | "fisica-reprogramacion-unidad"
  | "fisica-reprogramacion-oei-aei"
  | "territorial"
  | "territorial-ejecucion"
  | "territorial-programacion"
  | "resumen-fisico"
  | "ao"
  | "todo";

export type DashboardPoiFiltros = {
  idPeriodo?: number;
  idPoiAnio?: number;
  anio?: number;
  mes?: number;
  trimestre?: number;
  idUnidadEjecutora?: number;
  idCentroCosto?: number;
  nivelCumplimiento?: string;
  seccion?: DashboardPoiSeccion;
};


export type DashboardPoiReporteFilaDto = {
  periodo?: string | null;
  poi?: string | null;
  etapa?: string | null;
  anio?: number | null;
  unidadEjecutoraId?: string | null;
  unidadEjecutora?: string | null;
  ccResponsableId?: string | null;
  ccResponsable?: string | null;
  centroCostoId?: string | null;
  centroCosto?: string | null;
  oe?: string | null;
  objetivoEstrategico?: string | null;
  ae?: string | null;
  accionEstrategica?: string | null;
  oei?: string | null;
  objetivoEstrategicoInstitucional?: string | null;
  aei?: string | null;
  accionEstrategicaInstitucional?: string | null;
  categoriaId?: string | null;
  categoria?: string | null;
  productoId?: string | null;
  producto?: string | null;
  funcionId?: string | null;
  funcion?: string | null;
  divisionFuncionalId?: string | null;
  divisionFuncional?: string | null;
  grupoFuncionalId?: string | null;
  grupoFuncional?: string | null;
  actividadPresupuestalId?: string | null;
  actividadPresupuestal?: string | null;
  nroRegistroPoi?: string | null;
  actividadOperativaId?: string | null;
  actividadOperativa?: string | null;
  actividadOperativaSectorialId?: string | null;
  actividadOperativaSectorial?: string | null;
  unidadMedidaId?: string | null;
  unidadMedida?: string | null;
  acumulado?: string | null;
  tipo?: string | null;
  consPia?: string | null;
  consPim?: string | null;
  tipoFinPia?: string | null;
  tipoFinPim?: string | null;
  prioridad?: string | null;
  departamentoUbigeo?: string | null;
  departamentoNombreUbigeo?: string | null;
  provinciaUbigeo?: string | null;
  provinciaNombreUbigeo?: string | null;
  distritoUbigeo?: string | null;
  distritoNombreUbigeo?: string | null;
  valoresFisicos?: Record<string, number | null | undefined>;
};

export type DashboardPoiReporteDto = {
  titulo: string;
  idPeriodo?: number | null;
  idPoiAnio?: number | null;
  mes?: number | null;
  idUnidadEjecutora?: number | null;
  periodo?: string | null;
  anioPoi?: string | null;
  mesNombre?: string | null;
  unidadEjecutora?: string | null;
  fechaGeneracion: string;
  filas: DashboardPoiReporteFilaDto[];
};

const DashboardPoiAction = {
  async getDashboard(filtros?: DashboardPoiFiltros): Promise<DashboardPoiDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idPoiAnio != null) qp.append("idPoiAnio", String(filtros.idPoiAnio));
    if (filtros?.anio != null) qp.append("anio", String(filtros.anio));
    if (filtros?.mes != null) qp.append("mes", String(filtros.mes));
    if (filtros?.trimestre != null) qp.append("trimestre", String(filtros.trimestre));
    if (filtros?.idUnidadEjecutora != null) qp.append("idUnidadEjecutora", String(filtros.idUnidadEjecutora));
    if (filtros?.idCentroCosto != null) qp.append("idCentroCosto", String(filtros.idCentroCosto));
    if (filtros?.nivelCumplimiento) qp.append("nivelCumplimiento", filtros.nivelCumplimiento);
    if (filtros?.seccion) qp.append("seccion", filtros.seccion);

    const url = qp.toString()
      ? `/api/dashboard/poi?${qp.toString()}`
      : `/api/dashboard/poi`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPoiDto>(resp);
  },

  async getReporte(filtros?: DashboardPoiFiltros): Promise<DashboardPoiReporteDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idPoiAnio != null) qp.append("idPoiAnio", String(filtros.idPoiAnio));
    if (filtros?.mes != null) qp.append("mes", String(filtros.mes));
    if (filtros?.idUnidadEjecutora != null) qp.append("idUnidadEjecutora", String(filtros.idUnidadEjecutora));

    const url = qp.toString()
      ? `/api/dashboard/poi/reporte?${qp.toString()}`
      : `/api/dashboard/poi/reporte`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPoiReporteDto>(resp);
  },

  async descargarReporteExcel(filtros?: DashboardPoiFiltros): Promise<void> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idPoiAnio != null) qp.append("idPoiAnio", String(filtros.idPoiAnio));
    if (filtros?.mes != null) qp.append("mes", String(filtros.mes));
    if (filtros?.idUnidadEjecutora != null) qp.append("idUnidadEjecutora", String(filtros.idUnidadEjecutora));

    const url = qp.toString()
      ? `/api/dashboard/poi/reporte/excel?${qp.toString()}`
      : `/api/dashboard/poi/reporte/excel`;

    const result = await api.downloadBlob(url, "Reporte-POI.xlsx");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-POI.xlsx");
  },


  async descargarReporteExcelAlertas(filtros?: DashboardPoiFiltros): Promise<void> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idPoiAnio != null) qp.append("idPoiAnio", String(filtros.idPoiAnio));
    if (filtros?.mes != null) qp.append("mes", String(filtros.mes));
    if (filtros?.idUnidadEjecutora != null) qp.append("idUnidadEjecutora", String(filtros.idUnidadEjecutora));

    const url = qp.toString()
      ? `/api/dashboard/poi/reporte/excel-alertas?${qp.toString()}`
      : `/api/dashboard/poi/reporte/excel-alertas`;

    const result = await api.downloadBlob(url, "Reporte-POI-Alertas.xlsx");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-POI-Alertas.xlsx");
  },

  async descargarReportePdf(filtros?: DashboardPoiFiltros): Promise<void> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idPoiAnio != null) qp.append("idPoiAnio", String(filtros.idPoiAnio));
    if (filtros?.mes != null) qp.append("mes", String(filtros.mes));
    if (filtros?.idUnidadEjecutora != null) qp.append("idUnidadEjecutora", String(filtros.idUnidadEjecutora));

    const url = qp.toString()
      ? `/api/dashboard/poi/reporte/pdf?${qp.toString()}`
      : `/api/dashboard/poi/reporte/pdf`;

    const result = await api.downloadBlob(url, "Reporte-POI.pdf");
    descargarBlobEnNavegador(result.blob, result.fileName || "Reporte-POI.pdf");
  },
};

export default DashboardPoiAction;
