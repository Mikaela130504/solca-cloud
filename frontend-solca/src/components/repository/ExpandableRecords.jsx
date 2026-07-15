import Card from "../common/Card.jsx";

const LABELS = {
  id: "ID",
  idPacienteRegional: "ID regional",
  cedula: "Cédula",
  fecha: "Fecha",
  sede: "Sede",
  medico: "Médico",
  especialidad: "Especialidad",
  tipoConsulta: "Tipo de consulta",
  diagnostico: "Diagnóstico",
  tratamiento: "Tratamiento",
  motivo: "Motivo",
  evolucion: "Evolución",
  tipoExamen: "Tipo de examen",
  resultado: "Resultado",
  observaciones: "Observaciones",
  tipoEstudio: "Tipo de estudio",
  formato: "Formato",
  url: "Archivo",
  regionAnatomica: "Región anatómica",
  estado: "Estado",
  prioridad: "Prioridad",
  tecnicoResponsable: "Técnico responsable",
  tecnologoResponsable: "Tecnólogo responsable",
  hora: "Hora",
  fechaSolicitud: "Fecha de solicitud",
  fechaRealizacion: "Fecha de realización",
  fechaResultado: "Fecha de resultado",
  observacionesImagenologo: "Observaciones del imagenólogo",
  observacionesLaboratorio: "Observaciones de laboratorio",
  hallazgos: "Hallazgos",
  recomendaciones: "Recomendaciones",
  valores: "Valores",
  interpretacion: "Interpretación",
  codigoMuestra: "Código de muestra",
  resultadoCritico: "Resultado crítico",
  consultaId: "Consulta asociada",
};

function RecordDetails({ item }) {
  const display = (value) => {
    if (value === null || value === undefined || value === "") return "No disponible";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <dl className="record-details">
      {Object.entries(item).map(([key, value]) => (
        <div key={key}>
          <dt>{LABELS[key] || key}</dt>
          <dd>{display(value)}</dd>
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
      <RecordGroup title="Imagenología" rows={imaging} summary={(item) => item.tipoEstudio || item.resultado || "Imagenología"} />
    </div>
  );
}
