export default function Input({ label, error, hint, id, className = "", ...props }) {
  const inputId = id || props.name;

  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span className="field-label">{label}</span>
      {props.type === "textarea" ? (
        <textarea id={inputId} className="field-control field-textarea" {...props} />
      ) : (
        <input id={inputId} className="field-control" {...props} />
      )}
      {hint ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
