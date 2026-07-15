import Card from "../common/Card.jsx";

export default function ClinicalHistoryView({ history, historiasLocales = [] }) {
  const current = history || {};
  const display = (value) => (value === null || value === undefined || value === "" ? "No disponible" : value);
  return (
    <Card title="Historia clínica" subtitle="Resumen longitudinal no editable">
      <div className="history-readonly">
        <article>
          <span>Número de historia clínica</span>
          <p>
            {historiasLocales.length > 0
              ? historiasLocales.map((item) => `${item.sede}: ${item.identificadorHistoriaLocal}`).join(" · ")
              : "No disponible"}
          </p>
        </article>
        {historiasLocales.length > 0 && (
          <article>
            <span>Historias locales por sede</span>
            <ul className="local-history-list">
              {historiasLocales.map((item) => (
                <li key={`${item.sede}-${item.identificadorHistoriaLocal}`}>
                  <strong>{item.sede}</strong> {item.identificadorHistoriaLocal}
                </li>
              ))}
            </ul>
          </article>
        )}
        <article>
          <span>Diagnóstico principal</span>
          <p>{display(current.diagnosticoPrincipal || current.diagnostico)}</p>
        </article>
        <article>
          <span>Alergias</span>
          <p>{display(current.alergias)}</p>
        </article>
        <article>
          <span>Tratamiento</span>
          <p>{display(current.tratamiento)}</p>
        </article>
      </div>
    </Card>
  );
}
