import { api } from "../../shared/api";

/** ============
 * Tipos / DTOs
 * ============ */

export type ApiResponseDto<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: string[];
};
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasData<T>(v: unknown): v is ApiResponseDto<T> {
  return isRecord(v) && "data" in v;
}
export type PoiComboItemDto = {
  id: number;
  codigo: string | null;
  nombre: string | null;
};

export type PoiCentroCostoDto = {
  idCentroCosto: number;
  codigo: string | null;
  nombre: string | null;
};

export type PoiOeiAeiMasterDto = {
  idOeiAei: number;
  codigoOei: string | null;
  descripcionOei: string | null;
  codigoAei: string | null;
  descripcionAei: string | null;
  estado: boolean;
};

export type PoiOeiAeiAoListDto = {
  idOeiAeiAo: number;
  nroRegistroPoi: string;
  // ✅ poi_oei_aei_ao.codigo_ao
  codigoAo?: string | null;
  idActividadOperativa: number | null;
  codigoActividadOperativa: string | null;
  nombreActividadOperativa: string | null;
};
// ✅ Header del bloque Detail (OER + AER)
export type PoiOeiAeiHeaderDto = {
  idOeiAei: number;
  oerCodigo: string | null;
  oerEnunciado: string | null;
  aerCodigo: string | null;
  aerEnunciado: string | null;
};

// ✨ NUEVO DTO
export type PoiActividadOperativaNombreDto = {
  idActividadOperativa: number;
  codigo: string | null;
  nombre: string | null;
};

// ✨ NUEVO DTO para el detalle completo
export type PoiOeiAeiAoDetalleDto = {
  idOeiAeiAo: number;
  idOeiAei: number;
  idCategoria: number | null;
  idProductoProyecto: number | null;
  idFuncion: number | null;
  idDivision: number | null;
  idGrupo: number | null;
  idActividadPresupuesto: number | null;
  idActividadOperativa: number | null;
  codigoAo: string;
  nroRegistroPoi: string;
  codigoActividadOperativa: string | null;
  nombreActividadOperativa: string | null;
};

// ✨ ACTUALIZADO: Ahora incluye los nuevos campos
export type PoiOeiAeiAoCreateDto = {
  idOeiAei: number;

  idCategoria?: number | null;
  idProductoProyecto?: number | null;
  idFuncion?: number | null;

  idDivision?: number | null;
  idGrupo?: number | null;

  idActividadPresupuesto?: number | null;

  nroRegistroPoi: string;

  // ✅ Caso 1: Seleccionar nombre existente
  idActividadOperativa?: number | null;

  // ✅ Caso 2: Crear nuevo nombre
  nuevoNombreActividadOperativa?: string | null;

  // ✅ El backend devuelve/guarda esto en poi_oei_aei_ao.codigo_ao
  codigoAo?: string | null;
};

export type PoiAoFiltrosDto = {
  idCategoria?: number | null;
  idProductoProyecto?: number | null;
  idFuncion?: number | null;
  idDivision?: number | null;
  idGrupo?: number | null;
  idActividadPresupuesto?: number | null;
  nroRegistroPoi?: string | null;
};

function qs(value?: string | null) {
  return encodeURIComponent((value ?? "").toString());
}

/**
 * Unwrap seguro:
 * - Si api.get devuelve array directo => lo retornamos.
 * - Si api.get devuelve ApiResponseDto => retornamos .data
 */
function unwrapList<T>(resp: unknown): T[] {
  if (Array.isArray(resp)) return resp as T[];
  if (resp && typeof resp === "object" && "data" in resp) {
    const data = (resp as ApiResponseDto<T[]>).data;
    return Array.isArray(data) ? data : [];
  }
  return [];
}

