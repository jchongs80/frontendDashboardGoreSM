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
  onChange: (value: DashboardPoiHeaderFiltersValue) => void;
};

export default function DashboardPoiHeaderFilters(props: Props): React.ReactElement {
  const { value, periodos, poiAnios, meses = [], onChange } = props;

  function handlePeriodoChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;
    onChange({
      ...value,
      idPeriodo: raw === "" ? null : Number(raw),
    });
  }

  function handlePoiAnioChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;
    onChange({
      ...value,
      idPoiAnio: raw === "" ? null : Number(raw),
    });
  }

  function handleMesChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;
    onChange({
      ...value,
      mes: raw === "" ? null : Number(raw),
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
        boxShadow: "0 10px 24px rgba(0,0,0,.05)",
        mb: 2.2,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box sx={{ minWidth: { xs: "100%", md: 220 } }}>
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

        <Box sx={{ minWidth: { xs: "100%", md: 220 } }}>
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

        <Box sx={{ minWidth: { xs: "100%", md: 180 } }}>
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
      </Stack>
    </Paper>
  );
}