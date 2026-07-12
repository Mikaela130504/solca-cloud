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
import { listConsultations } from "../../services/consultationService.js";
import { HOSPITAL_BRANCHES, PRIORIDADES, TIPOS_LABORATORIO } from "../../utils/constants.js";
import { toLocalDateInputValue } from "../../utils/helpers.js";
import { calculateIndicator, getParametersForExam } from "../../utils/laboratoryCatalog.js";
import { ROLES } from "../../utils/roles.js";
import { isNotFutureDate, required, rule } from "../../utils/validators.js";

const ESTADOS_LAB = ["PENDIENTE", "EN_PROCESO", "FINALIZADO"];

const initialValues = {
  idPacienteRegional: "",
  cedula: "",
  paciente: "",
  tipoExamen: "",
  prioridad: "",
  fecha: toLocalDateInputValue(),
  sede: "",
  medico: "",
  especialidad: "",
  diagnosticoPresuntivo: "",
  cie10: "",
  observaciones: "",
};

const resultInitial = {
  codigoMuestra: "",
  parameters: [],
  interpretacion: "",
  resultadoCritico: false,
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
  const normalized = normalizeStatus(status);
  return <span className={`status-badge status-${normalized.toLowerCase()}`}>{normalized}</span>;
}

function normalizeStatus(status) {
  return status === "VALIDADO" ? "FINALIZADO" : (status || "PENDIENTE");
}

function parseStoredParameters(value, exam) {
  const catalog = getParametersForExam(exam);
  try {
    const parsed = JSON.parse(value || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((item) => {
        const catalogParameter = catalog.find((parameter) => parameter.name === item.name) || {};
        const parameter = {
          ...catalogParameter,
          ...item,
          value: item.value ?? item.valor ?? item.resultado ?? "",
        };
        return {
          ...parameter,
          indicator: item.indicator || item.indicador || calculateIndicator(parameter.value, parameter),
        };
      });
    }
  } catch {
    // El registro anterior pudo guardar texto libre.
  }
  return catalog.map((parameter) => ({ ...parameter, value: "", indicator: "" }));
}

function buildLabInterpretation(parameters) {
  const withValues = parameters.filter((item) => item.value !== undefined && item.value !== null && String(item.value).trim() !== "");
  if (!withValues.length) return "";
  return withValues.some((item) => item.indicator && item.indicator !== "NORMAL")
    ? "Se encontraron parámetros fuera del rango de referencia."
    : "Resultados dentro de parámetros normales.";
}

