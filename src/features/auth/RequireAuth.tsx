import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isReady) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}