import { API_CONFIG, createApiClient } from "./api.js";

const api = createApiClient(API_CONFIG.laboratoryUrl);

export async function createLaboratoryOrder(order) {
  const { data } = await api.post("/laboratorios", order);
  return data;
}

export async function listLaboratoryResults(idPacienteRegional) {
  const path = idPacienteRegional ? `/laboratorios/paciente/${idPacienteRegional}` : "/laboratorios";
  const { data } = await api.get(path);
  return data;
}
