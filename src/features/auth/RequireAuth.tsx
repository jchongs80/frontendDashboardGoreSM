import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {
  puedeAcceder,
  type PerfilId,
  type PerfilPermission,
} from "./profileRules";

type Props = {
  children?: React.ReactNode;
  allowedProfiles?: PerfilId[];
  allowedPermissions?: PerfilPermission[];
  requireAllPermissions?: boolean;
};

export default function RequireAuth({
  children,
  allowedProfiles = [],
  allowedPermissions = [],
  requireAllPermissions = false,
}: Props) {
  const { isReady, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isReady) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const autorizado = puedeAcceder(user, {
    perfilesPermitidos: allowedProfiles,
    permisosPermitidos: allowedPermissions,
    requiereTodosLosPermisos: requireAllPermissions,
  });

  if (!autorizado) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
