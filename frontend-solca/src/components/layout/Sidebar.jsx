import { NavLink } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";
import { ROLE_PERMISSIONS, canAccess } from "../../utils/roles.js";
import useAuth from "../../hooks/useAuth.js";
import logo from "../../assets/imagenes/logo-solca.webp";

const items = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: "▦", roles: ROLE_PERMISSIONS.dashboard },
  { to: ROUTES.patient, label: "Pacientes", icon: "ID", roles: ROLE_PERMISSIONS.patient },
  { to: ROUTES.clinicalHistory, label: "Historia clínica", icon: "HC", roles: ROLE_PERMISSIONS.clinicalHistory },
  { to: ROUTES.consultation, label: "Consultas", icon: "+", roles: ROLE_PERMISSIONS.consultation },
  { to: ROUTES.laboratory, label: "Laboratorio", icon: "LB", roles: ROLE_PERMISSIONS.laboratory },
  { to: ROUTES.imaging, label: "Imagenología", icon: "RX", roles: ROLE_PERMISSIONS.imaging },
  { to: ROUTES.repository, label: "Repositorio clínico", icon: "RC", roles: ROLE_PERMISSIONS.repository },
  { to: ROUTES.systemStatus, label: "Estado del sistema", icon: "UP", roles: ROLE_PERMISSIONS.systemStatus },
];

export default function Sidebar() {
  const { user } = useAuth();

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
