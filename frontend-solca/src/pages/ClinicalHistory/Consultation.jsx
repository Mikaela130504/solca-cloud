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
import { createImagingStudy } from "../../services/imagingService.js";
import { createLaboratoryOrder } from "../../services/laboratoryService.js";
import { ESPECIALIDADES_MEDICAS, HOSPITAL_BRANCHES, PRIORIDADES, REGIONES_ANATOMICAS, TIPOS_CONSULTA, TIPOS_ESTUDIO, TIPOS_LABORATORIO } from "../../utils/constants.js";
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
  especialidad: "",
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
  solicitaLaboratorio: false,
  tipoExamenLaboratorio: "",
  prioridadLaboratorio: "",
  observacionesLaboratorio: "",
  solicitaImagenologia: false,
  tipoEstudioImagen: "",
  regionAnatomica: "",
  prioridadImagen: "",
  observacionesImagenologia: "",
};

const rules = {
  idPacienteRegional: [rule(required, "Seleccione un paciente registrado.")],
  sede: [rule(required, "Seleccione la sede.")],
  fecha: [rule(required, "Ingrese fecha."), rule(isNotFutureDate, "La fecha no puede ser futura.")],
  hora: [rule(required, "Ingrese hora.")],
  motivo: [rule(required, "Ingrese motivo de consulta.")],
  especialidad: [rule(required, "Seleccione especialidad.")],
  tipoConsulta: [rule(required, "Seleccione el tipo de consulta.")],
  evolucion: [rule(required, "Ingrese evolución clínica.")],
  diagnostico: [rule(required, "Seleccione diagnóstico CIE-10.")],
  cie10: [rule(required, "Seleccione CIE10.")],
  medico: [rule(required, "El médico responsable es obligatorio.")],
  proximoControl: [rule(isFutureOrToday, "El próximo control no puede ser una fecha pasada.")],
  tipoExamenLaboratorio: [rule((value, values) => !values.solicitaLaboratorio || required(value), "Seleccione el examen de laboratorio.")],
  prioridadLaboratorio: [rule((value, values) => !values.solicitaLaboratorio || required(value), "Seleccione la prioridad de laboratorio.")],
  tipoEstudioImagen: [rule((value, values) => !values.solicitaImagenologia || required(value), "Seleccione el estudio de imagenología.")],
  regionAnatomica: [rule((value, values) => !values.solicitaImagenologia || required(value), "Seleccione región anatómica.")],
  prioridadImagen: [rule((value, values) => !values.solicitaImagenologia || required(value), "Seleccione la prioridad de imagenología.")],
};

