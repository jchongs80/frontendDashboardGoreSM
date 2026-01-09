import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import Topbar from "../components/header/Topbar";
import Footer from "../components/footer/Footer";

const SIDEBAR_WIDTH_EXPANDED = 270;
const SIDEBAR_WIDTH_COLLAPSED = 84;

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  const toggleMobile = () => setMobileOpen((p) => !p);
  const toggleCollapsed = () => setCollapsed((p) => !p);

  return (
    <Box sx={{ height: "100vh", display: "flex", overflow: "hidden", bgcolor: "background.default" }}>
      <Sidebar
        widthExpanded={SIDEBAR_WIDTH_EXPANDED}
        widthCollapsed={SIDEBAR_WIDTH_COLLAPSED}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          ml: { xs: 0, md: `${sidebarWidth}px` },
          transition: "margin-left .18s ease-in-out",
          overflow: "hidden",
        }}
      >
        <Topbar
          onToggleMobileSidebar={toggleMobile}
          onToggleCollapsedSidebar={toggleCollapsed}
          sidebarCollapsed={collapsed}
        />

        {/* ✅ Shell que ocupa el resto de pantalla */}
        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* ✅ SOLO el contenido scrollea */}
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", px: { xs: 2, md: 3 }, py: 2.5 }}>
            <Outlet />
          </Box>

          {/* ✅ Footer fijo abajo (sin entrar al scroll) */}
          <Box sx={{ flexShrink: 0 }}>
            <Footer />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}