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
  tieneAntecedenteMadre: false,
  antecedenteMadre: "",
  tieneAntecedentePadre: false,
  antecedentePadre: "",
  tieneAntecedenteHermanos: false,
  antecedenteHermanos: "",
  tieneAntecedenteAbuelos: false,
  antecedenteAbuelos: "",
  tieneAntecedenteHijos: false,
  antecedenteHijos: "",
  tieneAntecedenteOtros: false,
  antecedenteOtros: "",
  diabetes: false,
  hipertension: false,
  asma: false,
  cirugias: false,
  cancer: false,
  personalesOtros: false,
  cirugiasLista: [{ fecha: "", procedimiento: "" }],
  personalesOtrosDetalle: "",
  cesareas: "",
  partos: "",
  abortos: "",
  embarazos: "",
  ginecoObservaciones: "",
  medicamentosActuales: "",
  tieneAlergias: false,
  noTieneAlergias: true,
  alergias: "",
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
  antecedenteMadre: [rule((value, values) => !values.tieneAntecedenteMadre || required(value), "Ingrese el antecedente de madre.")],
  antecedentePadre: [rule((value, values) => !values.tieneAntecedentePadre || required(value), "Ingrese el antecedente de padre.")],
  antecedenteHermanos: [rule((value, values) => !values.tieneAntecedenteHermanos || required(value), "Ingrese el antecedente de hermanos.")],
  antecedenteAbuelos: [rule((value, values) => !values.tieneAntecedenteAbuelos || required(value), "Ingrese el antecedente de abuelos.")],
  antecedenteHijos: [rule((value, values) => !values.tieneAntecedenteHijos || required(value), "Ingrese el antecedente de hijos.")],
  antecedenteOtros: [rule((value, values) => !values.tieneAntecedenteOtros || required(value), "Ingrese el antecedente familiar adicional.")],
  cirugiasLista: [rule((value, values) => {
    if (!values.cirugias) return true;
    return Array.isArray(value) && value.length > 0 && value.every((item) => required(item.fecha) && isNotFutureDate(item.fecha) && required(item.procedimiento));
  }, "Ingrese fecha no futura y procedimiento en cada cirugía.")],
  alergias: [rule((value, values) => !values.tieneAlergias || required(value), "Describa las alergias.")],
};

