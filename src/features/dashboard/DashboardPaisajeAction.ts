import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

export type DashboardSemaforoDto = {
  rojo: number;
  amarillo: number;
  verde: number;
  azul: number;
};

export type DashboardPaisajeKpiDto = {
  totalPaisajes: number;
  totalIndicadores: number;
  avancePromedio: number;
};

export type DashboardPaisajeJerarquiaDto = {
  idPsjOerAer: number;
  idIndicadorNombre: number;
  codigoDimension: string;
  nombreDimension: string;
  codigoIndicador: string;
  nombreIndicador: string;
  evaluacionPrioriza?: string | null;
  avancePromedio: number;
  semaforo: string;
};

export type DashboardSerieTemporalDto = {
  periodo: string;
  instrumento: string;
  valor: number;
};

export type DashboardPaisajeDto = {
  idPeriodo?: number | null;
  idDimension?: number | null;
  idPdrcIndicadorValor?: number | null;
  idAnioProyeccion?: number | null;
  kpis: DashboardPaisajeKpiDto;
  semaforo: DashboardSemaforoDto;
  jerarquia: DashboardPaisajeJerarquiaDto[];
  tendencia: DashboardSerieTemporalDto[];
};

export type DashboardPaisajeFiltros = {
  idPeriodo?: number;
  idDimension?: number;
  idPdrcIndicadorValor?: number;
  idAnioProyeccion?: number;
};

const DashboardPaisajeAction = {
  async getDashboard(filtros?: DashboardPaisajeFiltros): Promise<DashboardPaisajeDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idPdrcIndicadorValor != null) qp.append("idPdrcIndicadorValor", String(filtros.idPdrcIndicadorValor));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));

    const url = qp.toString()
      ? `/api/dashboard/paisaje?${qp.toString()}`
      : `/api/dashboard/paisaje`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPaisajeDto>(resp);
  },
};

export default DashboardPaisajeAction;