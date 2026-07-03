export default function Card({ title, subtitle, children, action, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {(title || subtitle || action) && (
        <header className="card-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
