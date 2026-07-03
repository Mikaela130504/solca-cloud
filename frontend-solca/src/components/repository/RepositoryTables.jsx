import Card from "../common/Card.jsx";
import Table from "../common/Table.jsx";

export default function RepositoryTables({ consultations, laboratories, imaging }) {
  return (
    <div className="grid grid-3">
      <Card title="Consultas">
        <Table
          columns={[
            { key: "fecha", label: "Fecha" },
            { key: "especialidad", label: "Especialidad" },
            { key: "motivo", label: "Motivo" },
            { key: "medico", label: "Médico" },
          ]}
          rows={consultations}
        />
      </Card>
      <Card title="Laboratorios">
        <Table
          columns={[
            { key: "fecha", label: "Fecha" },
            { key: "tipoExamen", label: "Examen" },
            { key: "resultado", label: "Resultado" },
          ]}
          rows={laboratories}
        />
      </Card>
      <Card title="Imagenología">
        <Table
          columns={[
            { key: "fecha", label: "Fecha" },
            { key: "tipo", label: "Tipo" },
            { key: "resultado", label: "Resultado" },
          ]}
          rows={imaging}
        />
      </Card>
    </div>
  );
}
