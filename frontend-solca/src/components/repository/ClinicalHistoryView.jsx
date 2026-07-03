import Card from "../common/Card.jsx";

export default function ClinicalHistoryView({ history }) {
  const current = history || {};
  return (
    <Card title="Historia clínica" subtitle="Resumen longitudinal no editable">
      <div className="history-readonly">
        <article>
          <span>Diagnóstico principal</span>
          <p>{current.diagnosticoPrincipal || current.diagnostico || "Sin registro"}</p>
        </article>
        <article>
          <span>Alergias</span>
          <p>{current.alergias || "Sin registro"}</p>
        </article>
        <article>
          <span>Tratamiento</span>
          <p>{current.tratamiento || "Sin registro"}</p>
        </article>
        <article>
          <span>Pronóstico</span>
          <p>{current.pronostico || "Sin registro"}</p>
        </article>
      </div>
    </Card>
  );
}
