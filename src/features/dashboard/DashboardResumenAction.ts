import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

export type DashboardSemaforoDto = {
  rojo: number;
  amarillo: number;
  verde: number;
  azul: number;
};

export type DashboardKpiDto = {
  codigo: string;
  titulo: string;
  valor: string;
  variacion?: string | null;
  variacionPositiva?: boolean | null;
};

export type DashboardRankingDto = {
  instrumento: string;
  indicadores: number;
  avancePromedio: number;
  rojo: number;
  amarillo: number;
  verde: number;
  azul: number;
};

export type DashboardAlertaDto = {
  instrumento: string;
  titulo: string;
  descripcion: string;
  nivel: string;
};

export type DashboardResumenDto = {
  totalInstrumentos: number;
  totalIndicadores: number;
  totalUnidadesResponsables: number;
  avancePromedio: number;
  totalAlertasCriticas: number;
  semaforo: DashboardSemaforoDto;
  kpis: DashboardKpiDto[];
  rankingInstrumentos: DashboardRankingDto[];
  alertasCriticas: DashboardAlertaDto[];
};

export type DashboardResumenFiltros = {
  anio?: number;
  idPeriodo?: number;
  idDimension?: number;
  idUnidad?: number;
};

export const DashboardResumenAction = {
  async getResumen(filtros?: DashboardResumenFiltros): Promise<DashboardResumenDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.anio != null) qp.append("anio", String(filtros.anio));
    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));

    const url = qp.toString()
      ? `/api/dashboard/resumen?${qp.toString()}`
      : `/api/dashboard/resumen`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardResumenDto>(resp);
  },
};

export default DashboardResumenAction;