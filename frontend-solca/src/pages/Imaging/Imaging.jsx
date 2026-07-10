import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import PatientAutocomplete from "../../components/common/PatientAutocomplete.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useAuth from "../../hooks/useAuth.js";
import useForm from "../../hooks/useForm.js";
import { createImagingStudy } from "../../services/imagingService.js";
import { FORMATOS_IMAGEN, HOSPITAL_BRANCHES, REGIONES_ANATOMICAS, TIPOS_ESTUDIO } from "../../utils/constants.js";
import { required, rule } from "../../utils/validators.js";

const initialValues = {
  idPacienteRegional: "",
  cedula: "",
  paciente: "",
  tipoEstudio: "",
  regionAnatomica: "",
  fecha: new Date().toISOString().slice(0, 10),
  formato: "",
  sede: "",
  medico: "",
  indicacion: "",
  resultado: "",
  archivo: null,
  observaciones: "",
};

const rules = {
  idPacienteRegional: [rule(required, "Seleccione un paciente registrado.")],
  tipoEstudio: [rule(required, "Seleccione tipo de estudio.")],
  regionAnatomica: [rule(required, "Seleccione región anatómica.")],
  fecha: [rule(required, "Ingrese fecha.")],
  formato: [rule(required, "Seleccione el formato.")],
  sede: [rule(required, "Seleccione la sede.")],
  medico: [rule(required, "El médico responsable es obligatorio.")],
  resultado: [rule(required, "Ingrese resultado del estudio.")],
};

export default function Imaging() {
  const form = useForm(initialValues, rules);
  const { user } = useAuth();
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const patient = location.state?.patient;
    setSelectedPatient(patient || null);
    form.setValues((current) => ({
      ...current,
      idPacienteRegional: patient?.idPacienteRegional || current.idPacienteRegional,
      cedula: patient?.cedula || current.cedula,
      paciente: patient ? `${patient.nombres} ${patient.apellidos}` : current.paciente,
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
      paciente: patient ? `${patient.nombres} ${patient.apellidos}` : "",
    }));
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    setFileName(file?.name || "");
    form.setValues((current) => ({ ...current, archivo: file || null }));
  };

  const clearForm = () => {
    setSelectedPatient(null);
    setFileName("");
    form.reset();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    await createImagingStudy({
      ...form.values,
      observaciones: `Indicación: ${form.values.indicacion || "N/A"}. ${form.values.observaciones || ""}`,
    });
    setSaving(false);
    setToast("Estudio de imagenología registrado.");
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Nuevo estudio de imagenología</h1>
          <p>Registro de estudios diagnósticos, resultados e informe adjunto para el repositorio clínico.</p>
        </div>
      </div>

      <Card title="Estudio e informe">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-3 form-section">
            <PatientAutocomplete selectedPatient={selectedPatient} onSelect={handlePatientSelect} error={form.errors.idPacienteRegional} />
            <Input label="Paciente seleccionado" name="paciente" value={form.values.paciente} readOnly />
            <Select label="Tipo de estudio" name="tipoEstudio" value={form.values.tipoEstudio} onChange={form.handleChange} error={form.errors.tipoEstudio} options={TIPOS_ESTUDIO} />
            <Select label="Región anatómica" name="regionAnatomica" value={form.values.regionAnatomica} onChange={form.handleChange} error={form.errors.regionAnatomica} options={REGIONES_ANATOMICAS} />
            <Input label="Fecha" type="date" name="fecha" value={form.values.fecha} readOnly error={form.errors.fecha} />
            <Select label="Formato" name="formato" value={form.values.formato} onChange={form.handleChange} error={form.errors.formato} options={FORMATOS_IMAGEN} />
            <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
            <Input label="Médico" name="medico" value={form.values.medico} readOnly error={form.errors.medico} />
          </div>
          <div className="grid grid-2 form-section">
            <Input label="Indicación" type="textarea" name="indicacion" value={form.values.indicacion} onChange={form.handleChange} />
            <Input label="Resultado" type="textarea" name="resultado" value={form.values.resultado} onChange={form.handleChange} error={form.errors.resultado} />
            <label className="field">
              <span className="field-label">Adjuntar archivo</span>
              <input className="field-control" type="file" accept=".pdf,.jpg,.jpeg,.png,.dcm" onChange={handleFile} />
              <span className="field-hint">{fileName || "PDF, imagen o DICOM."}</span>
            </label>
            <Input label="Observaciones" type="textarea" name="observaciones" value={form.values.observaciones} onChange={form.handleChange} />
          </div>
          <div className="actions">
            <Button variant="secondary" onClick={clearForm}>Limpiar</Button>
            <Button type="submit" loading={saving}>Guardar estudio</Button>
          </div>
        </form>
      </Card>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
