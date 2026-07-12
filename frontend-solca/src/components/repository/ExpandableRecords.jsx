import Card from "../common/Card.jsx";

const LABELS = {
  idPacienteRegional: "ID regional",
  cedula: "Cedula",
  fecha: "Fecha",
  sede: "Sede",
  medico: "Medico",
  especialidad: "Especialidad",
  tipoConsulta: "Tipo de consulta",
  diagnostico: "Diagnostico",
  tratamiento: "Tratamiento",
  motivo: "Motivo",
  evolucion: "Evolucion",
  tipoExamen: "Tipo de examen",
  resultado: "Resultado",
  observaciones: "Observaciones",
  tipoEstudio: "Tipo de estudio",
  formato: "Formato",
  url: "URL",
  regionAnatomica: "Region anatomica",
};

function RecordDetails({ item }) {
  return (
    <dl className="record-details">
      {Object.entries(item).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([key, value]) => (
        <div key={key}>
          <dt>{LABELS[key] || key}</dt>
          <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordGroup({ title, rows, summary }) {
  return (
    <Card title={title}>
      <div className="expandable-list">
        {rows.length === 0 && <p className="empty-state">Sin registros.</p>}
        {rows.map((item, index) => (
          <details key={`${title}-${item.id || index}`} className="expandable-record">
            <summary>
              <span>{summary(item)}</span>
              <small>{item.fecha || "Sin fecha"}</small>
            </summary>
            <RecordDetails item={item} />
          </details>
        ))}
      </div>
    </Card>
  );
}

export default function ExpandableRecords({ clinicalHistories = [], consultations, laboratories, imaging }) {
  return (
    <div className="grid grid-4">
      <RecordGroup title="Historias clínicas" rows={clinicalHistories} summary={(item) => item.diagnostico || item.motivo || "Historia clínica"} />
      <RecordGroup title="Consultas" rows={consultations} summary={(item) => item.diagnostico || item.motivo || "Consulta"} />
      <RecordGroup title="Laboratorios" rows={laboratories} summary={(item) => item.tipoExamen || item.resultado || "Laboratorio"} />
      <RecordGroup title="Imagenologia" rows={imaging} summary={(item) => item.tipoEstudio || item.resultado || "Imagenologia"} />
    </div>
  );
}
