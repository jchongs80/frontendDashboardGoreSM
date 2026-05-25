export type OptionItem = {
  value: number | string;
  label: string;
};

export type DashboardNivelAvanceValue = "0_75" | "75_95" | "95_MAS";

export type DashboardCommonHeaderFiltersValue = {
  idPeriodo?: number | null;
  idAnioProyeccion?: number | null;
  idDimension?: number | null;
  idUnidad?: number | null;
  idPolitica?: number | null;
  idObjetivoPrioritario?: number | null;
  idOer?: number | null;
  idAer?: number | null;
  nivelAvance?: DashboardNivelAvanceValue | null;
};

export type DashboardPoiHeaderFiltersValue = {
  idPeriodo?: number | null;
  idPoiAnio?: number | null;
  mes?: number | null;
  idUnidadEjecutora?: number | null;
  nivelCumplimiento?: string | null;
};
