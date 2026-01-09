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
} from "@mui/material";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";

type Props = {
  onToggleMobileSidebar: () => void;
  onToggleCollapsedSidebar: () => void;
  sidebarCollapsed: boolean;
};

export default function Topbar({
  onToggleMobileSidebar,
  onToggleCollapsedSidebar,
  sidebarCollapsed,
}: Props) {
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
      {/* ✅ padding horizontal más “premium” */}
      <Toolbar sx={{ gap: 1.5, px: { xs: 2, md: 3 }, minHeight: 58 }}>
        {/* Mobile menu */}
        <IconButton
          edge="start"
          onClick={onToggleMobileSidebar}
          sx={{ display: { md: "none" } }}
        >
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
            <SearchRoundedIcon sx={{ color: "text.secondary", fontSize: 20  }} />
            <InputBase placeholder="Search for results..." sx={{ flex: 1, fontSize: 13 }} />
          </Box>
        </Box>

        {/* Right icons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton>
            <DarkModeOutlinedIcon />
          </IconButton>

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

          <IconButton>
            <SettingsOutlinedIcon />
          </IconButton>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }}>J</Avatar>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Typography sx={{ fontWeight: 750, fontSize: 13, lineHeight: 1.1 }}>
                Jason Taylor
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                Web Designer
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}