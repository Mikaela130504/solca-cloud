export default function SearchBar({ value, onChange, placeholder = "Buscar por cédula, nombres o historia clínica" }) {
  return (
    <div className="search-bar">
      <span aria-hidden="true">⌕</span>
      <input value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
