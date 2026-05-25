import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

export type DashboardSemaforoDto = {
  rojo: number;
  amarillo: number;
  verde: number;
  azul: number;
};

export type DashboardPdrcKpiDto = {
  totalOer: number;
  totalAer: number;
  totalIndicadores: number;
  totalIndicadoresOer: number;
  totalIndicadoresAer: number;
  avancePromedio: number;
};

export type DashboardPdrcJerarquiaDto = {
  idPdrcOerAer: number;
  idIndicadorNombre: number;
  tipoNivel: string;
  codigoOer: string;
  enunciadoOer: string;
  codigoAer?: string | null;
  enunciadoAer?: string | null;
  cantidadIndicadores: number;
  avancePromedio: number;
  semaforo: string;
};

export type DashboardSerieTemporalDto = {
  periodo: string;
  instrumento: string;
  valor: number;
};

export type DashboardPdrcDto = {
  idPeriodo?: number | null;
  idDimension?: number | null;
  idUnidad?: number | null;
  idAnioProyeccion?: number | null;
  idOer?: number | null;
  idAer?: number | null;
  nivelAvance?: string | null;
  kpis: DashboardPdrcKpiDto;
  semaforo: DashboardSemaforoDto;
  jerarquia: DashboardPdrcJerarquiaDto[];
  tendencia: DashboardSerieTemporalDto[];
};

export type DashboardPdrcFiltros = {
  idPeriodo?: number;
  idDimension?: number;
  idUnidad?: number;
  idAnioProyeccion?: number;
  idOer?: number;
  idAer?: number;
  nivelAvance?: string;
};

const DashboardPdrcAction = {
  async getDashboard(filtros?: DashboardPdrcFiltros): Promise<DashboardPdrcDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));
    if (filtros?.idAnioProyeccion != null) qp.append("idAnioProyeccion", String(filtros.idAnioProyeccion));
    if (filtros?.idOer != null) qp.append("idOer", String(filtros.idOer));
    if (filtros?.idAer != null) qp.append("idAer", String(filtros.idAer));
    if (filtros?.nivelAvance) qp.append("nivelAvance", filtros.nivelAvance);

    const url = qp.toString()
      ? `/api/dashboard/pdrc?${qp.toString()}`
      : `/api/dashboard/pdrc`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardPdrcDto>(resp);
  },
};

export default DashboardPdrcAction;