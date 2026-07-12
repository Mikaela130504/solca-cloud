import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Loader from "../../components/common/Loader.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import { getApiErrorMessage } from "../../services/api.js";
import { listAuditRecords } from "../../services/repositoryService.js";
import { ROLES } from "../../utils/roles.js";

const MODULES = ["auth", "pacientes", "consultas", "laboratorios", "imagenologia", "repositorio-clinico"];

export default function Audit() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [filters, setFilters] = useState({
    usuario: "",
    rol: "",
    paciente: "",
    fecha: "",
    modulo: "",
    accion: "",
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await listAuditRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible cargar la auditoría."), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filtered = useMemo(() => records.filter((item) => {
    const rol = String(item.rol || "").replaceAll("ROLE_", "");
    return (!filters.usuario || String(item.usuario || "").toLowerCase().includes(filters.usuario.toLowerCase()))
      && (!filters.rol || rol.includes(filters.rol))
      && (!filters.paciente || String(item.paciente || "").toLowerCase().includes(filters.paciente.toLowerCase()))
      && (!filters.fecha || String(item.fecha_hora || item.fechaHora || "").startsWith(filters.fecha))
      && (!filters.modulo || String(item.modulo || "").includes(filters.modulo))
      && (!filters.accion || String(item.accion || "").toLowerCase().includes(filters.accion.toLowerCase()));
  }), [records, filters]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ usuario: "", rol: "", paciente: "", fecha: "", modulo: "", accion: "" });
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Auditoría</h1>
          <p>Consulta administrativa de accesos, acciones, paciente, módulo, resultado e IP registrados automáticamente.</p>
        </div>
        <Button variant="secondary" onClick={loadRecords}>Actualizar</Button>
      </div>

      <Card title="Filtros de auditoría">
        <div className="grid grid-3 form-section">
          <Input label="Usuario (opcional)" name="usuario" value={filters.usuario} onChange={updateFilter} />
          <Select label="Rol (opcional)" name="rol" value={filters.rol} onChange={updateFilter} options={Object.values(ROLES)} />
          <Input label="Paciente (opcional)" name="paciente" value={filters.paciente} onChange={updateFilter} />
          <Input label="Fecha (opcional)" type="date" name="fecha" value={filters.fecha} onChange={updateFilter} />
          <Select label="Módulo (opcional)" name="modulo" value={filters.modulo} onChange={updateFilter} options={MODULES} />
          <Input label="Acción (opcional)" name="accion" value={filters.accion} onChange={updateFilter} />
        </div>
        <div className="actions">
          <Button type="button" variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>
        </div>
      </Card>

      <Card title="Registros de auditoría">
        {loading ? <Loader /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Microservicio</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th>Paciente</th>
                  <th>Resultado</th>
                  <th>IP</th>
                  <th>HTTP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <tr key={`${item.fecha_hora}-${index}`}>
                    <td>{String(item.fecha_hora || item.fechaHora || "").replace("T", " ").slice(0, 19)}</td>
                    <td>{item.usuario || "N/A"}</td>
                    <td>{String(item.rol || "N/A").replaceAll("ROLE_", "")}</td>
                    <td>{item.microservicio || "N/A"}</td>
                    <td>{item.modulo || "N/A"}</td>
                    <td>{item.accion || "N/A"}</td>
                    <td>{item.paciente || "N/A"}</td>
                    <td><span className={`status-badge ${item.resultado === "OK" ? "status-finalizado" : "status-pendiente"}`}>{item.resultado || "N/A"}</span></td>
                    <td>{item.ip || "N/A"}</td>
                    <td>{item.metodo_http || item.metodoHttp || ""} {item.estado_http || item.estadoHttp || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length && <p className="empty-state">No hay registros con los filtros seleccionados.</p>}
          </div>
        )}
      </Card>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
