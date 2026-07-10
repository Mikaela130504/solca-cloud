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
  };
  const { data } = await api.post("/laboratorios", payload);
  return data;
}

export async function listLaboratoryResults(idPacienteRegional) {
  const path = idPacienteRegional ? `/laboratorios/paciente/${idPacienteRegional}` : "/laboratorios";
  const { data } = await api.get(path);
  return data;
}
