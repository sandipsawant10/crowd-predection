import React, { useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  VideoCall as CameraIcon,
  Warning as AlertIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

const drawerWidth = 280;

/**
 * Modern dashboard layout with responsive sidebar navigation
 * Features:
 * - Collapsible sidebar for mobile responsiveness
 * - Professional header with branding and user info
 * - Clean navigation with icons and labels
 * - Consistent spacing and Material Design patterns
 */
const DashboardLayout = ({
  children,
  userProfile,
  onLogout,
  isAuthenticated,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Dashboard Overview");

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigationClick = (item) => {
    setActiveSection(item.label);

    // For now, we'll show a toast/alert for non-dashboard items
    // In a real app, these would navigate to different pages or sections
    if (item.label !== "Dashboard Overview") {
      // Create a temporary notification
      const notification = document.createElement("div");
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${theme.palette.primary.main};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
      `;
      notification.textContent = `${item.label} - Coming Soon!`;
      document.body.appendChild(notification);

      // Remove notification after 3 seconds
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }

    // Close mobile drawer after navigation
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Navigation items for the sidebar
  const navigationItems = [
    {
      label: "Dashboard Overview",
      icon: <DashboardIcon />,
      id: "dashboard",
    },
    {
      label: "Crowd Analytics",
      icon: <GroupIcon />,
      id: "analytics",
    },
    {
      label: "Camera Management",
      icon: <CameraIcon />,
      id: "cameras",
    },
    {
      label: "Alert Center",
      icon: <AlertIcon />,
      id: "alerts",
    },
    {
      label: "System Settings",
      icon: <SettingsIcon />,
      id: "settings",
    },
  ];

  const drawer = (
    <Box>
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "white",
            fontWeight: 600,
            textAlign: "center",
            mb: 1,
          }}
        >
          Smart Crowd
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
          }}
        >
          Management System
        </Typography>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ p: 2 }}>
        {navigationItems.map((item, index) => {
          const isActive = activeSection === item.label;
          return (
            <Tooltip
              key={index}
              title={
                item.label === "Dashboard Overview"
                  ? "Current view"
                  : "Coming soon - Click to preview"
              }
              placement="right"
            >
              <Box
                onClick={() => handleNavigationClick(item)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  p: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                  backgroundColor: isActive
                    ? theme.palette.primary.main
                    : "transparent",
                  color: isActive ? "white" : theme.palette.text.primary,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: isActive
                      ? theme.palette.primary.dark
                      : theme.palette.action.hover,
                    transform: "translateX(4px)",
                  },
                  "&:active": {
                    transform: "translateX(2px)",
                  },
                }}
              >
                <Box sx={{ mr: 2, display: "flex" }}>{item.icon}</Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {item.label}
                </Typography>
                {/* Add a subtle indicator for active item */}
                {isActive && (
                  <Box
                    sx={{
                      ml: "auto",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "white",
                    }}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* User Profile Section */}
      {isAuthenticated && userProfile && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              p: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.grey[50],
            }}
          >
            <Avatar
              sx={{
                mr: 2,
                bgcolor: theme.palette.primary.main,
                width: 32,
                height: 32,
              }}
            >
              {userProfile.name
                ? userProfile.name.charAt(0).toUpperCase()
                : "U"}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userProfile.name || "User"}
              </Typography>
              <Chip
                label={userProfile.role || "User"}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ mt: 0.5, fontSize: "0.7rem", height: 20 }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={onLogout}
              sx={{ color: theme.palette.text.secondary }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: "white",
          color: theme.palette.text.primary,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {activeSection}
          </Typography>
          {/* Status indicator */}
          <Chip
            label="Live"
            color="success"
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          />
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Toolbar /> {/* Spacer for fixed app bar */}
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
