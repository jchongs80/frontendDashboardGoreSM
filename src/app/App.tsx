import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import RequireAuth from "../features/auth/RequireAuth";
import DashboardLayout from "../layouts/DashboardLayout";
import Home from "../pages/dashboard/Home";

import DimensionesPage from "../features/catalogos/pages/DimensionesPage";
import FuenteDatosPage from "../features/catalogos/pages/FuenteDatosPage";
import InstrumentosPage from "../features/catalogos/pages/InstrumentosPage";
import TipoIndicadorPage from "../features/catalogos/pages/TipoIndicadorPage";
import UnidadesMedidaPage from "../features/catalogos/pages/UnidadesMedidaPage";
import UnidadesOrgPage from "../features/catalogos/pages/UnidadesOrgPage";

import IndicadoresPage from "../features/planeamiento/pages/IndicadoresPage";
import IndicadoresInstrumentosPage from "../features/planeamiento/pages/IndicadoresInstrumentosPage";
import IndicadoresMetasPage from "../features/planeamiento/pages/IndicadoresMetaPage";
import EjesEstrategicosPage from "../features/planeamiento/pages/EjesEstrategicosPage";
import PoliticasPage from "../features/planeamiento/pages/PoliticasPage";
import ObjetivosPage from "../features/planeamiento/pages/ObjetivosPage";
import AccionesPage from "../features/planeamiento/pages/AccionesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Todo lo protegido VA dentro del layout */}
        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Home />} />

          <Route path="/catalogos/dimensiones" element={<DimensionesPage />} />
          <Route path="/catalogos/fuentes-datos" element={<FuenteDatosPage />} />
          <Route path="/catalogos/instrumentos" element={<InstrumentosPage />} />
          <Route path="/catalogos/tipos-indicador" element={<TipoIndicadorPage />} />
          <Route path="/catalogos/unidades-medida" element={<UnidadesMedidaPage />} />
          <Route path="/catalogos/unidades-org" element={<UnidadesOrgPage />} />

          {/* Planeamiento */}
          <Route path="/planeamiento" element={<Navigate to="/planeamiento/indicadores" replace />} />
          <Route path="/planeamiento/indicadores" element={<IndicadoresPage />} />
          <Route path="/planeamiento/indicadores-instrumentos" element={<IndicadoresInstrumentosPage />} />
          <Route path="/planeamiento/indicadores-metas" element={<IndicadoresMetasPage />} />
          <Route path="/planeamiento/ejes" element={<EjesEstrategicosPage />} />
          <Route path="/planeamiento/politicas" element={<PoliticasPage />} />
          <Route path="/planeamiento/objetivos" element={<ObjetivosPage />} />
          <Route path="/planeamiento/acciones" element={<AccionesPage />} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}