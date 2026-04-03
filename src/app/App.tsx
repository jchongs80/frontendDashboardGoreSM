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
import UnidadesEjecutorasPage from "../features/planeamiento/pages/UnidadesEjecutorasPage";
import PeiOeiAeiAoPage from "../features/planeamiento/pages/PeiOeiAeiAoPage";

//import PoiOeiAeiAoPage from "../features/planeamiento/pages/PoiOeiAeiAoPage";
//import PoiOeiAeiAoPage from "../features/planeamiento/pages/PoiOeiAeiAoPage"; // ajusta el path real
import PdrcOerAerPage from "../features/planeamiento/pages/PdrcOerAerPage";
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
//import PeiOeiAeiAoPage from "../features/planeamiento/pages/PeiOeiAeiAoPage";
import CargaMasivaPage from "../features/planeamiento/pages/CargaMasivaPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protegido */}
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

          {/* ✅ Ruta confirmada por ti */}
          {/* <Route path="/poi/oei-aei/:idOeiAei/ao" element={<PoiOeiAeiAoPage />} /> */}
          <Route path="/poi/oei-aei-ao/ue/:idUnidadEjecutora" element={<PeiOeiAeiAoPage />} />
          
          {/* PDRC */}
          <Route path="/planeamiento/pdrc-oer-aer/ue/:idUnidadEjecutora" element={<PdrcOeAePage />} />
          <Route path="/planeamiento/unidades-ejecutoras" element={<UnidadesEjecutorasPage />} />
          
          <Route path="/planeamiento/pdrc-oer-aer" element={<PdrcOerAerPage />} />
          
          <Route path="/planeamiento/carga-masiva/:tipo" element={<CargaMasivaPage />} />


          {/*<Route path="/poi/oei-aei-ao/ue/:idUnidadEjecutora" element={<PeiOeiAeiAoPage />} />*/}

          {/* Alineamiento */}
          <Route path="/alineamiento" element={<Navigate to="/alineamiento/instrumentos" replace />} />
          <Route path="/alineamiento/instrumentos" element={<AlineamientosInstrumentosPage />} />
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
          <Route path="/pei/oei" element={<PeiObjetivosResponsablesPage />} />

          <Route
            path="/pdrc/instrumento/:idInstrumento/objetivo/:idObjetivo/unidad/:idUnidad/acciones-indicadores"
            element={<PdrcObjetivosAccionesIndicadoresPage />}
          />
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
