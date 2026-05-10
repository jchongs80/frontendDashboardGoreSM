import { api } from "../../shared/api";
import { unwrapObject } from "./DashboardApiHelper";

export type DashboardCatalogoItemDto = {
  value: number;
  label: string;
};

const DashboardCatalogoAction = {
  async getPeriodos(instrumento: string): Promise<DashboardCatalogoItemDto[]> {
    const resp = await api.get<unknown>(
      `/api/dashboard/catalogos/periodos?instrumento=${encodeURIComponent(instrumento)}`
    );
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },

  async getAniosProyeccion(): Promise<DashboardCatalogoItemDto[]> {
    const resp = await api.get<unknown>(`/api/dashboard/catalogos/anios-proyeccion`);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },

  async getUnidadesPei(idPeriodo?: number | null): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) {
      qp.append("idPeriodo", String(idPeriodo));
    }

    const url = qp.toString()
      ? `/api/dashboard/catalogos/unidades-pei?${qp.toString()}`
      : `/api/dashboard/catalogos/unidades-pei`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },


  async getObjetivosPrioritariosPrcp(idPeriodo?: number | null): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) {
      qp.append("idPeriodo", String(idPeriodo));
    }

    const url = qp.toString()
      ? `/api/dashboard/catalogos/prcp-objetivos-prioritarios?${qp.toString()}`
      : `/api/dashboard/catalogos/prcp-objetivos-prioritarios`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },

  async getUnidadConductoraObjetivoPrcp(
    idPeriodo: number | null | undefined,
    idObjetivoPrioritario: number
  ): Promise<DashboardCatalogoItemDto | null> {
    const qp = new URLSearchParams({
      idObjetivoPrioritario: String(idObjetivoPrioritario),
    });

    if (idPeriodo != null) {
      qp.append("idPeriodo", String(idPeriodo));
    }

    const resp = await api.get<unknown>(
      `/api/dashboard/catalogos/prcp-unidad-conductora?${qp.toString()}`
    );

    return unwrapObject<DashboardCatalogoItemDto>(resp);
  },

  async getPoiAnios(): Promise<DashboardCatalogoItemDto[]> {
    const resp = await api.get<unknown>(`/api/dashboard/catalogos/poi-anios`);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },
};

export default DashboardCatalogoAction;
