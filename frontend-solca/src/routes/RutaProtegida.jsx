import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth.js";
import { ROUTES } from "../utils/constants.js";
import { canAccess } from "../utils/roles.js";
import { checkMicroservice, MICROSERVICES } from "../services/systemStatusService.js";

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

function ServiceUnavailable({ service }) {
  return (
    <section className="access-denied">
      <strong>Servicio no disponible</strong>
      <h1>{service?.name || "Microservicio"} no responde</h1>
      <p>El módulo se bloqueó automáticamente porque el contenedor o servicio asociado no está disponible.</p>
    </section>
  );
}

export default function RutaProtegida({ roles = [], serviceKey = "" }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [serviceStatus, setServiceStatus] = useState(null);

  useEffect(() => {
    if (!serviceKey) return;
    const service = MICROSERVICES.find((item) => item.key === serviceKey);
    if (!service) return;
    let active = true;
    checkMicroservice(service).then((status) => {
      if (active) setServiceStatus(status);
    });
    return () => {
      active = false;
    };
  }, [serviceKey]);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  if (!canAccess(user, roles)) {
    return <AccessDenied user={user} />;
  }

  if (serviceStatus?.status === "NO DISPONIBLE") {
    return <ServiceUnavailable service={serviceStatus} />;
  }

  return <Outlet />;
}
