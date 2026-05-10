import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

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
};

export type DashboardSerieTemporalDto = {
  periodo: string;
  instrumento: string;
  valor: number;
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
  tendencia: DashboardSerieTemporalDto[];
};

export type DashboardAgFiltros = {
  idPeriodo?: number;
  idDimension?: number;
  idUnidad?: number;
  idPolitica?: number;
  idAnioProyeccion?: number;
};

const DashboardAgAction = {
  async getDashboard(filtros?: DashboardAgFiltros): Promise<DashboardAgDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.idPolitica != null) qp.append("idPolitica", String(filtros.idPolitica));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));

    const url = qp.toString()
      ? `/api/dashboard/ag?${qp.toString()}`
      : `/api/dashboard/ag`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardAgDto>(resp);
  },
};

export default DashboardAgAction;