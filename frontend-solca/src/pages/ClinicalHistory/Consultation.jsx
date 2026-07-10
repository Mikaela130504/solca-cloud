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
import { createConsultation } from "../../services/consultationService.js";
import { ESPECIALIDADES_MEDICAS, HOSPITAL_BRANCHES, TIPOS_CONSULTA } from "../../utils/constants.js";
import { calculateImc, toLocalDateInputValue } from "../../utils/helpers.js";
import { isNotFutureDate, required, rule } from "../../utils/validators.js";

const today = () => toLocalDateInputValue();
const now = () => new Date().toTimeString().slice(0, 5);
const isFutureOrToday = (value) => {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  return date >= current;
};

const initialValues = {
  idPacienteRegional: "",
  cedula: "",
  paciente: "",
  especialidad: "Oncología clínica",
  tipoConsulta: "",
  sede: "",
  fecha: today(),
  hora: now(),
  motivo: "",
  evolucion: "",
  peso: "",
  talla: "",
  imc: "",
  temperatura: "",
  presionArterial: "",
  frecuenciaCardiaca: "",
  frecuenciaRespiratoria: "",
  saturacion: "",
  diagnostico: "",
  cie10: "",
  plan: "",
  medicacion: "",
  proximoControl: "",
  medico: "",
};

const rules = {
  idPacienteRegional: [rule(required, "Seleccione un paciente registrado.")],
  sede: [rule(required, "Seleccione la sede.")],
  fecha: [rule(required, "Ingrese fecha."), rule(isNotFutureDate, "La fecha no puede ser futura.")],
  hora: [rule(required, "Ingrese hora.")],
  motivo: [rule(required, "Ingrese motivo de consulta.")],
  tipoConsulta: [rule(required, "Seleccione el tipo de consulta.")],
  evolucion: [rule(required, "Ingrese evolución clínica.")],
  diagnostico: [rule(required, "Seleccione diagnóstico CIE-10.")],
  cie10: [rule(required, "Seleccione CIE10.")],
  medico: [rule(required, "El médico responsable es obligatorio.")],
  proximoControl: [rule(isFutureOrToday, "El próximo control no puede ser una fecha pasada.")],
};

export default function Consultation() {
  const form = useForm(initialValues, rules);
  const { user } = useAuth();
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    const imc = calculateImc(form.values.peso, form.values.talla);
    if (imc !== form.values.imc) form.setValues((current) => ({ ...current, imc }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.peso, form.values.talla]);

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
      diagnostico: stateDiagnosis?.enfermedad || current.diagnostico,
      cie10: stateDiagnosis?.codigo || current.cie10,
      medico: user?.name || user?.username || current.medico,
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
      diagnostico: item ? item.enfermedad : "",
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
      await createConsultation({
        ...form.values,
        diagnostico: `${form.values.cie10} - ${form.values.diagnostico}`,
        tratamiento: form.values.plan,
        observaciones: `Medicación: ${form.values.medicacion || "N/A"}\nPróximo control: ${form.values.proximoControl || "N/A"}\nSignos vitales: Peso ${form.values.peso || "N/A"} kg; Talla ${form.values.talla || "N/A"} cm; IMC ${form.values.imc || "N/A"}; Temperatura ${form.values.temperatura || "N/A"}; PA ${form.values.presionArterial || "N/A"}; FC ${form.values.frecuenciaCardiaca || "N/A"}; FR ${form.values.frecuenciaRespiratoria || "N/A"}; Saturación ${form.values.saturacion || "N/A"}.`,
      });
      setToast({ message: "Consulta registrada correctamente.", type: "success" });
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible registrar la consulta."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Nueva consulta</h1>
          <p>Registro ambulatorio de evolución, diagnóstico y plan de seguimiento.</p>
        </div>
      </div>

      <Card title="Datos de la consulta">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-3 form-section">
            <PatientAutocomplete selectedPatient={selectedPatient} onSelect={handlePatientSelect} error={form.errors.idPacienteRegional} />
            <Input label="Paciente seleccionado" name="paciente" value={form.values.paciente} readOnly />
            <PatientIdentifiers patient={selectedPatient} />
            <Select label="Especialidad" name="especialidad" value={form.values.especialidad} onChange={form.handleChange} options={ESPECIALIDADES_MEDICAS} />
            <Select label="Tipo de consulta" name="tipoConsulta" value={form.values.tipoConsulta} onChange={form.handleChange} error={form.errors.tipoConsulta} options={TIPOS_CONSULTA} />
            <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
            <Input label="Fecha" type="date" name="fecha" value={form.values.fecha} readOnly error={form.errors.fecha} />
            <Input label="Hora" type="time" name="hora" value={form.values.hora} readOnly error={form.errors.hora} />
            <Input label="Médico responsable" name="medico" value={form.values.medico} readOnly error={form.errors.medico} />
          </div>

          <div className="grid grid-2 form-section">
            <Input label="Motivo" type="textarea" name="motivo" value={form.values.motivo} onChange={form.handleChange} error={form.errors.motivo} />
            <Input label="Evolución" type="textarea" name="evolucion" value={form.values.evolucion} onChange={form.handleChange} error={form.errors.evolucion} />
          </div>

          <div className="form-section">
            <div className="form-section-title">Signos vitales</div>
            <div className="grid grid-4">
              <Input label="Peso kg" name="peso" type="number" min="0" value={form.values.peso} onChange={form.handleChange} />
              <Input label="Talla cm" name="talla" type="number" min="0" value={form.values.talla} onChange={form.handleChange} />
              <Input label="IMC" name="imc" value={form.values.imc} onChange={form.handleChange} readOnly />
              <Input label="Temperatura C" name="temperatura" type="number" min="0" step="0.1" value={form.values.temperatura} onChange={form.handleChange} />
              <Input label="Presión arterial" name="presionArterial" value={form.values.presionArterial} onChange={form.handleChange} placeholder="120/80" />
              <Input label="Frecuencia cardíaca" name="frecuenciaCardiaca" type="number" min="0" value={form.values.frecuenciaCardiaca} onChange={form.handleChange} />
              <Input label="Frecuencia respiratoria" name="frecuenciaRespiratoria" type="number" min="0" value={form.values.frecuenciaRespiratoria} onChange={form.handleChange} />
              <Input label="Saturación" name="saturacion" type="number" min="0" max="100" value={form.values.saturacion} onChange={form.handleChange} />
            </div>
          </div>

          <div className="grid grid-2 form-section">
            <DiagnosisAutocomplete label="Diagnóstico CIE-10" selected={diagnosis} onSelect={handleDiagnosis} error={form.errors.diagnostico || form.errors.cie10} />
            <Input label="Próximo control" type="date" name="proximoControl" value={form.values.proximoControl} onChange={form.handleChange} error={form.errors.proximoControl} />
            <Input label="Plan" type="textarea" name="plan" value={form.values.plan} onChange={form.handleChange} />
            <Input label="Medicación" type="textarea" name="medicacion" value={form.values.medicacion} onChange={form.handleChange} />
          </div>

          <div className="actions">
            <Button variant="secondary" onClick={clearForm}>Limpiar</Button>
            <Button type="submit" loading={saving}>Guardar consulta</Button>
          </div>
        </form>
      </Card>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
