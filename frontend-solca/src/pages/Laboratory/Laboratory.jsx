import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import DiagnosisAutocomplete from "../../components/common/DiagnosisAutocomplete.jsx";
import Input from "../../components/common/Input.jsx";
import Loader from "../../components/common/Loader.jsx";
import PatientAutocomplete from "../../components/common/PatientAutocomplete.jsx";
import PatientIdentifiers from "../../components/common/PatientIdentifiers.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useAuth from "../../hooks/useAuth.js";
import useForm from "../../hooks/useForm.js";
import { getApiErrorMessage } from "../../services/api.js";
import { createLaboratoryOrder, listLaboratoryOrders, saveLaboratoryResult, updateLaboratoryState } from "../../services/laboratoryService.js";
import { HOSPITAL_BRANCHES, PRIORIDADES, TIPOS_LABORATORIO } from "../../utils/constants.js";
import { toLocalDateInputValue } from "../../utils/helpers.js";
import { ROLES } from "../../utils/roles.js";
import { isNotFutureDate, required, rule } from "../../utils/validators.js";

const ESTADOS_LAB = ["PENDIENTE", "EN_PROCESO", "FINALIZADO"];

const initialValues = {
  idPacienteRegional: "",
  cedula: "",
  paciente: "",
  tipoExamen: "",
  prioridad: "Normal",
  fecha: toLocalDateInputValue(),
  sede: "",
  medico: "",
  diagnosticoPresuntivo: "",
  cie10: "",
  observaciones: "",
};

const resultInitial = {
  resultado: "",
  valores: "",
  unidad: "",
  valorReferencia: "",
  interpretacion: "NORMAL",
  tecnologoResponsable: "",
  observaciones: "",
};

const rules = {
  idPacienteRegional: [rule(required, "Seleccione un paciente registrado.")],
  tipoExamen: [rule(required, "Seleccione el tipo de examen.")],
  fecha: [rule(required, "Ingrese fecha."), rule(isNotFutureDate, "La fecha debe ser válida.")],
  sede: [rule(required, "Seleccione la sede.")],
  medico: [rule(required, "El médico solicitante es obligatorio.")],
  diagnosticoPresuntivo: [rule(required, "Seleccione diagnóstico presuntivo CIE-10.")],
};

function StatusBadge({ status }) {
  return <span className={`status-badge status-${(status || "PENDIENTE").toLowerCase()}`}>{status || "PENDIENTE"}</span>;
}