export const PoiOeiAeiAoAction = {
  // =========================
  // Centros de costo por UE
  // =========================
  async getCentrosCostoByUnidadEjecutora(idUnidadEjecutora: number) {
    const resp = await api.get(`/api/poi/centros-costo/unidad-ejecutora/${idUnidadEjecutora}`);
    return unwrapList<PoiCentroCostoDto>(resp);
  },

  // =========================
  // Master OEI/AEI por UE + CC
  // =========================
  async getMasterOeiAei(params: { idUnidadEjecutora: number; idCentroCosto?: number | null }) {
    const q = new URLSearchParams();
    q.set("idUnidadEjecutora", String(params.idUnidadEjecutora));
    if (params.idCentroCosto) q.set("idCentroCosto", String(params.idCentroCosto));

    const resp = await api.get(`/api/poi/oei-aei/master?${q.toString()}`);
    return unwrapList<PoiOeiAeiMasterDto>(resp);
  },

  // =========================
  // Detail AO por idOeiAei (+ filtros)
  // =========================
  async getAoByOeiAei(idOeiAei: number, filtros?: PoiAoFiltrosDto) {
    const q = new URLSearchParams();
    if (filtros?.idCategoria) q.set("idCategoria", String(filtros.idCategoria));
    if (filtros?.idProductoProyecto) q.set("idProductoProyecto", String(filtros.idProductoProyecto));
    if (filtros?.idFuncion) q.set("idFuncion", String(filtros.idFuncion));
    if (filtros?.idDivision) q.set("idDivision", String(filtros.idDivision));
    if (filtros?.idGrupo) q.set("idGrupo", String(filtros.idGrupo));
    if (filtros?.idActividadPresupuesto) q.set("idActividadPresupuesto", String(filtros.idActividadPresupuesto));
    if (filtros?.nroRegistroPoi && filtros.nroRegistroPoi.trim().length > 0) {
      q.set("nroRegistroPoi", filtros.nroRegistroPoi.trim());
    }

    const resp = await api.get(`/api/poi/oei-aei/${idOeiAei}/ao?${q.toString()}`);
    return unwrapList<PoiOeiAeiAoListDto>(resp);
  },

  // =========================
  // ✨ NUEVO: Obtener nombres de actividades operativas
  // =========================
  async getNombresActividadesOperativas() {
    const resp = await api.get(`/api/poi/actividades-operativas/nombres`);
    return unwrapList<PoiActividadOperativaNombreDto>(resp);
  },

  // ✅ Header OER/AER por OEI/AEI (para el título del detail)
  async getHeaderByOeiAei(idOeiAei: number): Promise<PoiOeiAeiHeaderDto | null> {
    try {
      const respUnknown: unknown = await api.get(`/api/poi/oei-aei/${idOeiAei}/header`);

      const raw: unknown = hasData<unknown>(respUnknown) ? respUnknown.data : respUnknown;
      if (!isRecord(raw)) return null;

      const id = raw["IdOeiAei"] ?? raw["idOeiAei"];
      if (typeof id !== "number") return null;

      const oerCodigo = raw["OerCodigo"] ?? raw["oerCodigo"];
      const oerEnunciado = raw["OerEnunciado"] ?? raw["oerEnunciado"];
      const aerCodigo = raw["AerCodigo"] ?? raw["aerCodigo"];
      const aerEnunciado = raw["AerEnunciado"] ?? raw["aerEnunciado"];

      return {
        idOeiAei: id,
        oerCodigo: typeof oerCodigo === "string" ? oerCodigo : null,
        oerEnunciado: typeof oerEnunciado === "string" ? oerEnunciado : null,
        aerCodigo: typeof aerCodigo === "string" ? aerCodigo : null,
        aerEnunciado: typeof aerEnunciado === "string" ? aerEnunciado : null,
      };
    } catch (e) {
      console.error("❌ getHeaderByOeiAei:", e);
      return null;
    }
  },

  // =========================
  // Catálogos (combos con búsqueda)
  // =========================
  async getCategorias(search?: string) {
    const resp = await api.get(`/api/PoiCatalogos/categorias?search=${qs(search)}`);
    return unwrapList<PoiComboItemDto>(resp);
  },

  async getProductosProyectos(search?: string) {
    const resp = await api.get(`/api/PoiCatalogos/productos-proyectos?search=${qs(search)}`);
    return unwrapList<PoiComboItemDto>(resp);
  },

  async getFunciones(search?: string) {
    const resp = await api.get(`/api/PoiCatalogos/funciones?search=${qs(search)}`);
    return unwrapList<PoiComboItemDto>(resp);
  },

  async getDivisiones(search?: string) {
    const resp = await api.get(`/api/PoiCatalogos/divisiones?search=${qs(search)}`);
    return unwrapList<PoiComboItemDto>(resp);
  },

  async getGrupos(idDivision?: number | null, search?: string) {
    const q = new URLSearchParams();
    if (idDivision) q.set("idDivision", String(idDivision));
    if (search && search.trim().length > 0) q.set("search", search.trim());

    const resp = await api.get(`/api/PoiCatalogos/grupos?${q.toString()}`);
    return unwrapList<PoiComboItemDto>(resp);
  },

  async getActividadesPresupuestales(search?: string) {
    const resp = await api.get(`/api/PoiCatalogos/actividades-presupuestales?search=${qs(search)}`);
    return unwrapList<PoiComboItemDto>(resp);
  },

  // =========================
  // CRUD AO
  // =========================
  async crearAo(payload: PoiOeiAeiAoCreateDto) {
    await api.post(`/api/poi/oei-aei-ao`, payload);
    return true;
  },

  async actualizarAo(idOeiAeiAo: number, payload: PoiOeiAeiAoCreateDto) {
    await api.put(`/api/poi/oei-aei-ao/${idOeiAeiAo}`, payload);
    return true;
  },

  async eliminarAo(idOeiAeiAo: number) {
    await api.delete(`/api/poi/oei-aei-ao/${idOeiAeiAo}`);
    return true;
  },

  // ✨ NUEVO: Obtener detalle de un registro específico para edición
  async getDetalleAo(idOeiAeiAo: number): Promise<PoiOeiAeiAoDetalleDto | null> {
    try {
      console.log(`🌐 GET /api/poi/oei-aei-ao/${idOeiAeiAo}`);
      const resp = await api.get(`/api/poi/oei-aei-ao/${idOeiAeiAo}`);
      console.log("📥 Respuesta recibida:", resp);

      // Extraer datos (puede venir en { data: ... } o directo)
      let data: unknown = null;
      if (resp && typeof resp === "object") {
        if ("data" in resp && resp.data) {
          console.log("✅ Detalle extraído de resp.data");
          data = resp.data;
        } else {
          console.log("✅ Detalle directo");
          data = resp;
        }
      }

      if (!data) {
        console.warn("⚠️ Respuesta vacía o inválida");
        return null;
      }

      // 🔧 MAPEAR de PascalCase (backend .NET) a camelCase (TypeScript)
      const rawData = data as Record<string, unknown>;
      const mapped: PoiOeiAeiAoDetalleDto = {
        idOeiAeiAo: (rawData.IdOeiAeiAo ?? rawData.idOeiAeiAo) as number,
        idOeiAei: (rawData.IdOeiAei ?? rawData.idOeiAei) as number,
        idCategoria: (rawData.IdCategoria ?? rawData.idCategoria) as number | null,
        idProductoProyecto: (rawData.IdProductoProyecto ?? rawData.idProductoProyecto) as number | null,
        idFuncion: (rawData.IdFuncion ?? rawData.idFuncion) as number | null,
        idDivision: (rawData.IdDivision ?? rawData.idDivision) as number | null,
        idGrupo: (rawData.IdGrupo ?? rawData.idGrupo) as number | null,
        idActividadPresupuesto: (rawData.IdActividadPresupuesto ?? rawData.idActividadPresupuesto) as number | null,
        idActividadOperativa: (rawData.IdActividadOperativa ?? rawData.idActividadOperativa) as number | null,
        codigoAo: (rawData.CodigoAo ?? rawData.codigoAo) as string,
        nroRegistroPoi: (rawData.NroRegistroPoi ?? rawData.nroRegistroPoi) as string,
        codigoActividadOperativa: (rawData.CodigoActividadOperativa ?? rawData.codigoActividadOperativa) as string | null,
        nombreActividadOperativa: (rawData.NombreActividadOperativa ?? rawData.nombreActividadOperativa) as string | null,
      };

      console.log("🔄 Datos mapeados:", mapped);
      return mapped;

    } catch (error) {
      console.error("❌ Error en getDetalleAo:", error);
      return null;
    }
  },
};

export default PoiOeiAeiAoAction;
