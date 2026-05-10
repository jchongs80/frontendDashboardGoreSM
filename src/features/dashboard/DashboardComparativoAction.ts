import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

export type DashboardComparativoInstrumentoDto = {
  instrumento: string;
  indicadores: number;
  avancePromedio: number;
  rojo: number;
  amarillo: number;
  verde: number;
  azul: number;
};

export type DashboardSerieTemporalDto = {
  periodo: string;
  instrumento: string;
  valor: number;
};

export type DashboardComparativoDto = {
  anio?: number | null;
  idPeriodo?: number | null;
  idDimension?: number | null;
  idUnidad?: number | null;
  instrumentos: DashboardComparativoInstrumentoDto[];
  tendencia: DashboardSerieTemporalDto[];
};

export type DashboardComparativoFiltros = {
  anio?: number;
  idPeriodo?: number;
  idDimension?: number;
  idUnidad?: number;
};

export const DashboardComparativoAction = {
  async getComparativo(
    filtros?: DashboardComparativoFiltros
  ): Promise<DashboardComparativoDto | null> {
    const qp = new URLSearchParams();

    if (filtros?.anio != null) qp.append("anio", String(filtros.anio));
    if (filtros?.idPeriodo != null) qp.append("idPeriodo", String(filtros.idPeriodo));
    if (filtros?.idDimension != null) qp.append("idDimension", String(filtros.idDimension));
    if (filtros?.idUnidad != null) qp.append("idUnidad", String(filtros.idUnidad));

    const url = qp.toString()
      ? `/api/dashboard/comparativo?${qp.toString()}`
      : `/api/dashboard/comparativo`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardComparativoDto>(resp);
  },
};

export default DashboardComparativoAction;