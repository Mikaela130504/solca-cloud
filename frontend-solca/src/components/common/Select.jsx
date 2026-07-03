export default function Select({ label, error, options = [], id, className = "", ...props }) {
  const inputId = id || props.name;

  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <select id={inputId} className="field-control" {...props}>
        <option value="">Seleccione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
