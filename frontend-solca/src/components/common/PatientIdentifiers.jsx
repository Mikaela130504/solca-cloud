export default function PatientIdentifiers({ patient }) {
  if (!patient) return null;

  const historias = patient.historiasLocales || [];

  return (
    <div className="patient-identifiers">
      <div>
        <span>Nº paciente repositorio</span>
        <strong>{patient.idPacienteRegional || "Sin registro"}</strong>
      </div>
      <div>
        <span>Nº historia clínica</span>
        <strong>
          {historias.length > 0
            ? historias.map((item) => item.identificadorHistoriaLocal).join(", ")
            : "Sin historia local"}
        </strong>
      </div>
    </div>
  );
}
