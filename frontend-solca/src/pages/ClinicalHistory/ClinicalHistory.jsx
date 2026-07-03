import { useEffect, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useForm from "../../hooks/useForm.js";
import { createClinicalHistory } from "../../services/consultationService.js";
import { ESPECIALIDADES_MEDICAS, HOSPITAL_BRANCHES, MEDICOS_RESPONSABLES } from "../../utils/constants.js";
import { calculateImc } from "../../utils/helpers.js";
import { isNotFutureDate, isValidEcuadorianCedula, required, rule } from "../../utils/validators.js";

const today = new Date().toISOString().slice(0, 10);
const now = new Date().toTimeString().slice(0, 5);

const initialValues = {
  cedula: "",
  paciente: "",
  motivoConsulta: "",
  enfermedadActual: "",
  antecedentesPersonales: "",
  antecedentesFamiliares: "",
  antecedentesQuirurgicos: "",
  antecedentesGinecoObstetricos: "",
  antecedentesOncologicos: "",
  medicamentosActuales: "",
  alergias: "",
  habitos: "",
  revisionSistemas: "",
  peso: "",
  talla: "",
  imc: "",
  temperatura: "",
  presionArterial: "",
  frecuenciaCardiaca: "",
  frecuenciaRespiratoria: "",
  saturacion: "",
  examenFisico: "",
  diagnosticoPrincipal: "",
  diagnosticosSecundarios: "",
  cie10: "",
  planTerapeutico: "",
  tratamiento: "",
  medicamentos: "",
  solicitudesLaboratorio: "",
  solicitudesImagenologia: "",
  interconsultas: "",
  observaciones: "",
  pronostico: "",
  evolucion: "",
  firmaMedico: "",
  especialidad: "",
  sede: "",
  fecha: today,
  hora: now,
};

const rules = {
  cedula: [rule(required, "Ingrese la cédula del paciente."), rule(isValidEcuadorianCedula, "Cédula ecuatoriana no válida.")],
  paciente: [rule(required, "Ingrese nombres del paciente.")],
  motivoConsulta: [rule(required, "El motivo de consulta es obligatorio.")],
  enfermedadActual: [rule(required, "Describa la enfermedad actual.")],
  diagnosticoPrincipal: [rule(required, "Ingrese el diagnóstico principal.")],
  cie10: [rule(required, "Ingrese código CIE-10.")],
  firmaMedico: [rule(required, "Seleccione el médico responsable.")],
  especialidad: [rule(required, "Seleccione la especialidad.")],
  sede: [rule(required, "Seleccione la sede.")],
  fecha: [rule(required, "La fecha es obligatoria."), rule(isNotFutureDate, "La fecha debe ser válida.")],
  hora: [rule(required, "La hora es obligatoria.")],
};

const sections = [
  {
    title: "Identificación y motivo",
    fields: [
      ["cedula", "Cédula del paciente"],
      ["paciente", "Paciente"],
      ["motivoConsulta", "Motivo consulta", "textarea"],
      ["enfermedadActual", "Enfermedad actual", "textarea"],
    ],
  },
  {
    title: "Antecedentes clínicos",
    fields: [
      ["antecedentesPersonales", "Antecedentes personales", "textarea"],
      ["antecedentesFamiliares", "Antecedentes familiares", "textarea"],
      ["antecedentesQuirurgicos", "Antecedentes quirúrgicos", "textarea"],
      ["antecedentesGinecoObstetricos", "Antecedentes gineco-obstétricos", "textarea"],
      ["antecedentesOncologicos", "Antecedentes oncológicos", "textarea"],
      ["medicamentosActuales", "Medicamentos actuales", "textarea"],
      ["alergias", "Alergias", "textarea"],
      ["habitos", "Hábitos", "textarea"],
      ["revisionSistemas", "Revisión por sistemas", "textarea"],
    ],
  },
  {
    title: "Examen y diagnóstico",
    fields: [
      ["examenFisico", "Examen físico", "textarea"],
      ["diagnosticoPrincipal", "Diagnóstico principal"],
      ["diagnosticosSecundarios", "Diagnósticos secundarios", "textarea"],
      ["cie10", "Código CIE-10"],
    ],
  },
  {
    title: "Plan clínico",
    fields: [
      ["planTerapeutico", "Plan terapéutico", "textarea"],
      ["tratamiento", "Tratamiento", "textarea"],
      ["medicamentos", "Medicamentos", "textarea"],
      ["solicitudesLaboratorio", "Solicitudes laboratorio", "textarea"],
      ["solicitudesImagenologia", "Solicitudes de imagenología", "textarea"],
      ["interconsultas", "Interconsultas", "textarea"],
      ["observaciones", "Observaciones", "textarea"],
      ["pronostico", "Pronóstico", "textarea"],
      ["evolucion", "Evolución", "textarea"],
    ],
  },
];

export default function ClinicalHistory() {
  const form = useForm(initialValues, rules);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const imc = calculateImc(form.values.peso, form.values.talla);
    if (imc !== form.values.imc) {
      form.setValues((current) => ({ ...current, imc }));
    }
  }, [form]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    await createClinicalHistory(form.values);
    setSaving(false);
    setToast("Historia clínica registrada correctamente.");
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Nueva historia clínica</h1>
          <p>Formulario integral de ingreso para historia clínica oncológica, antecedentes, examen y plan terapéutico.</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} noValidate>
          {sections.map((section) => (
            <div className="form-section" key={section.title}>
              <div className="form-section-title">{section.title}</div>
              <div className="grid grid-2">
                {section.fields.map(([name, label, type]) => (
                  <Input key={name} label={label} name={name} type={type} value={form.values[name]} onChange={form.handleChange} error={form.errors[name]} />
                ))}
              </div>
            </div>
          ))}

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
            <div className="form-section-title">Responsable asistencial</div>
            <div className="grid grid-3">
              <Select label="Médico responsable" name="firmaMedico" value={form.values.firmaMedico} onChange={form.handleChange} error={form.errors.firmaMedico} options={MEDICOS_RESPONSABLES} />
              <Select label="Especialidad" name="especialidad" value={form.values.especialidad} onChange={form.handleChange} error={form.errors.especialidad} options={ESPECIALIDADES_MEDICAS} />
              <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
              <Input label="Fecha" type="date" name="fecha" value={form.values.fecha} onChange={form.handleChange} error={form.errors.fecha} />
              <Input label="Hora" type="time" name="hora" value={form.values.hora} onChange={form.handleChange} error={form.errors.hora} />
            </div>
          </div>

          <div className="actions">
            <Button variant="ghost" onClick={() => window.history.back()}>Cancelar</Button>
            <Button variant="secondary" onClick={form.reset}>Limpiar</Button>
            <Button type="submit" loading={saving}>Guardar</Button>
          </div>
        </form>
      </Card>
      <Toast message={toast} onClose={() => setToast("")} />
    </>
  );
}
