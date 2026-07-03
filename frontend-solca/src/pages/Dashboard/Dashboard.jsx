import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import { ROUTES } from "../../utils/constants.js";
import { searchPatients } from "../../services/patientService.js";
import "./Dashboard.css";

const quickLinks = [
  { to: ROUTES.patient, title: "Registrar paciente maestro", text: "Alta administrativa con validación de cédula." },
  { to: ROUTES.clinicalHistory, title: "Nueva historia clínica", text: "Ingreso completo de antecedentes y diagnósticos." },
  { to: ROUTES.consultation, title: "Nueva consulta", text: "Evolución, signos vitales y plan terapéutico." },
  { to: ROUTES.repository, title: "Consultar repositorio", text: "Vista longitudinal por paciente y evento clínico." },
];

export default function Dashboard() {
  const [totalPacientes, setTotalPacientes] = useState("0");

  useEffect(() => {
    searchPatients("").then((patients) => setTotalPacientes(String(patients.length))).catch(() => setTotalPacientes("No disponible"));
  }, []);

  const stats = [
    { label: "Total pacientes", value: totalPacientes, tone: "blue" },
    { label: "Consultas", value: "API", tone: "green" },
    { label: "Laboratorios", value: "API", tone: "amber" },
    { label: "Imagenología", value: "API", tone: "violet" },
    { label: "Repositorio", value: "API", tone: "slate" },
  ];

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Centro de control clínico</h1>
          <p>Resumen operativo de pacientes, atenciones y registros integrados de la red SOLCA.</p>
        </div>
        <Link to={ROUTES.repository}>
          <Button>Repositorio clínico</Button>
        </Link>
      </div>

      <section className="stats-grid">
        {stats.map((stat) => (
          <Card key={stat.label} className={`stat-card stat-${stat.tone}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>Conectado a servicios REST</small>
          </Card>
        ))}
      </section>

      <section className="grid grid-2 dashboard-section">
        <Card title="Accesos rápidos" subtitle="Flujos frecuentes del personal asistencial">
          <div className="quick-grid">
            {quickLinks.map((link) => (
              <Link className="quick-link" key={link.to} to={link.to}>
                <strong>{link.title}</strong>
                <span>{link.text}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Actividad clínica reciente" subtitle="Eventos principales del repositorio">
          <ol className="activity-list">
            <li>La actividad reciente se carga desde los microservicios disponibles.</li>
          </ol>
        </Card>
      </section>
    </>
  );
}
