import { api } from "../../shared/api";

export type CargaMasivaTipo = "ag" | "pdrc" | "prcp" | "pei" | "poi";
export type TipoPlantillaCarga = "VALOR" | "EJECUTADO";

export type CargaMasivaErrorDto = {
  numeroFila: number;
  campo: string;
  mensaje: string;
  valor?: string | null;
};

export type CargaMasivaValidacionDto = {
  nombreArchivo: string;
  tipoPlantilla?: string;
  totalFilas: number;
  filasValidas: number;
  filasConError: number;
  puedeProcesar: boolean;
  errores: CargaMasivaErrorDto[];
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
  valoresActualizados: number;
  valoresOmitidos: number;

  success: boolean;
  mensaje: string;
  errores: CargaMasivaErrorDto[];
};


export type PrcpCargaMasivaResultadoDto = {
  nombreArchivo: string;
  totalFilasLeidas: number;
  totalFilasValidas: number;
  totalFilasConError: number;

  periodosInsertados: number;
  aniosInsertados: number;
  unidadesInsertadas: number;
  objetivosPrioritariosInsertados: number;
  problemasIdentificadosInsertados: number;
  medidasPoliticaInsertadas: number;
  relacionesPrcpInsertadas: number;
  indicadoresInsertados: number;

  valoresInsertados: number;
  valoresActualizados: number;
  valoresOmitidos: number;

  success: boolean;
  mensaje: string;
  errores: CargaMasivaErrorDto[];
};

export type AgCargaMasivaResultadoDto = {
  nombreArchivo: string;
  tipoPlantilla: string;
  totalFilasLeidas: number;
  totalFilasValidas: number;
  totalFilasConError: number;

  cabecerasInsertadas: number;
  cabecerasReutilizadas: number;

  valoresInsertados: number;
  valoresActualizados: number;
  valoresOmitidos: number;

  success: boolean;
  mensaje: string;
  errores: CargaMasivaErrorDto[];
};

export type CargaMasivaResultadoDto =
  | PdrcCargaMasivaResultadoDto
  | PrcpCargaMasivaResultadoDto
  | AgCargaMasivaResultadoDto;

function normalizeTipo(tipo: string | undefined): CargaMasivaTipo {
  const t = (tipo ?? "").trim().toLowerCase();

  if (t === "pdrc" || t === "prcp" || t === "pei" || t === "poi" || t === "ag") {
    return t;
  }

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
      return {
        validar: "/api/AgCargaMasiva/validar",
        procesar: "/api/AgCargaMasiva/procesar",
      };

    case "prcp":
      return {
        validar: "/api/PrcpCargaMasiva/validar",
        procesar: "/api/PrcpCargaMasiva/procesar",
      };

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

function buildFormData(
  tipo: string | undefined,
  archivo: File,
  tipoPlantilla: TipoPlantillaCarga
): FormData {
  const formData = new FormData();

  formData.append("archivo", archivo);

  const instrumento = normalizeTipo(tipo);

  if (instrumento === "ag" || instrumento === "pdrc" || instrumento === "prcp") {
    formData.append(
      "tipoPlantilla",
      instrumento === "ag" || instrumento === "pdrc" || instrumento === "prcp"
        ? "VALOR"
        : tipoPlantilla
    );
  }

  return formData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringProperty(
  objeto: Record<string, unknown>,
  propiedad: string
): string | null {
  const valor = objeto[propiedad];
  return typeof valor === "string" ? valor : null;
}

function extraerDataRespuesta<T>(response: unknown): T {
  if (isRecord(response) && "data" in response) {
    return response.data as T;
  }

  return response as T;
}

function extraerMensajeError(error: unknown): string {
  console.error("Error real carga masiva:", error);

  if (isRecord(error)) {
    const response = error["response"];

    if (isRecord(response)) {
      const data = response["data"];

      if (typeof data === "string") {
        return data;
      }

      if (isRecord(data)) {
        const mensaje = getStringProperty(data, "mensaje");
        if (mensaje) return mensaje;

        const message = getStringProperty(data, "message");
        if (message) return message;

        const title = getStringProperty(data, "title");
        if (title) return title;

        const errores = data["errores"];

        if (Array.isArray(errores) && errores.length > 0) {
          const primerError = errores[0];

          if (isRecord(primerError)) {
            const mensajeError = getStringProperty(primerError, "mensaje");
            if (mensajeError) return mensajeError;

            const messageError = getStringProperty(primerError, "message");
            if (messageError) return messageError;
          }
        }

        try {
          return JSON.stringify(data);
        } catch {
          return "Error del servidor, pero no se pudo interpretar el detalle.";
        }
      }
    }

    const mensajeDirecto = getStringProperty(error, "message");
    if (mensajeDirecto) return mensajeDirecto;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Error inesperado.";
}

export const CargaMasivaAction = {
  async validar(
    tipo: string | undefined,
    archivo: File,
    tipoPlantilla: TipoPlantillaCarga
  ): Promise<CargaMasivaValidacionDto> {
    const endpoints = getEndpoints(tipo);

    if (!endpoints.validar) {
      throw new Error(
        `La carga masiva para ${normalizeTipo(tipo).toUpperCase()} aún no está implementada.`
      );
    }

    try {
      const response = await api.post(
        endpoints.validar,
        buildFormData(tipo, archivo, tipoPlantilla)
      );

      return extraerDataRespuesta<CargaMasivaValidacionDto>(response);
    } catch (error: unknown) {
      throw new Error(extraerMensajeError(error));
    }
  },

  async procesar(
    tipo: string | undefined,
    archivo: File,
    tipoPlantilla: TipoPlantillaCarga
  ): Promise<CargaMasivaResultadoDto> {
    const endpoints = getEndpoints(tipo);

    if (!endpoints.procesar) {
      throw new Error(
        `La carga masiva para ${normalizeTipo(tipo).toUpperCase()} aún no está implementada.`
      );
    }

    try {
      const response = await api.post(
        endpoints.procesar,
        buildFormData(tipo, archivo, tipoPlantilla)
      );

      return extraerDataRespuesta<CargaMasivaResultadoDto>(response);
    } catch (error: unknown) {
      throw new Error(extraerMensajeError(error));
    }
  },
};