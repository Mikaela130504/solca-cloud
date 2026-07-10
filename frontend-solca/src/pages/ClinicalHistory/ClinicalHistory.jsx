import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { createClinicalHistory } from "../../services/consultationService.js";
import { ESPECIALIDADES_MEDICAS, HOSPITAL_BRANCHES, ROUTES } from "../../utils/constants.js";
import { calculateImc, toLocalDateInputValue } from "../../utils/helpers.js";
import { isNotFutureDate, required, rule } from "../../utils/validators.js";

const currentDate = () => toLocalDateInputValue();
const currentTime = () => new Date().toTimeString().slice(0, 5);

const initialValues = {
  idPacienteRegional: "",
  cedula: "",
  paciente: "",
  motivoConsulta: "",
  enfermedadActual: "",
  antecedenteMadre: "",
  antecedentePadre: "",
  antecedenteHermanos: "",
  antecedenteAbuelos: "",
  antecedenteHijos: "",
  antecedenteOtros: "",
  diabetes: false,
  hipertension: false,
  asma: false,
  cirugias: false,
  cancer: false,
  personalesOtros: false,
  cirugiaFecha: "",
  cirugiaProcedimiento: "",
  personalesOtrosDetalle: "",
  cesareas: "",
  partos: "",
  abortos: "",
  embarazos: "",
  ginecoObservaciones: "",
  medicamentosActuales: "",
  tieneAlergias: "No",
  alergias: "",
  alcohol: false,
  tabaco: false,
  drogas: false,
  actividadFisica: false,
  habitosOtros: false,
  habitosOtrosDetalle: "",
  peso: "",
  talla: "",
  imc: "",
  temperatura: "",
  presionArterial: "",
  frecuenciaCardiaca: "",
  frecuenciaRespiratoria: "",
  saturacion: "",
  examenGeneral: "",
  cabezaCuello: "",
  torax: "",
  abdomen: "",
  extremidades: "",
  neurologico: "",
  diagnosticoPrincipal: "",
  cie10: "",
  diagnosticoSecundario: "",
  cie10Secundario: "",
  planTerapeutico: "",
  tratamiento: "",
  solicitudesLaboratorio: "",
  solicitudesImagenologia: "",
  interconsultas: "",
  observaciones: "",
  evolucion: "",
  firmaMedico: "",
  especialidad: "",
  sede: "",
  fecha: currentDate(),
  hora: currentTime(),
};

const rules = {
  idPacienteRegional: [rule(required, "Seleccione un paciente registrado.")],
  motivoConsulta: [rule(required, "El motivo de consulta es obligatorio.")],
  enfermedadActual: [rule(required, "Describa la enfermedad actual.")],
  diagnosticoPrincipal: [rule(required, "Seleccione el diagnóstico principal.")],
  cie10: [rule(required, "Seleccione código CIE-10.")],
  firmaMedico: [rule(required, "El médico responsable es obligatorio.")],
  especialidad: [rule(required, "Seleccione la especialidad.")],
  sede: [rule(required, "Seleccione la sede.")],
  fecha: [rule(required, "La fecha es obligatoria."), rule(isNotFutureDate, "La fecha debe ser válida.")],
  hora: [rule(required, "La hora es obligatoria.")],
  cirugiaFecha: [rule((value, values) => !values.cirugias || (required(value) && isNotFutureDate(value)), "Ingrese fecha de cirugía no futura.")],
  cirugiaProcedimiento: [rule((value, values) => !values.cirugias || required(value), "Ingrese el procedimiento quirúrgico.")],
  alergias: [rule((value, values) => values.tieneAlergias !== "Si" || required(value), "Describa las alergias.")],
};

