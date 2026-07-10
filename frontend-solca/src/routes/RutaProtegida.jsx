import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { ROUTES } from "../utils/constants.js";
import { canAccess } from "../utils/roles.js";

export default function RutaProtegida({ roles = [] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (!canAccess(user, roles)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
