export type OptionItem = {
  value: number | string;
  label: string;
};

export type DashboardNivelAvanceValue = "0_75" | "75_95" | "95_MAS";

export type DashboardCommonHeaderFiltersValue = {
  idPeriodo?: number | null;
  idAnioProyeccion?: number | null;
  idUnidad?: number | null;
  idObjetivoPrioritario?: number | null;
  nivelAvance?: DashboardNivelAvanceValue | null;
};

export type DashboardPoiHeaderFiltersValue = {
  idPeriodo?: number | null;
  idPoiAnio?: number | null;
  mes?: number | null;
};