function CheckField({ name, label, checked, onChange }) {
  return (
    <label className="check-field">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function buildObservations(values) {
  return [
    `Antecedentes familiares: Madre: ${values.antecedenteMadre || "N/A"}; Padre: ${values.antecedentePadre || "N/A"}; Hermanos: ${values.antecedenteHermanos || "N/A"}; Abuelos: ${values.antecedenteAbuelos || "N/A"}; Hijos: ${values.antecedenteHijos || "N/A"}; Otros: ${values.antecedenteOtros || "N/A"}.`,
    `Antecedentes personales: ${["diabetes", "hipertension", "asma", "cirugias", "cancer", "personalesOtros"].filter((key) => values[key]).join(", ") || "Sin antecedentes marcados"}.`,
    values.cirugias ? `Cirugía: ${values.cirugiaFecha} - ${values.cirugiaProcedimiento}.` : "",
    values.personalesOtros ? `Otros personales: ${values.personalesOtrosDetalle}.` : "",
    `Gineco-obstétricos: Cesáreas ${values.cesareas || 0}; Partos ${values.partos || 0}; Abortos ${values.abortos || 0}; Embarazos ${values.embarazos || 0}; Observaciones: ${values.ginecoObservaciones || "N/A"}.`,
    `Medicamentos actuales: ${values.medicamentosActuales || "N/A"}.`,
    `Alergias: ${values.tieneAlergias === "Si" ? values.alergias : "No refiere"}.`,
    `Hábitos: ${["alcohol", "tabaco", "drogas", "actividadFisica", "habitosOtros"].filter((key) => values[key]).join(", ") || "Sin hábitos marcados"}. ${values.habitosOtros ? values.habitosOtrosDetalle : ""}`,
    `Examen físico: General: ${values.examenGeneral || "N/A"}; Cabeza/cuello: ${values.cabezaCuello || "N/A"}; Tórax: ${values.torax || "N/A"}; Abdomen: ${values.abdomen || "N/A"}; Extremidades: ${values.extremidades || "N/A"}; Neurológico: ${values.neurologico || "N/A"}.`,
    values.observaciones ? `Observaciones: ${values.observaciones}` : "",
  ].filter(Boolean).join("\n");
}

export default function ClinicalHistory() {
  const form = useForm(initialValues, rules);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(null);
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    const imc = calculateImc(form.values.peso, form.values.talla);
    if (imc !== form.values.imc) form.setValues((current) => ({ ...current, imc }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.peso, form.values.talla]);

  useEffect(() => {
    form.setValues((current) => ({
      ...current,
      firmaMedico: user?.name || user?.username || "",
      fecha: current.fecha || currentDate(),
      hora: current.hora || currentTime(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    form.setValues((current) => ({
      ...current,
      idPacienteRegional: patient?.idPacienteRegional || "",
      cedula: patient?.cedula || "",
      paciente: patient ? `${patient.idPacienteRegional} - ${patient.nombres} ${patient.apellidos}` : "",
    }));
  };

  const handlePrimaryDiagnosis = (diagnosis) => {
    setPrimaryDiagnosis(diagnosis);
    form.setValues((current) => ({
      ...current,
      diagnosticoPrincipal: diagnosis ? diagnosis.enfermedad : "",
      cie10: diagnosis ? diagnosis.codigo : "",
    }));
  };

  const handleSecondaryDiagnosis = (diagnosis) => {
    setSecondaryDiagnosis(diagnosis);
    form.setValues((current) => ({
      ...current,
      diagnosticoSecundario: diagnosis ? diagnosis.enfermedad : "",
      cie10Secundario: diagnosis ? diagnosis.codigo : "",
    }));
  };

  const goToRequest = (route) => {
    if (!selectedPatient) {
      setToast({ message: "Seleccione un paciente antes de solicitar.", type: "error" });
      return;
    }
    navigate(route, {
      state: {
        patient: selectedPatient,
        diagnosis: primaryDiagnosis,
        medico: form.values.firmaMedico,
        sede: form.values.sede,
      },
    });
  };

  const clearForm = () => {
    setSelectedPatient(null);
    setPrimaryDiagnosis(null);
    setSecondaryDiagnosis(null);
    form.reset();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    try {
      await createClinicalHistory({
        ...form.values,
        observaciones: buildObservations(form.values),
        tratamiento: form.values.tratamiento,
        diagnosticoPrincipal: `${form.values.cie10} - ${form.values.diagnosticoPrincipal}`,
        diagnosticosSecundarios: form.values.cie10Secundario ? `${form.values.cie10Secundario} - ${form.values.diagnosticoSecundario}` : "",
      });
      setToast({ message: "Historia clínica registrada correctamente.", type: "success" });
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible registrar la historia clínica."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Nueva historia clínica</h1>
          <p>Ingreso clínico oncológico con paciente maestro, antecedentes, examen y diagnóstico CIE-10.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <div className="form-section-title">Identificación y motivo</div>
            <div className="grid grid-2">
              <PatientAutocomplete selectedPatient={selectedPatient} onSelect={handlePatientSelect} error={form.errors.idPacienteRegional} />
              <Input label="Paciente seleccionado" name="paciente" value={form.values.paciente} readOnly />
              <PatientIdentifiers patient={selectedPatient} />
              <Input label="Motivo de consulta" type="textarea" name="motivoConsulta" value={form.values.motivoConsulta} onChange={form.handleChange} error={form.errors.motivoConsulta} />
              <Input label="Enfermedad actual" type="textarea" name="enfermedadActual" value={form.values.enfermedadActual} onChange={form.handleChange} error={form.errors.enfermedadActual} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Antecedentes familiares</div>
            <div className="grid grid-3">
              <Input label="Madre" name="antecedenteMadre" value={form.values.antecedenteMadre} onChange={form.handleChange} />
              <Input label="Padre" name="antecedentePadre" value={form.values.antecedentePadre} onChange={form.handleChange} />
              <Input label="Hermanos" name="antecedenteHermanos" value={form.values.antecedenteHermanos} onChange={form.handleChange} />
              <Input label="Abuelos" name="antecedenteAbuelos" value={form.values.antecedenteAbuelos} onChange={form.handleChange} />
              <Input label="Hijos" name="antecedenteHijos" value={form.values.antecedenteHijos} onChange={form.handleChange} />
              <Input label="Otros" name="antecedenteOtros" value={form.values.antecedenteOtros} onChange={form.handleChange} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Antecedentes personales</div>
            <div className="checkbox-grid">
              <CheckField name="diabetes" label="Diabetes" checked={form.values.diabetes} onChange={form.handleChange} />
              <CheckField name="hipertension" label="Hipertensión" checked={form.values.hipertension} onChange={form.handleChange} />
              <CheckField name="asma" label="Asma" checked={form.values.asma} onChange={form.handleChange} />
              <CheckField name="cirugias" label="Cirugías" checked={form.values.cirugias} onChange={form.handleChange} />
              <CheckField name="cancer" label="Cáncer" checked={form.values.cancer} onChange={form.handleChange} />
              <CheckField name="personalesOtros" label="Otros" checked={form.values.personalesOtros} onChange={form.handleChange} />
            </div>
            {form.values.cirugias && (
              <div className="grid grid-2">
                <Input label="Fecha de cirugía" type="date" name="cirugiaFecha" value={form.values.cirugiaFecha} onChange={form.handleChange} error={form.errors.cirugiaFecha} />
                <Input label="Procedimiento" name="cirugiaProcedimiento" value={form.values.cirugiaProcedimiento} onChange={form.handleChange} error={form.errors.cirugiaProcedimiento} />
              </div>
            )}
            {form.values.personalesOtros && <Input label="Detalle otros antecedentes" name="personalesOtrosDetalle" value={form.values.personalesOtrosDetalle} onChange={form.handleChange} />}
          </div>

          <div className="form-section">
            <div className="form-section-title">Antecedentes gineco-obstétricos</div>
            <div className="grid grid-4">
              <Input label="Cesáreas" type="number" min="0" name="cesareas" value={form.values.cesareas} onChange={form.handleChange} />
              <Input label="Partos" type="number" min="0" name="partos" value={form.values.partos} onChange={form.handleChange} />
              <Input label="Abortos" type="number" min="0" name="abortos" value={form.values.abortos} onChange={form.handleChange} />
              <Input label="Embarazos" type="number" min="0" name="embarazos" value={form.values.embarazos} onChange={form.handleChange} />
            </div>
            <Input label="Observaciones gineco-obstétricas" type="textarea" name="ginecoObservaciones" value={form.values.ginecoObservaciones} onChange={form.handleChange} />
          </div>

          <div className="form-section">
            <div className="form-section-title">Medicamentos, alergias y hábitos</div>
            <div className="grid grid-2">
              <Input label="Medicamentos actuales" type="textarea" name="medicamentosActuales" value={form.values.medicamentosActuales} onChange={form.handleChange} />
              <Select label="¿Tiene alergias?" name="tieneAlergias" value={form.values.tieneAlergias} onChange={form.handleChange} options={["Si", "No"]} />
              {form.values.tieneAlergias === "Si" && <Input label="Descripción de alergias" type="textarea" name="alergias" value={form.values.alergias} onChange={form.handleChange} error={form.errors.alergias} />}
            </div>
            <div className="checkbox-grid">
              <CheckField name="alcohol" label="Alcohol" checked={form.values.alcohol} onChange={form.handleChange} />
              <CheckField name="tabaco" label="Tabaco" checked={form.values.tabaco} onChange={form.handleChange} />
              <CheckField name="drogas" label="Drogas" checked={form.values.drogas} onChange={form.handleChange} />
              <CheckField name="actividadFisica" label="Actividad física" checked={form.values.actividadFisica} onChange={form.handleChange} />
              <CheckField name="habitosOtros" label="Otros" checked={form.values.habitosOtros} onChange={form.handleChange} />
            </div>
            {form.values.habitosOtros && <Input label="Detalle otros hábitos" name="habitosOtrosDetalle" value={form.values.habitosOtrosDetalle} onChange={form.handleChange} />}
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

          <div className="form-section">
            <div className="form-section-title">Examen físico</div>
            <div className="grid grid-3">
              <Input label="General" type="textarea" name="examenGeneral" value={form.values.examenGeneral} onChange={form.handleChange} />
              <Input label="Cabeza y cuello" type="textarea" name="cabezaCuello" value={form.values.cabezaCuello} onChange={form.handleChange} />
              <Input label="Tórax" type="textarea" name="torax" value={form.values.torax} onChange={form.handleChange} />
              <Input label="Abdomen" type="textarea" name="abdomen" value={form.values.abdomen} onChange={form.handleChange} />
              <Input label="Extremidades" type="textarea" name="extremidades" value={form.values.extremidades} onChange={form.handleChange} />
              <Input label="Neurológico" type="textarea" name="neurologico" value={form.values.neurologico} onChange={form.handleChange} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Diagnóstico y plan</div>
            <div className="grid grid-2">
              <DiagnosisAutocomplete label="Diagnóstico principal CIE-10" selected={primaryDiagnosis} onSelect={handlePrimaryDiagnosis} error={form.errors.diagnosticoPrincipal || form.errors.cie10} />
              <DiagnosisAutocomplete label="Diagnóstico secundario CIE-10" selected={secondaryDiagnosis} onSelect={handleSecondaryDiagnosis} />
              <Input label="Plan terapéutico" type="textarea" name="planTerapeutico" value={form.values.planTerapeutico} onChange={form.handleChange} />
              <Input label="Tratamiento" type="textarea" name="tratamiento" value={form.values.tratamiento} onChange={form.handleChange} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Responsable asistencial</div>
            <div className="grid grid-3">
              <Input label="Médico responsable" name="firmaMedico" value={form.values.firmaMedico} readOnly error={form.errors.firmaMedico} />
              <Select label="Especialidad" name="especialidad" value={form.values.especialidad} onChange={form.handleChange} error={form.errors.especialidad} options={ESPECIALIDADES_MEDICAS} />
              <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
              <Input label="Fecha" type="date" name="fecha" value={form.values.fecha} readOnly error={form.errors.fecha} />
              <Input label="Hora" type="time" name="hora" value={form.values.hora} readOnly error={form.errors.hora} />
            </div>
          </div>

          <div className="actions">
            <Button type="button" variant="secondary" onClick={() => goToRequest(ROUTES.laboratory)}>Solicitar laboratorio</Button>
            <Button type="button" variant="secondary" onClick={() => goToRequest(ROUTES.imaging)}>Solicitar imagenología</Button>
            <Button type="button" variant="ghost" onClick={() => window.history.back()}>Cancelar</Button>
            <Button type="button" variant="secondary" onClick={clearForm}>Limpiar</Button>
            <Button type="submit" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Card>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
