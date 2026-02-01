import {
  AppBar,
  Avatar,
  Badge,
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
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import { useState } from "react";
import { useAuth } from "./../../features/auth/AuthContext"; // 🔁 ajusta ruta si corresponde

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
        borderBottom: "1px solid #EEF2F7",
      }}
    >
      <Toolbar sx={{ gap: 1.5, px: { xs: 2, md: 3 }, minHeight: 58 }}>
        {/* Mobile menu */}
        <IconButton edge="start" onClick={onToggleMobileSidebar} sx={{ display: { md: "none" } }}>
          <MenuRoundedIcon />
        </IconButton>

        {/* Desktop collapse toggle */}
        <Tooltip title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}>
          <IconButton
            onClick={onToggleCollapsedSidebar}
            sx={{ display: { xs: "none", md: "inline-flex" } }}
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
              px: 1.2,
              height: 36,
              border: "1px solid #E7ECF3",
              borderRadius: 999,
              width: { xs: "100%", sm: 360, md: 420 },
              bgcolor: "#FAFBFD",
            }}
          >
            <SearchRoundedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <InputBase placeholder="Buscar..." sx={{ flex: 1, fontSize: 13 }} />
          </Box>
        </Box>

        {/* Right icons + User */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton>
            <DarkModeOutlinedIcon />
          </IconButton>

         {/*
          <IconButton>
            <Badge badgeContent={5} color="primary">
              <ShoppingCartOutlinedIcon />
            </Badge>
          </IconButton>

          <IconButton>
            <Badge badgeContent={5} color="primary">
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>

          */}
          
          <IconButton>
            <SettingsOutlinedIcon />
          </IconButton>

          {/* User pill */}
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pl: 1,
              cursor: "pointer",
              borderRadius: 2,
              px: 1,
              py: 0.6,
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            <Avatar sx={{ width: 32, height: 32 }}>{getInitials(nombre)}</Avatar>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography sx={{ fontWeight: 750, fontSize: 13, lineHeight: 1.1 }}>
                {nombre}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                {perfil}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { borderRadius: 2.5, minWidth: 240 } }}
          >
            <Box sx={{ px: 2, py: 1.2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{nombre}</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {user?.email ?? ""}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={async () => {
                setAnchorEl(null);
                await logout();
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