function CheckField({ name, label, checked, onChange }) {
  return (
    <label className="check-field">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function buildFamilyHistory(values) {
  const selected = [
    values.tieneAntecedenteMadre ? `Madre: ${values.antecedenteMadre}` : "",
    values.tieneAntecedentePadre ? `Padre: ${values.antecedentePadre}` : "",
    values.tieneAntecedenteHermanos ? `Hermanos: ${values.antecedenteHermanos}` : "",
    values.tieneAntecedenteAbuelos ? `Abuelos: ${values.antecedenteAbuelos}` : "",
    values.tieneAntecedenteHijos ? `Hijos: ${values.antecedenteHijos}` : "",
    values.tieneAntecedenteOtros ? `Otros: ${values.antecedenteOtros}` : "",
  ].filter(Boolean);
  return selected.length ? selected.join("; ") : "Sin antecedentes familiares marcados";
}

function buildSurgeries(values) {
  if (!values.cirugias) return "";
  return values.cirugiasLista
    .filter((item) => item.fecha || item.procedimiento)
    .map((item, index) => `Cirugía ${index + 1}: ${item.fecha || "Sin fecha"} - ${item.procedimiento || "Sin procedimiento"}`)
    .join("; ");
}

function buildObservations(values) {
  return [
    `Antecedentes familiares: ${buildFamilyHistory(values)}.`,
    `Antecedentes personales: ${["diabetes", "hipertension", "asma", "cirugias", "cancer", "personalesOtros"].filter((key) => values[key]).join(", ") || "Sin antecedentes marcados"}.`,
    values.cirugias ? buildSurgeries(values) : "",
    values.personalesOtros ? `Otros personales: ${values.personalesOtrosDetalle}.` : "",
    `Gineco-obstétricos: Cesáreas ${values.cesareas || 0}; Partos ${values.partos || 0}; Abortos ${values.abortos || 0}; Embarazos ${values.embarazos || 0}; Observaciones: ${values.ginecoObservaciones || "N/A"}.`,
    `Medicamentos actuales: ${values.medicamentosActuales || "N/A"}.`,
    `Alergias: ${values.tieneAlergias ? values.alergias : "No refiere"}.`,
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

  const handleCheckChange = (event) => {
    const { name, checked } = event.target;

    if (name === "cirugias") {
      form.setValues((current) => ({
        ...current,
        cirugias: checked,
        cirugiasLista: checked && current.cirugiasLista.length ? current.cirugiasLista : [{ fecha: "", procedimiento: "" }],
      }));
      return;
    }

    if (name === "tieneAlergias") {
      form.setValues((current) => ({
        ...current,
        tieneAlergias: checked,
        noTieneAlergias: !checked,
        alergias: checked ? current.alergias : "",
      }));
      return;
    }

    if (name === "noTieneAlergias") {
      form.setValues((current) => ({
        ...current,
        tieneAlergias: false,
        noTieneAlergias: true,
        alergias: "",
      }));
      return;
    }

    form.handleChange(event);
  };

  const addSurgery = () => {
    form.setValues((current) => ({
      ...current,
      cirugiasLista: [...current.cirugiasLista, { fecha: "", procedimiento: "" }],
    }));
  };

  const removeSurgery = (index) => {
    form.setValues((current) => ({
      ...current,
      cirugiasLista: current.cirugiasLista.filter((_, itemIndex) => itemIndex !== index).length
        ? current.cirugiasLista.filter((_, itemIndex) => itemIndex !== index)
        : [{ fecha: "", procedimiento: "" }],
    }));
  };

  const updateSurgery = (index, field, value) => {
    form.setValues((current) => ({
      ...current,
      cirugiasLista: current.cirugiasLista.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
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
            <div className="checkbox-grid">
              <CheckField name="tieneAntecedenteMadre" label="Madre" checked={form.values.tieneAntecedenteMadre} onChange={form.handleChange} />
              <CheckField name="tieneAntecedentePadre" label="Padre" checked={form.values.tieneAntecedentePadre} onChange={form.handleChange} />
              <CheckField name="tieneAntecedenteHermanos" label="Hermanos" checked={form.values.tieneAntecedenteHermanos} onChange={form.handleChange} />
              <CheckField name="tieneAntecedenteAbuelos" label="Abuelos" checked={form.values.tieneAntecedenteAbuelos} onChange={form.handleChange} />
              <CheckField name="tieneAntecedenteHijos" label="Hijos" checked={form.values.tieneAntecedenteHijos} onChange={form.handleChange} />
              <CheckField name="tieneAntecedenteOtros" label="Otros" checked={form.values.tieneAntecedenteOtros} onChange={form.handleChange} />
            </div>
            <div className="grid grid-3">
              {form.values.tieneAntecedenteMadre && <Input label="Antecedente de madre" name="antecedenteMadre" value={form.values.antecedenteMadre} onChange={form.handleChange} error={form.errors.antecedenteMadre} />}
              {form.values.tieneAntecedentePadre && <Input label="Antecedente de padre" name="antecedentePadre" value={form.values.antecedentePadre} onChange={form.handleChange} error={form.errors.antecedentePadre} />}
              {form.values.tieneAntecedenteHermanos && <Input label="Antecedente de hermanos" name="antecedenteHermanos" value={form.values.antecedenteHermanos} onChange={form.handleChange} error={form.errors.antecedenteHermanos} />}
              {form.values.tieneAntecedenteAbuelos && <Input label="Antecedente de abuelos" name="antecedenteAbuelos" value={form.values.antecedenteAbuelos} onChange={form.handleChange} error={form.errors.antecedenteAbuelos} />}
              {form.values.tieneAntecedenteHijos && <Input label="Antecedente de hijos" name="antecedenteHijos" value={form.values.antecedenteHijos} onChange={form.handleChange} error={form.errors.antecedenteHijos} />}
              {form.values.tieneAntecedenteOtros && <Input label="Otros antecedentes familiares" name="antecedenteOtros" value={form.values.antecedenteOtros} onChange={form.handleChange} error={form.errors.antecedenteOtros} />}
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Antecedentes personales</div>
            <div className="checkbox-grid">
              <CheckField name="diabetes" label="Diabetes" checked={form.values.diabetes} onChange={form.handleChange} />
              <CheckField name="hipertension" label="Hipertensión" checked={form.values.hipertension} onChange={form.handleChange} />
              <CheckField name="asma" label="Asma" checked={form.values.asma} onChange={form.handleChange} />
              <CheckField name="cirugias" label="Cirugías" checked={form.values.cirugias} onChange={handleCheckChange} />
              <CheckField name="cancer" label="Cáncer" checked={form.values.cancer} onChange={form.handleChange} />
              <CheckField name="personalesOtros" label="Otros" checked={form.values.personalesOtros} onChange={form.handleChange} />
            </div>
            {form.values.cirugias && (
              <div className="dynamic-list">
                {form.values.cirugiasLista.map((cirugia, index) => (
                  <div className="dynamic-row" key={`cirugia-${index}`}>
                    <Input
                      label={`Fecha de cirugía ${index + 1}`}
                      type="date"
                      name={`cirugiaFecha-${index}`}
                      value={cirugia.fecha}
                      onChange={(event) => updateSurgery(index, "fecha", event.target.value)}
                    />
                    <Input
                      label={`Procedimiento ${index + 1}`}
                      name={`cirugiaProcedimiento-${index}`}
                      value={cirugia.procedimiento}
                      onChange={(event) => updateSurgery(index, "procedimiento", event.target.value)}
                    />
                    <Button type="button" variant="ghost" onClick={() => removeSurgery(index)} disabled={form.values.cirugiasLista.length === 1}>Eliminar</Button>
                  </div>
                ))}
                {form.errors.cirugiasLista ? <span className="field-error">{form.errors.cirugiasLista}</span> : null}
                <Button type="button" variant="secondary" onClick={addSurgery}>+ Agregar cirugía</Button>
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
            <div className="form-section-title">Medicamentos y alergias</div>
            <div className="grid grid-2">
              <Input label="Medicamentos actuales" type="textarea" name="medicamentosActuales" value={form.values.medicamentosActuales} onChange={form.handleChange} />
              <div className="field">
                <span className="field-label">¿Tiene alergias?</span>
                <div className="checkbox-grid compact-checks">
                  <CheckField name="tieneAlergias" label="Sí" checked={form.values.tieneAlergias} onChange={handleCheckChange} />
                  <CheckField name="noTieneAlergias" label="No" checked={form.values.noTieneAlergias} onChange={handleCheckChange} />
                </div>
              </div>
              {form.values.tieneAlergias && <Input label="Descripción de alergias" type="textarea" name="alergias" value={form.values.alergias} onChange={form.handleChange} error={form.errors.alergias} />}
            </div>
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
