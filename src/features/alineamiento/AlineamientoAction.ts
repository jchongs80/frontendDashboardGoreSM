// src/features/alineamiento/AlineamientoAction.ts
import { api } from "../../shared/api";

const BASE = "/api/AlineamientosInstrumentos";

export type AlineamientoListDto = {
  idAlineamiento: number;

  idInstrumentoOrigen: number;
  nombreInstrumentoOrigen?: string | null;
  idObjetivoOrigen?: number | null;
  codigoObjetivoOrigen?: string | null;
  enunciadoObjetivoOrigen?: string | null;
  idAccionOrigen?: number | null;
  codigoAccionOrigen?: string | null;
  enunciadoAccionOrigen?: string | null;

  idInstrumentoDestino: number;
  nombreInstrumentoDestino?: string | null;
  idObjetivoDestino?: number | null;
  codigoObjetivoDestino?: string | null;
  enunciadoObjetivoDestino?: string | null;
  idAccionDestino?: number | null;
  codigoAccionDestino?: string | null;
  enunciadoAccionDestino?: string | null;

  tipoAlineamiento?: string | null;
  nivelAlineamiento?: string | null;
  porcentajeContribucion?: number | null;
  estado?: string | null;
};

export type AlineamientoDetailDto = AlineamientoListDto & {
  descripcionAlineamiento?: string | null;
  fechaCreacion?: string | null;
  fechaModificacion?: string | null;
  usuarioCreacion?: string | null;
  usuarioModificacion?: string | null;
};

export type AlineamientoCreateUpdateDto = {
  idInstrumentoOrigen: number;
  idObjetivoOrigen?: number | null;
  idAccionOrigen?: number | null;

  idInstrumentoDestino: number;
  idObjetivoDestino?: number | null;
  idAccionDestino?: number | null;

  tipoAlineamiento?: string | null;
  nivelAlineamiento?: string | null;
  porcentajeContribucion?: number | null;
  descripcionAlineamiento?: string | null;

  estado: string; // "ACTIVO" | "INACTIVO"
};

export const AlineamientoAction = {
  getAlineamientos: (
    idInstrumentoOrigen?: number | null,
    idInstrumentoDestino?: number | null
  ) => {
    const qs = new URLSearchParams();
    if (idInstrumentoOrigen) qs.append("idInstrumentoOrigen", String(idInstrumentoOrigen));
    if (idInstrumentoDestino) qs.append("idInstrumentoDestino", String(idInstrumentoDestino));

    const q = qs.toString();
    return api.get<AlineamientoListDto[]>(`${BASE}${q ? `?${q}` : ""}`);
  },

  getAlineamientoById: (id: number) =>
    api.get<AlineamientoDetailDto>(`${BASE}/${id}`),

  createAlineamiento: (payload: AlineamientoCreateUpdateDto) =>
    api.post<number>(`${BASE}`, payload),

  updateAlineamiento: (id: number, payload: AlineamientoCreateUpdateDto) =>
    api.put<boolean>(`${BASE}/${id}`, payload),

  deleteAlineamiento: (id: number) =>
    api.del<boolean>(`${BASE}/${id}`),
};
