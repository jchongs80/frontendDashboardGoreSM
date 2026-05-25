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

  async getAniosProyeccion(
    idPeriodo?: number | null,
    instrumento?: string | null
  ): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) qp.append("idPeriodo", String(idPeriodo));
    if (instrumento) qp.append("instrumento", instrumento);

    const url = qp.toString()
      ? `/api/dashboard/catalogos/anios-proyeccion?${qp.toString()}`
      : `/api/dashboard/catalogos/anios-proyeccion`;

    const resp = await api.get<unknown>(url);
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

  async getDimensionesAg(idPeriodo?: number | null): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) qp.append("idPeriodo", String(idPeriodo));

    const url = qp.toString()
      ? `/api/dashboard/catalogos/ag-dimensiones?${qp.toString()}`
      : `/api/dashboard/catalogos/ag-dimensiones`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },

  async getUnidadesAg(
    idPeriodo?: number | null,
    idDimension?: number | null
  ): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) qp.append("idPeriodo", String(idPeriodo));
    if (idDimension != null) qp.append("idDimension", String(idDimension));

    const url = qp.toString()
      ? `/api/dashboard/catalogos/ag-unidades?${qp.toString()}`
      : `/api/dashboard/catalogos/ag-unidades`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },

  async getPoliticasAg(
    idPeriodo?: number | null,
    idDimension?: number | null,
    idUnidad?: number | null
  ): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) qp.append("idPeriodo", String(idPeriodo));
    if (idDimension != null) qp.append("idDimension", String(idDimension));
    if (idUnidad != null) qp.append("idUnidad", String(idUnidad));

    const url = qp.toString()
      ? `/api/dashboard/catalogos/ag-politicas?${qp.toString()}`
      : `/api/dashboard/catalogos/ag-politicas`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },


  async getUnidadesPdrc(idPeriodo?: number | null): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) qp.append("idPeriodo", String(idPeriodo));

    const url = qp.toString()
      ? `/api/dashboard/catalogos/pdrc-unidades?${qp.toString()}`
      : `/api/dashboard/catalogos/pdrc-unidades`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },

  async getOerPdrc(
    idPeriodo?: number | null,
    idUnidad?: number | null
  ): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) qp.append("idPeriodo", String(idPeriodo));
    if (idUnidad != null) qp.append("idUnidad", String(idUnidad));

    const url = qp.toString()
      ? `/api/dashboard/catalogos/pdrc-oer?${qp.toString()}`
      : `/api/dashboard/catalogos/pdrc-oer`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },

  async getAerPdrc(
    idPeriodo?: number | null,
    idUnidad?: number | null,
    idOer?: number | null
  ): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) qp.append("idPeriodo", String(idPeriodo));
    if (idUnidad != null) qp.append("idUnidad", String(idUnidad));
    if (idOer != null) qp.append("idOer", String(idOer));

    const url = qp.toString()
      ? `/api/dashboard/catalogos/pdrc-aer?${qp.toString()}`
      : `/api/dashboard/catalogos/pdrc-aer`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },


  async getPoiAnios(): Promise<DashboardCatalogoItemDto[]> {
    const resp = await api.get<unknown>(`/api/dashboard/catalogos/poi-anios`);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },

  async getUnidadesPoi(
    idPeriodo?: number | null,
    idPoiAnio?: number | null
  ): Promise<DashboardCatalogoItemDto[]> {
    const qp = new URLSearchParams();

    if (idPeriodo != null) qp.append("idPeriodo", String(idPeriodo));
    if (idPoiAnio != null) qp.append("idPoiAnio", String(idPoiAnio));

    const url = qp.toString()
      ? `/api/dashboard/catalogos/poi-unidades-ejecutoras?${qp.toString()}`
      : `/api/dashboard/catalogos/poi-unidades-ejecutoras`;

    const resp = await api.get<unknown>(url);
    return unwrapObject<DashboardCatalogoItemDto[]>(resp) ?? [];
  },
};

export default DashboardCatalogoAction;
