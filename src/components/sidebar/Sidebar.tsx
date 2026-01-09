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
import { useLocation, useNavigate } from "react-router-dom";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import WidgetsRoundedIcon from "@mui/icons-material/WidgetsRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";

import type { ReactNode } from "react";

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

  const width = collapsed ? widthCollapsed : widthExpanded;

  const mainItems: SidebarItem[] = [
    { text: "Dashboards", icon: <DashboardRoundedIcon />, path: "/" },
    { text: "Pages", icon: <DescriptionRoundedIcon />, path: "/pages" },
    { text: "Task", icon: <TaskAltRoundedIcon />, path: "/task" },
    { text: "Authentication", icon: <LockRoundedIcon />, path: "/login" },
    { text: "Error", icon: <ErrorOutlineRoundedIcon />, path: "/error" },
    { text: "UI Elements", icon: <GridViewRoundedIcon />, path: "/ui" },
    { text: "Widgets", icon: <WidgetsRoundedIcon />, path: "/widgets" },
    { text: "Tables", icon: <TableChartRoundedIcon />, path: "/tables" },
  ];

  const catalogItems: SidebarItem[] = [
    { text: "Dimensiones", icon: <GridViewRoundedIcon />, path: "/catalogos/dimensiones" },
    { text: "Fuentes de Datos", icon: <DescriptionRoundedIcon />, path: "/catalogos/fuentes-datos" },
    { text: "Instrumentos", icon: <DashboardRoundedIcon />, path: "/catalogos/instrumentos" },
    { text: "Tipos de Indicador", icon: <TaskAltRoundedIcon />, path: "/catalogos/tipos-indicador" },
    { text: "Unidades de Medida", icon: <TableChartRoundedIcon />, path: "/catalogos/unidades-medida" },
    { text: "Unidades Org.", icon: <WidgetsRoundedIcon />, path: "/catalogos/unidades-org" },
  ];

  const planeamientoItems: SidebarItem[] = [
    { text: "Indicadores", icon: <InsightsRoundedIcon />, path: "/planeamiento/indicadores" },
    { text: "Indicadores Instrumentos", icon: <ChecklistRoundedIcon />, path: "/planeamiento/indicadores-instrumentos" },
    { text: "Indicadores Metas", icon: <ChecklistRoundedIcon />, path: "/planeamiento/indicadores-metas" },
    { text: "Ejes Estratégicos", icon: <TrackChangesRoundedIcon />, path: "/planeamiento/ejes" },
    { text: "Políticas", icon: <FlagRoundedIcon />, path: "/planeamiento/politicas" },
    { text: "Objetivos", icon: <GpsFixedRoundedIcon />, path: "/planeamiento/objetivos" },
    { text: "Acciones", icon: <AccountTreeRoundedIcon />, path: "/planeamiento/acciones" },
  ];

  const isCatalogActive = useMemo(
    () => location.pathname.startsWith("/catalogos"),
    [location.pathname]
  );

  const [openCatalogs, setOpenCatalogs] = useState<boolean>(isCatalogActive);

  
  const isPlaneamientoActive = useMemo(
    () => location.pathname.startsWith("/planeamiento"),
    [location.pathname]
  );

  const [openPlaneamiento, setOpenPlaneamiento] = useState<boolean>(isPlaneamientoActive);
