import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

export type DashboardSemaforoDto = {
  rojo: number;
  amarillo: number;
  verde: number;
  azul: number;
};

export type DashboardPoiKpiDto = {
  ejecucionFisica: number;
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

export type DashboardPoiDto = {
  anio?: number | null;
  idPeriodo?: number | null;
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
};

export type DashboardPoiFiltros = {
  anio?: number;
  idPeriodo?: number;
  mes?: number;
  trimestre?: number;
  idUnidadEjecutora?: number;
  idCentroCosto?: number;
  nivelCumplimiento?: string;
};

const DashboardPoiAction = {
  async getDashboard(filtros?: DashboardPoiFiltros): Promise<DashboardPoiDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.anio != null) qp.append("anio", String(filtros.anio));
    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.mes != null) qp.append("mes", String(filtros.mes));
    if (filtros?.trimestre != null) qp.append("trimestre", String(filtros.trimestre));
    if (filtros?.idUnidadEjecutora != null) qp.append("idUnidadEjecutora", String(filtros.idUnidadEjecutora));
    if (filtros?.idCentroCosto != null) qp.append("idCentroCosto", String(filtros.idCentroCosto));
    if (filtros?.nivelCumplimiento) qp.append("nivelCumplimiento", filtros.nivelCumplimiento);

    const url = qp.toString()
      ? `/api/dashboard/poi?${qp.toString()}`
      : `/api/dashboard/poi`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPoiDto>(resp);
  },
};

export default DashboardPoiAction;