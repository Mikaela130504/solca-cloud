import Card from "../common/Card.jsx";

export default function ClinicalHistoryView({ history, historiasLocales = [] }) {
  const current = history || {};
  const display = (value) => (value === null || value === undefined || value === "" ? "No disponible" : value);
  const fields = [
    ["Diagnóstico principal", current.diagnosticoPrincipal || current.diagnostico],
    ["Motivo de consulta", current.motivo],
    ["Enfermedad actual / evolución", current.evolucion],
    ["Antecedentes familiares", current.antecedentesFamiliares],
    ["Antecedentes personales", current.antecedentesPersonales],
    ["Cirugías", current.cirugias],
    ["Gineco-obstétricos", current.ginecoObstetricos],
    ["Embarazos", current.ginecoEmbarazos],
    ["Partos", current.ginecoPartos],
    ["Cesáreas", current.ginecoCesareas],
    ["Abortos", current.ginecoAbortos],
    ["Observaciones gineco-obstétricas", current.ginecoObservaciones],
    ["Medicamentos actuales", current.medicamentosActuales || current.medicacion],
    ["Alergias", current.alergias],
    ["Peso", current.peso],
    ["Talla", current.talla],
    ["IMC", current.imc],
    ["Temperatura", current.temperatura],
    ["Presión arterial", current.presionArterial],
    ["Frecuencia cardíaca", current.frecuenciaCardiaca],
    ["Frecuencia respiratoria", current.frecuenciaRespiratoria],
    ["Saturación de oxígeno", current.saturacionOxigeno],
    ["Examen general", current.examenGeneral],
    ["Cabeza y cuello", current.examenCabezaCuello],
    ["Tórax", current.examenTorax],
    ["Abdomen", current.examenAbdomen],
    ["Extremidades", current.examenExtremidades],
    ["Neurológico", current.examenNeurologico],
    ["Tratamiento", current.tratamiento],
    ["Observaciones", current.observaciones],
  ];

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
        {fields.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <p>{display(value)}</p>
          </article>
        ))}
      </div>
    </Card>
  );
}
