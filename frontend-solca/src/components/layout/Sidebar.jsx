import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { ROUTES } from "../../utils/constants.js";
import { ROLE_PERMISSIONS, canAccess } from "../../utils/roles.js";
import useAuth from "../../hooks/useAuth.js";
import { checkAllMicroservices, statusMap } from "../../services/systemStatusService.js";
import logo from "../../assets/imagenes/logo-solca.webp";

const items = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: "▦", roles: ROLE_PERMISSIONS.dashboard },
  { to: ROUTES.patient, label: "Pacientes", icon: "ID", roles: ROLE_PERMISSIONS.patient, serviceKey: "patient" },
  { to: ROUTES.clinicalHistory, label: "Historia clínica", icon: "HC", roles: ROLE_PERMISSIONS.clinicalHistory, serviceKey: "consultation" },
  { to: ROUTES.consultation, label: "Consultas", icon: "+", roles: ROLE_PERMISSIONS.consultation, serviceKey: "consultation" },
  { to: ROUTES.laboratory, label: "Laboratorio", icon: "LB", roles: ROLE_PERMISSIONS.laboratory, serviceKey: "laboratory" },
  { to: ROUTES.imaging, label: "Imagenología", icon: "RX", roles: ROLE_PERMISSIONS.imaging, serviceKey: "imaging" },
  { to: ROUTES.repository, label: "Repositorio clínico", icon: "RC", roles: ROLE_PERMISSIONS.repository, serviceKey: "repository" },
  { to: ROUTES.systemStatus, label: "Estado del sistema", icon: "UP", roles: ROLE_PERMISSIONS.systemStatus },
];

export default function Sidebar() {
  const { user } = useAuth();
  const [services, setServices] = useState({});

  useEffect(() => {
    let active = true;
    const load = () => checkAllMicroservices().then((data) => {
      if (active) setServices(statusMap(data));
    });
    load();
    const timer = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src={logo} alt="Logo SOLCA" />
        <div>
          <strong>SOLCA</strong>
          <span>Repositorio Clinico</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Navegacion principal">
        {items.map((item) => {
          const allowed = canAccess(user, item.roles);
          if (!allowed) return null;
          const serviceDown = item.serviceKey && services[item.serviceKey]?.status === "NO DISPONIBLE";
          if (serviceDown) {
            return (
              <span className="nav-disabled" key={item.to} title={`${services[item.serviceKey].name} no disponible`}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                <small>No disponible</small>
              </span>
            );
          }
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
