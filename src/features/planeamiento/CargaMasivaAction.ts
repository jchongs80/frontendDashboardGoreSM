import { api } from "../../shared/api";

export type CargaMasivaTipo = "ag" | "pdrc" | "pei" | "poi";

export type PdrcCargaMasivaErrorDto = {
  numeroFila: number;
  campo: string;
  mensaje: string;
  valor?: string | null;
};

export type PdrcCargaMasivaValidacionDto = {
  nombreArchivo: string;
  totalFilas: number;
  filasValidas: number;
  filasConError: number;
  puedeProcesar: boolean;
  errores: PdrcCargaMasivaErrorDto[];
};

export type PdrcCargaMasivaResultadoDto = {
  nombreArchivo: string;
  totalFilasLeidas: number;
  totalFilasValidas: number;
  totalFilasConError: number;
  periodosInsertados: number;
  oerInsertados: number;
  aerInsertados: number;
  entidadesEstrategicasInsertadas: number;
  oerAerInsertados: number;
  indicadoresInsertados: number;
  valoresInsertados: number;
  valoresOmitidos: number;
  success: boolean;
  mensaje: string;
  errores: PdrcCargaMasivaErrorDto[];
};

function normalizeTipo(tipo: string | undefined): CargaMasivaTipo {
  const t = (tipo ?? "").trim().toLowerCase();
  if (t === "pdrc" || t === "pei" || t === "poi" || t === "ag") return t;
  return "pdrc";
}

function getEndpoints(tipo: string | undefined) {
  const t = normalizeTipo(tipo);

  switch (t) {
    case "pdrc":
      return {
        validar: "/api/PdrcCargaMasiva/validar",
        procesar: "/api/PdrcCargaMasiva/procesar",
      };

    case "ag":
    case "pei":
    case "poi":
      return {
        validar: "",
        procesar: "",
      };

    default:
      return {
        validar: "/api/PdrcCargaMasiva/validar",
        procesar: "/api/PdrcCargaMasiva/procesar",
      };
  }
}

export const CargaMasivaAction = {
  async validar(tipo: string | undefined, archivo: File) {
    const endpoints = getEndpoints(tipo);

    if (!endpoints.validar) {
      throw new Error(`La carga masiva para ${normalizeTipo(tipo).toUpperCase()} aún no está implementada.`);
    }

    const formData = new FormData();
    formData.append("archivo", archivo);

    return await api.post<PdrcCargaMasivaValidacionDto>(endpoints.validar, formData);
  },

  async procesar(tipo: string | undefined, archivo: File) {
    const endpoints = getEndpoints(tipo);

    if (!endpoints.procesar) {
      throw new Error(`La carga masiva para ${normalizeTipo(tipo).toUpperCase()} aún no está implementada.`);
    }

    const formData = new FormData();
    formData.append("archivo", archivo);

    return await api.post<PdrcCargaMasivaResultadoDto>(endpoints.procesar, formData);
  },
};