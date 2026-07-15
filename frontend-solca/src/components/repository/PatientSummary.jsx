import Card from "../common/Card.jsx";

export default function PatientSummary({ patient }) {
  if (!patient) {
    return <Card title="Información del paciente" subtitle="Sin datos disponibles" />;
  }

  const items = [
    ["Nº paciente repositorio", patient.idPacienteRegional],
    ["Cédula", patient.cedula],
    ["Paciente", `${patient.nombres} ${patient.apellidos}`],
    ["Edad", `${patient.edad ?? ""} años`],
    ["Sexo", patient.sexo],
    ["Tipo de sangre", patient.tipoSangre || patient.sangre],
    ["Seguro", patient.seguro],
    ["Sede", patient.sede],
  ];
  const display = (value) => (value === null || value === undefined || value === "" ? "No disponible" : value);

  return (
    <Card title="Información del paciente" subtitle="Datos maestros consolidados">
      <dl className="summary-list">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{display(value)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
