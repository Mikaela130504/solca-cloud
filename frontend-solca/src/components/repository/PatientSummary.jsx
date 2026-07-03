import Card from "../common/Card.jsx";

export default function PatientSummary({ patient }) {
  if (!patient) {
    return <Card title="Información del paciente" subtitle="Sin datos disponibles" />;
  }

  const items = [
    ["Cédula", patient.cedula],
    ["Paciente", `${patient.nombres} ${patient.apellidos}`],
    ["Edad", `${patient.edad ?? ""} años`],
    ["Sexo", patient.sexo],
    ["Tipo de sangre", patient.tipoSangre || patient.sangre],
    ["Seguro", patient.seguro],
    ["Sede", patient.sede],
  ];

  return (
    <Card title="Información del paciente" subtitle="Datos maestros consolidados">
      <dl className="summary-list">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
