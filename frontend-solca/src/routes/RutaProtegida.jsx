import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { ROUTES } from "../utils/constants.js";
import { canAccess } from "../utils/roles.js";

function AccessDenied({ user }) {
  return (
    <section className="access-denied">
      <strong>Fuera de su rango de acceso</strong>
      <h1>Solo visualización permitida</h1>
      <p>
        El rol {user?.role || "actual"} no tiene permiso para modificar o abrir este módulo.
        Use las opciones habilitadas del menú o consulte la información consolidada desde el repositorio clínico.
      </p>
    </section>
  );
}

export default function RutaProtegida({ roles = [] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (!canAccess(user, roles)) {
    return <AccessDenied user={user} />;
  }

  return <Outlet />;
}
