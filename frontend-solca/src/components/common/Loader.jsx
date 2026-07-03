export default function Loader({ label = "Cargando información clínica" }) {
  return (
    <div className="loader" role="status">
      <span className="loader-ring" />
      <span>{label}</span>
    </div>
  );
}
