import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  type SelectChangeEvent,
} from "@mui/material";
import type {
  DashboardCommonHeaderFiltersValue,
  OptionItem,
} from "../DashboardFiltersTypes";

type Props = {
  value: DashboardCommonHeaderFiltersValue;
  periodos: OptionItem[];
  aniosProyeccion: OptionItem[];
  unidadesOrganizacionales?: OptionItem[];
  objetivosPrioritarios?: OptionItem[];
  mostrarUnidadOrganizacional?: boolean;
  mostrarObjetivoPrioritario?: boolean;
  unidadConductoraObjetivo?: string;
  mostrarUnidadConductoraObjetivo?: boolean;
  mostrarNivelAvance?: boolean;
  onChange: (value: DashboardCommonHeaderFiltersValue) => void;
};

const nivelesAvance: OptionItem[] = [
  { value: "0_75", label: "0% - 75%" },
  { value: "75_95", label: "75% - 95%" },
  { value: "95_MAS", label: "95% a más" },
];

export default function DashboardHeaderFilters(props: Props): React.ReactElement {
  const {
    value,
    periodos,
    aniosProyeccion,
    unidadesOrganizacionales = [],
    objetivosPrioritarios = [],
    mostrarUnidadOrganizacional = false,
    mostrarObjetivoPrioritario = false,
    unidadConductoraObjetivo = "",
    mostrarUnidadConductoraObjetivo = false,
    mostrarNivelAvance = false,
    onChange,
  } = props;

  function handlePeriodoChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;

    onChange({
      ...value,
      idPeriodo: raw === "" ? null : Number(raw),
      idUnidad: null,
      idObjetivoPrioritario: null,
    });
  }

  function handleAnioProyeccionChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;

    onChange({
      ...value,
      idAnioProyeccion: raw === "" ? null : Number(raw),
    });
  }

  function handleObjetivoPrioritarioChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;

    onChange({
      ...value,
      idObjetivoPrioritario: raw === "" ? null : Number(raw),
    });
  }

  function handleUnidadChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;

    onChange({
      ...value,
      idUnidad: raw === "" ? null : Number(raw),
    });
  }

  function handleNivelAvanceChange(event: SelectChangeEvent<number | string>) {
    const raw = event.target.value;

    onChange({
      ...value,
      nivelAvance: raw === "" ? null : String(raw) as DashboardCommonHeaderFiltersValue["nivelAvance"],
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
        flexWrap="wrap"
        useFlexGap
      >
        <Box sx={{ minWidth: { xs: "100%", md: 240 } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="dashboard-periodo-label">Período</InputLabel>
            <Select
              labelId="dashboard-periodo-label"
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

        <Box sx={{ minWidth: { xs: "100%", md: 240 } }}>
          <FormControl fullWidth size="small">
            <InputLabel id="dashboard-anio-proyeccion-label">
              Año de proyección
            </InputLabel>
            <Select
              labelId="dashboard-anio-proyeccion-label"
              value={value.idAnioProyeccion ?? ""}
              label="Año de proyección"
              onChange={handleAnioProyeccionChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {aniosProyeccion.map((item) => (
                <MenuItem key={String(item.value)} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>


        {mostrarObjetivoPrioritario ? (
          <Box sx={{ minWidth: { xs: "100%", md: 360 } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="dashboard-objetivo-prioritario-label">
                Objetivo prioritario
              </InputLabel>
              <Select
                labelId="dashboard-objetivo-prioritario-label"
                value={value.idObjetivoPrioritario ?? ""}
                label="Objetivo prioritario"
                onChange={handleObjetivoPrioritarioChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {objetivosPrioritarios.map((item) => (
                  <MenuItem key={String(item.value)} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : null}

        {mostrarUnidadConductoraObjetivo ? (
          <Box sx={{ minWidth: { xs: "100%", md: 340 } }}>
            <TextField
              fullWidth
              size="small"
              label="Unidad conductora del OP"
              value={unidadConductoraObjetivo || "—"}
              InputProps={{ readOnly: true }}
            />
          </Box>
        ) : null}

        {mostrarUnidadOrganizacional ? (
          <Box sx={{ minWidth: { xs: "100%", md: 300 } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="dashboard-unidad-label">Unidad organizacional</InputLabel>
              <Select
                labelId="dashboard-unidad-label"
                value={value.idUnidad ?? ""}
                label="Unidad organizacional"
                onChange={handleUnidadChange}
              >
                <MenuItem value="">Todas</MenuItem>
                {unidadesOrganizacionales.map((item) => (
                  <MenuItem key={String(item.value)} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : null}

        {mostrarNivelAvance ? (
          <Box sx={{ minWidth: { xs: "100%", md: 220 } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="dashboard-nivel-avance-label">Nivel de avance</InputLabel>
              <Select
                labelId="dashboard-nivel-avance-label"
                value={value.nivelAvance ?? ""}
                label="Nivel de avance"
                onChange={handleNivelAvanceChange}
              >
                <MenuItem value="">Todos</MenuItem>
                {nivelesAvance.map((item) => (
                  <MenuItem key={String(item.value)} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ) : null}
      </Stack>
    </Paper>
  );
}
