import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  type SelectChangeEvent,
} from "@mui/material";
import type {
  DashboardPoiHeaderFiltersValue,
  OptionItem,
} from "../DashboardFiltersTypes";

type Props = {
  value: DashboardPoiHeaderFiltersValue;
  periodos: OptionItem[];
  poiAnios: OptionItem[];
  meses?: OptionItem[];
  unidadesEjecutoras?: OptionItem[];
  onChange: (value: DashboardPoiHeaderFiltersValue) => void;
};

export default function DashboardPoiHeaderFilters(props: Props): React.ReactElement {
  const {
    value,
    periodos,
    poiAnios,
    meses = [],
    unidadesEjecutoras = [],
    onChange,
  } = props;

  function handlePeriodoChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;
    onChange({
      ...value,
      idPeriodo: raw === "" ? null : Number(raw),
      idUnidadEjecutora: null,
    });
  }

  function handlePoiAnioChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;
    onChange({
      ...value,
      idPoiAnio: raw === "" ? null : Number(raw),
      idUnidadEjecutora: null,
    });
  }

  function handleMesChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;
    onChange({
      ...value,
      mes: raw === "" ? null : Number(raw),
    });
  }

  function handleUnidadEjecutoraChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;
    onChange({
      ...value,
      idUnidadEjecutora: raw === "" ? null : Number(raw),
    });
  }


  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 10px 24px rgba(15,23,42,.05)",
        mb: 2.2,
        background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box sx={{ minWidth: { xs: "100%", md: 210 } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="dashboard-poi-periodo-label">Período</InputLabel>
            <Select
              labelId="dashboard-poi-periodo-label"
              value={value.idPeriodo ?? ""}
              label="Período"
              onChange={handlePeriodoChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {periodos.map((item) => (
                <MenuItem key={String(item.value)} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: { xs: "100%", md: 160 } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="dashboard-poi-anio-label">Año POI</InputLabel>
            <Select
              labelId="dashboard-poi-anio-label"
              value={value.idPoiAnio ?? ""}
              label="Año POI"
              onChange={handlePoiAnioChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {poiAnios.map((item) => (
                <MenuItem key={String(item.value)} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: { xs: "100%", md: 150 } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="dashboard-poi-mes-label">Mes</InputLabel>
            <Select
              labelId="dashboard-poi-mes-label"
              value={value.mes ?? ""}
              label="Mes"
              onChange={handleMesChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {meses.map((item) => (
                <MenuItem key={String(item.value)} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ minWidth: { xs: "100%", md: 420 }, flex: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="dashboard-poi-ue-label">Unidad Ejecutora por OEI</InputLabel>
            <Select
              labelId="dashboard-poi-ue-label"
              value={value.idUnidadEjecutora ?? ""}
              label="Unidad Ejecutora por OEI"
              onChange={handleUnidadEjecutoraChange}
            >
              <MenuItem value="">Todas</MenuItem>
              {unidadesEjecutoras.map((item) => (
                <MenuItem key={String(item.value)} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Stack>
    </Paper>
  );
}
