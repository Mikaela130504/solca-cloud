import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Loader from "../../components/common/Loader.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import { getApiErrorMessage } from "../../services/api.js";
import { listConsultations } from "../../services/consultationService.js";
import { HOSPITAL_BRANCHES } from "../../utils/constants.js";

const TYPE_ALL = "TODOS";
const TYPE_HISTORY = "HISTORIA";
const TYPE_CONSULTATION = "CONSULTA";

function isClinicalHistory(record) {
  return String(record?.tipoConsulta || record?.tipo_consulta || "").toLowerCase().includes("historia");
}

function normalizeDate(value) {
  if (!value) return "Sin fecha";
  return String(value).replace("T", " ").slice(0, 16);
}

function patientText(record) {
  return [record.idPacienteRegional, record.cedula].filter(Boolean).join(" / ") || "Sin paciente";
}

function RecordDetail({ record }) {
  if (!record) {
    return (
      <Card title="Detalle clínico">
        <p className="empty-state">Seleccione una historia clínica o consulta para ver el resumen.</p>
      </Card>
    );
  }

  return (
    <Card title={isClinicalHistory(record) ? "Detalle de historia clínica" : "Detalle de consulta"} subtitle="Información clínica de solo lectura">
      <dl className="record-details">
        <div>
          <dt>Paciente</dt>
          <dd>{patientText(record)}</dd>
        </div>
        <div>
          <dt>Fecha</dt>
          <dd>{normalizeDate(record.fecha)}</dd>
        </div>
        <div>
          <dt>Sede</dt>
          <dd>{record.sede || "Sin registro"}</dd>
        </div>
        <div>
          <dt>Médico</dt>
          <dd>{record.medico || "Sin registro"}</dd>
        </div>
        <div>
          <dt>Especialidad</dt>
          <dd>{record.especialidad || "Sin registro"}</dd>
        </div>
        <div>
          <dt>Motivo</dt>
          <dd>{record.motivo || "Sin registro"}</dd>
        </div>
        <div>
          <dt>Enfermedad actual / evolución</dt>
          <dd>{record.evolucion || "Sin registro"}</dd>
        </div>
        <div>
          <dt>Diagnóstico</dt>
          <dd>{record.diagnostico || "Sin registro"}</dd>
        </div>
        <div>
          <dt>Tratamiento</dt>
          <dd>{record.tratamiento || "Sin registro"}</dd>
        </div>
        <div>
          <dt>Observaciones</dt>
          <dd>{record.observaciones || "Sin registro"}</dd>
        </div>
      </dl>
    </Card>
  );
}

export default function ClinicalRecords() {
  const [records, setRecords] = useState([]);
  const [activeRecord, setActiveRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [filters, setFilters] = useState({
    search: "",
    sede: "",
    type: TYPE_ALL,
    fecha: "",
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await listConsultations();
      const items = Array.isArray(data) ? data : [];
      setRecords(items);
      setActiveRecord((current) => current || items[0] || null);
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible cargar historias y consultas."), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    return records.filter((record) => {
      const recordType = isClinicalHistory(record) ? TYPE_HISTORY : TYPE_CONSULTATION;
      const haystack = [
        record.idPacienteRegional,
        record.cedula,
        record.medico,
        record.especialidad,
        record.diagnostico,
        record.motivo,
      ].filter(Boolean).join(" ").toLowerCase();

      return (!normalizedSearch || haystack.includes(normalizedSearch))
        && (!filters.sede || record.sede === filters.sede)
        && (filters.type === TYPE_ALL || filters.type === recordType)
        && (!filters.fecha || String(record.fecha || "").startsWith(filters.fecha));
    });
  }, [records, filters]);

  const summary = useMemo(() => ({
    historias: records.filter(isClinicalHistory).length,
    consultas: records.filter((record) => !isClinicalHistory(record)).length,
    total: records.length,
  }), [records]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", sede: "", type: TYPE_ALL, fecha: "" });
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>HCE y consultas</h1>
          <p>Tabla de historias clínicas y consultas registradas en el servicio de consulta clínica.</p>
        </div>
        <Button variant="secondary" onClick={loadRecords}>Actualizar</Button>
      </div>

      <div className="grid grid-3">
        <Card title="Historias clínicas">
          <strong className="metric-value">{summary.historias}</strong>
        </Card>
        <Card title="Consultas">
          <strong className="metric-value">{summary.consultas}</strong>
        </Card>
        <Card title="Total de registros">
          <strong className="metric-value">{summary.total}</strong>
        </Card>
      </div>

      <Card title="Filtros">
        <div className="grid grid-4 form-section">
          <Input label="Paciente, cédula o diagnóstico (opcional)" name="search" value={filters.search} onChange={updateFilter} />
          <Select label="Sede (opcional)" name="sede" value={filters.sede} onChange={updateFilter} options={HOSPITAL_BRANCHES} />
          <Select label="Tipo de registro" name="type" value={filters.type} onChange={updateFilter} options={[
            { value: TYPE_ALL, label: "Todos" },
            { value: TYPE_HISTORY, label: "Historia clínica" },
            { value: TYPE_CONSULTATION, label: "Consulta" },
          ]} />
          <Input label="Fecha (opcional)" type="date" name="fecha" value={filters.fecha} onChange={updateFilter} />
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={clearFilters}>Limpiar filtros</Button>
        </div>
      </Card>

      {loading ? <Loader /> : (
        <div className="grid grid-2">
          <Card title="Registros clínicos">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Paciente</th>
                    <th>Sede</th>
                    <th>Fecha</th>
                    <th>Médico</th>
                    <th>Especialidad</th>
                    <th>Diagnóstico</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id || index}>
                      <td><span className={`status-badge ${isClinicalHistory(record) ? "status-finalizado" : "status-en_proceso"}`}>{isClinicalHistory(record) ? "HCE" : "Consulta"}</span></td>
                      <td>{patientText(record)}</td>
                      <td>{record.sede || "Sin registro"}</td>
                      <td>{normalizeDate(record.fecha)}</td>
                      <td>{record.medico || "Sin registro"}</td>
                      <td>{record.especialidad || "Sin registro"}</td>
                      <td>{record.diagnostico || "Sin registro"}</td>
                      <td>
                        <Button variant="ghost" onClick={() => setActiveRecord(record)}>Ver</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredRecords.length && <p className="empty-state">No hay registros clínicos con los filtros seleccionados.</p>}
            </div>
          </Card>

          <RecordDetail record={activeRecord} />
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
