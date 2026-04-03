import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  InputBase,
  Toolbar,
  Typography,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from "@mui/material";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import { useState } from "react";
import { useAuth } from "./../../features/auth/AuthContext";

type Props = {
  onToggleMobileSidebar: () => void;
  onToggleCollapsedSidebar: () => void;
  sidebarCollapsed: boolean;
};

function getInitials(fullName?: string | null) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)).toUpperCase();
}

export default function Topbar({
  onToggleMobileSidebar,
  onToggleCollapsedSidebar,
  sidebarCollapsed,
}: Props) {
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const nombre = user?.nombreCompleto ?? "Usuario";
  const perfil = user?.perfil ?? "Sin perfil";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid #E8EEF5",
        backdropFilter: "blur(8px)",
      }}
    >
      <Toolbar
        sx={{
          gap: 1.5,
          px: { xs: 2, md: 3 },
          minHeight: 64,
        }}
      >
        {/* Mobile menu */}
        <Tooltip title="Abrir menú">
          <IconButton
            edge="start"
            onClick={onToggleMobileSidebar}
            sx={{
              display: { md: "none" },
              borderRadius: 2.5,
              "&:hover": { bgcolor: "rgba(15, 23, 42, 0.05)" },
            }}
          >
            <MenuRoundedIcon />
          </IconButton>
        </Tooltip>

        {/* Desktop collapse toggle */}
        <Tooltip title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}>
          <IconButton
            onClick={onToggleCollapsedSidebar}
            sx={{
              display: { xs: "none", md: "inline-flex" },
              borderRadius: 2.5,
              "&:hover": { bgcolor: "rgba(15, 23, 42, 0.05)" },
            }}
          >
            {sidebarCollapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
          </IconButton>
        </Tooltip>

        {/* Search */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              height: 42,
              border: "1px solid #E2E8F0",
              borderRadius: 999,
              width: { xs: "100%", sm: 340, md: 430 },
              bgcolor: "#F8FAFC",
              boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.04)",
              transition: "all .18s ease",
              "&:hover": {
                borderColor: "#CBD5E1",
                bgcolor: "#FFFFFF",
              },
            }}
          >
            <SearchRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <InputBase
              placeholder="Buscar..."
              sx={{
                flex: 1,
                fontSize: 13.5,
                "& input::placeholder": {
                  color: "#94A3B8",
                  opacity: 1,
                },
              }}
            />
          </Box>
        </Box>

        {/* Right side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Modo oscuro">
            <IconButton
              sx={{
                borderRadius: 2.5,
                color: "text.secondary",
                "&:hover": { bgcolor: "rgba(15, 23, 42, 0.05)" },
              }}
            >
              <DarkModeRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Configuración">
            <IconButton
              sx={{
                borderRadius: 2.5,
                color: "text.secondary",
                "&:hover": { bgcolor: "rgba(15, 23, 42, 0.05)" },
              }}
            >
              <SettingsRoundedIcon />
            </IconButton>
          </Tooltip>

          {/* User pill */}
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pl: 1,
              cursor: "pointer",
              borderRadius: 3,
              px: 1.1,
              py: 0.65,
              ml: 0.4,
              border: "1px solid transparent",
              transition: "all .18s ease",
              "&:hover": {
                bgcolor: "rgba(15, 23, 42, 0.04)",
                borderColor: "#E2E8F0",
              },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: 13,
                fontWeight: 800,
                bgcolor: "rgba(14,165,164,0.14)",
                color: "primary.main",
              }}
            >
              {getInitials(nombre)}
            </Avatar>

            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 13,
                  lineHeight: 1.1,
                  letterSpacing: 0.1,
                }}
              >
                {nombre}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11.5,
                  color: "text.secondary",
                  mt: 0.2,
                }}
              >
                {perfil}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: 3,
                minWidth: 250,
                border: "1px solid #E8EEF5",
                boxShadow: "0 16px 34px rgba(15, 23, 42, 0.10)",
                mt: 1,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.4 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13.5 }}>
                {nombre}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.3 }}>
                {user?.email ?? ""}
              </Typography>
            </Box>

            <Divider />

            <MenuItem
              onClick={async () => {
                setAnchorEl(null);
                await logout();
              }}
              sx={{
                py: 1.2,
                fontSize: 13.5,
              }}
            >
              <ListItemIcon>
                <LogoutRoundedIcon fontSize="small" />
              </ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}