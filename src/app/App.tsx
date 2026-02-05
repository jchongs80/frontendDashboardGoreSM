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
import PdrcOeAePage from "../features/planeamiento/pages/PdrcOeAePage";

// Alineamiento (Módulo 4)
import AlineamientosInstrumentosPage from "../features/alineamiento/pages/AlineamientosInstrumentosPage";
import AcuerdosGobernabilidadPoliticasPage from "../features/planeamiento/pages/AcuerdosGobernabilidadPoliticasPage";

import AcuerdosGobernabilidadPoliticasResponsablesResultadosPage from "../features/planeamiento/pages/AcuerdosGobernabilidadPoliticasResponsablesResultadosPage";

import PdrcObjetivosResponsablesPage from "../features/planeamiento/pages/PdrcObjetivosResponsablesPage";
import PdrcObjetivosAccionesIndicadoresPage from "../features/planeamiento/pages/PdrcObjetivosAccionesIndicadoresPage";
import PeiObjetivosResponsablesPage from "../features/planeamiento/pages/PeiObjetivosResponsablesPage";
import PeiObjetivosAccionesIndicadoresPage from "../features/planeamiento/pages/PeiObjetivosAccionesIndicadoresPage";

import UsuariosPage from "../features/administracion/pages/UsuariosPage";
import UnidadesOrganizacionalesCentrosCostoPage from "../features/planeamiento/pages/UnidadesOrganizacionalesCentrosCostoPage";
import UnidadesOrgPage2 from "../features/planeamiento/pages/UnidadesOrgPage2";


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
          <Route path="/planeamiento/centros-costo" element={<UnidadesOrganizacionalesCentrosCostoPage />} />
          <Route path="/planeamiento/poi" element={<UnidadesOrgPage2 />} />
          <Route path="/planeamiento/pdrc-oe-ae/:idUnidad" element={<PdrcOeAePage />} />


          {/* Alineamiento */}
          <Route path="/alineamiento" element={<Navigate to="/alineamiento/instrumentos" replace />} />
          <Route path="/alineamiento/instrumentos" element={<AlineamientosInstrumentosPage />} />
          {/*<Route path="/ag/politica" element={<AcuerdosGobernabilidadPoliticasPage />} />*/}
          <Route path="/:codigoInstrumento/politica" element={<AcuerdosGobernabilidadPoliticasPage />} />
          <Route
            path="/acuerdos-gobernabilidad/instrumento/:idInstrumento/politica/:idPolitica/responsable/:idUnidad/resultados"
            element={<AcuerdosGobernabilidadPoliticasResponsablesResultadosPage />}
          />
          <Route
            path="/prcp/instrumento/:idInstrumento/politica/:idPolitica/responsable/:idUnidad/resultados"
            element={<AcuerdosGobernabilidadPoliticasResponsablesResultadosPage />}
          />
          <Route path="/pdrc/oer" element={<PdrcObjetivosResponsablesPage />} />
          <Route path="/pdrc/oer" element={<PeiObjetivosResponsablesPage />} />
          <Route path="/:codigoInstrumento/oer" element={<PdrcObjetivosResponsablesPage />} />
          <Route path="/:codigoInstrumento/oer" element={<PeiObjetivosResponsablesPage />} />
          <Route
            path="/pdrc/instrumento/:idInstrumento/objetivo/:idObjetivo/unidad/:idUnidad/acciones-indicadores"
            element={<PdrcObjetivosAccionesIndicadoresPage />}
          />
          <Route path="/pei/oei" element={<PeiObjetivosResponsablesPage />} />
          <Route
            path="/pei/instrumento/:idInstrumento/objetivo/:idObjetivo/unidad/:idUnidad/acciones-indicadores"
            element={<PeiObjetivosAccionesIndicadoresPage />}
          />
          <Route path="/admin/usuarios" element={<UsuariosPage />} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}