function hasParameterValues(parameters) {
  return parameters.some((item) => item.value !== undefined && item.value !== null && String(item.value).trim() !== "");
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
    (!filters.estado || normalizeStatus(order.estado) === filters.estado) &&
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
      especialidad: location.state?.especialidad || current.especialidad,
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
    let hydratedOrder = order;
    if (!order.especialidad && order.consultaId) {
      try {
        const consultations = await listConsultations();
        const source = consultations.find((item) => Number(item.id) === Number(order.consultaId));
        if (source?.especialidad) hydratedOrder = { ...order, especialidad: source.especialidad };
      } catch {
        hydratedOrder = order;
      }
    }
    setActiveOrder(hydratedOrder);
    const parameters = parseStoredParameters(order.valores, order.tipoExamen);
    const withValues = hasParameterValues(parameters);
    setResult({
      codigoMuestra: hydratedOrder.codigoMuestra || `MUE-${String(hydratedOrder.id).padStart(6, "0")}`,
      parameters,
      interpretacion: withValues ? (hydratedOrder.interpretacion || buildLabInterpretation(parameters)) : "",
      resultadoCritico: Boolean(hydratedOrder.resultadoCritico),
      tecnologoResponsable: hydratedOrder.tecnologoResponsable || user?.name || user?.username || "",
      observaciones: hydratedOrder.observacionesLaboratorio || "",
    });
    if (canProcess && hydratedOrder.estado === "PENDIENTE") {
      await updateLaboratoryState(hydratedOrder.id, "EN_PROCESO");
      await loadOrders();
    }
  };

  const saveResult = async (event) => {
    event.preventDefault();
    if (!activeOrder || !canProcess) return;
    setSaving(true);
    try {
      const saved = await saveLaboratoryResult(activeOrder.id, {
        ...result,
        valores: JSON.stringify(result.parameters),
        resultado: result.parameters.map((item) => `${item.name}: ${item.value || "Sin valor"} ${item.unit} (${item.indicator || "Sin indicador"})`).join("; "),
        observacionesLaboratorio: result.observaciones,
        cedula: activeOrder.cedula,
        idPacienteRegional: activeOrder.idPacienteRegional,
        fecha: activeOrder.fecha,
        sede: activeOrder.sede,
      });
      setToast({ message: "Resultado guardado correctamente.", type: "success" });
      setActiveOrder(saved);
      setResult((current) => ({
        ...current,
        parameters: parseStoredParameters(saved.valores, saved.tipoExamen),
        interpretacion: saved.interpretacion || current.interpretacion,
        observaciones: saved.observacionesLaboratorio || current.observaciones,
      }));
      await loadOrders();
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible guardar el resultado."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateParameter = (index, value) => {
    setResult((current) => {
      const parameters = current.parameters.map((item, itemIndex) => (
        itemIndex === index ? { ...item, value, indicator: calculateIndicator(value, item) } : item
      ));
      return {
        ...current,
        parameters,
        interpretacion: buildLabInterpretation(parameters),
        resultadoCritico: parameters.some((item) => item.indicator === "ALTO" || item.indicator === "BAJO") && current.resultadoCritico,
      };
    });
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
                    <td>
                      <Button variant="secondary" onClick={() => selectOrder(order)}>
                        {canProcess ? (normalizeStatus(order.estado) !== "FINALIZADO" ? "Procesar" : "Editar resultado") : "Ver resultado"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredOrders.length && <p className="empty-state">No hay solicitudes con los filtros seleccionados.</p>}
          </div>
        )}
      </Card>

      {activeOrder && (
        <Card title="Resultado de Laboratorio">
          <div className="grid grid-3 form-section">
            <div className="readonly-box"><strong>Paciente</strong><br />{activeOrder.idPacienteRegional || activeOrder.cedula}</div>
            <div className="readonly-box"><strong>Examen solicitado</strong><br />{activeOrder.tipoExamen}</div>
            <div className="readonly-box"><strong>Estado</strong><br /><StatusBadge status={activeOrder.estado} /></div>
          </div>
          <div className="table-wrap form-section">
            <table className="data-table">
              <tbody>
                <tr><th>Médico solicitante</th><td>{activeOrder.medico || "No registrado"}</td></tr>
                <tr><th>Especialidad</th><td>{activeOrder.especialidad || "No registrada"}</td></tr>
                <tr><th>Tipo de solicitud</th><td>{activeOrder.tipoConsulta || "Solicitud de laboratorio"}</td></tr>
                <tr><th>Prioridad</th><td>{activeOrder.prioridad || "NORMAL"}</td></tr>
                <tr><th>Sede</th><td>{activeOrder.sede}</td></tr>
                <tr><th>Fecha solicitud</th><td>{activeOrder.fechaSolicitud ? String(activeOrder.fechaSolicitud).replace("T", " ").slice(0, 16) : activeOrder.fecha}</td></tr>
                <tr><th>Observaciones del médico</th><td>{activeOrder.observaciones || "Sin observaciones"}</td></tr>
              </tbody>
            </table>
          </div>
          <form onSubmit={saveResult}>
            <div className="grid grid-3 form-section">
              <Input label="Código único de muestra" name="codigoMuestra" value={result.codigoMuestra} onChange={(event) => setResult((current) => ({ ...current, codigoMuestra: event.target.value }))} readOnly={!canProcess} />
              <Input label="Tecnólogo responsable" name="tecnologoResponsable" value={result.tecnologoResponsable} onChange={(event) => setResult((current) => ({ ...current, tecnologoResponsable: event.target.value }))} readOnly={!canProcess} />
            </div>
            <div className="table-wrap form-section">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Parámetro</th>
                    <th>Valor obtenido</th>
                    <th>Unidad</th>
                    <th>Valor referencia</th>
                    <th>Indicador</th>
                  </tr>
                </thead>
                <tbody>
                  {result.parameters.map((parameter, index) => (
                    <tr key={parameter.name}>
                      <td>{parameter.name}</td>
                      <td>
                        <input className="table-input" value={parameter.value || ""} onChange={(event) => updateParameter(index, event.target.value)} disabled={!canProcess} />
                      </td>
                      <td>{parameter.unit}</td>
                      <td>{parameter.min}-{parameter.max}</td>
                      <td><span className={`status-badge ${parameter.indicator === "NORMAL" ? "status-finalizado" : parameter.indicator ? "status-pendiente" : ""}`}>{parameter.indicator || "Pendiente"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-3 form-section">
              <Select label="Resultado crítico" name="resultadoCritico" value={result.resultadoCritico ? "Sí" : "No"} onChange={(event) => setResult((current) => ({ ...current, resultadoCritico: event.target.value === "Sí" }))} options={["No", "Sí"]} disabled={!canProcess} />
              <Input label="Interpretación del laboratorista" name="interpretacion" value={result.interpretacion} onChange={(event) => setResult((current) => ({ ...current, interpretacion: event.target.value }))} readOnly={!canProcess} />
            </div>
            <Input label="Observaciones del laboratorista" type="textarea" name="observaciones" value={result.observaciones} onChange={(event) => setResult((current) => ({ ...current, observaciones: event.target.value }))} readOnly={!canProcess} />
            <div className="actions">
              <Button type="button" variant="ghost" onClick={() => setActiveOrder(null)}>Cerrar</Button>
              {canProcess && <Button type="submit" loading={saving}>{normalizeStatus(activeOrder.estado) === "FINALIZADO" ? "Guardar cambios" : "Guardar resultado"}</Button>}
            </div>
          </form>
        </Card>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
