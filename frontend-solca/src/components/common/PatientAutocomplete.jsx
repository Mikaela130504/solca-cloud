import { useEffect, useMemo, useState } from "react";
import { searchPatients } from "../../services/patientService.js";
import Input from "./Input.jsx";

export default function PatientAutocomplete({ value = "", selectedPatient, onSelect, error, label = "Paciente" }) {
  const [query, setQuery] = useState(value);
  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2 || selectedPatient) {
      setPatients([]);
      return;
    }

    const handle = setTimeout(() => {
      searchPatients(term)
        .then((items) => setPatients(Array.isArray(items) ? items.slice(0, 8) : []))
        .catch(() => setPatients([]));
    }, 250);

    return () => clearTimeout(handle);
  }, [query, selectedPatient]);

  const display = useMemo(() => {
    if (!selectedPatient) return query;
    return `${selectedPatient.cedula} - ${selectedPatient.nombres} ${selectedPatient.apellidos}`;
  }, [query, selectedPatient]);

  const handleChange = (event) => {
    setQuery(event.target.value);
    setOpen(true);
    if (selectedPatient) onSelect(null);
  };

  const pick = (patient) => {
    setOpen(false);
    setQuery(`${patient.cedula} - ${patient.nombres} ${patient.apellidos}`);
    onSelect(patient);
  };

  return (
    <div className="autocomplete">
      <Input
        label={label}
        name="patientSearch"
        value={display}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        error={error}
        placeholder="Buscar por cedula, nombre o apellido"
        autoComplete="off"
      />
      {open && patients.length > 0 && (
        <div className="autocomplete-list">
          {patients.map((patient) => (
            <button type="button" key={patient.idPacienteRegional} onMouseDown={() => pick(patient)}>
              <strong>{patient.cedula}</strong>
              <span>{patient.nombres} {patient.apellidos}</span>
              <small>{patient.idPacienteRegional}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
