import { useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useForm from "../../hooks/useForm.js";
import { createLaboratoryOrder } from "../../services/laboratoryService.js";
import { HOSPITAL_BRANCHES, MEDICOS_RESPONSABLES, PRIORIDADES, TIPOS_LABORATORIO } from "../../utils/constants.js";
import { isNotFutureDate, isValidEcuadorianCedula, required, rule } from "../../utils/validators.js";

const initialValues = {
  cedula: "",
  paciente: "",
  tipoSolicitud: "",
  tipoExamen: "",
  prioridad: "",
  fecha: new Date().toISOString().slice(0, 10),
  sede: "",
  medico: "",
  diagnosticoPresuntivo: "",
  resultados: "",
  observaciones: "",
};

const rules = {
  cedula: [rule(required, "Ingrese cédula."), rule(isValidEcuadorianCedula, "Cédula ecuatoriana no válida.")],
  paciente: [rule(required, "Ingrese paciente.")],
  tipoSolicitud: [rule(required, "Seleccione tipo de solicitud.")],
  tipoExamen: [rule(required, "Seleccione el tipo de examen.")],
  fecha: [rule(required, "Ingrese fecha."), rule(isNotFutureDate, "La fecha debe ser válida.")],
  sede: [rule(required, "Seleccione la sede.")],
  medico: [rule(required, "Seleccione el médico solicitante.")],
};

export default function Laboratory() {
  const form = useForm(initialValues, rules);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    await createLaboratoryOrder(form.values);
    setSaving(false);
    setToast("Solicitud o resultado de laboratorio registrado.");
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
              <Input label="Cédula del paciente" name="cedula" value={form.values.cedula} onChange={form.handleChange} error={form.errors.cedula} />
              <Input label="Paciente" name="paciente" value={form.values.paciente} onChange={form.handleChange} error={form.errors.paciente} />
              <Select label="Tipo solicitud" name="tipoSolicitud" value={form.values.tipoSolicitud} onChange={form.handleChange} error={form.errors.tipoSolicitud} options={["Solicitud nueva", "Registro de resultado", "Control de tratamiento"]} />
              <Select label="Tipo de examen" name="tipoExamen" value={form.values.tipoExamen} onChange={form.handleChange} error={form.errors.tipoExamen} options={TIPOS_LABORATORIO} />
              <Select label="Prioridad" name="prioridad" value={form.values.prioridad} onChange={form.handleChange} options={PRIORIDADES} />
              <Input label="Fecha" type="date" name="fecha" value={form.values.fecha} onChange={form.handleChange} error={form.errors.fecha} />
              <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
              <Select label="Médico" name="medico" value={form.values.medico} onChange={form.handleChange} error={form.errors.medico} options={MEDICOS_RESPONSABLES} />
            </div>
            <div className="grid grid-2 form-section">
              <Input label="Diagnóstico presuntivo" type="textarea" name="diagnosticoPresuntivo" value={form.values.diagnosticoPresuntivo} onChange={form.handleChange} />
              <Input label="Resultados" type="textarea" name="resultados" value={form.values.resultados} onChange={form.handleChange} />
              <Input label="Observaciones" type="textarea" name="observaciones" value={form.values.observaciones} onChange={form.handleChange} />
            </div>
            <div className="actions">
              <Button variant="secondary" onClick={form.reset}>Limpiar</Button>
              <Button type="submit" loading={saving}>Guardar laboratorio</Button>
            </div>
          </form>
        </Card>
      </div>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