function CheckField({ name, label, checked, onChange }) {
  return (
    <label className="check-field">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

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
      const diagnosticoTexto = `${form.values.cie10} - ${form.values.diagnostico}`;
      const savedConsultation = await createConsultation({
        ...form.values,
        diagnostico: diagnosticoTexto,
        tratamiento: form.values.plan,
        observaciones: `Medicación: ${form.values.medicacion || "N/A"}\nPróximo control: ${form.values.proximoControl || "N/A"}\nSignos vitales: Peso ${form.values.peso || "N/A"} kg; Talla ${form.values.talla || "N/A"} cm; IMC ${form.values.imc || "N/A"}; Temperatura ${form.values.temperatura || "N/A"}; PA ${form.values.presionArterial || "N/A"}; FC ${form.values.frecuenciaCardiaca || "N/A"}; FR ${form.values.frecuenciaRespiratoria || "N/A"}; Saturación ${form.values.saturacion || "N/A"}.`,
      });
      const requests = [];
      if (form.values.solicitaLaboratorio) {
        requests.push(createLaboratoryOrder({
          cedula: form.values.cedula,
          idPacienteRegional: form.values.idPacienteRegional,
          fecha: form.values.fecha,
          sede: form.values.sede,
          medico: form.values.medico,
          especialidad: form.values.especialidad,
          tipoConsulta: form.values.tipoConsulta,
          consultaId: savedConsultation.id,
          diagnostico: diagnosticoTexto,
          tipoExamen: form.values.tipoExamenLaboratorio,
          prioridad: form.values.prioridadLaboratorio,
          observaciones: form.values.observacionesLaboratorio || `Solicitud generada desde consulta: ${form.values.motivo}`,
          estado: "PENDIENTE",
        }));
      }
      if (form.values.solicitaImagenologia) {
        requests.push(createImagingStudy({
          cedula: form.values.cedula,
          idPacienteRegional: form.values.idPacienteRegional,
          fecha: form.values.fecha,
          sede: form.values.sede,
          medico: form.values.medico,
          especialidad: form.values.especialidad,
          tipoConsulta: form.values.tipoConsulta,
          consultaId: savedConsultation.id,
          diagnostico: diagnosticoTexto,
          tipoEstudio: form.values.tipoEstudioImagen,
          regionAnatomica: form.values.regionAnatomica,
          prioridad: form.values.prioridadImagen,
          observaciones: form.values.observacionesImagenologia || `Solicitud generada desde consulta: ${form.values.motivo}`,
          estado: "SOLICITADO",
        }));
      }
      if (requests.length) await Promise.all(requests);
      setToast({ message: requests.length ? "Consulta y solicitudes registradas correctamente." : "Consulta registrada correctamente.", type: "success" });
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
            <Select label="Especialidad *" name="especialidad" value={form.values.especialidad} onChange={form.handleChange} error={form.errors.especialidad} options={ESPECIALIDADES_MEDICAS} />
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
              <Input label="Peso kg (opcional)" name="peso" type="number" min="0" value={form.values.peso} onChange={form.handleChange} placeholder="70" />
              <Input label="Talla cm (opcional)" name="talla" type="number" min="0" value={form.values.talla} onChange={form.handleChange} placeholder="161" />
              <Input label="IMC (opcional)" name="imc" value={form.values.imc} onChange={form.handleChange} readOnly placeholder="22.5" />
              <Input label="Temperatura C (opcional)" name="temperatura" type="number" min="0" step="0.1" value={form.values.temperatura} onChange={form.handleChange} placeholder="36.5" />
              <Input label="Presión arterial (opcional)" name="presionArterial" value={form.values.presionArterial} onChange={form.handleChange} placeholder="120/80" />
              <Input label="Frecuencia cardíaca (opcional)" name="frecuenciaCardiaca" type="number" min="0" value={form.values.frecuenciaCardiaca} onChange={form.handleChange} placeholder="72" />
              <Input label="Frecuencia respiratoria (opcional)" name="frecuenciaRespiratoria" type="number" min="0" value={form.values.frecuenciaRespiratoria} onChange={form.handleChange} placeholder="18" />
              <Input label="Saturación (opcional)" name="saturacion" type="number" min="0" max="100" value={form.values.saturacion} onChange={form.handleChange} placeholder="98" />
            </div>
          </div>

          <div className="grid grid-2 form-section">
            <DiagnosisAutocomplete label="Diagnóstico CIE-10" selected={diagnosis} onSelect={handleDiagnosis} error={form.errors.diagnostico || form.errors.cie10} />
            <Input label="Próximo control" type="date" name="proximoControl" value={form.values.proximoControl} onChange={form.handleChange} error={form.errors.proximoControl} />
            <Input label="Plan" type="textarea" name="plan" value={form.values.plan} onChange={form.handleChange} />
            <Input label="Medicación" type="textarea" name="medicacion" value={form.values.medicacion} onChange={form.handleChange} />
          </div>

          <div className="form-section">
            <div className="form-section-title">Solicitudes generadas desde la consulta</div>
            <div className="checkbox-grid">
              <CheckField name="solicitaLaboratorio" label="Solicitar laboratorio" checked={form.values.solicitaLaboratorio} onChange={form.handleChange} />
              <CheckField name="solicitaImagenologia" label="Solicitar imagenología" checked={form.values.solicitaImagenologia} onChange={form.handleChange} />
            </div>
            {form.values.solicitaLaboratorio && (
              <div className="grid grid-3">
                <Select label="Examen de laboratorio *" name="tipoExamenLaboratorio" value={form.values.tipoExamenLaboratorio} onChange={form.handleChange} error={form.errors.tipoExamenLaboratorio} options={TIPOS_LABORATORIO} />
                <Select label="Prioridad laboratorio *" name="prioridadLaboratorio" value={form.values.prioridadLaboratorio} onChange={form.handleChange} error={form.errors.prioridadLaboratorio} options={PRIORIDADES} />
                <Input label="Observaciones para laboratorio (opcional)" name="observacionesLaboratorio" value={form.values.observacionesLaboratorio} onChange={form.handleChange} />
              </div>
            )}
            {form.values.solicitaImagenologia && (
              <div className="grid grid-3">
                <Select label="Estudio de imagenología *" name="tipoEstudioImagen" value={form.values.tipoEstudioImagen} onChange={form.handleChange} error={form.errors.tipoEstudioImagen} options={TIPOS_ESTUDIO} />
                <Select label="Región anatómica *" name="regionAnatomica" value={form.values.regionAnatomica} onChange={form.handleChange} error={form.errors.regionAnatomica} options={REGIONES_ANATOMICAS} />
                <Select label="Prioridad imagenología *" name="prioridadImagen" value={form.values.prioridadImagen} onChange={form.handleChange} error={form.errors.prioridadImagen} options={PRIORIDADES} />
                <Input label="Observaciones para imagenología (opcional)" name="observacionesImagenologia" value={form.values.observacionesImagenologia} onChange={form.handleChange} />
              </div>
            )}
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
