import Card from "../common/Card.jsx";

export default function ClinicalHistoryView({ history, historiasLocales = [] }) {
  const current = history || {};
  return (
    <Card title="Historia clínica" subtitle="Resumen longitudinal no editable">
      <div className="history-readonly">
        <article>
          <span>Número de historia clínica</span>
          <p>
            {historiasLocales.length > 0
              ? historiasLocales.map((item) => `${item.sede}: ${item.identificadorHistoriaLocal}`).join(" · ")
              : "Pendiente de sincronización"}
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
      </div>
    </Card>
  );
}
