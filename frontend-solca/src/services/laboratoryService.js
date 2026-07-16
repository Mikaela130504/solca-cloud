import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.laboratoryUrl);

export async function createLaboratoryOrder(order) {
  const payload = {
    cedula: order.cedula,
    idPacienteRegional: order.idPacienteRegional,
    fecha: order.fecha,
    sede: order.sede,
    medico: order.medico,
    especialidad: order.especialidad,
    tipoConsulta: order.tipoConsulta,
    consultaId: order.consultaId,
    diagnostico: order.diagnostico || order.diagnosticoPresuntivo,
    tipoExamen: order.tipoExamen,
    resultado: order.resultado || order.resultados,
    observaciones: order.observaciones,
    estado: order.estado,
    prioridad: order.prioridad,
    tecnologoResponsable: order.tecnologoResponsable,
    valores: order.valores,
    unidad: order.unidad,
    valorReferencia: order.valorReferencia,
    interpretacion: order.interpretacion,
    codigoMuestra: order.codigoMuestra,
    resultadoCritico: order.resultadoCritico,
  };
  const { data } = await api.post("/laboratorios", payload);
  return data;
}

export async function listLaboratoryResults(idPacienteRegional) {
  const path = idPacienteRegional ? `/laboratorios/paciente/${idPacienteRegional}` : "/laboratorios";
  const { data } = await api.get(path);
  return data;
}

export async function listLaboratoryOrders(filters = {}) {
  const { data } = await api.get("/laboratorios", { params: filters });
  return data;
}

export async function updateLaboratoryState(id, estado) {
  const { data } = await api.put(`/laboratorios/${id}/estado/${estado}`);
  return data;
}

export async function saveLaboratoryResult(id, result) {
  const payload = {
    cedula: result.cedula || "0000000000",
    idPacienteRegional: result.idPacienteRegional,
    fecha: result.fecha,
    sede: result.sede,
    medico: result.medico,
    especialidad: result.especialidad,
    tipoConsulta: result.tipoConsulta,
    diagnostico: result.diagnostico,
    tipoExamen: result.tipoExamen,
    resultado: result.resultado,
    observaciones: result.observaciones,
    estado: result.estado,
    prioridad: result.prioridad,
    tecnologoResponsable: result.tecnologoResponsable,
    codigoMuestra: result.codigoMuestra,
    resultadoCritico: result.resultadoCritico,
    valores: result.valores,
    unidad: result.unidad,
    valorReferencia: result.valorReferencia,
    interpretacion: result.interpretacion,
    observacionesLaboratorio: result.observacionesLaboratorio,
    consultaId: result.consultaId,
  };
  const { data } = await api.put(`/laboratorios/${id}/resultado`, payload);
  return data;
}