// si navegas a una ruta /catalogos/... abre el menú automáticamente
  //if (isCatalogActive && !openCatalogs) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    //setTimeout(() => setOpenCatalogs(true), 0);
  //}

  const go = (path: string) => {
    navigate(path);
    if (!isMdUp) onCloseMobile();
  };

  const NavButton = ({
    text,
    icon,
    path,
    nested = false,
  }: SidebarItem & { nested?: boolean }) => {
    const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

    const button = (
      <ListItemButton
        onClick={() => go(path)}
        sx={{
          mb: nested ? 0.6 : 0.8,
          borderRadius: 2,
          color: "rgba(255,255,255,0.92)",
          justifyContent: collapsed ? "center" : "flex-start",
          backgroundColor: active ? "rgba(255,255,255,0.18)" : "transparent",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.20)" },
          px: collapsed ? 1.2 : nested ? 2.2 : 1.6,
          py: nested ? 0.9 : 1.05,
          width: "100%",
          minHeight: nested ? 40 : 44,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : 36,
            color: "inherit",
            opacity: 0.95,
            justifyContent: "center",
          }}
        >
          {icon}
        </ListItemIcon>

        {!collapsed && (
          <ListItemText
            primary={text}
            primaryTypographyProps={{
              fontSize: nested ? 13 : 13.5,
              fontWeight: nested ? 650 : 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
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

  const content = (
    <Box
      sx={{
        height: "100%",
        color: "rgba(255,255,255,0.92)",
        background: "linear-gradient(180deg, #0EA5A4 0%, #0D9488 45%, #0B7F7C 100%)",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Brand */}
      <Box sx={{ px: collapsed ? 1.5 : 2.2, py: 2 }}>
        <Typography
          sx={{
            fontWeight: 900,
            letterSpacing: 0.6,
            fontSize: 20,
            textAlign: collapsed ? "center" : "left",
          }}
        >
          {collapsed ? "v" : "ynex"}
        </Typography>
        {!collapsed && (
          <Typography sx={{ opacity: 0.85, fontSize: 12 }}>CRM Dashboard</Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

      {!collapsed && (
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography sx={{ opacity: 0.7, fontSize: 11, fontWeight: 800 }}>
            MAIN
          </Typography>
        </Box>
      )}

      {/* NAV */}
      <Box sx={{
            px: collapsed ? 1 : 1.2,
            pt: 1,
            pb: 1.2,
            overflowY: "auto",
            flex: 1,

            /* 🔽 Scrollbar fino y sutil */
            scrollbarWidth: "thin", // Firefox
            scrollbarColor: "rgba(255,255,255,0.22) transparent", // Firefox

            "&::-webkit-scrollbar": { width: 6 }, // Chrome/Edge
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: 999,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "rgba(255,255,255,0.28)",
            },
          }}>
        <List disablePadding>
          {/* Items principales arriba */}
          <NavButton text="Dashboards" icon={<DashboardRoundedIcon />} path="/" />
          <NavButton text="Pages" icon={<DescriptionRoundedIcon />} path="/pages" />
          <NavButton text="Task" icon={<TaskAltRoundedIcon />} path="/task" />

          {/* Catálogos (padre) */}
          <Box sx={{ mt: 0.8 }}>
            <ListItemButton
              onClick={() => setOpenCatalogs((p) => !p)}
              sx={{
                mb: 0.6,
                borderRadius: 2,
                color: "rgba(255,255,255,0.92)",
                justifyContent: collapsed ? "center" : "flex-start",
                backgroundColor: isCatalogActive ? "rgba(255,255,255,0.18)" : "transparent",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.20)" },
                px: collapsed ? 1.2 : 1.6,
                py: 1.05,
                minHeight: 44,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? "auto" : 36,
                  color: "inherit",
                  opacity: 0.95,
                  justifyContent: "center",
                }}
              >
                <FolderRoundedIcon />
              </ListItemIcon>

              {!collapsed && (
                <>
                  <ListItemText
                    primary="Catálogos"
                    primaryTypographyProps={{ fontSize: 13.5, fontWeight: 800 }}
                  />
                  {openCatalogs ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                </>
              )}
            </ListItemButton>

            {/* Submenu */}
            {!collapsed && (
              <Collapse in={openCatalogs} timeout={180} unmountOnExit>
                <Box
                  sx={{
                    ml: 1.8,
                    pl: 1.2,
                    borderLeft: "1px solid rgba(255,255,255,0.22)",
                  }}
                >
                  <List disablePadding sx={{ mt: 0.6 }}>
                    {catalogItems.map((it) => (
                      <NavButton key={it.text} {...it} nested />
                    ))}
                  </List>
                </Box>
              </Collapse>
            )}
          </Box>

          
          {/* Planeamiento (padre) */}
          <Box sx={{ mt: 0.8 }}>
            {collapsed ? (
              <Tooltip title="Planeamiento" placement="right">
                <Box>
                  <ListItemButton
                    onClick={() => go("/planeamiento/indicadores")}
                    sx={{
                      mb: 0.6,
                      borderRadius: 2,
                      color: "rgba(255,255,255,0.92)",
                      justifyContent: "center",
                      backgroundColor: isPlaneamientoActive ? "rgba(255,255,255,0.18)" : "transparent",
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.20)" },
                      px: 1.2,
                      py: 1.05,
                      minHeight: 44,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: "auto",
                        color: "inherit",
                        opacity: 0.95,
                        justifyContent: "center",
                      }}
                    >
                      <AccountTreeRoundedIcon />
                    </ListItemIcon>
                  </ListItemButton>
                </Box>
              </Tooltip>
            ) : (
              <>
                <ListItemButton
                  onClick={() => setOpenPlaneamiento((p) => !p)}
                  sx={{
                    mb: 0.6,
                    borderRadius: 2,
                    color: "rgba(255,255,255,0.92)",
                    justifyContent: "flex-start",
                    backgroundColor: isPlaneamientoActive ? "rgba(255,255,255,0.18)" : "transparent",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.20)" },
                    px: 1.6,
                    py: 1.05,
                    minHeight: 44,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: "inherit",
                      opacity: 0.95,
                      justifyContent: "center",
                    }}
                  >
                    <AccountTreeRoundedIcon />
                  </ListItemIcon>

                  <ListItemText
                    primary="Planeamiento"
                    primaryTypographyProps={{ fontSize: 13.5, fontWeight: 800 }}
                  />

                  {openPlaneamiento ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                </ListItemButton>

                {/* Submenu */}
                <Collapse in={openPlaneamiento} timeout={180} unmountOnExit>
                  <Box
                    sx={{
                      ml: 1.8,
                      pl: 1.2,
                      borderLeft: "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    <List disablePadding sx={{ mt: 0.6 }}>
                      {planeamientoItems.map((it) => (
                        <NavButton key={it.text} {...it} nested />
                      ))}
                    </List>
                  </Box>
                </Collapse>
              </>
            )}
          </Box>

<Divider sx={{ my: 1.4, borderColor: "rgba(255,255,255,0.12)" }} />

          {/* Resto */}
          {mainItems
            .filter((x) => !["Dashboards", "Pages", "Task"].includes(x.text))
            .map((it) => (
              <NavButton key={it.text} {...it} />
            ))}
        </List>
      </Box>

      {/* Footer mini */}
      <Box sx={{ px: collapsed ? 1 : 2, pb: 2, opacity: 0.85, fontSize: 12 }}>
        <Divider sx={{ mb: 1.5, borderColor: "rgba(255,255,255,0.12)" }} />
        {!collapsed ? (
          <Typography sx={{ fontSize: 12 }}>© {new Date().getFullYear()} Dashboard</Typography>
        ) : (
          <Typography sx={{ fontSize: 12, textAlign: "center" }}>©</Typography>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile */}
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

      {/* Desktop */}
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