import { NavLink } from "react-router-dom";
import { ROUTES } from "../../utils/constants.js";
import logo from "../../assets/imagenes/logo-solca.webp";

const items = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: "▦" },
  { to: ROUTES.patient, label: "Paciente maestro", icon: "ID" },
  { to: ROUTES.clinicalHistory, label: "Historia clínica", icon: "HC" },
  { to: ROUTES.consultation, label: "Nueva consulta", icon: "+" },
  { to: ROUTES.laboratory, label: "Laboratorio", icon: "LB" },
  { to: ROUTES.imaging, label: "Imagenología", icon: "RX" },
  { to: ROUTES.repository, label: "Repositorio clinico", icon: "RC" },
];

export default function Sidebar() {
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
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