export default function Laboratory() {
  const form = useForm(initialValues, rules);
  const { user } = useAuth();
  const location = useLocation();
  const canProcess = user?.role === ROLES.admin || user?.role === ROLES.laboratorio;
  const canRequest = user?.role === ROLES.admin || user?.role === ROLES.medico;
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [filters, setFilters] = useState({ estado: "", sede: "", paciente: "" });
  const [result, setResult] = useState(resultInitial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const filteredOrders = useMemo(() => orders.filter((order) => (
    (!filters.estado || order.estado === filters.estado) &&
    (!filters.sede || order.sede === filters.sede) &&
    (!filters.paciente || `${order.idPacienteRegional} ${order.cedula}`.toLowerCase().includes(filters.paciente.toLowerCase()))
  )), [orders, filters]);

  useEffect(() => {
    const patient = location.state?.patient;
    const stateDiagnosis = location.state?.diagnosis;
    setSelectedPatient(patient || null);
    setDiagnosis(stateDiagnosis || null);
    form.setValues((current) => ({
      ...current,
      idPacienteRegional: patient?.idPacienteRegional || current.idPacienteRegional,
      cedula: patient?.cedula || current.cedula,
      paciente: patient ? `${patient.idPacienteRegional} - ${patient.nombres} ${patient.apellidos}` : current.paciente,
      diagnosticoPresuntivo: stateDiagnosis?.enfermedad || current.diagnosticoPresuntivo,
      cie10: stateDiagnosis?.codigo || current.cie10,
      medico: location.state?.medico || user?.name || user?.username || current.medico,
      sede: location.state?.sede || current.sede,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await listLaboratoryOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible cargar laboratorio."), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    form.setValues((current) => ({
      ...current,
      idPacienteRegional: patient?.idPacienteRegional || "",
      cedula: patient?.cedula || "",
      paciente: patient ? `${patient.idPacienteRegional} - ${patient.nombres} ${patient.apellidos}` : "",
    }));
  };

  const handleDiagnosis = (item) => {
    setDiagnosis(item);
    form.setValues((current) => ({
      ...current,
      diagnosticoPresuntivo: item ? item.enfermedad : "",
      cie10: item ? item.codigo : "",
    }));
  };

  const createOrder = async (event) => {
    event.preventDefault();
    if (!canRequest || !form.validate()) return;
    setSaving(true);
    try {
      await createLaboratoryOrder({
        ...form.values,
        estado: "PENDIENTE",
        diagnostico: `${form.values.cie10} - ${form.values.diagnosticoPresuntivo}`,
      });
      setToast({ message: "Solicitud de laboratorio registrada como PENDIENTE.", type: "success" });
      form.reset();
      setSelectedPatient(null);
      setDiagnosis(null);
      await loadOrders();
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible registrar laboratorio."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const selectOrder = async (order) => {
    setActiveOrder(order);
    setResult({
      resultado: order.resultado || "",
      valores: order.valores || "",
      unidad: order.unidad || "",
      valorReferencia: order.valorReferencia || "",
      interpretacion: order.interpretacion || "NORMAL",
      tecnologoResponsable: order.tecnologoResponsable || user?.name || user?.username || "",
      observaciones: order.observaciones || "",
    });
    if (canProcess && order.estado === "PENDIENTE") {
      await updateLaboratoryState(order.id, "EN_PROCESO");
      await loadOrders();
    }
  };

  const saveResult = async (event) => {
    event.preventDefault();
    if (!activeOrder || !canProcess) return;
    setSaving(true);
    try {
      await saveLaboratoryResult(activeOrder.id, {
        ...result,
        cedula: activeOrder.cedula,
        idPacienteRegional: activeOrder.idPacienteRegional,
        fecha: activeOrder.fecha,
        sede: activeOrder.sede,
      });
      setToast({ message: "Resultado validado. Estado FINALIZADO.", type: "success" });
      setActiveOrder(null);
      setResult(resultInitial);
      await loadOrders();
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible guardar el resultado."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Laboratorio clínico</h1>
          <p>Solicitudes, procesamiento y resultados validados por paciente.</p>
        </div>
        <Button variant="secondary" onClick={loadOrders}>Actualizar</Button>
      </div>

      {canRequest && (
        <Card title="Nueva solicitud">
          <form onSubmit={createOrder} noValidate>
            <div className="grid grid-3 form-section">
              <PatientAutocomplete selectedPatient={selectedPatient} onSelect={handlePatientSelect} error={form.errors.idPacienteRegional} />
              <Input label="Paciente seleccionado" name="paciente" value={form.values.paciente} readOnly />
              <PatientIdentifiers patient={selectedPatient} />
              <Select label="Tipo de examen" name="tipoExamen" value={form.values.tipoExamen} onChange={form.handleChange} error={form.errors.tipoExamen} options={TIPOS_LABORATORIO} />
              <Select label="Prioridad" name="prioridad" value={form.values.prioridad} onChange={form.handleChange} options={PRIORIDADES} />
              <Input label="Fecha de solicitud" type="date" name="fecha" value={form.values.fecha} onChange={form.handleChange} error={form.errors.fecha} />
              <Select label="Sede" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
              <Input label="Médico solicitante" name="medico" value={form.values.medico} readOnly error={form.errors.medico} />
              <DiagnosisAutocomplete label="Diagnóstico presuntivo CIE-10" selected={diagnosis} onSelect={handleDiagnosis} error={form.errors.diagnosticoPresuntivo} />
            </div>
            <Input label="Observaciones de solicitud" type="textarea" name="observaciones" value={form.values.observaciones} onChange={form.handleChange} />
            <div className="actions">
              <Button type="submit" loading={saving}>Enviar solicitud</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Bandeja de laboratorio">
        <div className="grid grid-3 form-section">
          <Select label="Estado" name="estado" value={filters.estado} onChange={(event) => setFilters((current) => ({ ...current, estado: event.target.value }))} options={ESTADOS_LAB} />
          <Select label="Sede" name="sede" value={filters.sede} onChange={(event) => setFilters((current) => ({ ...current, sede: event.target.value }))} options={HOSPITAL_BRANCHES} />
          <Input label="Paciente o cédula" name="paciente" value={filters.paciente} onChange={(event) => setFilters((current) => ({ ...current, paciente: event.target.value }))} />
        </div>

        {loading ? <Loader /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Paciente</th>
                  <th>Examen</th>
                  <th>Prioridad</th>
                  <th>Sede</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td><StatusBadge status={order.estado} /></td>
                    <td>{order.idPacienteRegional || order.cedula}</td>
                    <td>{order.tipoExamen || "Examen"}</td>
                    <td>{order.prioridad || "NORMAL"}</td>
                    <td>{order.sede}</td>
                    <td>{order.fecha}</td>
                    <td><Button variant="secondary" onClick={() => selectOrder(order)}>{canProcess && order.estado !== "FINALIZADO" ? "Procesar" : "Ver"}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredOrders.length && <p className="empty-state">No hay solicitudes con los filtros seleccionados.</p>}
          </div>
        )}
      </Card>

      {activeOrder && (
        <Card title={`Detalle de laboratorio #${activeOrder.id}`}>
          <div className="grid grid-3 form-section">
            <div className="readonly-box"><strong>Paciente</strong><br />{activeOrder.idPacienteRegional || activeOrder.cedula}</div>
            <div className="readonly-box"><strong>Examen</strong><br />{activeOrder.tipoExamen}</div>
            <div className="readonly-box"><strong>Estado</strong><br /><StatusBadge status={activeOrder.estado} /></div>
          </div>
          <form onSubmit={saveResult}>
            <div className="grid grid-3 form-section">
              <Input label="Tecnólogo responsable" name="tecnologoResponsable" value={result.tecnologoResponsable} onChange={(event) => setResult((current) => ({ ...current, tecnologoResponsable: event.target.value }))} readOnly={!canProcess || activeOrder.estado === "FINALIZADO"} />
              <Input label="Valor obtenido" name="valores" value={result.valores} onChange={(event) => setResult((current) => ({ ...current, valores: event.target.value }))} readOnly={!canProcess || activeOrder.estado === "FINALIZADO"} />
              <Input label="Unidad" name="unidad" value={result.unidad} onChange={(event) => setResult((current) => ({ ...current, unidad: event.target.value }))} readOnly={!canProcess || activeOrder.estado === "FINALIZADO"} />
              <Input label="Valor de referencia" name="valorReferencia" value={result.valorReferencia} onChange={(event) => setResult((current) => ({ ...current, valorReferencia: event.target.value }))} readOnly={!canProcess || activeOrder.estado === "FINALIZADO"} />
              <Select label="Interpretación" name="interpretacion" value={result.interpretacion} onChange={(event) => setResult((current) => ({ ...current, interpretacion: event.target.value }))} options={["NORMAL", "ANORMAL", "CRITICO"]} />
              <Input label="Resultado" type="textarea" name="resultado" value={result.resultado} onChange={(event) => setResult((current) => ({ ...current, resultado: event.target.value }))} readOnly={!canProcess || activeOrder.estado === "FINALIZADO"} />
            </div>
            <Input label="Observaciones" type="textarea" name="observaciones" value={result.observaciones} onChange={(event) => setResult((current) => ({ ...current, observaciones: event.target.value }))} readOnly={!canProcess || activeOrder.estado === "FINALIZADO"} />
            <div className="actions">
              <Button type="button" variant="ghost" onClick={() => setActiveOrder(null)}>Cerrar</Button>
              {canProcess && activeOrder.estado !== "FINALIZADO" && <Button type="submit" loading={saving}>Validar resultado</Button>}
            </div>
          </form>
        </Card>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
