import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/common/Card.jsx";
import Button from "../../components/common/Button.jsx";
import { ROUTES } from "../../utils/constants.js";
import { searchPatients } from "../../services/patientService.js";
import { listConsultations } from "../../services/consultationService.js";
import { listLaboratoryOrders } from "../../services/laboratoryService.js";
import { listAllImagingStudies } from "../../services/imagingService.js";
import "./Dashboard.css";

const quickLinks = [
  { to: ROUTES.patient, title: "Registrar paciente maestro", text: "Alta administrativa con validación de cédula." },
  { to: ROUTES.clinicalHistory, title: "Nueva historia clínica", text: "Ingreso completo de antecedentes y diagnósticos." },
  { to: ROUTES.consultation, title: "Nueva consulta", text: "Evolución, signos vitales y plan terapéutico." },
  { to: ROUTES.repository, title: "Consultar repositorio", text: "Vista longitudinal por paciente y evento clínico." },
];

const criticalTerms = ["urgente", "emergencia", "crítico", "critico", "metástasis", "metastasis", "cáncer", "cancer", "dolor intenso"];

const emptyMetrics = {
  patients: [],
  consultations: [],
  laboratories: [],
  imaging: [],
  unavailable: [],
};

function safeData(result, serviceName) {
  if (result.status === "fulfilled" && Array.isArray(result.value)) return { data: result.value, error: "" };
  return { data: [], error: serviceName };
}

function hasCriticalSignal(record) {
  const text = [
    record?.diagnostico,
    record?.motivo,
    record?.evolucion,
    record?.observaciones,
    record?.resultado,
  ].filter(Boolean).join(" ").toLowerCase();
  return criticalTerms.some((term) => text.includes(term));
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return String(value).slice(0, 10);
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      searchPatients(""),
      listConsultations(),
      listLaboratoryOrders(),
      listAllImagingStudies(),
    ]).then(([patientsResult, consultationsResult, laboratoriesResult, imagingResult]) => {
      const patients = safeData(patientsResult, "Paciente Maestro");
      const consultations = safeData(consultationsResult, "Consulta Clínica");
      const laboratories = safeData(laboratoriesResult, "Laboratorio Clínico");
      const imaging = safeData(imagingResult, "Imagenología");

      setMetrics({
        patients: patients.data,
        consultations: consultations.data,
        laboratories: laboratories.data,
        imaging: imaging.data,
        unavailable: [patients.error, consultations.error, laboratories.error, imaging.error].filter(Boolean),
      });
    }).finally(() => setLoading(false));
  }, []);

  const patientsByBranch = metrics.patients.reduce((branches, patient) => {
    const branch = patient.sede || "Sin sede";
    return { ...branches, [branch]: (branches[branch] || 0) + 1 };
  }, {});
  const localHistoryCoverage = metrics.patients.filter((patient) => Array.isArray(patient.historiasLocales) && patient.historiasLocales.length > 0).length;
  const clinicalEvents = [...metrics.consultations, ...metrics.laboratories, ...metrics.imaging];
  const criticalAlerts = clinicalEvents.filter(hasCriticalSignal);
  const recentActivity = clinicalEvents
    .map((record) => ({
      id: `${record.tipoConsulta || record.tipoExamen || record.tipoEstudio || "Evento"}-${record.id}`,
      title: record.tipoConsulta || record.tipoExamen || record.tipoEstudio || "Registro clínico",
      patient: record.idPacienteRegional || record.cedula || "Paciente no identificado",
      date: record.fecha,
      detail: record.diagnostico || record.resultado || record.motivo || "Sin detalle clínico",
    }))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 6);

  const stats = [
    { label: "Pacientes registrados", value: metrics.patients.length, tone: "blue", detail: `${localHistoryCoverage} con historia local` },
    { label: "Historias y consultas", value: metrics.consultations.length, tone: "green", detail: "Registros asistenciales" },
    { label: "Laboratorios", value: metrics.laboratories.length, tone: "amber", detail: "Resultados integrados" },
    { label: "Imagenología", value: metrics.imaging.length, tone: "violet", detail: "Estudios diagnósticos" },
    { label: "Alertas clínicas", value: criticalAlerts.length, tone: criticalAlerts.length ? "red" : "slate", detail: criticalAlerts.length ? "Revisar prioridad" : "Sin señales críticas" },
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
            <strong>{loading ? "..." : stat.value}</strong>
            <small>{stat.detail}</small>
          </Card>
        ))}
      </section>

      {metrics.unavailable.length ? (
        <section className="dashboard-alert">
          <strong>Servicios no disponibles:</strong>
          <span>{metrics.unavailable.join(", ")}</span>
        </section>
      ) : null}

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

        <Card title="Pacientes por sede" subtitle="Distribución operativa de la red SOLCA">
          <div className="branch-list">
            {Object.entries(patientsByBranch).length ? Object.entries(patientsByBranch).map(([branch, count]) => (
              <div className="branch-row" key={branch}>
                <span>{branch}</span>
                <strong>{count}</strong>
              </div>
            )) : <p className="empty-state">No hay pacientes registrados.</p>}
          </div>
        </Card>
      </section>

      <section className="grid grid-2 dashboard-section">
        <Card title="Alertas clínicas" subtitle="Registros con señales de prioridad">
          <div className="alert-list">
            {criticalAlerts.slice(0, 5).map((record) => (
              <Link className="alert-item" key={`${record.idPacienteRegional}-${record.id}-${record.fecha}`} to={ROUTES.repository}>
                <strong>{record.idPacienteRegional || record.cedula}</strong>
                <span>{record.diagnostico || record.resultado || record.observaciones}</span>
              </Link>
            ))}
            {!criticalAlerts.length ? <p className="empty-state">No se detectan alertas clínicas en los registros actuales.</p> : null}
          </div>
        </Card>

        <Card title="Actividad clínica reciente" subtitle="Eventos principales del repositorio">
          <ol className="activity-list">
            {recentActivity.length ? recentActivity.map((activity) => (
              <li key={activity.id}>
                <strong>{activity.title}</strong>
                <span>{activity.patient} · {formatDate(activity.date)}</span>
                <small>{activity.detail}</small>
              </li>
            )) : <li>No hay actividad clínica registrada.</li>}
          </ol>
        </Card>
      </section>
    </>
  );
}
