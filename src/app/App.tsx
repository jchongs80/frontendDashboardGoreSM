import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import RequireAuth from "../features/auth/RequireAuth";
import { PerfilId } from "../features/auth/profileRules";
import DashboardLayout from "../layouts/DashboardLayout";

import DimensionesPage from "../features/catalogos/pages/DimensionesPage";
import FuenteDatosPage from "../features/catalogos/pages/FuenteDatosPage";
import InstrumentosPage from "../features/catalogos/pages/InstrumentosPage";
import PeriodosPage from "../features/catalogos/pages/PeriodosPage";
import CentroCostosResponsablePoiPage from "../features/catalogos/pages/CentroCostosResponsablePoiPage";
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
import PdrcOerAerPage from "../features/planeamiento/pages/PdrcOerAerPage";

import AlineamientosInstrumentosPage from "../features/alineamiento/pages/AlineamientosInstrumentosPage";
import AcuerdosGobernabilidadPoliticasPage from "../features/planeamiento/pages/AcuerdosGobernabilidadPoliticasPage";
import AcuerdosGobernabilidadPoliticasResponsablesResultadosPage from "../features/planeamiento/pages/AcuerdosGobernabilidadPoliticasResponsablesResultadosPage";

import PdrcObjetivosResponsablesPage from "../features/planeamiento/pages/PdrcObjetivosResponsablesPage";
import PdrcObjetivosAccionesIndicadoresPage from "../features/planeamiento/pages/PdrcObjetivosAccionesIndicadoresPage";
import PeiObjetivosResponsablesPage from "../features/planeamiento/pages/PeiObjetivosResponsablesPage";
import PeiObjetivosAccionesIndicadoresPage from "../features/planeamiento/pages/PeiObjetivosAccionesIndicadoresPage";
import PeiOeiAeiPage from "../features/planeamiento/pages/PeiOeiAeiPage";

import UsuariosPage from "../features/administracion/pages/UsuariosPage";
import UnidadesOrganizacionalesCentrosCostoPage from "../features/planeamiento/pages/UnidadesOrganizacionalesCentrosCostoPage";
import UnidadesOrgPage2 from "../features/planeamiento/pages/UnidadesOrgPage2";
import CargaMasivaPage from "../features/planeamiento/pages/CargaMasivaPage";

import AgPoRecoInprPage from "../features/planeamiento/pages/AgPoRecoInprPage";
import PrcpOpPiMpPage from "../features/planeamiento/pages/PrcpOpPiMpPage";
import PsjPaisajesPage from "../features/planeamiento/pages/PsjPaisajesPage";

import DashboardHomePage from "../features/dashboard/pages/DashboardHomePage";
import DashboardComparativoPage from "../features/dashboard/pages/DashboardComparativoPage";
import DashboardPeiPage from "../features/dashboard/pages/DashboardPeiPage";
import DashboardPeiReportePage from "../features/dashboard/pages/DashboardPeiReportePage";
import DashboardPoiPage from "../features/dashboard/pages/DashboardPoiPage";
import DashboardPoiReportePage from "../features/dashboard/pages/DashboardPoiReportePage";
import DashboardPdrcPage from "../features/dashboard/pages/DashboardPdrcPage";
import DashboardPrcpPage from "../features/dashboard/pages/DashboardPrcpPage";
import DashboardPrcpReportePage from "../features/dashboard/pages/DashboardPrcpReportePage";
import DashboardAgPage from "../features/dashboard/pages/DashboardAgPage";
import DashboardAgReportePage from "../features/dashboard/pages/DashboardAgReportePage";
import DashboardPaisajePage from "../features/dashboard/pages/DashboardPaisajePage";

const perfilesAdmin = [PerfilId.Administrador];
const perfilesIndicadores = [PerfilId.Administrador, PerfilId.GestorIndicadores];
const perfilesPoi = [PerfilId.Administrador, PerfilId.GestorPoi];
const perfilesIndicadoresYPoi = [
  PerfilId.Administrador,
  PerfilId.GestorIndicadores,
  PerfilId.GestorPoi,
];

