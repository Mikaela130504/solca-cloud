export default function Select({ label, error, options = [], id, className = "", includePlaceholder = true, ...props }) {
  const inputId = id || props.name;

  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <select id={inputId} className="field-control" {...props}>
        {includePlaceholder && <option value="">Seleccione...</option>}
        {options.map((option) => {
          const value = typeof option === "object" ? option.value : option;
          const label = typeof option === "object" ? option.label : option;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
