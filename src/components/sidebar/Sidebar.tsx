import { useMemo, useState } from "react";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  useMediaQuery,
  Collapse,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate, Link as RouterLink } from "react-router-dom";

import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import WidgetsRoundedIcon from "@mui/icons-material/WidgetsRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";

// ✅ ICONO NUEVO para Unidades Ejecutoras
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import logoFull from "../../assets/logo-goresam-full.png";
import logoIcon from "../../assets/logo-goresam-icon.png";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

import { useAuth } from "./../../features/auth/AuthContext";
import { puedeAcceder, PerfilId } from "./../../features/auth/profileRules";

import type { Dispatch, ReactNode, SetStateAction } from "react";

type Props = {
  widthExpanded: number;
  widthCollapsed: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

type SidebarItem = {
  text: string;
  icon: ReactNode;
  path: string;
};

export default function Sidebar({
  widthExpanded,
  widthCollapsed,
  collapsed,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated } = useAuth();

  const canManageUsers = puedeAcceder(user, {
    perfilesPermitidos: [PerfilId.Administrador],
    permisosPermitidos: ["puedeCrearUsuarios"],
  });

  const canManageIndicadores = puedeAcceder(user, {
    perfilesPermitidos: [PerfilId.Administrador, PerfilId.GestorIndicadores],
    permisosPermitidos: ["puedeModificarIndicadores"],
  });

  const canManagePoi = puedeAcceder(user, {
    perfilesPermitidos: [PerfilId.Administrador, PerfilId.GestorPoi],
    permisosPermitidos: ["puedeGestionarPoi"],
  });

  const width = collapsed ? widthCollapsed : widthExpanded;

  const mainItems: SidebarItem[] = [
    {
      text: isAuthenticated ? "Bloquear pantalla" : "Iniciar sesión",
      icon: <LockRoundedIcon />,
      path: "/login",
    },
  ];

  const dashboardItems: SidebarItem[] = [
    { text: "Home", icon: <SpaceDashboardRoundedIcon />, path: "/dashboard" },
    { text: "P.D.R.C.", icon: <PublicRoundedIcon />, path: "/dashboard/pdrc" },
    { text: "P.R.C.P.", icon: <FactCheckRoundedIcon />, path: "/dashboard/prcp" },
    { text: "A.G.", icon: <AnalyticsRoundedIcon />, path: "/dashboard/ag" },
    { text: "P.E.I.", icon: <TimelineRoundedIcon />, path: "/dashboard/pei" },
    { text: "P.O.I.", icon: <ApartmentRoundedIcon />, path: "/dashboard/poi" },
  ];

  const allCatalogItems: SidebarItem[] = [
    { text: "Dimensiones", icon: <GridViewRoundedIcon />, path: "/catalogos/dimensiones" },
    { text: "Instrumentos", icon: <SpaceDashboardRoundedIcon />, path: "/catalogos/instrumentos" },
    { text: "Periodos", icon: <TableChartRoundedIcon />, path: "/catalogos/periodos" },
    { text: "Resp. CC POI", icon: <ApartmentRoundedIcon />, path: "/catalogos/cc-responsables-poi" },
    { text: "Unidades Org.", icon: <WidgetsRoundedIcon />, path: "/catalogos/unidades-org" },
  ];

  const catalogItems: SidebarItem[] = allCatalogItems.filter((it) => {
    if (!isAuthenticated) return false;
    if (canManageUsers) return true;

    if (canManageIndicadores) {
      return ["Dimensiones", "Instrumentos", "Periodos", "Unidades Org."].includes(it.text);
    }

    if (canManagePoi) {
      return ["Resp. CC POI", "Unidades Org."].includes(it.text);
    }

    return false;
  });

  const allPlaneamientoItems: SidebarItem[] = [
    {
      text: "P.D.R.C.",
      icon: <MapRoundedIcon />,
      path: "/planeamiento/pdrc-oer-aer",
    },
    {
      text: "P.R.C.P.",
      icon: <AssignmentTurnedInRoundedIcon />,
      path: "/planeamiento/prcp-op-pi-mp",
    },
    {
      text: "A.G.",
      icon: <AccountTreeRoundedIcon />,
      path: "/planeamiento/ag-po-reco-inpr",
    },
    {
      text: "P.E.I.",
      icon: <TrackChangesRoundedIcon />,
      path: "/planeamiento/pei-oei-aei",
    },
    {
      text: "P.O.I.",
      icon: <ApartmentRoundedIcon />,
      path: "/planeamiento/unidades-ejecutoras",
    },
  ];

  const planeamientoItems: SidebarItem[] = allPlaneamientoItems.filter((it) => {
    if (!isAuthenticated) return false;
    if (canManageUsers) return true;

    if (canManageIndicadores) {
      return ["P.D.R.C.", "P.R.C.P.", "A.G.", "P.E.I."].includes(it.text);
    }

    if (canManagePoi) {
      return it.text === "P.O.I.";
    }

    return false;
  });

  const allCargaMasivaItems: SidebarItem[] = [
    {
      text: "Carga Masiva PDRC",
      icon: <CloudUploadRoundedIcon />,
      path: "/planeamiento/carga-masiva/pdrc",
    },
    {
      text: "Carga Masiva PRCP",
      icon: <CloudUploadRoundedIcon />,
      path: "/planeamiento/carga-masiva/prcp",
    },
    {
      text: "Carga Masiva AG",
      icon: <CloudUploadRoundedIcon />,
      path: "/planeamiento/carga-masiva/ag",
    },
    {
      text: "Carga Masiva PEI",
      icon: <CloudUploadRoundedIcon />,
      path: "/planeamiento/carga-masiva/pei",
    },
    {
      text: "Carga Masiva POI",
      icon: <CloudUploadRoundedIcon />,
      path: "/planeamiento/carga-masiva/poi",
    },
  ];

  const cargaMasivaItems: SidebarItem[] = allCargaMasivaItems.filter((it) => {
    if (!isAuthenticated) return false;
    if (canManageUsers) return true;

    if (canManageIndicadores) {
      return [
        "Carga Masiva PDRC",
        "Carga Masiva PRCP",
        "Carga Masiva AG",
        "Carga Masiva PEI",
      ].includes(it.text);
    }

    if (canManagePoi) {
      return it.text === "Carga Masiva POI";
    }

    return false;
  });

  const administracionItems: SidebarItem[] = [
    {
      text: "Usuarios",
      icon: <AdminPanelSettingsRoundedIcon />,
      path: "/admin/usuarios",
    },
  ];

  const isDashboardActive = useMemo(
    () => location.pathname.startsWith("/dashboard"),
    [location.pathname]
  );

  const isCatalogActive = useMemo(
    () => location.pathname.startsWith("/catalogos"),
    [location.pathname]
  );

  const isPlaneamientoActive = useMemo(
    () =>
      location.pathname.startsWith("/planeamiento") &&
      !location.pathname.startsWith("/planeamiento/carga-masiva"),
    [location.pathname]
  );

  const isCargaMasivaActive = useMemo(
    () => location.pathname.startsWith("/planeamiento/carga-masiva"),
    [location.pathname]
  );

  const isAdminActive = useMemo(
    () => location.pathname.startsWith("/admin"),
    [location.pathname]
  );

  const [openDashboards, setOpenDashboards] = useState<boolean>(isDashboardActive);
  const [openCatalogs, setOpenCatalogs] = useState<boolean>(isCatalogActive);
  const [openPlaneamiento, setOpenPlaneamiento] = useState<boolean>(isPlaneamientoActive);
  const [openCargaMasiva, setOpenCargaMasiva] = useState<boolean>(isCargaMasivaActive);
  const [openAdmin, setOpenAdmin] = useState<boolean>(isAdminActive);

  const go = (path: string) => {
    navigate(path);
    if (!isMdUp) onCloseMobile();
  };

  const sectionButtonSx = (active: boolean) => ({
    mb: 0.7,
    borderRadius: 2.5,
    color: "rgba(255,255,255,0.95)",
    justifyContent: collapsed ? "center" : "flex-start",
    backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
    border: active ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
    boxShadow: active ? "0 8px 18px rgba(0,0,0,0.10)" : "none",
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.10)",
    },
    px: collapsed ? 1.25 : 1.6,
    py: 1.05,
    minHeight: 46,
    transition: "all .18s ease",
  });

  const renderNavButton = ({
    text,
    icon,
    path,
    nested = false,
  }: SidebarItem & { nested?: boolean }) => {
    const active =
      path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

    const button = (
      <ListItemButton
        onClick={() => go(path)}
        sx={{
          mb: nested ? 0.45 : 0.7,
          borderRadius: nested ? 2.2 : 2.5,
          color: "rgba(255,255,255,0.94)",
          justifyContent: collapsed ? "center" : "flex-start",
          backgroundColor: active ? "rgba(255,255,255,0.14)" : "transparent",
          border: active ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
          boxShadow: active ? "0 8px 16px rgba(0,0,0,0.08)" : "none",
          "&:hover": {
            backgroundColor: active
              ? "rgba(255,255,255,0.16)"
              : "rgba(255,255,255,0.08)",
          },
          px: collapsed ? 1.2 : nested ? 2.5 : 1.75,
          py: nested ? 0.82 : 0.95,
          width: "100%",
          minHeight: nested ? 38 : 42,
          transition: "all .18s ease",
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : nested ? 32 : 36,
            color: "inherit",
            opacity: active ? 1 : 0.92,
            justifyContent: "center",
            "& svg": {
              fontSize: nested ? 19 : 21,
            },
          }}
        >
          {icon}
        </ListItemIcon>

        {!collapsed && (
          <ListItemText
            primary={text}
            primaryTypographyProps={{
              fontSize: nested ? 13 : 13.5,
              fontWeight: active ? 800 : nested ? 600 : 720,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: 0.1,
            }}
          />
        )}
      </ListItemButton>
    );

    return collapsed ? (
      <Tooltip title={text} placement="right">
        <Box>{button}</Box>
      </Tooltip>
    ) : (
      button
    );
  };

  const renderSection = (
    title: string,
    icon: ReactNode,
    items: SidebarItem[],
    open: boolean,
    setOpen: Dispatch<SetStateAction<boolean>>,
    active: boolean
  ) => {
    const effectiveOpen = open || active;

    return (
      <Box sx={{ mt: 0.7 }}>
        <ListItemButton onClick={() => setOpen((p) => !p)} sx={sectionButtonSx(active)}>
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : 36,
            color: "inherit",
            opacity: 0.96,
            justifyContent: "center",
            "& svg": { fontSize: 21 },
          }}
        >
          {icon}
        </ListItemIcon>

        {!collapsed && (
          <>
            <ListItemText
              primary={title}
              primaryTypographyProps={{
                fontSize: 13.6,
                fontWeight: 800,
                letterSpacing: 0.15,
              }}
            />
            {effectiveOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          </>
        )}
      </ListItemButton>

      {!collapsed && (
        <Collapse in={effectiveOpen} timeout={180} unmountOnExit>
          <Box
            sx={{
              ml: 2.1,
              pl: 1.25,
              borderLeft: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <List disablePadding sx={{ mt: 0.5 }}>
              {items.map((it) => renderNavButton({ ...it, nested: true }))}
            </List>
          </Box>
        </Collapse>
      )}
      </Box>
    );
  };

  const content = (
    <Box
      sx={{
        height: "100%",
        color: "rgba(255,255,255,0.94)",
        background: "linear-gradient(180deg, #0F766E 0%, #0B5F5A 52%, #084C48 100%)",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        component={RouterLink}
        to="/dashboard"
        sx={{
          mx: collapsed ? 1.1 : 1.6,
          my: 1.5,
          px: collapsed ? 1 : 1.5,
          py: 1.25,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.38)",
          boxShadow: "0 12px 24px rgba(0,0,0,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
        }}
      >
        <Box
          component="img"
          src={collapsed ? logoIcon : logoFull}
          alt="Gobierno Regional San Martín"
          sx={{
            height: collapsed ? 38 : 46,
            width: "auto",
            maxWidth: "100%",
            objectFit: "contain",
            display: "block",
            transition: "all .2s ease",
            filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.16))",
          }}
        />
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.10)" }} />

      {!collapsed && (
        <Box sx={{ px: 2.1, pt: 1.8, pb: 0.8 }}>
          <Typography
            sx={{
              opacity: 0.72,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.9,
            }}
          >
            PRINCIPAL
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          px: collapsed ? 1 : 1.2,
          pt: 0.8,
          pb: 1.2,
          overflowY: "auto",
          flex: 1,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.22) transparent",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(255,255,255,0.18)",
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "rgba(255,255,255,0.28)",
          },
        }}
      >
        <List disablePadding>
          {renderNavButton({ text: "Dashboards", icon: <SpaceDashboardRoundedIcon />, path: "/" })}

          {renderSection(
            "Dashboard",
            <FolderOpenRoundedIcon />,
            dashboardItems,
            openDashboards,
            setOpenDashboards,
            isDashboardActive
          )}


          {isAuthenticated &&
            catalogItems.length > 0 &&
            renderSection(
              "Catálogos",
              <FolderOpenRoundedIcon />,
              catalogItems,
              openCatalogs,
              setOpenCatalogs,
              isCatalogActive
            )}

          {isAuthenticated &&
            planeamientoItems.length > 0 &&
            renderSection(
              "Planeamiento",
              <AccountTreeRoundedIcon />,
              planeamientoItems,
              openPlaneamiento,
              setOpenPlaneamiento,
              isPlaneamientoActive
            )}

          {isAuthenticated &&
            cargaMasivaItems.length > 0 &&
            renderSection(
              "Carga Masiva",
              <CloudUploadRoundedIcon />,
              cargaMasivaItems,
              openCargaMasiva,
              setOpenCargaMasiva,
              isCargaMasivaActive
            )}

          {isAuthenticated &&
            canManageUsers &&
            renderSection(
              "Administración",
              <AdminPanelSettingsRoundedIcon />,
              administracionItems,
              openAdmin,
              setOpenAdmin,
              isAdminActive
            )}

          <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.10)" }} />

          {mainItems.map((it) => renderNavButton(it))}
        </List>
      </Box>

      <Box sx={{ px: collapsed ? 1 : 2, pb: 2, opacity: 0.86, fontSize: 12 }}>
        <Divider sx={{ mb: 1.4, borderColor: "rgba(255,255,255,0.10)" }} />
        {!collapsed ? (
          <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.82)" }}>
            © {new Date().getFullYear()} Dashboard
          </Typography>
        ) : (
          <Typography sx={{ fontSize: 12, textAlign: "center" }}>©</Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {!isMdUp && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onCloseMobile}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width } }}
        >
          {content}
        </Drawer>
      )}

      {isMdUp && (
        <Drawer
          variant="permanent"
          open
          PaperProps={{
            sx: {
              width,
              borderRight: "none",
              transition: "width .18s ease-in-out",
              overflowX: "hidden",
            },
          }}
        >
          {content}
        </Drawer>
      )}
    </>
  );
}