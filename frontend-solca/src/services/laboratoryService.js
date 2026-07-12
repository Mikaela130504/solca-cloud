import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.laboratoryUrl);

export async function createLaboratoryOrder(order) {
  const payload = {
    cedula: order.cedula,
    idPacienteRegional: order.idPacienteRegional,
    fecha: order.fecha,
    sede: order.sede,
    medico: order.medico,
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
  const { data } = await api.put(`/laboratorios/${id}/resultado`, {
    ...result,
    cedula: result.cedula || "0000000000",
    idPacienteRegional: result.idPacienteRegional,
    fecha: result.fecha,
    sede: result.sede,
    codigoMuestra: result.codigoMuestra,
    resultadoCritico: result.resultadoCritico,
    valores: result.valores,
    interpretacion: result.interpretacion,
  });
  return data;
}
