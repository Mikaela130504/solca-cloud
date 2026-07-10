import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import DiagnosisAutocomplete from "../../components/common/DiagnosisAutocomplete.jsx";
import Input from "../../components/common/Input.jsx";
import PatientAutocomplete from "../../components/common/PatientAutocomplete.jsx";
import PatientIdentifiers from "../../components/common/PatientIdentifiers.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useAuth from "../../hooks/useAuth.js";
import useForm from "../../hooks/useForm.js";
import { getApiErrorMessage } from "../../services/api.js";
import { createLaboratoryOrder } from "../../services/laboratoryService.js";
import { HOSPITAL_BRANCHES, PRIORIDADES, TIPOS_LABORATORIO } from "../../utils/constants.js";
import { toLocalDateInputValue } from "../../utils/helpers.js";
import { isNotFutureDate, required, rule } from "../../utils/validators.js";

const initialValues = {
  idPacienteRegional: "",
  cedula: "",
  paciente: "",
  tipoSolicitud: "",
  tipoExamen: "",
  prioridad: "",
  fecha: toLocalDateInputValue(),
  sede: "",
  medico: "",
  diagnosticoPresuntivo: "",
  cie10: "",
  resultados: "",
  observaciones: "",
};

const rules = {
  idPacienteRegional: [rule(required, "Seleccione un paciente registrado.")],
  tipoSolicitud: [rule(required, "Seleccione tipo de solicitud.")],
  tipoExamen: [rule(required, "Seleccione el tipo de examen.")],
  fecha: [rule(required, "Ingrese fecha."), rule(isNotFutureDate, "La fecha debe ser válida.")],
  sede: [rule(required, "Seleccione la sede.")],
  medico: [rule(required, "El médico solicitante es obligatorio.")],
  diagnosticoPresuntivo: [rule(required, "Seleccione diagnóstico presuntivo CIE-10.")],
};

export default function Laboratory() {
  const form = useForm(initialValues, rules);
  const { user } = useAuth();
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    const patient = location.state?.patient;
    const stateDiagnosis = location.state?.diagnosis;
    setSelectedPatient(patient || null);
    setDiagnosis(stateDiagnosis || null);
    form.setValues((current) => ({
      ...current,
      idPacienteRegional: patient?.idPacienteRegional || current.idPacienteRegional,
      cedula: patient?.cedula || current.cedula,
      paciente: patient ? `${patient.idPacienteRegional} - ${patient.nombres} ${patient.apellidos}` : current.paciente,
      diagnosticoPresuntivo: stateDiagnosis?.enfermedad || current.diagnosticoPresuntivo,
      cie10: stateDiagnosis?.codigo || current.cie10,
      medico: location.state?.medico || user?.name || user?.username || current.medico,
      sede: location.state?.sede || current.sede,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, user]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    form.setValues((current) => ({
      ...current,
      idPacienteRegional: patient?.idPacienteRegional || "",
      cedula: patient?.cedula || "",
      paciente: patient ? `${patient.idPacienteRegional} - ${patient.nombres} ${patient.apellidos}` : "",
    }));
  };

  const handleDiagnosis = (item) => {
    setDiagnosis(item);
    form.setValues((current) => ({
      ...current,
      diagnosticoPresuntivo: item ? item.enfermedad : "",
      cie10: item ? item.codigo : "",
    }));
  };

  const clearForm = () => {
    setSelectedPatient(null);
    setDiagnosis(null);
    form.reset();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    try {
      await createLaboratoryOrder({
        ...form.values,
        diagnostico: `${form.values.cie10} - ${form.values.diagnosticoPresuntivo}`,
        resultado: form.values.resultados,
        observaciones: `Tipo solicitud: ${form.values.tipoSolicitud}. Prioridad: ${form.values.prioridad || "N/A"}. ${form.values.observaciones || ""}`,
      });
      setToast({ message: "Solicitud o resultado de laboratorio registrado.", type: "success" });
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible registrar laboratorio."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Nuevo laboratorio</h1>
          <p>Solicitud de exámenes y registro de resultados clínicos asociados al paciente.</p>
        </div>
      </div>

      <div className="grid grid-1">
        <Card title="Orden y resultados">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-2 form-section">
              <PatientAutocomplete selectedPatient={selectedPatient} onSelect={handlePatientSelect} error={form.errors.idPacienteRegional} />
              <Input label="Paciente seleccionado" name="paciente" value={form.values.paciente} readOnly />
              <PatientIdentifiers patient={selectedPatient} />
              <Select label="Tipo solicitud" name="tipoSolicitud" value={form.values.tipoSolicitud} onChange={form.handleChange} error={form.errors.tipoSolicitud} options={["Solicitud nueva", "Registro de resultado", "Control de tratamiento"]} />
              <Select label="Tipo de examen" name="tipoExamen" value={form.values.tipoExamen} onChange={form.handleChange} error={form.errors.tipoExamen} options={TIPOS_LABORATORIO} />
              <Select label="Prioridad" name="prioridad" value={form.values.prioridad} onChange={form.handleChange} options={PRIORIDADES} />
              <Input label="Fecha" type="date" name="fecha" value={form.values.fecha} onChange={form.handleChange} error={form.errors.fecha} />
              <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
              <Input label="Médico" name="medico" value={form.values.medico} readOnly error={form.errors.medico} />
            </div>
            <div className="grid grid-2 form-section">
              <DiagnosisAutocomplete label="Diagnóstico presuntivo CIE-10" selected={diagnosis} onSelect={handleDiagnosis} error={form.errors.diagnosticoPresuntivo} />
              <Input label="Resultados" type="textarea" name="resultados" value={form.values.resultados} onChange={form.handleChange} />
              <Input label="Observaciones" type="textarea" name="observaciones" value={form.values.observaciones} onChange={form.handleChange} />
            </div>
            <div className="actions">
              <Button variant="secondary" onClick={clearForm}>Limpiar</Button>
              <Button type="submit" loading={saving}>Guardar laboratorio</Button>
            </div>
          </form>
        </Card>
      </div>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
