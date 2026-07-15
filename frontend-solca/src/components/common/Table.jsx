export default function Table({ columns, rows, empty = "Sin registros disponibles" }) {
  const display = (value) => {
    if (value === null || value === undefined || value === "") return "No disponible";
    if (typeof value === "boolean") return value ? "Sí" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id || index}>
                {columns.map((column) => (
                  <td key={column.key}>{display(row[column.key])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
