import { useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useForm from "../../hooks/useForm.js";
import { createConsultation } from "../../services/consultationService.js";
import { ESPECIALIDADES_MEDICAS, HOSPITAL_BRANCHES, MEDICOS_RESPONSABLES, TIPOS_CONSULTA } from "../../utils/constants.js";
import { isNotFutureDate, isValidEcuadorianCedula, required, rule } from "../../utils/validators.js";

const initialValues = {
  cedula: "",
  paciente: "",
  especialidad: "Oncología clínica",
  tipoConsulta: "",
  sede: "",
  fecha: new Date().toISOString().slice(0, 10),
  hora: new Date().toTimeString().slice(0, 5),
  motivo: "",
  evolucion: "",
  signosVitales: "",
  diagnostico: "",
  cie10: "",
  plan: "",
  medicacion: "",
  proximosControles: "",
  medico: "",
};

const rules = {
  cedula: [rule(required, "Ingrese la cédula."), rule(isValidEcuadorianCedula, "Cédula ecuatoriana no válida.")],
  paciente: [rule(required, "Ingrese el paciente.")],
  sede: [rule(required, "Seleccione la sede.")],
  fecha: [rule(required, "Ingrese fecha."), rule(isNotFutureDate, "La fecha no puede ser futura.")],
  hora: [rule(required, "Ingrese hora.")],
  motivo: [rule(required, "Ingrese motivo de consulta.")],
  tipoConsulta: [rule(required, "Seleccione el tipo de consulta.")],
  evolucion: [rule(required, "Ingrese evolución clínica.")],
  diagnostico: [rule(required, "Ingrese diagnóstico.")],
  cie10: [rule(required, "Ingrese CIE10.")],
  medico: [rule(required, "Seleccione el médico responsable.")],
};

export default function Consultation() {
  const form = useForm(initialValues, rules);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    await createConsultation(form.values);
    setSaving(false);
    setToast("Consulta registrada correctamente.");
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
            <Input label="Cédula del paciente" name="cedula" value={form.values.cedula} onChange={form.handleChange} error={form.errors.cedula} />
            <Input label="Paciente" name="paciente" value={form.values.paciente} onChange={form.handleChange} error={form.errors.paciente} />
            <Select label="Especialidad" name="especialidad" value={form.values.especialidad} onChange={form.handleChange} options={ESPECIALIDADES_MEDICAS} />
            <Select label="Tipo de consulta" name="tipoConsulta" value={form.values.tipoConsulta} onChange={form.handleChange} error={form.errors.tipoConsulta} options={TIPOS_CONSULTA} />
            <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
            <Input label="Fecha" type="date" name="fecha" value={form.values.fecha} onChange={form.handleChange} error={form.errors.fecha} />
            <Input label="Hora" type="time" name="hora" value={form.values.hora} onChange={form.handleChange} error={form.errors.hora} />
          </div>

          <div className="grid grid-2 form-section">
            <Input label="Motivo" type="textarea" name="motivo" value={form.values.motivo} onChange={form.handleChange} error={form.errors.motivo} />
            <Input label="Evolución" type="textarea" name="evolucion" value={form.values.evolucion} onChange={form.handleChange} error={form.errors.evolucion} />
            <Input label="Signos vitales" type="textarea" name="signosVitales" value={form.values.signosVitales} onChange={form.handleChange} />
            <Input label="Plan" type="textarea" name="plan" value={form.values.plan} onChange={form.handleChange} />
            <Input label="Diagnóstico" name="diagnostico" value={form.values.diagnostico} onChange={form.handleChange} error={form.errors.diagnostico} />
            <Input label="Código CIE-10" name="cie10" value={form.values.cie10} onChange={form.handleChange} error={form.errors.cie10} />
            <Input label="Medicación" type="textarea" name="medicacion" value={form.values.medicacion} onChange={form.handleChange} />
            <Input label="Próximos controles" type="textarea" name="proximosControles" value={form.values.proximosControles} onChange={form.handleChange} />
            <Select label="Médico responsable" name="medico" value={form.values.medico} onChange={form.handleChange} error={form.errors.medico} options={MEDICOS_RESPONSABLES} />
          </div>

          <div className="actions">
            <Button variant="secondary" onClick={form.reset}>Limpiar</Button>
            <Button type="submit" loading={saving}>Guardar consulta</Button>
          </div>
        </form>
      </Card>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
