import { useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useForm from "../../hooks/useForm.js";
import { createImagingStudy } from "../../services/imagingService.js";
import { FORMATOS_IMAGEN, HOSPITAL_BRANCHES, MEDICOS_RESPONSABLES, TIPOS_ESTUDIO } from "../../utils/constants.js";
import { isNotFutureDate, isValidEcuadorianCedula, required, rule } from "../../utils/validators.js";

const initialValues = {
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
  cedula: [rule(required, "Ingrese cédula."), rule(isValidEcuadorianCedula, "Cédula ecuatoriana no válida.")],
  paciente: [rule(required, "Ingrese paciente.")],
  tipoEstudio: [rule(required, "Seleccione tipo de estudio.")],
  fecha: [rule(required, "Ingrese fecha."), rule(isNotFutureDate, "La fecha debe ser válida.")],
  formato: [rule(required, "Seleccione el formato.")],
  sede: [rule(required, "Seleccione la sede.")],
  medico: [rule(required, "Seleccione el médico responsable.")],
  resultado: [rule(required, "Ingrese resultado del estudio.")],
};

export default function Imaging() {
  const form = useForm(initialValues, rules);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    setFileName(file?.name || "");
    form.setValues((current) => ({ ...current, archivo: file || null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    await createImagingStudy(form.values);
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
            <Input label="Cédula del paciente" name="cedula" value={form.values.cedula} onChange={form.handleChange} error={form.errors.cedula} />
            <Input label="Paciente" name="paciente" value={form.values.paciente} onChange={form.handleChange} error={form.errors.paciente} />
            <Select label="Tipo de estudio" name="tipoEstudio" value={form.values.tipoEstudio} onChange={form.handleChange} error={form.errors.tipoEstudio} options={TIPOS_ESTUDIO} />
            <Input label="Región anatómica" name="regionAnatomica" value={form.values.regionAnatomica} onChange={form.handleChange} />
            <Input label="Fecha" type="date" name="fecha" value={form.values.fecha} onChange={form.handleChange} error={form.errors.fecha} />
            <Select label="Formato" name="formato" value={form.values.formato} onChange={form.handleChange} error={form.errors.formato} options={FORMATOS_IMAGEN} />
            <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
            <Select label="Médico" name="medico" value={form.values.medico} onChange={form.handleChange} error={form.errors.medico} options={MEDICOS_RESPONSABLES} />
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
            <Button variant="secondary" onClick={form.reset}>Limpiar</Button>
            <Button type="submit" loading={saving}>Guardar estudio</Button>
          </div>
        </form>
      </Card>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
