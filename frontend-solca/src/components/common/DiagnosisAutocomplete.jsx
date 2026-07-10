import { useEffect, useMemo, useState } from "react";
import Input from "./Input.jsx";

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const formatCie10 = (item) => item ? `${item.codigo} - ${item.enfermedad}` : "";

export default function DiagnosisAutocomplete({ label, value = "", selected, onSelect, error }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [diagnoses, setDiagnoses] = useState([]);

  useEffect(() => {
    fetch("/data/cie10.json")
      .then((response) => response.json())
      .then((items) => setDiagnoses(Array.isArray(items) ? items : []))
      .catch(() => setDiagnoses([]));
  }, []);

  const matches = useMemo(() => {
    const term = normalize(query);
    if (term.length < 2 || selected) return [];
    return diagnoses.filter((item) => {
      const code = normalize(item.codigo);
      const disease = normalize(item.enfermedad);
      return code.startsWith(term) || disease.includes(term);
    }).slice(0, 10);
  }, [diagnoses, query, selected]);

  const display = selected ? formatCie10(selected) : query;

  const handleChange = (event) => {
    setQuery(event.target.value);
    setOpen(true);
    if (selected) onSelect(null);
  };

  const pick = (item) => {
    setOpen(false);
    setQuery(formatCie10(item));
    onSelect(item);
  };

  return (
    <div className="autocomplete">
      <Input
        label={label}
        name={`${label}-cie10`}
        value={display}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        error={error}
        placeholder="Buscar por codigo o diagnostico"
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <div className="autocomplete-list diagnosis-list">
          {matches.map((item) => (
            <button type="button" key={`${item.codigo}-${item.enfermedad}`} onMouseDown={() => pick(item)}>
              <strong>{item.codigo}</strong>
              <span>{item.enfermedad}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
