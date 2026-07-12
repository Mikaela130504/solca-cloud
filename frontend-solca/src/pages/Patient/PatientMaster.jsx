import { useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import PatientIdentifiers from "../../components/common/PatientIdentifiers.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useForm from "../../hooks/useForm.js";
import { getApiErrorMessage } from "../../services/api.js";
import { createPatient, getPatientByCedula } from "../../services/patientService.js";
import { BLOOD_TYPES, CIUDADES_POR_PROVINCIA, ECUADOR_PROVINCES, ESTADOS_CIVILES, HOSPITAL_BRANCHES, SEGUROS_MEDICOS, SEXOS } from "../../utils/constants.js";
import { calculateAge, isEmail, isNotFutureDate, isPhone, isValidEcuadorianCedula, onlyLetters, required, rule } from "../../utils/validators.js";

const initialValues = {
  cedula: "",
  nombres: "",
  apellidos: "",
  fechaNacimiento: "",
  sexo: "",
  estadoCivil: "",
  direccion: "",
  provincia: "",
  ciudad: "",
  telefono: "",
  correo: "",
  contactoEmergencia: "",
  seguro: "",
  tipoSangre: "",
  nacionalidad: "",
  observaciones: "",
  sede: "",
};

const rules = {
  cedula: [rule(required, "La cédula es obligatoria."), rule(isValidEcuadorianCedula, "Ingrese una cédula ecuatoriana válida.")],
  nombres: [rule(required, "Los nombres son obligatorios."), rule(onlyLetters, "Use solo letras en nombres.")],
  apellidos: [rule(required, "Los apellidos son obligatorios."), rule(onlyLetters, "Use solo letras en apellidos.")],
  fechaNacimiento: [
    rule(required, "La fecha de nacimiento es obligatoria."),
    rule(isNotFutureDate, "La fecha debe ser válida y no futura."),
    rule((value) => calculateAge(value) >= 0, "La edad no puede ser negativa."),
  ],
  sexo: [rule(required, "Seleccione el sexo.")],
  estadoCivil: [rule(required, "Seleccione el estado civil.")],
  direccion: [rule(required, "La dirección es obligatoria.")],
  provincia: [rule(required, "Seleccione la provincia.")],
  ciudad: [rule(required, "La ciudad es obligatoria."), rule(onlyLetters, "Use solo letras en ciudad.")],
  telefono: [rule(required, "El teléfono es obligatorio."), rule(isPhone, "El teléfono debe tener 10 dígitos numéricos.")],
  correo: [rule(required, "El correo es obligatorio."), rule(isEmail, "Ingrese un correo válido.")],
  contactoEmergencia: [rule(required, "El teléfono de emergencia es obligatorio."), rule(isPhone, "El teléfono de emergencia debe tener 10 dígitos numéricos.")],
  seguro: [rule(required, "El seguro es obligatorio.")],
  tipoSangre: [rule(required, "Seleccione el tipo de sangre.")],
  nacionalidad: [rule(required, "La nacionalidad es obligatoria."), rule(onlyLetters, "Use solo letras en nacionalidad.")],
  sede: [rule(required, "Seleccione la sede donde se registra el paciente.")],
};

export default function PatientMaster() {
  const form = useForm(initialValues, rules);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [loadedPatient, setLoadedPatient] = useState(null);
  const age = calculateAge(form.values.fechaNacimiento);
  const cityOptions = form.values.provincia ? (CIUDADES_POR_PROVINCIA[form.values.provincia] || []) : [];

  const handleDigits = (event) => {
    const { name, value, maxLength } = event.target;
    const digits = value.replace(/\D/g, "").slice(0, Number(maxLength) || 10);
    form.setValues((current) => ({ ...current, [name]: digits }));
  };

  const handleProvinceChange = (event) => {
    const provincia = event.target.value;
    form.setValues((current) => ({ ...current, provincia, ciudad: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.validate()) return;
    setSaving(true);
    try {
      const createdPatient = await createPatient({ ...form.values, edad: age });
      setLoadedPatient(createdPatient);
      form.setValues((current) => ({
        ...current,
        cedula: createdPatient.cedula || "",
        nombres: createdPatient.nombres || "",
        apellidos: createdPatient.apellidos || "",
        fechaNacimiento: createdPatient.fechaNacimiento || "",
        sexo: createdPatient.sexo || "",
        estadoCivil: createdPatient.estadoCivil || "",
        direccion: createdPatient.direccion || "",
        provincia: createdPatient.provincia || "",
        ciudad: createdPatient.ciudad || "",
        telefono: createdPatient.telefono || "",
        correo: createdPatient.correo || "",
        contactoEmergencia: createdPatient.contactoEmergencia || "",
        seguro: createdPatient.seguro || "",
        tipoSangre: createdPatient.tipoSangre || "",
        nacionalidad: createdPatient.nacionalidad || "",
        observaciones: createdPatient.observaciones || "",
        sede: createdPatient.sede || "",
      }));
      setToast({ message: "Paciente maestro registrado correctamente.", type: "success" });
    } catch (error) {
      if (error?.response?.status === 409) {
        try {
          const existingPatient = await getPatientByCedula(form.values.cedula);
          setLoadedPatient(existingPatient);
          form.setValues((current) => ({
            ...current,
            cedula: existingPatient.cedula || "",
            nombres: existingPatient.nombres || "",
            apellidos: existingPatient.apellidos || "",
            fechaNacimiento: existingPatient.fechaNacimiento || "",
            sexo: existingPatient.sexo || "",
            estadoCivil: existingPatient.estadoCivil || "",
            direccion: existingPatient.direccion || "",
            provincia: existingPatient.provincia || "",
            ciudad: existingPatient.ciudad || "",
            telefono: existingPatient.telefono || "",
            correo: existingPatient.correo || "",
            contactoEmergencia: existingPatient.contactoEmergencia || "",
            seguro: existingPatient.seguro || "",
            tipoSangre: existingPatient.tipoSangre || "",
            nacionalidad: existingPatient.nacionalidad || "",
            observaciones: existingPatient.observaciones || "",
            sede: existingPatient.sede || "",
          }));
        } catch {
          // Keep the entered values if the lookup fails; the duplicate message is still useful.
        }
        setToast({ message: "Paciente ya existe. Se cargó la información registrada.", type: "error" });
      } else {
        setToast({ message: getApiErrorMessage(error, "No fue posible registrar el paciente."), type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setLoadedPatient(null);
    form.reset();
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Paciente Maestro</h1>
          <p>Registro administrativo único para identificar al paciente en todas las sedes SOLCA.</p>
        </div>
      </div>

      <Card title="Datos demográficos y contacto">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <div className="grid grid-3">
              <Input label="Cédula ecuatoriana *" name="cedula" value={form.values.cedula} onChange={handleDigits} error={form.errors.cedula} maxLength="10" inputMode="numeric" />
              <Input label="Nombres *" name="nombres" value={form.values.nombres} onChange={form.handleChange} error={form.errors.nombres} />
              <Input label="Apellidos *" name="apellidos" value={form.values.apellidos} onChange={form.handleChange} error={form.errors.apellidos} />
              <Input label="Fecha de nacimiento *" type="date" name="fechaNacimiento" value={form.values.fechaNacimiento} onChange={form.handleChange} error={form.errors.fechaNacimiento} hint={age !== null ? `Edad calculada: ${age} años` : ""} />
              <Select label="Sexo *" name="sexo" value={form.values.sexo} onChange={form.handleChange} error={form.errors.sexo} options={SEXOS} />
              <Select label="Estado civil *" name="estadoCivil" value={form.values.estadoCivil} onChange={form.handleChange} error={form.errors.estadoCivil} options={ESTADOS_CIVILES} />
              <Select label="Sede de registro *" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
              <PatientIdentifiers patient={loadedPatient} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Ubicación y contacto</div>
            <div className="grid grid-3">
              <Input label="Dirección *" name="direccion" value={form.values.direccion} onChange={form.handleChange} error={form.errors.direccion} />
              <Select label="Provincia *" name="provincia" value={form.values.provincia} onChange={handleProvinceChange} error={form.errors.provincia} options={ECUADOR_PROVINCES} />
              <Select label="Ciudad *" name="ciudad" value={form.values.ciudad} onChange={form.handleChange} error={form.errors.ciudad} options={cityOptions} disabled={!form.values.provincia} />
              <Input label="Teléfono *" name="telefono" value={form.values.telefono} onChange={handleDigits} error={form.errors.telefono} maxLength="10" inputMode="numeric" autoComplete="tel-national" />
              <Input label="Correo *" type="email" name="correo" value={form.values.correo} onChange={form.handleChange} error={form.errors.correo} />
              <Input label="Teléfono de emergencia *" name="contactoEmergencia" value={form.values.contactoEmergencia} onChange={handleDigits} error={form.errors.contactoEmergencia} maxLength="10" inputMode="numeric" autoComplete="off" />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Cobertura y observaciones</div>
            <div className="grid grid-3">
              <Select label="Seguro *" name="seguro" value={form.values.seguro} onChange={form.handleChange} error={form.errors.seguro} options={SEGUROS_MEDICOS} />
              <Select label="Tipo de sangre *" name="tipoSangre" value={form.values.tipoSangre} onChange={form.handleChange} error={form.errors.tipoSangre} options={BLOOD_TYPES} />
              <Input label="Nacionalidad *" name="nacionalidad" value={form.values.nacionalidad} onChange={form.handleChange} error={form.errors.nacionalidad} />
            </div>
            <Input label="Observaciones (opcional)" type="textarea" name="observaciones" value={form.values.observaciones} onChange={form.handleChange} />
          </div>

          <div className="actions">
            <Button variant="secondary" onClick={clearForm}>Limpiar</Button>
            <Button type="submit" loading={saving}>Guardar paciente</Button>
          </div>
        </form>
      </Card>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