function CargaMasivaProtegida() {
  const { tipo } = useParams();
  const tipoNormalizado = (tipo ?? "").toLowerCase();

  if (tipoNormalizado === "poi") {
    return (
      <RequireAuth allowedProfiles={perfilesPoi}>
        <CargaMasivaPage />
      </RequireAuth>
    );
  }

  if (["pdrc", "prcp", "ag", "pei"].includes(tipoNormalizado)) {
    return (
      <RequireAuth allowedProfiles={perfilesIndicadores}>
        <CargaMasivaPage />
      </RequireAuth>
    );
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Inicio público */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Reportes dashboard públicos: sin DashboardLayout para que el PDF/WEB no capture menú/topbar */}
        <Route path="/dashboard/pei/reporte" element={<DashboardPeiReportePage />} />
        <Route path="/dashboard/poi/reporte" element={<DashboardPoiReportePage />} />
        <Route path="/dashboard/prcp/reporte" element={<DashboardPrcpReportePage />} />
        <Route path="/dashboard/ag/reporte" element={<DashboardAgReportePage />} />

        {/* Dashboard público: no requiere login */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHomePage />} />
          <Route path="/dashboard/comparativo" element={<DashboardComparativoPage />} />
          <Route path="/dashboard/pei" element={<DashboardPeiPage />} />
          <Route path="/dashboard/poi" element={<DashboardPoiPage />} />
          <Route path="/dashboard/pdrc" element={<DashboardPdrcPage />} />
          <Route path="/dashboard/prcp" element={<DashboardPrcpPage />} />
          <Route path="/dashboard/ag" element={<DashboardAgPage />} />
          <Route path="/dashboard/paisaje" element={<DashboardPaisajePage />} />
        </Route>

        {/* Módulos protegidos: requieren login */}
        <Route
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          {/* Catálogos para Gestor de Indicadores */}
          <Route element={<RequireAuth allowedProfiles={perfilesIndicadores} />}>
            <Route path="/catalogos/dimensiones" element={<DimensionesPage />} />
            <Route path="/catalogos/fuentes-datos" element={<FuenteDatosPage />} />
            <Route path="/catalogos/instrumentos" element={<InstrumentosPage />} />
            <Route path="/catalogos/periodos" element={<PeriodosPage />} />
            <Route path="/catalogos/tipos-indicador" element={<TipoIndicadorPage />} />
            <Route path="/catalogos/unidades-medida" element={<UnidadesMedidaPage />} />
          </Route>

          {/* Catálogos compartidos entre indicadores y POI */}
          <Route element={<RequireAuth allowedProfiles={perfilesIndicadoresYPoi} />}>
            <Route path="/catalogos/unidades-org" element={<UnidadesOrgPage />} />
          </Route>

          {/* Catálogos propios de POI */}
          <Route element={<RequireAuth allowedProfiles={perfilesPoi} />}>
            <Route path="/catalogos/cc-responsables-poi" element={<CentroCostosResponsablePoiPage />} />
          </Route>

          {/* Planeamiento */}
          <Route path="/planeamiento" element={<Navigate to="/dashboard" replace />} />

          {/* Planeamiento para Gestor de Indicadores */}
          <Route element={<RequireAuth allowedProfiles={perfilesIndicadores} />}>
            <Route path="/planeamiento/indicadores" element={<IndicadoresPage />} />
            <Route path="/planeamiento/indicadores-instrumentos" element={<IndicadoresInstrumentosPage />} />
            <Route path="/planeamiento/indicadores-metas" element={<IndicadoresMetasPage />} />
            <Route path="/planeamiento/ejes" element={<EjesEstrategicosPage />} />
            <Route path="/planeamiento/politicas" element={<PoliticasPage />} />
            <Route path="/planeamiento/objetivos" element={<ObjetivosPage />} />
            <Route path="/planeamiento/acciones" element={<AccionesPage />} />
            <Route path="/planeamiento/pdrc-oer-aer/ue/:idUnidadEjecutora" element={<PdrcOeAePage />} />
            <Route path="/planeamiento/pdrc-oer-aer" element={<PdrcOerAerPage />} />
            <Route path="/planeamiento/pei-oei-aei" element={<PeiOeiAeiPage />} />
            <Route path="/pei/oei-aei" element={<PeiOeiAeiPage />} />

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
            <Route path="/planeamiento/ag-po-reco-inpr" element={<AgPoRecoInprPage />} />
            <Route path="/planeamiento/prcp-op-pi-mp" element={<PrcpOpPiMpPage />} />
            <Route path="/planeamiento/psj-paisajes" element={<PsjPaisajesPage />} />
          </Route>

          {/* Planeamiento POI */}
          <Route element={<RequireAuth allowedProfiles={perfilesPoi} />}>
            <Route path="/planeamiento/centros-costo" element={<UnidadesOrganizacionalesCentrosCostoPage />} />
            <Route path="/planeamiento/poi" element={<UnidadesOrgPage2 />} />
            <Route path="/planeamiento/unidades-ejecutoras" element={<UnidadesEjecutorasPage />} />
            <Route path="/poi/oei-aei-ao/ue/:idUnidadEjecutora" element={<PeiOeiAeiAoPage />} />
          </Route>

          {/* Carga masiva protegida por tipo de instrumento */}
          <Route path="/planeamiento/carga-masiva/:tipo" element={<CargaMasivaProtegida />} />

          {/* Administración */}
          <Route element={<RequireAuth allowedProfiles={perfilesAdmin} />}>
            <Route path="/admin/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
